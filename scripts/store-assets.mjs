/**
 * Génère les visuels de l'application et de la fiche Google Play.
 *
 * Tout passe par Chrome en mode headless : les icônes et le feature graphic
 * sont des gabarits SVG rendus à la taille exacte, les captures d'écran sont
 * l'application réelle photographiée aux formats exigés par Play. Rien n'est
 * dessiné à la main, donc rien ne se périme en silence quand l'interface
 * change — il suffit de relancer `npm run assets`.
 *
 * Les captures ne peuvent pas se contenter d'ouvrir l'application : sans
 * profil enregistré, on ne photographierait que le sélecteur de profils. Le
 * `index.html` du build est donc réémis augmenté de deux scripts — l'un écrit
 * un profil de démonstration, l'autre pilote l'interface (choisir un onglet,
 * composer une phrase) avant la photo. Voir `pageCapture`.
 *
 * Usage : node scripts/store-assets.mjs [--icones] [--captures]
 *         (sans option : les deux)
 */
import { spawn, spawnSync } from 'child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { createServer } from 'net'
import { dirname, join, relative, resolve } from 'path'
import { fileURLToPath } from 'url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')
const STORE = join(ROOT, 'store')
const CAPTURES = join(STORE, 'captures')
const PUBLIC = join(ROOT, 'public')

const VIOLET = '#7C3AED'
const VIOLET_FONCE = '#5B21B6'

/* ------------------------------------------------------------------ Chrome */

function trouverChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH
  const candidats = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ]
  const trouve = candidats.find((c) => existsSync(c))
  if (trouve) return trouve
  throw new Error('Chrome introuvable. Renseigner son chemin dans CHROME_PATH.')
}

const CHROME = trouverChrome()
let profilTemporaire = 0

/** Photographie une URL à une taille donnée. `echelle` multiplie la définition. */
function capturer(url, sortie, largeur, hauteur, echelle = 1) {
  mkdirSync(dirname(sortie), { recursive: true })
  const res = spawnSync(
    CHROME,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--no-first-run',
      `--user-data-dir=${join(DIST, `.chrome-${profilTemporaire++}`)}`,
      `--force-device-scale-factor=${echelle}`,
      `--window-size=${largeur},${hauteur}`,
      `--screenshot=${sortie}`,
      '--virtual-time-budget=10000',
      url,
    ],
    { stdio: 'ignore' },
  )
  if (res.status !== 0 || !existsSync(sortie)) {
    throw new Error(`Échec de la capture : ${sortie}`)
  }
  console.log(`  ${relative(ROOT, sortie)}  ${largeur * echelle}x${hauteur * echelle}`)
}

/* -------------------------------------------------------------- Le symbole */

/**
 * Un tableau de communication qui parle : une bulle de parole blanche dont le
 * contenu est une grille de quatre cases colorées, aux couleurs d'onglet de
 * l'application. Aucun texte — illisible à 48 px et intraduisible — et aucun
 * pictogramme ARASAAC, pour que les visuels de la fiche restent hors du champ
 * de la licence CC BY-NC-SA.
 *
 * La géométrie tient dans la zone sûre des icônes « maskable » d'Android (un
 * cercle des 80 % centraux) : le lanceur rogne l'icône selon sa propre forme,
 * et tout ce qui déborde de ce cercle peut disparaître.
 */
function symboleSVG({ taille = 512, fond = true } = {}) {
  const cellules = [
    [152, 152, '#F59E0B'],
    [264, 152, '#3B82F6'],
    [152, 264, '#22C55E'],
    [264, 264, '#EC4899'],
  ]
  return `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${taille}" height="${taille}">
    <defs>
      <linearGradient id="fond" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${VIOLET}"/>
        <stop offset="1" stop-color="${VIOLET_FONCE}"/>
      </linearGradient>
    </defs>
    ${fond ? '<rect width="512" height="512" fill="url(#fond)"/>' : ''}
    <path d="M172 358 L172 434 L248 374 Z" fill="#ffffff"/>
    <rect x="128" y="128" width="256" height="256" rx="44" fill="#ffffff"/>
    ${cellules
      .map(([x, y, c]) => `<rect x="${x}" y="${y}" width="96" height="96" rx="20" fill="${c}"/>`)
      .join('\n    ')}
  </svg>`
}

function pageSVG(svg, largeur, hauteur, fond) {
  return `<!doctype html><meta charset="utf-8">
<style>html,body{margin:0;padding:0;width:${largeur}px;height:${hauteur}px;overflow:hidden;background:${fond}}
svg{display:block}</style>${svg}`
}

function ecrireGabarit(nom, html) {
  mkdirSync(DIST, { recursive: true })
  const chemin = join(DIST, nom)
  writeFileSync(chemin, html, 'utf8')
  return chemin
}

function pageFeature() {
  return `<!doctype html><meta charset="utf-8">
<style>
  html,body{margin:0;width:1024px;height:500px;overflow:hidden}
  .cadre{width:1024px;height:500px;box-sizing:border-box;padding:0 96px;
    background:linear-gradient(135deg,${VIOLET} 0%,${VIOLET_FONCE} 100%);
    display:flex;align-items:center;gap:60px;position:relative;overflow:hidden;
    font-family:'Segoe UI',system-ui,-apple-system,sans-serif}
  .halo{position:absolute;border-radius:50%;background:rgba(255,255,255,.07)}
  .halo-1{width:520px;height:520px;right:-140px;top:-190px}
  .halo-2{width:340px;height:340px;right:150px;bottom:-200px}
  .marque{position:relative;flex:0 0 auto;line-height:0}
  .texte{position:relative;color:#fff}
  .nom{font-size:88px;font-weight:800;letter-spacing:-2px;line-height:1}
  .accroche{font-size:34px;font-weight:600;margin-top:20px;color:#EDE9FE;line-height:1.25}
  .atouts{font-size:23px;font-weight:600;margin-top:26px;color:#C4B5FD}
</style>
<div class="cadre">
  <div class="halo halo-1"></div>
  <div class="halo halo-2"></div>
  <div class="marque">${symboleSVG({ taille: 264, fond: false })}</div>
  <div class="texte">
    <div class="nom">disavecmoi</div>
    <div class="accroche">Parler avec des images,<br>même sans connexion</div>
    <div class="atouts">Gratuit · Sans compte · Sans publicité</div>
  </div>
</div>`
}

function genererIcones() {
  console.log('Icônes et feature graphic :')
  mkdirSync(STORE, { recursive: true })

  // Icônes de l'application. Le manifeste les déclare « any maskable », d'où
  // le fond à bord perdu : c'est Android qui applique la découpe.
  for (const taille of [192, 512]) {
    const gabarit = ecrireGabarit(
      `__icone-${taille}.html`,
      pageSVG(symboleSVG({ taille }), taille, taille, VIOLET),
    )
    capturer(`file://${gabarit}`, join(PUBLIC, `icon-${taille}.png`), taille, taille)
  }

  // Icône de la fiche Play : 512x512, sans transparence ni coins arrondis,
  // Google appliquant son propre masque par-dessus.
  const gabaritStore = ecrireGabarit(
    '__icone-store.html',
    pageSVG(symboleSVG({ taille: 512 }), 512, 512, VIOLET),
  )
  capturer(`file://${gabaritStore}`, join(STORE, 'icone-play-512.png'), 512, 512)

  // Feature graphic 1024x500. Play le rogne selon le format d'affichage :
  // rien d'essentiel ne s'approche des bords.
  const gabaritFeature = ecrireGabarit('__feature.html', pageFeature())
  capturer(`file://${gabaritFeature}`, join(STORE, 'feature-graphic-1024x500.png'), 1024, 500)
}

/* ------------------------------------------------------- Captures d'écran */

const SCENES = {
  accueil: [],
  phrase: [
    '.core-bar button[aria-label="moi"]',
    '.core-bar button[aria-label="vouloir"]',
    '.picto-card[aria-label="manger"]',
  ],
  favoris: ['.category-tabs button[aria-label="⭐ Favoris"]'],
  reglages: ['button[aria-label="Paramètres"]'],
}

/*
  `--window-size` fixe la largeur de mise en page en pixels CSS, et l'image
  vaut cette taille multipliée par `echelle`.

  Chrome refuse toutefois toute fenêtre plus étroite qu'environ 500 px CSS :
  une demande de 360 px est ramenée à 490 pendant que l'image, elle, garde la
  taille demandée — la mise en page est alors rognée à droite sans le moindre
  avertissement. D'où une largeur « téléphone » de 500 px, la plus étroite que
  cet outillage permette de photographier honnêtement. Un téléphone courant
  faisant plutôt 360 à 430 px, ces captures montrent une colonne de plus que
  l'appareil réel ; à vérifier sur un vrai téléphone avant publication.
*/
const FORMATS = [
  { nom: 'telephone', largeur: 500, hauteur: 888, echelle: 2 },
  { nom: 'tablette-7', largeur: 960, hauteur: 600, echelle: 2 },
  { nom: 'tablette-10', largeur: 1280, hauteur: 800, echelle: 2 },
]

const PROFIL_DEMO = {
  activeProfileId: 'demo',
  profiles: [
    {
      id: 'demo',
      name: 'Lina',
      avatar: '🦊',
      // Quelques favoris, sans quoi l'onglet « Favoris » se photographierait vide.
      favorites: [6456, 6061, 2462, 23392, 6964],
      favoritesCustom: [],
      hidden: [],
      hiddenCustom: [],
      categoryOrder: [],
      customPictograms: [],
      history: [],
      settings: { pictogramSize: 'M', voiceRate: 1, voiceVolume: 1, showCoreBar: true },
    },
  ],
}

/**
 * Construit la page de capture à partir du `index.html` réellement produit par
 * le build : c'est la vraie application, dans un document de premier niveau,
 * augmentée de deux scripts.
 *
 * Une première tentative chargeait l'application dans une iframe pour la
 * piloter de l'extérieur. Les captures sortaient blanches : sous
 * `--virtual-time-budget`, Chrome photographie sans attendre qu'un sous-cadre
 * ait peint. D'où l'injection directe.
 *
 * L'amorçage doit précéder le bundle, qui lit localStorage dès son premier
 * rendu. Un script classique en ligne s'exécute avant un module différé, donc
 * l'ordre d'insertion suffit.
 */
function pageCapture(indexHtml, scene) {
  const amorce = `<script>
  // La clé porte l'ancien nom de l'application, comme dans src/utils/storage.ts.
  localStorage.setItem('pictoapp-data', ${JSON.stringify(JSON.stringify(PROFIL_DEMO))});
</script>`

  const pilote = `<script>
(function () {
  var etapes = ${JSON.stringify(SCENES[scene])};
  // La bannière « Installer » ne peut pas apparaître dans l'application
  // publiée sur Play : elle vient de l'événement beforeinstallprompt, propre au
  // navigateur. La montrer sur la fiche store induirait en erreur. Le retrait
  // est répété plutôt que fait une fois : l'événement arrive à un moment
  // variable, et un nettoyage ponctuel laissait passer une capture sur trois.
  setInterval(function () {
    var bandeau = Array.prototype.find.call(document.querySelectorAll('button'), function (b) {
      return b.textContent.indexOf('Installer') !== -1;
    });
    if (bandeau) bandeau.remove();
  }, 150);
  // Une scène qui échoue doit produire une capture manifestement fausse plutôt
  // qu'une copie silencieuse de l'écran d'accueil.
  function echouer(message) {
    document.body.innerHTML = '<div style="font:700 28px system-ui;color:#fff;background:#dc2626;' +
      'padding:40px;height:100vh">CAPTURE INVALIDE\\n' + message + '</div>';
  }
  function attendre(sel, suite) {
    var debut = Date.now();
    var id = setInterval(function () {
      var el = document.querySelector(sel);
      if (el) { clearInterval(id); suite(el); return; }
      if (Date.now() - debut > 8000) { clearInterval(id); echouer('Introuvable : ' + sel); }
    }, 50);
  }
  var i = 0;
  function suivant() {
    if (i >= etapes.length) return;
    attendre(etapes[i], function (el) { el.click(); i++; setTimeout(suivant, 300); });
  }
  setTimeout(suivant, 600);
})();
</script>`

  if (!indexHtml.includes('</head>') || !indexHtml.includes('</body>')) {
    throw new Error('dist/index.html inattendu : impossible d’y injecter la capture.')
  }
  return indexHtml
    .replace('</head>', `${amorce}\n</head>`)
    .replace('</body>', `${pilote}\n</body>`)
}

function portLibre(port) {
  return new Promise((res) => {
    const s = createServer()
    s.once('error', () => res(false))
    s.once('listening', () => s.close(() => res(true)))
    s.listen(port, '127.0.0.1')
  })
}

async function attendre(url, essais = 40) {
  for (let i = 0; i < essais; i++) {
    try {
      const r = await fetch(url)
      if (r.ok) return
    } catch {
      /* le serveur n'écoute pas encore */
    }
    await new Promise((r) => setTimeout(r, 400))
  }
  throw new Error(`Serveur injoignable : ${url}`)
}

async function genererCaptures() {
  if (!existsSync(join(DIST, 'index.html'))) {
    throw new Error('dist/ absent : lancer `npm run build` avant les captures.')
  }
  console.log("Captures d'écran :")
  const port = 4178
  if (!(await portLibre(port))) throw new Error(`Le port ${port} est déjà occupé.`)

  const indexHtml = readFileSync(join(DIST, 'index.html'), 'utf8')
  const pages = Object.keys(SCENES).map((scene) => {
    const nom = `__capture-${scene}.html`
    writeFileSync(join(DIST, nom), pageCapture(indexHtml, scene), 'utf8')
    return { scene, nom }
  })

  const serveur = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], {
    cwd: ROOT,
    stdio: 'ignore',
    shell: process.platform === 'win32',
  })

  try {
    await attendre(`http://localhost:${port}/`)
    for (const { scene, nom } of pages) {
      for (const f of FORMATS) {
        capturer(
          `http://localhost:${port}/${nom}`,
          join(CAPTURES, `${f.nom}-${scene}.png`),
          f.largeur,
          f.hauteur,
          f.echelle,
        )
      }
    }
  } finally {
    serveur.kill()
    for (const { nom } of pages) rmSync(join(DIST, nom), { force: true })
  }
}

/* --------------------------------------------------------------- Exécution */

const args = process.argv.slice(2)
const tout = args.length === 0
try {
  if (tout || args.includes('--icones')) genererIcones()
  if (tout || args.includes('--captures')) await genererCaptures()
} finally {
  // Gabarits et profils Chrome jetables : rien de tout cela n'a à survivre.
  for (const f of ['__icone-192.html', '__icone-512.html', '__icone-store.html', '__feature.html']) {
    rmSync(join(DIST, f), { force: true })
  }
  for (let i = 0; i < profilTemporaire; i++) {
    rmSync(join(DIST, `.chrome-${i}`), { recursive: true, force: true })
  }
}
