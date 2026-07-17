import os
from playwright.sync_api import sync_playwright

def analyze_url_visual(url: str, output_path: str = "screenshot.png") -> dict:
    """
    Navega até a URL especificada e extrai uma screenshot da página,
    além do título e do texto visível básico.
    """
    result = {
        "title": "",
        "text_content": "",
        "screenshot_path": output_path,
        "error": None
    }
    
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": 1280, "height": 800})
            page.goto(url, wait_until="domcontentloaded", timeout=15000)
            page.wait_for_timeout(4000)
            
            result["title"] = page.title()
            
            # Pega o texto do body inteiro pra dar algum contexto semântico
            body_text = page.locator("body").inner_text()
            # Limita a quantidade de texto pra n estourar tokens caso não usemos vision
            result["text_content"] = body_text[:5000] 
            
            # Tira o screenshot da tela inteira visível ou full_page
            page.screenshot(path=output_path, full_page=True)
            browser.close()
    except Exception as e:
        result["error"] = str(e)
        
    return result
