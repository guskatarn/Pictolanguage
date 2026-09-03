# Conformité Google Play — notes de préparation

Document de travail **interne**, à ne pas publier. Il consigne les réponses
préparées pour la fiche Play Store, avec le raisonnement qui les justifie, afin
qu'une relecture ultérieure n'ait pas à refaire l'inventaire technique.

Source de vérité du comportement de l'application :
[`POLITIQUE-DE-CONFIDENTIALITE.md`](POLITIQUE-DE-CONFIDENTIALITE.md).

> **Ces réponses ne constituent pas un avis juridique.** Deux points, signalés
> ci-dessous, relèvent d'une appréciation et méritent une vérification avant
> soumission — une déclaration inexacte au formulaire *Data safety* est un motif
> de retrait de l'application.

---

## 1. Inventaire technique (vérifié dans le code le 2026-09-03)

| Sortie réseau | Déclenchement | Destinataire | Contenu |
| --- | --- | --- | --- |
| `api.arasaac.org/v1/pictograms/fr/search/…` | Recherche lancée par un adulte dans Paramètres → Ajouter | ARASAAC (Gouvernement d'Aragon, Espagne — UE) | Mot recherché + données de requête (IP, User-Agent) |
| `static.arasaac.org/pictograms/…` | Ajout d'un pictogramme trouvé, ou image de base manquante | idem | Identifiant du pictogramme + données de requête |
| Synthèse vocale | Lecture à voix haute, **uniquement si aucune voix française locale n'est installée** (voir 2.2) | Éditeur de l'OS/navigateur | Texte de la phrase |

Tout le reste (profils, pictogrammes personnalisés, favoris, masquages,
historique, réglages) demeure dans `localStorage`, sur l'appareil.

**Absents du projet :** SDK tiers, régie publicitaire, mesure d'audience,
rapport de plantage, cookie, police ou script distant, backend.

---

## 2. Formulaire « Sécurité des données » (Data safety)

Rappel de la définition de Google : une donnée est **collectée** dès lors
qu'elle est transmise hors de l'appareil. Une donnée qui ne quitte jamais
l'appareil n'est pas à déclarer.

### Réponses recommandées

| Question | Réponse | Justification |
| --- | --- | --- |
| L'application collecte-t-elle ou partage-t-elle des données utilisateur ? | **Non** — sous réserve du point 2.1 ci-dessous | Rien n'est transmis à l'éditeur ; l'application n'a pas de serveur |
| Les données sont-elles chiffrées en transit ? | **Oui** | Les seuls appels réseau visent ARASAAC en HTTPS |
| Proposez-vous un moyen de demander la suppression des données ? | **Oui** | Suppression du profil dans l'application, ou désinstallation ; export préalable possible |

### Catégories à ne PAS déclarer, et pourquoi

- **Informations personnelles** — le prénom du profil ne quitte pas l'appareil.
- **Photos et vidéos** — l'image d'un pictogramme personnalisé est redimensionnée
  puis stockée localement ; aucun envoi.
- **Fichiers et documents** — l'export produit un fichier remis à l'utilisateur,
  sans transmission.
- **Identifiants d'appareil** — aucun identifiant publicitaire ni technique
  n'est lu ou transmis.
- **Position, contacts, messages, agenda, santé, données financières** — aucun
  accès.
- **Informations et performances de l'application** — aucun rapport de plantage
  n'est envoyé (l'`ErrorBoundary` se contente de la console locale).

### 2.1 Point d'appréciation n° 1 — le mot recherché

Le mot saisi dans la recherche ARASAAC **est transmis hors de l'appareil**, ce
qui correspond littéralement à la définition de la collecte, catégorie
« Activité dans l'application → Historique de recherche dans l'application ».

Deux éléments plaident pour ne pas le déclarer :

1. Google prévoit une exception pour les transmissions résultant d'une **action
   explicite de l'utilisateur**, lorsque celui-ci s'attend raisonnablement à ce
   partage. Rechercher dans une banque de pictogrammes en ligne relève
   typiquement de ce cas.
2. La donnée n'est ni conservée par l'éditeur, ni associée à un utilisateur : il
   n'existe aucun compte ni identifiant.

**À vérifier avant soumission.** En cas de doute, il est plus sûr de déclarer
« Historique de recherche dans l'application », finalité « Fonctionnalité de
l'application », non lié à l'identité de l'utilisateur, non partagé — surdéclarer
n'expose à aucune sanction, l'inverse si.

### 2.2 Point d'appréciation n° 2 — la synthèse vocale

Le texte des phrases peut être transmis à l'éditeur du système d'exploitation
lorsque la voix sélectionnée est une voix en ligne. Ce traitement est le fait de
la plateforme, non de l'application, et échappe au contrôle de celle-ci.

Il n'est en principe pas à déclarer — l'application n'ayant aucune maîtrise du
choix de voix — mais **le point est mentionné dans la politique de
confidentialité**, car les phrases composées par un enfant peuvent être
sensibles, et l'utilisateur doit pouvoir choisir une voix hors ligne en
connaissance de cause.

> ✅ **Corrigé le 2026-09-03.** `selectVoice()` dans `src/hooks/useSpeech.ts`
> privilégie désormais une voix `localService`, et la liste des voix est
> rechargée sur l'évènement `voiceschanged` — sans quoi la toute première phrase
> était prononcée sans voix choisie. Une voix en ligne n'est retenue que si
> aucune voix française n'est installée sur l'appareil.

---

## 3. Programme « Familles » (Designed for Families)

L'application ciblant les enfants, elle relève des règles Families, plus
strictes que le régime général.

| Exigence | État | Reste à faire |
| --- | --- | --- |
| Politique de confidentialité liée depuis **la fiche Play Store** | Texte complet | Activer GitHub Pages, puis reporter l'URL |
| Politique de confidentialité accessible **depuis l'application** | ❌ | Ajouter un accès dans les Paramètres |
| Public cible et âge déclarés | ❌ | À renseigner dans la Play Console |
| Questionnaire de classification du contenu | ❌ | À remplir |
| Aucune publicité, ou publicité conforme Families | ✅ | Aucune publicité — et la licence CC BY-NC-SA d'ARASAAC l'interdit de toute façon |
| Aucun achat intégré | ✅ | Aucun — même contrainte de licence |
| Aucune collecte de données personnelles d'enfant | ✅ | Rien n'est transmis |
| SDK conformes au programme Families | ✅ | Aucun SDK tiers |
| Aucune fonction sociale ni contenu d'autres utilisateurs | ✅ | Application entièrement locale |

### Hébergement de la politique — préparé le 2026-09-03

Le site GitHub Pages est configuré et prêt à être activé. Il ne publie **que**
la politique de confidentialité : `docs/_config.yml` écarte explicitement
`AUDIT.md` et le présent document, qui exposeraient sinon la feuille de route,
l'analyse concurrentielle et ces notes internes.

- `docs/_config.yml` — configuration Jekyll, thème et liste d'exclusion.
- `docs/index.md` — page d'accueil du site, qui inclut la politique par
  `include_relative`. La politique n'existe donc qu'en un seul exemplaire :
  aucune copie à maintenir en parallèle.

> ✅ **La politique est complète depuis le 2026-09-03** : plus aucun marqueur
> `[[À COMPLÉTER]]` (voir §4). Le site peut être activé.

**Activation** (nécessite les droits sur le dépôt, donc à faire par l'éditeur) :

1. Dépôt GitHub → **Settings** → **Pages**.
2. *Source* : « Deploy from a branch ».
3. *Branch* : `main`, dossier `/docs`. **Save**.
4. Attendre la fin du déploiement (onglet Actions), puis vérifier que
   `https://guskatarn.github.io/Pictolanguage/` affiche bien la politique — et
   que `/AUDIT.md` et `/PLAY-CONFORMITE.md` renvoient une erreur 404, preuve que
   l'exclusion fonctionne.
5. Reporter l'URL dans la fiche Play Store **et** dans l'application (exigence
   Families : les deux sont requis).

---

## 4. Identité de l'éditeur — renseignée le 2026-09-03

| Élément | Valeur retenue |
| --- | --- |
| Date d'entrée en vigueur | 3 septembre 2026 (version 1.0) |
| Éditeur | Benoit Lacroix, personne physique |
| Contact | `lacroixbenoit78@yahoo.fr` |
| Adresse postale | Aucune — l'éditeur est un particulier sans structure professionnelle |

**Sur l'absence d'adresse postale.** Le RGPD exige l'identité et des
*coordonnées* du responsable de traitement, sans imposer une adresse postale
lorsqu'un moyen de contact opérationnel est fourni : l'adresse électronique
suffit ici, l'éditeur étant un particulier.

**Point à anticiper, distinct de la politique :** la création d'un compte
développeur Google Play impose une **vérification d'identité comprenant une
adresse**, indépendamment de ce document. Selon que le compte est classé
« professionnel » ou non — un applicatif gratuit et non monétisé peut relever du
second cas — cette adresse est susceptible d'être affichée publiquement sur la
fiche du Play Store. À vérifier au moment de la création du compte, et à
reporter ici le cas échéant pour que les deux sources concordent.

**Sur l'adresse de contact.** Une adresse personnelle publiée sur une page web
est collectée par les robots de courrier indésirable. Une adresse dédiée au
projet resterait préférable ; le remplacement se fait en un seul endroit
(`docs/POLITIQUE-DE-CONFIDENTIALITE.md`, section 1), le site GitHub Pages
n'en conservant aucune copie.
