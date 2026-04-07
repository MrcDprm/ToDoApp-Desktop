const GEMINI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY

export interface TaskPlan {
  steps: string[]
}

export async function generateTaskPlan(goal: string): Promise<TaskPlan> {
  if (!GEMINI_API_KEY) {
    throw new Error('API anahtarı bulunamadı. Lütfen .env dosyanıza VITE_OPENAI_API_KEY ekleyin.')
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `Sen bir üretkenlik asistanısın. Aşağıdaki hedef için net ve eyleme geçirilebilir 5 adımlık bir eylem planı oluştur. SADECE şu JSON formatında yanıt ver, başka hiçbir şey yazma:\n{"steps": ["adım 1", "adım 2", "adım 3", "adım 4", "adım 5"]}\n\nHedef: ${goal}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      },
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    const msg = error?.error?.message ?? `HTTP ${response.status}`
    throw new Error(`Gemini API hatası: ${msg}`)
  }

  const data = await response.json()
  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()

  if (!content) {
    throw new Error('Gemini boş yanıt döndürdü. Lütfen tekrar deneyin.')
  }

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('JSON bulunamadı')
    return JSON.parse(jsonMatch[0]) as TaskPlan
  } catch {
    throw new Error('AI yanıtı ayrıştırılamadı. Lütfen tekrar deneyin.')
  }
}
