# QA report: Mirrorline Detail Studio demo + Auto Detailing Studio template page

**Overall: PASS** (after 4 small fixes, listed below). Tested 2026-10-21.

Scope: `demos/detailer/` and `templates/auto-detailing-studio/index.html`.
How: repo root served with `python3 -m http.server 8741`, headless Chrome 155 driven over CDP from Node 24, viewports 390x844 (mobile, touch, DPR 2) and 1440x900 (desktop). Flows were also re-run with `prefers-reduced-motion: reduce`. Lighthouse itself was not run; performance is a manual sanity check (request list, bytes, third parties).

## Checks

| Area | Check | 390x844 | 1440x900 | Notes |
|---|---|---|---|---|
| Console | No console errors, warnings or exceptions | PASS | PASS | Demo and template, both viewports |
| Network | No failed requests, no 4xx/5xx | PASS | PASS | Demo 21 requests, template 0 failures |
| Images | All images load | PASS | PASS | Demo has no `<img>` (all SVG/CSS); no broken `<use href>` refs; template logo loads |
| Layout | No horizontal overflow (sampled while scrolling the full page) | PASS | PASS | scrollWidth = clientWidth at every scroll step |
| Headings | Exactly one h1 | PASS | PASS | Demo and template |
| Anchors | Every `#` link has a target | PASS | PASS | |
| Process stages | Scroll drives Arrival > Purify > Correct > Protect > Reveal | PASS | PASS | Cards 0 to 4 activate in order |
| Packages | "Get a quote" picks that package in the quote builder and scrolls to it | PASS | PASS | |
| Quote builder | SUV + Ceramic Shield + 2 add-ons = $1,470 to $2,400 (matches data/quote.js maths) | PASS | PASS | Labelled "Example", with a note that these are not real prices |
| Quote to booking | "Book with this estimate" prefills size, package and notes, scrolls to the form | PASS | PASS | |
| Booking validation | Empty submit shows 6 errors, focus moves to the first; short phone, bad email and past date are rejected | PASS | PASS | |
| Booking success | Valid submit shows the confirmation with a reference, focus moves to it, "Make another request" resets | PASS | PASS | "Demo only: nothing was sent" shown |
| Before/after slider | Auto-sweep runs once, arrow keys move it, pointer/touch drag moves it | PASS | PASS | Touch drag tested with real touch events |
| Mobile dock | Call/Book dock shows after the hero, hides at the booking form | PASS | n/a | Hidden at 900 px and up |
| Keyboard | Skip link first, logical order, visible 3 px focus ring on every stop | PASS (after fix 2, 3) | PASS (after fix 2) | |
| Tap targets | Interactive targets at least 44 px on mobile | PASS* | n/a | *Only the inline footer credit link is 16 px tall (inline text, allowed by WCAG 2.5.8) |
| Contrast | Text meets 4.5:1 (3:1 large) | PASS | PASS | Only failures were the outlined decorative stage numbers, which are `aria-hidden` |
| Reduced motion | Flows work with reduced motion on | PASS | n/a | |
| Weight | Demo total about 199 KB uncompressed (HTML 43 KB, CSS 40 KB, 6 fonts 95 KB, JS 30 KB) | PASS | PASS | |
| Lazy / blocking | No images to lazy-load; no render-blocking third parties | PASS | PASS | Demo makes zero outside requests; template's only third party is the Metricool script, loaded async |
| Template iframe | iframe loads `/demos/detailer/` (same origin, h1 and title correct), "Open live demo" links resolve | PASS | PASS | |
| Template links | All internal links return 200 (/, /how-it-works/, /about/, /contact/, /privacy/, /terms/, 3 sibling templates, demo) | PASS | PASS | |
| Template mobile menu | Hamburger opens and closes the nav | PASS (after fix 4) | n/a | Was dead before the fix |
| Owner rule: no service area | No city, state, country, areaServed, "California" or "US" anywhere | PASS | | Checked HTML, JS, data files and rendered text |
| Owner rule: dummy info | Phone (555) 014-2290, email hello@example.com, fictional brand, generic sample names | PASS | | |
| Owner rule: demo notice | Visible "This is a demo website." in the footer, plus "Demo form", "Example" and "Sample reviews" labels; title ends "(demo)" | PASS | | |
| Owner rule: footer credit | Footer link text exactly `analystsolution.com` | PASS (after fix 1) | | Was missing |
| Owner rule: no prices for our services | Template says "Contact for quotation"; demo packages say "Price on request"; quote numbers labelled Example | PASS | | |
| Owner rule: robots | Demo has `noindex, nofollow` | PASS | | Template is also `noindex` (draft) |
| Owner rule: Metricool | Template has the script with hash a133d7800d7f9201292d6a7eb9e8300d and `beTracker` loads; demo has no Metricool | PASS | | |

## Fixes made

1. `demos/detailer/index.html:629`: added the footer credit `Demo by <a href="https://www.analystsolution.com">analystsolution.com</a>`, which was missing.
2. `demos/detailer/assets/css/site.css:169`: when keyboard focus lands on a stage card that isn't the active one (the "Book your reveal" button while Arrival is showing), the other cards are hidden. Before, two cards' text overlapped.
3. `demos/detailer/assets/css/site.css:10`: added `scroll-padding-bottom: 96px` below 900 px so focused fields scroll clear of the mobile Call/Book dock. Before, a quote radio sat half under the dock.
4. `templates/auto-detailing-studio/index.html:34,36`: the mobile hamburger did nothing, because this static draft has no SPA bundle. Added a mobile nav (`#mobile-nav`) with a small inline toggle script that sets `aria-expanded`. The button is now 44x44 (was 40x40).

All checks were re-run after these fixes, with the same results.

## Open notes (not blocking)

- The demo has no mobile nav menu by design (one-page site with a header Book button, the sticky dock and the footer nav). Fine for a demo, but a section menu could be added later.
- The template page is still a draft that isn't in the SPA. The homepage and the template list don't link to it yet, and the HTML comment says to add it to the SPA source and rebuild before publishing. If it gets rebuilt, the SPA's own header replaces fix 4.
- Both folders are still listed in `.git/info/exclude` (not edited, nothing committed).

## Screenshots

`/Volumes/Work Drive/handoff/website/detailer-qa/`: mobile-hero, desktop-hero, mobile-full, desktop-full (stitched viewport captures, so the header and dock repeat), mobile/desktop-process-stage, -quote-result, -booking-errors, -booking-done, -slider, mobile-reduced-*, mobile-keyboard-stage-focus, template-mobile-hero, template-desktop-hero, template-mobile-iframe, template-desktop-iframe, template-mobile-menu-open (all .jpg).
