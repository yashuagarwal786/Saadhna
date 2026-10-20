const test = require('node:test');
const assert = require('node:assert/strict');
const { upcomingFestivals, filterFestivals } = require('../lib/festival-data');
const festivals = [
  { festival_id:'a', name_en:'Alpha', name_hi:'अल्फा', hindu_month:'Chaitra', tradition:'Hindu', category:'utsav', is_major:'yes', dates:[{year:2026,start_date:'2026-02-10'}] },
  { festival_id:'b', name_en:'Beta', name_hi:'बीटा', hindu_month:'Magha', tradition:'Jain', category:'vrat', is_major:'no', dates:[{year:2026,start_date:'2026-03-10'}] },
  { festival_id:'c', name_en:'Recurring', name_hi:'आवर्ती', hindu_month:'', tradition:'Hindu', category:'recurring', is_major:'no', dates:[] }
];
test('upcoming festivals are year-scoped, date sorted and exclude dates before the given day',()=>assert.deepEqual(upcomingFestivals(festivals,2026,'2026-03-01').map(f=>f.festival_id),['b']));
test('filters can match Hindi text, month, tradition and major status',()=>assert.deepEqual(filterFestivals(festivals,{query:'अल्फा',month:'Chaitra',tradition:'Hindu',major:true}).map(f=>f.festival_id),['a']));
test('recurring observances can be selected when no year date exists',()=>assert.deepEqual(filterFestivals(festivals,{dated:false,year:2026}).map(f=>f.festival_id),['c']));
