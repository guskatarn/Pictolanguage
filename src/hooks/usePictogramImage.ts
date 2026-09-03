import { useEffect, useState } from 'react'
import { getArasaacRemoteImageUrl } from '../data/defaultPictograms'

/**
 * Fournit la source d'image d'un pictogramme avec repli en cascade :
 * image locale embarquée → URL ARASAAC distante → placeholder.
 *
 * Les pictogrammes par défaut sont servis depuis `public/pictograms/`, mais
 * un fichier peut manquer (vocabulaire étendu sans avoir relancé
 * `npm run pictograms`) : on retente alors le réseau avant d'abandonner,
 * plutôt que d'afficher une case vide à un enfant qui cherche son mot.
 */
export function usePictogramImage(imageUrl: string | null | undefined, arasaacId?: number) {
  const [src, setSrc] = useState(imageUrl ?? null)
  const [failed, setFailed] = useState(!imageUrl)

  useEffect(() => {
    setSrc(imageUrl ?? null)
    setFailed(!imageUrl)
  }, [imageUrl])

  const onError = () => {
    const remote = arasaacId !== undefined ? getArasaacRemoteImageUrl(arasaacId) : null
    if (remote && src !== remote) setSrc(remote)
    else setFailed(true)
  }

  return { src: failed ? null : src, failed, onError }
}
