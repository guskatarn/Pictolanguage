import { deflateSync } from 'zlib'
import { writeFileSync } from 'fs'

const crcTable = new Uint32Array(256)
for (let i = 0; i < 256; i++) {
  let c = i
  for (let k = 0; k < 8; k++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1
  crcTable[i] = c
}

function crc32(buf) {
  let crc = 0xffffffff
  for (const b of buf) crc = (crcTable[(crc ^ b) & 0xff] ^ (crc >>> 8)) >>> 0
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const lenBuf = Buffer.alloc(4)
  lenBuf.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf])
}

function makePNG(size, hex) {
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8   // bit depth
  ihdr[9] = 2   // RGB

  const rows = []
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 3)
    row[0] = 0 // filter none
    for (let x = 0; x < size; x++) {
      const i = 1 + x * 3
      // Simple circle inside
      const cx = size / 2, cy = size / 2, radius = size * 0.42
      const dx = x - cx, dy = y - cy
      const inside = dx * dx + dy * dy <= radius * radius
      row[i]     = inside ? 255 : r
      row[i + 1] = inside ? 255 : g
      row[i + 2] = inside ? 255 : b
    }
    rows.push(row)
  }

  const compressed = deflateSync(Buffer.concat(rows))

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

writeFileSync('public/icon-192.png', makePNG(192, '7C3AED'))
writeFileSync('public/icon-512.png', makePNG(512, '7C3AED'))
console.log('✓ Icônes PWA générées : public/icon-192.png, public/icon-512.png')
