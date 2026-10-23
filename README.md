# fenwickvale.com

The website for Fenwick and Vale, a one-person website and Google shop in
Cocoa Beach, Brevard County, Florida. It sells websites, Google Business
Profile setup, review requests done by Google's rules, and Google Ads
management to local businesses, with every price on the page.

## What's here

Plain static files. No framework, no build step, no npm.

| File | Page |
|---|---|
| `index.html` | Home |
| `websites.html` | Websites, with the build sheet (the one script on the site: the running total) |
| `google.html` | Google Business Profile, reviews and ads |
| `guides.html` | Guides index |
| `guides/*.html` | The four finished guides |
| `about.html` | About, the deal, service area, contact |
| `privacy.html`, `terms.html` | Plain privacy page and terms |
| `404.html` | Served by Vercel for any missing page |
| `assets/site.css` | The one stylesheet |
| `assets/og.png` | The 1200x630 share image |
| `favicon.svg`, `site.webmanifest`, `robots.txt`, `sitemap.xml` | The usual |
| `vercel.json` | Clean URLs and three security headers |

Fonts: Fraunces and Public Sans from Google Fonts. Everything else is in the repo.
There is no contact form; every contact point is a `mailto:` link to
hello@fenwickvale.com.

## How it deploys

Vercel, connected to this repo.

- `cleanUrls` is on, so `websites.html` is served at `/websites` and the guides
  at `/guides/<slug>`. Internal links use the clean form (`/websites`, never
  `websites.html`).
- A push to `main` is production (fenwickvale.com).
- A push to any other branch is a preview deployment with its own URL.
- `404.html` at the root is what Vercel serves for a missing page.

To work locally, open the files in a browser, or serve the folder with
`python3 -m http.server` (links then need the `.html` added by hand, since only
Vercel rewrites the clean URLs).

## Before launch

- Replace the ink "F&V" block on `about.html` with a real photo of the owner,
  with alt text.
- Confirm hello@fenwickvale.com exists and receives mail. Every contact point
  on the site goes there.
- Optional: add a 321 phone number to the nav, footer and About page if the
  owner wants calls.
- Register the Fenwick and Vale Google Business Profile.
- Add the MOSTMATH link on the home page ("Built and run here") once its
  domain is settled. HighwayLot and FleetCleared already link.
- The three add-on prices on the build sheet (booking $250, photo day $300,
  Spanish $600) are proposals, not researched figures.
- Write the remaining four guides and add them to `guides.html`, the home
  page if wanted, and `sitemap.xml`:
  - Who owns your website? Check before you sign
  - Is Facebook enough? When you need a site and when you don't
  - The 19 things a real website has
  - Hurricane season: keep your phone, site and listing working
