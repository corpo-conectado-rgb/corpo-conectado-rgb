const http = require('http');
require('dotenv').config();

function makeRequest(path, method, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'secret_super_seguro_para_desenvolvimento';
    const adminToken = jwt.sign({ id: 'admin123', role: 'admin' }, secret);
    
    options.headers['Authorization'] = `Bearer ${adminToken}`;

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch(e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

async function run() {
  try {
    console.log('--- GET /api/config ---');
    const get1 = await makeRequest('/api/config', 'GET');
    console.log(get1);
    
    console.log('\n--- PUT /api/config ---');
    const put1 = await makeRequest('/api/config', 'PUT', { chave: 'REQUIRE_DEVICE_ACTIVATION', valor: 'true' });
    console.log(put1);
    
    console.log('\n--- GET /api/config ---');
    const get2 = await makeRequest('/api/config', 'GET');
    console.log(get2);
    
  } catch(e) {
    console.error(e);
  }
}

run();
