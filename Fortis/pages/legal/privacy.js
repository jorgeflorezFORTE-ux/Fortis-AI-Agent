export default function Privacy() {
  return (
    <div style={{ maxWidth: 700, margin: '60px auto', padding: '0 24px', fontFamily: 'system-ui', lineHeight: 1.7 }}>
      <h1>Privacy Policy — Fortis</h1>
      <p>We access QuickBooks data via OAuth 2.0 solely to provide financial reports. We do not sell or share your data. You can revoke access anytime in QuickBooks settings.</p>
      <h2>Data Security</h2>
      <p>All connections use HTTPS. OAuth tokens stored securely on Vercel.</p>
      <h2>Contact</h2>
      <p>Questions? Contact the app administrator.</p>
    </div>
  );
}
