#!/usr/bin/env node
const https = require('https');
const { URL } = require('url');

const apiBase = process.env.API_URL || 'https://passmartshop-backend.onrender.com';
const endpoint = new URL('/api/trpc/orders.create?batch=1', apiBase).toString();

const payload = {
  "0": {
    "json": {
      customerEmail: "integration-test+node@passmartshop.com",
      customerPhone: "+10000000000",
      items: [
        {
          productId: "test-prod-1",
          variantId: "default",
          price: 1999,
          quantity: 1
        }
      ],
      subtotal: 1999,
      shipping: 0,
      total: 1999,
      payment: { method: "test", status: "paid" },
      shippingAddress: {
        name: "Test Buyer",
        line1: "1 Test Way",
        city: "Testville",
        postalCode: "00000",
        country: "US"
      }
    }
  }
};

const body = JSON.stringify(payload);

const urlObj = new URL(endpoint);
const options = {
  hostname: urlObj.hostname,
  port: urlObj.port || 443,
  path: urlObj.pathname + urlObj.search,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'Accept': 'application/json',
    'User-Agent': 'passmartshop-integration-script'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => {
    console.log('STATUS', res.statusCode);
    console.log('HEADERS', res.headers);
    console.log('BODY_START');
    console.log(data.slice(0, 8000));
    console.log('BODY_END');
  });
});

req.on('error', (err) => {
  console.error('REQUEST_ERROR', err && err.message ? err.message : err);
});

req.write(body);
req.end();

