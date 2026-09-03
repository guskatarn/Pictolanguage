/**
 * Normalisation des images de pictogrammes personnalisés avant persistance.
 *
 * Tout est stocké en data-URL dans `localStorage`, plafonné à ~5 Mo par
 * origine : une photo de téléphone brute (2 à 5 Mo, ~⅓ de plus une fois encodée
 * en base64) suffit à saturer le quota à elle seule. On redimensionne donc et on
 * ré-encode systématiquement, ce qui ramène une image à quelques dizaines de
 * kilo-octets — amplement suffisant pour une vignette affichée au plus à ~160 px.
 */

/** Côté le plus long après redimensionnement (doublé pour les écrans HiDPI). */
const MAX_DIMENSION = 320

const QUALITY = 0.82

let webpSupport: boolean | null = null

/**
 * WebP préserve la transparence — indispensable, les pictogrammes ARASAAC sont
 * des PNG détourés — pour un poids nettement moindre. Les navigateurs qui ne
 * savent pas l'encoder retombent sur du PNG.
 */
function supportsWebp(): boolean {
  if (webpSupport === null) {
    const probe = document.createElement('canvas')
    probe.width = 1
    probe.height = 1
    webpSupport = probe.toDataURL('image/webp').startsWith('data:image/webp')
  }
  return webpSupport
}

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Lecture du fichier impossible.'))
    reader.readAsDataURL(blob)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Ce fichier n'est pas une image lisible."))
    img.src = src
  })
}

function resizeToDataUrl(img: HTMLImageElement): string {
  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height))
  const width = Math.max(1, Math.round(img.width * scale))
  const height = Math.max(1, Math.round(img.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Traitement de l\'image impossible sur cet appareil.')
  ctx.drawImage(img, 0, 0, width, height)

  return supportsWebp()
    ? canvas.toDataURL('image/webp', QUALITY)
    : canvas.toDataURL('image/png')
}

/** Fichier choisi par l'utilisateur → data-URL compressée, prête à persister. */
export async function fileToStoredImage(file: File): Promise<string> {
  return resizeToDataUrl(await loadImage(await readAsDataUrl(file)))
}

/**
 * URL distante (résultat de recherche ARASAAC) → data-URL locale.
 *
 * Sans ce rapatriement, un pictogramme ajouté depuis la recherche n'est qu'un
 * lien `static.arasaac.org` : il disparaît dès que l'appareil est hors ligne,
 * c'est-à-dire précisément quand l'application doit rester fiable.
 * `static.arasaac.org` répond `Access-Control-Allow-Origin: *`, le canvas n'est
 * donc pas « teinté » et son export en data-URL reste autorisé.
 */
export async function remoteImageToStoredImage(url: string): Promise<string> {
  const res = await fetch(url, { mode: 'cors' })
  if (!res.ok) throw new Error(`Téléchargement de l'image impossible (${res.status}).`)
  return resizeToDataUrl(await loadImage(await readAsDataUrl(await res.blob())))
}

/** Une data-URL est déjà autonome ; toute autre valeur dépend encore du réseau. */
export function isStoredLocally(imageUrl: string): boolean {
  return imageUrl.startsWith('data:')
}
