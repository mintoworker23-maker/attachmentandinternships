const fs = require('fs');
const jobs = JSON.parse(fs.readFileSync('public/data/all-jobs.json','utf8'));
const bad = jobs.filter(j => j.overview && j.overview.includes('<!DOCTYPE'));
console.log('Jobs with <!DOCTYPE in overview:', bad.length);
if (bad.length > 0) {
  console.log('IDs:', bad.map(j => j.id).join(', '));
  console.log('\nFirst bad job overview sample:');
  console.log(bad[0].overview.slice(0, 400));
}
