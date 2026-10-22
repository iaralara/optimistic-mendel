import { createFileRoute } from '@tanstack/react-router'

const CHAT_SYSTEM_PROMPT = `Você é a IA de Atendimento Inteligente da Alpha Soluções Condominiais, localizada em João Pessoa - PB.
Seu objetivo é atender síndicos, condôminos, conselheiros e pessoas interessadas em gestão condominial ou no setor imobiliário (compra, venda e locação).

Informações sobre a Alpha Soluções Condominiais:
- Atendimento humanizado, transparente e com tecnologia de ponta.
- Gestão completa: Síndico Profissional especializado, Implantação Condominial (AGI, vistoria de áreas comuns e transição de construtora), Gestão Administrativa, Financeira, Operacional, Jurídica, Assembleias e Reuniões, Consultoria e Planejamento, além do Setor Imobiliário (compra, venda e locação de imóveis).
- Equipe de liderança:
  * Priscila Carvalho: Planejamento e Gestão Condominial
  * Maiara Lara: Financeiro e RH
  * Iara Lara: Contratos, Inovação e Tecnologia
  * Ranielly Rocha: Responsável Técnica
- Contatos: Telefones/WhatsApp: (83) 99680-6325 e (83) 99688-5931. E-mail: alphaadmsc@gmail.com. Instagram: @alphaadmsc.
- Localização: João Pessoa – PB.
- Diferencial: Sistema próprio e ágil via Web/PWA (acesso por QR Code para atas, 2ª via de boleto, reservas de áreas comuns, transparência financeira).

Diretrizes de resposta:
- Responda sempre em português brasileiro de forma educada, prestativa, profissional e acolhedora.
- Seja objetivo e claro nas respostas (respostas entre 2 a 5 frases ou tópicos curtos).
- Se a pessoa quiser uma proposta personalizada, orçamento ou agendar uma reunião, colete cordialmente o nome do condomínio / número de unidades e recomende falar diretamente com a equipe pelo WhatsApp (83) 99680-6325.
`

export const Route = createFileRoute('/api/chat')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json()
          const messages = body.messages || []

          const apiKey = process.env['GEMINI_API_KEY'] || process.env['LOVABLE_API_KEY']
          if (!apiKey) {
            return Response.json(
              { error: 'Chave GEMINI_API_KEY não configurada no servidor.' },
              { status: 500 }
            )
          }

          // Converter mensagens para o formato do Gemini
          const contents = messages.map((m: { sender: string; text: string }) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }],
          }))

          const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`

          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: CHAT_SYSTEM_PROMPT }],
              },
              contents: contents,
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 800,
              },
            }),
          })

          if (!res.ok) {
            const errText = await res.text()
            console.error('Gemini Chat Error:', errText)
            return Response.json(
              { error: 'Erro ao se comunicar com o modelo Gemini.' },
              { status: 502 }
            )
          }

          const data = await res.json()
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Desculpe, não consegui processar sua mensagem no momento.'

          return Response.json({ reply })
        } catch (err: any) {
          console.error('Chat endpoint error:', err)
          return Response.json({ error: err.message || 'Erro interno' }, { status: 500 })
        }
      },
    },
  },
})
