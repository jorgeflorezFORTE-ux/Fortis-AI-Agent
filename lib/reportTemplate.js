/**
 * lib/reportTemplate.js
 * Genera el HTML del reporte email con QR code y link al móvil
 */

export function buildReportEmail({ report, type, month, appUrl }) {
  const deepLink = `${appUrl}/?tab=dashboard`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(appUrl)}&bgcolor=f9fafb&color=111827&margin=2`;
  const title = type === 'weekly' ? `Reporte Semanal — JP Legacy` : `Cierre Mensual — ${month}`;

  const alertsHtml = (report.alertas || []).map(a => `
    <tr>
      <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6">
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${a.tipo === 'critico' ? '#dc2626' : a.tipo === 'advertencia' ? '#d97706' : '#3b82f6'};margin-right:8px;vertical-align:middle"></span>
        <strong>${a.empresa}</strong> — ${a.mensaje}
      </td>
    </tr>`).join('');

  const actionsHtml = (report.checklistSemana || report.checklistCierre || []).slice(0, 5).map(item => `
    <tr>
      <td style="padding:8px 16px;border-bottom:1px solid #f3f4f6;font-size:14px">
        ☐ ${item.tarea || item.item}
        ${item.prioridad === 'alta' ? '<span style="background:#fef2f2;color:#dc2626;padding:1px 6px;border-radius:8px;font-size:11px;margin-left:6px">Alta</span>' : ''}
      </td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html>
<head><meta name="viewport" content="width=device-width, initial-scale=1"><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:20px">

    <!-- Header -->
    <div style="background:#111827;border-radius:12px 12px 0 0;padding:20px 24px;display:flex;align-items:center;justify-content:space-between">
      <div>
        <div style="color:#fff;font-size:18px;font-weight:600">JP Legacy Finance</div>
        <div style="color:#9ca3af;font-size:13px;margin-top:2px">${title}</div>
      </div>
      <div style="color:#d4913a;font-size:12px;background:rgba(212,145,58,.15);padding:4px 10px;border-radius:8px">
        ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
      </div>
    </div>

    <!-- KPIs -->
    <div style="background:#fff;padding:20px 24px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
        <tr>
          <td width="33%" style="text-align:center;padding:12px;background:#f0fdf4;border-radius:8px">
            <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em">Ingresos</div>
            <div style="font-size:22px;font-weight:600;color:#059669">$${Math.round((report.kpis?.ingresosTotal || report.pl?.ingresosTotal || 0) / 1000)}k</div>
          </td>
          <td width="4%"></td>
          <td width="33%" style="text-align:center;padding:12px;background:#fef2f2;border-radius:8px">
            <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em">Gastos</div>
            <div style="font-size:22px;font-weight:600;color:#dc2626">$${Math.round((report.kpis?.gastosTotal || report.pl?.gastosTotal || 0) / 1000)}k</div>
          </td>
          <td width="4%"></td>
          <td width="33%" style="text-align:center;padding:12px;background:#eff6ff;border-radius:8px">
            <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em">Neto</div>
            <div style="font-size:22px;font-weight:600;color:#1d4ed8">$${Math.round((report.kpis?.netoTotal || report.pl?.netTotal || 0) / 1000)}k</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Resumen -->
    <div style="background:#fff;padding:0 24px 16px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb">
      <div style="background:#f0f9ff;border-left:3px solid #3b82f6;border-radius:0 8px 8px 0;padding:12px 14px;font-size:14px;color:#1e3a5f;line-height:1.6">
        ${report.resumenGeneral || report.resumenEjecutivo || ''}
      </div>
    </div>

    <!-- Alertas -->
    ${alertsHtml ? `
    <div style="background:#fff;padding:4px 24px 0;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb">
      <div style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;padding:12px 0 6px">Alertas</div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
        ${alertsHtml}
      </table>
    </div>` : ''}

    <!-- Checklist -->
    ${actionsHtml ? `
    <div style="background:#fff;padding:4px 24px 16px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb">
      <div style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;padding:12px 0 6px">Acciones esta semana</div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
        ${actionsHtml}
      </table>
    </div>` : ''}

    <!-- ── MOBILE ACCESS SECTION ── -->
    <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:20px 24px">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td valign="middle" style="padding-right:20px">
            <div style="font-size:13px;font-weight:600;color:#111827;margin-bottom:4px">Abrir en tu celular</div>
            <div style="font-size:12px;color:#6b7280;margin-bottom:12px;line-height:1.5">
              Escanea el QR o toca el botón para ver el dashboard completo, hablar con el asesor AI y revisar todas tus finanzas desde el móvil.
            </div>
            <a href="${deepLink}" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:500">
              Abrir JP Legacy Finance →
            </a>
            <div style="margin-top:8px;font-size:11px;color:#9ca3af;word-break:break-all">${appUrl}</div>
          </td>
          <td valign="middle" style="text-align:center;width:160px;flex-shrink:0">
            <img src="${qrUrl}" width="140" height="140" alt="QR Code" style="border-radius:8px;border:1px solid #e5e7eb;display:block">
            <div style="font-size:10px;color:#9ca3af;margin-top:4px">Escanear con cámara</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:16px;font-size:11px;color:#9ca3af">
      JP Legacy Finance AI · Generado automáticamente · <a href="${appUrl}/api/unsubscribe" style="color:#9ca3af">Desuscribirse</a>
    </div>
  </div>
</body>
</html>`;
}
