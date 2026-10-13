import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Template = {
  id: number;
  title: string;
  category: string;
  description: string;
  image: string;
  color: string;
  textColor: string;
  pages: number;
  tag?: string;
  /* Path to an exported standalone site under public/demos. When present the
     card and the modal show the real thing instead of the mock preview. */
  demo?: string;
  /* One-time build price, in whole dollars. Templates without a price are not
     yet buildable and show as "In progress" instead. */
  priceFrom?: number;
  priceTo?: number;
  /* What the buyer actually gets. Only written for templates whose pages exist. */
  features?: string[];
};

const templates: Template[] = [
  {
    id: 1,
    title: "Maison Rue",
    category: "Restaurant",
    description: "An intimate neighborhood restaurant with seasonal menus and reservations.",
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1400",
    color: "#f0e8da",
    textColor: "#2a281f",
    pages: 5,
    tag: "Popular",
  },
  {
    id: 2,
    title: "Serein",
    category: "Fashion",
    description: "A refined editorial storefront for independent fashion labels.",
    image:
      "https://images.unsplash.com/photo-1664076458686-3449062080ac?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1400",
    color: "#d8d9d3",
    textColor: "#181915",
    pages: 7,
    tag: "New",
  },
  {
    id: 3,
    title: "Forma",
    category: "Architecture",
    description: "A spacious project-led portfolio for studios and interior designers.",
    image:
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1400",
    color: "#bec9cc",
    textColor: "#132326",
    pages: 6,
  },
  {
    id: 4,
    title: "Juniper",
    category: "Restaurant",
    description: "A bright, confident hospitality site built for lively all-day dining.",
    image:
      "https://images.unsplash.com/photo-1687945512099-400cbe94460c?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1400",
    color: "#d8dfb6",
    textColor: "#233017",
    pages: 5,
  },
  {
    id: 5,
    title: "Atelier No. 8",
    category: "Portfolio",
    description: "A bold portfolio for artists, photographers, and creative directors.",
    image:
      "https://images.unsplash.com/photo-1603189343302-e603f7add05a?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1400",
    color: "#d6c8e4",
    textColor: "#21162b",
    pages: 4,
  },
  {
    id: 6,
    title: "North House",
    category: "Real Estate",
    description: "A calm, premium property showcase for modern homes and developments.",
    image:
      "https://images.unsplash.com/photo-1721815693498-cc28507c0ba2?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1400",
    color: "#c9d2bf",
    textColor: "#1e281b",
    pages: 8,
  },
  {
    id: 7,
    title: "Clearflow Plumbing",
    category: "Plumber",
    description: "Residential plumbing for San Francisco homes, with a service page for every job type.",
    image: "/demos/clearflow/images/hero.jpg",
    color: "#0f172a",
    textColor: "#e2e8f0",
    pages: 15,
    tag: "New",
    demo: "/demos/clearflow/",
    priceFrom: 500,
    priceTo: 700,
    features: [
      "Nine individual service pages",
      "Reviews page with testimonials",
      "Quote request form",
      "About, contact and privacy pages",
      "Tap-to-call number in the header",
    ],
  },
  {
    id: 8,
    title: "Editorial Plumbing",
    category: "Plumber",
    description: "A magazine-styled take on a trade site, with long-form service pages and quote forms.",
    image: "/demos/editorial/images/hero.jpg",
    color: "#f5f1ea",
    textColor: "#1c1917",
    pages: 15,
    demo: "/demos/editorial/",
    priceFrom: 550,
    priceTo: 750,
    features: [
      "Eight long-form service pages",
      "Service-areas page by suburb",
      "Reviews page",
      "Quote request form",
      "Editorial layout that reads like articles",
    ],
  },
  {
    id: 9,
    title: "Glass Plumbing",
    category: "Plumber",
    description: "Frosted-glass surfaces over a soft blueprint grid, built around the emergency call-out.",
    image: "/demos/glass/images/leak-repair.jpg",
    color: "#eef4ff",
    textColor: "#10213f",
    pages: 5,
    demo: "/demos/glass/",
    priceFrom: 700,
    priceTo: 900,
    features: [
      "Emergency call-out hero",
      "Services and service-areas pages",
      "Price agreed before work starts",
      "Tap-to-call from every screen",
      "Frosted glass over a blueprint grid",
    ],
  },
  {
    id: 10,
    title: "Clearline Plumbing",
    category: "Plumber",
    description: "Shows the system behind the wall, so the customer understands the job before the visit.",
    image: "/demos/interactive3d/images/house-hero.png",
    color: "#0b1220",
    textColor: "#dbeafe",
    pages: 5,
    demo: "/demos/interactive3d/",
    priceFrom: 700,
    priceTo: 900,
    features: [
      "Interactive cutaway of the house",
      "Services and service-areas pages",
      "Visual explainer for each job",
      "About and contact pages",
      "Answers what is actually wrong, before the visit",
    ],
  },
  {
    id: 11,
    title: "Coffee House — Atmosphere",
    category: "Coffee house",
    description: "Photography is the room and the interface sits on it like glass on a table. For a cafe that sells the feeling before the flat white.",
    image: "/demos/coffee-premium/images/hero-espresso.jpg",
    color: "#f3ece2",
    textColor: "#2a211b",
    pages: 6,
    tag: "New",
    demo: "/demos/coffee-premium/",
    priceFrom: 1199,
    features: [
      "Six pages: home, menu, our story, visit, shop, contact",
      "Shop with a working basket and demo checkout",
      "Product dialog for every item on the menu",
      "Frosted glass panels over full-bleed photography",
      "Parallax bands, drifting light and steam",
    ],
  },
  {
    id: 12,
    title: "Coffee House — Brochure",
    category: "Coffee house",
    description: "The same cafe, the same words, the same menu, without the shop. For a place that wants to be found, read and phoned.",
    image: "/demos/coffee-brochure/images/hero-espresso.jpg",
    color: "#f7f4ee",
    textColor: "#1f2a2b",
    pages: 5,
    demo: "/demos/coffee-brochure/",
    priceFrom: 999,
    features: [
      "Five pages: home, menu, our story, visit, contact",
      "Full menu with no ordering system to maintain",
      "Call and directions as the primary actions",
      "Soft light pools over warm white",
      "Lighter build, quicker to get live",
    ],
  },
  {
    id: 13,
    title: "Energy Drink Store",
    category: "Ecom",
    description: "A white-label storefront for a drinks brand: three flavours, three pack sizes, a basket that remembers you and a checkout that walks all the way through.",
    image: "/demos/ecom-energy/icon.svg",
    color: "#0a0d08",
    textColor: "#e6ffd6",
    pages: 11,
    tag: "New",
    demo: "/demos/ecom-energy/",
    priceFrom: 1999,
    features: [
      "Eleven pages including shop, cart and checkout",
      "A product page for every flavour",
      "Single, 6-pack and 12-pack pricing",
      "Basket and demo checkout, no real payment",
      "Athletes, our formula, FAQ and contact pages",
    ],
  },
];

const categories = ["All", "Plumber", "Coffee house", "Ecom", "Restaurant", "Fashion", "Architecture", "Portfolio", "Real Estate"];

function Icon({
  name,
  size = 18,
}: {
  name: "arrow" | "search" | "heart" | "menu" | "close" | "spark" | "play" | "pause";
  size?: number;
}) {
  const paths = {
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />,
    menu: <><path d="M4 8h16M4 16h16" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    spark: <path d="m12 3 1.4 4.2a5 5 0 0 0 3.3 3.3L21 12l-4.3 1.5a5 5 0 0 0-3.3 3.3L12 21l-1.4-4.2a5 5 0 0 0-3.3-3.3L3 12l4.3-1.5a5 5 0 0 0 3.3-3.3L12 3Z" />,
    play: <path d="m9 7 8 5-8 5V7Z" />,
    pause: <><path d="M9 7v10M15 7v10" /></>,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

function DemoThumb({ src, title }: { src: string; title: string }) {
  const [scale, setScale] = useState(0.3);
  const hold = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = hold.current;
    if (!el) return;
    const fit = () => setScale(el.clientWidth / 1280);
    fit();
    if (!window.ResizeObserver) return;
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={hold} className="pointer-events-none h-full w-full overflow-hidden">
      <iframe
        src={src}
        title={`${title} preview`}
        tabIndex={-1}
        aria-hidden="true"
        loading="lazy"
        scrolling="no"
        className="origin-top-left border-0"
        style={{ width: 1280, height: 960, transform: `scale(${scale})` }}
      />
    </div>
  );
}

function Wordmark({ className = "h-7" }: { className?: string }) {
  return <img src="/logo.png" alt="Analyst Solution" className={`${className} w-auto`} />;
}

function TemplateCard({
  item,
  saved,
  onSave,
  onPreview,
}: {
  item: Template;
  saved: boolean;
  onSave: () => void;
  onPreview: () => void;
}) {
  return (
    <article className="group flex min-w-0 flex-col">
      <div
        className="relative aspect-[4/3] overflow-hidden rounded-[22px] border border-white/10 p-3 transition-transform duration-300 group-hover:-translate-y-1"
        style={{ backgroundColor: item.color }}
      >
        {item.tag && (
          <span className="absolute left-6 top-6 z-10 rounded-full bg-[#f7f5ef] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.13em] text-[#24231e]">
            {item.tag}
          </span>
        )}
        <button
          onClick={onSave}
          className="absolute right-6 top-6 z-10 grid h-9 w-9 place-items-center rounded-full bg-[#f7f5ef] text-[#24231e] transition-transform hover:scale-105"
          aria-label={saved ? `Remove ${item.title} from saved` : `Save ${item.title}`}
        >
          <span className={saved ? "fill-current text-[#2557f4]" : ""}>
            <Icon name="heart" size={17} />
          </span>
        </button>
        <button
          className="site-preview h-full w-full cursor-pointer overflow-hidden rounded-[13px] bg-white shadow-[0_18px_45px_rgba(32,31,27,0.14)]"
          onClick={onPreview}
          aria-label={`Preview ${item.title}`}
        >
          {item.demo ? <DemoThumb src={item.demo} title={item.title} /> : (
          <div className="site-preview-page h-[175%]">
            <div className="flex h-[8%] items-center justify-between px-[5%]" style={{ color: item.textColor }}>
              <span className="text-[9px] font-black uppercase tracking-[0.12em] sm:text-[11px]">{item.title}</span>
              <span className="text-[7px] font-semibold uppercase tracking-widest sm:text-[8px]">Menu &nbsp; About &nbsp; Visit</span>
            </div>
            <img
              src={item.image}
              alt={`${item.category} website preview`}
              className="h-[45%] w-full object-cover"
            />
            <div className="flex h-[18%] items-center justify-between px-[7%]" style={{ backgroundColor: "#fff", color: item.textColor }}>
              <span className="max-w-[65%] text-left font-display text-sm leading-tight sm:text-lg">
                Designed for a life well lived.
              </span>
              <span className="text-[7px] font-bold uppercase tracking-wider sm:text-[8px]">Explore →</span>
            </div>
            <div className="grid h-[29%] grid-cols-2 gap-px bg-black/10 text-left" style={{ color: item.textColor }}>
              <div className="flex flex-col justify-between bg-[#f8f7f2] p-[10%]">
                <span className="text-[7px] font-bold uppercase tracking-[0.16em]">Our story</span>
                <p className="font-display text-xs leading-tight sm:text-base">A thoughtful approach to the everyday.</p>
                <span className="text-[7px] font-bold uppercase tracking-wider">Discover more →</span>
              </div>
              <div className="overflow-hidden">
                <img src={item.image} alt="" className="h-full w-full scale-125 object-cover" />
              </div>
            </div>
          </div>
          )}
        </button>
      </div>
      <div className="flex flex-1 flex-col px-1 pt-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <button onClick={onPreview} className="text-left">
              <h3 className="text-[19px] font-semibold tracking-[-0.025em] text-[#e9edfb] hover:underline">{item.title}</h3>
            </button>
            <p className="mt-1 text-sm text-[#8a93b0]">
              {item.category} · {item.pages} pages
            </p>
          </div>
          <button
            onClick={onPreview}
            className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/15 text-[#e9edfb] transition-colors hover:bg-white hover:text-[#05060e]"
            aria-label={`Open ${item.title}`}
          >
            <Icon name="arrow" size={16} />
          </button>
        </div>

        <p className="mt-3 text-sm leading-6 text-[#8a93b0]">{item.description}</p>

        {item.features && (
          <ul className="mt-4 space-y-2">
            {item.features.map((f) => (
              <li key={f} className="flex gap-2.5 text-sm leading-6 text-[#c3cbe4]">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#6bc7f8]" aria-hidden="true" />
                {f}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto pt-5">
          {item.priceFrom ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-[26px] font-bold tracking-[-0.03em] text-[#e9edfb]">
                  ${item.priceFrom.toLocaleString()}
                </span>
                {item.priceTo && item.priceTo !== item.priceFrom && (
                  <span className="text-sm text-[#8a93b0]">
                    to ${item.priceTo.toLocaleString()}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-[#8a93b0]">One-time build. No monthly fee for the site itself.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={`mailto:analyst2sales@gmail.com?subject=${encodeURIComponent(
                    `I want the ${item.title} design`,
                  )}&body=${encodeURIComponent(
                    `Hi - I would like this design for my business.\n\nDesign: ${item.title}\nIndicative price: ${
                      item.priceTo && item.priceTo !== item.priceFrom
                        ? `$${item.priceFrom} to $${item.priceTo}`
                        : `$${item.priceFrom}`
                    }\n\nMy business:\nMy phone:\n`,
                  )}`}
                  className="brand-grad-bg rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-white transition-opacity hover:opacity-90"
                >
                  Get this design
                </a>
                <button
                  onClick={onPreview}
                  className="rounded-full border border-white/15 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-[#e9edfb] hover:border-[#6bc7f8]"
                >
                  Preview
                </button>
              </div>
            </>
          ) : (
            item.demo ? (
              <>
                <div className="font-display text-[20px] font-bold tracking-[-0.02em] text-[#e9edfb]">
                  Price on request
                </div>
                <p className="mt-0.5 text-xs text-[#8a93b0]">Built and ready. Ask and we will quote it.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={`mailto:analyst2sales@gmail.com?subject=${encodeURIComponent(
                      `Price for the ${item.title} design`,
                    )}&body=${encodeURIComponent(
                      `Hi - what would this design cost for my business?\n\nDesign: ${item.title}\n\nMy business:\nMy phone:\n`,
                    )}`}
                    className="brand-grad-bg rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-white transition-opacity hover:opacity-90"
                  >
                    Ask the price
                  </a>
                  <button
                    onClick={onPreview}
                    className="rounded-full border border-white/15 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-[#e9edfb] hover:border-[#6bc7f8]"
                  >
                    Preview
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3.5 py-1.5 text-xs font-semibold text-[#8a93b0]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#8a93b0]" aria-hidden="true" />
                  In progress
                </span>
                <p className="mt-2.5 text-xs text-[#8a93b0]">Preview only for now. Priced once the full build is finished.</p>
              </>
            )
          )}
        </div>
      </div>
    </article>
  );
}

function PreviewModal({ item, onClose }: { item: Template; onClose: () => void }) {
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-[#05060e]/80 p-2 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true">
      <div className="mx-auto flex h-full max-w-[1440px] flex-col overflow-hidden rounded-[20px] bg-[#0b0e1c] shadow-2xl ring-1 ring-white/10">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[#66a875]" />
            <span className="text-sm font-semibold">{item.title} — Live demo</span>
          </div>
          <div className="flex items-center gap-2">
            {item.demo && (
              <a
                href={item.demo}
                target="_blank"
                rel="noopener"
                className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-semibold hover:bg-white/10"
              >
                Open full screen
              </a>
            )}
            <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10" aria-label="Close preview">
              <Icon name="close" />
            </button>
          </div>
        </div>
        {item.demo ? (
          <iframe
            src={item.demo}
            title={`${item.title} live demo`}
            className="min-h-0 w-full flex-1 border-0 bg-white"
          />
        ) : (
        <div className="min-h-0 flex-1 overflow-y-auto" style={{ backgroundColor: item.color, color: item.textColor }}>
          <nav className="flex items-center justify-between px-6 py-6 sm:px-12">
            <span className="text-lg font-black uppercase tracking-[0.12em]">{item.title}</span>
            <div className="hidden items-center gap-8 text-xs font-bold uppercase tracking-wider sm:flex">
              <a href="#story">Our story</a><a href="#collection">Collection</a><a href="#contact">Contact</a>
            </div>
            <button onClick={() => setNotice("Your table is held for 15 minutes — demo only.")} className="rounded-full border border-current px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-black hover:text-white">
              Enquire
            </button>
          </nav>
          {notice && (
            <button onClick={() => setNotice("")} className="mx-auto mb-2 block rounded-full bg-[#05060e] px-5 py-2 text-xs font-semibold text-white">
              {notice} ×
            </button>
          )}
          <section className="grid min-h-[calc(100%-88px)] items-center gap-8 px-6 pb-10 sm:grid-cols-2 sm:px-12 sm:pb-12">
            <div className="order-2 max-w-xl sm:order-1">
              <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em]">Independent · Thoughtful · Modern</p>
              <h2 className="font-display text-5xl leading-[0.95] tracking-[-0.045em] sm:text-7xl lg:text-8xl">
                Made for the<br />curious at heart.
              </h2>
              <p className="mt-7 max-w-md text-base leading-7 opacity-75">
                This is a functional dummy website. Explore the navigation, try the enquiry button, and imagine your story here.
              </p>
              <button onClick={() => setNotice("Thanks for exploring — this interaction works!")} className="mt-8 inline-flex items-center gap-3 border-b border-current pb-2 text-sm font-bold uppercase tracking-widest">
                Start exploring <Icon name="arrow" />
              </button>
            </div>
            <div className="order-1 h-[42vh] overflow-hidden rounded-[2px] sm:order-2 sm:h-[68vh]">
              <img src={item.image} alt="" className="h-full w-full object-cover" />
            </div>
          </section>
        </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<number[]>([]);
  const [preview, setPreview] = useState<Template | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");

  const visible = useMemo(
    () =>
      templates.filter(
        (item) =>
          (category === "All" || item.category === category) &&
          `${item.title} ${item.category} ${item.description}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [category, query],
  );

  const subscribe = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setEmailMessage(`You're on the list, ${data.get("email")}.`);
    event.currentTarget.reset();
  };

  return (
    <div className="min-h-screen bg-[#05060e] text-[#e9edfb]">
      <header className="border-b border-white/10">
        <div className="mx-auto flex h-[76px] max-w-[1420px] items-center justify-between px-5 sm:px-8">
          <a href="#" aria-label="Analyst Solution home"><Wordmark className="h-7 sm:h-8" /></a>
          <nav className="hidden items-center gap-8 text-sm font-semibold md:flex">
            <a href="#templates" className="hover:text-[#6bc7f8]">Templates</a>
            <a href="#about" className="hover:text-[#6bc7f8]">How it works</a>
            <a href="#journal" className="hover:text-[#6bc7f8]">Journal</a>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <button onClick={() => setQuery("")} className="grid h-10 w-10 place-items-center rounded-full border border-white/15 hover:border-[#6bc7f8]" aria-label="Search templates">
              <Icon name="search" />
            </button>
            <a href="#templates" className="brand-grad-bg rounded-full px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white transition-opacity hover:opacity-90">Browse all</a>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="grid h-10 w-10 place-items-center md:hidden" aria-label="Toggle menu">
            <Icon name={mobileOpen ? "close" : "menu"} />
          </button>
        </div>
        {mobileOpen && (
          <nav className="flex flex-col gap-4 border-t border-white/10 px-5 py-5 text-lg font-semibold md:hidden">
            <a href="#templates" onClick={() => setMobileOpen(false)}>Templates</a>
            <a href="#about" onClick={() => setMobileOpen(false)}>How it works</a>
            <a href="#journal" onClick={() => setMobileOpen(false)}>Journal</a>
          </nav>
        )}
      </header>

      <main>
        <section className="mx-auto flex max-w-[1420px] flex-col px-5 pb-16 pt-6 sm:px-8 sm:pb-24 sm:pt-8">
          <div className="order-2 mt-14 grid items-end gap-10 sm:mt-20 lg:grid-cols-[1fr_370px]">
            <div>
              <p className="mb-7 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#6bc7f8]">
                <Icon name="spark" size={15} /> Thoughtful websites, ready to make yours
              </p>
              <h1 className="max-w-5xl font-display text-[clamp(3.8rem,8vw,8rem)] leading-[0.86] tracking-[-0.055em]">
                Good design,<br /><span className="brand-grad-text italic">ready to go.</span>
              </h1>
            </div>
            <div className="pb-2">
              <p className="text-lg leading-8 text-[#8a93b0]">
                A considered collection of fully functional website templates for people building something meaningful.
              </p>
              <a href="#templates" className="mt-7 inline-flex items-center gap-3 border-b border-[#6bc7f8] pb-2 text-sm font-bold uppercase tracking-[0.12em] text-[#e9edfb]">
                Explore templates <Icon name="arrow" />
              </a>
            </div>
          </div>
          <div className="order-1 relative overflow-hidden rounded-[22px] bg-[#0b0e1c] p-2 shadow-[0_40px_110px_-30px_rgba(37,87,244,0.55)] ring-1 ring-white/10 sm:rounded-[30px] sm:p-3">
            <div className="flex h-9 items-center justify-between px-2 text-white/60 sm:h-11 sm:px-3">
              <div className="flex gap-1.5">
                <span className="h-2 w-2 rounded-full bg-white/25" />
                <span className="h-2 w-2 rounded-full bg-white/25" />
                <span className="h-2 w-2 rounded-full bg-white/25" />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-[0.18em] sm:text-[10px]">Template showreel</span>
              {/* balances the traffic-light dots so the label stays centred */}
              <span className="h-8 w-8" aria-hidden="true" />
            </div>
            <div className={`website-reel grid aspect-[16/9] grid-cols-3 gap-1.5 overflow-hidden rounded-[15px] bg-[#05060e] p-1.5 sm:gap-3 sm:rounded-[20px] sm:p-3`}>
              {templates.slice(0, 3).map((item, index) => (
                <div key={item.id} className="hero-site-window relative overflow-hidden bg-white">
                  <div
                    className={`hero-site-page h-[220%] ${index === 1 ? "scroll-down" : "scroll-up"}`}
                    style={{ backgroundColor: item.color, color: item.textColor }}
                  >
                    <div className="flex h-[7%] items-center justify-between bg-white px-[6%]">
                      <span className="text-[5px] font-black uppercase tracking-[0.14em] sm:text-[10px]">{item.title}</span>
                      <span className="text-[4px] font-bold uppercase tracking-wider sm:text-[7px]">Work &nbsp; About &nbsp; Menu</span>
                    </div>
                    <div className="relative h-[36%] overflow-hidden">
                      <img src={item.image} alt={`${item.title} website moving ${index === 1 ? "down" : "up"}`} className="h-full w-full object-cover" />
                      <div className="absolute inset-x-0 bottom-[8%] px-[7%] text-white drop-shadow-md">
                        <span className="text-[5px] font-bold uppercase tracking-[0.2em] sm:text-[8px]">The latest edition</span>
                        <p className="mt-1 font-display text-[clamp(.8rem,2.5vw,2.7rem)] leading-[0.9] tracking-[-0.04em]">
                          {index === 0 ? "Gather & stay." : index === 1 ? "Soft structure." : "Space to live."}
                        </p>
                      </div>
                    </div>
                    <div className="flex h-[19%] flex-col items-center justify-center px-[9%] text-center">
                      <span className="text-[5px] font-bold uppercase tracking-[0.2em] sm:text-[8px]">Our point of view</span>
                      <p className="mt-[5%] font-display text-[clamp(.7rem,1.8vw,1.8rem)] leading-tight">Thoughtful design for<br />the way we live now.</p>
                      <span className="mt-[6%] border-b border-current pb-1 text-[4px] font-bold uppercase tracking-wider sm:text-[7px]">Discover the story</span>
                    </div>
                    <div className="grid h-[27%] grid-cols-2 gap-px bg-black/10">
                      <img src={templates[(index + 3) % templates.length].image} alt="" className="h-full w-full object-cover" />
                      <div className="flex flex-col justify-between bg-[#f7f5ef] p-[10%]">
                        <span className="text-[4px] font-bold uppercase tracking-[0.18em] sm:text-[7px]">Selected journal</span>
                        <p className="font-display text-[clamp(.6rem,1.5vw,1.45rem)] leading-tight">A slower, more considered approach.</p>
                        <span className="text-[4px] font-bold uppercase sm:text-[7px]">Read more →</span>
                      </div>
                    </div>
                    <div className="flex h-[11%] items-center justify-between bg-[#22221e] px-[7%] text-[#f7f5ef]">
                      <span className="text-[5px] font-black uppercase tracking-[0.14em] sm:text-[9px]">{item.title}</span>
                      <span className="text-[4px] uppercase tracking-wider text-white/60 sm:text-[7px]">Instagram &nbsp; Contact</span>
                    </div>
                  </div>
                  <span className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-black/55 px-2 py-1 text-[5px] font-bold uppercase tracking-wider text-white backdrop-blur-sm sm:bottom-3 sm:left-3 sm:text-[7px]">
                    {index === 1 ? "Scrolling down" : "Scrolling up"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="templates" className="border-t border-white/10">
          <div className="mx-auto max-w-[1420px] px-5 py-14 sm:px-8 sm:py-20">
            <div className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a93b0]">The collection</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Find your starting point.</h2>
              </div>
              <label className="flex h-12 w-full items-center gap-3 rounded-full border border-white/15 bg-[#11152a] px-5 lg:w-[320px]">
                <Icon name="search" size={17} />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search templates" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#8a93b0]" />
              </label>
            </div>
            <div className="no-scrollbar mb-10 flex gap-2 overflow-x-auto pb-2">
              {categories.map((item) => (
                <button
                  key={item}
                  onClick={() => setCategory(item)}
                  className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${category === item ? "brand-grad-bg text-white" : "border border-white/15 text-[#8a93b0] hover:border-[#6bc7f8] hover:text-[#e9edfb]"}`}
                >
                  {item}
                </button>
              ))}
            </div>
            {visible.length ? (
              <div className="grid gap-x-6 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
                {visible.map((item) => (
                  <TemplateCard
                    key={item.id}
                    item={item}
                    saved={saved.includes(item.id)}
                    onSave={() => setSaved((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])}
                    onPreview={() => setPreview(item)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-[22px] border border-dashed border-white/15 py-20 text-center">
                <p className="text-xl font-semibold">No templates found.</p>
                <button onClick={() => { setQuery(""); setCategory("All"); }} className="mt-3 text-sm underline">Clear filters</button>
              </div>
            )}
          </div>
        </section>

        <section id="about" className="bg-[#0b0e1c] text-[#e9edfb]">
          <div className="mx-auto grid max-w-[1420px] gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.17em] text-[#6bc7f8]">Built to be used</p>
              <h2 className="mt-6 max-w-2xl font-display text-5xl leading-[0.98] tracking-[-0.045em] sm:text-7xl">Not just pretty pictures.</h2>
            </div>
            <div className="grid gap-8 sm:grid-cols-2">
              {[
                ["01", "Fully responsive", "Carefully considered across mobile, tablet, and desktop."],
                ["02", "Real interactions", "Working forms, menus, filters, carts, and booking flows."],
                ["03", "Easy to adapt", "Clear structures and flexible sections ready for your content."],
                ["04", "Accessible by default", "Thoughtful contrast, focus states, and keyboard support."],
              ].map(([number, title, body]) => (
                <div key={number} className="border-t border-white/20 pt-5">
                  <span className="text-xs text-[#8a93b0]">{number}</span>
                  <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#8a93b0]">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="journal" className="mx-auto max-w-[1420px] px-5 py-20 sm:px-8 sm:py-28">
          <div className="brand-grad-bg rounded-[28px] px-6 py-14 text-center text-white sm:px-12 sm:py-20">
            <p className="text-xs font-bold uppercase tracking-[0.18em]">New templates, occasionally</p>
            <h2 className="mx-auto mt-5 max-w-3xl font-display text-4xl tracking-[-0.04em] sm:text-6xl">Fresh ideas for your next thing.</h2>
            {emailMessage ? (
              <p className="mt-8 text-base font-semibold">{emailMessage}</p>
            ) : (
              <form onSubmit={subscribe} className="mx-auto mt-9 flex max-w-md flex-col gap-3 sm:flex-row">
                <input type="email" name="email" required placeholder="Your email address" className="h-13 min-w-0 flex-1 rounded-full bg-white/90 px-5 text-sm text-[#05060e] outline-none focus:ring-2 focus:ring-[#05060e]" />
                <button className="h-13 rounded-full bg-[#05060e] px-7 text-xs font-bold uppercase tracking-wider text-white">Join the list</button>
              </form>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1420px] flex-col justify-between gap-5 px-5 py-8 text-sm text-[#8a93b0] sm:flex-row sm:px-8">
          <Wordmark className="h-6" />
          <span>Demo templates for real ideas. © 2025</span>
          <div className="flex gap-5"><a href="#">Instagram</a><a href="#">Pinterest</a></div>
        </div>
      </footer>

      {preview && <PreviewModal item={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}
