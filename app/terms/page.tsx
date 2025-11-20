export default function Terms() {
  return (
    <main className="prose mx-auto p-8">
      <h1>Terms & Conditions</h1>
      <p>Last updated: {new Date().getFullYear()}</p>

      <p>
        By using CrowdPulse (“the Service”), you agree to the following terms.
      </p>

      <h2>Use of the Service</h2>
      <p>
        You must provide accurate information and only upload data that you have
        the rights to use. You must not misuse the platform or attempt to access
        data belonging to others.
      </p>

      <h2>TikTok Integration</h2>
      <p>
        If you connect your TikTok account, you grant us permission to access
        the data scopes you authorize. We only use this data to provide
        analytics within the platform. We comply with TikTok Platform Policies.
      </p>

      <h2>Liability</h2>
      <p>
        We make no guarantees about the accuracy of analytics results. You use
        the platform at your own risk.
      </p>

      <h2>Termination</h2>
      <p>
        We may suspend accounts that violate these terms or TikTok platform
        policies.
      </p>

      <h2>Contact</h2>
      <p>
        For questions or concerns, contact:
        <br />
        <strong>support@crowdpulse.app</strong>
      </p>
    </main>
  );
}
