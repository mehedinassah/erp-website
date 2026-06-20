import type { Metadata } from "next";
import PageShell from "@/components/marketing/page-shell";
import { CONTACT, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms and conditions for using PERICO.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl font-semibold text-foreground">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <PageShell
      title="Terms of Service"
      subtitle="Last updated: June 2025"
    >
      <p className="text-sm leading-relaxed text-muted-foreground">
        These Terms of Service (&quot;Terms&quot;) govern your use of {SITE.name} (&quot;the Service&quot;).
        By creating an account or using the Service, you agree to these Terms.
        Please read them carefully.
      </p>

      <Section title="1. About the service">
        <p>{SITE.name} is a cloud-based ERP and inventory management platform designed for small and medium businesses in Bangladesh. We provide tools for inventory tracking, point-of-sale, purchasing, and ledger management.</p>
        <p>The Service is currently in <strong className="text-foreground">early access (beta)</strong>. Features, pricing, and availability may change as we develop the product.</p>
      </Section>

      <Section title="2. Account eligibility">
        <p>You must be at least 18 years old to use {SITE.name}. By creating an account, you represent that you have the authority to agree to these Terms on behalf of yourself or your business.</p>
        <p>You are responsible for maintaining the security of your account credentials. You must notify us immediately of any unauthorised use of your account.</p>
      </Section>

      <Section title="3. Acceptable use">
        <p>You agree not to use the Service to:</p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Violate any applicable law or regulation.</li>
          <li>Store, process, or transmit fraudulent or illegal financial information.</li>
          <li>Reverse-engineer, decompile, or attempt to extract source code from the Service.</li>
          <li>Upload malicious code, viruses, or any material that could damage the Service or other users.</li>
          <li>Attempt to gain unauthorised access to other accounts or systems.</li>
        </ul>
      </Section>

      <Section title="4. Your data">
        <p>You retain full ownership of the data you enter into {SITE.name} (products, customers, sales records, etc.). We do not claim any rights to your business data.</p>
        <p>You grant us a limited licence to store and process your data solely to provide the Service. See our <a href="/privacy" className="text-accent hover:underline">Privacy Policy</a> for details on how we handle your data.</p>
      </Section>

      <Section title="5. Beta period and pricing">
        <p>During the current beta period, the Service is provided <strong className="text-foreground">free of charge</strong>. We will give you at least 30 days&apos; notice before introducing paid plans.</p>
        <p>When paid plans are introduced, the prices displayed on the pricing page will apply. You will always have the option to export your data before any plan change takes effect.</p>
      </Section>

      <Section title="6. Service availability">
        <p>We aim for high availability but do not guarantee uninterrupted access. We may perform maintenance that temporarily affects availability — we will try to schedule this during low-traffic hours and notify you in advance where possible.</p>
      </Section>

      <Section title="7. Intellectual property">
        <p>The {SITE.name} name, logo, and application code are owned by us and protected by applicable intellectual property law. These Terms do not grant you any right to use our brand or trademarks.</p>
      </Section>

      <Section title="8. Limitation of liability">
        <p>To the maximum extent permitted by law, {SITE.name} is provided &quot;as is&quot; without warranty of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the Service, including loss of business data or profits.</p>
        <p>We strongly recommend keeping your own backups of critical business records.</p>
      </Section>

      <Section title="9. Termination">
        <p>You may stop using the Service and delete your account at any time. We may suspend or terminate accounts that violate these Terms, with or without notice.</p>
      </Section>

      <Section title="10. Changes to these Terms">
        <p>We may update these Terms from time to time. We will notify you of significant changes via email or an in-app notice at least 14 days before they take effect. Continued use of the Service after that date constitutes acceptance.</p>
      </Section>

      <Section title="11. Governing law">
        <p>These Terms are governed by the laws of Bangladesh. Any disputes will be resolved in the courts of Dhaka.</p>
      </Section>

      <Section title="12. Contact">
        <p>
          Questions about these Terms? Reach us at{" "}
          <a href={`mailto:${CONTACT.email}`} className="text-accent hover:underline">{CONTACT.email}</a>{" "}
          or via{" "}
          <a href={CONTACT.whatsappUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline">WhatsApp</a>.
        </p>
      </Section>
    </PageShell>
  );
}
