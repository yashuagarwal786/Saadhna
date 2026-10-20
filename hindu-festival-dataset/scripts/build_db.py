"""Rebuild festivals.db from data/*.csv and schema.sql.
Usage: python3 scripts/build_db.py   (run from the dataset root)"""
import csv, os, sqlite3

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB = os.path.join(ROOT, "festivals.db")
ORDER = ["hindu_months", "tithis", "pooja_types", "festivals", "festival_dates", "rituals",
         "samagri_items", "festival_samagri", "pooja_samagri", "pandits", "pandit_poojas", "data_sources"]

if os.path.exists(DB):
    os.remove(DB)
con = sqlite3.connect(DB)
con.executescript(open(os.path.join(ROOT, "schema.sql"), encoding="utf-8").read())
for t in ORDER:
    with open(os.path.join(ROOT, "data", t + ".csv"), encoding="utf-8", newline="") as f:
        rd = csv.reader(f)
        hdr = next(rd)
        rows = [[c if c != "" else None for c in r] for r in rd]
    con.executemany(f"INSERT INTO {t}({','.join(hdr)}) VALUES({','.join('?' * len(hdr))})", rows)
    print(f"{t}: {len(rows)} rows")
con.commit()
assert not con.execute("PRAGMA foreign_key_check").fetchall(), "foreign key problem"
con.close()
print("OK ->", DB)
