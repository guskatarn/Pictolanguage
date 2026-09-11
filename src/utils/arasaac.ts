import { BUNDLED_PICTOGRAM_IDS } from '../data/bundledPictograms'

/** URL distante officielle d'un pictogramme ARASAAC (nécessite le réseau). */
export function getArasaacRemoteImageUrl(id: number): string {
  return `https://static.arasaac.org/pictograms/${id}/${id}_500.png`
}

/**
 * Source d'image à utiliser pour un pictogramme ARASAAC.
 *
 * Les pictogrammes du lexique livré sont embarqués dans `public/pictograms/`
 * (voir scripts/fetch-pictograms.mjs) : ils sont servis localement, donc
 * disponibles hors ligne dès l'installation et jamais purgés par l'expiration
 * du cache du service worker. Les autres (résultats de recherche ARASAAC)
 * retombent sur l'URL distante.
 */
export function getArasaacImageUrl(id: number): string {
  return BUNDLED_PICTOGRAM_IDS.has(id)
    ? `${import.meta.env.BASE_URL}pictograms/${id}.png`
    : getArasaacRemoteImageUrl(id)
}
