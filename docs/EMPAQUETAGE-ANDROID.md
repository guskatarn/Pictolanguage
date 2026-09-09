# Empaquetage Android — disavecmoi

Comment l'application web devient une application installable, puis un fichier
téléversable sur Google Play. Complète `AUDIT.md` §2.A (pourquoi Capacitor) et
§0 N10/N12 (version et vérifications sur appareil).

## 1. Pourquoi Capacitor plutôt qu'un TWA

Un TWA affiche un site distant dans Chrome sans barre d'adresse : il exige un
domaine à soi, un `assetlinks.json`, et dépend du réseau au démarrage.
Capacitor embarque au contraire toute l'application dans l'apk. Une tablette
sans connexion affiche la grille complète dès la première ouverture, ce qui est
la promesse centrale du produit — et la publication cesse de dépendre d'un
hébergement, abandonné avec le nom de domaine le 2026-09-04.

## 2. Ce qui est en place

| Élément | Où | Pourquoi ce choix |
| --- | --- | --- |
| Identifiant `io.github.guskatarn.disavecmoi` | `capacitor.config.ts` | **Définitif après publication.** Construit sur `guskatarn.github.io`, le seul domaine dont dispose réellement l'éditeur. |
| Capacitor **7** (et non 8) | `package.json` | La v8 exige Node ≥ 22, la machine est en 20.11. Même famille de contrainte que vitest v2 et jsdom v25. |
| `compileSdk` / `targetSdk` **36** | `android/variables.gradle` | Le gabarit Capacitor 7 propose 35 ; depuis le 31 août 2026, Play refuse toute **nouvelle** application visant moins que 36. |
| `adjustMarginsForEdgeToEdge: 'auto'` | `capacitor.config.ts` | Corollaire du point précédent : à partir d'Android 15, le bord-à-bord est imposé et la barre violette passerait sous la barre d'état. |
| `allowBackup="false"` | `AndroidManifest.xml` | La sauvegarde automatique d'Android copierait le `localStorage` — prénom, photos, phrases — vers le Google Drive du parent, ce que la politique de confidentialité exclut. |
| Service worker désactivé | `vite.config.ts` (`CAPACITOR=1`) | Tout est déjà local dans l'apk ; un second cache pourrait resservir l'ancienne interface après une mise à jour du Store. |
| `versionCode` dérivé de `package.json` | `scripts/build-android.mjs` | Play refuse un `versionCode` non croissant, et un numéro consommé est perdu définitivement. Une seule source évite la divergence. |
| Icônes et écran de lancement | `npm run assets -- --android` | Sans cela, l'application porte le logo de Capacitor sur l'écran d'accueil. |
| `values/colors.xml` | ajouté | **Absent du gabarit Capacitor 7** alors que `styles.xml` y fait référence : sans lui, la compilation échoue. |
| Signature facultative | `android/app/build.gradle` | Lue dans `android/key.properties`, hors dépôt. Tant que le fichier n'existe pas, les builds de test fonctionnent quand même. |

Permissions demandées : **`INTERNET` seulement** (recherche ARASAAC dans les
réglages). Ni caméra, ni localisation, ni stockage : l'ajout d'une photo passe
par le sélecteur du système, qui n'en exige aucune. C'est ce qui permet de
répondre « aucune » au questionnaire Play sur les permissions sensibles.

## 3. Numérotation des versions

`package.json` est la seule source. `versionName` reprend la version telle
quelle ; `versionCode` en dérive : `majeur × 10000 + mineur × 100 + correctif`.

| Version | `versionCode` |
| --- | --- |
| 1.0.0 | 10000 |
| 1.0.1 | 10001 |
| 1.2.0 | 10200 |
| 2.0.0 | 20000 |

Mineur et correctif doivent rester sous 100 — le script s'arrête sinon, deux
versions différentes donneraient le même code. **Chaque téléversement, y
compris en test fermé, consomme un `versionCode` définitivement.**

## 4. Ce qu'il reste à installer pour produire un binaire

Présents sur la machine : Node 20.11 et le JDK 21. **Manquent le SDK Android et
ses outils de compilation** — sans eux, `gradlew` ne peut rien produire.

```sh
# 1. Outils en ligne de commande (ou Android Studio, qui les embarque)
#    https://developer.android.com/studio#command-line-tools-only
#    à décompresser dans %LOCALAPPDATA%\Android\Sdk\cmdline-tools\latest

# 2. Variables d'environnement
setx ANDROID_HOME "%LOCALAPPDATA%\Android\Sdk"

# 3. Composants nécessaires
sdkmanager "platform-tools" "platforms;android-36" "build-tools;36.0.0"
sdkmanager --licenses
```

## 5. Chaîne de commandes

```sh
npm run android            # build web sans service worker, version, cap sync
cd android
./gradlew assembleDebug    # apk installable, pour tester sur un appareil
./gradlew bundleRelease    # .aab à téléverser sur Play (nécessite la clé)
```

`npm run android` refuse de continuer s'il trouve `dist/sw.js` : cela signifie
que le build a été fait sans `CAPACITOR=1`, donc avec le service worker.

## 6. Clé de signature

À créer **une seule fois**, puis à sauvegarder ailleurs que sur la machine de
développement : une clé de téléversement perdue impose de passer par
l'assistance de Google, et l'application publiée ne peut pas en changer seule.

```sh
keytool -genkeypair -v -keystore disavecmoi.jks -keyalg RSA -keysize 2048 \
        -validity 10000 -alias disavecmoi
```

Puis `android/key.properties` (ignoré par git) :

```properties
storeFile=C:/chemin/hors/depot/disavecmoi.jks
storePassword=...
keyAlias=disavecmoi
keyPassword=...
```

## 7. À vérifier sur un appareil réel, dans cet ordre

Reprend `AUDIT.md` §0 N12. Ces points ne se voient pas dans un navigateur de
bureau, et chacun peut invalider une promesse déjà écrite dans la politique de
confidentialité ou dans la fiche du store.

1. **La voix, réseau coupé.** `selectVoice()` privilégie une voix `localService`,
   mais dans une WebView Android la liste des voix est souvent vide au démarrage
   et cet indicateur n'a pas la même signification que sur un poste. Toute la
   promesse « le texte ne quitte pas l'appareil » repose sur ce test.
2. **Les liens externes** (politique de confidentialité, ARASAAC) doivent ouvrir
   le navigateur du système. S'ils s'ouvrent dans la WebView, l'enfant s'y
   retrouve enfermé sans barre d'adresse ni retour — et Google Play Families
   exige que la politique reste atteignable.
3. **Le sélecteur de photo** pour un pictogramme personnalisé.
4. **Le mode bord-à-bord** : vérifier que la barre violette ne passe ni sous la
   barre d'état ni sous la barre de navigation, en portrait comme en paysage.
5. **La largeur réelle d'un téléphone.** Les captures de la fiche sont rendues à
   500 px CSS, plancher imposé par Chrome headless ; un téléphone courant fait
   360 à 430 px et affichera une colonne de moins.
6. **La persistance des données** après fermeture complète de l'application,
   puis après une mise à jour par-dessus (`assembleDebug` deux fois de suite).
