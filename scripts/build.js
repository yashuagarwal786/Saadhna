const fs=require('node:fs');const path=require('node:path');const {DatabaseSync}=require('node:sqlite');
const db=new DatabaseSync(path.join(__dirname,'..','hindu-festival-dataset','festivals.db'));
const counts={festivals:55,festival_dates:81,rituals:179,samagri_items:182,pooja_types:19,pandits:24};
for(const [table,want] of Object.entries(counts)){const got=db.prepare(`SELECT count(*) n FROM ${table}`).get().n;if(got!==want)throw new Error(`${table}: expected ${want}, found ${got}`)}
const html=fs.readFileSync(path.join(__dirname,'..','public','index.html'),'utf8');if(!html.includes('id="app"'))throw new Error('App shell missing');
console.log('Build check passed: app shell and dataset counts are valid.');
