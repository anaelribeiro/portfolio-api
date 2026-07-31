export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = req.query.user;
  const pass = req.query.pass;

  const validUser = process.env.DASHBOARD_USER;
  const validPass = process.env.DASHBOARD_PASS;

  if (!validUser || !validPass) {
    return res.status(503).json({ error: 'auth not configured' });
  }

  if (user !== validUser || pass !== validPass) {
    return res.status(401).json({ error: 'invalid credentials' });
  }

  const url = process.env.SUPA_URL;
  const key = process.env.SUPA_KEY;

  if (!url || !key) {
    return res.status(503).json({ error: 'config not set' });
  }

  res.status(200).json({ url, key });
}
