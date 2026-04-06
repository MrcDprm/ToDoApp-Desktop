const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

export interface TaskPlan {
  steps: string[]
}

export async function generateTaskPlan(goal: string): Promise<TaskPlan> {
  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'Sen bir üretkenlik asistanısın. Kullanıcının verdiği hedefi, net ve eyleme geçirilebilir 5 adımlık bir eylem planına böl. Her adımı kısa ve somut tut. Sadece JSON formatında yanıt ver: {"steps": ["adım 1", "adım 2", "adım 3", "adım 4", "adım 5"]}',
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
    throw new Error(error.error?.message || 'OpenAI API hatası')
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content

  try {
    return JSON.parse(content) as TaskPlan
  } catch {
    throw new Error('AI yanıtı ayrıştırılamadı')
  }
}
