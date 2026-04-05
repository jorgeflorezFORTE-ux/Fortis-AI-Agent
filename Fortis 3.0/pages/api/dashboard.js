const { getDashboardData, getPersonalUploads, getGlobalSummary } = require('../../lib/db');
const { getAllEntities } = require('../../lib/entity-manager');

export default function handler(req, res) {
  const { company, year = new Date().getFullYear() } = req.query;
  const cid = company === 'all' ? null : company || null;
  try {
    const data = getDashboardData({ companyId: cid, year: parseInt(year) });
    const uploads = cid ? getPersonalUploads(cid) : [];
    const entities = getAllEntities();
    let perCompany = null;
    if (!cid) {
      perCompany = entities.filter(e => e.active && e.type === 'business').map(e => {
        const d = getDashboardData({ companyId: e.id, year: parseInt(year) });
        return { id: e.id, name: e.short_name || e.name, color: e.color, icon: e.icon, ...d };
      });
    }
    const global = getGlobalSummary(parseInt(year));
    res.json({ ...data, year: parseInt(year), companyId: cid || 'all', perCompany, uploads, uploadCount: uploads.length, entities, global });
  } catch (err) { res.status(500).json({ error: err.message }); }
}
