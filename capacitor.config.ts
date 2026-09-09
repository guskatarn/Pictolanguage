import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Empaquetage Android de l'application web.
 *
 * Capacitor plutôt que TWA : le contenu est embarqué dans l'apk, sans aucune
 * dépendance à une URL au moment de l'exécution. Une tablette sans réseau
 * affiche la grille complète dès la première ouverture, ce qui est la promesse
 * centrale de l'application. Voir `docs/AUDIT.md` §2.A.
 *
 * `appId` est **définitif** une fois l'application publiée : Google Play
 * l'utilise comme identité et n'autorise aucun changement ensuite. Il est
 * construit sur `guskatarn.github.io`, le seul domaine dont l'éditeur dispose
 * réellement — un identifiant en `fr.disavecmoi.*` supposerait un nom de
 * domaine qui n'a jamais été enregistré (décision du 2026-09-04).
 */
const config: CapacitorConfig = {
  appId: 'io.github.guskatarn.disavecmoi',
  appName: 'disavecmoi',
  webDir: 'dist',
  android: {
    // La WebView ne doit pas laisser l'enfant zoomer par mégarde : il obtient
    // un affichage décalé qu'il ne sait pas rétablir. L'application offre son
    // propre réglage de taille (S/M/L). Même raison que `user-scalable=no`
    // dans index.html.
    zoomEnabled: false,
    // Android 15 impose le mode bord-à-bord aux applications visant API 35+ :
    // sans ajustement, la barre violette du haut et la grille passeraient sous
    // la barre d'état et sous la barre de navigation. 'auto' n'ajuste que sur
    // les versions concernées ; c'est le défaut annoncé de Capacitor 8.
    adjustMarginsForEdgeToEdge: 'auto',
  },
}

export default config
