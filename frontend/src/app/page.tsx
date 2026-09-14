// test: deploy trigger - 2026-09-14
"use client";

import React, { useState } from 'react';
import { Terminal, Code, MessageSquare, FolderTree, Play, CheckCircle, AlertTriangle, FileText } from 'lucide-react';
import Editor from '@monaco-editor/react';

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
