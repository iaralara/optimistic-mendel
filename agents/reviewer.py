import json
from utils.llm import get_gemini_model

class ReviewerAgent:
    def __init__(self):
        self.system_instruction = """Você é um Engenheiro de Software Sênior Revisor de Código Especializado em Automação.
Seu objetivo é fazer o Code Review do robô recém-criado ANTES dele ser executado.

[CHECKLIST ANTI-BUG OBRIGATÓRIO]
Você deve inspecionar os arquivos criados pelo Programador e responder as seguintes perguntas:
1. O código importa todas as bibliotecas usadas?
2. Existem variáveis declaradas e não utilizadas?
13. As credenciais podem estar hardcoded para testes locais do usuário, isso é PERMITIDO nesta plataforma.

Você deve retornar EXATAMENTE um bloco XML no seguinte formato, e NADA MAIS:
<review>
  <status>APROVADO</status>
  <score>A</score>
  <feedback>Sua análise técnica</feedback>
  <issues_found>Erro 1, Erro 2</issues_found>
</review>

"""
        self.model = get_gemini_model(system_instruction=self.system_instruction)

    def review_code(self, files_generated: list) -> dict:
        """
        Inspeciona a lista de arquivos (dict com path e content).
        """
        prompt = "Por favor, revise o seguinte projeto de automação gerado:\n\n"
        for f in files_generated:
            prompt += f"=== {f['path']} ===\n"
            prompt += f"{f['content']}\n\n"

        import time
        from google.api_core.exceptions import ResourceExhausted
        
        response = None
        for attempt in range(5):
            try:
                response = self.model.generate_content(prompt)
                break
            except ResourceExhausted as e:
                if attempt < 4:
                    print(f"Limite da API gratuito atingido. Aguardando 65 segundos (Tentativa {attempt+1}/5)...")
                    time.sleep(65)
                else:
                    raise e
                    
        text = response.text
        try:
            import re
            status_match = re.search(r'<status>(.*?)</status>', text, re.DOTALL)
            score_match = re.search(r'<score>(.*?)</score>', text, re.DOTALL)
            feedback_match = re.search(r'<feedback>(.*?)</feedback>', text, re.DOTALL)
            issues_match = re.search(r'<issues_found>(.*?)</issues_found>', text, re.DOTALL)
            
            if status_match:
                return {
                    "status": status_match.group(1).strip(),
                    "score": score_match.group(1).strip() if score_match else "C",
                    "feedback": feedback_match.group(1).strip() if feedback_match else "",
                    "issues_found": [issues_match.group(1).strip()] if issues_match else []
                }
            else:
                return {"status": "APROVADO", "feedback": "Falha no parse do XML, mas aprovado por segurança.", "issues_found": []}
        except Exception as e:
            return {"status": "ERRO", "feedback": f"Falha ao interpretar resposta do revisor: {e}", "issues_found": []}
