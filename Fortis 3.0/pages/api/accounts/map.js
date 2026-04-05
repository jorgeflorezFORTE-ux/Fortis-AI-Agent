const { getAllMappings, addMapping, deleteMapping, getAllEntities } = require('../../../lib/entity-manager');
export default function handler(req, res) {
  try {
    if (req.method === 'GET') return res.json({ mappings: getAllMappings(), entities: getAllEntities() });
    if (req.method === 'POST') { const { digits, entity, label, accountType, bank } = req.body; if (!digits || !entity || !label) return res.status(400).json({ error: 'Faltan campos' }); addMapping({ digits, entityId: entity, label, accountType, bank }); return res.json({ success: true, mappings: getAllMappings() }); }
    if (req.method === 'DELETE') { deleteMapping(req.body.digits); return res.json({ success: true, mappings: getAllMappings() }); }
    res.status(405).end();
  } catch (err) { res.status(500).json({ error: err.message }); }
}
