import type { Metadata } from "next";
import { Mail } from "lucide-react";
import PageShell from "@/components/marketing/page-shell";
import { CONTACT } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the PERICO team via email, WhatsApp, or Facebook.",
};

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.073zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

const CHANNELS = [
  {
    icon: Mail,
    label: "Email",
    value: CONTACT.email,
    href: `mailto:${CONTACT.email}`,
    description: "Best for detailed questions, feedback, or account issues. We reply within 24 hours.",
    cta: "Send email",
  },
  {
    icon: WhatsAppIcon,
    label: "WhatsApp",
    value: CONTACT.whatsappDisplay,
    href: CONTACT.whatsappUrl,
    description: "Quickest for urgent questions. Available during business hours (Dhaka time).",
    cta: "Message on WhatsApp",
  },
  {
    icon: FacebookIcon,
    label: "Facebook",
    value: "Message us on Facebook",
    href: CONTACT.facebookUrl,
    description: "Send a message or follow updates on our Facebook page.",
    cta: "Open Facebook",
  },
];

export default function ContactPage() {
  return (
    <PageShell
      title="Contact us"
      subtitle="We're a small team based in Dhaka. Reach us through any of the channels below."
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {CHANNELS.map((ch) => (
          <a
            key={ch.label}
            href={ch.href}
            target={ch.href.startsWith("mailto") ? undefined : "_blank"}
            rel={ch.href.startsWith("mailto") ? undefined : "noreferrer"}
            className="group flex flex-col gap-4 rounded-xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-accent/40 hover:shadow-lg"
          >
            <span className="grid size-11 place-items-center rounded-lg bg-accent-soft text-accent transition-transform group-hover:scale-110">
              <ch.icon className="size-5" />
            </span>
            <div>
              <p className="font-display font-semibold">{ch.label}</p>
              <p className="mt-0.5 text-sm font-medium text-accent">{ch.value}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{ch.description}</p>
            </div>
            <span className="mt-auto text-sm font-semibold text-accent underline-offset-4 group-hover:underline">
              {ch.cta} →
            </span>
          </a>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-border bg-surface/50 p-6 text-sm leading-relaxed text-muted-foreground">
        <strong className="font-semibold text-foreground">Business hours:</strong> Sunday – Thursday, 10 am – 7 pm (BST, UTC+6).
        Response times may vary on Fridays, Saturdays, and public holidays.
      </div>
    </PageShell>
  );
}
