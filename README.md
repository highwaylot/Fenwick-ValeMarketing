# fenwickvale.com

The website for Fenwick and Vale, a one-person website and Google shop in
Cocoa Beach, Brevard County, Florida. It sells websites, Google Business
Profile setup, review requests done by Google's rules, and Google Ads
management to local businesses, with every price on the page.

The look is "Lashes of the Sun": the mark is the alchemical sign for gold,
☉, with rays across the top only, so on a second look it is an eye. The site
is near-black and gold by default (Nigredo) with an ivory version (Albedo)
behind the sun button in the header, remembered per browser. Cormorant
Garamond for headings, EB Garamond for text, both self-hosted.

What moves, all in `assets/site.js`, all off for visitors who ask for less
motion: the big eye's pupil follows the cursor (it wanders on phones) and
blinks now and then, gold dust drifts up through the home hero, the
instrument ring around the mark turns slowly, sections rise in as they
scroll into view (from a visible start), and the header tightens on scroll.
The home page also reads its own weight, file count, load time and the
visitor's screen size from the browser and shows them live.

Links between pages are relative (`websites.html`, `../guides.html`), so the
same files work on Vercel, where clean URLs drop the `.html`, and as a
click-through preview anywhere. `404.html` is the exception: Vercel serves it
at any depth, so it uses root links. The design history (v.1 green and
serif, v.2 grotesque and mono) is in git, not on the site.

## What's here

Plain static files plus two small Python serverless functions for the
request form. No framework, no build step, no npm, no `requirements.txt`.

| File | Page |
|---|---|
| `index.html` | Home |
| `websites.html` | Websites: the three sizes as cards, the add-ons and running costs as tables, the request form |
| `work.html` | Work: the three live sites, then seven design concepts as full-width screenshots that open the concept pages |
| `work/*.html`, `work/shots/*.jpg` | The seven concept pages (self-contained demos, `noindex`) and their 1280x800 screenshots. See "The Work gallery" |
| `google.html` | Google Business Profile, reviews and ads, the request form |
| `guides.html` | Guides index |
| `guides/*.html` | The four finished guides |
| `about.html` | About, the deal, service area, the request form |
| `agencies.html` | For agencies: white-label build prices, what is and isn't included, the request form |
| `privacy.html`, `terms.html` | Plain privacy page and terms |
| `404.html` | Served by Vercel for any missing page |
| `admin.html` | Private: reads the request list back. `noindex`, not in the nav or the sitemap, blocked in `robots.txt` |
| `api/request.py` | `POST /api/request`: validates and stores one request |
| `api/requests.py` | `GET`/`DELETE /api/requests`: the admin read-back, behind `ADMIN_TOKEN` |
| `assets/site.css` | The one stylesheet |
| `assets/site.js` | Theme switch, header, mobile menu, the eye, the dust, reveals, live readouts, the Work reel |
| `assets/request.js` | Submits the request form without a reload; one script for every form on the site |
| `assets/fonts/*.woff2` | Cormorant Garamond and EB Garamond, variable, latin subsets, self-hosted |
| `assets/og.png` | The 1200x630 share image |
| `favicon.svg`, `site.webmanifest`, `robots.txt`, `sitemap.xml` | The usual. The sitemap lists `/work` but leaves the `/work/*.html` concept pages out |
| `vercel.json` | Clean URLs, the `/v1` redirects, three security headers, a one-year cache on the fonts. No `functions` block: Vercel detects `api/*.py` on its own |

## Type and color

Cormorant Garamond (headings, labels, prices) and EB Garamond (text), both
variable fonts from the Google Fonts css2 endpoint, latin subsets, committed
in `assets/fonts/`. Color tokens live at the top of `assets/site.css`: gold
`#BFA054` on near-black `#12100D` for Nigredo, deeper gold `#8C7433` on ivory
`#F6F1E6` for Albedo, where the thin lines need more weight.

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
  shows "The form isn't taking requests yet. Please try again in a few
  days."
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

## The Work gallery

`/work` is the portfolio: section 01 is the same three live sites as the
home page; section 02 is seven website designs (four directions for
HighwayLot, three for FleetCleared), one full-width screenshot per row with
the client and design name above ("HighwayLot / The Board") and one plain
sentence under it. The screenshot is the link. The concept pages live at
`/work/<slug>` and are the original self-contained design documents with
three changes: a small Fenwick and Vale bar across the top ("Fenwick
and Vale · Work", "← All work", previous and next), a `noindex,follow` meta
and a new `<title>`, and their old gallery navigation removed (the Swiss
page keeps its 44 px bar because it holds the live EN|ES and day/night
control; only its page links were dropped). Everything below the bar keeps
its own look; that is the work.

The concept pages are the one place on this site that loads type from
Google Fonts: each carries the `fonts.googleapis.com` link it was designed
with, because they are demos and self-hosting six more families for seven
`noindex` pages is not worth it. The privacy page says so. The main site
still never calls Google.

To add a tile:

1. Put the finished concept page at `work/<slug>.html` (slug:
   `<business>-<name>`). Give it the bar, the robots meta and the title; the
   easiest way is to copy the `<style id="fv-bar-css">` block and the
   `<div id="fv-bar">` from any existing one and fix the previous/next
   links on its two neighbours. Any `href` to the old folder it came from
   must go. The bar's fonts come from `/assets/fonts/`, so absolute paths.
2. Render the first 1280x800 of it at device scale 1 as a JPG, quality 82,
   with `#fv-bar` hidden, to `work/shots/<slug>.jpg`. Any headless browser
   will do; the current shots came from Playwright.
3. Add one `<li>` to the `shots` list in `work.html`: the label, the
   `<img>` with `width="1280" height="800" loading="lazy"` and a real alt,
   and the one-line sentence, written from the concept page's own header.
4. Do not add it to `sitemap.xml`; `/work` is already there and the
   concept pages are `noindex`.

## Weight

Two script files on every page (`site.js`, and `request.js` where there is a
form), one stylesheet, four font files. The home page shows its own real
weight live, so there is no number to keep updated here. The seven concept
pages under `/work/` carry their own inline scripts and Google Fonts links.

## Your list

Every size, add-on and service has an "Add to your list" button. The list
is not a cart: no checkout, no total. It lives in the visitor's own browser
(`localStorage`, key `fv-list`), shows as a floating "Your list" button once
it has something on it, and opens as a side panel. "Send this list" drops
the items into the request form's note field, on the same page or on
Websites, and a sent request clears the list. The privacy page says so.

## The first-three spots

The first-three offer shows dots and "3 spots left". To change it, edit the
number in `data-spots="3"` in two places: the `.spots` paragraph on
`websites.html` and the `.spots-inline` span on `index.html` (also change
the visible text next to it; the script redraws it, but this keeps it right
without JavaScript). At 0 the offer reads "All three spots are taken", the
price is struck through and its add button disappears. Keep the number true.


## How it deploys

Vercel, connected to this repo.

- `cleanUrls` is on, so `websites.html` is served at `/websites`, the guides
  at `/guides/<slug>`. Internal links use the clean form.
- A push to `main` is production (fenwickvale.com). Push `main` in the same
  push as `preview`, or on its own: when `main` is moved later to a commit
  Vercel already built as a preview, Vercel may not build it again for
  production. If that happens, promote the preview deployment in the
  dashboard (Deployments, the row's menu, Promote to Production).
- A push to any other branch is a preview deployment with its own URL.
- `404.html` at the root is what Vercel serves for a missing page.

To work locally, serve the folder with any static server that maps `/x` to
`x.html` (plain `python3 -m http.server` needs the `.html` added by hand).
The form will show its email fallback until something answers
`/api/request`; `vercel dev` runs the Python functions locally if you have
the Vercel CLI.

## Before launch

- **Add a first name and a photo.** The About page is written in first
  person without a name, and the photo slot holds an F&V placeholder.
  Put a real photo there, taken at a nameable local spot (the Port, the
  pier, a client's shop), with the first name in the caption and alt text,
  and add the name to the story paragraph. Not a studio backdrop, not a
  sunset.
- There is no email address on the site. hello@fenwickvale.com was removed
  everywhere on October 24, 2026 because it doesn't receive mail yet, so the
  request form is the only way in. Once a real address works, add it back
  to the footer and beside each form.
- Connect Upstash Redis and set `ADMIN_TOKEN` (see "The request form"
  above), then send one test request from the live site and check it shows
  up at `/admin`. Until storage is connected the form shows the email
  fallback.
- Add a 321 phone number if you want calls: beside the email next to each
  form and in the footer, as a tap-to-call link.
- Register the Fenwick and Vale Google Business Profile.
- The three add-on prices on the Websites page (booking $250, photo day
  $300, Spanish $600) are proposals, not researched figures.
- Write the remaining four guides and add them to `guides.html`, the home
  page if wanted, and `sitemap.xml`:
  - Who owns your website? Check before you sign
  - Is Facebook enough? When you need a site and when you don't
  - The 19 things a real website has
  - Hurricane season: keep your phone, site and listing working
- The seven concept pages under `/work/` load their typefaces from Google
  Fonts (see "The Work gallery"); the privacy page says so.
