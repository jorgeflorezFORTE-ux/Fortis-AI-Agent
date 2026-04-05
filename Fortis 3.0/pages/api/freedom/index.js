const { getAssets, addAsset, updateAsset, deleteAsset, getLiabilities, addLiability, updateLiability, deleteLiability, getFreedomSummary, saveSnapshot, getSnapshots } = require('../../../lib/db');

export default function handler(req, res) {
  const { action } = req.query;
  try {
    // GET /api/freedom?action=summary
    if (req.method === 'GET') {
      if (action === 'assets') return res.json({ assets: getAssets() });
      if (action === 'liabilities') return res.json({ liabilities: getLiabilities() });
      if (action === 'snapshots') return res.json({ snapshots: getSnapshots(24) });
      // default: full summary
      const s = getFreedomSummary();
      const snaps = getSnapshots(12);
      return res.json({ ...s, snapshots: snaps });
    }

    // POST /api/freedom { action: 'addAsset', ... }
    if (req.method === 'POST') {
      const { action: act, ...data } = req.body;
      if (act === 'addAsset') { const id = addAsset(data); return res.json({ success: true, id, ...getFreedomSummary() }); }
      if (act === 'updateAsset') { updateAsset(data.id, data); return res.json({ success: true, ...getFreedomSummary() }); }
      if (act === 'deleteAsset') { deleteAsset(data.id); return res.json({ success: true, ...getFreedomSummary() }); }
      if (act === 'addLiability') { const id = addLiability(data); return res.json({ success: true, id, ...getFreedomSummary() }); }
      if (act === 'updateLiability') { updateLiability(data.id, data); return res.json({ success: true, ...getFreedomSummary() }); }
      if (act === 'deleteLiability') { deleteLiability(data.id); return res.json({ success: true, ...getFreedomSummary() }); }
      if (act === 'snapshot') { saveSnapshot(); return res.json({ success: true, snapshots: getSnapshots(12) }); }
      return res.status(400).json({ error: 'Acción no válida' });
    }

    res.status(405).end();
  } catch (err) { res.status(500).json({ error: err.message }); }
}
