/**
 * Calls the shared `mailer` Worker over a Service Binding (see
 * personal-projects/mailer/README.md) instead of holding a RESEND_API_KEY
 * here. Failures are swallowed by the caller (streak reminders are a nice-to-
 * have, not worth failing the cron run over).
 * @returns {import("../../ports/index.js").MailerPort}
 */
export function createMailerPort(mailerBinding, internalApiKey) {
  return {
    async send({ to, subject, html }) {
      const res = await mailerBinding.fetch("https://mailer/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${internalApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ to, subject, html })
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`mailer send failed: ${res.status} ${text}`);
      }
    }
  };
}
