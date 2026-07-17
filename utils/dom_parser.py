import os
from playwright.sync_api import sync_playwright
import json

def get_page_elements(url: str) -> list:
    """
    Abre a página em background usando Playwright,
    e injeta JavaScript para extrair todos os elementos interativos
    (inputs, botões, selects, a) junto com seus XPaths aproximados.
    """
    elements_data = []
    
    script = """
    () => {
        function getPathTo(element) {
            if (element.id !== '')
                return 'id("' + element.id + '")';
            if (element === document.body)
                return element.tagName;

            var ix = 0;
            var siblings = element.parentNode.childNodes;
            for (var i = 0; i < siblings.length; i++) {
                var sibling = siblings[i];
                if (sibling === element)
                    return getPathTo(element.parentNode) + '/' + element.tagName + '[' + (ix + 1) + ']';
                if (sibling.nodeType === 1 && sibling.tagName === element.tagName)
                    ix++;
            }
        }
        
        const interactables = document.querySelectorAll('input, button, select, textarea, a');
        const data = [];
        interactables.forEach((el) => {
            const rect = el.getBoundingClientRect();
            if(rect.width > 0 && rect.height > 0) { // Apenas visíveis
                data.push({
            try {
                const rect = el.getBoundingClientRect();
                if(rect.width > 0 && rect.height > 0) { // Apenas visíveis
                    data.push({
                        tag: el.tagName.toLowerCase(),
                        type: el.type || '',
                        name: el.name || '',
                        id: el.id || '',
                        text: el.innerText.trim() || el.value || '',
                        xpath: getPathTo(el)
                    });
                }
            } catch (e) {}
        });
        return data;
    }
    """
    
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto(url, wait_until="domcontentloaded", timeout=15000)
            page.wait_for_timeout(4000) # Dá tempo pro JS renderizar a tela
            
            elements_data = page.evaluate(script)
            
            browser.close()
            return elements_data
    except Exception as e:
        print(f"Erro ao capturar DOM: {e}")
        return []

if __name__ == "__main__":
    import sys
    import json
    if len(sys.argv) > 1:
        url = sys.argv[1]
        print(json.dumps(get_page_elements(url)))
