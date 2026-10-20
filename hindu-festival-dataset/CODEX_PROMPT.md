# Codex Build Brief: Hindu Festival and Puja Guide (working title "Parv & Puja")

You are building a complete, responsive, bilingual (Hindi + English) website. All content data is already prepared in this folder. **Do not invent or scrape new data; use the provided CSV/SQLite/JSON files.** Make reasonable assumptions instead of asking questions, and note them in the final README.

## 1. Product goal
A website where a user can:
1. See **all Indian religious festivals (parva)** by the Hindi calendar, with **dates, tithi, paksha, Hindu month, deity, significance**.
2. Learn **how each festival or day is celebrated** (step-by-step ritual timeline, foods, fasting, regional notes with a Rajasthan/Jaipur focus).
3. For any festival or puja with a havan/puja: see **which pandit to call** (a directory filtered by city, puja type, language, online or in-person) and send an inquiry.
4. Get the **puja samagri checklist** (items in Hindi and English, quantities, optional items, grouped by category) that can be ticked, printed, copied or shared.

## 2. Data (already provided)
Use `festivals.db` (SQLite, built from `data/*.csv`; schema in `schema.sql`) or `bundle.json` (denormalised JSON). Rebuild DB with `python3 scripts/build_db.py`.

| Table | What it holds |
|---|---|
| `festivals` (55) | name_hi/en, category, tradition (Hindu/Jain/Buddhist/Sikh), deity, hindu_month, paksha, tithi, calendar_basis, fasting, pandit_needed, is_major, duration_days, significance, how_celebrated, traditional_foods, muhurat_rule, regional_notes, related_pooja_id |
| `festival_dates` (81) | festival_id, year (2026, 2027), start_date, end_date, **date_confidence (high/medium/low)**, alt_date, note |
| `rituals` (179) | festival_id, step_no, phase (before/during/after), title, description |
| `samagri_items` (182) | item_id, name_hi, name_en, category |
| `festival_samagri` (1172), `pooja_samagri` (671) | list_id, item_id, quantity, is_optional |
| `pooja_types` (19) | havan, griha pravesh, satyanarayan katha, rudrabhishek, vivah, mundan, namkaran, etc. with duration, pandit_required, best_for, muhurat_rule |
| `pandits` (24), `pandit_poojas` (73) | **SAMPLE seed profiles** (`is_sample=yes`, `verified=no`) |
| `hindu_months`, `tithis` | reference tables for filters and a "learn the calendar" page |
| `data_sources` | URLs used for dates; show on an About/Sources page |
| `pandit_inquiries` | empty table for storing user inquiries (name, phone, city, festival_id, pooja_id, preferred_date, pandit_id, message) |

## 3. Recommended stack (change only if there is a strong reason)
- Next.js (App Router) + TypeScript + Tailwind CSS, `better-sqlite3` reading `festivals.db` on the server (server components / route handlers). No external API keys needed.
- Fonts: Noto Sans Devanagari + a clean Latin sans. Hindi/English toggle stored in a cookie or localStorage; default Hindi + English labels where space allows.
- Deployable on Vercel or any Node host. If SQLite is awkward on the host, fall back to loading `bundle.json` at build time.

## 4. Pages and features
1. **Home**: hero search; "Next festival" countdown card; "Coming up in the next 30 days" list; quick links to Calendar, Pujas, Find a Pandit; year selector (2026 / 2027).
2. **Calendar (/calendar)**: month grid plus list view; filters for Hindu month, deity, tradition, category (utsav, vrat, jayanti, snan, recurring), major only, and text search (Hindi or English). Each date chip shows a small confidence badge when `date_confidence != high`. "Add to calendar" (.ics download) per festival.
3. **Festival detail (/festivals/[id])**:
   - Header: Hindi + English name, deity, tradition badge, dates for the selected year (start-end), tithi / paksha / Hindu month, calendar basis.
   - If `alt_date` exists, show "Some calendars list {alt_date}" and a link to the About page. If `date_confidence` is medium or low, show a note: "Verify the exact muhurat for your city with a local pandit or panchang."
   - Sections: Significance; How it is celebrated; Ritual timeline (phase badges before / during / after, ordered by step_no); Traditional foods; Fasting; Muhurat rule; Regional notes.
   - **Samagri checklist** (from `festival_samagri`): grouped by category, bilingual names, quantity, optional items shown with "(optional)". Tick state saved in localStorage. Buttons: Print, Copy as text, Share via WhatsApp (wa.me link with the list text), Download PDF (print stylesheet is enough).
   - **Find a pandit** card: when `pandit_needed` is yes or optional and `related_pooja_id` exists, show matching pandits (from `pandit_poojas`) with a button to the inquiry form prefilled.
4. **Pujas (/poojas, /poojas/[id])**: list and detail for `pooja_types` with description, duration, whether a pandit is required, best occasions, muhurat rule, samagri checklist (`pooja_samagri`) and matching pandits.
5. **Pandits (/pandits)**: directory cards (name, city, areas served, languages, experience, fee range, in-person/online badges, specialisations). Filters: city, puja type, language, online available, travel available. Visible banner: "Sample profiles for demonstration. Real, verified pandits will be added." No phone numbers are shown for sample profiles.
6. **Inquiry form** (modal or /inquiry): name, phone, city, festival or puja (dropdown), preferred date, optional pandit, message. Validate (Indian mobile 10 digits), save to `pandit_inquiries`, show a success state. No payments or real booking.
7. **Learn (/learn)**: simple explainer pages from `hindu_months` and `tithis` (Purnimanta vs Amanta, shukla vs krishna paksha, what a tithi is, why dates move every year).
8. **About / Sources (/about)**: list `data_sources`, explain date confidence, the disclaimer, and how to report a mistake (mailto or GitHub issues link placeholder).

## 5. UX and quality requirements
- Mobile-first; works at 360 px wide; large tap targets; print-friendly samagri page.
- Accessible (semantic HTML, alt text, focus states, colour contrast AA), fast (Lighthouse performance 90+ on mobile).
- Warm, respectful visual style (saffron / maroon / cream palette, subtle rangoli or diya motifs; no stock deity imagery that could be mis-rendered; use emoji or SVG icons).
- Dates shown in `DD MMM YYYY (Weekday)`; Hindi weekday names when Hindi mode is on. Use IST.
- SEO: per-festival title/description/Open Graph, sitemap.xml, JSON-LD `Event` for festival pages.
- Empty and error states for every list; no crash if a festival has no date for the chosen year (show "Date for {year} not added yet" and offer the other year).
- Unit tests for the data layer (e.g., upcoming-festival logic, filters) and a data validation script `npm run validate:data` that checks FK integrity, date formats and that every festival has at least a rituals row.

## 6. Data caveats Codex must respect
- Dates exist for **2026 and 2027 only**. 2027 dates are missing for: sheetla-ashtami, gangaur, hindu-new-year, chaitra-navratri, mahavir-jayanti, hartalika-teej, vishwakarma-puja, sharad-purnima, ahoi-ashtami, dhanteras, narak-chaturdashi, govardhan-puja, bhai-dooj, dev-uthani-ekadashi, tulsi-vivah, kalbhairav-jayanti, vivah-panchami, gita-jayanti. 2026 is missing vat-savitri. Recurring entries (ekadashi-vrat, purnima-vrat, amavasya, pradosh-vrat, sankashti-chaturthi) intentionally have no fixed date; show "Recurring: check this month's date".
- **Stretch goal** (build behind a feature flag): a `lib/panchang` adapter interface so dates can later be fetched or computed per city (e.g., a panchang API or a Swiss-Ephemeris based service) without changing UI code. Default adapter reads `festival_dates`.
- `date_confidence` must be visible in the UI wherever a date appears (badge or tooltip).
- Religious content: neutral, respectful tone. No astrological predictions or health/medical claims. Add the disclaimer: "Traditions vary by region and family. Please confirm rituals and muhurat with your family pandit."
- Pandit data are **samples**. Do not scrape or display real people's personal contact data. Provide a "Register as a pandit" form (stores to a `pandit_applications` table) as a stretch goal, with `verified=no` until manually approved.

## 7. Deliverables
1. Working app in this repo with `npm install && npm run dev` working out of the box, `npm run build` passing.
2. `README.md` with setup, data refresh steps, project structure, and a list of assumptions.
3. Seed/setup scripts that rebuild `festivals.db` from `data/*.csv`.
4. A short `CHANGELOG` or notes file describing what is complete and what is a stretch item.
