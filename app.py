import streamlit as st
import pandas as pd
import time
import random

# Configuração da página
st.set_page_config(
    page_title="Simulador RPA - Portal Financeiro",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Estilos Customizados
st.markdown("""
<style>
    .metric-card {
        background-color: #1E1E1E;
        padding: 20px;
        border-radius: 10px;
        border-left: 5px solid #00FF00;
        margin-bottom: 20px;
    }
    .metric-value {
        font-size: 2.5rem;
        font-weight: bold;
        color: #00FF00;
    }
    .metric-label {
        font-size: 1rem;
        color: #A0A0A0;
    }
</style>
""", unsafe_allow_html=True)

# Barra Lateral
with st.sidebar:
    st.image("https://cdn-icons-png.flaticon.com/512/2103/2103832.png", width=100)
    st.title("Configurações do Robô")
    sistema_alvo = st.selectbox("Sistema Alvo de Integração", ["ERP F360", "ERP Cigam", "TOTVS Protheus", "Sistema Acadêmico Próprio"])
    velocidade = st.slider("Velocidade da Simulação (segundos por registro)", 0.1, 2.0, 0.5)
    
    st.markdown("---")
    st.markdown("### Sobre o Serviço")
    st.info("Solução RPAaaS (RPA as a Service) focada em eliminar trabalhos manuais de conciliação bancária e data entry.")

# Área Principal
st.title("🤖 Simulador de Automação: Conciliação Bancária")
st.markdown(f"**Demonstração em tempo real de extração e injeção de dados no {sistema_alvo}.**")
st.write("Faça o upload de um arquivo de remessa/extrato (CSV) para ver o robô processando os dados e calculando o ROI da operação.")

# Upload de Arquivo
uploaded_file = st.file_uploader("Arraste seu arquivo CSV ou Excel aqui", type=['csv'])

if uploaded_file is not None:
    # Leitura do arquivo
    df = pd.read_csv(uploaded_file)
    total_registros = len(df)
    
    st.success(f"Arquivo carregado com sucesso! {total_registros} registros encontrados.")
    
    with st.expander("Visualizar Dados (Amostra)"):
        st.dataframe(df.head())
        
    st.markdown("---")
    st.subheader("Painel de Execução RPA")
    
    col1, col2 = st.columns([1, 1])
    
    with col1:
        start_button = st.button("🚀 Iniciar Processamento RPA", use_container_width=True)
    
    if start_button:
        # Variáveis de controle de tempo
        tempo_inicio = time.time()
        
        # UI Elements
        progress_bar = st.progress(0)
        status_text = st.empty()
        log_container = st.empty()
        
        logs = []
        
        # Simulação do processamento linha a linha
        for i, row in df.iterrows():
            # Progresso
            progress = (i + 1) / total_registros
            progress_bar.progress(progress)
            
            # Atualiza Status
            status_text.markdown(f"**Processando registro {i+1} de {total_registros}...**")
            
            # Log simulado
            registro_id = row.iloc[0] if len(row) > 0 else f"ID-{i}"
            novo_log = f"✅ [SUCESSO] Registro {registro_id} processado e integrado ao {sistema_alvo}."
            logs.insert(0, novo_log)
            
            # Exibe os últimos 5 logs
            log_output = "\n".join(logs[:5])
            log_container.code(log_output, language="bash")
            
            # Delay para simular o tempo de processamento da automação
            time.sleep(velocidade)
            
        tempo_fim = time.time()
        tempo_rpa = tempo_fim - tempo_inicio
        
        st.success("Processamento concluído com sucesso!")
        
        # Cálculo de ROI
        tempo_humano_por_registro_segundos = 120 # 2 minutos por registro na mão
        tempo_humano_total_horas = (total_registros * tempo_humano_por_registro_segundos) / 3600
        tempo_rpa_horas = tempo_rpa / 3600
        
        economia_horas = tempo_humano_total_horas - tempo_rpa_horas
        
        st.markdown("---")
        st.subheader("📊 Relatório de Retorno sobre Investimento (ROI)")
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-label">Tempo Gasto (Humano)</div>
                <div class="metric-value" style="color: #FF5555;">{tempo_humano_total_horas:.2f}h</div>
            </div>
            """, unsafe_allow_html=True)
            
        with col2:
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-label">Tempo Gasto (RPA)</div>
                <div class="metric-value">{tempo_rpa_horas:.4f}h</div>
            </div>
            """, unsafe_allow_html=True)
            
        with col3:
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-label">Horas Economizadas</div>
                <div class="metric-value">{economia_horas:.2f}h</div>
            </div>
            """, unsafe_allow_html=True)
            
        st.info("💡 **Conclusão:** O robô executou o trabalho sem erros de digitação e liberou a equipe financeira para focar em análises estratégicas em vez de tarefas operacionais repetitivas.")
else:
    st.info("👆 Por favor, faça o upload de um arquivo para testar o simulador.")
    
    # Criar arquivo de exemplo
    with st.expander("Não tem um arquivo? Gere um CSV de teste aqui"):
        if st.button("Gerar arquivo de demonstração"):
            dados_teste = pd.DataFrame({
                'ID_Transacao': [f'TXN{str(i).zfill(5)}' for i in range(1, 16)],
                'Data': pd.date_range(start='2026-08-01', periods=15).strftime('%Y-%m-%d'),
                'Valor': [round(random.uniform(100.0, 5000.0), 2) for _ in range(15)],
                'Status': ['Pendente'] * 15
            })
            csv = dados_teste.to_csv(index=False).encode('utf-8')
            st.download_button(
                label="Baixar CSV de Teste",
                data=csv,
                file_name='dados_bancarios_teste.csv',
                mime='text/csv',
            )
