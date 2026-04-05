/**
 * /api/personal/upload.js
 * Sube y procesa archivos CSV/TSV de estados bancarios personales.
 * POST /api/personal/upload
 * Body: { accountId: 'personal-jorge', sourceName: 'Chase Sapphire', csvContent: '...' }
 *
 * Nota: Para manejar file upload real en producción, usa formidable o multer.
 * Esta versión acepta el contenido CSV como string en el body para simplicidad.
 */

const { parseBankStatement } = require('../../../lib/csv-parser');
const { upsertMany, savePersonalUpload, updatePersonalUpload } = require('../../../lib/db');
const { categorizePersonalExpenses } = require('../../../lib/claude');
const { isPersonalAccount } = require('../../../lib/companies');

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { accountId, sourceName, csvContent, filename } = req.body || {};

  if (!accountId || !isPersonalAccount(accountId)) {
    return res.status(400).json({ error: 'accountId inválido. Usa: personal-jorge, personal-paola, o personal-hogar' });
  }
  if (!csvContent) {
    return res.status(400).json({ error: 'Falta csvContent (contenido del archivo CSV)' });
  }

  try {
    // 1. Parse CSV
    const parsed = parseBankStatement(csvContent);
    if (parsed.transactions.length === 0) {
      return res.status(400).json({ error: 'No se encontraron transacciones en el archivo', details: parsed });
    }

    // 2. Register upload
    const uploadId = savePersonalUpload({
      accountId,
      filename: filename || `${sourceName || 'upload'}-${new Date().toISOString().slice(0, 10)}.csv`,
      sourceName: sourceName || 'Banco',
      fileType: 'csv',
      period: parsed.dateRange.from && parsed.dateRange.to
        ? `${parsed.dateRange.from} a ${parsed.dateRange.to}`
        : null,
    });

    // 3. Save transactions to DB
    const dbTransactions = parsed.transactions.map((t, i) => ({
      id: `${accountId}-${uploadId}-${i}`,
      company_id: accountId,
      qb_id: `upload-${uploadId}-${i}`,
      type: t.type,
      amount: t.amount,
      date: t.date,
      category: t.category || 'Sin categoría',
      description: t.description,
      vendor: t.description,
      account: sourceName || '',
      payment_method: 'Tarjeta/Banco',
      reference: `UP-${uploadId}-${i}`,
    }));

    const count = upsertMany(dbTransactions);

    // 4. Try AI categorization (non-blocking)
    let aiAnalysis = null;
    try {
      aiAnalysis = await categorizePersonalExpenses({
        transactions: parsed.transactions.slice(0, 50),
        sourceName: sourceName || 'Banco',
        accountId,
        totalExpenses: parsed.totalExpenses,
        totalIncome: parsed.totalIncome,
      });

      // Update categories based on AI
      if (aiAnalysis?.categorized) {
        const { getDb } = require('../../../lib/db');
        const db = getDb();
        const updateStmt = db.prepare('UPDATE transactions SET category = ?, subcategory = ? WHERE id = ?');
        const updateMany = db.transaction((items) => {
          items.forEach(item => {
            const txnId = `${accountId}-${uploadId}-${item.index}`;
            updateStmt.run(item.category, item.subcategory || null, txnId);
          });
        });
        updateMany(aiAnalysis.categorized);
      }
    } catch (aiErr) {
      console.error('AI categorization failed (non-blocking):', aiErr.message);
    }

    // 5. Update upload record
    updatePersonalUpload(uploadId, {
      totalTransactions: count,
      totalIncome: parsed.totalIncome,
      totalExpenses: parsed.totalExpenses,
      status: 'processed',
      aiAnalysis: aiAnalysis || null,
    });

    res.json({
      success: true,
      uploadId,
      accountId,
      sourceName,
      format: parsed.format,
      totalTransactions: count,
      totalIncome: parsed.totalIncome,
      totalExpenses: parsed.totalExpenses,
      net: parsed.net,
      categories: parsed.categories,
      recurring: parsed.recurring,
      dateRange: parsed.dateRange,
      aiCategorized: !!aiAnalysis,
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Error al procesar archivo', details: err.message });
  }
}
