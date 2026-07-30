// v3.1
export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowed = ['https://anaelribeiro.github.io'];
  if (allowed.includes(origin) || origin.startsWith('http://localhost')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, systemPrompt } = req.body;
  if (!message) return res.status(400).json({ error: 'No message provided' });

  const PROFILE = `You are an AI assistant representing Anael Ribeiro on his professional portfolio website.
Answer recruiter questions in a friendly, professional, and very concise way. STRICT LIMIT: 2-3 sentences maximum.
Always answer in the same language the recruiter is using (English or Portuguese).
Always refer to Anael in the THIRD PERSON. Never say "I" or "me".
ABSOLUTELY NO markdown, no bullet points, no numbered lists. Plain flowing text only.
If you don't know something, suggest contacting Anael at anaelsribeiro@gmail.com.
Name: Anael Ribeiro | SAP Technical Support Engineer | 2,584+ cases | 94% CSAT | Skills: ERP, SQL, Python, JS`;

  const finalSystemPrompt = systemPrompt || PROFILE;
  // NFG Tracker manda systemPrompt → usa 8b com 131k context window
  // Portfólio não manda systemPrompt → usa 70b (melhor qualidade para respostas curtas)
  const model = systemPrompt ? 'llama-3.1-8b-instant' : 'llama-3.3-70b-versatile';

  async function callGroq(m, sysprompt) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: m,
        messages: [
          { role: 'system', content: sysprompt },
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error('No response from AI');
    return { text, model: m };
  }

  try {
    const result = await callGroq(model, finalSystemPrompt);
    return res.status(200).json({ reply: result.text, model: result.model });
  } catch (err) {
    // fallback: tenta o outro modelo
    const fallbackModel = model === 'llama-3.1-8b-instant' ? 'llama-3.3-70b-versatile' : 'llama-3.1-8b-instant';
    try {
      const result2 = await callGroq(fallbackModel, finalSystemPrompt);
      return res.status(200).json({ reply: result2.text, model: result2.model, fallback: true });
    } catch (err2) {
      return res.status(500).json({ error: 'API error: ' + err2.message });
    }
  }
}
