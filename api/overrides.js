export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = req.query.user || (req.body && req.body.user);
  const pass = req.query.pass || (req.body && req.body.pass);
  if (user !== process.env.DASHBOARD_USER || pass !== process.env.DASHBOARD_PASS) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const SUPA_URL = process.env.SUPA_URL;
  const SUPA_SECRET = process.env.SUPA_SECRET || process.env.SUPA_KEY;
  const headers = {
    'apikey': SUPA_SECRET,
    'Authorization': `Bearer ${SUPA_SECRET}`,
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates,return=minimal'
  };

  if (req.method === 'GET') {
    // retorna todos os overrides
    const r = await fetch(`${SUPA_URL}/rest/v1/categorias_override?select=*&limit=5000`, { headers });
    const data = await r.json();
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { chave, tipo, categoria, descricao } = req.body;
    if (!chave || !tipo) return res.status(400).json({ error: 'chave e tipo obrigatórios' });
    const r = await fetch(`${SUPA_URL}/rest/v1/categorias_override?on_conflict=chave`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ chave, tipo, categoria: categoria || null, descricao: descricao || null, updated_at: new Date().toISOString() })
    });
    return res.status(r.ok ? 200 : 500).json({ ok: r.ok });
  }

  return res.status(405).end();
}
