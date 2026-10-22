import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ArrowRight } from "lucide-react";

type PostListItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  topic: string;
  published_at: string;
};

const postsQuery = queryOptions({
  queryKey: ["blog-posts"],
  queryFn: async (): Promise<PostListItem[]> => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("id, title, slug, excerpt, topic, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
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
          <Link to="/" className="font-display text-xl tracking-[0.2em]">ALPHA</Link>
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                to="/blog/$slug"
                params={{ slug: post.slug }}
                className="group flex flex-col rounded-sm bg-card p-8 transition hover:shadow-elegant"
              >
                <p className="text-xs text-muted-foreground">{formatDate(post.published_at)}</p>
                <h2 className="mt-3 text-xl leading-snug">{post.title}</h2>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-navy">
                  Ler artigo <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
