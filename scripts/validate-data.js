const path=require('node:path');const {DatabaseSync}=require('node:sqlite');const db=new DatabaseSync(path.join(__dirname,'..','hindu-festival-dataset','festivals.db'));
db.exec('PRAGMA foreign_keys=ON');const problems=[];
for(const x of db.prepare('PRAGMA foreign_key_check').all())problems.push(`Foreign key error in ${x.table}`);
for(const x of db.prepare('SELECT festival_id,start_date,end_date FROM festival_dates').all()){if(!/^\d{4}-\d\d-\d\d$/.test(x.start_date)||Number.isNaN(Date.parse(x.start_date)))problems.push(`Invalid start date: ${x.festival_id}`);if(x.end_date&&(!/^\d{4}-\d\d-\d\d$/.test(x.end_date)||Number.isNaN(Date.parse(x.end_date))))problems.push(`Invalid end date: ${x.festival_id}`)}
for(const x of db.prepare('SELECT f.festival_id FROM festivals f LEFT JOIN rituals r USING(festival_id) WHERE r.festival_id IS NULL').all())problems.push(`No ritual rows: ${x.festival_id}`);
if(problems.length){console.error(problems.join('\n'));process.exit(1)}console.log('Data validation passed: foreign keys, date formats and ritual coverage are valid.');
