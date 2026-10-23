# Parv & Puja

A responsive bilingual (Hindi and English) guide to festivals, Hindu calendar dates, puja guides, samagri checklists and a sample pandit directory. It uses the supplied Hindu Festival and Puja Dataset v1; it does not scrape or generate festival data.

## Run locally

Requires Node.js 22.13 or later (the app uses Node's built-in SQLite module) and Python 3 for rebuilding the supplied database.

```sh
npm install
npm run dev
```

Open <http://localhost:3000>. There are no external runtime dependencies, so `npm install` only prepares the project metadata. `npm start` runs the same server. `PORT` can change the local port.

## Deploy on Render

The repository includes a Render Blueprint in `render.yaml`. In the Render dashboard, create a new Blueprint and connect `yashuagarwal786/Saadhna`; Render will read the service settings from that file. The service uses the included SQLite dataset and stores inquiries in a 1 GB persistent disk. The database is copied from the seed dataset the first time the service starts on that disk. Persistent disks require a paid Render web service plan; without persistent storage, inquiry records would be lost when the service restarts or redeploys.

## Pages and features

- Home with search, next festival, 30-day list and year selector.
- Calendar with date cards, calendar month grid, search, Hindu month, tradition, category, deity, major-only and recurring/date filters; per-card confidence and `.ics` downloads.
- Festival and puja detail pages with rituals, foods, fasting, muhurat notes, regional notes, and printable/copyable/shareable checklist with saved checkmarks.
- Pandit directory with city, language, puja, online and travel filters. Profiles are clearly identified as samples; contact numbers are not exposed.
- Inquiry form with Indian 10-digit mobile validation, persisted to `pandit_inquiries`.
- Shanti Pal (`/shanti`), a bilingual page with optional guided breathing, mantra counters, grounding steps, reflection, and India helplines.
- Learn page for months and tithis; About/Sources page for source links and data limitations.
- Responsive layout, bilingual toggle, page titles, sitemap, keyboard-visible focus, and print stylesheet.

## Data refresh

The archive was extracted to `hindu-festival-dataset/`. The SQLite DB and source CSVs are kept there so the source dataset remains organized.

```sh
python hindu-festival-dataset/scripts/build_db.py
npm run validate:data
```

After replacing CSVs or rebuilding the database, restart the server. `npm run validate:data` checks foreign keys, date formats and ritual coverage. `npm run build` checks the app shell and expected dataset record counts. `npm test` runs the data-layer unit tests.

## Project structure

```text
public/                  browser app, styles and page shell
server.js                Node HTTP server, SQLite API and inquiry storage
lib/festival-data.js     year-aware filtering helpers
scripts/                 build and dataset validation checks
tests/                   unit tests for filtering and upcoming dates
hindu-festival-dataset/  supplied SQLite DB, schema, CSVs, bundle and builder
                        plus calm_support.json content for Shanti Pal
```

## Assumptions and data notes

- The project brief's Next.js recommendation was changed to a small Node HTTP server and browser app. Node 24 is present, its built-in SQLite support avoids a native dependency, and this keeps the supplied project runnable without API keys or downloaded packages.
- Festival dates are available for 2026 and 2027 only, with gaps described in the supplied dataset README. Missing and recurring dates are shown as such. No dates are calculated or filled in by the app.
- Dates use North India/IST reckoning and display the supplied date-confidence level. Medium or low confidence prompts local verification; the alternate date and note remain visible.
- Pandit profiles are demonstration samples with `verified=no`; inquiries are only leads and do not create bookings or payments. No public phone numbers are displayed.
- Hindi is the default language; the toggle is saved in local storage. Festival content remains in the dataset's supplied Hindi/English fields where available.
- The About page explains how to report a suggested correction to the project maintainer without publishing a placeholder email address.
- The `.ics` file uses an all-day Gregorian event based on the supplied date. Samagri PDF output uses the browser's print-to-PDF feature.
- Content and practice vary by region and family. Please confirm rituals and muhurat with your family pandit.
