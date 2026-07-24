const { Jimp } = require('jimp');

async function run() {
  const bg = new Jimp({ width: 1200, height: 630, color: '#09090b' });
  const logo = await Jimp.read('public/Icone_Corpo_Conectado_Premium.png');
  
  logo.resize({ w: 400, h: 400 });
  
  // Center logo
  const x = (1200 - 400) / 2;
  const y = (630 - 400) / 2;
  
  bg.composite(logo, x, y);
  
  await bg.write('public/og-image.jpg');
  console.log('OG Image generated!');
}

run();
