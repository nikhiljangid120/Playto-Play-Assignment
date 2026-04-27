const https = require('https');
https.get('https://playto-play-assignment.vercel.app', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const m = data.match(/assets\/index-[^.]*\.js/);
    if (!m) return console.log('no match');
    https.get('https://playto-play-assignment.vercel.app/' + m[0], (res2) => {
      let js = '';
      res2.on('data', chunk => js += chunk);
      res2.on('end', () => {
        console.log('Contains localhost?', js.includes('localhost:8000'));
        console.log('Contains render?', js.includes('playto-backend'));
      });
    });
  });
});
