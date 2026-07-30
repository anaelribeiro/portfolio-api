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
Answer recruiter questions in a friendly, professional, and very concise way. STRICT LIMIT: 2-3 sentences maximum. No exceptions.
Always answer in the same language the recruiter is using (English or Portuguese).
Always refer to Anael in the THIRD PERSON. Never say "I" or "me".
ABSOLUTELY NO markdown, no bullet points, no numbered lists, no dashes. Plain flowing text only.
If you don't know something, suggest contacting Anael at anaelsribeiro@gmail.com.

--- ANAEL'S PROFILE ---
Name: Anael Ribeiro
Location: São Leopoldo, RS, Brazil (open to fully remote worldwide)
Email: anaelsribeiro@gmail.com
LinkedIn: linkedin.com/in/anael-ribeiro
Current Role: Technical Support Engineer at SAP (Dec 2021 – Present)
- 2,584+ cases resolved, 94% CSAT, ~16h avg resolution time
- Expert in ERP integrations, SAP Concur Expense, financial posting flows, JSON analysis
Skills: ERP Integrations, SQL Server, T-SQL, PL/SQL, Oracle, MySQL, PostgreSQL, SAP HANA, Python, JavaScript, HTML/CSS, AI-Assisted Development
Metrics: 2,584+ cases resolved | 94% CSAT | ~16h avg resolution | 130+ peer recognitions
Languages: Portuguese (native), English (professional), Spanish (professional)
--- END PROFILE ---`;

  const finalSystemPrompt = systemPrompt || PROFILE;

  async function callGroq(model, sysprompt) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
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
    return text;
  }

  try {
    // Tentativa 1: llama-3.3-70b com contexto completo
    const text = await callGroq('llama-3.3-70b-versatile', finalSystemPrompt);
    return res.status(200).json({ reply: text, model: 'llama-3.3-70b-versatile' });
  } catch (err1) {
    const isContextError = /context|token|length|limit|413/i.test(err1.message);
    if (isContextError && systemPrompt) {
      // Fallback: llama-3.1-8b com resumo agregado (sem base completa)
      try {
        const lines = systemPrompt.split('\n');
        const resumo = lines.slice(0, 20).join('\n') + '\n(contexto resumido por limite de tokens)';
        const text2 = await callGroq('llama-3.1-8b-instant', resumo);
        return res.status(200).json({ reply: text2, model: 'llama-3.1-8b-instant', fallback: true });
      } catch (err2) {
        return res.status(500).json({ error: 'Falha nos dois modelos: ' + err2.message });
      }
    }
    return res.status(500).json({ error: 'API error: ' + err1.message });
  }
}
