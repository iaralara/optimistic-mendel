import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
};

const postQuery = (slug: string) =>
  queryOptions({
    queryKey: ["blog-post", slug],
    queryFn: async (): Promise<Post | null> => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, content, meta_description, published_at")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      if (error) throw error;
      return data;
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
          <Link to="/" className="font-display text-xl tracking-[0.2em]">ALPHA</Link>
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

      <main className="mx-auto max-w-3xl px-6 py-16">
        <article className="prose prose-neutral max-w-none leading-relaxed text-foreground [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_p]:mt-4 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mt-1">
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
