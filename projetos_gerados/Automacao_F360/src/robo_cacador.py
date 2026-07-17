import re
import os
import time
import logging
import urllib.request
import sys
from datetime import datetime, timedelta
from dotenv import load_dotenv

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from webdriver_manager.chrome import ChromeDriverManager

# ==========================================
# CONFIGURACAO DE LOGS E SEGURANÇA
# ==========================================
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('robo_cacador.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def verificar_permissao_diretoria(nome_robo):
    url_csv = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR6-7k7FbSyacy2L0R602h3D4jqzbwHBFb6q3KW8Hg0zLwHiJ7JcUZzZcKET5O2glOolUeI3Gn-9dAS/pub?output=csv"
    logger.info("==================================================")
    logger.info(f"📡 Consultando a Central da Diretoria: {nome_robo}...")
    try:
        resposta = urllib.request.urlopen(url_csv, timeout=10)
        linhas = resposta.read().decode('utf-8').splitlines()
        for linha in linhas:
            colunas = linha.split(',')
            if len(colunas) >= 2:
                nome_na_planilha = colunas[0].strip().upper()
                status = colunas[1].strip().upper()
                if nome_na_planilha == nome_robo.upper():
                    if status == "ATIVO":
                        logger.info("✅ Permissão concedida! Iniciando os motores...\n")
                        return True
                    else:
                        logger.error("\n❌ ACESSO NEGADO! ❌")
                        logger.error(f"O robô '{nome_robo}' foi DESATIVADO pela Diretoria.")
                        time.sleep(5); sys.exit() 
        logger.warning(f"\n⚠️ Segurança: Robô '{nome_robo}' não encontrado na planilha. Ignorando trava local...")
        return True
    except Exception as e:
        logger.warning("\n⚠️ ERRO DE SEGURANÇA INTERNA - Pulando validação por falha de rede.")
        return True

# ==========================================
# 1. CONFIGURAÇÕES INICIAIS E COFRE
# ==========================================
env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(env_path)

USUARIO = os.getenv("USUARIO") or os.getenv("F360_EMAIL")
SENHA = os.getenv("SENHA") or os.getenv("F360_PASSWORD")     

if not USUARIO or not SENHA:
    logger.error("❌ Erro: Credenciais não encontradas no arquivo .env")
    sys.exit()

MODO_VARREDURA_MESES = 2 

TAREFAS = [
    {"loja": "HAVAIANAS RECIFE (VF PE)", "banco": "Santander - 13002454-7"},
    {"loja": "ANACAPRI MANAIRA SHOPPING (ACJP)", "banco": "CEF - 000578315477-2"},
    {"loja": "ANACAPRI MIDWAY MALL (ACN)", "banco": "CEF - 000578315474-8"},
    {"loja": "ANACAPRI NATAL SHOPPING (ACNS)", "banco": "CEF - 00578315473-0"},
    {"loja": "HAVAIANAS GUEDES SHOPPING (VF PE)", "banco": "CEF - 000578315467-5"},
    {"loja": "HAVAIANAS PATOS SHOPPING (VF PE)", "banco": "CEF - 000578315467-5"}
]

class RoboFinanceiroCacador:
    def __init__(self):
        self.driver = None
        self.wait = None
        self.acoes = None

    def gerar_lista_meses_alvo(self):
        hoje = datetime.now()
        meses_para_varrer = []
        if MODO_VARREDURA_MESES == 1:
            for mes in range(1, hoje.month + 1):
                dias_no_mes = (hoje.replace(month=mes % 12 + 1, day=1) - timedelta(days=1)).day if mes < 12 else 31
                dias_fim = dias_no_mes if mes != hoje.month else hoje.day
                meses_para_varrer.append({"mes_ano": f"{mes:02d}/{hoje.year}", "dias_fim": dias_fim})
        else:
            primeiro_dia_mes_atual = hoje.replace(day=1)
            ultimo_dia_mes_passado = primeiro_dia_mes_atual - timedelta(days=1)
            meses_para_varrer.append({"mes_ano": ultimo_dia_mes_passado.strftime("%m/%Y"), "dias_fim": ultimo_dia_mes_passado.day})
            meses_para_varrer.append({"mes_ano": hoje.strftime("%m/%Y"), "dias_fim": hoje.day})
        return meses_para_varrer

    def inicializar_driver(self):
        os.system("taskkill /f /im chromedriver.exe /T >nul 2>&1")
        try:
            options = Options()
            options.add_argument("--start-maximized")
            options.add_argument("--disable-notifications")
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=options)
            self.wait = WebDriverWait(self.driver, 20)
            self.acoes = ActionChains(self.driver)
            logger.info("✅ Navegador iniciado!")
            return True
        except Exception as e:
            logger.error(f"Erro ao inicializar: {e}")
            return False

    def limpar_propagandas_f360(self):
        self.driver.execute_script("""
            document.querySelectorAll('#f360-campanha-modal-standard, .f360-campanha-modal-standard, .img-banner-h, .sweetalert, #intercom-container').forEach(e => e.remove());
            document.body.classList.remove('modal-open');
            document.querySelectorAll('.sweetalert button, .modal button').forEach(b => { if((b.innerText || '').includes('OK')) b.click(); });
        """)

    def fazer_login(self):
        try:
            logger.info("🔑 Acessando F360...")
            self.driver.get("https://financas.f360.com.br/")
            
            # Correção do Bug de Múltiplos Campos Escondidos (Kendo UI Strict Mode)
            ipt_email = self.wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "input[type='email'], input[placeholder*='e-mail']")))
            ipt_senha = self.wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "input[type='password'], input[placeholder*='senha']")))
            
            ipt_email.clear()
            ipt_email.send_keys(USUARIO)
            ipt_senha.clear()
            ipt_senha.send_keys(SENHA)
            ipt_senha.send_keys(Keys.ENTER)

            try:
                btn_cont = WebDriverWait(self.driver, 5).until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Continuar')]")))
                btn_cont.click()
            except: pass
            
            time.sleep(8) 
            return True
        except Exception as e:
            logger.error(f"Erro no login: {e}")
            return False

    def injetar_clique_humano(self, elemento, duplo=False):
        script = """
            var el = arguments[0]; var duplo = arguments[1];
            if(!el) return;
            el.scrollIntoView({block: 'center', behavior: 'instant'});
            var rect = el.getBoundingClientRect();
            var cx = rect.left + (rect.width / 2); var cy = rect.top + (rect.height / 2);
            var opts = {bubbles: true, cancelable: true, view: window, clientX: cx, clientY: cy, buttons: 1};
            el.dispatchEvent(new MouseEvent('mouseover', opts));
            el.dispatchEvent(new MouseEvent('mousedown', opts));
            el.dispatchEvent(new MouseEvent('mouseup', opts));
            el.dispatchEvent(new MouseEvent('click', opts));
            if (duplo) {
                setTimeout(function() {
                    el.dispatchEvent(new MouseEvent('dblclick', Object.assign({}, opts, {detail: 2})));
                }, 100);
            }
        """
        self.driver.execute_script(script, elemento, duplo)

    def extrair_dados_do_banco(self, banco_alvo):
        depositos_por_dia = {}
        try:
            logger.info(f"\n======================================")
            logger.info(f"🏦 FASE 1: LENDO EXTRATO BANCÁRIO")
            logger.info(f"Banco: {banco_alvo}")
            
            self.driver.get("https://financas.f360.com.br/ContasMovimento")
            time.sleep(8)
            self.limpar_propagandas_f360()
            
            # CORREÇÃO FASE 1: Melhor Seleção do Componente Kendo Dropdown
            clicou_conta = self.driver.execute_script("""
                var wraps = document.querySelectorAll('.k-dropdown-wrap, .k-combobox');
                for(var i=0; i<wraps.length; i++) {
                    if(wraps[i].offsetParent !== null) {
                        wraps[i].click(); 
                        return true;
                    }
                } return false;
            """)
            
            time.sleep(1.5)
            if clicou_conta:
                # Digitar a conta na caixa de busca do kendo que acabou de abrir
                ipt_busca = self.driver.execute_script("""
                    var ipts = document.querySelectorAll('input.k-textbox');
                    for(var i=0; i<ipts.length; i++) {
                        if(ipts[i].offsetParent !== null) return ipts[i];
                    } 
                    // Fallback: se for combobox, o input de busca é o próprio k-input visível
                    var vis = document.querySelectorAll('input.k-input');
                    for(var i=0; i<vis.length; i++) {
                        if(vis[i].offsetParent !== null && !vis[i].readOnly) return vis[i];
                    }
                    return null;
                """)
                
                if ipt_busca:
                    conta_numero = banco_alvo.split('-', 1)[1].strip()
                    logger.info(f" -> Digitando conta: {conta_numero}")
                    ipt_busca.send_keys(Keys.CONTROL + 'a')
                    ipt_busca.send_keys(Keys.BACKSPACE)
                    time.sleep(0.5)
                    ipt_busca.send_keys(conta_numero)
                    time.sleep(2)
                    clicou_item = self.driver.execute_script(f"""
                        var listas = document.querySelectorAll('.k-list-container, .k-animation-container');
                        for(var i=0; i<listas.length; i++) {{
                            if(listas[i].style.display !== 'none') {{
                                var itens = listas[i].querySelectorAll('li');
                                for(var j=0; j<itens.length; j++) {{
                                    if((itens[j].innerText || '').includes('{conta_numero}')) {{
                                        itens[j].click();
                                        return true;
                                    }}
                                }}
                            }}
                        }}
                        return false;
                    """)
                    if not clicou_item:
                        ipt_busca.send_keys(Keys.ENTER)
                else:
                    logger.warning("Não encontrou caixa de busca do Kendo, enviando chaves direto...")
                    conta_numero = banco_alvo.split('-', 1)[1].strip()
                    ActionChains(self.driver).send_keys(conta_numero).pause(2).send_keys(Keys.ENTER).perform()
            else:
                logger.error("Falha ao abrir dropdown de Contas.")
                return {}

            time.sleep(4)

            meses_para_varrer = self.gerar_lista_meses_alvo()

            for mes_info in meses_para_varrer:
                mes_alvo = mes_info["mes_ano"]
                dias_fim = mes_info["dias_fim"]
                
                logger.info(f" -> 📅 Processando mês: {mes_alvo}")
                
                # Digitar "01/MM/YYYY" na tela principal para navegar para o mês
                self.driver.execute_script(f"""
                    var cals = document.querySelectorAll('input[data-role="datepicker"], input.hasDatepicker, input.datepicker-calendar');
                    for(var i=0; i<cals.length; i++){{
                        if(cals[i].offsetParent !== null) {{
                            var kDate = window.$(cals[i]).data('kendoDatePicker');
                            var partes = '{mes_alvo}'.split('/');
                            var d = new Date(parseInt(partes[1]), parseInt(partes[0])-1, 1);
                            if(kDate) {{ 
                                kDate.value(d); 
                                kDate.trigger('change'); 
                            }} else {{ 
                                cals[i].value = '01/{mes_alvo}'; 
                                cals[i].dispatchEvent(new Event('change', {{ bubbles: true }})); 
                            }}
                            break;
                        }}
                    }}
                """)
                time.sleep(1)
                ActionChains(self.driver).send_keys(Keys.ENTER).perform()
                time.sleep(6) # Esperar a tabela recarregar com os dados da conta
                
                # Clicar duplo no dia 1 para abrir a tela Detalhada (que é onde o Extrato Bancário existe de verdade)
                abriu_detalhe = self.driver.execute_script("""
                    var tds = document.querySelectorAll("td.fc-day-top, td[role='gridcell']");
                    for(var i=0; i<tds.length; i++) {
                        if(tds[i].offsetParent !== null && (tds[i].innerText || '').trim().split('\\n')[0] === '1') {
                            var rect = tds[i].getBoundingClientRect();
                            var cx = rect.left + (rect.width / 2); var cy = rect.top + (rect.height / 2);
                            var opts = {bubbles: true, cancelable: true, view: window, clientX: cx, clientY: cy, buttons: 1};
                            tds[i].dispatchEvent(new MouseEvent('mousedown', opts));
                            tds[i].dispatchEvent(new MouseEvent('mouseup', opts));
                            tds[i].dispatchEvent(new MouseEvent('click', opts));
                            setTimeout(() => { tds[i].dispatchEvent(new MouseEvent('dblclick', Object.assign({}, opts, {detail: 2}))); }, 100);
                            return true;
                        }
                    } return false;
                """)
                time.sleep(4)
                
                if not abriu_detalhe:
                    logger.warning("Não conseguiu dar duplo clique no dia 1. Pulando mês...")
                    continue

                for dia in range(1, dias_fim + 1):
                    dia_str = str(dia)
                    data_pt = f"{dia:02d}/{mes_alvo}"
                    
                    # Alterar a data no input detalhado da aba Extrato Bancário (Lado Direito)
                    mudou_data = self.driver.execute_script(f"""
                        var inputs = document.querySelectorAll("input");
                        var dates = [];
                        for(var i=0; i<inputs.length; i++) {{
                            if(inputs[i].offsetParent !== null && inputs[i].value && inputs[i].value.match(/\\d{{2}}\\/\\d{{2}}\\/\\d{{4}}/)) {{
                                dates.push(inputs[i]);
                            }}
                        }}
                        if(dates.length > 0) {{
                            var target = dates[dates.length - 1]; // O último costuma ser o Extrato Bancário
                            target.value = '{data_pt}';
                            target.dispatchEvent(new Event('change', {{ bubbles: true }}));
                            target.dispatchEvent(new Event('input', {{ bubbles: true }}));
                            return true;
                        }} return false;
                    """)
                    
                    if mudou_data:
                        ActionChains(self.driver).send_keys(Keys.ENTER).perform()
                        time.sleep(3.5) # Esperar a tabela recarregar
                    
                    # Capturar itens
                    texto_tela = self.driver.execute_script("""
                        var blocos = document.querySelectorAll('.extrato-item, div[title*="Histórico"]');
                        var result = "";
                        blocos.forEach(b => { if(b.offsetParent !== null) result += (b.innerText || '') + "\\n"; });
                        return result;
                    """)
                    
                    if texto_tela:
                        for linha in texto_tela.split('\n'):
                            linha_up = linha.strip().upper()
                            # REGEX MAIS ROBUSTO
                            eh_deposito = bool(re.search(r'(DEP.*DINHEIRO|DP\s*DIN.*ATM)', linha_up)) or (any(t in linha_up for t in ['DEP DIN', 'ESPECIE']) and 'R$' in linha_up)
                            
                            if eh_deposito:
                                match_valor = re.search(r"R\$\s*([\d\.,]+)", linha_up)
                                if match_valor:
                                    valor_str = match_valor.group(1).replace('.', '').replace(',', '.')
                                    if data_pt not in depositos_por_dia: depositos_por_dia[data_pt] = []
                                    if float(valor_str) not in depositos_por_dia[data_pt]:
                                        depositos_por_dia[data_pt].append(float(valor_str))
                                        logger.info(f"   💸 [ACHOU] R$ {valor_str} em {data_pt}")

                # Fechar Modal
                self.driver.execute_script("""
                    document.querySelectorAll('button.close, .btn-close').forEach(b => {
                        if(b.offsetParent !== null) b.click();
                    });
                """)
                time.sleep(2)

            total_itens = sum(len(v) for v in depositos_por_dia.values())
            logger.info(f"📊 Fim da leitura. {total_itens} depósitos encontrados.")
            return depositos_por_dia
        except Exception as e:
            logger.error(f"❌ Erro na extração: {e}")
            return {}

    def processar_loja_no_fechamento(self, loja_alvo, banco_alvo, depositos_por_dia):
        logger.info(f"\n======================================")
        logger.info(f"🛒 FASE 2: LANÇANDO NA LOJA")
        logger.info(f"Loja: {loja_alvo}")

        datas_ordenadas = sorted(depositos_por_dia.keys(), key=lambda d: datetime.strptime(d, "%d/%m/%Y"))

        for data_pt in datas_ordenadas:
            valores_do_dia = depositos_por_dia[data_pt]
            dia_alvo = data_pt.split('/')[0].lstrip('0')
            mes_ano_alvo = data_pt[3:]

            for valor in valores_do_dia:
                logger.info(f" -> Lançando R$ {valor} no dia {data_pt}...")
                
                try:
                    # CORREÇÃO FASE 2: Evitar reload desnecessario se ja estiver na pagina correta
                    # Porem recarregar se der falha garante estado limpo
                    self.driver.get("https://financas.f360.com.br/FechamentoDeCaixa")
                    time.sleep(8) 
                    
                    self.limpar_propagandas_f360()
                    
                    # SELECIONAR A LOJA
                    clicou_loja = self.driver.execute_script("""
                        var wraps = document.querySelectorAll('.k-dropdown-wrap, .k-combobox');
                        for(var i=0; i<wraps.length; i++) {
                            if(wraps[i].offsetParent !== null) {
                                wraps[i].click(); return true;
                            }
                        } return false;
                    """)
                    time.sleep(1.5)
                    if clicou_loja:
                        ipt_busca = self.driver.execute_script("""
                            var ipts = document.querySelectorAll('input.k-textbox');
                            for(var i=0; i<ipts.length; i++) {
                                if(ipts[i].offsetParent !== null) return ipts[i];
                            } 
                            var vis = document.querySelectorAll('input.k-input');
                            for(var i=0; i<vis.length; i++) {
                                if(vis[i].offsetParent !== null && !vis[i].readOnly) return vis[i];
                            }
                            return null;
                        """)
                        if ipt_busca:
                            ipt_busca.send_keys(Keys.CONTROL + 'a')
                            ipt_busca.send_keys(Keys.BACKSPACE)
                            time.sleep(0.5)
                            ipt_busca.send_keys(loja_alvo)
                            time.sleep(1) 
                            ipt_busca.send_keys(Keys.ENTER)
                    
                    time.sleep(3)

                    # AJUSTE DE MÊS NO FECHAMENTO
                    self.driver.execute_script(f"""
                        var inputs = document.querySelectorAll('input');
                        for(var i=0; i<inputs.length; i++){{
                            if(inputs[i].offsetParent !== null && inputs[i].value && (inputs[i].value.match(/\\d{{2}}\\/\\d{{4}}/) || inputs[i].value.match(/\\d{{2}}\\/\\d{{2}}\\/\\d{{4}}/))) {{
                                inputs[i].value = '{mes_ano_alvo}';
                                inputs[i].dispatchEvent(new Event('change', {{ bubbles: true }}));
                                break;
                            }}
                        }}
                    """)
                    time.sleep(1)
                    ActionChains(self.driver).send_keys(Keys.ENTER).perform()
                    time.sleep(4)
                    
                    # ABRIR GAVETA DO DIA
                    logger.info(f"    -> Procurando o dia {dia_alvo} no calendário...")
                    abriu_dia = self.driver.execute_script(f"""
                        var tds = document.querySelectorAll("td[role='gridcell']");
                        for(var i=0; i<tds.length; i++) {{
                            if(tds[i].offsetParent !== null && (tds[i].innerText || '').trim().split('\\n')[0] === '{dia_alvo}') {{
                                tds[i].click();
                                return true;
                            }}
                        }} return false;
                    """)
                    time.sleep(4)
                    
                    if not abriu_dia:
                        logger.error(f"Não conseguiu clicar no dia {dia_alvo}")
                        continue
                        
                    # Expandir Depósitos se necessario
                    self.driver.execute_script("""
                        var p = document.querySelectorAll('div, span');
                        for(var i=0; i<p.length; i++) {
                            if(p[i].innerText && p[i].innerText.includes('Depósitos') && p[i].offsetParent !== null) {
                                if(p[i].classList.contains('collapsed')) { p[i].click(); }
                            }
                        }
                    """)
                    time.sleep(1.5)

                    # Clicar Adicionar
                    clicou_add = self.driver.execute_script("""
                        var spans = document.querySelectorAll('span, a, button');
                        for (var i = 0; i < spans.length; i++) {
                            if ((spans[i].innerText || '').trim() === '+ Adicionar' && spans[i].offsetParent !== null) {
                                spans[i].click(); return true;
                            }
                        } return false;
                    """)
                    time.sleep(3)
                    
                    if not clicou_add:
                        logger.error("Botão + Adicionar não encontrado")
                        continue

                    # DIGITAR VALOR
                    valor_formatado = f"{valor:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
                    logger.info(f"    -> Digitando o valor R$ {valor_formatado} ...")
                    self.driver.execute_script(f"""
                        var inputs = document.querySelectorAll('input');
                        for(var i=0; i<inputs.length; i++) {{
                            if(inputs[i].offsetParent !== null && (inputs[i].placeholder === '0,00' || inputs[i].name.includes('valor'))) {{
                                inputs[i].focus();
                                inputs[i].value = '{valor_formatado}';
                                inputs[i].dispatchEvent(new Event('input', {{ bubbles: true }}));
                                inputs[i].dispatchEvent(new Event('change', {{ bubbles: true }}));
                            }}
                        }}
                    """)
                    # O Kendo exige o evento via keypress as vezes, fallback visual
                    try:
                        ipt_valor = self.driver.find_element(By.XPATH, "//input[contains(@name, 'valor') or contains(@placeholder, '0,00')]")
                        ipt_valor.send_keys(Keys.SPACE)
                        ipt_valor.send_keys(Keys.BACKSPACE)
                    except: pass
                    
                    time.sleep(1)

                    # SELECIONAR BANCO DE DESTINO
                    clicou_destino = self.driver.execute_script("""
                        var labels = document.querySelectorAll('label');
                        for(var i=0; i<labels.length; i++) {
                            if(labels[i].innerText.includes('Conta de Destino') && labels[i].offsetParent !== null) {
                                var drop = labels[i].parentElement.querySelector('.k-dropdown-wrap, .k-dropdown');
                                if(drop) { drop.click(); return true; }
                            }
                        }
                        // Fallback genérico para o ultimo dropdown visível no modal
                        var drops = document.querySelectorAll('.k-dropdown-wrap');
                        if(drops.length > 0) {
                            drops[drops.length-1].click(); return true;
                        }
                        return false;
                    """)
                    time.sleep(1.5)
                    
                    if clicou_destino:
                        ipt_busca = self.driver.execute_script("""
                            var ipts = document.querySelectorAll('input.k-textbox');
                            for(var i=0; i<ipts.length; i++) {
                                if(ipts[i].offsetParent !== null) return ipts[i];
                            } return null;
                        """)
                        if ipt_busca:
                            conta_numero = banco_alvo.split('-', 1)[1].strip()
                            ipt_busca.send_keys(conta_numero)
                            time.sleep(1)
                            ipt_busca.send_keys(Keys.ENTER)
                    time.sleep(2)

                    # SALVAR
                    logger.info("    -> Salvando o depósito...")
                    salvou = self.driver.execute_script("""
                        var btns = document.querySelectorAll('button');
                        for(var i=0; i<btns.length; i++) {
                            if((btns[i].innerText || '').trim() === 'Salvar' && btns[i].offsetParent !== null) {
                                btns[i].click(); return true;
                            }
                        } return false;
                    """)
                    time.sleep(4) 
                    
                    alerta_vermelho = self.driver.execute_script("""
                        var texto = document.body.innerText || '';
                        if (texto.includes('Ocorreu um erro em sua operação') || texto.includes('Obrigatório')) {
                            var btns = document.querySelectorAll('button, a');
                            for(var b=0; b<btns.length; b++) {
                                if((btns[b].innerText || '').includes('OK')) {
                                    btns[b].click();
                                }
                            }
                            return true;
                        }
                        return false;
                    """)
                    
                    if alerta_vermelho:
                        logger.error("Servidor do F360 travou ao tentar salvar (Erro Vermelho/Conta Inválida).")
                        continue
                        
                    logger.info(f"    ✅ SUCESSO! R$ {valor} salvo.")
                    
                    # FECHAR MODAL
                    self.driver.execute_script("""
                        document.querySelectorAll('button.close, .btn-close').forEach(b => {
                            if(b.offsetParent !== null) b.click();
                        });
                    """)
                    time.sleep(2)

                except Exception as e:
                    logger.error(f"    ❌ Erro no fechamento: {e}")

    def executar(self):
        logger.info("\n==================================================")
        logger.info("🕵️♀️ ROBÔ CAÇADOR INICIADO")
        logger.info("==================================================")
        try:
            if not self.inicializar_driver(): return False
            if not self.fazer_login(): return False
            
            for tarefa in TAREFAS:
                loja_alvo = tarefa['loja']
                banco_alvo = tarefa['banco']
                
                depositos_por_dia = self.extrair_dados_do_banco(banco_alvo)
                if not depositos_por_dia:
                    logger.info(f"⏩ Pulando loja {loja_alvo} (Sem novos depósitos).")
                    continue
                
                self.processar_loja_no_fechamento(loja_alvo, banco_alvo, depositos_por_dia)
                
            logger.info("\n🏁 PROCESSO TOTALMENTE FINALIZADO!")
            return True
        except Exception as e:
            logger.error(f"[ERRO GERAL] Falha no robô: {e}")
            return False
        finally:
            if self.driver: 
                time.sleep(5)
                self.driver.quit()

if __name__ == "__main__":
    verificar_permissao_diretoria("Santander") 
    robo = RoboFinanceiroCacador()
    robo.executar()
