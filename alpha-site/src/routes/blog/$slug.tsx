import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getBlogPostBySlug } from "@/integrations/firebase/client";
import { ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  meta_description: string;
  published_at: string;
  image_url?: string;
};

const fallbackPostsMap: Record<string, Post> = {
  "prestacao-de-contas-condominio-transparencia": {
    id: "prestacao-de-contas-condominio-transparencia",
    title: "Prestação de Contas no Condomínio: O Que Apresentar e Como Evitar Dores de Cabeça",
    slug: "prestacao-de-contas-condominio-transparencia",
    excerpt: "Descubra como transformar a prestação de contas em um momento de confiança e clareza entre síndicos, conselho fiscal e moradores.",
    meta_description: "Guia prático para síndicos realizarem prestações de contas transparentes e sem atrito no condomínio.",
    published_at: "2026-10-16T11:00:00.000Z",
    image_url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
    content: `Quem assume a função de síndico sabe: gerenciar um condomínio vai muito além de cuidar da portaria ou da piscina. No final do mês, o que realmente constrói a tranquilidade da comunidade é a certeza de que cada centavo da taxa condominial está sendo aplicado com zelo e transparência.

A prestação de contas não deve ser vista como um momento de confronto ou burocracia pesada, mas sim como uma prestação de compromisso com os vizinhos que confiaram a gestão a você.

---

## 1. O que precisa estar na mesa todo mês?

Para manter o conselho fiscal e os moradores alinhados, a rotina mensal deve conter:

* **Balancete analítico:** O demonstrativo simples de receitas (taxas pagas, multas, reservas de salão) e despesas (folha de pagamento, água, energia, contratos de manutenção).
* **Extratos bancários conciliados:** Cada linha do balancete deve bater exatamente com a movimentação bancária da conta do condomínio.
* **Comprovantes e notas fiscais organizadas:** Notas fiscais de serviços e comprovantes de quitação de encargos trabalhistas de funcionários e terceirizados.
* **Relatório de inadimplência atualizado:** Sem expor nomes de forma constrangedora nos murais, mas apresentando os números consolidados para que todos saibam a saúde do fluxo de caixa.

---

## 2. A assembleia anual de prestação de contas

Uma vez ao ano, na Assembleia Geral Ordinária (AGO), o síndico apresenta o fechamento do exercício anterior e a previsão orçamentária do próximo ano.

**Boas práticas para uma assembleia sem atritos:**

1. **Envio prévio:** Disponibilize os relatórios pelo menos 7 a 10 dias antes da reunião, seja no aplicativo ou por e-mail. Morador que lê com calma chega à reunião para votar, não para debater detalhes menores.
2. **Parecer prévio do Conselho Fiscal:** Quando os conselheiros já analisaram as pastas previamente e emitem parecer favorável, a assembleia flui com rapidez e segurança.
3. **Linguagem acessível:** Evite jargões contábeis difíceis. Explique os investimentos feitos nas áreas comuns e onde houve economia.

---

## 3. Como a tecnologia e o apoio especializado mudam o jogo

Guardar recibos em pastas físicas volumosas é coisa do passado e gera insegurança. Hoje, ter uma plataforma onde qualquer morador clica no celular e vê a nota fiscal da manutenção do portão traz paz de espírito para quem mora e, principalmente, para quem administra.

Na **Alpha Soluções Condominiais**, aqui em João Pessoa, apoiamos os síndicos em cada etapa: organizamos toda a documentação contábil, realizamos conciliação bancária diária e oferecemos um aplicativo intuitivo para o seu condomínio.`,
  },
  "gestao-financeira-condominial-transparencia": {
    id: "guia-gestao-condominial-pratica",
    title: "Como otimizar a gestão financeira do seu condomínio com transparência",
    slug: "gestao-financeira-condominial-transparencia",
    excerpt: "Dicas práticas para síndicos e conselheiros reduzirem a inadimplência e apresentarem balancetes claros aos moradores.",
    meta_description: "Guia para uma gestão financeira condominial transparente e eficiente.",
    published_at: "2026-10-01T12:00:00.000Z",
    image_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80",
    content: `## A importância da transparência na prestação de contas

Uma gestão financeira saudável é o pilar de sustentação de qualquer condomínio. Quando as contas são claras e acessíveis, a confiança entre síndico, conselho fiscal e condôminos aumenta exponencialmente.

### Práticas essenciais:
1. **Disponibilização digital dos comprovantes**: Anexar notas fiscais e comprovantes de pagamento diretamente no sistema permite consulta imediata por qualquer morador.
2. **Previsão orçamentária realista**: Manter o fundo de reserva atualizado e prever reajustes de contratos evita taxas extras repentinas.
3. **Comunicação preventiva de cobrança**: Lembretes gentis antes do vencimento reduzem a inadimplência em até 40% antes de se tornar um problema jurídico.

Na Alpha Soluções Condominiais, aliamos tecnologia e acompanhamento humano para que seu condomínio tenha tranquilidade absoluta nas finanças.`,
  },
  "manutencao-preventiva-condominios": {
    id: "manutencao-preventiva-condominios",
    title: "Manutenção preventiva em condomínios: o plano anual que economiza dinheiro",
    slug: "manutencao-preventiva-condominios",
    excerpt: "Entenda por que a manutenção preventiva evita despesas extraordinárias e valoriza o patrimônio dos condôminos.",
    meta_description: "Como estruturar um plano de manutenção preventiva condominial eficaz.",
    published_at: "2026-10-05T12:00:00.000Z",
    image_url: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=1200&q=80",
    content: `## Cuidar antes para não gastar o dobro depois

Estudos apontam que consertos emergenciais custam até 3 a 4 vezes mais do que rotinas periódicas de manutenção preventiva.

### O que não pode faltar no cronograma:
* **Bombas de recalque e caixas d'água**: Limpeza e impermeabilização periódicas.
* **Para-raios e SPDA**: Vistorias anuais com emissão de laudo técnico.
* **Instalações de gás e segurança contra incêndio**: Recarga de extintores e testes em mangueiras.

Ter um calendário automatizado com a assessoria da Alpha garante que nenhum prazo legal ou técnico seja esquecido.`,
  },
  "assembleias-condominiais-eficientes": {
    id: "assembleias-condominiais-eficientes",
    title: "Assembleia de condomínio eficiente: convocações, quórum e decisões sem atrito",
    slug: "assembleias-condominiais-eficientes",
    excerpt: "Boas práticas de condução para tornar as reuniões produtivas, respeitosas e juridicamente seguras.",
    meta_description: "Dicas para realizar assembleias condominiais ágeis e sem conflitos.",
    published_at: "2026-10-10T12:00:00.000Z",
    image_url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80",
    content: `## Como transformar reuniões desgastantes em momentos de decisão

As assembleias não precisam ser cansativas ou conflituosas. Com organização prévia e pautas bem definidas, as deliberações tornam-se rápidas e objetivas.

### Dicas de ouro:
1. **Envio antecipado da pauta com materiais explicativos**: Quando os condôminos já chegam sabendo os custos e orçamentos, o tempo de discussão cai pela metade.
2. **Tempo pré-determinado por assunto**: Estabelecer limites saudáveis de fala mantém o foco no que realmente importa.
3. **Ata redigida e registrada com rapidez**: Enviar a ata logo nos dias seguintes evita dúvidas sobre o que foi pactuado.`,
  },
};

const postQuery = (slug: string) =>
  queryOptions({
    queryKey: ["blog-post", slug],
    queryFn: async (): Promise<Post | null> => {
      try {
        const firebasePost = await getBlogPostBySlug(slug);
        if (firebasePost) return firebasePost;
        return fallbackPostsMap[slug] ?? null;
      } catch (err) {
        return fallbackPostsMap[slug] ?? null;
      }
    },
  });

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ context, params }) => {
    const post = await context.queryClient.ensureQueryData(postQuery(params.slug));
    if (!post) throw notFound();
    return post;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? "Artigo"} | Blog Alpha` },
      { name: "description", content: loaderData?.meta_description ?? "" },
      { property: "og:title", content: loaderData?.title ?? "" },
      { property: "og:description", content: loaderData?.meta_description ?? "" },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BlogPost,
});

function BlogPost() {
  const { slug } = Route.useParams();
  const { data: post } = useSuspenseQuery(postQuery(slug));
  if (!post) return null;

  return (
    <div className="min-h-screen">
      <header className="bg-navy text-ivory">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <Link to="/" aria-label="Alpha Soluções Condominiais" className="block">
            <img src="/alpha-logo.png" alt="Alpha Soluções Condominiais" className="h-12 md:h-14 w-auto object-contain" />
          </Link>
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm opacity-80 transition hover:opacity-100">
            <ArrowLeft className="h-4 w-4" /> Todos os artigos
          </Link>
        </nav>
        <div className="mx-auto max-w-3xl px-6 pb-16 pt-10">
          <p className="text-xs text-slate">
            {new Date(post.published_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
          <h1 className="mt-4 text-3xl leading-tight md:text-4xl">{post.title}</h1>
          <p className="mt-4 font-light text-mist">{post.excerpt}</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        {post.image_url && (
          <div className="mb-10 overflow-hidden rounded-md shadow-sm border border-slate/10">
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full max-h-[460px] object-cover"
            />
          </div>
        )}

        <article className="prose prose-neutral max-w-none leading-relaxed text-foreground [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_h3]:mt-6 [&_h3]:font-display [&_h3]:text-xl [&_p]:mt-4 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mt-1.5 [&_blockquote]:border-l-4 [&_blockquote]:border-gold [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </article>

        <div className="mt-16 rounded-sm bg-navy p-8 text-ivory">
          <h2 className="text-xl">Quer uma gestão assim no seu condomínio?</h2>
          <p className="mt-3 text-sm font-light text-mist">
            A Alpha cuida da parte administrativa, financeira e operacional do seu condomínio com transparência e tecnologia própria.
          </p>
          <a
            href="https://wa.me/5583996806325"
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center justify-center rounded-sm bg-ivory px-6 py-3 text-sm font-medium text-navy transition hover:bg-slate"
          >
            Solicite uma Proposta
          </a>
        </div>
      </main>
    </div>
  );
}
