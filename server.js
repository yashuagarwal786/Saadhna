const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const ROOT = __dirname;
const DATA = path.join(ROOT, 'hindu-festival-dataset');
const db = new DatabaseSync(path.join(DATA, 'festivals.db'));
db.exec('PRAGMA foreign_keys = ON');
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml' };
const send = (res, status, body, type='application/json; charset=utf-8') => { res.writeHead(status, { 'Content-Type': type, 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff' }); res.end(Buffer.isBuffer(body) || typeof body === 'string' ? body : JSON.stringify(body)); };
const all = (sql, ...args) => db.prepare(sql).all(...args);
const one = (sql, ...args) => db.prepare(sql).get(...args);
const data = () => {
  const festivals = all('SELECT * FROM festivals ORDER BY festival_id');
  for (const f of festivals) {
    f.dates = all('SELECT year,start_date,end_date,date_confidence AS confidence,alt_date,note FROM festival_dates WHERE festival_id=? ORDER BY year', f.festival_id);
    f.rituals = all('SELECT step_no,phase,title,description FROM rituals WHERE festival_id=? ORDER BY step_no', f.festival_id);
    f.samagri = all(`SELECT s.item_id,s.name_hi,s.name_en,s.category,x.quantity,x.is_optional AS optional FROM festival_samagri x JOIN samagri_items s USING(item_id) WHERE x.festival_id=? ORDER BY s.category,s.name_en`, f.festival_id).map(x=>({...x,optional:x.optional==='yes'}));
  }
  const poojas = all('SELECT * FROM pooja_types ORDER BY name_en');
  for(const p of poojas){p.samagri=all(`SELECT s.item_id,s.name_hi,s.name_en,s.category,x.quantity,x.is_optional AS optional FROM pooja_samagri x JOIN samagri_items s USING(item_id) WHERE x.pooja_id=? ORDER BY s.category,s.name_en`,p.pooja_id).map(x=>({...x,optional:x.optional==='yes'}));p.pandit_ids=all('SELECT pandit_id FROM pandit_poojas WHERE pooja_id=?',p.pooja_id).map(x=>x.pandit_id);}
  const pandits=all('SELECT pandit_id,name,honorific,city,state,area_served,languages,experience_years,fee_min_inr,fee_max_inr,travel_available,online_puja_available,rating_sample,is_sample,verified,notes FROM pandits');
  for(const p of pandits)p.pooja_ids=all('SELECT pooja_id FROM pandit_poojas WHERE pandit_id=?',p.pandit_id).map(x=>x.pooja_id);
  return {festivals,poojas,pandits,months:all('SELECT * FROM hindu_months ORDER BY month_no'),tithis:all('SELECT * FROM tithis ORDER BY tithi_no'),sources:all('SELECT * FROM data_sources ORDER BY source_id')};
};

const server=http.createServer((req,res)=>{
  const url=new URL(req.url,`http://${req.headers.host||'localhost'}`);
  if(req.method==='GET' && url.pathname==='/api/data'){try{return send(res,200,data())}catch(e){return send(res,500,{error:'Unable to read festival data'})}}
  if(req.method==='POST' && url.pathname==='/api/inquiries'){
    if(!req.headers['content-type']?.includes('application/json'))return send(res,415,{error:'Send inquiry details as JSON.'});
    let raw='',tooLarge=false;req.on('data',c=>{raw+=c;if(Buffer.byteLength(raw)>12000){tooLarge=true;send(res,413,{error:'Inquiry is too large.'});req.destroy()}});req.on('end',()=>{if(tooLarge)return;try{const x=JSON.parse(raw);const name=typeof x.name==='string'?x.name.trim():'';const phone=String(x.phone||'').trim();const city=typeof x.city==='string'?x.city.trim():'';const preferredDate=x.preferred_date||null;const idOk=(sql,id)=>!id||Boolean(one(sql,id));
      if(!name||name.length>100||!/^\d{10}$/.test(phone)||!city||city.length>100||String(x.message||'').length>2000)return send(res,400,{error:'Enter a name, city and valid 10-digit mobile number. Keep the message under 2,000 characters.'});
      if(preferredDate&&(!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)||Number.isNaN(Date.parse(`${preferredDate}T00:00:00Z`))||new Date(`${preferredDate}T00:00:00Z`).toISOString().slice(0,10)!==preferredDate))return send(res,400,{error:'Choose a valid preferred date.'});
      if(preferredDate){const range=one('SELECT MIN(year) AS min_year,MAX(year) AS max_year FROM festival_dates'),dateYear=Number(preferredDate.slice(0,4));if(dateYear<range.min_year||dateYear>range.max_year)return send(res,400,{error:`Choose a preferred date between ${range.min_year} and ${range.max_year}.`})}
      if(!idOk('SELECT festival_id FROM festivals WHERE festival_id=?',x.festival_id)||!idOk('SELECT pooja_id FROM pooja_types WHERE pooja_id=?',x.pooja_id)||!idOk('SELECT pandit_id FROM pandits WHERE pandit_id=?',x.pandit_id))return send(res,400,{error:'Choose a listed festival, puja and pandit.'});
      db.prepare('INSERT INTO pandit_inquiries(name,phone,city,festival_id,pooja_id,preferred_date,pandit_id,message) VALUES(?,?,?,?,?,?,?,?)').run(name,phone,city,x.festival_id||null,x.pooja_id||null,preferredDate,x.pandit_id||null,(x.message||'').trim());send(res,201,{ok:true});
    }catch(e){send(res,400,{error:'Could not save the inquiry. Please check your details and try again.'})}});return;
  }
  if(req.method==='GET' && url.pathname==='/sitemap.xml'){
    const origin=`${req.headers['x-forwarded-proto']||url.protocol.replace(':','')}://${req.headers['x-forwarded-host']||req.headers.host||url.host}`;const ids=all('SELECT festival_id FROM festivals').map(x=>`<url><loc>${origin}/festivals/${encodeURIComponent(x.festival_id)}</loc></url>`).join('');return send(res,200,`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${origin}/</loc></url><url><loc>${origin}/calendar</loc></url><url><loc>${origin}/poojas</loc></url>${ids}</urlset>`,'application/xml; charset=utf-8');
  }
  let file=url.pathname==='/'?'/index.html':url.pathname;
  if(file.includes('..'))return send(res,400,'Bad path','text/plain');
  const target=path.join(ROOT,'public',file);
  fs.readFile(target,(err,buf)=>{if(err){if(req.method==='GET'&&req.headers.accept?.includes('text/html'))return fs.readFile(path.join(ROOT,'public','index.html'),(fallbackErr,html)=>fallbackErr?send(res,500,'App shell unavailable','text/plain; charset=utf-8'):send(res,200,html,mime['.html']));return send(res,404,'Not found','text/plain; charset=utf-8')}send(res,200,buf,mime[path.extname(target)]||'application/octet-stream')});
});
const port=Number(process.env.PORT||3000);server.listen(port,()=>console.log(`Parv & Puja running at http://localhost:${port}`));
