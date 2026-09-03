# Politique de confidentialité — PictoLanguage

**Version 1.0 — en vigueur au 3 septembre 2026**

PictoLanguage est une application de communication par pictogrammes destinée aux
enfants, notamment aux enfants avec un trouble du spectre de l'autisme.

Elle a été conçue selon un principe simple : **les données de votre enfant
restent sur votre appareil.** Il n'y a ni compte à créer, ni serveur qui nous
appartienne, ni publicité, ni mesure d'audience.

Ce document décrit précisément ce que l'application fait — et ne fait pas — de
vos informations.

---

## 1. Qui est responsable de cette application

- **Éditeur :** Benoit Lacroix, personne physique
- **Contact :** [lacroixbenoit78@yahoo.fr](mailto:lacroixbenoit78@yahoo.fr)

L'application est éditée par un particulier, sans structure professionnelle :
il n'existe donc pas d'adresse professionnelle à mentionner. Pour toute question
relative à cette politique, ou pour exercer les droits décrits au point 6,
écrivez à l'adresse de courrier électronique ci-dessus.

---

## 2. Les informations enregistrées sur votre appareil

L'application enregistre les éléments suivants dans l'espace de stockage local
du navigateur ou de l'application (`localStorage`), sur votre appareil
uniquement :

| Information | Détail | Origine |
| --- | --- | --- |
| Profils | Le prénom ou surnom que vous saisissez, et un avatar choisi parmi des émojis. 6 profils au maximum. | Saisi par vous |
| Pictogrammes personnalisés | L'image, le mot associé et la catégorie. L'image peut venir de vos photos ou de la banque ARASAAC. | Ajouté par vous |
| Favoris et pictogrammes masqués | Les choix d'affichage propres à chaque profil. | Défini par vous |
| Ordre des catégories | L'organisation de la grille. | Défini par vous |
| Historique | Les **20 dernières phrases** composées, pour pouvoir les rejouer. Au-delà, les plus anciennes sont effacées automatiquement. | Généré par l'usage |
| Réglages | Taille des pictogrammes, vitesse et volume de la voix, affichage de la barre de mots rapides. | Défini par vous |

**Ces informations ne sont jamais transmises à l'éditeur, ni à qui que ce soit.**
Elles ne quittent l'appareil que si vous utilisez vous-même la fonction
« Exporter mes données », qui produit un fichier dont vous gardez entièrement le
contrôle.

Nous n'avons aucun moyen technique de consulter ces données : elles ne
transitent par aucun serveur nous appartenant, pour la simple raison que
l'application n'en possède aucun.

---

## 3. Les connexions à Internet effectuées par l'application

L'application fonctionne hors ligne. Les pictogrammes du vocabulaire de base
sont intégrés à l'application et ne nécessitent aucune connexion.

Trois situations font néanmoins intervenir un tiers.

### 3.1 Recherche de pictogrammes dans la banque ARASAAC

**Quand :** uniquement lorsqu'un adulte lance une recherche depuis
Paramètres → Ajouter.

**Ce qui est transmis :** le mot recherché, ainsi que les informations
techniques que tout navigateur transmet lors d'une requête (adresse IP, type
d'appareil et de navigateur).

**À qui :** aux serveurs `api.arasaac.org` et `static.arasaac.org`, exploités
par ARASAAC (Centre aragonais de la communication améliorée et alternative),
service du **Gouvernement d'Aragon, en Espagne** — donc au sein de l'Union
européenne. Aucun transfert hors de l'UE n'a lieu de notre fait.

**Pourquoi :** c'est indispensable pour vous proposer des pictogrammes que
l'application n'embarque pas.

**À noter :** le mot recherché est saisi par l'adulte qui configure
l'application. Aucune information relative à l'enfant n'accompagne cette
requête.

### 3.2 Téléchargement de l'image d'un pictogramme

**Quand :** lorsque vous ajoutez un pictogramme trouvé par la recherche, ou dans
le cas rare où une image du vocabulaire de base manquerait localement.

**Ce qui est transmis :** l'identifiant numérique du pictogramme et les mêmes
informations techniques de requête. L'image est ensuite **enregistrée sur votre
appareil**, afin de rester disponible hors connexion.

### 3.3 Lecture à voix haute

La lecture des phrases utilise la synthèse vocale **de votre appareil**
(fonction standard du système d'exploitation ou du navigateur). L'application ne
dispose d'aucune voix qui lui soit propre et ne transmet le texte à aucun
serveur qui lui appartienne — elle n'en possède aucun.

**L'application choisit systématiquement une voix installée sur l'appareil**
lorsqu'il en existe une en français. Dans ce cas — le plus courant — la phrase
n'est transmise à personne et la lecture fonctionne sans connexion.

**Cas résiduel :** si aucune voix française n'est installée localement, le
système peut ne proposer qu'une voix dite « en ligne », traitée sur les serveurs
de son éditeur (Google, Apple, Microsoft…). La phrase composée est alors
transmise à cet éditeur, selon **sa** politique de confidentialité. Nous
préférons le mentionner plutôt que de l'ignorer, même si la situation est rare.

Pour vous en prémunir avec certitude, installez une voix française hors ligne
depuis les réglages d'accessibilité ou de synthèse vocale de votre appareil.

---

## 4. Ce que l'application ne fait pas

Nous jugeons utile de l'énoncer explicitement :

- **Aucun compte** : ni inscription, ni identifiant, ni mot de passe.
- **Aucune publicité** et aucun identifiant publicitaire.
- **Aucune mesure d'audience**, aucune statistique d'usage, aucun outil
  d'analyse comportementale.
- **Aucun rapport de plantage** transmis automatiquement.
- **Aucun cookie** ni traceur d'aucune sorte.
- **Aucun kit de développement tiers** (SDK) intégré à l'application.
- **Aucun accès** à la localisation, aux contacts, au microphone, au calendrier
  ou aux messages.
- **Aucune vente, location ou partage** de données à des tiers — il n'y a
  d'ailleurs rien à partager.

### Photographies

Lorsque vous ajoutez un pictogramme personnalisé, l'application vous laisse
choisir une image dans votre appareil, ou en prendre une avec l'appareil photo
si votre système le propose. **L'image choisie est redimensionnée puis
enregistrée localement. Elle n'est jamais envoyée nulle part.** L'application
n'accède à aucune autre photographie que celle que vous sélectionnez.

---

## 5. Enfants

Cette application s'adresse à des enfants, et cela guide sa conception.

- **Aucune donnée personnelle d'enfant n'est collectée** par l'éditeur, puisque
  aucune donnée ne lui est transmise.
- Le prénom saisi pour un profil reste sur l'appareil et peut être un surnom :
  rien n'oblige à utiliser le prénom réel de l'enfant, et nous vous invitons à
  ne pas le faire si vous préférez.
- L'application ne contient **ni publicité, ni achat intégré, ni lien
  commercial, ni contenu généré par d'autres utilisateurs**.
- Elle ne comporte aucune fonction sociale : pas de messagerie, pas de partage,
  pas de mise en relation.
- Les seuls liens externes (vers `arasaac.org` et vers le texte de la licence
  Creative Commons) figurent dans l'écran des Paramètres, destiné aux adultes.

---

## 6. Base légale et vos droits (RGPD)

### Base légale

L'éditeur ne réalise **aucun traitement de données à caractère personnel** au
sens du Règlement général sur la protection des données : les informations
restent sous votre seul contrôle, sur votre appareil, et ne lui parviennent
jamais.

Les requêtes vers ARASAAC décrites au point 3 sont nécessaires à l'exécution
d'une fonctionnalité que vous déclenchez vous-même. Elles relèvent de la
politique de confidentialité d'ARASAAC, consultable sur
[arasaac.org](https://arasaac.org).

### Vos droits

Les données étant stockées sur votre appareil, vous les exercez directement,
sans avoir à nous solliciter :

| Droit | Comment l'exercer |
| --- | --- |
| **Accès** | Paramètres → Sauvegarde → « Exporter mes données » : vous obtenez l'intégralité des données dans un fichier lisible. |
| **Portabilité** | Le même export, au format JSON standard, réimportable sur un autre appareil. |
| **Rectification** | Modifiez directement les profils, mots et réglages dans l'application. |
| **Effacement** | Supprimez un profil dans l'application, ou désinstallez-la : tout est effacé. Vider les données du site dans votre navigateur produit le même effet. |
| **Opposition / limitation** | Sans objet : aucun traitement n'est effectué par l'éditeur. |

Aucune demande ne peut nous être adressée pour obtenir vos données, pour la
raison que nous ne les détenons pas et n'avons aucun moyen d'y accéder.

---

## 7. Durée de conservation

Les données restent sur votre appareil **aussi longtemps que vous le
souhaitez**. Aucune expiration automatique n'est prévue, à l'exception de
l'historique, limité aux 20 dernières phrases.

Elles disparaissent définitivement lorsque vous supprimez le profil,
désinstallez l'application ou effacez les données du site dans votre navigateur.

**Nous vous recommandons d'exporter régulièrement vos données** (Paramètres →
Sauvegarde) : le vocabulaire personnalisé d'un enfant représente parfois des
mois de travail, et rien ne le sauvegarde ailleurs.

---

## 8. Sécurité

Les données ne circulant pas sur le réseau, elles ne sont exposées à aucune
interception ni à aucune fuite depuis un serveur.

En contrepartie, elles sont accessibles à toute personne ayant accès à
l'appareil déverrouillé. Nous vous recommandons de protéger celui-ci par un code
ou une empreinte, et de conserver vos fichiers de sauvegarde exportés dans un
endroit sûr, puisqu'ils contiennent l'ensemble des profils.

---

## 9. Modifications de cette politique

Toute évolution de cette politique sera publiée à cette adresse, accompagnée
d'une nouvelle date d'entrée en vigueur. Si une modification devait concerner la
nature des données traitées, elle serait signalée dans l'application.

**Historique :**

- Version 1.0 — 3 septembre 2026 — version initiale.

---

## 10. Attribution

Les pictogrammes proviennent d'[ARASAAC](https://arasaac.org) (auteur : Sergio
Palao, propriété du Gouvernement d'Aragon), sous licence
[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.fr).
Voir le fichier `NOTICE.md`.
