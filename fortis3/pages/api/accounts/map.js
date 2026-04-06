const { getAllMappings, addMapping, deleteMapping, getAllEntities } = require('../../../lib/entity-manager');
export default async function handler(req, res) {
  try {
    if (req.method === 'GET') return res.json({ mappings: await getAllMappings(), entities: await getAllEntities() });
    if (req.method === 'POST') { const { digits, entity, label, accountType, bank } = req.body; if (!digits || !entity || !label) return res.status(400).json({ error: 'Faltan campos' }); await addMapping({ digits, entityId: entity, label, accountType, bank }); return res.json({ success: true, mappings: await getAllMappings() }); }
    if (req.method === 'DELETE') { await deleteMapping(req.body.digits); return res.json({ success: true, mappings: await getAllMappings() }); }
    res.status(405).end();
  } catch (err) { res.status(500).json({ error: err.message }); }
}
