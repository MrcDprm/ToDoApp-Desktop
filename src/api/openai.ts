const GEMINI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'

export interface TaskPlan {
  steps: string[]
}

export async function generateTaskPlan(goal: string): Promise<TaskPlan> {
  if (!GEMINI_API_KEY) {
    throw new Error('API anahtarı bulunamadı. Lütfen .env dosyanıza VITE_OPENAI_API_KEY ekleyin.')
  }

  const response = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GEMINI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gemini-1.5-pro',
      messages: [
        {
          role: 'system',
          content:
            'Sen bir üretkenlik asistanısın. Kullanıcının verdiği hedefi, net ve eyleme geçirilebilir 5 adımlık bir eylem planına böl. Her adımı kısa ve somut tut. SADECE JSON formatında yanıt ver, başka hiçbir şey yazma: {"steps": ["adım 1", "adım 2", "adım 3", "adım 4", "adım 5"]}',
        },
        {
          role: 'user',
          content: `Şu hedef için 5 adımlık eylem planı oluştur: ${goal}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Gemini API hatası')
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content?.trim()

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('JSON bulunamadı')
    return JSON.parse(jsonMatch[0]) as TaskPlan
  } catch {
    throw new Error('AI yanıtı ayrıştırılamadı. Lütfen tekrar deneyin.')
  }
}
