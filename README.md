# fenwickvale.com

The website for Fenwick and Vale, a one-person website and Google shop in
Cocoa Beach, Brevard County, Florida. It sells websites, Google Business
Profile setup, review requests done by Google's rules, and Google Ads
management to local businesses, with every price on the page.

This is v.2. The direction is "a work order, not a brochure": one sentence at
the top, every number in a typewriter face, the work as a numbered list of
live links, a live clock in the header, indexed rows instead of cards, and a
short request form that stores to the site's own storage instead of a form service. v.1 is
kept at `/v1/`.

## What's here

Plain static files plus two small Python serverless functions for the
request form. No framework, no build step, no npm, no `requirements.txt`.

| File | Page |
|---|---|
| `index.html` | Home |
| `websites.html` | Websites: the three sizes, the add-on list, the request form |
| `google.html` | Google Business Profile, reviews and ads |
| `guides.html` | Guides index |
| `guides/*.html` | The four finished guides |
| `about.html` | About, the deal, service area, the now line, the request form, the v.1 note |
| `agencies.html` | For agencies: white-label build prices, what is and isn't included, the request form |
| `privacy.html`, `terms.html` | Plain privacy page and terms |
| `404.html` | Served by Vercel for any missing page |
| `admin.html` | Private: reads the request list back. `noindex`, not in the nav or the sitemap, blocked in `robots.txt` |
| `api/request.py` | `POST /api/request`: validates and stores one request |
| `api/requests.py` | `GET`/`DELETE /api/requests`: the admin read-back, behind `ADMIN_TOKEN` |
| `assets/site.css` | The one stylesheet |
| `assets/clock.js` | The header clock (Cocoa Beach time, minutes only) |
| `assets/request.js` | Submits the request form without a reload; one script for every form on the site |
| `assets/fonts/*.woff2` | The two typefaces, latin subsets, self-hosted |
| `assets/og.png` | The 1200x630 share image, rendered from the v.2 look |
| `v1/` | The first version of the site: five pages, its own stylesheet, `noindex`, a banner back to the current site |
| `favicon.svg`, `site.webmanifest`, `robots.txt`, `sitemap.xml` | The usual. The sitemap leaves `/v1/` out |
| `vercel.json` | Clean URLs, three security headers, a one-year cache on the fonts. No `functions` block: Vercel detects `api/*.py` on its own |

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
places: the underline on the active nav link, the focus ring, and a button
on hover. Nowhere else.

## The request form

Every page that used to end in a "Book a 20-minute call" email button now
ends in a short form: name, phone or email, business (optional), "what's
wrong with your site right now" (optional), and a hidden honeypot field.
It is on the Websites page (beside the sizes), the Google page (under the
three prices), the About page (Contact) and the For agencies page, titled
"Send one over." there. The email address stays printed beside it.

How it works:

- `assets/request.js` posts the fields as JSON to `/api/request` with
  `fetch`, no reload. On success the form is replaced with "Got it. I'll call
  or write back within one business day." On a 503 or a network error it
  shows "The form isn't connected yet. Email hello@fenwickvale.com and I'll
  reply the same way."
- `api/request.py` (Vercel Python function, stdlib only) checks the fields
  (name 2 to 80 characters, contact 5 to 120, business up to 120, note up to
  1000, honeypot empty), refuses cross-site requests, allows five requests
  per IP per hour, and pushes one JSON record (id, timestamp, page, the
  fields) onto a Redis list `fv:requests`, capped at 5,000. Storage is
  Upstash Redis through Vercel's Marketplace (what Vercel KV became), talked
  to over plain REST with `urllib.request`. With no storage connected it
  returns 503 and the page shows the email fallback.
- `api/requests.py` returns the newest 500 records for `/admin`, and deletes
  one by id. It needs `Authorization: Bearer <ADMIN_TOKEN>`.
- No email is sent from the site. Check `/admin`, or add a notification
  later if that gets old.

### Connect storage

1. In the Vercel dashboard open the project, then **Storage**.
2. **Marketplace** (or "Browse Marketplace"), pick **Upstash Redis**, choose
   the free plan, create the database and **Connect to Project**.
3. That sets the env vars for you: `KV_REST_API_URL` and `KV_REST_API_TOKEN`
   (older projects) or `UPSTASH_REDIS_REST_URL` and
   `UPSTASH_REDIS_REST_TOKEN`. The functions read either pair.
4. Redeploy once so the functions pick them up.

### Set the admin token

1. Project **Settings**, then **Environment Variables**.
2. Add `ADMIN_TOKEN` with any long random string (30 characters or more;
   `openssl rand -hex 24` in a terminal, or a password manager's generator).
   Apply it to Production and Preview.
3. Redeploy. Never put the token in the repo or in a URL.

### Open the admin page

Go to `https://fenwickvale.com/admin`, paste the token once, and the page
keeps it in `sessionStorage` for that tab. "Forget token" clears it. Each
row has a Delete button; "Copy as text" copies every row as plain lines for
pasting into notes or a reply. The page is `noindex`, not in the nav or the
sitemap, and `robots.txt` disallows `/admin` and `/api/`.

### Python runtime

Vercel runs `api/*.py` on its Python runtime without any config; each file
exports a `handler` class built on `BaseHTTPRequestHandler`. There is no
`requirements.txt` on purpose. To check the code without a server:
`python3 -m py_compile api/request.py api/requests.py`.

## Motion

Seven moves, all plain CSS or a few lines of JavaScript, all short:
cross-document view transitions between pages, rows easing in as they
scroll into view (below the first screen only, inside
`@supports (animation-timeline: view())`, opacity never from zero), the
header hairline arriving on scroll, underline and arrow on hover, the mark
entering once on load, the focus ring, and the clock. The H1 and
the photo block never fade. Everything honors `prefers-reduced-motion`. No
scroll library, no GSAP, no Lottie, no video.

## Weight

The home page is about 25 KB with its stylesheet and its one script, fonts
aside; the fonts are 76 KB more. One script file on the home page (the
clock), two on the Websites, Google, About and For agencies pages (the
clock and the form). The real numbers are printed in the footer colophon; update them when
the files change (sizes of `index.html` + `assets/site.css` +
`assets/clock.js`). The colophon also carries the line "I use AI tools for
drafting and code. Every page is read, checked and signed off by me."

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
The form will show its email fallback until something answers
`/api/request`; `vercel dev` runs the Python functions locally if you have
the Vercel CLI.

## Before launch

- **Add a first name and a photo.** The About page is written in first
  person without a name, and the photo slot holds the hand-drawn F&V mark.
  Put a real photo there, taken at a nameable local spot (the Port, the
  pier, a client's shop), with the first name in the caption and alt text,
  and add the name to the story paragraph. Not a studio backdrop, not a
  sunset.
- Confirm hello@fenwickvale.com exists and receives mail. Every contact
  point on the site goes there or into the request form.
- Connect Upstash Redis and set `ADMIN_TOKEN` (see "The request form"
  above), then send one test request from the live site and check it shows
  up at `/admin`. Until storage is connected the form shows the email
  fallback.
- Add a 321 phone number if you want calls: beside the email next to each
  form and in the footer, as a tap-to-call link, set in the mono face like
  the email. (The header carries only the clock now; with five nav links
  there was no room left for the email on one row.)
- Register the Fenwick and Vale Google Business Profile.
- Keep the "Now" line (home and About) current. It is dated October 2026 and
  says "Building v.2 of this site. Taking two builds a month."
- The three add-on prices on the Websites page (booking $250, photo day
  $300, Spanish $600) are proposals, not researched figures.
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
