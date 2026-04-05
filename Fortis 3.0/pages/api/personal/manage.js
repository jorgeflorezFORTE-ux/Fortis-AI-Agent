const { renameUpload, deleteUpload } = require('../../../lib/db');
export default function handler(req, res) {
  const { id, sourceName } = req.body || {};
  if (!id) return res.status(400).json({ error: 'Falta id' });
  try {
    if (req.method === 'PUT') { renameUpload(id, sourceName); return res.json({ success: true }); }
    if (req.method === 'DELETE') { deleteUpload(id); return res.json({ success: true }); }
    res.status(405).end();
  } catch (err) { res.status(500).json({ error: err.message }); }
}
