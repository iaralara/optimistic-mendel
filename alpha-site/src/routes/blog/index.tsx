import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getBlogPosts } from "@/integrations/firebase/client";
import { ArrowLeft, ArrowRight } from "lucide-react";

type PostListItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  topic: string;
  published_at: string;
  image_url?: string;
};

const fallbackPosts: PostListItem[] = [
  {
    id: "prestacao-de-contas-condominio-transparencia",
    title: "Prestação de Contas no Condomínio: O Que Apresentar e Como Evitar Dores de Cabeça",
    slug: "prestacao-de-contas-condominio-transparencia",
    excerpt: "Descubra como transformar a prestação de contas em um momento de confiança e clareza entre síndicos, conselho fiscal e moradores.",
    topic: "Prestação de Contas",
    published_at: "2026-10-16T11:00:00.000Z",
    image_url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "guia-gestao-condominial-pratica",
    title: "Como otimizar a gestão financeira do seu condomínio com transparência",
    slug: "gestao-financeira-condominial-transparencia",
    excerpt: "Dicas práticas para síndicos e conselheiros reduzirem a inadimplência e apresentarem balancetes claros aos moradores.",
    topic: "Gestão Financeira",
    published_at: "2026-10-01T12:00:00.000Z",
    image_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "manutencao-preventiva-condominios",
    title: "Manutenção preventiva em condomínios: o plano anual que economiza dinheiro",
    slug: "manutencao-preventiva-condominios",
    excerpt: "Entenda por que a manutenção preventiva evita despesas extraordinárias e valoriza o patrimônio dos condôminos.",
    topic: "Manutenção",
    published_at: "2026-10-05T12:00:00.000Z",
    image_url: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "assembleias-condominiais-eficientes",
    title: "Assembleia de condomínio eficiente: convocações, quórum e decisões sem atrito",
    slug: "assembleias-condominiais-eficientes",
    excerpt: "Boas práticas de condução para tornar as reuniões produtivas, respeitosas e juridicamente seguras.",
    topic: "Assembleias",
    published_at: "2026-10-10T12:00:00.000Z",
    image_url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80",
  },
];

const postsQuery = queryOptions({
  queryKey: ["blog-posts"],
  queryFn: async (): Promise<PostListItem[]> => {
    try {
      const firebasePosts = await getBlogPosts();
      const mergedMap = new Map<string, PostListItem>();

      // Carrega os artigos base (incluindo artigos originais de segurança)
      for (const p of fallbackPosts) {
        mergedMap.set(p.slug, p);
      }

      // Mescla com os artigos do Firebase (adicionando os novos gerados)
      for (const p of firebasePosts) {
        mergedMap.set(p.slug, {
          ...mergedMap.get(p.slug),
          ...p,
        });
      }

      const allPosts = Array.from(mergedMap.values());
      allPosts.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
      return allPosts;
    } catch (err) {
      console.warn("[Blog] Falha ao consultar Firebase. Carregando modo fallback.", err);
      return fallbackPosts;
    }
  },
});

export const Route = createFileRoute("/blog/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(postsQuery),
  head: () => ({
    meta: [
      { title: "Blog | Alpha Soluções Condominiais" },
      { name: "description", content: "Artigos práticos sobre gestão condominial para síndicos, conselheiros e moradores, pela Alpha Soluções Condominiais de João Pessoa - PB." },
      { property: "og:title", content: "Blog Alpha Soluções Condominiais" },
      { property: "og:description", content: "Gestão condominial explicada de forma prática: inadimplência, assembleias, prestação de contas e muito mais." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BlogIndex,
});

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function BlogIndex() {
  const { data: posts } = useSuspenseQuery(postsQuery);

  return (
    <div className="min-h-screen">
      <header className="bg-navy text-ivory">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <Link to="/" aria-label="Alpha Soluções Condominiais" className="block">
            <img src="/alpha-logo.png" alt="Alpha Soluções Condominiais" className="h-12 md:h-14 w-auto object-contain" />
          </Link>
          <Link to="/" className="inline-flex items-center gap-2 text-sm opacity-80 transition hover:opacity-100">
            <ArrowLeft className="h-4 w-4" /> Voltar ao site
          </Link>
        </nav>
        <div className="mx-auto max-w-7xl px-6 pb-16 pt-10">
          <p className="eyebrow text-slate">Blog</p>
          <h1 className="mt-4 max-w-2xl text-3xl md:text-5xl">Gestão condominial, sem complicação</h1>
          <p className="mt-4 max-w-xl font-light text-mist">
            Artigos práticos para síndicos, conselheiros e moradores — escritos pela equipe Alpha com apoio da nossa inteligência artificial.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-16">
        {posts.length === 0 ? (
          <p className="text-muted-foreground">Em breve publicaremos nosso primeiro artigo. Volte em alguns dias!</p>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                to="/blog/$slug"
                params={{ slug: post.slug }}
                className="group flex flex-col overflow-hidden rounded-md bg-card transition hover:shadow-elegant border border-slate/10"
              >
                {post.image_url && (
                  <div className="aspect-[16/10] w-full overflow-hidden bg-muted">
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatDate(post.published_at)}</span>
                    {post.topic && (
                      <span className="rounded-full bg-slate/10 px-2.5 py-0.5 text-xs font-medium text-navy">
                        {post.topic}
                      </span>
                    )}
                  </div>
                  <h2 className="mt-3 text-xl font-medium leading-snug group-hover:text-gold transition-colors">
                    {post.title}
                  </h2>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                    {post.excerpt}
                  </p>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-navy">
                    Ler artigo <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
