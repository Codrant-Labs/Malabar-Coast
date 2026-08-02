import Image from "next/image";
import Link from "next/link";

const GOOGLE_MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=33+Main+Street+Holytown+North+Lanarkshire+ML1+4TH";

function SocialIcon({ name }: { name: "instagram" | "whatsapp" | "facebook" | "x" | "location" }) {
  if (name === "instagram") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle className="fill" cx="17.3" cy="6.8" r="1" />
      </svg>
    );
  }

  if (name === "whatsapp") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.2 11.7a8.2 8.2 0 0 1-12.1 7.2L4 20l1.1-4a8.2 8.2 0 1 1 15.1-4.3Z" />
        <path d="M9 7.9c.3-.3.7-.2.9.2l.8 1.8c.1.3 0 .6-.2.8l-.6.6c.7 1.4 1.7 2.4 3.1 3.1l.6-.7c.2-.2.5-.3.8-.2l1.8.9c.4.2.5.6.2.9-.6.8-1.4 1.2-2.3 1-3.8-.7-6.6-3.5-7.3-7.2-.1-.6.8-1.2 1.2-1.2Z" />
      </svg>
    );
  }

  if (name === "facebook") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M13.2 20v-7h2.3l.4-2.7h-2.7V8.6c0-.8.2-1.3 1.4-1.3H16V4.9c-.5-.1-1.2-.2-2.1-.2-2.1 0-3.5 1.3-3.5 3.6v2H8V13h2.4v7" />
      </svg>
    );
  }

  if (name === "x") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 4l14 16M19 4 5 20" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 10c0 5.4-8 11-8 11S4 15.4 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

const pendingSocials = [
  { name: "instagram" as const, label: "Instagram" },
  { name: "whatsapp" as const, label: "WhatsApp" },
  { name: "facebook" as const, label: "Facebook" },
  { name: "x" as const, label: "X" },
];

export function SiteFooter() {
  return (
    <footer className="siteFooter" aria-label="Malabar Coast footer">
      <div className="siteFooterLead">
        <div>
          <p>Stay close to the coast</p>
          <h2>Our socials</h2>
          <div className="siteFooterSocials" aria-label="Social profiles">
            {pendingSocials.map((social) => (
              <span key={social.name} title={`${social.label} link coming soon`} aria-label={`${social.label} link coming soon`}>
                <SocialIcon name={social.name} />
              </span>
            ))}
            <a href={GOOGLE_MAPS_URL} target="_blank" rel="noreferrer" aria-label="Find Malabar Coast on Google Maps">
              <SocialIcon name="location" />
            </a>
          </div>
          <small>Social links will be added when the official profiles are supplied.</small>
        </div>

        <nav className="siteFooterNav" aria-label="Footer navigation">
          <Link href="/restaurant">Restaurant <span aria-hidden="true">↗</span></Link>
          <Link href="/hall">Private hall <span aria-hidden="true">↗</span></Link>
          <Link href="/menu">Menu <span aria-hidden="true">↗</span></Link>
          <Link href="/story">Our story <span aria-hidden="true">↗</span></Link>
          <Link href="/faq">Good to know <span aria-hidden="true">↗</span></Link>
          <Link href="/#reservations">Plan your visit <span aria-hidden="true">↗</span></Link>
        </nav>

        <address className="siteFooterAddress">
          <p>Come ashore</p>
          <strong>33 Main Street</strong>
          <span>Holytown, North Lanarkshire</span>
          <span>ML1 4TH · Scotland</span>
          <a href={GOOGLE_MAPS_URL} target="_blank" rel="noreferrer">Get directions <span aria-hidden="true">↗</span></a>
        </address>
      </div>

      <div className="siteFooterBrand" aria-hidden="true">
        <i />
        <Image src="/logo-white.png" alt="" width={1372} height={285} sizes="(max-width: 600px) 44vw, 13rem" />
        <i />
      </div>

      <div className="siteFooterLegal">
        <div aria-label="Policy pages coming soon">
          <span title="Payments information coming soon">Payments</span>
          <i>·</i>
          <span title="Returns information coming soon">Returns</span>
          <i>·</i>
          <span title="Cookie information coming soon">Cookie</span>
          <i>·</i>
          <span title="Privacy information coming soon">Privacy</span>
        </div>
        <p>© Malabar Coast 2026. All rights reserved.</p>
      </div>

      <a className="siteFooterCredit" href="https://codrantlabs.in/" target="_blank" rel="noreferrer" aria-label="Website made with Codrant Labs">
        Made with <span>Codrantlabs.in</span>
      </a>
    </footer>
  );
}
