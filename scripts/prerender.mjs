// Prerenders every route to static HTML after `vite build`, so crawlers that do not run
// JavaScript (Bing, ChatGPT, Perplexity, Claude) see the real content. Also writes the
// per-page <head> (title, description, canonical, social tags, JSON-LD), sitemap.xml and llms.txt.
//
// Runs as the last step of `npm run build`; expects dist/ (client) and dist-ssr/ (server bundle).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const ssrDir = path.join(root, 'dist-ssr')
const SITE = 'https://www.analystsolution.com'
const BRAND = 'Analyst Solution'
const OG_IMAGE = `${SITE}/og-image.png`
const EMAIL = 'analyst2sales@gmail.com'
const YOUTUBE = 'https://www.youtube.com/@analystsolution'

const { render, templatePages, templatePath, formatPrice } = await import(
  pathToFileURL(path.join(ssrDir, 'entry-server.js')).href
)

const shell = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')

const esc = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function clip(text, max = 160) {
  if (text.length <= max) return text
  return `${text.slice(0, max - 1).replace(/\s+\S*$/, '')}…`
}

const organization = {
  '@type': 'Organization',
  '@id': `${SITE}/#organization`,
  name: BRAND,
  alternateName: 'Analyst Solution website design',
  url: `${SITE}/`,
  logo: `${SITE}/logo.png`,
  email: EMAIL,
  description: 'Finished website designs for local businesses, built for the buyer for a one-time price.',
  areaServed: [
    { '@type': 'Country', name: 'United States' },
    { '@type': 'State', name: 'California' },
  ],
  address: { '@type': 'PostalAddress', addressCountry: 'IN' },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'sales',
    email: EMAIL,
    availableLanguage: 'English',
    areaServed: 'US',
  },
  sameAs: [YOUTUBE],
}

function offerFor(item) {
  if (!item.priceFrom) return undefined
  if (item.priceTo && item.priceTo !== item.priceFrom) {
    return { '@type': 'AggregateOffer', priceCurrency: 'USD', lowPrice: item.priceFrom, highPrice: item.priceTo }
  }
  return { '@type': 'Offer', priceCurrency: 'USD', price: item.priceFrom }
}

function homePage() {
  const priced = templatePages.filter((t) => t.priceFrom)
  return {
    route: '/',
    title: `Done-for-You Websites for Local Businesses | ${BRAND}`,
    description:
      'Finished website designs for US plumbers, cafes and shops. Open any one as a working demo, then we build it as yours from $500. One-time price, no monthly fee.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        organization,
        {
          '@type': 'WebSite',
          '@id': `${SITE}/#website`,
          url: `${SITE}/`,
          name: BRAND,
          publisher: { '@id': `${SITE}/#organization` },
          inLanguage: 'en-US',
        },
        {
          '@type': 'OfferCatalog',
          '@id': `${SITE}/#catalog`,
          name: 'Website designs for local businesses',
          itemListElement: priced.map((t) => ({
            ...offerFor(t),
            url: `${SITE}${templatePath(t)}`,
            itemOffered: { '@type': 'Service', name: `${t.title} website build`, category: `${t.category} website design` },
          })),
        },
      ],
    },
  }
}

function templatePage(item) {
  const url = `${SITE}${templatePath(item)}`
  const price = formatPrice(item)
  const service = {
    '@type': 'Service',
    '@id': `${url}#service`,
    name: `${item.title} website build`,
    serviceType: `${item.category} website design`,
    description: item.description,
    url,
    provider: { '@id': `${SITE}/#organization` },
    areaServed: { '@type': 'Country', name: 'United States' },
  }
  const offer = offerFor(item)
  if (offer) service.offers = { ...offer, url }
  const baseTitle = `${item.title}: ${item.category} Website Design${item.priceFrom ? ` from $${item.priceFrom.toLocaleString('en-US')}` : ''}`
  return {
    route: templatePath(item),
    // Keep titles inside what Google shows; the brand suffix is the first thing to go.
    title: baseTitle.length + BRAND.length + 3 <= 70 ? `${baseTitle} | ${BRAND}` : baseTitle,
    description: clip(
      `${item.description}${price ? ` One-time build, ${price}, no monthly fee.` : ' Built and ready; ask for a quote.'}`,
    ),
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        organization,
        service,
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
            { '@type': 'ListItem', position: 2, name: 'Templates', item: `${SITE}/#templates` },
            { '@type': 'ListItem', position: 3, name: item.title, item: url },
          ],
        },
      ],
    },
  }
}

function headFor(page) {
  const url = `${SITE}${page.route}`
  return [
    `<title>${esc(page.title)}</title>`,
    `<meta name="description" content="${esc(page.description)}">`,
    `<link rel="canonical" href="${url}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${BRAND}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:title" content="${esc(page.title)}">`,
    `<meta property="og:description" content="${esc(page.description)}">`,
    `<meta property="og:image" content="${OG_IMAGE}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:image" content="${OG_IMAGE}">`,
    `<script type="application/ld+json">${JSON.stringify(page.jsonLd).replace(/</g, '\\u003c')}</script>`,
  ].join('\n    ')
}

// Drop the generic tags the Figma site plugin injects; each page gets its own set below.
const baseShell = shell
  .replace(/<title>[\s\S]*?<\/title>\s*/, '')
  .replace(/<meta name="description"[^>]*>\s*/g, '')
  .replace(/<meta property="og:(title|description|image)"[^>]*>\s*/g, '')
  .replace(/<meta name="twitter:(card|image)"[^>]*>\s*/g, '')

if (!baseShell.includes('<div id="root"></div>')) {
  throw new Error('dist/index.html has no empty #root to prerender into')
}

const pages = [homePage(), ...templatePages.map(templatePage)]
for (const page of pages) {
  const html = baseShell
    .replace('</head>', `    ${headFor(page)}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${render(page.route)}</div>`)
  const file = path.join(dist, page.route, 'index.html')
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, html)
  console.log(`prerendered ${page.route}`)
}

const today = new Date().toISOString().slice(0, 10)
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url><loc>${SITE}${p.route}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`
fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap)

const llms = `# ${BRAND}

> ${BRAND} sells finished website designs for local businesses such as plumbers, cafes and online shops, mainly in the United States. Every design is a working demo you can open; the buyer gets it built as their own site for a one-time price with no monthly fee for the site itself. Orders and questions go by email to ${EMAIL}.

## Website designs

${templatePages
  .map((t) => `- [${t.title}](${SITE}${templatePath(t)}): ${t.category}, ${t.pages} ${t.pages === 1 ? 'page' : 'pages'}${t.priceFrom ? `, ${formatPrice(t)} one-time` : ', price on request'}. ${t.description}`)
  .join('\n')}

## Contact

- Email: ${EMAIL}
- YouTube: ${YOUTUBE}
`
fs.writeFileSync(path.join(dist, 'llms.txt'), llms)

fs.rmSync(ssrDir, { recursive: true, force: true })
console.log(`wrote sitemap.xml (${pages.length} URLs) and llms.txt`)
