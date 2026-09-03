# PictoLanguage

Application web (PWA) de **communication alternative et améliorée (CAA) par
pictogrammes**, destinée aux enfants avec TSA. Composition de phrases par
pictogrammes, lecture à voix haute (synthèse vocale française), profils
multiples, fonctionnement hors ligne.

Aucun backend, aucun compte, aucune collecte : toutes les données (profils,
historique, pictogrammes personnalisés, réglages) restent dans le
`localStorage` de l'appareil.

## Démarrage

```bash
npm install
npm run dev
```

Node ≥ 20.11 requis.

## Scripts

| Script | Rôle |
| --- | --- |
| `npm run dev` | Serveur de développement Vite |
| `npm run build` | Vérification TypeScript + build de production dans `dist/` |
| `npm run preview` | Sert le build de production |
| `npm run lint` | ESLint |
| `npm run pictograms` | (Re)télécharge les pictogrammes ARASAAC du vocabulaire par défaut dans `public/pictograms/` et régénère `src/data/bundledPictograms.ts` |

À lancer après avoir ajouté des entrées dans `src/data/defaultPictograms.ts`
ou `src/data/coreVocabulary.ts` :

```bash
npm run pictograms          # ne télécharge que les images manquantes
npm run pictograms -- --force   # retélécharge tout
```

Les images téléchargées sont **versionnées dans le dépôt** : c'est ce qui rend
l'application utilisable hors ligne dès l'installation, sans dépendre du cache
du service worker.

## Documentation

- [`docs/AUDIT.md`](docs/AUDIT.md) — état du projet, écarts avant publication
  Play Store, comparatif CAA et feuille de route.
- [`docs/POLITIQUE-DE-CONFIDENTIALITE.md`](docs/POLITIQUE-DE-CONFIDENTIALITE.md) —
  politique de confidentialité destinée à la publication (des marqueurs
  `[[À COMPLÉTER]]` restent à renseigner par l'éditeur).
- [`docs/PLAY-CONFORMITE.md`](docs/PLAY-CONFORMITE.md) — notes internes de
  préparation Play Store (formulaire Data safety, programme Families).
- [`NOTICE.md`](NOTICE.md) — licences des ressources tierces.

## Licence des pictogrammes

Les pictogrammes proviennent d'[ARASAAC](https://arasaac.org) (auteur : Sergio
Palao, propriété du Gouvernement d'Aragon), sous licence
[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.fr).
**L'attribution est obligatoire et toute monétisation est exclue** tant que ces
pictogrammes sont utilisés. Voir [`NOTICE.md`](NOTICE.md).
