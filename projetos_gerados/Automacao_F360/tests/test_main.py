import pytest
import asyncio
from playwright.async_api import async_playwright
import logging

# Configure logging for tests as well
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s')

@pytest.fixture(scope="module")
async def browser():
    """
    Fixture para iniciar e fechar o navegador uma vez por módulo de teste.
    """
    logging.info("Configurando o navegador para testes.")
    pw = await async_playwright().start()
    # Usar headless=True para testes, a menos que seja necessário depurar visualmente
    browser_instance = await pw.chromium.launch(headless=True) 
    yield browser_instance
    await browser_instance.close()
    await pw.stop()
    logging.info("Navegador fechado após testes.")

@pytest.mark.asyncio
async def test_initial_page_load(browser):
    """
    Testa se a página inicial do F360 carrega corretamente.
    """
    logging.info("Iniciando teste: carregamento da página inicial.")
    page = await browser.new_page()
    url = "https://financas.f360.com.br/"
    try:
        await page.goto(url, wait_until="networkidle")
        assert "financas.f360.com.br" in page.url
        # Verifica se o campo de email ou login está presente para confirmar o carregamento
        assert await page.is_visible("input[type='email']") or await page.is_visible("button:has-text('Login')")
        logging.info("Teste de carregamento da página inicial BEM SUCEDIDO.")
    except Exception as e:
        logging.error(f"Teste de carregamento da página inicial FALHOU: {e}", exc_info=True)
        pytest.fail(f"Falha ao carregar a página inicial: {e}")
    finally:
        await page.close()

# Você pode adicionar mais testes aqui para partes específicas da funcionalidade
# No entanto, testes end-to-end completos (como login e navegação completa)
# são mais complexos e podem exigir mocks ou um ambiente de teste dedicado.
# Este teste foca na conectividade e no carregamento inicial.