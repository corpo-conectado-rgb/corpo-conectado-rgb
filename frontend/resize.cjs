const { Jimp } = require('jimp');

async function run() {
  const img = await Jimp.read('public/Icone_Corpo_Conectado_Premium.png');
  img.resize({ w: 192, h: 192 }).write('public/icon-192.png');
  img.resize({ w: 512, h: 512 }).write('public/icon-512.png');
  console.log('Icons generated!');
}
run();
