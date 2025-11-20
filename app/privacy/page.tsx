export default function PrivacyPolicy() {
  return (
    <main className="prose mx-auto p-8">
      <h1>Privacy Policy</h1>
      <p>Last updated: {new Date().getFullYear()}</p>

      <p>
        CrowdPulse (“we”, “our”, “the Service”) collects and processes data in
        order to provide analytics for event organizers. We respect your privacy
        and comply with TikTok Platform Policies and all relevant data laws.
      </p>

      <h2>Information We Collect</h2>
      <ul>
        <li>Event guestlist data uploaded by users</li>
        <li>TikTok profile information authorized by the user</li>
        <li>Basic technical logs (IP, browser, errors)</li>
      </ul>

      <h2>How We Use Data</h2>
      <ul>
        <li>Provide analytics for event organizers</li>
        <li>Generate insights about audience growth</li>
        <li>Improve the functionality of the platform</li>
      </ul>

      <h2>Data Sharing</h2>
      <p>
        We do not sell or rent your data. TikTok data is stored securely and
        only used in accordance with user permissions.
      </p>

      <h2>Data Storage & Security</h2>
      <p>
        We store data using Supabase (PostgreSQL). All data is encrypted in
        transit and at rest.
      </p>

      <h2>Your Rights</h2>
      <p>
        You may request access, correction, or deletion of your personal data at
        any time by contacting us at support@crowdpulse.app.
      </p>

      <h2>Cookies</h2>
      <p>
        We may use cookies or similar technologies to maintain login sessions
        and improve user experience.
      </p>

      <h2>Third-Party Services</h2>
      <p>
        We use Supabase for authentication, database storage, and file storage.
        TikTok data is accessed only with explicit user permission and is
        processed in accordance with TikTok’s Platform Policies.
      </p>

      <h2>Contact</h2>
      <p>
        If you have any questions, email us at:
        <br />
        <strong>support@crowdpulse.app</strong>
      </p>
    </main>
  );
}
