const { getAssets, addAsset, updateAsset, deleteAsset, getLiabilities, addLiability, updateLiability, deleteLiability, getFreedomSummary, saveSnapshot, getSnapshots } = require('../../../lib/db');

export default async function handler(req, res) {
  const { action } = req.query;
  try {
    if (req.method === 'GET') {
      if (action === 'assets') return res.json({ assets: await getAssets() });
      if (action === 'liabilities') return res.json({ liabilities: await getLiabilities() });
      if (action === 'snapshots') return res.json({ snapshots: await getSnapshots(24) });
      const s = await getFreedomSummary();
      const snaps = await getSnapshots(12);
      return res.json({ ...s, snapshots: snaps });
    }

    if (req.method === 'POST') {
      const { action: act, ...data } = req.body;
      if (act === 'addAsset') { const id = await addAsset(data); const s = await getFreedomSummary(); return res.json({ success: true, id, ...s }); }
      if (act === 'updateAsset') { await updateAsset(data.id, data); const s = await getFreedomSummary(); return res.json({ success: true, ...s }); }
      if (act === 'deleteAsset') { await deleteAsset(data.id); const s = await getFreedomSummary(); return res.json({ success: true, ...s }); }
      if (act === 'addLiability') { const id = await addLiability(data); const s = await getFreedomSummary(); return res.json({ success: true, id, ...s }); }
      if (act === 'updateLiability') { await updateLiability(data.id, data); const s = await getFreedomSummary(); return res.json({ success: true, ...s }); }
      if (act === 'deleteLiability') { await deleteLiability(data.id); const s = await getFreedomSummary(); return res.json({ success: true, ...s }); }
      if (act === 'snapshot') { await saveSnapshot(); return res.json({ success: true, snapshots: await getSnapshots(12) }); }
      return res.status(400).json({ error: 'Acción no válida' });
    }

    res.status(405).end();
  } catch (err) { res.status(500).json({ error: err.message }); }
}
