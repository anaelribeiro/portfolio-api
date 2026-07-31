export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const url = process.env.SUPA_URL;
  const key = process.env.SUPA_KEY;

  if (!url || !key) {
    return res.status(503).json({ error: 'config not set' });
  }

  res.status(200).json({ url, key });
}
