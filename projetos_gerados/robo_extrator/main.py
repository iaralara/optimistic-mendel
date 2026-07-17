import sys
import os
import time
import logging
from datetime import datetime
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

# Configuração de logs para exibição em tempo real e auditoria do robô
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - [%(levelname)s] - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('execucao_f360.log', mode='w', encoding='utf-8')
    ]
)
logger = logging.getLogger(__name__)

# Credenciais e constantes
URL_F360 = "https://financas.f360.com.br/"
EMAIL = "grupovffinanceiro4@gmail.com"
SENHA = os.environ.get("SENHA_F360", "SUA_SENHA_AQUI")
CONTA_ALVO = "Santander - 13002454-7"
FILIAL_ALVO = "HAVAIANAS RECIFE (VF PE)"
DESCRICAO_BUSCA = "Dep Dinheiro, Dinheiro"

def salvar_screenshot_erro(page, nome_acao):
    """Salva um screenshot em caso de falha para depuração visual."""
    try:
        nome_arquivo = f"erro_{nome_acao}_{int(time.time())}.png"
        page.screenshot(path=nome_arquivo, full_page=True)
        logger.warning(f"[DEBUG] Screenshot de erro salvo como: {nome_arquivo}")
    except Exception as e:
        logger.error(f"Não foi possível tirar screenshot do erro: {e}")

def main():
    logger.info("Iniciando o robô de conciliação do F360 Finanças...")
    
    with sync_playwright() as p:
        # Iniciamos em modo visível para que o usuário veja a automação trabalhar
        logger.info("Inicializando o navegador Chromium (Visível)...")
        browser = p.chromium.launch(headless=False, args=["--start-maximized"])
        context = browser.new_context(viewport=None) # herda resolução máxima
        page = context.new_page()
        
        try:
            # Passo 1: Acessar URL
            logger.info(f"Acessando o portal F360: {URL_F360}")
            page.goto(URL_F360, wait_until="networkidle")
            
            # Passo 2: Login
            logger.info("Preenchendo credenciais de login...")
            
            # Localizar e preencher usuário (com seletores resilientes)
            input_email = page.locator('input[type="email"], input[placeholder*="E-mail"], input[name="email"], #email').first
            input_email.wait_for(state="visible", timeout=15000)
            input_email.fill(EMAIL)
            
            # Localizar e preencher senha
            input_senha = page.locator('input[type="password"], input[placeholder*="Senha"], input[name="password"], #password').first
            input_senha.fill(SENHA)
            
            # Clicar no botão de Login
            btn_login = page.locator('button:has-text("Login"), button:has-text("Entrar"), input[type="submit"], button[type="submit"]').first
            btn_login.click()
            logger.info("Dados de acesso enviados. Aguardando processamento...")
            
            # Passo 3: Clicar em Continuar
            try:
                # Muitas vezes há uma tela intermediária com termos ou seleção de filial, ou botão Continuar
                btn_continuar = page.locator('button:has-text("Continuar"), a:has-text("Continuar"), :text-matches("^Continuar$")').first
                btn_continuar.wait_for(state="visible", timeout=10000)
                btn_continuar.click()
                logger.info("Botão 'Continuar' clicado com sucesso.")
            except PlaywrightTimeoutError:
                logger.info("Botão 'Continuar' não apareceu ou foi ignorado automaticamente.")

            # Passo 4: Fechar eventuais popups/propagandas com a tecla Escape
            page.wait_for_timeout(3000) # Pequena pausa para garantir carregamento de popups de propaganda
            logger.info("Enviando comando 'Escape' para fechar possíveis popups de anúncios...")
            page.keyboard.press("Escape")
            
            # Passo 5: Navegar e clicar em 'Conta Movimento'
            logger.info("Navegando para 'Conta Movimento'...")
            menu_conta_movimento = page.locator('text="Conta Movimento", a:has-text("Conta Movimento"), div:has-text("Conta Movimento")').first
            menu_conta_movimento.wait_for(state="visible", timeout=10000)
            menu_conta_movimento.click()
            page.wait_for_load_state("networkidle")
            
            # Passo 6: Digitar conta 'Santander - 13002454-7'
            logger.info(f"Preenchendo o filtro de conta com: '{CONTA_ALVO}'")
            # Seletor genérico para input de busca de contas ou dropdown
            input_conta = page.locator('input[placeholder*="Conta"], input[placeholder*="Selecione"], div[class*="select"] input').first
            input_conta.wait_for(state="visible", timeout=10000)
            input_conta.click()
            input_conta.fill(CONTA_ALVO)
            page.wait_for_timeout(1500) # Tempo para filtrar a lista suspensa
            
            # Selecionar item correspondente na lista suspensa e pressionar Enter
            opcao_conta = page.locator(f'li:has-text("{CONTA_ALVO}"), div:has-text("{CONTA_ALVO}"), [role="option"]:has-text("{CONTA_ALVO}")').first
            if opcao_conta.is_visible():
                opcao_conta.click()
            else:
                page.keyboard.press("ArrowDown")
                page.keyboard.press("Enter")
            
            # Passo 7: Clicar no calendário, selecionar o primeiro dia do mês corrente
            logger.info("Configurando calendário para o primeiro dia do mês corrente...")
            hoje = datetime.now()
            primeiro_dia_mes = hoje.replace(day=1).strftime("%d/%m/%Y")
            
            # Clicar no input do calendário
            input_calendario = page.locator('input[placeholder*="Data"], input[class*="datepicker"], .datepicker-input').first
            input_calendario.click()
            input_calendario.fill(primeiro_dia_mes)
            page.keyboard.press("Enter")
            
            # Confirmar seleção/filtragem (se houver botão de aplicar filtro)
            btn_filtrar = page.locator('button:has-text("Filtrar"), button:has-text("Buscar"), button:has-text("OK")').first
            if btn_filtrar.is_visible():
                btn_filtrar.click()
                
            page.wait_for_timeout(3000) # Espera carregar os dados da tabela
            
            # Passo 8 & 9: Varrer a tabela buscando 'Dep Dinheiro, Dinheiro' e extrair valores
            logger.info(f"Procurando por registros de descrição: '{DESCRICAO_BUSCA}'...")
            valores_extraidos = []
            
            # Identificar linhas de tabela
            linhas = page.locator('table tbody tr, .tr-class, div[role="row"]').all()
            logger.info(f"Total de linhas identificadas na tabela: {len(linhas)}")
            
            for i, linha in enumerate(linhas):
                texto_linha = linha.text_content()
                if DESCRICAO_BUSCA.lower() in texto_linha.lower():
                    # Tentar achar o valor correspondente na linha (geralmente formato R$ XX,XX ou coluna de Valor)
                    # Vamos procurar por padrões numéricos com vírgula ou pegar células específicas
                    celulas = linha.locator('td, div[role="gridcell"]').all()
                    valor_texto = ""
                    
                    # Geralmente o valor fica nas últimas colunas da tabela
                    # Vamos varrer as células para encontrar um formato monetário válido
                    for celula in reversed(celulas):
                        txt_cel = celula.text_content().strip()
                        if any(char.isdigit() for char in txt_cel) and (',' in txt_cel or '.' in txt_cel):
                            valor_texto = txt_cel
                            break
                    
                    if valor_texto:
                        logger.info(f"Registro encontrado na linha {i+1}: '{DESCRICAO_BUSCA}' - Valor extraído: {valor_texto}")
                        valores_extraidos.append(valor_texto)
                    else:
                        logger.warning(f"Registro '{DESCRICAO_BUSCA}' encontrado na linha {i+1}, mas não foi possível extrair o valor.")
            
            logger.info(f"Processo de extração finalizado. Total de valores encontrados: {len(valores_extraidos)}")
            
            # Passo 10: Fechar a tela de 'Conta Movimento'
            logger.info("Fechando tela de Conta Movimento ou voltando ao menu...")
            
            # Passo 11: Navegar para 'Fechamento de Caixa'
            logger.info("Navegando para 'Fechamento de Caixa'...")
            menu_fechamento = page.locator('text="Fechamento de Caixa", a:has-text("Fechamento de Caixa"), div:has-text("Fechamento de Caixa")').first
            menu_fechamento.wait_for(state="visible", timeout=10000)
            menu_fechamento.click()
            page.wait_for_load_state("networkidle")
            
            # Passo 12: Selecionar a filial 'HAVAIANAS RECIFE (VF PE)'
            logger.info(f"Selecionando a filial '{FILIAL_ALVO}'...")
            input_filial = page.locator('input[placeholder*="Empresa"], input[placeholder*="Filial"], div[class*="select-empresa"] input').first
            input_filial.wait_for(state="visible", timeout=10000)
            input_filial.click()
            input_filial.fill(FILIAL_ALVO)
            page.wait_for_timeout(1500)
            
            opcao_filial = page.locator(f'li:has-text("{FILIAL_ALVO}"), div:has-text("{FILIAL_ALVO}"), [role="option"]:has-text("{FILIAL_ALVO}")').first
            if opcao_filial.is_visible():
                opcao_filial.click()
            else:
                page.keyboard.press("ArrowDown")
                page.keyboard.press("Enter")
                
            # Passo 13: Selecionar no calendário o mesmo dia em que os valores foram localizados (Primeiro dia do mês)
            logger.info(f"Definindo a data de fechamento para: {primeiro_dia_mes}")
            input_cal_fechamento = page.locator('input[placeholder*="Data"], input[class*="datepicker"], .fechamento-datepicker').first
            input_cal_fechamento.click()
            input_cal_fechamento.fill(primeiro_dia_mes)
            page.keyboard.press("Enter")
            page.wait_for_timeout(2000)
            
            # Passo 14: Localizar a seção 'Depósito' e clicar em 'Adicionar'
            logger.info("Localizando seção 'Depósito' para adicionar lançamentos...")
            secao_deposito = page.locator('div:has-text("Depósito"), fieldset:has-text("Depósito"), .section-deposito').first
            secao_deposito.scroll_into_view_if_needed()
            
            btn_adicionar = secao_deposito.locator('button:has-text("Adicionar"), .btn-adicionar, [title*="Adicionar"]').first
            if not btn_adicionar.is_visible():
                # Fallback caso não seja filho direto da seção
                btn_adicionar = page.locator('button:has-text("Adicionar Depósito"), button:has-text("Adicionar")').first
                
            btn_adicionar.click()
            page.wait_for_timeout(1500)
            
            # Passo 15: Iterar sobre a lista de valores extraídos
            total_valores = len(valores_extraidos)
            if total_valores == 0:
                logger.warning("Nenhum depósito correspondente foi extraído para ser lançado.")
            else:
                for index, valor in enumerate(valores_extraidos):
                    logger.info(f"Iniciando lançamento {index + 1} de {total_valores}: {valor}")
                    
                    # a. Digitar o valor do depósito extraído
                    input_valor_deposito = page.locator('input[placeholder*="Valor"], input[name*="valor"], input[class*="money"]').first
                    input_valor_deposito.wait_for(state="visible", timeout=5000)
                    input_valor_deposito.click()
                    # Limpar campo antes de preencher
                    page.keyboard.press("Control+A")
                    page.keyboard.press("Backspace")
                    input_valor_deposito.fill(valor)
                    
                    # b. No campo de conta, digitar 'Santander - 13002454-7', selecionar e Enter
                    input_conta_deposito = page.locator('input[placeholder*="Conta"], div[class*="conta"] input').first
                    input_conta_deposito.click()
                    input_conta_deposito.fill(CONTA_ALVO)
                    page.wait_for_timeout(1500)
                    
                    opcao_conta_dep = page.locator(f'li:has-text("{CONTA_ALVO}"), [role="option"]:has-text("{CONTA_ALVO}")').first
                    if opcao_conta_dep.is_visible():
                        opcao_conta_dep.click()
                    else:
                        page.keyboard.press("ArrowDown")
                        page.keyboard.press("Enter")
                    
                    # Verificações de salvamento de fluxo
                    e_ultimo = (index == total_valores - 1)
                    
                    if not e_ultimo:
                        # c. Se houver mais valores pendentes, clicar em 'Salvar e criar novo'
                        logger.info("Clicando em 'Salvar e criar novo' para a próxima inserção.")
                        btn_salvar_novo = page.locator('button:has-text("Salvar e criar novo"), button:has-text("Salvar e Novo")').first
                        btn_salvar_novo.click()
                        page.wait_for_timeout(2000)
                    else:
                        # d. Se for o último valor da lista, clicar em 'Salvar'
                        logger.info("Clicando em 'Salvar' para concluir os lançamentos.")
                        btn_salvar = page.locator('button:has-text("Salvar"), button:has-text("Confirmar"), button[type="submit"]').first
                        btn_salvar.click()
                        page.wait_for_timeout(3000)
            
            logger.info("Robô executou todos os passos da rotina de conciliação com sucesso!")
            
        except Exception as e:
            logger.error(f"Ocorreu um erro crítico durante a execução: {e}", exc_info=True)
            if 'page' in locals():
                salvar_screenshot_erro(page, "falha_execucao")
        finally:
            # Passo 16: Fechar o navegador de forma segura e concluir
            logger.info("Fechando o navegador de forma segura...")
            browser.close()
            logger.info("Execução do robô concluída com êxito.")

if __name__ == "__main__":
    main()
