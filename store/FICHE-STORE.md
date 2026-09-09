# Fiche Google Play — disavecmoi

Textes et visuels à recopier dans la Play Console. Les questions de conformité
(formulaire « Sécurité des données », programme Familles, identité de
l'éditeur) sont traitées à part, dans `docs/PLAY-CONFORMITE.md`.

Ce dossier n'est **pas** publié : le site GitHub Pages ne sert que `docs/`.

---

## 1. Textes

### Nom de l'application — 30 caractères maximum

```
disavecmoi
```

### Description courte — 80 caractères maximum

```
Parler avec des images. Pictogrammes, voix, hors ligne. Gratuit et sans compte.
```

### Description longue — 4 000 caractères maximum

```
disavecmoi aide un enfant qui ne parle pas, ou qui parle peu, à se faire
comprendre en touchant des images.

L'enfant compose une phrase en touchant des pictogrammes, puis appuie sur
« Parler » : l'appareil prononce la phrase à voix haute. C'est le principe de
la communication alternative et améliorée (CAA), utilisée à la maison, à
l'école et en orthophonie.

CONÇUE POUR DES ENFANTS QUI ONT BESOIN DE REPÈRES STABLES

• Grandes images, grandes zones à toucher, contrastes marqués
• Les catégories ne changent jamais de place : l'enfant retrouve un mot au
  même endroit, ce qui l'aide à aller de plus en plus vite
• Une barre de mots fréquents (moi, vouloir, aide, encore, stop, oui, non...)
  reste accessible quelle que soit la catégorie affichée
• Trois tailles d'affichage, et la possibilité de masquer les pictogrammes
  inutiles pour alléger l'écran

FONCTIONNE SANS CONNEXION

Les pictogrammes du vocabulaire de départ sont installés avec l'application.
Aucune image à télécharger au moment où l'enfant en a besoin : la grille
s'affiche dans la voiture, dans une salle d'attente, en vacances, partout où
le réseau manque.

PERSONNALISABLE PAR L'ADULTE

• Jusqu'à 6 profils, un par enfant, chacun avec ses favoris et ses réglages
• Ajout de vos propres pictogrammes, depuis une photo ou depuis la banque
  ARASAAC
• Réglage de la vitesse et du volume de la voix
• Historique des dernières phrases, à réécouter d'un geste
• Export et import de tous les profils dans un fichier, pour passer d'une
  tablette à l'autre — celle de la maison et celle de l'école

VOS DONNÉES RESTENT SUR VOTRE APPAREIL

Il n'y a ni compte à créer, ni serveur qui nous appartienne, ni publicité, ni
mesure d'audience. Le prénom de l'enfant, ses photos, ses phrases : tout cela
est enregistré sur l'appareil et n'est transmis à personne, pas même à
l'éditeur. Vous restez maître de l'export de vos données, et de leur
suppression.

Politique de confidentialité :
https://guskatarn.github.io/Pictolanguage/

GRATUIT, ET QUI LE RESTE

L'application est gratuite, sans achat intégré et sans publicité. Ce n'est pas
une offre de lancement : les pictogrammes utilisés sont diffusés sous une
licence qui interdit toute exploitation commerciale, ce qui rend la gratuité
définitive tant qu'ils sont employés.

CE QUE L'APPLICATION N'EST PAS

disavecmoi est un outil de communication, pas un dispositif médical ni un
programme de soin. Elle ne remplace pas l'accompagnement d'un orthophoniste ou
d'un éducateur, et vient plutôt le prolonger à la maison. La voix utilisée est
celle installée sur votre appareil ; sa qualité dépend donc de celui-ci.
L'interface et le vocabulaire sont en français.

PICTOGRAMMES

Les pictogrammes proviennent d'ARASAAC (auteur : Sergio Palao, propriété du
Gouvernement d'Aragon), diffusés sous licence CC BY-NC-SA 4.0. ARASAAC ne
soutient ni ne valide cette application.

Une remarque, un problème, une suggestion : lacroixbenoit78@yahoo.fr
```

---

## 2. Classement et audience

| Champ Play | Valeur |
| --- | --- |
| Catégorie d'application | Éducation |
| Type | Application (pas un jeu) |
| Public cible | Enfants — voir `docs/PLAY-CONFORMITE.md` §3 |
| Contient des publicités | Non |
| Achats intégrés | Non |
| Politique de confidentialité | `https://guskatarn.github.io/Pictolanguage/` |
| Adresse de contact | `lacroixbenoit78@yahoo.fr` |

L'application entrant dans le programme **Familles**, la fiche est examinée
manuellement : les captures et la description ne doivent rien promettre que
l'application ne fasse. Les textes ci-dessus s'y tiennent, et aucun bénéfice
thérapeutique n'y est annoncé.

---

## 3. Visuels

Tous sont produits par `npm run assets`, jamais retouchés à la main. Les
regénérer après toute évolution de l'interface, sinon la fiche montre une
application qui n'existe plus.

| Fichier | Champ Play | Format |
| --- | --- | --- |
| `icone-play-512.png` | Icône de l'application | 512 × 512 |
| `feature-graphic-1024x500.png` | Image mise en avant | 1024 × 500 |
| `captures/telephone-*.png` | Captures — téléphone | 1000 × 1776 |
| `captures/tablette-7-*.png` | Captures — tablette 7 pouces | 1920 × 1200 |
| `captures/tablette-10-*.png` | Captures — tablette 10 pouces | 2560 × 1600 |

Quatre scènes par format, dans l'ordre conseillé de présentation :

1. **phrase** — une phrase composée, « Parler » à portée : c'est l'usage même
   de l'application, à mettre en premier.
2. **accueil** — la grille par catégories.
3. **favoris** — l'onglet Favoris et, sur tablette, la colonne de catégories
   du mode paysage.
4. **reglages** — les réglages parents, où figure aussi le lien vers la
   politique de confidentialité.

Deux réserves à connaître :

- Les captures « téléphone » sont rendues à **500 px CSS de large**, plancher
  imposé par Chrome en mode headless. Un téléphone courant fait plutôt 360 à
  430 px et affichera donc une colonne de moins. À contrôler sur un appareil
  réel avant publication.
- La bannière « Installer » est retirée pendant la capture : elle vient de
  l'événement `beforeinstallprompt` du navigateur et ne peut pas apparaître
  dans l'application installée depuis Play.

---

## 4. Ce qui manque encore avant de pouvoir publier

- Compte développeur Google Play créé et identité vérifiée. L'adresse exigée à
  cette occasion devra concorder avec la politique de confidentialité, qui
  n'en mentionne aujourd'hui aucune (`docs/PLAY-CONFORMITE.md` §4).
- Empaquetage Android (Capacitor) : il n'existe à ce jour aucun binaire à
  téléverser.
- Questionnaire de classification du contenu, à remplir dans la console.
- Test fermé avant diffusion publique.
