function upcomingFestivals(festivals, year, fromDate) {
  const today = fromDate instanceof Date ? fromDate.toISOString().slice(0, 10) : String(fromDate);
  return festivals.filter(f => (f.dates || []).some(d => Number(d.year) === Number(year) && d.start_date >= today))
    .sort((a, b) => a.dates.find(d => Number(d.year) === Number(year)).start_date.localeCompare(b.dates.find(d => Number(d.year) === Number(year)).start_date));
}
function filterFestivals(festivals, options = {}) {
  const q = (options.query || '').toLocaleLowerCase();
  return festivals.filter(f => {
    if (options.month && f.hindu_month !== options.month) return false;
    if (options.tradition && f.tradition !== options.tradition) return false;
    if (options.category && f.category !== options.category) return false;
    if (options.major && !['yes', 'true', '1'].includes(String(f.is_major).toLowerCase())) return false;
    if (options.dated === true && !(f.dates || []).some(d => Number(d.year) === Number(options.year))) return false;
    if (options.dated === false && (f.dates || []).some(d => Number(d.year) === Number(options.year))) return false;
    if (q && ![f.name_hi, f.name_en, f.deity, f.hindu_month, f.tithi].filter(Boolean).join(' ').toLocaleLowerCase().includes(q)) return false;
    return true;
  });
}
module.exports = { upcomingFestivals, filterFestivals };
