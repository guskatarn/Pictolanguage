/**
 * Télécharge les pictogrammes ARASAAC utilisés par défaut dans l'application
 * et les écrit dans `public/pictograms/<id>.png`, afin que l'app soit
 * pleinement utilisable hors ligne dès l'installation (sans dépendre du
 * cache du service worker, qui expire au bout de 30 jours).
 *
 * Génère aussi `src/data/bundledPictograms.ts` : la liste des ids embarqués,
 * utilisée à l'exécution pour choisir entre l'image locale et l'URL distante.
 *
 * Usage : node scripts/fetch-pictograms.mjs [--force]
 *
 * Les pictogrammes ARASAAC sont sous licence CC BY-NC-SA (auteur : Sergio
 * Palao, origine : ARASAAC — https://arasaac.org — propriété du Gouvernement
 * d'Aragon). Les embarquer constitue une redistribution : l'attribution
 * visible dans l'application est donc obligatoire.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public', 'pictograms')
const force = process.argv.includes('--force')

/** Extrait les ids ARASAAC d'un fichier de données TypeScript. */
function extractIds(relPath) {
  const src = readFileSync(join(root, relPath), 'utf8')
  return [...src.matchAll(/\{\s*id:\s*(\d+)/g)].map((m) => Number(m[1]))
}

const ids = [
  ...new Set([
    ...extractIds('src/data/defaultPictograms.ts'),
    ...extractIds('src/data/coreVocabulary.ts'),
  ]),
].sort((a, b) => a - b)

mkdirSync(outDir, { recursive: true })

let downloaded = 0
let skipped = 0
const failed = []

for (const id of ids) {
  const dest = join(outDir, `${id}.png`)
  if (!force && existsSync(dest)) {
    skipped++
    continue
  }
  const url = `https://static.arasaac.org/pictograms/${id}/${id}_500.png`
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
    downloaded++
    process.stdout.write(`✓ ${id}\n`)
  } catch (err) {
    failed.push(id)
    process.stdout.write(`✗ ${id} — ${err.message}\n`)
  }
}

const available = ids.filter((id) => existsSync(join(outDir, `${id}.png`)))

writeFileSync(
  join(root, 'src', 'data', 'bundledPictograms.ts'),
  `// Fichier généré par scripts/fetch-pictograms.mjs — ne pas éditer à la main.
// Ids des pictogrammes ARASAAC dont l'image est embarquée dans public/pictograms/,
// donc disponibles hors ligne sans dépendre du cache réseau.

export const BUNDLED_PICTOGRAM_IDS: ReadonlySet<number> = new Set([
${available.map((id) => `  ${id},`).join('\n')}
])
`,
)

console.log(
  `\n${downloaded} téléchargé(s), ${skipped} déjà présent(s), ${failed.length} en échec` +
    (failed.length ? ` : ${failed.join(', ')}` : '') +
    `\n${available.length}/${ids.length} pictogrammes embarqués.`,
)
if (failed.length) process.exitCode = 1
