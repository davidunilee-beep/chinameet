const fs = require('node:fs');
const zlib = require('node:zlib');
const path = require('node:path');
function crc32(data) { let c = 0xffffffff; for (const b of data) { c ^= b; for (let i=0;i<8;i++) c = (c>>>1) ^ (0xedb88320 & -(c&1)); } return (c ^ 0xffffffff) >>> 0; }
function chunk(type, data) { const name = Buffer.from(type); const size = Buffer.alloc(4); size.writeUInt32BE(data.length); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([name,data]))); return Buffer.concat([size,name,data,crc]); }
const out = path.join(__dirname, '../icons'); fs.mkdirSync(out, {recursive:true});
for (const [name, size] of [['app-192.png',192],['app-512.png',512],['app-maskable.png',512],['apple-touch-icon.png',180]]) {
  const raw = Buffer.alloc((size*3+1)*size);
  for (let y=0;y<size;y++) for (let x=0;x<size;x++) {
    const u=x/size, v=y/size;
    // A geometric 中 glyph, kept inside the maskable safe zone.
    const glyph = (u>.465 && u<.535 && v>.22 && v<.78) || (u>.29 && u<.71 && ((v>.34 && v<.40)||(v>.57 && v<.63))) || (((u>.29&&u<.35)||(u>.65&&u<.71)) && v>.34 && v<.63);
    const color = glyph ? [241,178,144] : [23,26,35];
    const at=y*(size*3+1)+1+x*3; for(let c=0;c<3;c++) raw[at+c]=color[c];
  }
  const header=Buffer.alloc(13); header.writeUInt32BE(size);header.writeUInt32BE(size,4);header[8]=8;header[9]=2;
  fs.writeFileSync(path.join(out,name),Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]));
}
