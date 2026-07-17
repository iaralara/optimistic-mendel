import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv(override=True)

def get_gemini_model(model_name=None, system_instruction=None):
    """
    Inicializa e retorna uma instância do modelo Gemini configurado.
    Faz a busca dinâmica dos modelos permitidos pela sua Chave de API.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key or api_key == "your_gemini_api_key_here":
        raise ValueError("Chave da API do Gemini não configurada no arquivo .env")
        
    genai.configure(api_key=api_key)
    
    # Buscar dinamicamente os modelos disponíveis na sua conta/versão
    available_models = []
    try:
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                available_models.append(m.name)
    except Exception as e:
        print(f"Erro ao listar modelos disponíveis: {e}")
        
    # Lógica de fallback: tenta o mais moderno, desce para o mais simples
    target_model = None
    
    preferred_order = [
        "models/gemini-2.5-flash",
        "models/gemini-2.5-pro",
        "models/gemini-2.0-flash",
        "models/gemini-flash-latest",
        "models/gemini-pro-latest",
        "models/gemini-3.5-flash",
        "models/gemini-3.1-pro-preview",
        "models/gemini-1.5-pro-latest",
        "models/gemini-1.5-pro",
        "models/gemini-1.5-flash",
        "models/gemini-pro"
    ]
    
    for pref in preferred_order:
        if pref in available_models or pref.replace("models/", "") in available_models:
            target_model = pref
            break
            
    # Se nenhum da lista preferencial existir, pega o primeiro modelo da lista que gera conteúdo
    if target_model is None and available_models:
        target_model = available_models[0]
    elif target_model is None:
        target_model = "models/gemini-pro" # Fallback final absoluto
            
    # Se o usuário passou um nome específico e ele está disponível, usa ele
    if model_name and (model_name in available_models or f"models/{model_name}" in available_models):
        target_model = model_name
        
    print(f"[*] Usando o modelo Gemini: {target_model}")
    
    kwargs = {}
    if system_instruction:
        kwargs["system_instruction"] = system_instruction
        
    model = genai.GenerativeModel(model_name=target_model, **kwargs)
    return model

def upload_to_gemini(path, mime_type=None):
    """Uploads the given file to Gemini."""
    file = genai.upload_file(path, mime_type=mime_type)
    return file
