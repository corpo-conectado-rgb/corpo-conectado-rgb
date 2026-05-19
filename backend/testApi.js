const http = require('http');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const token = jwt.sign({ id: 'admin', role: 'admin' }, process.env.JWT_SECRET || 'secret_super_seguro_para_desenvolvimento');
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/usuarios/401396f3-0523-4a04-be5d-48f037075009',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    console.log("USUARIO:", res.statusCode, data);
    
    // Now test ficha builder
    const options2 = { ...options, path: '/api/admin/fichas/usuario/401396f3-0523-4a04-be5d-48f037075009/builder' };
    const req2 = http.request(options2, (res2) => {
      let data2 = '';
      res2.on('data', d => data2 += d);
      res2.on('end', () => {
        console.log("FICHA BUILDER:", res2.statusCode, data2);
      });
    });
    req2.end();
  });
});
req.on('error', e => console.error(e));
req.end();
