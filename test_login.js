const https = require('https');
const data = JSON.stringify({username: 'reviewer', password: 'password'});
const options = {
  hostname: 'playto-backend-sr8b.onrender.com',
  port: 443,
  path: '/api/v1/auth/login/',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};
const req = https.request(options, res => {
  console.log('statusCode:', res.statusCode);
  res.on('data', d => {
    process.stdout.write(d);
  });
});
req.on('error', error => {
  console.error(error);
});
req.write(data);
req.end();
