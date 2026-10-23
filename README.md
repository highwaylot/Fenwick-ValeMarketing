# fenwickvale.com

The website for Fenwick and Vale, a one-person website and Google shop in
Cocoa Beach, Brevard County, Florida. It sells websites, Google Business
Profile setup, review requests done by Google's rules, and Google Ads
management to local businesses, with every price on the page.

This is v.2. The direction is "a work order, not a brochure": one sentence at
the top, every number in a typewriter face, the work as a numbered list of
live links, a live clock, indexed rows instead of cards, and a showroom
switch that reskins the site by trade. v.1 is kept at `/v1/`.

## What's here

Plain static files. No framework, no build step, no npm.

| File | Page |
|---|---|
| `index.html` | Home |
| `websites.html` | Websites: the showroom, the sizes, the add-ons and the running total |
| `google.html` | Google Business Profile, reviews and ads |
| `guides.html` | Guides index |
| `guides/*.html` | The four finished guides |
| `about.html` | About, the deal, service area, the now line, contact, the v.1 note |
| `privacy.html`, `terms.html` | Plain privacy page and terms |
| `404.html` | Served by Vercel for any missing page |
| `assets/site.css` | The one stylesheet, skins included |
| `assets/clock.js` | The header clock (Cocoa Beach time, minutes only) |
| `assets/showroom.js` | The showroom switch; loads in `<head>` so a remembered skin applies before first paint |
| `assets/estimate.js` | The running total on the Websites page |
| `assets/fonts/*.woff2` | The two typefaces, latin subsets, self-hosted |
| `assets/og.png` | The 1200x630 share image, rendered from the v.2 look |
| `v1/` | The first version of the site: five pages, its own stylesheet, `noindex`, a banner back to the current site |
| `favicon.svg`, `site.webmanifest`, `robots.txt`, `sitemap.xml` | The usual. The sitemap leaves `/v1/` out |
| `vercel.json` | Clean URLs, three security headers, a one-year cache on the fonts |

## Type

Two families, three files, 76 KB in all, served from `/assets/fonts/`. No
request goes to Google Fonts.

- **Schibsted Grotesk** (variable, 400 to 900) for headings and body. A
  newspaper grotesque: sturdy, slightly compact, the kind of letter you see
  on a shop sign or a boat transom. It isn't the default in any design tool,
  none of the hand-coded shops in the research use it, and there is no serif
  anywhere on the site. Open Font License.
- **IBM Plex Mono** (400 and 500) for every price, number, date, label, index,
  the clock and the email. It reads as typewriter type, which is the point:
  the numbers should look like they came off a ticket, not a SaaS pricing
  card. Open Font License.

Both were downloaded from the Google Fonts css2 endpoint as latin subsets and
are committed here; the site never calls Google at runtime. To change a
weight or add a glyph range, fetch a new file the same way and update the
`@font-face` block at the top of `assets/site.css`.

## Color

Warm light page (`#F5F1E8`), near-black ink (`#16140F`), one accent:
**Cape orange, `#C53B00`**. It is the orange of test rockets, buoys and
safety gear, which is a local color here in a way navy, gold or green are
not. It passes 4.6:1 on the page for text and is used in exactly three
places: the showroom swatch in use, the running total, and the underline on
the active nav link. Nowhere else.

## The showroom

On the Websites page, "01 Pick a look" is a row of six swatches: the Fenwick
and Vale look and five samples (pool, fishing charter, HVAC and plumbing,
dental office, auto repair). Each sample is labeled "sample" because there
are no client sites yet; when a real client site exists in a trade, tie the
swatch to it ("Pool — see business.com").

How it works:

- Each skin is a set of CSS variables on `:root[data-theme="pool"]` and so on
  in `assets/site.css`: page, ink, soft ink, rule, accent. Type and layout
  never change, only color. The auto repair skin is dark; the default is
  light and stays light.
- `assets/showroom.js` sets `data-theme` on `<html>`. In browsers with
  `document.startViewTransition`, the change runs inside a view transition
  and the new page is revealed by a `clip-path` circle growing out of the
  swatch you clicked, about 300 ms. Browsers without it swap instantly.
  Under `prefers-reduced-motion: reduce`, the swap is instant too.
- The choice is remembered in `localStorage` (`fv-skin`), so it survives a
  page change. The footer then shows "Showing the pool service sample. Back
  to the Fenwick and Vale look." on every page; that button clears it. The
  script loads in `<head>` so a remembered skin applies before first paint.
- The estimate's chosen-items line and the booking email subject mention the
  sample in use, so a client who writes in after picking one says so.
- To add a skin: add a `:root[data-theme="x"]` block and a `.chip-x` block to
  the stylesheet, a swatch button to `websites.html`, and the name to the
  `SKINS` list in both `showroom.js` and `estimate.js`. Check contrast of ink
  and accent on the page color before shipping (4.5:1 for text).

## Motion

Eight moves, all plain CSS or a few lines of JavaScript, all short: the
showroom reveal, cross-document view transitions between pages, rows easing
in as they scroll into view (below the first screen only, inside
`@supports (animation-timeline: view())`, opacity never from zero), the
header hairline arriving on scroll, the running total's tick, underline and
arrow on hover, the mark entering once on load, and the clock. The H1 and
the photo block never fade. Everything honors `prefers-reduced-motion`. No
scroll library, no GSAP, no Lottie, no video.

## Weight

The home page is about 30 KB with its stylesheet and both scripts, fonts
aside; the fonts are 76 KB more. Two script files on the home page, three on
the Websites page. The real numbers are printed in the footer colophon;
update them when the files change (sizes of `index.html` + `assets/site.css`
+ the scripts the home page loads).

## How it deploys

Vercel, connected to this repo.

- `cleanUrls` is on, so `websites.html` is served at `/websites`, the guides
  at `/guides/<slug>`, and the archive at `/v1/`, `/v1/websites` and so on.
  Internal links use the clean form.
- A push to `main` is production (fenwickvale.com).
- A push to any other branch is a preview deployment with its own URL.
- `404.html` at the root is what Vercel serves for a missing page.

To work locally, serve the folder with any static server that maps `/x` to
`x.html` (plain `python3 -m http.server` needs the `.html` added by hand).

## Before launch

- **Add a first name and a photo.** The About page is written in first
  person without a name, and the photo slot holds the hand-drawn F&V mark.
  Put a real photo there, taken at a nameable local spot (the Port, the
  pier, a client's shop), with the first name in the caption and alt text,
  and add the name to the story paragraph. Not a studio backdrop, not a
  sunset.
- Confirm hello@fenwickvale.com exists and receives mail. Every contact
  point on the site goes there.
- Add a 321 phone number if you want calls: header stamp next to the email,
  the About contact line and the footer, as a tap-to-call link, set in the
  mono face like the email.
- Register the Fenwick and Vale Google Business Profile.
- Keep the "Now" line (home and About) current. It is dated October 2026 and
  says "Building v.2 of this site. Taking two builds a month."
- The three add-on prices on the build sheet (booking $250, photo day $300,
  Spanish $600) are proposals, not researched figures.
- Write the remaining four guides and add them to `guides.html`, the home
  page if wanted, and `sitemap.xml`:
  - Who owns your website? Check before you sign
  - Is Facebook enough? When you need a site and when you don't
  - The 19 things a real website has
  - Hurricane season: keep your phone, site and listing working
- The v.1 archive still loads its two typefaces from Google Fonts, as it did
  when it was live; the privacy page says so. Strip the link from `v1/*.html`
  if you'd rather it didn't.
- If someone draws a better mark, credit them by name in the About page's
  "This site" section.
