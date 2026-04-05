const { renameUpload, deleteUpload } = require('../../../lib/db');
export default async function handler(req, res) {
  const { id, sourceName } = req.body || {};
  if (!id) return res.status(400).json({ error: 'Falta id' });
  try {
    if (req.method === 'PUT') { await renameUpload(id, sourceName); return res.json({ success: true }); }
    if (req.method === 'DELETE') { await deleteUpload(id); return res.json({ success: true }); }
    res.status(405).end();
  } catch (err) { res.status(500).json({ error: err.message }); }
}
