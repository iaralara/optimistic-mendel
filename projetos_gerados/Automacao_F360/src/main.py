import asyncio
from playwright.async_api import async_playwright
import logging
from datetime import datetime
import calendar
import os
import re
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(env_path)

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s')

# --- Mapeamento das Lojas e Contas (De/Para) ---
CONTAS_LOJAS = [
    {"conta": "Santander - 13002454-7", "empresa": "HAVAIANAS RECIFE (VF PE)"},
    {"conta": "CEF - 000578315467-5", "empresa": "HAVAIANAS PATOS SHOPPING (VF PE)"},
    {"conta": "CEF - 000578315477-2", "empresa": "ANACAPRI MANAIRA SHOPPING (ACJP)"},
    {"conta": "CEF - 000578315474-8", "empresa": "ANACAPRI MIDWAY MALL (ACN)"},
    {"conta": "CEF - 00578315473-0", "empresa": "ANACAPRI NATAL SHOPPING (ACNS)"}
]

PADRAO_DEPOSITO = re.compile(r'(dep.*dinheiro|dp\s*din.*atm)', re.IGNORECASE)

async def run_automation():
    logging.info("Iniciando Robô F360 - RPA Completo.")
    browser = None
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=False, slow_mo=300)
            page = await browser.new_page()

            url = "https://financas.f360.com.br/"
            logging.info(f"Acessando: {url}")
            await page.goto(url)
            await asyncio.sleep(5) # Substituindo networkidle

            # ==========================================
            # LOGIN
            # ==========================================
            email = os.getenv("Usuario") or os.getenv("F360_EMAIL")
            password = os.getenv("Senha") or os.getenv("F360_PASSWORD")
            
            await page.get_by_placeholder("Digite o e-mail").first.fill(email)
            await page.get_by_placeholder("Digite a senha").first.fill(password)
            await page.locator("button:has-text('login'), button:has-text('Entrar')").first.click()
            await asyncio.sleep(5)

            try:
                await page.locator("button:has-text('Continuar')").click(timeout=5000)
                await asyncio.sleep(3)
            except:
                pass

            # ==========================================
            # CONFIGURAÇÃO DE DATAS
            # ==========================================
            hoje = datetime.now()
            mes_atual = hoje.month
            ano_atual = hoje.year
            
            if mes_atual == 1:
                mes_anterior = 12
                ano_anterior = ano_atual - 1
            else:
                mes_anterior = mes_atual - 1
                ano_anterior = ano_atual
                
            dias_mes_anterior = calendar.monthrange(ano_anterior, mes_anterior)[1]
            dias_mes_atual = hoje.day
            
            meses_para_processar = [
                (mes_anterior, ano_anterior, dias_mes_anterior),
                (mes_atual, ano_atual, dias_mes_atual)
            ]

            # ==========================================
            # FASE 1: Extrair Depósitos
            # ==========================================
            depositos_extraidos = {} 
            
            for item in CONTAS_LOJAS:
                conta = item["conta"]
                depositos_extraidos[conta] = {}
                logging.info(f"== INICIANDO EXTRAÇÃO PARA A CONTA: {conta} ==")
                
                await page.get_by_role("link", name="Contas Movimento").first.click()
                await asyncio.sleep(4)
                
                # Clicar no Dropdown da Conta
                try:
                    await page.locator(".k-dropdown-wrap:visible").first.click(timeout=5000)
                except:
                    await page.evaluate("""() => {
                        let spans = Array.from(document.querySelectorAll('span.k-input'));
                        let visibleSpan = spans.find(s => s.offsetParent !== null && s.textContent.includes('Selecione'));
                        if(visibleSpan) visibleSpan.parentElement.click();
                    }""")
                    
                await asyncio.sleep(1)
                
                # Digitar a conta e Enter
                try:
                    await page.locator("input.k-textbox:visible").last.fill(conta, timeout=3000)
                    await page.keyboard.press("Enter")
                except:
                    await page.keyboard.type(conta)
                    await page.keyboard.press("Enter")
                    
                await asyncio.sleep(3) 

                for (mes, ano, ultimo_dia) in meses_para_processar:
                    logging.info(f"Processando mês: {mes:02d}/{ano}")
                    
                    # 1) Como o usuario pediu: clica no calendario (data inicial) e da enter.
                    # Procura na tela principal o input de data preenchido e muda para o dia 1 do mes.
                    try:
                        inputs = await page.locator("input:visible").all()
                        for inp in inputs:
                            val = await inp.input_value()
                            if val and re.match(r"\d{2}/\d{2}/\d{4}", val):
                                await inp.fill(f"01/{mes:02d}/{ano}")
                                await page.keyboard.press("Enter")
                                break
                    except:
                        pass
                    await asyncio.sleep(3)

                    # 2) Clica duplo no dia 1 para abrir a tela de Detalhes (Screenshot 3)
                    try:
                        logging.info("Abrindo o detalhe do dia 1...")
                        await page.locator("td").filter(has_text=re.compile(r"^\s*1\s*$")).first.dblclick(timeout=5000)
                        await asyncio.sleep(3)
                    except:
                        try:
                            # Se não achar o 1 exato, tenta outro dia visível
                            await page.locator("td[role='gridcell']").first.dblclick(timeout=3000)
                            await asyncio.sleep(3)
                        except:
                            pass

                    # 3) Agora estamos dentro do modal de detalhes, vamos iterar os dias
                    for dia in range(1, ultimo_dia + 1):
                        data_str = f"{dia:02d}/{mes:02d}/{ano}"
                        
                        mudou = False
                        try:
                            date_inputs = await page.locator("input:visible").all()
                            # Iterar de tras para frente para pegar o Extrato Bancario
                            for inp in reversed(date_inputs):
                                val = await inp.input_value()
                                if val and re.match(r"\d{2}/\d{2}/\d{4}", val):
                                    await inp.fill(data_str)
                                    mudou = True
                                    break
                        except Exception as e:
                            logging.error(f"Erro ao buscar input: {e}")
                            
                        if mudou:
                            await page.keyboard.press("Enter")
                            await asyncio.sleep(3.5) # Espera carregar os extratos do dia
                        else:
                            logging.warning(f"Não encontrou o campo de data para {data_str}")
                        
                        # Extrair valores
                        itens_extrato = await page.locator("div.extrato-item, div:has-text('Histórico'), div[title*='Histórico']").all()
                        
                        valores_do_dia = []
                        for item_extrato in itens_extrato:
                            texto = await item_extrato.inner_text()
                            if PADRAO_DEPOSITO.search(texto):
                                match_valor = re.search(r'R\$\s*([\d\.,]+)', texto)
                                if match_valor:
                                    val_str = match_valor.group(1).replace('.', '').replace(',', '.')
                                    valores_do_dia.append(float(val_str))
                        
                        if valores_do_dia:
                            depositos_extraidos[conta][data_str] = valores_do_dia
                            logging.info(f"*** Depósitos em {data_str}: {valores_do_dia} ***")
                    
                    # Tentar fechar o modal detalhado para voltar à tela principal antes do próximo mês
                    try:
                        await page.locator("button.close, button:has-text('Fechar'), button.btn-close").first.click(timeout=3000)
                        await asyncio.sleep(2)
                    except:
                        pass

            # ==========================================
            # FASE 2: Lançar no Fechamento de Caixa
            # ==========================================
            for item in CONTAS_LOJAS:
                conta = item["conta"]
                empresa = item["empresa"]
                datas_com_deposito = depositos_extraidos.get(conta, {})
                
                if not datas_com_deposito:
                    logging.info(f"Nenhum depósito para lançar na loja {empresa}.")
                    continue

                logging.info(f"== LANÇANDO DEPÓSITOS: {empresa} ==")
                
                await page.get_by_role("link", name="Fechamento de Caixa").first.click()
                await asyncio.sleep(4)

                # Selecionar Empresa
                try:
                    await page.locator(".k-dropdown-wrap:visible").first.click(timeout=5000)
                except:
                    await page.evaluate("""() => {
                        let spans = Array.from(document.querySelectorAll('span.k-input'));
                        let visibleSpan = spans.find(s => s.offsetParent !== null);
                        if(visibleSpan) visibleSpan.parentElement.click();
                    }""")

                await asyncio.sleep(1)
                try:
                    await page.locator("input.k-textbox:visible").last.fill(empresa, timeout=3000)
                    await page.keyboard.press("Enter")
                except:
                    await page.keyboard.type(empresa)
                    await page.keyboard.press("Enter")

                await asyncio.sleep(3)

                for (mes, ano, ultimo_dia) in meses_para_processar:
                    try:
                        mes_ano_str = f"{mes:02d}/{ano}"
                        inputs = await page.locator("input:visible").all()
                        for inp in inputs:
                            val = await inp.input_value()
                            if val and (re.match(r"\d{2}/\d{4}", val) or re.match(r"\d{2}/\d{2}/\d{4}", val)):
                                await inp.fill(mes_ano_str)
                                await page.keyboard.press("Enter")
                                break
                        await asyncio.sleep(3)
                    except:
                        pass 

                    dep_deste_mes = {d: v for d, v in datas_com_deposito.items() if d.endswith(f"{mes:02d}/{ano}")}

                    for dia_str, valores in dep_deste_mes.items():
                        dia_num = str(int(dia_str.split('/')[0]))
                        logging.info(f"Abrindo Fechamento do dia {dia_num}/{mes:02d}")
                        
                        try:
                            await page.locator(f"td:has-text(' {dia_num} '), td div:text-is('{dia_num}'), td:text-is('{dia_num}')").first.click(timeout=5000)
                        except:
                            await page.locator("td").filter(has_text=dia_num).first.click()

                        await asyncio.sleep(3)

                        try:
                            await page.get_by_text("Depósitos", exact=False).first.click(timeout=3000)
                        except:
                            pass
                        
                        for i, valor in enumerate(valores):
                            await page.get_by_text("+ Adicionar", exact=True).first.click()
                            
                            valor_br = f"{valor:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
                            await page.locator("input[name*='valor'], input[placeholder*='0,00']").first.fill(valor_br)
                            
                            try:
                                await page.locator("label:has-text('Conta de Destino')").locator("..").locator(".k-dropdown-wrap:visible").click(timeout=3000)
                            except:
                                await page.locator(".k-dropdown-wrap:visible").nth(1).click(force=True)

                            await asyncio.sleep(1)
                            try:
                                await page.locator("input.k-textbox:visible").last.fill(conta, timeout=3000)
                                await page.keyboard.press("Enter")
                            except:
                                await page.keyboard.type(conta)
                                await page.keyboard.press("Enter")

                            if i < len(valores) - 1:
                                await page.get_by_role("button", name="Salvar e criar novo").click()
                                logging.info(f"Valor {valor_br} salvo (e criando novo).")
                            else:
                                await page.get_by_role("button", name="Salvar").first.click()
                                logging.info(f"Valor {valor_br} salvo com sucesso.")
                            
                            await asyncio.sleep(2)

                        try:
                            await page.locator("button.close, button:has-text('Fechar'), button.btn-close").first.click(timeout=3000)
                            await asyncio.sleep(1.5)
                        except:
                            pass

            logging.info("Automação concluída 100% com Sucesso!")

    except Exception as e:
        logging.error(f"Ocorreu um erro durante a automação: {e}", exc_info=True)
        if browser:
            try:
                await page.screenshot(path="error_screenshot.png")
            except:
                pass
    finally:
        if browser:
            logging.info("Fechando o navegador.")
            await browser.close()

if __name__ == "__main__":
    asyncio.run(run_automation())