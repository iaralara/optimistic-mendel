import { createFileRoute } from '@tanstack/react-router'

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
]

const SYSTEM_PROMPT = `Você é redatora do blog da Alpha Soluções Condominiais, administradora de condomínios de João Pessoa - PB. 
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
}`

function sanitizeSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

async function generateWithGemini(topic: string, apiKey: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`

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
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Google Gemini API error [${response.status}]: ${errorText}`)
  }

  const json = await response.json()
  const candidateText = json.candidates?.[0]?.content?.parts?.[0]?.text
  if (!candidateText) {
    throw new Error('Gemini retornou resposta vazia')
  }

  return candidateText
}

export const Route = createFileRoute('/api/public/hooks/generate-blog-post')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Validação de segurança simples (Bearer token ou Cron header da Vercel)
        const isVercelCron = request.headers.get('x-vercel-cron') === '1'
        const authHeader = request.headers.get('authorization')
        const cronSecret = process.env['CRON_SECRET'] || process.env['LOVABLE_CRON_SECRET']

        if (!isVercelCron) {
          if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 })
          }
        }

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

        // Chave do Gemini configurada nas variáveis de ambiente
        const apiKey = process.env['GEMINI_API_KEY'] || process.env['LOVABLE_API_KEY']
        if (!apiKey) {
          return Response.json({ error: 'GEMINI_API_KEY não configurada' }, { status: 500 })
        }

        const { count } = await supabaseAdmin
          .from('blog_posts')
          .select('id', { count: 'exact', head: true })
        const topic = TOPICS[(count ?? 0) % TOPICS.length] ?? 'Boas práticas de gestão condominial'

        try {
          const raw = await generateWithGemini(topic, apiKey)
          const post = JSON.parse(raw) as {
            title: string
            slug: string
            excerpt: string
            meta_description: string
            content: string
          }

          let slug = sanitizeSlug(post.slug || post.title)
          const { data: clash } = await supabaseAdmin
            .from('blog_posts')
            .select('id')
            .eq('slug', slug)
            .limit(1)
          if (clash && clash.length > 0) {
            slug = `${slug}-${Date.now().toString(36)}`
          }

          const { data: inserted, error: insertError } = await supabaseAdmin
            .from('blog_posts')
            .insert({
              title: post.title,
              slug,
              excerpt: post.excerpt,
              meta_description: post.meta_description,
              content: post.content,
              topic,
              status: 'published',
            })
            .select('id, title, slug')
            .single()

          if (insertError) {
            return Response.json({ error: insertError.message }, { status: 500 })
          }

          return Response.json({ success: true, post: inserted })
        } catch (error) {
          console.error('Blog generation failed:', error)
          return Response.json(
            { error: error instanceof Error ? error.message : 'Falha na geração com Gemini' },
            { status: 502 },
          )
        }
      },
      // Permite testar via GET diretamente no navegador caso queira disparar manualmente
      GET: async ({ request }) => {
        return Response.json({ status: 'Endpoint autônomo do Gemini pronto para execução.' })
      },
    },
  },
})
