const http = require('http');

const data = JSON.stringify({
  email: 'admin@ngo.com',
  password: 'admin123'
});

const options = {
  hostname: '127.0.0.1',
  port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('Response body:');
    try {
      console.log(JSON.stringify(JSON.parse(responseData), null, 2));
    } catch (e) {
      console.log(responseData);
    }
  });
});

req.on('error', (error) => {
  console.error(`Problem with request: ${error.message}`);
  console.error(error);
});

req.write(data);
req.end();
