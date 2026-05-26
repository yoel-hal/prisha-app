const fs = require('fs');
const path = require('path');

const src = path.resolve(
  __dirname,
  '../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Feather.ttf',
);
const destDir = path.resolve(__dirname, '../dist/fonts');
const dest = path.join(destDir, 'Feather.ttf');

if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);
console.log('✅ Feather.ttf copied to dist/fonts/');
