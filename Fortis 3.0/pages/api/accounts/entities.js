const { getAllEntities, createEntity, updateEntity, deleteEntity } = require('../../../lib/entity-manager');
export default async function handler(req, res) {
  try {
    if (req.method === 'GET') return res.json({ entities: await getAllEntities() });
    if (req.method === 'POST') { const id = await createEntity(req.body); return res.json({ success: true, id, entities: await getAllEntities() }); }
    if (req.method === 'PUT') { const { id, ...f } = req.body; await updateEntity(id, f); return res.json({ success: true, entities: await getAllEntities() }); }
    if (req.method === 'DELETE') { await deleteEntity(req.body.id); return res.json({ success: true, entities: await getAllEntities() }); }
    res.status(405).end();
  } catch (err) { res.status(500).json({ error: err.message }); }
}
