/**
 * pages/api/reports/generate.js
 * Genera reportes semanales y mensuales con link y QR code para móvil
 */

import { generateWeeklyReport, generateMonthlyClose } from '../../../lib/claude';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { type, companiesData, month, appUrl } = req.body;
  const baseUrl = appUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
    let report;
    if (type === 'weekly') {
      report = await generateWeeklyReport(companiesData);
    } else {
      report = await generateMonthlyClose(companiesData, month);
    }

    // Adjuntamos el link y metadata para el QR
    report._meta = {
      generatedAt: new Date().toISOString(),
      type,
      month,
      appUrl: baseUrl,
      deepLink: `${baseUrl}/?tab=dashboard&month=${month}`,
      reportLink: `${baseUrl}/?tab=reporte&type=${type}&t=${Date.now()}`,
      qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(baseUrl)}&bgcolor=ffffff&color=111827&margin=2`,
    };

    return res.status(200).json({ success: true, report });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
