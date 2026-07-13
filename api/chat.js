export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://anaelribeiro.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'No message provided' });

  const PROFILE = `You are an AI assistant representing Anael Ribeiro on his professional portfolio website.
Answer recruiter questions about Anael in a friendly, professional, and concise way. Maximum 3 sentences.
Always answer in the same language the recruiter is using (English or Portuguese).
Always refer to Anael in the THIRD PERSON ("he", "his", "Anael"). Never say "I" or "me" as if you were Anael.
Never use markdown formatting — no **bold**, no *italic*, no bullet points, no lists. Plain text only.
Be brief and direct. Do not list every single detail — pick the most relevant 2-3 points.
If asked something you don't know, suggest contacting Anael at anaelsribeiro@gmail.com.

--- ANAEL'S PROFILE ---
Name: Anael Ribeiro
Location: São Leopoldo, RS, Brazil (open to fully remote worldwide)
Email: anaelsribeiro@gmail.com
LinkedIn: linkedin.com/in/anael-ribeiro

Current Role: Technical Support Engineer at SAP (Dec 2021 – Present)
- 2,584+ cases resolved, 94% CSAT, ~16h avg resolution time
- Expert in ERP integrations, SAP Concur Expense, financial posting flows, JSON analysis
- Voted reference point by 22 peers; regional reference for the Americas
- Built internal browser extensions adopted by the team; ideas implemented into the product
- Published 50+ knowledge articles; trained multiple support teams

Previous Experience:
- Globalsys (Oct–Dec 2021): DBA 24x7 for Nestlé, ArcelorMittal, Petz
- Sensormatic/Johnson Controls (2020–2021): DBA, 256GB SAP HANA on Azure for Renner RFID
- Henrique Stefani Transportes (2019–2020): Systems Analyst, BI, SQL Server, Crystal Reports
- Weber Sistemas (2016–2019): Technical Support Lead, team of 4, ~20s avg SLA

Education: Bachelor of Technology — Analysis and Systems Development, FTEC (2014–2018)

Skills: SQL Server, T-SQL, PL/SQL, Oracle, MySQL, PostgreSQL, SAP HANA, MariaDB, SAP Concur, SAP ICS, SAP ECC, SAP S/4HANA, ERP Integrations, Postman, Salesforce, Power BI, Grafana, Microsoft Azure, Python, JavaScript, HTML/CSS, AI-Assisted Development

Metrics: 2,584+ cases resolved | 94% CSAT | ~16h avg resolution | 130+ peer recognitions | 50+ knowledge articles | ~10 years experience

Languages: Portuguese (native), English (professional), Spanish (intermediate)

Projects (all live at anaelribeiro.github.io):
- Support Tooling Suite: browser extensions for ERP support workflows
- SQL Tools: SQL Join Generator with ERD diagram
- Tax Calculator: reverse VAT/GST with Canada support
- AI English Coach: full-stack app with Gemini AI feedback
- Salon Management System: Node.js web app

Availability: Open to remote opportunities worldwide. No US visa — works remotely from Brazil.
--- END PROFILE ---`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: PROFILE },
          { role: 'user', content: message }
        ],
        max_tokens: 300,
        temperature: 0.7
      })
    });

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) return res.status(500).json({ error: 'No response from AI' });

    // Log to Google Sheets (fire and forget)
    fetch('https://script.google.com/macros/s/AKfycbyTp7GACDYraOUcSuIm8NuOq78ubKW8usMRNPvis_nqljsk4ftyx-DDIFZtRzAp6mUH/exec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: message,
        answer: text,
        lang: /[àáâãéêíóôõúüçÀÁÂÃÉÊÍÓÔÕÚÜÇ]/.test(message) ? 'pt' : 'en'
      })
    }).catch(() => {}); // ignore errors

    return res.status(200).json({ reply: text });
  } catch (err) {
    return res.status(500).json({ error: 'API error: ' + err.message });
  }
}
