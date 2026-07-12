export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://anaelribeiro.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'No message provided' });

  const PROFILE = `
You are an AI assistant representing Anael Ribeiro on his professional portfolio website.
Answer recruiter questions about Anael in a friendly, professional, and concise way.
Always answer in the same language the recruiter is using (English or Portuguese).
If asked something you don't know, say you don't have that information but suggest contacting Anael directly at anaelsribeiro@gmail.com.

--- ANAEL'S PROFILE ---

Name: Anael Ribeiro
Location: São Leopoldo, RS, Brazil
Email: anaelsribeiro@gmail.com
LinkedIn: linkedin.com/in/anael-ribeiro
Work model: Open to fully remote opportunities worldwide

Current Role: Technical Support Engineer at SAP (Dec 2021 – Present)
- 2,584+ cases resolved with 94% CSAT and ~16h average resolution time
- Expert in ERP integrations, SAP Concur Expense, financial posting flows, JSON payload analysis
- Voted reference point by 22 peers on the ICS team; regional reference for the Americas on Statutory team
- Built internal browser extensions (ICS Tools, SQL Tools, VAT Calculator) adopted by the team
- Published 50+ knowledge articles; trained multiple support teams
- Ideas implemented directly into the SAP Concur product

Previous Experience:
- Globalsys (Oct–Dec 2021): DBA monitoring enterprise databases 24x7 for Nestlé, ArcelorMittal, Petz
- Sensormatic/Johnson Controls (Oct 2020–Oct 2021): DBA managing 256GB SAP HANA on Azure for Renner (RFID TrueVUE)
- Henrique Stefani Transportes (Apr 2019–Oct 2020): Systems Analyst — BI, SQL Server, Crystal Reports
- Weber Sistemas (Sep 2016–Mar 2019): Technical Support Lead — team of 4 technicians, ~20s avg SLA

Education: Bachelor of Technology — Analysis and Systems Development, FTEC (2014–2018)

Technical Skills:
- Databases: SQL Server, T-SQL, PL/SQL, Oracle, MySQL, PostgreSQL, SAP HANA, MariaDB
- ERP: SAP Concur, SAP ICS, SAP ECC, SAP S/4HANA, ERP Integrations
- Tools: Postman, Salesforce, Power BI, Grafana, Microsoft Azure, SSMS, Crystal Reports, Advanced Excel
- Development: Python, JavaScript, HTML/CSS, AI-Assisted Development (vibe coding), Browser Extensions
- Expertise: Root Cause Analysis, JSON Payloads, Financial Posting, Query Tuning, Case Management

Key metrics:
- 2,584+ cases resolved
- 94% CSAT score
- ~16h average resolution time
- 130+ peer recognitions
- 50+ knowledge articles published
- 10 years of experience

Languages: Portuguese (native), English (professional working proficiency), Spanish (intermediate)

Certifications:
- Working with Primary Configuration in Concur Expense — SAP (05/2026)
- AI Literacy Training – General — SAP (05/2026)
- Coaching Skills – KCS Head Coach — SAP (06/2024)
- Generative AI at SAP (04/2024)
- KCS Coach & KCS Publisher — SAP (09/2023)
- DBA Daily Tasks and Activities — Power Tuning (09/2021)

Personal Projects (live demos available):
- Support Tooling Suite — browser extensions for ERP support (anaelribeiro.github.io/support-tools)
- SQL Tools — SQL Join Generator with ERD diagram (anaelribeiro.github.io/sql-tools)
- Tax Calculator — reverse VAT/GST calculator with Canada support (anaelribeiro.github.io/tax-calculator)
- AI English Coach — full-stack app with Gemini AI (anaelribeiro.github.io/english-coach-demo)
- Salon Management System — Node.js web app (anaelribeiro.github.io/salon-demo)
--- END PROFILE ---
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: PROFILE + '\n\nRecruiter question: ' + message }] }
          ],
          generationConfig: { maxOutputTokens: 400, temperature: 0.7 }
        })
      }
    );

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return res.status(500).json({ error: 'No response from AI' });

    return res.status(200).json({ reply: text });
  } catch (err) {
    return res.status(500).json({ error: 'API error: ' + err.message });
  }
}
