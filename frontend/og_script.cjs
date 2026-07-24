const { Jimp } = require('jimp');
const path = require('path');

async function run() {
  const bg = new Jimp({ width: 1200, height: 630, color: '#091122' });
  const logo = await Jimp.read('public/Icone_Corpo_Conectado_Premium.png');
  
  logo.resize({ w: 350, h: 350 });
  
  // Center logo on the left
  const logoX = 120;
  const logoY = (630 - 350) / 2;
  bg.composite(logo, logoX, logoY);
  
  // Load fonts
  const font64Path = path.resolve('node_modules/@jimp/plugin-print/fonts/open-sans/open-sans-64-white/open-sans-64-white.fnt');
  const font32Path = path.resolve('node_modules/@jimp/plugin-print/fonts/open-sans/open-sans-32-white/open-sans-32-white.fnt');
  
  try {
    const { loadFont } = require('jimp');
    const font64 = await loadFont(font64Path);
    const font32 = await loadFont(font32Path);
    
    // Texts
    const title = "Corpo Conectado";
    const subtitle = "Sistema de Gestão Desportiva\ne Prescrição.";
    
    // Print title
    bg.print({
      font: font64,
      x: 520,
      y: 250,
      text: title
    });
    
    // Print subtitle
    bg.print({
      font: font32,
      x: 520,
      y: 340,
      text: subtitle
    });
    
  } catch (err) {
    console.error("Error loading fonts:", err);
  }
  
  await bg.write('public/og-image.jpg');
  console.log('OG Image generated!');
}

run();
