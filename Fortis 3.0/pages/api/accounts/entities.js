const { getAllEntities, createEntity, updateEntity, deleteEntity } = require('../../../lib/entity-manager');
export default function handler(req, res) {
  try {
    if (req.method === 'GET') return res.json({ entities: getAllEntities() });
    if (req.method === 'POST') { const id = createEntity(req.body); return res.json({ success: true, id, entities: getAllEntities() }); }
    if (req.method === 'PUT') { const { id, ...f } = req.body; updateEntity(id, f); return res.json({ success: true, entities: getAllEntities() }); }
    if (req.method === 'DELETE') { deleteEntity(req.body.id); return res.json({ success: true, entities: getAllEntities() }); }
    res.status(405).end();
  } catch (err) { res.status(500).json({ error: err.message }); }
}
