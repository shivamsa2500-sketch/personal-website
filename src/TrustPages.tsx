import { FormEvent, ReactNode, useState } from "react";
import { Icon, SiteFooter, SiteHeader, SocialLinks, templatePages } from "./App";

/* Business facts shared by the About, Contact, How it works, Privacy and Terms pages.
   Change them here and every page (and the prerendered HTML) follows. */
export const business = {
  email: "analyst2sales@gmail.com",
  deliveryDays: "5–7 business days",
  revisionRounds: 2,
  deposit: "50%",
  legalUpdated: "October 15, 2026",
};

const mailto = `mailto:${business.email}`;

function PageShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#05060e] text-[#e9edfb]">
      <SiteHeader />
      <main className="mx-auto max-w-[1420px] px-5 pb-20 pt-10 sm:px-8 sm:pt-14">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6bc7f8]">{eyebrow}</p>
          <h1 className="mt-4 font-display text-4xl leading-[1.02] tracking-[-0.04em] sm:text-6xl">{title}</h1>
          {intro && <div className="mt-6 text-lg leading-8 text-[#8a93b0]">{intro}</div>}
        </div>
        <div className="mt-12">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}

/* Readable long-form text on the dark theme. */
function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-3xl space-y-5 text-base leading-7 text-[#c3cbe4] [&_a]:text-[#6bc7f8] [&_a]:underline [&_h2]:mt-12 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-[-0.03em] [&_h2]:text-[#e9edfb] [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-[#e9edfb] [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_ul]:space-y-2">
      {children}
    </div>
  );
}

function CtaRow() {
  return (
    <div className="mt-12 flex flex-wrap gap-3">
      <a href="/#templates" className="brand-grad-bg rounded-full px-6 py-3.5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:opacity-90">
        Browse the designs
      </a>
      <a href="/contact/" className="rounded-full border border-white/15 px-6 py-3.5 text-xs font-bold uppercase tracking-[0.12em] hover:border-[#6bc7f8]">
        Contact us
      </a>
    </div>
  );
}

export function AboutPage() {
  return (
    <PageShell
      eyebrow="About"
      title="A small studio building finished websites for local businesses"
      intro={
        <p>
          Analyst Solution designs complete websites for local businesses such as plumbers, cafes and online shops.
          Every design on this site is a working demo you can click through before you buy. When you choose one, we
          build it as your own site, with your business name, services, photos and contact details.
        </p>
      }
    >
      <Prose>
        <h2>Where we work</h2>
        <p>
          We are a remote team based in India, building websites for clients in the United States, mainly in
          California. The whole project runs by email, so you can reply whenever it suits your working day.
        </p>

        <h2>How we are different</h2>
        <ul>
          <li>You see the finished design working before you pay anything. No mock-ups, no guessing.</li>
          <li>A written quote for your project, agreed before any work starts.</li>
          <li>Your site is ready in {business.deliveryDays}, with {business.revisionRounds} rounds of changes included.</li>
          <li>You own your domain name. We host the site for you.</li>
        </ul>

        <h2>Find us</h2>
        <p>
          Email <a href={mailto}>{business.email}</a>, or follow our work on social media:
        </p>
      </Prose>
      <div className="mt-5">
        <SocialLinks />
      </div>
      <CtaRow />
    </PageShell>
  );
}

export function ContactPage() {
  const [sent, setSent] = useState(false);

  const send = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const field = (name: string) => String(data.get(name) ?? "").trim();
    const design = field("design");
    const subject = design ? `Website enquiry: ${design}` : "Website enquiry";
    const body = [
      `Name: ${field("name")}`,
      `Email: ${field("email")}`,
      `Business: ${field("business")}`,
      `Design: ${design || "Not sure yet"}`,
      "",
      field("message"),
      "",
      "Consent:",
      "- I agree that Analyst Solution may use the information I send to reply, prepare a quote and build my website, as described in the privacy policy: Yes",
      `- My finished website may be shown in the Analyst Solution portfolio: ${data.get("portfolio") ? "Yes" : "No"}`,
    ].join("\n");
    window.location.href = `${mailto}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  const input =
    "mt-2 w-full rounded-[14px] border border-white/15 bg-[#11152a] px-4 py-3 text-base text-[#e9edfb] outline-none placeholder:text-[#8a93b0] focus:border-[#6bc7f8]";

  return (
    <PageShell
      eyebrow="Contact"
      title="Tell us about your business"
      intro={
        <p>
          Email is the fastest way to reach us: <a href={mailto} className="text-[#6bc7f8] underline">{business.email}</a>.
          We do not have a phone line yet.
        </p>
      }
    >
      <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
        <form onSubmit={send} action={mailto} method="post" encType="text/plain" className="grid max-w-2xl gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Your name
              <input name="name" required autoComplete="name" className={input} />
            </label>
            <label className="text-sm font-semibold">
              Your email
              <input name="email" type="email" required autoComplete="email" className={input} />
            </label>
          </div>
          <label className="text-sm font-semibold">
            Business name and city
            <input name="business" placeholder="e.g. Bayside Plumbing, San Jose" className={input} />
          </label>
          <label className="text-sm font-semibold">
            Design you like
            <select name="design" defaultValue="" className={input}>
              <option value="">Not sure yet</option>
              {templatePages.map((t) => (
                <option key={t.id} value={t.title}>
                  {t.title}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold">
            What do you need?
            <textarea name="message" rows={5} required placeholder="Pages, services, deadline, anything we should know" className={input} />
          </label>
          <fieldset className="rounded-[18px] border border-white/10 bg-[#0b0e1c] p-5">
            <legend className="px-2 text-sm font-semibold">Your consent</legend>
            <label className="flex gap-3 text-sm leading-6 text-[#c3cbe4]">
              <input name="consent" type="checkbox" required className="mt-1 h-5 w-5 shrink-0 accent-[#4290f5]" />
              <span>
                I agree that Analyst Solution may use the information I send, including my name, email, business details,
                text and photos, to reply to me, prepare a quote and build my website, as described in the{" "}
                <a href="/privacy/" className="text-[#6bc7f8] underline">privacy policy</a>. (Required)
              </span>
            </label>
            <label className="mt-4 flex gap-3 text-sm leading-6 text-[#c3cbe4]">
              <input name="portfolio" type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-[#4290f5]" />
              <span>
                You may show my finished website, with my business name, in your portfolio and on social media. (Optional)
              </span>
            </label>
            <p className="mt-4 text-xs leading-5 text-[#8a93b0]">
              You can withdraw your consent at any time by emailing {business.email}. We never sell your information.
            </p>
          </fieldset>
          <div>
            <button className="brand-grad-bg rounded-full px-7 py-3.5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:opacity-90">
              Write the email
            </button>
            <p className="mt-3 text-sm text-[#8a93b0]">
              {sent
                ? `Your email app should now be open with your message filled in. Press send there, or email ${business.email} directly.`
                : "This opens your email app with your message filled in, ready to send."}
            </p>
          </div>
        </form>

        <aside className="h-fit rounded-[22px] border border-white/10 bg-[#0b0e1c] p-6">
          <h2 className="text-lg font-semibold">What happens next</h2>
          <ol className="mt-4 space-y-3 text-sm leading-6 text-[#c3cbe4]">
            <li>1. We reply by email to confirm what you need and send you a quote.</li>
            <li>2. You pay a {business.deposit} deposit and send your text and photos.</li>
            <li>3. We build your site in {business.deliveryDays} and send you a preview.</li>
            <li>4. You ask for changes ({business.revisionRounds} rounds included), pay the rest, and we launch.</li>
          </ol>
          <a href="/how-it-works/" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#6bc7f8] hover:underline">
            How it works, step by step <Icon name="arrow" size={16} />
          </a>
        </aside>
      </div>
    </PageShell>
  );
}

export const howItWorksFaq: [string, string][] = [
  [
    "How much does a website cost?",
    "Every business needs something a little different, so we quote each project. Contact us with the design you like and what you need, and we reply with a quote.",
  ],
  [
    "How long does it take?",
    `${business.deliveryDays} from when we receive your deposit and your text and photos. If we are waiting on content from you, the clock pauses until it arrives.`,
  ],
  [
    "What can I change?",
    `Your business name, text, photos, services, colors and contact details are all set up for you. ${business.revisionRounds} rounds of changes after the first preview are included. Bigger changes, such as new page types, are quoted before we start.`,
  ],
  [
    "Who owns the website?",
    "You own your domain name. We host the site for you, so you do not need to set up or manage hosting.",
  ],
  [
    "Can I get a refund?",
    `If you cancel before we start work, we refund your deposit in full. Once work has started, the deposit is not refundable.`,
  ],
  [
    "Where are you based?",
    "We are a remote team in India working with US businesses. Everything runs by email, and quotes are in US dollars.",
  ],
];

export function HowItWorksPage() {
  return (
    <PageShell
      eyebrow="How it works"
      title={`Pick a design. A preview in ${business.deliveryDays}.`}
      intro={
        <p>
          Choose a finished design, and we build it as your business&apos;s website. Contact us for a quotation: you pay{" "}
          {business.deposit} to start and the rest at launch.
        </p>
      }
    >
      <section className="max-w-3xl rounded-[22px] border border-white/10 bg-[#0b0e1c] p-6 sm:p-8" aria-labelledby="quote">
        <h2 id="quote" className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">Contact for quotation</h2>
        <p className="mt-3 leading-7 text-[#c3cbe4]">
          Tell us which design you like and what your business needs, and we reply by email with a quote. Nothing is
          charged until you have agreed to it.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a href="/contact/" className="brand-grad-bg rounded-full px-6 py-3.5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:opacity-90">
            Ask for a quote
          </a>
          <a href={mailto} className="rounded-full border border-white/15 px-6 py-3.5 text-xs font-bold uppercase tracking-[0.12em] hover:border-[#6bc7f8]">
            {business.email}
          </a>
        </div>
      </section>

      <div className="mt-16 grid gap-12 lg:grid-cols-2">
        <section>
          <h2 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">How it works</h2>
          <ol className="mt-6 space-y-5">
            {[
              ["Pick a design", "Open any design as a working demo and choose the one that fits your business."],
              ["Ask for a quote", "Tell us your business name, services and what you need. We reply with a quote."],
              [`Pay a ${business.deposit} deposit`, "We email an invoice in US dollars. You send your text, photos and logo."],
              ["We build your site", `Your site is ready to preview in ${business.deliveryDays}.`],
              ["Review and change", `${business.revisionRounds} rounds of changes are included.`],
              ["Go live", `You pay the remaining ${business.deposit}, and we put the site live on your domain.`],
            ].map(([title, body], index) => (
              <li key={title} className="flex gap-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/15 text-sm font-semibold text-[#6bc7f8]">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-[#c3cbe4]">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">Every build includes</h2>
          <ul className="mt-6 space-y-3 text-[#c3cbe4]">
            {[
              "Your business name, text, photos, services and contact details",
              "A layout that works on phones, tablets and desktops",
              `${business.revisionRounds} rounds of changes after the first preview`,
              "Hosting by us, so there is nothing for you to set up",
              "Your own domain name, which stays in your name",
              "A written quote agreed before any work starts",
            ].map((line) => (
              <li key={line} className="flex gap-3 leading-7">
                <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#6bc7f8]" aria-hidden="true" />
                {line}
              </li>
            ))}
          </ul>
          <h3 className="mt-10 text-lg font-semibold">Payment and refunds</h3>
          <p className="mt-2 leading-7 text-[#c3cbe4]">
            {business.deposit} up front, {business.deposit} at launch, invoiced in US dollars. If you cancel before we start work,
            your deposit is refunded in full. See the <a href="/terms/" className="text-[#6bc7f8] underline">terms</a> for details.
          </p>
        </section>
      </div>

      <section className="mt-16 max-w-3xl" aria-labelledby="faq">
        <h2 id="faq" className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">Questions</h2>
        <dl className="mt-6 divide-y divide-white/10 border-y border-white/10">
          {howItWorksFaq.map(([q, a]) => (
            <div key={q} className="py-5">
              <dt className="font-semibold">{q}</dt>
              <dd className="mt-2 leading-7 text-[#c3cbe4]">{a}</dd>
            </div>
          ))}
        </dl>
      </section>
      <CtaRow />
    </PageShell>
  );
}

export function PrivacyPage() {
  return (
    <PageShell eyebrow="Privacy policy" title="Privacy policy" intro={<p>Last updated: {business.legalUpdated}</p>}>
      <Prose>
        <p>
          This policy explains what information Analyst Solution (analystsolution.com, &ldquo;we&rdquo;, &ldquo;us&rdquo;) collects,
          how we use it, and the choices you have. It covers this website, the websites we build and host for clients,
          our YouTube channel and social media accounts, and the internal tools we use to run them.
        </p>

        <h2>Information we collect</h2>
        <h3>When you visit this website</h3>
        <p>
          This website does not use cookies, analytics or advertising trackers. Like any website, our hosting provider
          (GitHub Pages) receives technical information such as your IP address and browser type when it serves a page.
          Some pictures are loaded from Unsplash, which receives the same technical information.
        </p>
        <h3>When you email us or use the contact form</h3>
        <p>
          The contact form does not send anything to us by itself. It opens your own email app with your message filled in,
          and we receive only what you choose to send, such as your name, email address and business details.
        </p>
        <h3>When you become a client</h3>
        <p>
          To build your website we receive the text, photos, logo and business details you send us, and the payment
          details needed to issue and record invoices.
        </p>
        <h3>Public comments and messages</h3>
        <p>
          When you comment on our YouTube videos or send us a message on our social media accounts, we see your public
          display name and what you wrote. We also read overall statistics for our own channel, such as subscriber count,
          views and number of comments. These are totals, not information about individual viewers.
        </p>

        <h2>How we use it</h2>
        <ul>
          <li>To answer your questions and send you a quote.</li>
          <li>To build, host and maintain the website you order.</li>
          <li>To send invoices and keep business records.</li>
          <li>To read and reply to comments and messages on our own videos and posts.</li>
          <li>To prepare summaries of how our own channel is performing.</li>
        </ul>
        <p>
          We do not sell your information, use it for advertising profiles, or share it with anyone except the service
          providers that help us run our business (listed below).
        </p>

        <h2>YouTube API Services</h2>
        <p>
          Our internal tools use YouTube API Services to read comments and statistics for our own channel and to post
          replies that we have reviewed and approved. By interacting with our YouTube channel, you are also subject to the{" "}
          <a href="https://www.youtube.com/t/terms">YouTube Terms of Service</a> and the{" "}
          <a href="https://policies.google.com/privacy">Google Privacy Policy</a>. Our tools only access the YouTube account
          that belongs to analystsolution.com. Access can be revoked at any time through{" "}
          <a href="https://myaccount.google.com/permissions">Google&apos;s security settings page</a>.
        </p>

        <h2>Service providers</h2>
        <p>
          We use a small number of trusted services: GitHub (website hosting), Unsplash (images), Google (email and YouTube),
          Anthropic (AI assistance for drafting replies and content, which we review before anything is sent or posted),
          n8n (workflow automation) and Railway (hosting for our internal tools). They process information only to provide
          their service to us.
        </p>

        <h2>How long we keep information</h2>
        <p>
          Emails and project files are kept while we work together and for as long as we need them for our business and
          tax records. Comment and reply records are kept for up to 12 months so we don&apos;t reply to the same comment
          twice, then deleted. Channel statistics are kept as long as they are useful for tracking our growth.
        </p>

        <h2>Your consent</h2>
        <p>
          When you contact us through the form, you agree that we may use the information you send to reply to you,
          prepare a quote and, if you go ahead, build and host your website. We only use your details for these purposes.
        </p>
        <p>
          We show a client&apos;s finished website in our portfolio or on social media only if they have said yes to that,
          either on the contact form or by email. You can withdraw either consent at any time by emailing{" "}
          <a href={mailto}>{business.email}</a>, and we will stop using your information for that purpose, except
          where we must keep records for tax or legal reasons.
        </p>

        <h2>Your choices and rights</h2>
        <p>
          You can ask us what information we hold about you, ask us to correct it, or ask us to delete it, by emailing{" "}
          <a href={mailto}>{business.email}</a>. You can delete your own comments on YouTube at any time.
        </p>
        <p>
          If you live in California, you have these rights under California privacy law. We do not sell or share your
          personal information for cross-context behavioral advertising, and we will not treat you differently for
          making a request.
        </p>

        <h2>Children</h2>
        <p>Our services are for businesses and adults. We do not knowingly collect information from children under 13.</p>

        <h2>Changes to this policy</h2>
        <p>If we change this policy, we will update the date at the top of this page.</p>

        <h2>Contact</h2>
        <p>
          Questions about this policy: <a href={mailto}>{business.email}</a>
        </p>
      </Prose>
    </PageShell>
  );
}

export function TermsPage() {
  return (
    <PageShell eyebrow="Terms" title="Terms of service" intro={<p>Last updated: {business.legalUpdated}</p>}>
      <Prose>
        <p>
          These terms apply when you order a website from Analyst Solution (analystsolution.com, &ldquo;we&rdquo;, &ldquo;us&rdquo;).
          By paying a deposit, you agree to them. If anything here is unclear, email us before you pay.
        </p>

        <h2>1. What we provide</h2>
        <p>
          We build a website for your business based on the design you choose from this site, set up with the text,
          photos, logo and details you provide. The designs shown on this site are demos for fictional businesses; the
          names, reviews, numbers and contact details in them are sample content and are replaced with yours.
        </p>

        <h2>2. Quotes and payment</h2>
        <ul>
          <li>Every project is quoted by email in US dollars, and you agree to the quote before you pay anything.</li>
          <li>You pay {business.deposit} of the quoted amount up front to start the work, and the remaining {business.deposit} before the site goes live.</li>
        </ul>

        <h2>3. Timeline</h2>
        <p>
          We deliver a preview of your site within {business.deliveryDays} after we receive your deposit and the content we
          need from you. If we are waiting on content or feedback from you, the timeline pauses until it arrives.
        </p>

        <h2>4. Changes</h2>
        <p>
          {business.revisionRounds} rounds of changes after the first preview are included. A round is one list of changes sent
          together. Further rounds, or changes outside the chosen design (for example new page types or features), are
          quoted before we do them.
        </p>

        <h2>5. Your content</h2>
        <p>
          You confirm that you have the right to use the text, photos, logos and other material you send us, and that it
          is accurate. You are responsible for the claims your website makes about your business, including licenses and the services
          you advertise.
        </p>

        <h2>6. Cancellations and refunds</h2>
        <p>
          If you cancel before we start work, we refund your deposit in full. Once work has started, the deposit is not
          refundable.
        </p>

        <h2>7. Use of your information</h2>
        <p>
          We use the information and content you send only to quote, build and host your website, as described in our{" "}
          <a href="/privacy/">privacy policy</a>. We show your finished website in our portfolio or on social media only
          with your consent, which you can withdraw at any time by email.
        </p>

        <h2>8. Ownership and hosting</h2>
        <ul>
          <li>Your domain name is registered and owned by you.</li>
          <li>We host your website for you after launch.</li>
          <li>
            Once you have paid in full, you may use the website, its design and your content for your business. Your own
            content remains yours at all times.
          </li>
        </ul>

        <h2>9. Third-party services</h2>
        <p>
          Your website may rely on services we do not control, such as domain registrars, hosting platforms, email
          providers and map or booking tools. We are not responsible for their outages or changes to their terms.
        </p>

        <h2>10. Limitation of liability</h2>
        <p>
          We build every site with care, but we cannot guarantee that it will be free of every error or produce a
          particular amount of business. To the extent the law allows, our total liability for any claim about a project
          is limited to the amount you paid us for that project.
        </p>

        <h2>11. Changes to these terms</h2>
        <p>
          We may update these terms. The version that applies to your project is the one in place when you paid your deposit.
        </p>

        <h2>12. Contact</h2>
        <p>
          Questions about these terms: <a href={mailto}>{business.email}</a>
        </p>
      </Prose>
    </PageShell>
  );
}
