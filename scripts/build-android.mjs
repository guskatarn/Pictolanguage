/**
 * Prépare le projet Android à partir du build web (`npm run android`).
 *
 * Trois choses qu'il ne faut pas faire à la main :
 *
 * 1. **Le numéro de version.** Google Play refuse un téléversement dont le
 *    `versionCode` n'est pas strictement supérieur au précédent, et un numéro
 *    consommé est perdu définitivement — il n'existe aucun moyen de revenir en
 *    arrière. Le numéro est donc dérivé de `package.json`, seule source, plutôt
 *    que saisi dans deux fichiers qui finiraient par diverger.
 * 2. **Le service worker.** Le build est fait avec `CAPACITOR=1`, ce qui le
 *    désactive : dans l'apk tous les fichiers sont déjà locaux, et un second
 *    cache par-dessus celui de l'application peut resservir l'ancienne
 *    interface après une mise à jour du Play Store. Le script vérifie ensuite
 *    que `dist/` n'en contient effectivement pas.
 * 3. **La copie vers android/.** `cap sync` recopie `dist/` dans le projet
 *    natif ; l'oublier produit une apk qui contient la version précédente de
 *    l'interface, sans le moindre message.
 *
 * Usage : node scripts/build-android.mjs [--sans-build]
 */
import { spawnSync } from 'child_process'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join, resolve } from 'path'
import { fileURLToPath } from 'url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const GRADLE = join(ROOT, 'android', 'app', 'build.gradle')
const DIST = join(ROOT, 'dist')

/**
 * `versionCode` dérivé de la version sémantique : 1.0.0 donne 10000, 1.2.3
 * donne 10203. Croissant tant que mineur et correctif restent sous 100, ce qui
 * laisse la marge d'un projet de cette taille, et lisible dans la console Play
 * où l'on ne voit que ce nombre.
 */
export function versionCodeDepuis(version) {
  const [majeur, mineur, correctif] = version.split('.').map(Number)
  if ([majeur, mineur, correctif].some((n) => !Number.isInteger(n) || n < 0)) {
    throw new Error(`Version illisible dans package.json : « ${version} »`)
  }
  if (mineur > 99 || correctif > 99) {
    throw new Error(
      `Version ${version} : mineur et correctif doivent rester sous 100, ` +
        'sinon deux versions différentes donneraient le même versionCode.',
    )
  }
  return majeur * 10000 + mineur * 100 + correctif
}

function executer(commande, args) {
  const res = spawnSync(commande, args, {
    cwd: ROOT,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, CAPACITOR: '1' },
  })
  if (res.status !== 0) {
    throw new Error(`Échec : ${commande} ${args.join(' ')}`)
  }
}

function ecrireVersion(version, code) {
  const avant = readFileSync(GRADLE, 'utf8')
  const apres = avant
    .replace(/versionCode \d+/, `versionCode ${code}`)
    .replace(/versionName "[^"]*"/, `versionName "${version}"`)
  if (!/versionCode \d+/.test(apres) || !/versionName "[^"]*"/.test(apres)) {
    throw new Error(`Impossible de situer versionCode/versionName dans ${GRADLE}`)
  }
  if (apres !== avant) writeFileSync(GRADLE, apres)
  return apres.includes(`versionCode ${code}`)
}

const { version } = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
const code = versionCodeDepuis(version)

if (!process.argv.includes('--sans-build')) {
  executer('npm', ['run', 'build'])
}

if (!existsSync(join(DIST, 'index.html'))) {
  throw new Error('dist/index.html absent : lancer le build avant la synchronisation.')
}
if (existsSync(join(DIST, 'sw.js'))) {
  throw new Error(
    'dist/sw.js est présent : le build a été fait sans CAPACITOR=1, donc avec le ' +
      "service worker. Relancer via `npm run android` plutôt que d'appeler cap sync.",
  )
}

ecrireVersion(version, code)
executer('npx', ['cap', 'sync', 'android'])

console.log(`\nProjet Android prêt — version ${version}, versionCode ${code}.`)
console.log('Reste à produire le binaire (SDK Android requis, voir docs/EMPAQUETAGE-ANDROID.md) :')
console.log('  cd android && ./gradlew bundleRelease   # .aab pour le Play Store')
console.log('  cd android && ./gradlew assembleDebug   # .apk installable pour tester')
