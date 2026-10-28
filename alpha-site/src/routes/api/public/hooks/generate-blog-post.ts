import { createFileRoute } from '@tanstack/react-router';
import { getBlogPosts, insertBlogPost } from '@/integrations/firebase/client';

const TOPICS = [
  'Como reduzir a inadimplência no condomínio de forma preventiva e amigável',
  'Prestação de contas condominial: o que o síndico deve apresentar e quando',
  'Assembleia geral ordinária: como convocar, quórum e erros mais comuns',
  'Manutenção preventiva de áreas comuns: plano anual que economiza dinheiro',
  'Como escolher uma administradora de condomínios: checklist para síndicos',
  'Reserva de áreas comuns: regras claras evitam conflitos entre moradores',
  'Planejamento orçamentário anual do condomínio passo a passo',
  'Comunicação entre síndico e moradores: canais e boas práticas',
  'Segurança jurídica na gestão de contratos de fornecedores do condomínio',
  'Tecnologia na gestão condominial: o que uma plataforma digital precisa ter',
  'Fundo de reserva: quanto guardar e como justificar para os condôminos',
  'Gestão de conflitos entre vizinhos: o papel da administradora',
  'Individualização de hidrômetros e gás: economia e justiça no rateio',
  'Portaria remota versus presencial: prós, contras e viabilidade para condomínios',
  'Sustentabilidade em condomínios: energia solar, coleta seletiva e economia',
];

const CURATED_IMAGES = [
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80',
];

const SYSTEM_PROMPT = `Você é redatora especialista do blog da Alpha Soluções Condominiais, administradora de condomínios de alto padrão de João Pessoa - PB. 
Escreva artigos em português brasileiro com tom altamente profissional, acolhedor e didático, voltados a síndicos, conselheiros e moradores. 
O artigo deve ser útil, prático e confiável, trazendo soluções reais para o dia a dia condominial brasileiro.
Não invente leis nem números de artigos do Código Civil se não tiver certeza; foque em boas práticas de governança, transparência e redução de custos. 
Estruture o conteúdo em formato Markdown com subtítulos (##), listas e um encerramento convidando o leitor a conhecer a Alpha Soluções Condominiais.
Responda ESTRITAMENTE em formato JSON com o seguinte formato:
{
  "title": "Título atraente até 70 caracteres",
  "slug": "slug-url-em-minusculas-sem-acentos",
  "excerpt": "Resumo de 1 a 2 frases para o card do blog",
  "meta_description": "Descrição otimizada para SEO de até 160 caracteres",
  "content": "Artigo completo em Markdown de 600 a 900 palavras"
}`;

function sanitizeSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

async function generateWithGemini(topic: string, apiKey: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: SYSTEM_PROMPT },
            { text: `Escreva um artigo de blog sobre o tema: "${topic}". Responda somente com o JSON válido sem bloco de markdown em volta.` },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Gemini API error [${response.status}]: ${errorText}`);
  }

  const json = await response.json();
  const candidateText = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!candidateText) {
    throw new Error('Gemini retornou resposta vazia');
  }

  return candidateText;
}

async function handleBlogGeneration(request: Request) {
  const isVercelCron = request.headers.get('x-vercel-cron') === '1';
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env['CRON_SECRET'] || process.env['LOVABLE_CRON_SECRET'];

  // Permite execução via cron da Vercel, Bearer token, ou requisição manual se não houver CRON_SECRET estrito
  if (!isVercelCron && cronSecret) {
    const url = new URL(request.url);
    const secretQuery = url.searchParams.get('secret');
    if (authHeader !== `Bearer ${cronSecret}` && secretQuery !== cronSecret) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const apiKey = process.env['GEMINI_API_KEY'] || process.env['LOVABLE_API_KEY'];
  if (!apiKey) {
    return Response.json({ error: 'GEMINI_API_KEY não configurada no servidor' }, { status: 500 });
  }

  try {
    // 1. Busca quantidade de posts para definir o próximo tema de forma cíclica
    const existingPosts = await getBlogPosts();
    const count = existingPosts.length;
    const topic = TOPICS[count % TOPICS.length] ?? 'Boas práticas de gestão condominial';
    const selectedImage = CURATED_IMAGES[count % CURATED_IMAGES.length];

    // 2. Gera o artigo via Gemini
    const raw = await generateWithGemini(topic, apiKey);
    const post = JSON.parse(raw) as {
      title: string;
      slug: string;
      excerpt: string;
      meta_description: string;
      content: string;
    };

    let slug = sanitizeSlug(post.slug || post.title);
    if (existingPosts.some((p) => p.slug === slug)) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    // 3. Salva no Firebase Firestore
    const inserted = await insertBlogPost({
      title: post.title,
      slug,
      excerpt: post.excerpt,
      meta_description: post.meta_description,
      content: post.content,
      topic,
      status: 'published',
      published_at: new Date().toISOString(),
      image_url: selectedImage,
    });

    return Response.json({
      success: true,
      message: 'Artigo gerado com sucesso via Gemini e salvo no Firebase da Alpha.',
      post: {
        id: inserted.id,
        title: inserted.title,
        slug: inserted.slug,
        topic: inserted.topic,
        published_at: inserted.published_at,
      },
    });
  } catch (error) {
    console.error('[Blog Generation Error]:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Falha na geração do artigo com IA' },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute('/api/public/hooks/generate-blog-post')({
  server: {
    handlers: {
      // Vercel Cron dispara via GET
      GET: async ({ request }) => {
        return handleBlogGeneration(request);
      },
      // Permite também disparo via POST
      POST: async ({ request }) => {
        return handleBlogGeneration(request);
      },
    },
  },
});
