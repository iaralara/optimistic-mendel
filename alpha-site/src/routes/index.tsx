import { useState, useEffect, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  FileText, Wallet, MessagesSquare, CalendarCheck, Receipt, ClipboardList, Zap, Cpu,
  Building2, Landmark, Users, Wrench, MonitorSmartphone, Compass, Phone, Instagram, Mail, MapPin, Bot, ArrowRight,
  Send, X, Sparkles, MessageCircle, Loader2, ShieldCheck, KeyRound, CheckCircle2
} from "lucide-react";
import hero from "@/assets/hero.jpg";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Alpha Soluções Condominiais | Gestão com Inteligência e Transparência" },
      { name: "description", content: "Administradora de condomínios em João Pessoa - PB. Gestão administrativa, financeira e operacional com sistema próprio e atendimento humanizado." },
      { property: "og:title", content: "Alpha Soluções Condominiais" },
      { property: "og:description", content: "Gestão condominial com inteligência, transparência e segurança em João Pessoa - PB." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const WHATS = "https://wa.me/5583996806325";

const benefits = [
  [FileText, "Acesso rápido a documentos"], [Wallet, "Controle financeiro transparente"],
  [MessagesSquare, "Comunicação eficiente"], [CalendarCheck, "Reserva de áreas comuns"],
  [Receipt, "Prestação de contas digital"], [ClipboardList, "Registro de ocorrências"],
  [Zap, "Agilidade administrativa"], [Cpu, "Tecnologia exclusiva"],
] as const;

const operationalServices = [
  {
    icon: Wrench,
    title: "Gestão Operacional",
    items: [
      "Acompanhamento de fornecedores e terceirizados.",
      "Controle de manutenções preventivas e corretivas.",
      "Apoio na gestão das áreas comuns.",
    ],
  },
  {
    icon: Users,
    title: "Assembleias e Reuniões",
    items: [
      "Convocação e organização de assembleias.",
      "Apoio na condução das reuniões.",
      "Elaboração de atas e registro das deliberações.",
      "Assembleia de implantação para novos condomínios.",
    ],
  },
  {
    icon: MonitorSmartphone,
    title: "Tecnologia e Transparência",
    items: [
      "Plataforma digital para síndicos e moradores.",
      "Acesso a documentos, boletos e comunicados.",
      "Relatórios gerenciais e financeiros.",
      "Comunicação ágil e centralizada.",
    ],
  },
  {
    icon: Compass,
    title: "Planejamento e Consultoria",
    items: [
      "Diagnóstico da gestão condominial.",
      "Planejamento estratégico para o condomínio.",
      "Orientação para redução de custos e otimização de processos.",
      "Apoio à tomada de decisões do síndico e conselho.",
    ],
  },
] as const;

const team: [string, string, string, string, string][] = [
  ["Priscila Carvalho", "Planejamento e Gestão Condominial", "Melhoria contínua, prevenção e gestão de conflitos.", "/team/priscila.jpg", "object-top"],
  ["Maiara Lara", "Financeiro e RH", "Gestão financeira eficiente e transparente.", "/team/maiara.jpg", "object-[center_22%]"],
  ["Iara Lara", "Contratos, Inovação e Tecnologia", "Segurança nos processos e modernização da gestão.", "/team/iara.jpg", "object-[center_35%]"],
  ["Ranielly Rocha", "Responsável Técnica", "Orientação técnica, conformidade com legislação e normas, acompanhamento financeiro e administrativo.", "/team/ranielle.jpg", "object-top"],
];

const values = ["Integridade", "Transparência", "Respeito à diversidade", "Excelência", "Ética profissional", "Cuidado com o patrimônio", "Inovação aplicada", "Cooperação", "Empatia", "Confiança"];

function Index() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string }>>([
    {
      sender: 'ai',
      text: 'Olá! Sou a Inteligência Artificial da Alpha Soluções Condominiais. Como posso te ajudar hoje? Posso tirar dúvidas sobre nossos serviços, gestão condominial, setor imobiliário ou gerar uma proposta para o seu condomínio!',
    },
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isChatOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || isAiLoading) return;

    const userText = inputMsg.trim();
    const newHistory = [...chatMessages, { sender: 'user' as const, text: userText }];
    setChatMessages(newHistory);
    setInputMsg('');
    setIsAiLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newHistory }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.reply) {
          setChatMessages((prev) => [...prev, { sender: 'ai', text: data.reply }]);
          setIsAiLoading(false);
          return;
        }
      }
    } catch (err) {
      console.error('Erro ao chamar IA:', err);
    }

    // Resposta inteligente local de fallback caso haja lentidão na conexão
    setTimeout(() => {
      let reply = 'Recebemos sua mensagem! Nossa equipe (Priscila, Maiara, Iara e Ranielly) pode lhe atender imediatamente. Gostaria de agendar uma reunião ou tirar dúvidas sobre o seu condomínio?';
      const lower = userText.toLowerCase();
      if (lower.includes('proposta') || lower.includes('orçamento') || lower.includes('preço') || lower.includes('valor')) {
        reply = 'Elaboramos estudos orçamentários personalizados para o seu condomínio com foco em redução de custos operacionais e transparência contínua! Você também pode falar direto com nosso time pelo WhatsApp (83) 99680-6325.';
      } else if (lower.includes('imóvel') || lower.includes('imoveis') || lower.includes('venda') || lower.includes('aluguel') || lower.includes('locação')) {
        reply = 'Nosso Setor Imobiliário oferece suporte completo para compra, venda e locação residencial ou comercial, com assessoria jurídica e avaliação patrimonial de alto padrão!';
      } else if (lower.includes('sistema') || lower.includes('app') || lower.includes('tecnologia') || lower.includes('qr')) {
        reply = 'Nosso sistema próprio é 100% digital e ágil via Web/PWA! Os moradores e síndicos têm acesso a 2ª via de boletos, atas, prestação de contas transparente e reserva de áreas comuns sem burocracia.';
      }
      setChatMessages((prev) => [...prev, { sender: 'ai', text: reply }]);
      setIsAiLoading(false);
    }, 600);
  };

  useEffect(() => {
    if ((window as any).__bhldScript) return;
    (window as any).__bhldScript = true;
    const s = document.createElement("script");
    s.type = "module";
    s.src = "https://w.behold.so/widget.js";
    document.head.appendChild(s);
  }, []);

  return (
    <div className="min-h-screen">
      <header className="absolute inset-x-0 top-0 z-20">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 text-ivory">
          <a href="#" aria-label="Alpha Soluções Condominiais" className="block"><img src={logo} alt="Alpha Soluções Condominiais" className="h-14 md:h-16 w-auto object-contain" /></a>
          <div className="hidden gap-8 text-sm md:flex">
            {[["Quem Somos", "#sobre"], ["Sistema", "#sistema"], ["Serviços", "#servicos"], ["Equipe", "#equipe"], ["Contato", "#contato"]].map(([l, h]) => (
              <a key={h} href={h} className="opacity-80 transition hover:opacity-100">{l}</a>
            ))}
            <Link to="/blog" className="opacity-80 transition hover:opacity-100">Blog</Link>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative flex min-h-[92vh] items-center overflow-hidden bg-navy text-ivory">
        <img src={hero} alt="Condomínio residencial ao entardecer em João Pessoa" width={1600} height={1008} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-hero" />
        <div className="relative mx-auto w-full max-w-7xl px-6 pt-28 pb-20">
          <p className="eyebrow animate-rise text-slate">Alpha Soluções Condominiais · João Pessoa – PB</p>
          <h1 className="animate-rise mt-6 max-w-3xl text-4xl leading-tight md:text-6xl" style={{ animationDelay: "0.1s" }}>
            Gestão Condominial com Inteligência, Transparência e Segurança.
          </h1>
          <p className="animate-rise mt-6 max-w-xl text-base font-light text-mist md:text-lg" style={{ animationDelay: "0.2s" }}>
            Transformamos a gestão do seu condomínio em uma experiência de tranquilidade, confiança e valorização das pessoas.
          </p>
          <div className="animate-rise mt-10 flex flex-col gap-4 sm:flex-row" style={{ animationDelay: "0.3s" }}>
            <a href={WHATS} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-sm bg-ivory px-8 py-4 text-sm font-medium text-navy shadow-elegant transition hover:bg-slate">
              Solicite uma Proposta <ArrowRight className="h-4 w-4" />
            </a>
            <button 
              type="button"
              onClick={() => setIsChatOpen(true)} 
              className="inline-flex items-center justify-center gap-2 rounded-sm border border-slate/60 px-8 py-4 text-sm font-medium text-ivory transition hover:bg-ivory/10 cursor-pointer"
            >
              <Bot className="h-4 w-4 text-slate" /> Conversar com a IA Alpha
            </button>
          </div>
        </div>
      </section>

      {/* QUEM SOMOS */}
      <section id="sobre" className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-16 md:grid-cols-2">
          <div>
            <p className="eyebrow text-muted-foreground">Quem Somos</p>
            <h2 className="mt-4 text-3xl md:text-4xl">Gestão organizada, segura e orientada para resultados</h2>
          </div>
          <p className="leading-relaxed text-muted-foreground">
            Somos uma administradora de condomínios especializada em gestão administrativa, financeira e de instalações. Atuamos com planejamento estratégico, transparência e atendimento humanizado, garantindo o bom funcionamento das operações e a valorização do patrimônio. Nosso compromisso é oferecer soluções eficientes que proporcionem mais tranquilidade para síndicos, conselhos e moradores.
          </p>
        </div>
        <div className="mt-16 grid gap-px overflow-hidden rounded-sm bg-border md:grid-cols-3">
          {[
            ["Missão", "Oferecer soluções em gestão condominial com excelência, transparência e visão estratégica, promovendo a valorização do patrimônio, a eficiência das operações e o bem-estar das pessoas, por meio de um atendimento próximo, humanizado e comprometido com resultados."],
            ["Visão", "Ser referência em administração condominial, reconhecida pela inovação, confiança e relacionamento humano."],
            ["Propósito", "Transformar a gestão condominial criando ambientes organizados, sustentáveis e harmoniosos."],
          ].map(([t, d]) => (
            <div key={t} className="bg-card p-8">
              <h3 className="text-xl">{t}</h3>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          {values.map((v) => (
            <span key={v} className="rounded-full border border-border px-4 py-2 text-xs">{v}</span>
          ))}
        </div>
      </section>

      {/* SISTEMA */}
      <section id="sistema" className="bg-navy py-24 text-ivory">
        <div className="mx-auto max-w-7xl px-6">
          <p className="eyebrow text-slate">Diferencial</p>
          <h2 className="mt-4 max-w-2xl text-3xl md:text-4xl">Sistema Próprio de Gestão Condominial</h2>
          <p className="mt-6 max-w-2xl font-light text-mist">
            Contamos com um sistema próprio desenvolvido para oferecer mais eficiência e agilidade. Nossa plataforma permite o acompanhamento em tempo real, facilitando a comunicação. É 100% otimizada para celular — os moradores podem escanear nosso QR Code e instalar o aplicativo direto pelo navegador.
          </p>
          <div className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-4">
            {benefits.map(([Icon, label]) => (
              <div key={label} className="rounded-sm border border-ivory/10 bg-ivory/5 p-6 transition hover:border-slate/50">
                <Icon className="h-6 w-6 text-slate" />
                <p className="mt-4 text-sm">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <a
              href="https://app.alphaadmsc.com.br"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-slate px-8 py-3.5 text-sm font-semibold text-navy shadow-lg transition hover:bg-ivory hover:scale-105"
            >
              <span>Acessar Portal do Morador / Síndico (app.alphaadmsc.com.br)</span>
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* SERVIÇOS */}
      <section id="servicos" className="mx-auto max-w-7xl px-6 py-24">
        <div className="max-w-3xl">
          <p className="eyebrow text-slate font-semibold uppercase tracking-wider">Nossos Serviços</p>
          <h2 className="mt-3 text-3xl font-display font-bold text-navy md:text-4xl">
            Soluções Completas em Gestão Condominial e Patrimonial
          </h2>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            Do planejamento inicial à liderança executiva, combinamos presença ativa, conformidade técnica e inteligência de processos para valorizar seu condomínio.
          </p>
        </div>

        {/* CARDS DE DESTAQUE: SÍNDICO PROFISSIONAL & IMPLANTAÇÃO */}
        <div className="mt-14 grid gap-8 lg:grid-cols-2">
          {/* SÍNDICO PROFISSIONAL */}
          <article className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-navy p-8 md:p-10 text-ivory shadow-xl border border-slate/30">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate/20 px-3.5 py-1 text-xs font-semibold text-slate border border-slate/30">
                <ShieldCheck className="h-4 w-4" />
                <span>Liderança de Excelência</span>
              </div>
              <h3 className="mt-6 text-2xl md:text-3xl font-display font-bold text-ivory">
                Síndico Profissional
              </h3>
              <p className="mt-3 text-base font-medium text-slate">
                Liderança, presença e estratégia para uma gestão condominial de excelência.
              </p>
              <div className="mt-6 space-y-3.5 text-sm text-mist/95 leading-relaxed">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-slate shrink-0 mt-0.5" />
                  <span>Uma atuação profissional voltada para a preservação do patrimônio, eficiência operacional e qualidade de vida dos moradores.</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-slate shrink-0 mt-0.5" />
                  <span>Acompanhamos de perto as necessidades do condomínio, fiscalizamos serviços, conduzimos fornecedores, prevenimos problemas e planejamos melhorias.</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-slate shrink-0 mt-0.5" />
                  <span>Transformamos a gestão em uma atuação mais organizada, responsável, transparente e estratégica.</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-ivory/10 flex items-center justify-between">
              <a
                href={WHATS}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate transition hover:text-ivory"
              >
                <span>Solicitar proposta para Síndico Profissional</span>
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </article>

          {/* IMPLANTAÇÃO CONDOMINIAL */}
          <article className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-card p-8 md:p-10 shadow-elegant border border-border">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-navy/5 px-3.5 py-1 text-xs font-semibold text-navy border border-navy/10">
                <KeyRound className="h-4 w-4 text-navy" />
                <span>Novos Empreendimentos</span>
              </div>
              <h3 className="mt-6 text-2xl md:text-3xl font-display font-bold text-navy">
                Implantação Condominial
              </h3>
              <p className="mt-3 text-base font-semibold text-navy/85">
                Planejamento e estruturação para uma operação condominial eficiente.
              </p>
              <p className="mt-6 text-sm text-muted-foreground leading-relaxed">
                Um trabalho estratégico de preparação e estruturação do condomínio para sua entrada em operação. Organizamos processos, rotinas, fornecedores e serviços essenciais, apoiamos a estruturação administrativa e operacional e acompanhamos a implantação das áreas e sistemas necessários para que o condomínio inicie sua jornada com organização, eficiência e planejamento.
              </p>
              <div className="mt-6 space-y-2.5 text-sm text-muted-foreground">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-navy shrink-0" />
                  <span>Assembleia Geral de Instalação (AGI) estruturada</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-navy shrink-0" />
                  <span>Vistoria e recebimento técnico de áreas comuns da construtora</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-navy shrink-0" />
                  <span>Contratação de prestadores essenciais, seguros e segurança</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
              <a
                href={WHATS}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-navy transition hover:text-slate-700"
              >
                <span>Falar sobre Implantação de Condomínio</span>
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </article>
        </div>

        {/* GRADE DE 4 PILARES ESSENCIAIS */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {operationalServices.map((service) => {
            const Icon = service.icon;
            return (
              <article
                key={service.title}
                className="flex flex-col justify-between rounded-xl bg-card p-7 shadow-elegant/40 border border-border/70 transition hover:-translate-y-1 hover:shadow-elegant"
              >
                <div>
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-navy text-ivory shadow-sm">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-lg font-display font-bold text-navy">{service.title}</h3>
                  <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                    {service.items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="text-navy font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>

        {/* SERVIÇOS COMPLEMENTARES: FINANCEIRO E IMOBILIÁRIO */}
        <div className="mt-8 rounded-2xl bg-mist/40 border border-border p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-2xl">
            <h4 className="text-lg font-display font-bold text-navy flex items-center gap-2">
              <Building2 className="h-5 w-5 text-navy" />
              Gestão Financeira, Administrativa & Mercado Imobiliário
            </h4>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Além da rotina operacional, oferecemos conciliação contábil, controle de inadimplência, prestação de contas digital e assessoria completa para compra, venda, locação e avaliação patrimonial de imóveis.
            </p>
          </div>
          <a
            href={WHATS}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3.5 text-sm font-semibold text-ivory shadow-md transition hover:bg-slate hover:text-navy hover:scale-105"
          >
            <span>Falar com Especialistas</span>
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* EQUIPE */}
      <section id="equipe" className="bg-mist py-24">
        <div className="mx-auto max-w-7xl px-6">
          <p className="eyebrow text-muted-foreground">Nossa Equipe</p>
          <h2 className="mt-4 text-3xl md:text-4xl">Liderança</h2>
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {team.map(([n, r, d, photo, pos]) => (
              <div key={n} className="overflow-hidden rounded-xl bg-ivory shadow-elegant transition hover:-translate-y-1 hover:shadow-xl flex flex-col">
                <div className="relative h-72 w-full overflow-hidden bg-navy/10">
                  <img 
                    src={photo} 
                    alt={n} 
                    className={`h-full w-full object-cover ${pos} transition duration-500 hover:scale-105`} 
                  />
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display text-lg font-bold text-navy">{n}</h3>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate">{r}</p>
                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{d}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INSTAGRAM FEED EM TEMPO REAL */}
      <section id="instagram" className="bg-ivory py-24">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate/30 bg-mist/50 px-4 py-1.5 mb-4">
            <Instagram className="h-4 w-4 text-navy" />
            <span className="text-xs font-semibold uppercase tracking-wider text-navy">Instagram Oficial</span>
          </div>
          <h2 className="text-3xl md:text-4xl text-navy">Acompanhe Nosso Dia a Dia</h2>
          <p className="mt-3 text-sm text-muted-foreground max-w-lg mx-auto">
            Dicas práticas de convivência, novidades condominiais e os bastidores da gestão Alpha em João Pessoa.
          </p>

          <div className="mt-12 rounded-2xl overflow-hidden p-2 sm:p-4 bg-white/70 border border-slate/20 shadow-elegant">
            <figure dangerouslySetInnerHTML={{ __html: '<behold-widget feed-id="qZ5FTtL6fUCJvDHRWuxZ"></behold-widget>' }} />
          </div>

          <div className="mt-10">
            <a
              href="https://instagram.com/alphaadmsc"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-navy px-8 py-3.5 text-sm font-semibold text-ivory shadow-lg transition hover:bg-slate hover:text-navy hover:scale-105"
            >
              <Instagram className="h-4 w-4" />
              Seguir @alphaadmsc no Instagram
            </a>
          </div>
        </div>
      </section>

      {/* CONTATO */}
      <footer id="contato" className="bg-navy py-20 text-ivory">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 md:grid-cols-2">
          <div>
            <img src={logo} alt="Alpha Soluções Condominiais" className="h-16 w-auto rounded-sm" />
            <p className="mt-2 text-sm text-slate">Soluções Condominiais</p>
            <p className="mt-6 max-w-sm text-sm font-light text-mist">Gestão condominial com inteligência, transparência e segurança.</p>
          </div>
          <ul className="space-y-4 text-sm">
            <li className="flex items-center gap-3"><Phone className="h-4 w-4 text-slate" /> (83) 99680-6325 / (83) 99688-5931</li>
            <li className="flex items-center gap-3"><Instagram className="h-4 w-4 text-slate" /><a href="https://instagram.com/alphaadmsc" target="_blank" rel="noreferrer">@alphaadmsc</a></li>
            <li className="flex items-center gap-3"><Mail className="h-4 w-4 text-slate" /><a href="mailto:alphaadmsc@gmail.com">alphaadmsc@gmail.com</a></li>
            <li className="flex items-center gap-3"><MapPin className="h-4 w-4 text-slate" /> João Pessoa – PB</li>
          </ul>
        </div>
        <p className="mx-auto mt-16 max-w-7xl px-6 text-xs text-slate">© {new Date().getFullYear()} Alpha Soluções Condominiais</p>
      </footer>

      {/* MODAL DO CHATBOT DE IA */}
      {isChatOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-navy/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-ivory rounded-2xl shadow-2xl border border-slate/30 flex flex-col h-[520px] max-h-[90vh] overflow-hidden">
            {/* Cabeçalho do Chat */}
            <div className="bg-navy px-5 py-4 text-ivory flex items-center justify-between shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate/20 flex items-center justify-center text-slate border border-slate/30">
                  <Bot className="h-5 w-5 text-slate" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold tracking-wide">Assistente Virtual Alpha</h3>
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Online · Gestão & Imobiliário
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsChatOpen(false)}
                className="text-mist hover:text-ivory p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
                aria-label="Fechar chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Lista de Mensagens */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#FAF9F6] text-xs sm:text-sm">
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-2xl leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-navy text-ivory rounded-br-none shadow-md font-medium'
                        : 'bg-white text-navy border border-slate/20 rounded-bl-none shadow-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isAiLoading && (
                <div className="flex justify-start">
                  <div className="bg-white text-navy border border-slate/20 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-slate" />
                    <span className="text-xs text-muted-foreground">Alpha IA está digitando...</span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Input e Envio */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate/20 flex gap-2">
              <input
                type="text"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                placeholder="Digite sua dúvida ou peça uma proposta..."
                className="flex-1 bg-ivory border border-slate/30 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-navy placeholder:text-muted-foreground focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy"
              />
              <button
                type="submit"
                disabled={isAiLoading || !inputMsg.trim()}
                className="px-4 py-2.5 bg-navy text-ivory font-semibold rounded-xl text-xs sm:text-sm hover:bg-slate hover:text-navy transition shadow disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Enviar</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* BOTÃO FLUTUANTE DE IA NO CANTO INFERIOR */}
      {!isChatOpen && (
        <button
          type="button"
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 px-5 py-3.5 rounded-full bg-navy text-ivory shadow-2xl border border-slate/40 hover:bg-slate hover:text-navy hover:scale-105 transition-all flex items-center gap-2.5 font-semibold text-xs tracking-wide cursor-pointer"
          aria-label="Abrir chat de Inteligência Artificial"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
          </span>
          <Bot className="h-4 w-4" />
          <span>Falar com a IA</span>
        </button>
      )}
    </div>
  );
}
