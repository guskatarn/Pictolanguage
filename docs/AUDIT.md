# Audit PictoLanguage — état actuel et écarts avant publication Play Store

*Réalisé le 2026-09-02 par Claude, à partir du code source lu sur F:\pictoLanguage (PC "arzac" de Benoît). Mis à jour au fil de l'avancement.*

## 1. Ce qui existe déjà

Application web (PWA) "PictoApp" — React 18 + TypeScript + Vite + Tailwind CSS 4, packagée en PWA via `vite-plugin-pwa`. Aucun backend : toutes les données (profils, historique, pictogrammes personnalisés, réglages) sont stockées en `localStorage`.

Fonctionnalités présentes :
- Gestion multi-profils (jusqu'à 6), stockage local.
- Grille de pictogrammes organisée en 7 catégories (besoins, émotions, aliments, actions, lieux, personnes, objets), 35 pictogrammes par défaut issus d'ARASAAC (chargés en ligne via `static.arasaac.org`).
- Barre de phrase : on tape des pictogrammes pour composer une phrase, puis synthèse vocale française (Web Speech API).
- Historique des phrases prononcées, avec rejeu.
- Panneau réglages : taille des pictogrammes (S/M/L), vitesse/volume de la voix, réordonnancement des catégories, ajout de pictogrammes personnalisés (recherche ARASAAC ou upload d'image), suppression.
- Manifest PWA + service worker (mise en cache offline des images ARASAAC via Workbox), bandeau d'installation ("beforeinstallprompt").
- **[Ajouté le 2026-09-02]** Barre de vocabulaire "core" toujours visible (10 mots fréquents : moi, vouloir, aide, encore, stop, oui, non, aimer, donner, fini), activable/désactivable dans Réglages → Affichage. Voir `src/data/coreVocabulary.ts` et `src/components/CoreVocabularyBar.tsx`.

Une fonctionnalité encore à moitié câblée :
- `toggleFavorite` existe dans le hook `useProfiles` mais n'est utilisé nulle part dans l'interface (pas d'onglet "favoris"). (`toggleHidePictogram` a été laissé en l'état avec un commentaire explicite, non retiré ni branché — décision à prendre.)

## 2. Ce qui manque pour publier sur le Google Play Store

### A. Empaquetage natif — le plus gros chantier

Il n'existe aujourd'hui **aucun** projet Android, Capacitor, Cordova ou configuration TWA/Bubblewrap dans le dépôt. Le Play Store n'accepte pas un site web tel quel : il faut un `.aab` (Android App Bundle). Deux options réalistes, vu que l'app est déjà une PWA fonctionnelle :

- **TWA (Trusted Web Activity)** via Bubblewrap/PWABuilder : wrapper très léger (~800 Ko) qui affiche le site dans Chrome sans barre d'adresse. Exige un score Lighthouse PWA complet, un manifest et service worker valides (déjà en place), un hébergement HTTPS sur un domaine à soi, et un fichier `/.well-known/assetlinks.json` pour prouver la propriété du domaine à Google.
- **Capacitor** : wrapper plus lourd (~4 Mo, WebView embarquée), mais ne dépend pas d'une URL en ligne au runtime — le contenu peut être bundlé dans l'app. Donne accès à des plugins natifs (fichiers, notifications, etc.) et permet de fonctionner réellement hors-ligne dès l'installation, ce qui compte beaucoup pour un usage quotidien par un enfant sans dépendre du réseau.

Étant donné le public cible (communication assistée, besoin de fiabilité totale), **Capacitor est probablement le choix le plus sûr**, notamment parce qu'il permet d'embarquer les images de pictogrammes localement plutôt que de dépendre d'un chargement réseau au premier lancement.

> **[Précisé le 2026-09-03]** Argument supplémentaire, décisif : le TWA fait de l'hébergement d'un domaine propre (+ `assetlinks.json`) un **prérequis bloquant** de la publication store. Capacitor découple complètement la sortie Play Store de l'hébergement web, qui redevient optionnel (§2.B).

### B. Hébergement public

Le projet n'est déployé nulle part (juste un `dist/` local). Même avec Capacitor, avoir une version web hébergée (Vercel/Netlify/autre) reste utile pour tester, itérer, et pour une éventuelle version "PC" accessible par navigateur.

### C. Version tablette / PC

- Le manifest verrouille `orientation: 'portrait'` et le viewport a `user-scalable=no` — pensé mobile uniquement. Pour tablette/PC, il faut revoir la mise en page (grille, barre de phrase, largeur des colonnes) pour le paysage et les grands écrans, et probablement lever le verrou d'orientation.
- Pour "PC", deux interprétations possibles : (1) la PWA installable dans Chrome/Edge suffit (déjà quasi acquis techniquement, mais pas testé/adapté en layout large écran) ; (2) un vrai packaging Windows (ex. via Electron ou MSIX pour le Microsoft Store) si l'objectif est une app de bureau distincte. À clarifier selon l'ambition.

### D. Conformité Google Play — critique car app destinée à des enfants

L'app entre dans le programme **Google Play Families** (contenu destiné aux enfants). Points obligatoires identifiés :

- **Politique de confidentialité** obligatoire et exacte sur les données collectées (même minimales ici : requêtes vers l'API ARASAAC, stockage local).
- **Formulaire "Sécurité des données"** (Data safety) dans la Play Console, à remplir précisément.
- Si des publicités sont un jour envisagées : uniquement des SDK publicitaires "auto-certifiés Families", aucune publicité comportementale/ciblée envers les enfants, aucun identifiant appareil (AAID, IMEI) transmis.
- Pas de géolocalisation précise pour une app ciblant exclusivement des enfants.
- Conformité RGPD (et COPPA si diffusion hors UE) sur le traitement des données d'enfants.
- Déclaration précise de la tranche d'âge cible dans la Play Console.

### E. Licence des pictogrammes ARASAAC

ARASAAC est distribué sous licence **CC BY-NC-SA** (usage non commercial, attribution obligatoire, partage dans les mêmes conditions). L'app actuelle n'affiche aucune attribution ARASAAC visible. À vérifier avant publication : mention obligatoire de la source, et incompatibilité totale avec une monétisation (app payante, IAP, pub) tant que ces pictogrammes sont utilisés.

> **[Précisé le 2026-09-03]** Embarquer les images dans l'`.aab` (option Capacitor, §2.A) constitue une **redistribution** des œuvres. C'est autorisé par CC BY-NC-SA, mais cela fait passer l'attribution visible du statut de bonne pratique à celui d'obligation juridique stricte. À traiter dans le même lot que l'embarquement des images.

> ✅ **[Traité le 2026-09-03]** Les images étant désormais embarquées (§2.F.1), l'attribution est devenue obligatoire et a été ajoutée : mention permanente en pied du panneau Paramètres (auteur Sergio Palao, origine ARASAAC, Gouvernement d'Aragon, licence CC BY-NC-SA 4.0, liens cliquables) et fichier `NOTICE.md` à la racine du dépôt. **Reste à faire :** reprendre la même mention sur la fiche Play Store et sur l'éventuel site web.

### F. Fiabilité technique pour un usage quotidien

- Aucune sauvegarde/export des données : tout est en `localStorage`. Si l'app est désinstallée, ou le cache navigateur vidé, les profils, l'historique et les pictogrammes personnalisés sont perdus définitivement. Pas d'export/import, pas de compte, pas de synchronisation multi-appareil.
- Chargement des pictogrammes dépendant du réseau au premier affichage (le service worker ne met en cache qu'après un premier chargement réussi) — risque de grilles vides/images cassées en cas de coupure réseau lors d'un usage critique.
- Aucun test automatisé dans le projet (pas de framework de test configuré, aucun fichier `*.test.*`).
- Pas de gestion d'erreurs globale (error boundary React), pas de suivi de plantages.

> **[Ajouté le 2026-09-03 — deux constats aggravants]**
>
> ✅ **F.1 — RÉSOLU le 2026-09-03.** Les 42 pictogrammes du vocabulaire par défaut (35 catégories + 10 core, dont 3 communs) sont désormais **embarqués dans le dépôt** (`public/pictograms/<id>.png`, 864 Ko) et précachés par le service worker au moment de l'installation (52 entrées / 986 Kio dans le manifeste de précache). Ils ne dépendent plus du réseau ni de l'expiration du `runtimeCaching`. Constat d'origine conservé ci-dessous pour mémoire.
>
> **[Constat initial] Le cache d'images expire au bout de 30 jours.** `vite.config.ts` configure le `runtimeCaching` ARASAAC avec `maxAgeSeconds: 60 * 60 * 24 * 30` et `maxEntries: 500`. Workbox purge donc les images passé un mois. Une tablette utilisée hors ligne au quotidien voit sa grille se vider progressivement, **même si tout avait été correctement chargé au départ**. Le risque n'est pas seulement "au premier affichage" : il est récurrent. C'est l'argument décisif pour embarquer les images localement plutôt que d'ajuster les paramètres du cache.
>
> **F.2 — Perte de données silencieuse au dépassement de quota.** Les pictogrammes personnalisés sont stockés en data-URL base64 dans `localStorage` (`SettingsPanel.tsx`, `handleFileUpload`), or `localStorage` est plafonné à ~5 Mo et `saveData()` (`hooks/useProfiles.ts`) avale l'exception `QuotaExceededError` sans rien signaler. Un parent qui ajoute une dizaine de photos dépasse le quota : l'interface continue d'afficher les pictogrammes (présents en mémoire React) mais **plus rien n'est persisté et aucun message n'apparaît**. Tout est perdu au rechargement suivant — y compris les données antérieures valides, puisque chaque écriture réécrit l'objet complet. À traiter en priorité haute, au même titre que l'export/import : redimensionner/compresser les images à l'upload, détecter le quota, et prévenir l'utilisateur.
>
> **[Précisé le 2026-09-03]** Ce point reste entier, et il englobe un cas voisin non traité par l'embarquement des images : un pictogramme personnalisé **ajouté depuis la recherche ARASAAC** stocke l'URL distante dans `localStorage`, donc reste indisponible hors ligne. Le corriger (télécharger l'image à l'ajout) aggraverait mécaniquement le problème de quota — les deux sujets doivent donc être traités dans le même lot.

### G. Accessibilité spécifique au public visé

- Pas de mode "balayage"/accès par contacteur (switch access), fonctionnalité courante et souvent essentielle dans les apps de CAA (communication alternative et améliorée) pour enfants avec troubles moteurs associés.
- Contrastes, tailles de cible tactile et compatibilité lecteur d'écran à valider formellement (idéalement avec un ergothérapeute/orthophoniste).
- App entièrement figée en français (langue, voix) — à assumer ou à internationaliser selon l'ambition de diffusion.

### H. Finitions produit et store listing

- Les icônes actuelles (`icon-192.png`, `icon-512.png`) sont générées par un script maison (`generate-icons.mjs`) : un simple cercle violet uni, pas une identité visuelle travaillée. Il manque aussi un favicon réel (référencé dans la config PWA mais absent du dossier `public`).
- Aucun visuel de fiche store : icône haute résolution, image "feature graphic" (1024×500), captures d'écran (téléphone + tablette obligatoires si l'app cible les deux), description longue/courte.
- Compte développeur Google Play à créer (frais unique), questionnaire de classification de contenu, ciblage d'audience, liste des pays de diffusion.
- Pas de stratégie de version (numéro de version, changelog) ni de signature d'app configurée.

> **[Précisé le 2026-09-03]** Le `favicon.ico` manquant n'a **aucun impact à l'exécution** : il n'apparaît que dans `includeAssets` du plugin PWA (qui ignore silencieusement les fichiers absents), tandis que `index.html` référence bien `/icon-192.png`, présent. C'est une ligne de configuration à nettoyer, pas un écart bloquant pour le store. ✅ **Nettoyée le 2026-09-03** (`favicon.ico` retiré d'`includeAssets`).

## 3. Chemin de mise en production suggéré (ordre de priorité)

1. Décider de l'approche d'empaquetage (Capacitor recommandé pour la fiabilité offline) et faire fonctionner un premier build Android installable.
2. Traiter le sujet critique : rendre l'app fiable hors-ligne (~~embarquer les pictogrammes localement plutôt que de dépendre d'ARASAAC en ligne à chaque usage~~ ✅ **fait le 2026-09-03**), et ajouter un export/import des profils pour ne pas perdre les données **+ corriger la perte silencieuse au dépassement de quota (§2.F.2)** — prochain lot.
3. Finir la fonctionnalité "favoris" à moitié câblée, ou la retirer proprement.
4. Rédiger la politique de confidentialité, remplir le formulaire Data safety, vérifier l'attribution ARASAAC et la compatibilité de licence avec le modèle de diffusion choisi (gratuit sans pub obligatoire tant qu'ARASAAC est utilisé).
5. Adapter la mise en page pour tablette/PC (grille, orientation) et tester sur plusieurs formats d'écran.
6. Travailler l'identité visuelle (vraies icônes, feature graphic, captures d'écran) et rédiger la fiche store.
7. Créer le compte développeur Google Play, remplir le questionnaire de classification, cibler l'audience "enfants"/"familles", publier en test fermé avant la diffusion publique.

### Sources consultées (audit technique/store)

- [Google Play Families Policies](https://support.google.com/googleplay/android-developer/answer/9893335?hl=en)
- [TWA vs Capacitor: Which Android Wrapper Wins in 2026?](https://saastostore.com/blog/twa-vs-capacitor)

## 4. Fonctionnalités utiles manquantes par rapport aux applications CAA existantes

Comparaison avec les applications de référence en communication alternative et améliorée (CAA) par pictogrammes : Proloquo2Go (AssistiveWare, référence pro internationale), LetMeTalk (gratuite, grand public), Visual Voice (concurrent direct, francophone, spécialisé autisme), et la grille de critères utilisée par les orthophonistes francophones (comparatif CAAPABLES). Classé par priorité.

### Priorité haute — fonctionnalités "cœur de métier CAA" largement établies comme standards

- ✅ **[Implémenté le 2026-09-02] Vocabulaire "core" toujours accessible.** Rangée de mots fonctionnels fréquents (moi, veux, encore, stop, aide, oui, non, aimer, donner, fini), indépendante de la catégorie affichée, pour construire des phrases spontanées. Activable/désactivable dans les réglages.
- **Codage couleur grammatical (clé de Fitzgerald).** Le standard professionnel colore les pictogrammes par fonction grammaticale (jaune = pronoms, vert = verbes, bleu = adjectifs, orange = noms...) plutôt que par thème, pour aider à construire une syntaxe correcte. PictoLanguage colore par catégorie thématique (couleur = "besoins", "émotions"...), pas par grammaire — c'est un choix différent du standard CAA, à assumer consciemment ou à faire évoluer.
- **Position fixe des pictogrammes (planification motrice).** Principe CAA bien documenté : un pictogramme donné doit toujours occuper la même position pour créer un automatisme moteur chez l'enfant. La grille actuelle (`grid-template-columns: repeat(auto-fill, ...)`) recalcule dynamiquement les positions selon le nombre d'éléments visibles — la position d'un picto peut bouger d'une session à l'autre.
- **Recherche de mots dans l'appli principale.** Le comparatif professionnel CAAPABLES cite la capacité de recherche comme critère de sélection. PictoLanguage n'a une recherche ARASAAC que dans les réglages pour ajouter un picto personnalisé, pas de barre de recherche pour retrouver rapidement un mot existant pendant la composition d'une phrase.
- **Verrouillage des réglages (code parental).** Les réglages sont accessibles en un tap sans protection : un enfant peut supprimer des pictogrammes ou changer les réglages par erreur. Un code PIN pour entrer en mode "édition/réglages" est une fonctionnalité standard des apps CAA pour enfants.

### Priorité moyenne — différenciants forts, largement présents chez la concurrence

- **Enregistrement d'une voix personnalisée.** Beaucoup d'apps CAA permettent d'enregistrer une vraie voix (celle d'un parent) pour certains mots (prénoms, mots affectifs) — plus motivant et naturel qu'une synthèse vocale pure. Non présent ici (uniquement Web Speech API).
- **Choix de la voix (enfant/adulte, plusieurs voix).** Proloquo2Go propose des dizaines de voix, dont des voix "enfant". PictoLanguage sélectionne automatiquement la première voix française disponible sans laisser le choix à l'utilisateur.
- **Export / import / partage du vocabulaire entre appareils.** Les familles utilisent souvent l'app à la fois à la maison et à l'école ; les outils pro permettent d'exporter/partager une configuration de tableau. PictoLanguage n'a aucun export : tout est enfermé dans le `localStorage` d'un seul navigateur/appareil (déjà noté comme risque technique en partie 2.F, mais c'est aussi un manque fonctionnel face à la concurrence).
- **Tableaux de routine visuelle ("premier / ensuite", emploi du temps).** Très présent dans l'écosystème d'outils pour enfants avec TSA (souvent en complément de la CAA pure) : une frise "d'abord ça, puis ça" ou un planning visuel de la journée. Absent de PictoLanguage, qui ne fait que de la communication phrase par phrase.
- **Accès alternatif (balayage, eye-tracking).** Déjà identifié côté accessibilité/conformité (partie 2.G) — c'est aussi un vrai différenciateur produit chez les apps pro (Proloquo2Go le propose nativement).

### Priorité basse — raffinements avancés, utiles mais non bloquants

- **Prédiction de mots / clavier.** Pour les enfants dont la littératie progresse, un mode clavier avec autocomplétion (comme Proloquo2Go) permet une transition douce du pictogramme vers l'écrit. Fonctionnalité avancée, pertinente seulement si le profil d'enfants visés évolue vers ce niveau.
- **Modulation de la voix / mode "aparté".** Fonctionnalité de nuance présente dans certains outils pro (chuchoter à crier, message dit "à part") — raffinement, pas prioritaire.
- **Rapports d'usage pour les professionnels.** Des statistiques de mots utilisés/fréquence, exportables pour un orthophoniste suivant l'enfant, sont valorisées par les pros mais représentent un développement conséquent (nécessite de repenser le stockage des données).

### Sources consultées (comparatif fonctionnel)

- [Comparatif d'applications CAA à base de pictogrammes — CAAPABLES (grille de critères orthophonistes)](https://caapables.fr/wp-content/uploads/2021/07/APPLIS-CAA-comparatif-CAAPABLES.pages.pdf)
- [Outils — Caapables](https://caapables.fr/outils/)
- [Proloquo2Go — AssistiveWare](https://www.assistiveware.com/products/proloquo2go)
- [Visual Voice — application CAA francophone](https://visualvoice.app/)

## 5. Journal d'implémentation

- **2026-09-02** — Barre de vocabulaire "core" toujours visible : nouveaux fichiers `src/data/coreVocabulary.ts` et `src/components/CoreVocabularyBar.tsx`, branchement dans `App.tsx`, réglage `showCoreBar` (avec migration des profils existants) dans `types/index.ts` et `hooks/useProfiles.ts`, toggle dans `SettingsPanel.tsx`. Vérifié par build TypeScript, ESLint, `npm run build`, et test visuel Playwright (affichage + bascule du réglage). Corrigé au passage deux erreurs de lint préexistantes (blocs `catch` vides, variable non utilisée) sans rapport avec la fonctionnalité.
- **2026-09-03** — **Pictogrammes par défaut embarqués localement (feuille de route, étape 2, première moitié).** Nouveau script `scripts/fetch-pictograms.mjs` (`npm run pictograms`) : il extrait les ids de `defaultPictograms.ts` et `coreVocabulary.ts`, télécharge les PNG 500 px depuis ARASAAC dans `public/pictograms/`, et génère `src/data/bundledPictograms.ts` (liste des ids réellement disponibles). `getArasaacImageUrl()` sert désormais l'image locale pour un id embarqué et ne retombe sur `static.arasaac.org` que pour les autres (résultats de recherche). Nouveau hook `usePictogramImage` : repli en cascade image locale → URL distante → placeholder, branché dans `PictogramCard`, `CoreVocabularyBar` et `SentenceBar` (qui construisait son URL ARASAAC en dur). Attribution ARASAAC ajoutée en pied du panneau Paramètres + `NOTICE.md`. `favicon.ico` retiré d'`includeAssets`. Vérifié par `tsc -b`, `vite build` (précache : 52 entrées / 986 Kio), `eslint`, et test HTTP sur `vite preview` (image servie en local en 200, présente dans le manifeste de précache de `sw.js`).
- **2026-09-03** — Mise sous contrôle de version du projet (`git init` + premier commit de l'état existant) et versionnement du présent audit dans `docs/AUDIT.md`. Relecture complète de l'audit contre le code source : toutes les constatations techniques confirmées, quatre précisions ajoutées (§2.A, §2.E, §2.F avec deux constats aggravants, §2.H). Aucune modification du code applicatif.

## 6. Idées pour se démarquer (au-delà du simple rattrapage des concurrents)

Au-delà de combler les manques identifiés en partie 4 (qui alignent PictoLanguage sur l'existant), voici des pistes pour proposer quelque chose que les apps CAA établies n'offrent pas — ou offrent mal — sur le marché francophone gratuit. Classées par potentiel de différenciation.

### La plus forte : génération de tableaux de pictogrammes par photo (IA)

Prendre une photo d'un contexte précis (la cuisine, la cour de récré, un jouet particulier, le sac de piscine) et obtenir instantanément une sélection de pictogrammes pertinents pour cette situation, au lieu de devoir chercher manuellement mot par mot. Ce n'est pas une idée en l'air : une équipe de recherche (CHI 2024 / MDPI 2024) a publié **QuickPic AAC**, qui fait exactement ça avec un LLM, avec des résultats validés par des orthophonistes (58 % du vocabulaire généré jugé pertinent et retenu). Mais l'application elle-même n'a quasiment aucune diffusion réelle (quelques installations sur le Play Store), n'est pas en français, et n'est pas intégrée à ARASAAC. C'est donc une fonctionnalité prouvée scientifiquement utile, mais un terrain quasiment vierge sur le marché francophone gratuit — et techniquement réalisable aujourd'hui pour un développeur seul, via l'API d'un modèle multimodal couplée à la recherche ARASAAC déjà en place dans l'app.

### Assumer et mettre en avant la confidentialité comme argument central

Beaucoup d'apps CAA concurrentes demandent un compte, proposent des abonnements premium, ou intègrent des SDK tiers. PictoLanguage, du fait même de la licence ARASAAC (non commerciale), est déjà 100 % gratuite, sans compte, sans publicité, sans collecte de données — tout reste sur l'appareil. C'est un vrai argument de confiance pour des parents d'enfants vulnérables, à condition de le rendre visible et explicite (dans la fiche Play Store, dans l'app elle-même) plutôt que de le laisser comme un simple effet de bord technique.

### Un carnet de progrès familial, pas clinique

Les outils pro produisent des rapports d'usage pensés pour les orthophonistes (statistiques de mots, fréquences). Une piste différente et complémentaire, davantage tournée vers les parents : un "mur de fiertés" simple — les petites victoires du quotidien (premier mot dit à la cantine, une nouvelle phrase inventée), sous forme de moments à revoir plutôt que de tableaux de données. C'est l'axe que la littérature récente sur le suivi CAA met justement en avant : les preuves de progrès les plus parlantes ne sont pas dans les grilles de comptage.

### Partage communautaire de tableaux entre familles francophones

La communauté CAA francophone (ISAAC France, HappyCap) partage déjà activement des tableaux de communication imprimables par thème (piscine, anniversaire, rentrée des classes...), mais rien d'équivalent n'existe sous forme de tableaux importables directement dans une application. Une bibliothèque communautaire, alimentée petit à petit (par vous, puis par des familles volontaires), à importer en un tap, comblerait un vrai manque plutôt qu'une simple hypothèse.

### Continuité maison/école sans compte lourd

Le point de friction identifié en partie 4 (pas de synchronisation multi-appareil) peut devenir un différenciateur plutôt qu'un simple correctif, si la solution reste cohérente avec le positionnement "confidentialité d'abord" : un transfert simple entre deux appareils précis (code/QR à usage unique, sans compte ni cloud permanent) plutôt qu'un système de comptes complet — pour garder le même tableau entre la tablette de l'école et celle de la maison.

### Accessible sur du matériel modeste

Étant une PWA légère plutôt qu'une app native lourde, PictoLanguage peut fonctionner sur des tablettes Android d'occasion ou bas de gamme là où certaines apps concurrentes deviennent lentes. C'est un angle rarement mis en avant par la concurrence, pertinent pour des familles pour qui le budget est une vraie contrainte.

*Note : plusieurs de ces choix (codage couleur, position des pictogrammes, structure du vocabulaire core) gagneraient à être validés avec un orthophoniste ou un ergothérapeute avant d'être figés — Claude n'a pas de compétence clinique et ces recommandations s'appuient sur de la documentation professionnelle, pas sur une évaluation clinique du produit.*

### Sources consultées (idées de différenciation)

- [Co-Designing QuickPic: Automated Topic-Specific Communication Boards from Photographs for AAC-Based Language Instruction (CHI 2024)](https://dl.acm.org/doi/10.1145/3613904.3642080)
- [QuickPic AAC: An AI-Based Application to Enable Just-in-Time Generation of Topic-Specific Displays (MDPI, 2024)](https://www.mdpi.com/1660-4601/21/9/1150)
- [QuickPic AAC — Google Play](https://play.google.com/store/apps/details?id=com.quickpic&hl=en)
- [A Smarter Way to Track AAC Progress Without Extra Paperwork](https://blog.aac-plus.com/a-smarter-way-to-track-aac-progress-without-extra-paperwork/)
- [ISAAC FR — Tableaux de communication à thème et en pictogrammes](https://isaac-fr.org/tableau-de-communication-a-theme-et-en-pictogrammesdes-solutions-gratuites-pour-se-lancer/)
- [HappyCap Foundation — Tableaux de communication CAA](https://happycap-foundation.fr/telechargements/tableaux-communication)
