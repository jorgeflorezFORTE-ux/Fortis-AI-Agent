const { parseBankStatement } = require('../../../lib/csv-parser');
const { autoRouteFile, autoRouteByContent } = require('../../../lib/entity-manager');
const { upsertMany, savePersonalUpload, updatePersonalUpload } = require('../../../lib/db');
const { checkDuplicateUpload, deduplicateTransactions } = require('../../../lib/dedup');

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accountId: manualId, sourceName, csvContent, filename, force } = req.body || {};
  if (!csvContent) return res.status(400).json({ error: 'Falta csvContent' });

  try {
    const parsed = parseBankStatement(csvContent);
    if (parsed.transactions.length === 0)
      return res.status(400).json({ error: 'No se encontraron transacciones' });

    // 1. Try auto-route by filename digits
    let routed = await autoRouteFile(filename);
    let target = null, finalName = sourceName || null, auto = false;

    if (routed && routed.entity) {
      target = routed.entity;
      finalName = finalName || routed.label;
      auto = true;
    }

    // 2. If filename failed, try inside CSV content
    if (!target) {
      const contentRoute = await autoRouteByContent(csvContent);
      if (contentRoute && contentRoute.entity) {
        target = contentRoute.entity;
        finalName = finalName || contentRoute.label;
        auto = true;
        routed = contentRoute;
      }
    }

    // 3. Manual fallback
    if (!target && manualId) {
      target = manualId;
      finalName = finalName || filename?.replace(/\.[^.]+$/, '') || 'Upload';
    }

    // 4. Nothing worked
    if (!target) {
      return res.status(400).json({
        error: 'Cuenta no registrada',
        digits: routed?.digits || null,
        message: routed?.message || 'No se encontraron dígitos de cuenta en el archivo ni en su contenido',
        hint: 'Registra la cuenta en Configuracion o selecciona destino manual',
      });
    }

    // Duplicate check
    if (!force) {
      const dupCheck = await checkDuplicateUpload(target, filename, csvContent);
      if (dupCheck.isDuplicate) {
        return res.status(409).json({
          error: 'Archivo duplicado', duplicate: true,
          message: dupCheck.message, existingUploadId: dupCheck.existing.id,
        });
      }
    }

    // Dedup transactions
    const { unique, duplicateCount } = await deduplicateTransactions(parsed.transactions, target);
    if (unique.length === 0) {
      return res.status(409).json({
        error: 'Todas las transacciones ya existen', duplicate: true,
        message: 'Las ' + parsed.transactions.length + ' transacciones ya estan registradas',
        duplicateCount: parsed.transactions.length,
      });
    }

    const uid = await savePersonalUpload({
      accountId: target,
      filename: filename || finalName + '.csv',
      sourceName: finalName,
      fileType: 'csv',
      period: parsed.dateRange.from && parsed.dateRange.to
        ? parsed.dateRange.from + ' a ' + parsed.dateRange.to : null,
    });

    const txns = unique.map((t, i) => ({
      id: target + '-' + uid + '-' + i,
      company_id: target,
      qb_id: 'upload-' + uid + '-' + i,
      type: t.type, amount: t.amount, date: t.date,
      category: t.category || 'Sin categoria',
      description: t.description, vendor: t.description,
      account: finalName, payment_method: 'Tarjeta/Banco',
      reference: 'UP-' + uid + '-' + i,
    }));

    const count = await upsertMany(txns);
    const totalIncome = unique.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpenses = unique.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    await updatePersonalUpload(uid, {
      totalTransactions: count,
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      status: 'processed',
    });

    res.json({
      success: true, uploadId: uid, targetEntity: target,
      sourceName: finalName, autoDetected: auto,
      entityName: routed?.entityName || target,
      format: parsed.format, totalTransactions: count,
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      net: Math.round((totalIncome - totalExpenses) * 100) / 100,
      duplicatesSkipped: duplicateCount,
      categories: parsed.categories, dateRange: parsed.dateRange,
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
}
