import { Case, Geometrie, Tableau } from '../types'
import { casesEnRangees, construirePage } from '../utils/pages'
import { ACCUEIL_CATEGORY, FAVORITES_CATEGORY_ID } from './defaultCategories'

/**
 * Tableau de langage assisté livré avec l'application.
 *
 * Il vit dans le code, et non recopié dans chaque profil, pour deux raisons.
 * Un tableau complet dupliqué six fois pèserait lourd dans un budget de 5 Mo
 * déjà partagé avec des images en base64 ; et surtout, un profil créé
 * aujourd'hui resterait figé à jamais sur cette version — un mot ajouté ou un
 * identifiant ARASAAC corrigé n'atteindrait plus personne. Ce que le profil
 * garde, ce sont ses écarts : cases masquées, mots ajoutés, favoris.
 */

/**
 * Géométrie **provisoire, à valider par une orthophoniste** avant d'être figée.
 *
 * Elle est dimensionnée pour la cible (une page d'accueil dense) et non pour
 * les cinq mots par thème d'aujourd'hui, qui ne sont qu'une amorce. La caler
 * sur le contenu actuel obligerait à la reprendre au moment d'écrire le
 * vocabulaire réel — et changer la géométrie déplace *toutes* les cases, donc
 * tous les repères moteurs de l'enfant. C'est le genre de changement qu'on ne
 * fait qu'une fois.
 *
 * Les cases vides ne sont pas du gâchis : ce sont les places disponibles pour
 * les mots qu'un parent ajoutera, qui s'y poseront sans rien déplacer.
 */
export const GEOMETRIE: Geometrie = { colonnes: 6, lignes: 5 }

const mot = (lexiqueId: string): Case => ({ type: 'vocabulaire', lexiqueId })

/** Pose une suite de mots à partir d'un index, sur une même rangée. */
function rangee(depart: number, ...lexiqueIds: string[]): Record<number, Case> {
  return Object.fromEntries(lexiqueIds.map((id, decalage) => [depart + decalage, mot(id)]))
}

/** Case qui ouvre une page. Voir `Case` pour le choix de l'emoji. */
function vers(pageCible: string, libelle: string, emoji: string): Case {
  return { type: 'navigation', pageCible, libelle, emoji }
}

const _ = null

export const PAGE_ACCUEIL = ACCUEIL_CATEGORY.id

/**
 * Page d'accueil dense : le vocabulaire qui sert dans presque toutes les
 * phrases, plus une case vers chaque thème.
 *
 * Elle absorbe l'ancienne barre de mots rapides, qui défilait en largeur — ce
 * que le projet avait passé un lot entier à éliminer ailleurs — et dont les
 * mots n'avaient pas de position fixe dans le tableau.
 *
 * Disposition de gauche à droite selon la clé de Fitzgerald : mots sociaux en
 * tête, puis pronoms, verbes, mots qui décrivent, et les thèmes à droite. La
 * colonne des pronoms n'a que « moi » : ses trois cases libres attendent
 * « toi », « il », « elle » quand le lexique les aura.
 *
 * **Provisoire, à valider par une orthophoniste**, comme la géométrie : c'est
 * la page que l'enfant touchera le plus, donc celle qu'on déplacera le moins
 * volontiers une fois apprise.
 */
const ACCUEIL = casesEnRangees(GEOMETRIE, [
  [mot('oui'), mot('non'), mot('stop'), mot('encore'), mot('fini'), mot('aide')],
  [mot('moi'), mot('vouloir'), mot('aimer'), mot('content'), vers('besoins', 'Besoins', '🙋'), vers('emotions', 'Émotions', '😊')],
  [_, mot('aller'), mot('donner'), mot('triste'), vers('aliments', 'Aliments', '🍎'), vers('actions', 'Actions', '🏃')],
  [_, mot('manger'), mot('jouer'), mot('fatigue'), vers('lieux', 'Lieux', '🗺️'), vers('personnes', 'Personnes', '👪')],
  [_, mot('boire'), mot('regarder'), _, vers('objets', 'Objets', '🧸'), vers(FAVORITES_CATEGORY_ID, 'Favoris', '⭐')],
])

/**
 * Les identifiants de page reprennent ceux des anciennes catégories. Ce n'est
 * pas de la nostalgie : cela rend l'ordre des pages du profil directement
 * réutilisable et évite une table de correspondance qu'il faudrait maintenir.
 */
export const TABLEAU_TLA: Tableau = {
  id: 'tla-fr',
  nom: 'Tableau de langage assisté',
  version: 1,
  geometrie: GEOMETRIE,
  pageRacine: PAGE_ACCUEIL,
  pages: [
    construirePage({ id: PAGE_ACCUEIL, titre: 'Accueil', geometrie: GEOMETRIE, cases: ACCUEIL }),
    construirePage({
      id: 'besoins', titre: 'Besoins', theme: 'besoins', geometrie: GEOMETRIE,
      cases: rangee(0, 'manger', 'boire', 'toilettes', 'dormir', 'aide'),
    }),
    construirePage({
      id: 'emotions', titre: 'Émotions', theme: 'emotions', geometrie: GEOMETRIE,
      cases: rangee(0, 'content', 'triste', 'peur', 'fatigue', 'colere'),
    }),
    construirePage({
      id: 'aliments', titre: 'Aliments', theme: 'aliments', geometrie: GEOMETRIE,
      cases: rangee(0, 'pain', 'eau', 'lait', 'pomme', 'biscuit'),
    }),
    construirePage({
      id: 'actions', titre: 'Actions', theme: 'actions', geometrie: GEOMETRIE,
      cases: rangee(0, 'vouloir', 'aller', 'jouer', 'regarder', 'ecouter'),
    }),
    construirePage({
      id: 'lieux', titre: 'Lieux', theme: 'lieux', geometrie: GEOMETRIE,
      cases: rangee(0, 'ecole', 'maison', 'parc', 'salle-de-bain', 'cuisine'),
    }),
    construirePage({
      id: 'personnes', titre: 'Personnes', theme: 'personnes', geometrie: GEOMETRIE,
      cases: rangee(0, 'maman', 'papa', 'ami', 'professeur', 'moi'),
    }),
    construirePage({
      id: 'objets', titre: 'Objets', theme: 'objets', geometrie: GEOMETRIE,
      cases: rangee(0, 'livre', 'jouet', 'telephone', 'tablette', 'voiture'),
    }),
  ],
}

const PAGES_PAR_ID = new Map(TABLEAU_TLA.pages.map((p) => [p.id, p]))

export function trouverPage(id: string): Tableau['pages'][number] | undefined {
  return PAGES_PAR_ID.get(id)
}

/**
 * Pages que le parent peut réordonner : toutes, sauf l'accueil. La racine
 * reste en tête des onglets quoi qu'il arrive — c'est le point de retour de
 * l'enfant, et un point de retour qui se déplace n'en est plus un.
 */
export const ORDRE_PAGES_PAR_DEFAUT = TABLEAU_TLA.pages
  .map((p) => p.id)
  .filter((id) => id !== TABLEAU_TLA.pageRacine)
