export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.luckyfaraonul.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  console.log("✅ Request primit de la Wix:", req.body);
  return res.status(200).json({ message: 'POST primit cu succes', body: req.body });
}
