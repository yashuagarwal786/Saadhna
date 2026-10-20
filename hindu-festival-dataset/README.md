# Hindu Festival and Puja Dataset (v1, built 19 Oct 2026)

Everything needed to build a website of Indian religious festivals (Hindi calendar), their dates, how they are celebrated, puja samagri lists and a pandit directory. **Hand `CODEX_PROMPT.md` plus this whole folder to Codex.**

## Folder contents
| Path | Purpose |
|---|---|
| `CODEX_PROMPT.md` | Full build brief for Codex |
| `festivals.db` | SQLite database (ready to use) |
| `schema.sql` | Table definitions (also creates empty `pandit_inquiries`) |
| `bundle.json` | Denormalised JSON (festivals with nested dates, rituals, samagri; poojas; pandits; months; tithis; sources) |
| `data/*.csv` | Source tables, UTF-8, header row, comma-separated |
| `scripts/build_db.py` | Rebuilds `festivals.db` from the CSVs |

## Counts
12 Hindu months, 15 tithis, **55 festivals** (50 dated festivals + 5 recurring observances), **81 festival-date rows** (2026 and 2027), **179 ritual steps**, **182 samagri items**, **1,172 festival-samagri rows**, **19 puja types** (671 puja-samagri rows), **24 sample pandits**, 14 sources.

## Data dictionary (key columns)
- `festivals.category`: utsav, vrat, jayanti, snan, recurring. `tradition`: Hindu, Jain, Buddhist, Sikh. `calendar_basis`: lunar or solar. `is_major`: yes/no.
- `festivals.hindu_month` follows the **Purnimanta** reckoning used in North India (a month begins after the full moon). In Amanta (Gujarat, Maharashtra, South) Krishna paksha belongs to the previous month name, which is why e.g. Maha Shivratri is listed as Phalgun (Purnimanta) / Magh (Amanta).
- `festival_dates.date_confidence`: **high** = most sources agree; **medium** = sources differ by a day or the date depends on tithi/moonrise/region; **low** = single or approximate source. `alt_date` is the competing date. Dates follow North India (IST) reckoning and can differ in other cities by a day.
- `rituals.phase`: before, during, after; ordered by `step_no`.
- `*_samagri.quantity`: free text, "as needed" when not specific; `is_optional`: yes/no. Common puja items are shared via a base list ("+B" in the build source).
- `pooja_types.pandit_required`: yes, "yes (recommended)", optional, no.
- `pandits`: **sample seed data** (`is_sample = yes`, `verified = no`, `contact_phone` empty). Replace with real, verified pandits through registration, temple trusts or Vedic pathshalas.

## Known gaps and how to fill them
- 2027 dates are missing for: sheetla-ashtami, gangaur, hindu-new-year, chaitra-navratri, mahavir-jayanti, hartalika-teej, vishwakarma-puja, sharad-purnima, ahoi-ashtami, dhanteras, narak-chaturdashi, govardhan-puja, bhai-dooj, dev-uthani-ekadashi, tulsi-vivah, kalbhairav-jayanti, vivah-panchami, gita-jayanti. Vat Savitri 2026 is missing (2026 has an Adhik Maas, so sources disagree). Fill these from a panchang source for **Jaipur** and add rows to `data/festival_dates.csv`.
- Dates came from public calendar sites (listed in `data_sources.csv`) cross-checked against each other. They are **not** astronomically computed for a specific city, so show the confidence badge and tell users to confirm muhurat with their pandit. Before launch, verify high-traffic festivals (Diwali, Dhanteras, Karwa Chauth, Holi, Raksha Bandhan, Navratri) against an authoritative panchang for your target city.
- Descriptions, ritual steps, samagri lists, and regional notes are written from general traditional knowledge (source `src-00`). Practices vary by family, sect and region. Have a local pandit review them before publishing.
- Quantities in samagri are mostly "as needed"; refine them with the pandit if you want a precise shopping list.
- Mahavir Jayanti, Buddha Purnima and Guru Nanak Jayanti are included as tithi-based non-Hindu festivals; Muslim and Christian festivals are not included because they do not follow the Hindi lunar calendar.

## Rebuild the database
```
python3 scripts/build_db.py
```
