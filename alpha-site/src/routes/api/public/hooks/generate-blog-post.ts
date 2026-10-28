import { createFileRoute } from '@tanstack/react-router';
import { getBlogPosts, insertBlogPost } from '@/integrations/firebase/client';

export type TopicPreset = {
  tag: string;
  topic: string;
  image: string;
};

// Imagens já consagradas no site (4 originais + 1 primeiro artigo publicado) para NUNCA repetir
const BASELINE_USED_PHOTOS = new Set([
  '1497366216548-37526070297c', // Prestação de Contas (fallback original)
  '1554224155-8d04cb21cd6c', // Gestão Financeira (fallback original)
  '1582407947304-fd86f028f716', // Manutenção Preventiva (fallback original)
  '1517245386807-bb43f82c33c4', // Assembleias (fallback original)
  '1545324418-cc1a3fa10c00', // Inadimplência no Condomínio (publicado no Firebase)
]);

const BASELINE_USED_TAGS = new Set([
  'prestação de contas',
  'gestão financeira',
  'manutenção',
  'assembleias',
  'inadimplência',
]);

// Catálogo com temas inéditos e fotos 100% exclusivas (nenhuma foto repetida)
const TOPIC_PRESETS: TopicPreset[] = [
  {
    tag: 'Administração',
    topic: 'Como escolher uma administradora de condomínios: checklist para síndicos',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
  },
  {
    tag: 'Convivência',
    topic: 'Reserva de áreas comuns: regras claras evitam conflitos entre moradores',
    image: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1200&q=80',
  },
  {
    tag: 'Orçamento',
    topic: 'Planejamento orçamentário anual do condomínio passo a passo',
    image: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80',
  },
  {
    tag: 'Comunicação',
    topic: 'Comunicação entre síndico e moradores: canais e boas práticas',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
  },
  {
    tag: 'Jurídico',
    topic: 'Segurança jurídica na gestão de contratos de fornecedores do condomínio',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80',
  },
  {
    tag: 'Tecnologia',
    topic: 'Tecnologia na gestão condominial: o que uma plataforma digital precisa ter',
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
  },
  {
    tag: 'Fundo de Reserva',
    topic: 'Fundo de reserva: quanto guardar e como justificar para os condôminos',
    image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80',
  },
  {
    tag: 'Mediação',
    topic: 'Gestão de conflitos entre vizinhos: o papel da administradora',
    image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=80',
  },
  {
    tag: 'Sustentabilidade',
    topic: 'Sustentabilidade em condomínios: energia solar, coleta seletiva e economia',
    image: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1200&q=80',
  },
  {
    tag: 'Segurança',
    topic: 'Portaria remota versus presencial: prós, contras e viabilidade para condomínios',
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80',
  },
  {
    tag: 'Lazer e Social',
    topic: 'Valorização de áreas de lazer: como manter o condomínio atrativo e seguro',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
  },
  {
    tag: 'Espaço Gourmet',
    topic: 'Regulamento de salão de festas e espaço gourmet: convivência sem atritos',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
  },
  {
    tag: 'Áreas Verdes',
    topic: 'Paisagismo e conservação de jardins em condomínios residenciais',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
  },
  {
    tag: 'Garagem',
    topic: 'Regras de uso de vagas de garagem e veículos elétricos no condomínio',
    image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80',
  },
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

function extractUnsplashPhotoId(url: string): string {
  const match = url.match(/photo-([a-zA-Z0-9_-]+)/);
  return match ? match[1] : url;
}

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
  const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

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

      if (response.ok) {
        const json = await response.json();
        const candidateText = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidateText) {
          return candidateText;
        }
      } else {
        const errorText = await response.text();
        lastError = new Error(`Google Gemini [${model}] error [${response.status}]: ${errorText}`);
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new Error('Falha ao comunicar com os modelos Gemini');
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
    // 1. Identifica TODAS as fotos e temas já usados (Firebase + Artigos originais do site)
    const existingPosts = await getBlogPosts();
    const usedPhotoIds = new Set<string>(BASELINE_USED_PHOTOS);
    const usedTags = new Set<string>(BASELINE_USED_TAGS);

    for (const p of existingPosts) {
      if (p.image_url) {
        usedPhotoIds.add(extractUnsplashPhotoId(p.image_url));
      }
      if (p.topic) {
        usedTags.add(p.topic.trim().toLowerCase());
      }
    }

    // 2. Encontra o próximo tema e foto que NUNCA foram usados no site
    let selectedPreset = TOPIC_PRESETS.find((p) => {
      const photoId = extractUnsplashPhotoId(p.image);
      const isTagNew = !usedTags.has(p.tag.trim().toLowerCase());
      const isPhotoNew = !usedPhotoIds.has(photoId);
      return isTagNew && isPhotoNew;
    });

    // Se todos os temas já foram publicados ao longo dos meses, reinicia ciclando
    if (!selectedPreset) {
      selectedPreset = TOPIC_PRESETS.find((p) => {
        const photoId = extractUnsplashPhotoId(p.image);
        return !usedPhotoIds.has(photoId);
      });
    }

    if (!selectedPreset) {
      selectedPreset = TOPIC_PRESETS[existingPosts.length % TOPIC_PRESETS.length];
    }

    // 3. Gera o artigo inédito via Gemini com fallback automático
    const raw = await generateWithGemini(selectedPreset.topic, apiKey);
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

    // 4. Salva no Firebase com a foto exclusiva garantida
    const inserted = await insertBlogPost({
      title: post.title,
      slug,
      excerpt: post.excerpt,
      meta_description: post.meta_description,
      content: post.content,
      topic: selectedPreset.tag,
      status: 'published',
      published_at: new Date().toISOString(),
      image_url: selectedPreset.image,
    });

    return Response.json({
      success: true,
      message: 'Artigo gerado com sucesso via Gemini com imagem exclusiva e sem repetições.',
      post: {
        id: inserted.id,
        title: inserted.title,
        slug: inserted.slug,
        topic: inserted.topic,
        published_at: inserted.published_at,
        image_url: inserted.image_url,
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
      GET: async ({ request }) => {
        return handleBlogGeneration(request);
      },
      POST: async ({ request }) => {
        return handleBlogGeneration(request);
      },
    },
  },
});
