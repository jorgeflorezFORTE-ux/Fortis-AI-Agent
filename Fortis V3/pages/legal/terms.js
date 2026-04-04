export default function Terms() {
  return (
    <div style={{ maxWidth: 700, margin: '60px auto', padding: '0 24px', fontFamily: 'system-ui, sans-serif', lineHeight: 1.7, color: '#111' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Terms of Service</h1>
      <p style={{ color: '#6b7280', marginBottom: 32 }}>Fortis — Asesor Financiero AI · Last updated: April 2026</p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 32 }}>1. Acceptance of Terms</h2>
      <p>By accessing and using Fortis, you accept and agree to be bound by these Terms of Service. Fortis is a private financial management tool for personal and business use.</p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 32 }}>2. Description of Service</h2>
      <p>Fortis provides financial tracking, analysis, and reporting services by connecting to QuickBooks Online and other financial data sources. The service uses AI to analyze financial data and provide insights.</p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 32 }}>3. QuickBooks Integration</h2>
      <p>Fortis connects to QuickBooks Online through Intuit's official OAuth2 API. We only access data necessary to provide financial reporting and analysis. We do not sell or share your financial data with third parties.</p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 32 }}>4. Data Security</h2>
      <p>All data is transmitted securely using HTTPS encryption. OAuth tokens are stored securely and are only used to access your authorized QuickBooks data. You can revoke access at any time through your QuickBooks account settings.</p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 32 }}>5. Limitation of Liability</h2>
      <p>Fortis provides financial information for reference purposes only. It does not constitute professional financial, legal, or tax advice. Always consult qualified professionals for important financial decisions.</p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 32 }}>6. Contact</h2>
      <p>For questions about these terms, contact the app administrator.</p>
    </div>
  );
}
