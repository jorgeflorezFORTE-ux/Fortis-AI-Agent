export default function Privacy() {
  return (
    <div style={{ maxWidth: 700, margin: '60px auto', padding: '0 24px', fontFamily: 'system-ui, sans-serif', lineHeight: 1.7, color: '#111' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Privacy Policy</h1>
      <p style={{ color: '#6b7280', marginBottom: 32 }}>Fortis — Asesor Financiero AI · Last updated: April 2026</p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 32 }}>1. Information We Collect</h2>
      <p>Fortis accesses financial data from QuickBooks Online through Intuit's official API, including transaction records, profit & loss reports, and balance sheet data. This data is used solely to provide financial analysis and reporting within the application.</p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 32 }}>2. How We Use Your Information</h2>
      <p>Financial data is used exclusively to generate reports, analysis, and insights within Fortis. We use Claude AI (Anthropic) to analyze financial patterns and provide recommendations. No financial data is stored permanently on external servers.</p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 32 }}>3. QuickBooks Data Access</h2>
      <p>We access your QuickBooks data using OAuth 2.0 authorization. We request only the accounting scope necessary to read financial records. We do not modify, delete, or write data to your QuickBooks account. You can revoke access at any time through QuickBooks → Settings → Authorized Apps.</p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 32 }}>4. Data Sharing</h2>
      <p>We do not sell, trade, or share your financial data with third parties. Data is only shared with Anthropic's Claude AI for analysis purposes, subject to Anthropic's privacy policy.</p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 32 }}>5. Data Security</h2>
      <p>All connections use HTTPS/TLS encryption. OAuth tokens are stored securely using environment variables on Vercel's infrastructure. We follow industry best practices for data security.</p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 32 }}>6. Data Retention</h2>
      <p>OAuth tokens are retained until you revoke access. Cached financial data is retained only for the current session. No long-term storage of your financial records occurs outside of QuickBooks.</p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 32 }}>7. Your Rights</h2>
      <p>You can revoke Fortis access to your QuickBooks data at any time. You can request deletion of any stored data by contacting the app administrator.</p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 32 }}>8. Contact</h2>
      <p>For privacy questions or data deletion requests, contact the app administrator.</p>
    </div>
  );
}
