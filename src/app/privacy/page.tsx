import type { Metadata } from "next";
import PageShell from "@/components/marketing/page-shell";
import { CONTACT, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How PERICO collects, uses, and protects your data.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl font-semibold text-foreground">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <PageShell
      title="Privacy Policy"
      subtitle={`Last updated: June 2025`}
    >
      <p className="text-sm leading-relaxed text-muted-foreground">
        {SITE.name} (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy.
        This policy explains what data we collect, how we use it, and what rights you have over it.
        By using {SITE.name}, you agree to the practices described here.
      </p>

      <Section title="1. Information we collect">
        <p><strong className="text-foreground">Account information:</strong> When you sign up, we collect your name, email address, and business name.</p>
        <p><strong className="text-foreground">Business data:</strong> Products, sales, purchases, inventory, customers, suppliers, and ledger entries that you create inside the app. This data belongs to you.</p>
        <p><strong className="text-foreground">Usage data:</strong> We may collect anonymised logs (pages visited, feature usage, error reports) to improve the product. No personally identifiable information is included in usage logs.</p>
        <p><strong className="text-foreground">Cookies:</strong> We use a single session cookie to keep you logged in and a theme preference cookie. We do not use advertising or tracking cookies.</p>
      </Section>

      <Section title="2. How we use your information">
        <p>We use your information solely to:</p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Provide, operate, and maintain the {SITE.name} service.</li>
          <li>Send essential service emails (account verification, password reset).</li>
          <li>Diagnose technical problems and improve performance.</li>
          <li>Comply with legal obligations.</li>
        </ul>
        <p>We do <strong className="text-foreground">not</strong> sell your data, share it with advertisers, or use it for any purpose beyond running the service.</p>
      </Section>

      <Section title="3. Data storage and security">
        <p>Your data is stored in a Supabase-managed PostgreSQL database hosted on secure cloud infrastructure. Each business&apos;s data is logically isolated — no other tenant can see your records.</p>
        <p>We use industry-standard measures (encrypted connections, hashed passwords) to protect your data. However, no system is 100% immune to breaches, and we encourage you to use a strong password.</p>
      </Section>

      <Section title="4. Data retention">
        <p>We retain your data for as long as your account is active. If you delete your account, your data is permanently removed from our systems within 30 days.</p>
      </Section>

      <Section title="5. Third-party services">
        <p>We use the following third-party services to operate {SITE.name}:</p>
        <ul className="ml-4 list-disc space-y-1">
          <li><strong className="text-foreground">Supabase</strong> — database hosting.</li>
          <li><strong className="text-foreground">Vercel</strong> — application hosting and deployment.</li>
        </ul>
        <p>Each of these services has their own privacy policy. We share only the minimum data necessary to provide the service.</p>
      </Section>

      <Section title="6. Your rights">
        <p>You have the right to:</p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Access the personal data we hold about you.</li>
          <li>Correct inaccurate data via your account settings.</li>
          <li>Delete your account and all associated data.</li>
          <li>Export your business data (products, sales, etc.) from within the app.</li>
        </ul>
        <p>To exercise these rights, contact us at <a href={`mailto:${CONTACT.email}`} className="text-accent hover:underline">{CONTACT.email}</a>.</p>
      </Section>

      <Section title="7. Changes to this policy">
        <p>We may update this policy from time to time. We will notify you of significant changes via email or an in-app notice. Continued use of the service after changes constitutes acceptance.</p>
      </Section>

      <Section title="8. Contact">
        <p>
          Questions about this policy? Email us at{" "}
          <a href={`mailto:${CONTACT.email}`} className="text-accent hover:underline">{CONTACT.email}</a>{" "}
          or message us on{" "}
          <a href={CONTACT.whatsappUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline">WhatsApp</a>.
        </p>
      </Section>
    </PageShell>
  );
}
