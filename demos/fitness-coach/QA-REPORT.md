# QA report: Forgeline Coaching demo (demos/fitness-coach)

**Overall: PASS** (after the fixes below). QA run on 2026-10-21.

## How it was tested
- I served a copy **without** `media-placeholder/` and `thumb.jpg` from `_work/qa-fitness/site/` on 127.0.0.1:8751, so it matched what gets published.
- I drove headless Chrome 155 over CDP with real mouse and keyboard input. Viewports: 390x844 (DPR 2, touch) and 1440x900, plus overflow checks at 320, 375, 768, 1024 and 1920.
- Tools: axe-core 4.14 (WCAG 2.0/2.1/2.2 A+AA) after all interactions, and Lighthouse 13.5 (desktop preset and mobile).
- Screenshots: `/Volumes/Work Drive/handoff/website/fitness-qa/`

## Results

| Area | Check | Result |
|---|---|---|
| Missing media | Requests to media-placeholder/ or thumb.jpg | PASS (0 requests, 0 x 404). Before the fix there were 4 x 404s: hero mp4 and poster, gym-floor webp, bench-spot webp |
| Missing media | How it looks without the media | PASS. Hero shows an SVG weight-plate graphic, the quote band shows a striped/glow background with a large brand mark, and Coach Maya gets the initials portrait. No broken images, and the play/pause button is hidden when there is no video |
| Console | Errors, exceptions and failed requests at 390 and 1440 | PASS (none) |
| Layout | Horizontal overflow at 320/375/390/768/1024/1440/1920 | PASS (scrollWidth equals viewport at every width). The chip and tab strips scroll inside their own containers on purpose |
| Structure | One h1, `lang="en"`, landmarks, skip link moves focus to main | PASS |
| Features | Mobile menu: opens, focus trap, Escape, focus returns to the button, links close the menu and scroll | PASS |
| Features | Coach filter chips, live count, "Match me" quiz (empty-submit error, then a result), profile dialog (Escape and close button), "Book with coach" prefills booking | PASS |
| Features | Schedule: mobile day tabs with click and arrow-key navigation, desktop table, coach links open profiles, "Try free" opens the trial at the level step | PASS |
| Features | Free-trial picker: validation for level, name and email, success screen, lock persists after reload, hero "next class" chip hides | PASS |
| Features | Booking: 5 steps with error on every empty step, inline email validation, goal counter, review, confirmation | PASS |
| Features | Program buttons (`data-book`) prefill booking, hero "Find my coach" works, every `#` link has a target | PASS |
| Features | Reset demo data | PASS after fix. Before the fix it reset the trial but left the booking on its confirmation screen |
| Tap targets | Size of interactive elements | PASS. Nothing is under 24x24 (WCAG 2.5.8). Mobile has 1 target under 44 px wide (a "Book" chip, 38x44). Desktop has the timetable coach-name text buttons (24 to 33 px wide x 44 tall) |
| Contrast / a11y | axe WCAG 2.2 AA | PASS (0 violations after fix). Before the fix, past and full timetable classes used opacity 0.6, giving 2.73:1 and 3.94:1 contrast |
| Keyboard | Tab order and focus ring | PASS. Order is logical: skip link, then brand, nav, CTAs, hero, programs. Every focused element shows a 2 px yellow outline |
| Reduced motion | Behaviour with reduced motion on | PASS. No entrance animation and the hero art is static |
| Performance | Lighthouse desktop | Perf 100, A11y 100, BP 100. LCP 0.6 s, CLS 0, TBT 0 ms, 272 KiB total |
| Performance | Lighthouse mobile | Perf 96, A11y 100, BP 100. LCP 2.4 s, CLS 0.071, TBT 0 ms |
| Performance | Third parties and fonts | PASS. 22 requests, no third-party requests, fonts self-hosted and preloaded |
| SEO | Lighthouse SEO score 60 | Expected: the only failing audit is `is-crawlable`, because of the intentional noindex |
| Owner rules | No service area | PASS. No city, state, country or `areaServed`, no "California" or "US", and no JSON-LD |
| Owner rules | Dummy business info | PASS. hello@example.com only, no phone numbers, no real branding. `@forgeline.demo` appears only as an internal calendar-file UID |
| Owner rules | Visible demo notice | PASS. Footer: "This is a demo website." The title also says "(demo)", and there are demo/sample notes on booking, results, reviews, coaches and the timetable |
| Owner rules | Footer credit | Not present, so nothing to check |
| Owner rules | Prices | PASS. No prices for our services. Every Forgeline price is labelled "sample price" |
| Owner rules | robots | PASS (`noindex, nofollow`) |
| Owner rules | Metricool script | PASS (absent) |
| og:image | Social preview image | PASS after fix. It used to point at the git-ignored `thumb.jpg`. It now points at `og-image.jpg`, our own render of the page with no third-party media (1440x900, 82 KB) |

## Fixes made
1. `brand.config.js:31-70`: placeholder media is now opt-in with `usePlaceholderMedia: false`. The published page requests no unlicensed files. Set it to `true` for local filming when the placeholder files are present.
2. `assets/js/hero.js:20-33, 46, 69, 85-91`: when no video is configured, or the video fails to load, the hero gets the `no-video` class and the toggle, poster and video description are hidden.
3. `index.html:101-115` (SVG plate art) and `assets/css/site.css:136-141, 191`: added the hero fallback graphic for mobile and wide layouts.
4. `assets/js/main.js:15-30`: images with no configured source, or that fail to load, are removed and the section gets `no-photo`. `index.html:302` and `site.css:443-446` add the quote-band fallback art.
5. `data/coaches.js:37`: added a fallback gradient for Coach Maya's portrait.
6. `index.html:15`: og:image now points at `https://www.analystsolution.com/demos/fitness-coach/og-image.jpg`, a new file in this folder.
7. `index.html:119`: the hidden video description now has `data-hero-video-desc` so the script can hide it when there is no video.
8. `index.html:432`: footer text changed to "Portraits and graphics are placeholders", because the published page has no photos or video.
9. `assets/css/site.css:343-346`: past and full timetable classes are now dimmed with colour instead of opacity, so text keeps at least 4.5:1 contrast.
10. `assets/js/booking.js:77`: "Reset demo data" now also resets the booking flow.

## Open notes (minor, not blocking)
- Mobile CLS is 0.071, which is under the 0.1 target. It comes from the "Next free class" chip that JS inserts into `.hero__bottom`.
- Lighthouse cache and compression warnings come from the local Python server. GitHub Pages compresses and caches files.
- `.git/info/exclude` still hides the whole folder. Remove that line when you publish. Nothing was committed or pushed.
- The full-page screenshots squash the 100vh hero a little. That is a capture artefact; the viewport shots show the real hero.
