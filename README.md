# Analyst Solution — website

Single-page, zero-build static site. No npm, no framework, no deploy pipeline.
Open `index.html` in a browser to preview. Upload the folder to any host to go live.

```
index.html      the entire site (HTML + CSS + JS in one file)
favicon.svg     browser icon
robots.txt      crawler rules
sitemap.xml     search engine sitemap
```

---

## 1. Replace before launch

Everything you must change is written in `[SQUARE BRACKETS]`. Search the file for `[` and work top to bottom.

| Placeholder | Where it appears |
|---|---|
| `[EMAIL ADDRESS]` | contact panel, footer, form fallback (5×) |
| `[WHATSAPP NUMBER]` | contact panel, footer — use international format without `+`, e.g. `919876543210` |
| `[LINKEDIN URL]` | contact panel, footer |
| `[OTHER SOCIAL LINK]` | contact panel |
| `[SHORT BIO — …]` | About section, second paragraph |
| `[ADD YOUR STACK]` / `[ADD — availability]` | About facts list |
| `[DATE]` | Insights articles (4×) |
| `[Add Result]` | Work section outcomes (4×) — fill in only once a client confirms what can be shared |
| `[ADD YOUR NEXT PRODUCT]` | last Solutions card |

Your name already appears in the About section, footer and structured data. Change it if you want the brand fronted instead of the person.

## 2. Adding content later

The repeating blocks are marked with `▼` / `▲` comments in the HTML. To add an item, copy one block and edit the text inside it — nothing else needs touching.

- **Solutions & products** — search `▼ SOLUTION CARD`
- **Projects** — search `▼ PROJECT CARD`
- **Insights** — search `▼ LEAD ARTICLE`
- **About bio** — search `▼ EDIT: your bio`
- **Contact details** — search `▼ EDIT: your real contact details`

Colours, fonts, radius and shadows all live in one `:root` block at the top of the `<style>` tag. Change `--accent` there and the whole site follows.

## 3. Making the contact form work

By default the form opens the visitor's mail client. To receive submissions properly, put an endpoint URL at the top of the `<script>` block:

```js
var FORM_ENDPOINT = "https://your-endpoint-here";
var FALLBACK_EMAIL = "you@yourdomain.com";
```

It POSTs JSON: `{ name, company, email, need, message }`.

### Cheapest n8n setup for this form

On the existing Railway instance — no extra cost, one workflow, three nodes:

1. **Webhook** (POST, response mode: *immediately*) → paste its production URL into `FORM_ENDPOINT`.
2. **Gmail → Send message** to yourself with the five fields in the body.
3. **Telegram → Send message** (optional) so you see enquiries on your phone.

Two things that keep it free and reliable:

- Set the Webhook response to *immediately* rather than *when last node finishes* — the visitor gets confirmation without waiting on Gmail, and one execution stays one execution.
- Add a **Google Sheets → Append row** node only if you want a lead log; skip it and the Gmail thread *is* the log.

You'll need CORS allowed for your domain on the webhook node (Options → Allowed Origins → `https://analystsolution.com`), otherwise the browser will block the POST.

If you'd rather not run n8n for this, Formspree's free tier accepts the same JSON POST with zero configuration.

## 4. Deploying

Any static host works. Cheapest options:

- **Cloudflare Pages / Netlify / Vercel** — drag the folder in, connect the domain, free tier is enough.
- **GitHub Pages** — push the folder, enable Pages, point the domain's CNAME.

After the domain is connected, generate an `og-image.png` (1200×630) and drop it in the root — the social preview tags already point at it.

## 5. Before you call it live

- Replace every `[PLACEHOLDER]`
- Update the two `https://analystsolution.com/` URLs in `robots.txt` and `sitemap.xml` if the final domain differs
- Check the canonical, Open Graph and structured-data URLs in `<head>`
- Test the form end to end
- Run Lighthouse — the page has no external JS and one font request, so it should score high out of the box
