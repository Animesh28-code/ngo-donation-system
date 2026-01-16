const http = require('http');

const data = JSON.stringify({
  email: 'admin@ngo.com',
  password: 'admin123'
});

console.log('Testing API at localhost:5000...');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`✅ Status: ${res.statusCode}`);
  
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(responseData);
      console.log('Response:', JSON.stringify(result, null, 2));
    } catch (e) {
      console.log('Raw response:', responseData);
    }
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.error(`❌ Error: ${error.code} - ${error.message}`);
  process.exit(1);
});

console.log('Sending request...');
req.write(data);
req.end();
