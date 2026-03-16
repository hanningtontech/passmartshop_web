#!/usr/bin/env node
const https = require('https');

const payload = JSON.stringify([
  {
    id: "1",
    jsonrpc: "2.0",
    method: "call",
    params: [
      "orders.create",
      {
        customerEmail: "ci-test@example.com",
        customerName: "CI Test",
        customerPhone: "0711000000",
        shippingAddress: "Render Test",
        shippingCity: "Nairobi",
        shippingPostalCode: "00100",
        shippingCountry: "Kenya",
        items: [
          { productId: 1, productName: "CI Product", quantity: 1, price: 1.0 }
        ],
        subtotal: 1.0,
        shippingCost: 0,
        tax: 0,
        total: 1.0,
        paymentMethod: "Cash on Delivery"
      }
    ]
  }
]);

// Try posting to the procedure path with batch=1 (this matches how the frontend sends requests)
const options = {
  hostname: 'passmartshop-backend.onrender.com',
  port: 443,
  path: '/api/trpc/orders.create?batch=1',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(JSON.stringify({ input: JSON.parse(payload)[0].params[1] })),
  },
};

// We'll send body as { input: <object> } when posting directly to the procedure route
const bodyToSend = JSON.stringify({ input: JSON.parse(payload)[0].params[1] });

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => {
    console.log('STATUS', res.statusCode);
    try {
      const parsed = JSON.parse(data);
      console.log('RESPONSE', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('RAW RESPONSE', data);
    }
  });
});

req.on('error', (err) => {
  console.error('Request error', err);
});

req.write(payload);
req.end();

