const fs = require('fs');
const data = JSON.parse(fs.readFileSync('public/data/all-jobs.json','utf8'));
const id = 'attachment-opportunities-clean-cookstoves-association-of-kenya';
const job = data.find(j => j.id === id);
console.log('found:', !!job);
if (!job) process.exit(0);
console.log('overview_length:', job.overview ? job.overview.length : 0);
console.log('overview_head:', job.overview ? job.overview.slice(0,200) : '');
console.log('contains <!DOCTYPE:', job.overview ? job.overview.indexOf('<!DOCTYPE') !== -1 : false);
