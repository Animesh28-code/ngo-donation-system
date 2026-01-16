const http = require('http');

// First, login to get token
const loginOptions = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
};

const loginReq = http.request(loginOptions, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Login response:', data);
    const loginResp = JSON.parse(data);
    const token = loginResp.token;
    
    if (!token) {
      console.error('No token received');
      return;
    }

    // Now test PayHere init
    const payHereOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/payhere/init',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    };

    const payHereReq = http.request(payHereOptions, (res) => {
      let payHereData = '';
      res.on('data', (chunk) => {
        payHereData += chunk;
      });
      res.on('end', () => {
        console.log('PayHere init response status:', res.statusCode);
        console.log('PayHere init response:', payHereData);
      });
    });

    const payHereBody = JSON.stringify({
      amount: 100,
      items: 'NGO Donation',
      donor: {
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
      },
    });

    payHereReq.write(payHereBody);
    payHereReq.end();
  });
});

const loginBody = JSON.stringify({
  email: 'user@example.com',
  password: 'user123',
});

loginReq.write(loginBody);
loginReq.end();
