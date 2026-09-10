import { Case, Geometrie, Tableau } from '../types'
import { construirePage } from '../utils/pages'

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
  // La page d'accueil dense arrive avec le lot « tableau dense » ; d'ici là,
  // la racine est la première page thématique.
  pageRacine: 'besoins',
  pages: [
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

export const ORDRE_PAGES_PAR_DEFAUT = TABLEAU_TLA.pages.map((p) => p.id)
