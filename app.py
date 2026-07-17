import streamlit as st
import os
import json
import pandas as pd
from dotenv import load_dotenv

# Carregar variáveis antes de importar os agentes (forçando sobrescrita para pegar a chave nova)
load_dotenv(override=True)

try:
    from agents.analyst import AnalystAgent
    from agents.programmer import ProgrammerAgent
    from agents.tester import TesterAgent
    from agents.devops import DevOpsAgent
    from utils.file_manager import setup_project_dir
    from utils.dom_parser import get_page_elements
except ImportError as e:
    st.error(f"Erro ao carregar os módulos. Verifique as dependências: {e}")

st.set_page_config(page_title="Fábrica de Robôs - RPA Studio", page_icon="🤖", layout="wide")

# Injeção de CSS Premium
st.markdown("""
<style>
    /* Fundo escuro premium */
    .stApp {
        background-color: #0f172a;
        color: #f8fafc;
    }
    
    /* Estilo das Abas */
    button[data-baseweb="tab"] {
        background-color: transparent !important;
        border-radius: 8px 8px 0px 0px;
        color: #94a3b8 !important;
    }
    button[data-baseweb="tab"][aria-selected="true"] {
        color: #38bdf8 !important;
        border-bottom: 2px solid #38bdf8 !important;
        background-color: #1e293b !important;
    }
    
    /* Botões principais */
    .stButton > button {
        background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%);
        color: white !important;
        border: none !important;
        border-radius: 8px;
        padding: 0.5rem 1rem;
        font-weight: 600;
        transition: all 0.3s ease;
    }
    .stButton > button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
    }
    
    /* Inputs de texto e chat */
    .stTextInput > div > div > input, .stChatInput > div {
        background-color: #1e293b;
        color: #f8fafc;
        border: 1px solid #334155;
        border-radius: 8px;
    }
    .stTextInput > div > div > input:focus, .stChatInput > div:focus-within {
        border-color: #38bdf8;
        box-shadow: 0 0 0 1px #38bdf8;
    }
    
    /* Caixas de mensagem do chat */
    .stChatMessage {
        background-color: #1e293b;
        border-radius: 12px;
        padding: 1rem;
        margin-bottom: 1rem;
        border: 1px solid #334155;
    }
    
    /* Sidebar */
    [data-testid="stSidebar"] {
        background-color: #1e293b;
        border-right: 1px solid #334155;
    }
</style>
""", unsafe_allow_html=True)

st.title("🤖 Fábrica de Robôs - RPA Studio Web")

# --- ESTADO GLOBAL ---
if "messages" not in st.session_state:
    st.session_state.messages = []
if "analyst" not in st.session_state:
    try:
        st.session_state.analyst = AnalystAgent()
    except Exception as e:
        st.error(f"Erro ao inicializar LLM: {e}")
if "spec_ready" not in st.session_state:
    st.session_state.spec_ready = False
if "spec_data" not in st.session_state:
    st.session_state.spec_data = None
if "dom_elements" not in st.session_state:
    st.session_state.dom_elements = []
if "selected_packages" not in st.session_state:
    st.session_state.selected_packages = ["playwright"]

# --- SIDEBAR ---
with st.sidebar:
    st.header("⚙️ Configurações do Projeto")
    base_dir = st.text_input("Diretório Base", value=os.path.abspath("./projetos_gerados"))
    project_name = st.text_input("Nome do Robô", value="robo_extrator")
    
    st.markdown("---")
    st.markdown("### Status do Projeto")
    st.info(f"Pacotes Selecionados: {len(st.session_state.selected_packages)}")
    st.info(f"Elementos Mapeados: {len(st.session_state.dom_elements)}")

# --- ABAS PRINCIPAIS ---
tab1, tab2, tab3 = st.tabs(["🤖 Agente IA", "🌐 Seletor Web (Inspetor)", "📦 Pacotes (Bibliotecas)"])

with tab2:
    st.header("Seletor de Elementos Web")
    st.markdown("Semelhante ao inspetor do RPA Desktop, extraia os XPaths de um site.")
    url_to_inspect = st.text_input("Digite a URL para inspecionar:")
    
    if st.button("Buscar Elementos"):
        with st.spinner("Abrindo site no Playwright e buscando inputs/botões..."):
            elements = get_page_elements(url_to_inspect)
            st.session_state.dom_elements = elements
            st.success(f"{len(elements)} elementos interativos encontrados!")
            
    if st.session_state.dom_elements:
        df = pd.DataFrame(st.session_state.dom_elements)
        st.dataframe(df, use_container_width=True)
        st.info("💡 Esses XPaths agora estão na memória do Agente. Diga a ele qual usar no Chat!")

with tab3:
    st.header("Gerenciador de Pacotes Python")
    st.markdown("Selecione quais bibliotecas seu robô vai precisar:")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.subheader("Web & Automação")
        pkg_playwright = st.checkbox("playwright (Recomendado)", value=True)
        pkg_selenium = st.checkbox("selenium")
        pkg_pyautogui = st.checkbox("pyautogui (Desktop)")
        pkg_requests = st.checkbox("requests")
        
    with col2:
        st.subheader("Dados & Arquivos")
        pkg_pandas = st.checkbox("pandas")
        pkg_openpyxl = st.checkbox("openpyxl (Excel)")
        pkg_pdfplumber = st.checkbox("pdfplumber (PDF)")
        
    with col3:
        st.subheader("Outros")
        pkg_dotenv = st.checkbox("python-dotenv")
        pkg_bs4 = st.checkbox("beautifulsoup4")
        
    if st.button("Atualizar Lista de Pacotes"):
        selected = []
        if pkg_playwright: selected.append("playwright")
        if pkg_selenium: selected.append("selenium")
        if pkg_pyautogui: selected.append("pyautogui")
        if pkg_requests: selected.append("requests")
        if pkg_pandas: selected.append("pandas")
        if pkg_openpyxl: selected.append("openpyxl")
        if pkg_pdfplumber: selected.append("pdfplumber")
        if pkg_dotenv: selected.append("python-dotenv")
        if pkg_bs4: selected.append("beautifulsoup4")
        
        st.session_state.selected_packages = selected
        st.success(f"Pacotes atualizados: {', '.join(selected)}")

with tab1:
    st.header("Chat com o Engenheiro Autônomo")
    
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])
            
    if not st.session_state.spec_ready:
        prompt = st.chat_input("Ex: Preencha o login usando os XPaths que acabamos de mapear.")
        
        if prompt:
            # Anexa os elementos e pacotes ao prompt (oculto) se for a primeira mensagem ou relevante
            contexto_extra = f"\n[Contexto Oculto: O usuário selecionou os pacotes: {st.session_state.selected_packages}. "
            if st.session_state.dom_elements:
                # Filtrar e formatar para o LLM não se perder
                clean_elements = []
                for el in st.session_state.dom_elements:
                    if el['tag'] in ['input', 'button', 'select'] or el['text']:
                        clean_elements.append(f"[{el['tag']}] id='{el.get('id','')}' name='{el.get('name','')}' type='{el.get('type','')}' text='{el.get('text','')}': {el.get('xpath','')}")
                
                contexto_extra += f"O usuário mapeou a página. Use ESSES XPaths exatos para construir a automação e não invente seletores. Lista completa de elementos: {json.dumps(clean_elements[:100])}...]"
            else:
                contexto_extra += "]"
                
            full_prompt = prompt + contexto_extra
            
            st.session_state.messages.append({"role": "user", "content": prompt})
            with st.chat_message("user"):
                st.markdown(prompt)
                
            with st.chat_message("assistant"):
                with st.spinner("Processando..."):
                    result = st.session_state.analyst.interact(full_prompt)
                    response_text = result["response"]
                    
                    display_text = response_text
                    if "```json" in response_text and result["is_complete"]:
                        display_text = response_text.split("```json")[0].strip()
                        if not display_text:
                            display_text = "Especificação de RPA concluída! Você pode iniciar a fábrica abaixo."
                    
                    st.markdown(display_text)
                    st.session_state.messages.append({"role": "assistant", "content": display_text})
                    
                    if result["is_complete"]:
                        st.session_state.spec_ready = True
                        # Forçar os pacotes selecionados na spec
                        result["spec_data"]["tech_stack"] = st.session_state.selected_packages
                        st.session_state.spec_data = result["spec_data"]
                        st.rerun()

    if st.session_state.spec_ready and st.session_state.spec_data:
        st.success("✅ Especificação concluída pelo Analista! Iniciando construção...")
        
        if st.button("🚀 Gerar Código e Testar Visivelmente"):
            spec = st.session_state.spec_data
            
            project_dir = setup_project_dir(base_dir, project_name)
            
            with st.spinner("👩‍💻 Programador escrevendo o código... (headless=False por padrão para você visualizar)"):
                # Aviso especial para a instrução gerar o navegador visível (headless=False)
                spec["visual_test_instruction"] = "IMPORTANTE: O código da automação DEVE ser gerado com o navegador VISÍVEL (headless=False) ou o script rodando de modo visível. O usuário quer ver o robô mexendo na tela durante o teste."
                
                programmer = ProgrammerAgent()
                prog_result = programmer.generate_code(spec, project_dir)
                if not prog_result.get("success"):
                    st.error("Falha na geração de código")
                    st.stop()
                    
            with st.spinner("🕵️‍♂️ Testador executando o robô na sua tela..."):
                tester = TesterAgent()
                test_result = tester.test_and_fix(project_dir, "main.py", max_retries=2)
                
                if test_result.get("success"):
                    st.success("✅ Testes passaram!")
                    with st.expander("Logs do Terminal"):
                        st.code(test_result.get("stdout"))
                else:
                    st.error("❌ Testador falhou.")
                    st.error(test_result.get("error"))
                    
            with st.spinner("🛠️ DevOps gerando dependências..."):
                devops = DevOpsAgent()
                devops.generate_project_files(spec, project_dir)
                
            st.balloons()
            st.success(f"🎉 Robô '{project_name}' pronto em:\n{project_dir}")
            
            if st.button("Novo Robô"):
                st.session_state.clear()
                st.rerun()
