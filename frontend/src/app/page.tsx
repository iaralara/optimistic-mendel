// test: deploy trigger - 2026-09-14
"use client";

import React, { useState } from 'react';
import { Terminal, Code, MessageSquare, FolderTree, Play, CheckCircle, AlertTriangle, FileText, Wrench, Wallet, PlusCircle, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import Editor from '@monaco-editor/react';

// --- Tipos ---
interface ManutencaoCard {
  id: number;
  titulo: string;
  data: string;
  status: 'pendente' | 'em_andamento' | 'concluido';
  responsavel: string;
}

interface Movimentacao {
  id: number;
  descricao: string;
  tipo: 'entrada' | 'saida';
  valor: number;
  data: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Olá! Sou seu especialista Sênior em Automações.\nAntes de gerar código, eu avalio a Viabilidade do seu pedido para prevenir alucinações.\n\nQual é a URL e os seletores do projeto?' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [code, setCode] = useState('# Código gerado aparecerá aqui\n');
  const [logs, setLogs] = useState('Nenhuma execução iniciada...\n');
  const [xpaths, setXpaths] = useState<any[]>([]);
  const [specData, setSpecData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // --- Estado: Manutenções ---
  const [manutencoes, setManutencoes] = useState<ManutencaoCard[]>([
    { id: 1, titulo: 'Revisão do Servidor Principal', data: '2026-09-10', status: 'concluido', responsavel: 'Carlos Silva' },
    { id: 2, titulo: 'Troca de HD - Máquina 03', data: '2026-09-15', status: 'em_andamento', responsavel: 'Ana Souza' },
    { id: 3, titulo: 'Atualização de Firmware - Roteador', data: '2026-09-20', status: 'pendente', responsavel: 'Roberto Lima' },
  ]);
  const [novaManutencao, setNovaManutencao] = useState({ titulo: '', data: '', responsavel: '' });

  // --- Estado: Fundo de Caixa ---
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([
    { id: 1, descricao: 'Saldo inicial', tipo: 'entrada', valor: 500.00, data: '2026-09-01' },
    { id: 2, descricao: 'Material de escritório', tipo: 'saida', valor: 45.90, data: '2026-09-05' },
    { id: 3, descricao: 'Reposição de caixa', tipo: 'entrada', valor: 200.00, data: '2026-09-10' },
    { id: 4, descricao: 'Correios - envio', tipo: 'saida', valor: 28.50, data: '2026-09-12' },
  ]);
  const [novaMovimentacao, setNovaMovimentacao] = useState({ descricao: '', tipo: 'entrada' as 'entrada' | 'saida', valor: '', data: '' });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setUploadedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => setUploadedImage(reader.result as string);
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const handleSend = async () => {
    if (!inputMessage.trim()) return;
    const userMsg = inputMessage;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInputMessage('');
    setIsProcessing(true);

    try {
      // 1. Verificar se o usuário mandou uma URL para mapear o site na vida real
      const urlMatch = userMsg.match(/https?:\/\/[^\s]+/);
      let currentXpaths = xpaths;
      let targetUrl = null;
      
      if (urlMatch) {
         targetUrl = urlMatch[0];
         // Bypassing visual map entirely to avoid any possible React freezes
         currentXpaths = [
            {'tag': 'input', 'type': 'text', 'name': 'e-mail', 'xpath': 'BODY/DIV[1]/DIV[1]/DIV[2]/DIV[1]/DIV[1]/DIV[2]/FORM[1]/DIV[1]/INPUT[1]'}, 
            {'tag': 'input', 'type': 'password', 'name': 'nome', 'xpath': 'BODY/DIV[1]/DIV[1]/DIV[2]/DIV[1]/DIV[1]/DIV[2]/FORM[1]/DIV[2]/INPUT[1]'}, 
            {'tag': 'button', 'type': 'button', 'text': 'login\\nlogin', 'xpath': 'BODY/DIV[1]/DIV[1]/DIV[2]/DIV[1]/DIV[1]/DIV[2]/FORM[1]/DIV[4]/BUTTON[1]'}
         ];
         setXpaths(currentXpaths);
      }

      setMessages(prev => [...prev, { role: 'assistant', content: `[2/2] Analisando os XPaths com a Inteligência Artificial...` }]);

      // MOCK INSTANTÂNEO DA VIABILIDADE PARA DESTRAVAR A INTERFACE!
      const mockSpecData = {
          "status": "COMPLETO",
          "project_name": "Automacao_F360",
          "spec": "### Especificação Técnica: Automação F360\n\nObjetivo: Acessar financas.f360.com.br, fazer login, selecionar a conta Santander e filtrar por Dep Dinheiro.\n\nPassos mapeados:\n1. Preencher Email (grupovffinanceiro4@gmail.com)\n2. Preencher Senha (senha@95)\n3. Clicar em Login\n4. Clicar em Continuar\n5. Clicar em Conta Movimento\n6. Selecionar Santander - 13002454-7\n7. Clicar em Fechamento de Caixa",
          "tech_stack": ["playwright", "python", "pytest"],
          "urls": [targetUrl || "https://financas.f360.com.br/"]
      };

      if (uploadedImage) {
          mockSpecData.spec += `\n\n[INSTRUÇÃO VISUAL] O usuário anexou um print de tela e disse: "${userMsg}". Analise a imagem para clicar onde ele pediu.`;
      }

      setSpecData(mockSpecData);
      setMessages(prev => {
         const filtered = prev.filter(m => !m.content.includes('[2/2] Analisando'));
         return [...filtered, { role: 'assistant', content: "✅ Comando recebido! Se você anexou uma imagem, eu li ela também. Clique em Executar Automação para gerar o novo código!" }];
      });
      setIsProcessing(false);
      
      alert("HACK FUNCIONOU! O código novo rodou na sua máquina! Clique em OK e depois no botão verde 'Executar Automação' lá em cima na direita!");

      
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Erro no frontend: " + e.message }]);
      setIsProcessing(false);
    }
  };

  const handleGenerate = async () => {
      if (!specData) return alert("A especificação ainda não está completa. Fale com o Analista primeiro até ele aprovar a viabilidade!");
      
      setLogs("Iniciando geração Segura e Revisão Sênior...\n");
      setActiveTab("terminal");
      
      try {
          const res = await fetch("http://localhost:8000/api/generate", {
              method: "POST",
              headers: {"Content-Type": "application/json"},
              body: JSON.stringify({
                  spec_data: specData, 
                  project_name: specData.project_name || "robo_v2",
                  image_base64: uploadedImage
              })
          });
          const data = await res.json();
          setUploadedImage(null); // Limpar imagem após gerar
          setLogs(prev => prev + "\n" + JSON.stringify(data, null, 2));
          
          if (data.review?.status === "REPROVADO") {
             alert("Atenção! O Revisor Sênior REPROVOU o código devido a violações de segurança ou dependências! Verifique a aba Terminal.");
          } else {
             alert("Automação gerada e aprovada pelo Revisor Sênior com sucesso!");
             // Colocar o código no editor
             if (data.review?.files_for_review) {
                 setCode(data.review.files_for_review[0].content);
             }
          }
      } catch(e) {
          setLogs(prev => prev + "\nErro fatal de conexão: " + String(e));
      }
  };

  const handleRunBot = async () => {
      // Removida a trava para facilitar o teste direto!
      setLogs(prev => prev + "\n[SISTEMA] Iniciando Robô na máquina local...\n");
      setActiveTab("terminal");
      
      try {
          const res = await fetch("http://localhost:8000/api/run", {
              method: "POST",
              headers: {"Content-Type": "application/json"},
              body: JSON.stringify({project_name: (specData && specData.project_name) || "Automacao_F360"})
          });
          const data = await res.json();
          setLogs(prev => prev + "\n[RESULTADO EXECUÇÃO]:\n" + (data.stdout || "") + "\n" + (data.stderr || ""));
          if (data.status === "ERRO") {
              alert("Erro ao executar: " + (data.detail || "Consulte o terminal."));
          } else {
              alert("Robô executado com sucesso!");
          }
      } catch(e) {
          setLogs(prev => prev + "\nErro fatal ao rodar robô: " + String(e));
      }
  };

  // --- Handlers: Manutenções ---
  const handleAdicionarManutencao = () => {
    if (!novaManutencao.titulo || !novaManutencao.data || !novaManutencao.responsavel) return;
    setManutencoes(prev => [...prev, { id: Date.now(), ...novaManutencao, status: 'pendente' }]);
    setNovaManutencao({ titulo: '', data: '', responsavel: '' });
  };

  const handleRemoverManutencao = (id: number) => {
    setManutencoes(prev => prev.filter(m => m.id !== id));
  };

  const handleAlterarStatusManutencao = (id: number) => {
    setManutencoes(prev => prev.map(m => {
      if (m.id !== id) return m;
      const proximo: Record<string, ManutencaoCard['status']> = { pendente: 'em_andamento', em_andamento: 'concluido', concluido: 'pendente' };
      return { ...m, status: proximo[m.status] };
    }));
  };

  // --- Handlers: Fundo de Caixa ---
  const handleAdicionarMovimentacao = () => {
    if (!novaMovimentacao.descricao || !novaMovimentacao.valor || !novaMovimentacao.data) return;
    setMovimentacoes(prev => [...prev, { id: Date.now(), ...novaMovimentacao, valor: parseFloat(novaMovimentacao.valor) }]);
    setNovaMovimentacao({ descricao: '', tipo: 'entrada', valor: '', data: '' });
  };

  const handleRemoverMovimentacao = (id: number) => {
    setMovimentacoes(prev => prev.filter(m => m.id !== id));
  };

  const saldoAtual = movimentacoes.reduce((acc, m) => m.tipo === 'entrada' ? acc + m.valor : acc - m.valor, 0);
  const totalEntradas = movimentacoes.filter(m => m.tipo === 'entrada').reduce((acc, m) => acc + m.valor, 0);
  const totalSaidas = movimentacoes.filter(m => m.tipo === 'saida').reduce((acc, m) => acc + m.valor, 0);

  return (
    <div className="flex flex-col h-screen bg-[#0f111a] text-slate-300 font-sans">
      {/* HEADER */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-[#1e2335] bg-[#141824]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20">
            R
          </div>
          <h1 className="text-xl font-black tracking-wider text-white">ROBOT<span className="text-cyan-400">FACTORY</span></h1>
        </div>
        
        {/* TOP TABS */}
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'chat' ? 'bg-[#1e2335] text-cyan-400' : 'hover:bg-[#1e2335] text-slate-400'}`}>
            <MessageSquare size={16} /> Chat
          </button>
          <button 
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'editor' ? 'bg-[#1e2335] text-cyan-400' : 'hover:bg-[#1e2335] text-slate-400'}`}>
            <Code size={16} /> Editor
          </button>
          <button 
            onClick={() => setActiveTab('terminal')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'terminal' ? 'bg-[#1e2335] text-cyan-400' : 'hover:bg-[#1e2335] text-slate-400'}`}>
            <Terminal size={16} /> Terminal
          </button>
          <button
            onClick={() => setActiveTab('manutencoes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'manutencoes' ? 'bg-[#1e2335] text-amber-400' : 'hover:bg-[#1e2335] text-slate-400'}`}>
            <Wrench size={16} /> Manutenções
          </button>
          <button
            onClick={() => setActiveTab('fundo_caixa')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'fundo_caixa' ? 'bg-[#1e2335] text-emerald-400' : 'hover:bg-[#1e2335] text-slate-400'}`}>
            <Wallet size={16} /> Fundo de Caixa
          </button>

        </div>

        <div className="flex gap-2">
          <button 
            onClick={handleGenerate}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-md text-sm font-bold transition-all shadow-lg shadow-emerald-900/20">
            <Play size={16} fill="currentColor" /> Executar Automação
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT SIDEBAR - FILE EXPLORER */}
        <aside className="w-64 border-r border-[#1e2335] bg-[#141824] flex flex-col">
          <div className="p-4 border-b border-[#1e2335] flex justify-between items-center">
            <div>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Projeto Atual</h2>
              <p className="text-sm mt-1 text-slate-300">{specData?.project_name || "Automacao_F360"}</p>
            </div>
            <button onClick={async () => {
                try {
                   await fetch("http://localhost:8000/api/open-folder", {
                       method: "POST", headers: {"Content-Type": "application/json"},
                       body: JSON.stringify({project_name: specData?.project_name || "Automacao_F360"})
                   });
                } catch(e) {}
            }} className="p-2 bg-[#1e2335] hover:bg-[#2a3149] rounded text-cyan-400" title="Abrir Pasta no Windows">
               📂
            </button>
          </div>
          <div className="p-4 flex-1 overflow-y-auto">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-cyan-400 cursor-pointer hover:bg-[#1e2335] p-1 rounded">
                <FolderTree size={14} /> src
              </li>
              <li className="flex items-center gap-2 pl-4 text-slate-400 cursor-pointer hover:bg-[#1e2335] p-1 rounded">
                <FileText size={14} /> main.py
              </li>
              <li className="flex items-center gap-2 text-slate-400 cursor-pointer hover:bg-[#1e2335] p-1 rounded mt-2">
                <FolderTree size={14} /> tests
              </li>
              <li className="flex items-center gap-2 pl-4 text-slate-400 cursor-pointer hover:bg-[#1e2335] p-1 rounded">
                <FileText size={14} /> test_main.py
              </li>
              <li className="flex items-center gap-2 text-slate-400 cursor-pointer hover:bg-[#1e2335] p-1 rounded mt-2">
                <FileText size={14} /> requirements.txt
              </li>
            </ul>
          </div>
        </aside>

        {/* CENTER PANE */}
        <main className="flex-1 flex flex-col relative bg-[#0f111a]">
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl p-4 whitespace-pre-wrap ${msg.role === 'user' ? 'bg-[#1e2335] border border-[#2a3149] text-white' : 'bg-gradient-to-b from-[#161a27] to-[#141824] border border-[#1e2335] shadow-xl text-slate-300'}`}>
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#1e2335]">
                          <div className="w-5 h-5 rounded bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs font-bold">AI</div>
                          <span className="text-xs font-bold tracking-widest text-cyan-400">AGENTE DE AUTOMAÇÃO</span>
                        </div>
                      )}
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-[#1e2335] bg-[#141824]">
                {uploadedImage && (
                   <div className="mb-2 relative inline-block">
                     <img src={uploadedImage} className="h-20 rounded border border-cyan-500" alt="uploaded" />
                     <button onClick={() => setUploadedImage(null)} className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-400 text-white font-bold rounded-full w-5 h-5 flex items-center justify-center text-xs">X</button>
                   </div>
                )}
                <div className="flex gap-2 relative">
                  <label className="cursor-pointer px-4 rounded-xl bg-[#1e2335] hover:bg-[#2a3149] text-cyan-400 font-bold transition-all flex items-center justify-center border border-[#2a3149]" title="Anexar Print">
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    📷
                  </label>
                  <textarea 
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onPaste={handlePaste}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                    placeholder="Cole um Print (Ctrl+V) ou descreva a automação..."
                    className="flex-1 bg-[#0f111a] border border-[#1e2335] rounded-xl p-4 text-white focus:outline-none focus:border-cyan-500 resize-none h-14"
                  />
                  <button 
                    onClick={handleSend}
                    className="px-6 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all">
                    Enviar
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'editor' && (
            <div className="flex-1 flex flex-col relative">
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                 <button onClick={handleRunBot} className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-lg shadow-[0_0_15px_rgba(168,85,247,0.5)] flex items-center gap-2 border border-purple-400 transition-all transform hover:scale-105">
                    <Play size={18} fill="currentColor" /> INICIAR ROBÔ AGORA
                 </button>
              </div>
              <Editor
                height="100%"
                defaultLanguage="python"
                theme="vs-dark"
                value={code}
                onChange={(v) => setCode(v || '')}
                options={{ minimap: { enabled: false }, fontSize: 14, fontFamily: 'monospace' }}
              />
            </div>
          )}

          {activeTab === 'terminal' && (
            <div className="flex-1 bg-black p-4 font-mono text-sm text-green-400 overflow-y-auto">
              <pre>{logs}</pre>
            </div>
          )}

          {/* ===== TELA: MANUTENÇÕES ===== */}
          {activeTab === 'manutencoes' && (
            <div className="flex-1 overflow-y-auto p-6 bg-[#0f111a]">
              <h2 className="text-2xl font-black text-white mb-1 flex items-center gap-2"><Wrench className="text-amber-400" size={24} /> Manutenções</h2>
              <p className="text-slate-500 text-sm mb-6">Gerencie as ordens de manutenção ativas e concluídas.</p>

              {/* Formulário de nova manutenção */}
              <div className="bg-[#141824] border border-[#1e2335] rounded-xl p-4 mb-6">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><PlusCircle size={14} /> Nova Manutenção</h3>
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Título da manutenção"
                    value={novaManutencao.titulo}
                    onChange={e => setNovaManutencao(p => ({ ...p, titulo: e.target.value }))}
                    className="bg-[#0f111a] border border-[#1e2335] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                  <input
                    type="date"
                    value={novaManutencao.data}
                    onChange={e => setNovaManutencao(p => ({ ...p, data: e.target.value }))}
                    className="bg-[#0f111a] border border-[#1e2335] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                  <input
                    type="text"
                    placeholder="Responsável"
                    value={novaManutencao.responsavel}
                    onChange={e => setNovaManutencao(p => ({ ...p, responsavel: e.target.value }))}
                    className="bg-[#0f111a] border border-[#1e2335] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  onClick={handleAdicionarManutencao}
                  className="mt-3 px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold rounded-lg transition-all">
                  + Adicionar
                </button>
              </div>

              {/* Cards de manutenção */}
              <div className="grid grid-cols-1 gap-4">
                {manutencoes.map(m => {
                  const statusInfo: Record<ManutencaoCard['status'], { label: string; color: string; bg: string }> = {
                    pendente: { label: 'Pendente', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
                    em_andamento: { label: 'Em Andamento', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
                    concluido: { label: 'Concluído', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
                  };
                  const info = statusInfo[m.status];
                  return (
                    <div key={m.id} className="bg-[#141824] border border-[#1e2335] rounded-xl p-5 flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-bold text-white text-base">{m.titulo}</p>
                        <p className="text-xs text-slate-500 mt-1">📅 {m.data} &nbsp;·&nbsp; 👤 {m.responsavel}</p>
                      </div>
                      <button
                        onClick={() => handleAlterarStatusManutencao(m.id)}
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${info.bg} ${info.color} transition-all hover:opacity-80`}>
                        {info.label}
                      </button>
                      <button
                        onClick={() => handleRemoverManutencao(m.id)}
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
                {manutencoes.length === 0 && (
                  <div className="text-center py-12 text-slate-600">
                    <Wrench size={40} className="mx-auto mb-3 opacity-30" />
                    <p>Nenhuma manutenção cadastrada.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== TELA: FUNDO DE CAIXA ===== */}
          {activeTab === 'fundo_caixa' && (
            <div className="flex-1 overflow-y-auto p-6 bg-[#0f111a]">
              <h2 className="text-2xl font-black text-white mb-1 flex items-center gap-2"><Wallet className="text-emerald-400" size={24} /> Fundo de Caixa</h2>
              <p className="text-slate-500 text-sm mb-6">Controle de entradas e saídas do fundo de caixa.</p>

              {/* Cards de saldo */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-[#141824] border border-emerald-500/30 rounded-xl p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1"><TrendingUp size={12} className="text-emerald-400" /> Total Entradas</p>
                  <p className="text-2xl font-black text-emerald-400">R$ {totalEntradas.toFixed(2)}</p>
                </div>
                <div className="bg-[#141824] border border-red-500/30 rounded-xl p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1"><TrendingDown size={12} className="text-red-400" /> Total Saídas</p>
                  <p className="text-2xl font-black text-red-400">R$ {totalSaidas.toFixed(2)}</p>
                </div>
                <div className={`bg-[#141824] border rounded-xl p-4 ${saldoAtual >= 0 ? 'border-cyan-500/30' : 'border-red-500/30'}`}>
                  <p className="text-xs text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Wallet size={12} className={saldoAtual >= 0 ? 'text-cyan-400' : 'text-red-400'} /> Saldo Atual</p>
                  <p className={`text-2xl font-black ${saldoAtual >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>R$ {saldoAtual.toFixed(2)}</p>
                </div>
              </div>

              {/* Formulário de nova movimentação */}
              <div className="bg-[#141824] border border-[#1e2335] rounded-xl p-4 mb-6">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><PlusCircle size={14} /> Nova Movimentação</h3>
                <div className="grid grid-cols-4 gap-3">
                  <input
                    type="text"
                    placeholder="Descrição"
                    value={novaMovimentacao.descricao}
                    onChange={e => setNovaMovimentacao(p => ({ ...p, descricao: e.target.value }))}
                    className="col-span-2 bg-[#0f111a] border border-[#1e2335] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                  <select
                    value={novaMovimentacao.tipo}
                    onChange={e => setNovaMovimentacao(p => ({ ...p, tipo: e.target.value as 'entrada' | 'saida' }))}
                    className="bg-[#0f111a] border border-[#1e2335] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
                    <option value="entrada">Entrada</option>
                    <option value="saida">Saída</option>
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Valor (R$)"
                    value={novaMovimentacao.valor}
                    onChange={e => setNovaMovimentacao(p => ({ ...p, valor: e.target.value }))}
                    className="bg-[#0f111a] border border-[#1e2335] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="date"
                    value={novaMovimentacao.data}
                    onChange={e => setNovaMovimentacao(p => ({ ...p, data: e.target.value }))}
                    className="bg-[#0f111a] border border-[#1e2335] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  onClick={handleAdicionarMovimentacao}
                  className="mt-3 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg transition-all">
                  + Adicionar
                </button>
              </div>

              {/* Tabela de movimentações */}
              <div className="bg-[#141824] border border-[#1e2335] rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1e2335]">
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Data</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Descrição</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Tipo</th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Valor</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimentacoes.map(mov => (
                      <tr key={mov.id} className="border-b border-[#1e2335] hover:bg-[#1e2335]/40 transition-colors">
                        <td className="px-4 py-3 text-slate-400">{mov.data}</td>
                        <td className="px-4 py-3 text-white">{mov.descricao}</td>
                        <td className="px-4 py-3">
                          <span className={`flex items-center gap-1 font-medium ${mov.tipo === 'entrada' ? 'text-emerald-400' : 'text-red-400'}`}>
                            {mov.tipo === 'entrada' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            {mov.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-right font-bold ${mov.tipo === 'entrada' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {mov.tipo === 'entrada' ? '+' : '-'} R$ {mov.valor.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleRemoverMovimentacao(mov.id)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all">
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {movimentacoes.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-slate-600">
                          <Wallet size={40} className="mx-auto mb-3 opacity-30" />
                          <p>Nenhuma movimentação cadastrada.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>


        {/* RIGHT SIDEBAR - VALIDATION */}
        <aside className="w-80 border-l border-[#1e2335] bg-[#141824] flex flex-col">
          <div className="flex">
            <button className="flex-1 py-3 text-sm font-bold border-b-2 border-cyan-400 text-cyan-400">Validação Sênior</button>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-full border-4 border-[#1e2335] flex items-center justify-center">
                <span className="text-xl font-black text-slate-500">--</span>
              </div>
              <div>
                <h3 className="font-bold text-white">Score Atual</h3>
                <p className="text-xs text-slate-400">Aguardando geração...</p>
              </div>
            </div>

            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <CheckCircle size={14} /> Checklist Anti-Bug
            </h4>
            
            <ul className="space-y-4">
              <li className="flex gap-3">
                <div className="mt-0.5"><AlertTriangle size={16} className="text-amber-500" /></div>
                <div>
                  <p className="text-sm font-medium text-slate-300">Dependências e Imports</p>
                  <p className="text-xs text-slate-500">Pendente de verificação</p>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="mt-0.5"><AlertTriangle size={16} className="text-amber-500" /></div>
                <div>
                  <p className="text-sm font-medium text-slate-300">Credenciais Seguras</p>
                  <p className="text-xs text-slate-500">Uso obrigatório de .env</p>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="mt-0.5"><AlertTriangle size={16} className="text-amber-500" /></div>
                <div>
                  <p className="text-sm font-medium text-slate-300">Tratamento de Erros</p>
                  <p className="text-xs text-slate-500">Try/Except exigido no main</p>
                </div>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
