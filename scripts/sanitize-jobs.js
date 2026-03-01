const fs = require('fs');
const path = 'public/data/all-jobs.json';
const data = JSON.parse(fs.readFileSync(path,'utf8'));
let changed = 0;
for (const job of data){
  if (!job.overview) continue;
  const s = job.overview;
  const idx = s.search(/<!doctype\s+html|<html|<body/i);
  if (idx !== -1){
    job.overview = s.slice(0, idx);
    changed++;
  }
}
fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
console.log('sanitized count:', changed);
