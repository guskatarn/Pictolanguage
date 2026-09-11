/**
 * Taille d'une case de la grille.
 *
 * Commande bien la **taille** de la case, et non le nombre de colonnes : la
 * géométrie appartient désormais au tableau, et la grille défile quand elle ne
 * tient pas à l'écran. Défiler une grille figée préserve la planification
 * motrice bien mieux que la reformer — la case reste au même endroit *dans le
 * tableau*, ce que l'enfant apprend, même si elle sort de l'écran.
 */
export type TailleCase = 'S' | 'M' | 'L'

export interface ProfileSettings {
  tailleCase: TailleCase
  voiceRate: number
  voiceVolume: number
  /**
   * Codage couleur de la grille. `grammatical` applique la clé de Fitzgerald ;
   * `thematique` conserve les couleurs par thème. Le parent bascule quand il
   * l'a décidé, jamais au redémarrage suivant.
   */
  modeCouleur: 'grammatical' | 'thematique'
  /**
   * `naturelle` prononce « je veux manger » pour « moi · vouloir · manger ».
   * `brute` prononce exactement ce que l'enfant a composé — certaines
   * orthophonistes le préfèrent, l'écart entre le geste et le retour sonore
   * pouvant désorienter. Choix clinique, pas technique.
   */
  formulation: 'brute' | 'naturelle'
  /**
   * Accord grammatical des phrases de l'enfant : « je suis content » ou
   * « je suis contente ». Le français n'offre pas de troisième forme sur
   * l'adjectif attribut. Par profil, jamais global — une tablette sert
   * souvent à deux enfants.
   */
  accord: 'masculin' | 'feminin'
}

export interface HistoryEntry {
  id: string
  words: string[]
  timestamp: number
}

export interface UserProfile {
  id: string
  name: string
  avatar: string
  /** Tableau utilisé par ce profil. Un seul est livré pour l'instant. */
  tableauId: string
  /**
   * Page de favoris : creuse et de longueur fixe, comme n'importe quelle page.
   * Retirer un favori laisse un trou plutôt que de décaler les suivants.
   */
  pageFavoris: (RefSlot | null)[]
  /**
   * Cases masquées par le parent, adressées par **position** et non par mot.
   *
   * C'est ce qui distingue « vider cette case-là » de « faire disparaître ce
   * mot partout » : un même mot occupe souvent plusieurs cases du tableau, et
   * l'ancien masquage par identifiant les emportait toutes d'un coup.
   */
  slotsMasques: RefSlot[]
  ordrePages: string[]
  /** Mots ajoutés par le parent. Mêmes entrées que le lexique livré. */
  lexiquePerso: EntreeLexique[]
  /**
   * Calque du profil sur le tableau du code : quel mot personnel occupe quelle
   * case libre. C'est aussi le point d'accroche d'un futur réagencement complet
   * par le parent, sans nouveau changement de format.
   */
  placements: Record<RefSlot, string>
  history: HistoryEntry[]
  settings: ProfileSettings
}

export interface SentenceItem {
  key: string
  word: string
  arasaacId?: number
  customImageUrl?: string
}

export interface PictogramItem {
  key: string
  word: string
  /**
   * Mot du lexique (livré ou ajouté par le parent) que porte la case. Absent
   * pour un résultat de recherche ARASAAC. Un même mot pouvant occuper
   * plusieurs cases, c'est lui — et non la clé — qui dit « c'est le même mot ».
   */
  lexiqueId?: string
  arasaacId?: number
  imageUrl: string
  isCustom: boolean
  customId?: string
  isFavorite: boolean
  /**
   * Thème du mot, d'où viennent ses couleurs en mode thématique : celui du
   * lexique, et à défaut celui de la page où le parent l'a posé. Absent pour
   * un résultat de recherche ARASAAC, et pour un mot sans thème (« oui »,
   * « encore »…), qui se colore alors en neutre. Voir `getCategoryStyle`.
   */
  categoryId?: string
  /** Classe grammaticale du mot, source des couleurs en mode Fitzgerald. */
  classeGrammaticale?: ClasseGrammaticale
  /**
   * Adresse de la case occupée. Absente pour un résultat de recherche ARASAAC,
   * qui n'est posé nulle part. C'est par elle que passent le masquage et la
   * mise en favori, jamais par l'identifiant du mot.
   */
  refSlot?: RefSlot
  /**
   * Masqué par le parent. Le pictogramme est tout de même renvoyé : la grille
   * laisse sa case vide au lieu de refermer le trou, sans quoi masquer un mot
   * décalerait tous les suivants et détruirait les repères moteurs de l'enfant.
   */
  isHidden?: boolean
}

export interface Category {
  id: string
  name: string
  color: string
  bgColor: string
  tabColor: string
  /**
   * Vue synthétique plutôt que catégorie de rangement : elle s'affiche comme un
   * onglet mais ne peut pas contenir de pictogramme. Aucune interface ne doit la
   * proposer comme destination — un pictogramme qui y atterrit n'apparaît
   * ensuite dans aucune grille.
   */
  isView?: boolean
}

export interface InstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/** Contenu intégral persisté dans `localStorage` (et exporté tel quel). */
export interface StoredData {
  /**
   * Version du schéma. Son absence désigne un format antérieur au modèle de
   * pages, qu'aucune installation ne porte : ces données-là sont écartées au
   * chargement, comme l'est déjà un contenu corrompu.
   */
  schemaVersion: number
  profiles: UserProfile[]
  activeProfileId: string | null
  /**
   * Code parent à quatre chiffres, `null` tant qu'aucun n'a été choisi.
   *
   * Volontairement **hors des profils** : il protège l'appareil, pas un enfant
   * en particulier. Le ranger dans un profil permettrait d'en changer pour
   * contourner le verrou. Enregistré en clair — voir `ParentGate` pour la
   * raison.
   */
  parentPin: string | null
}

/** Enveloppe d'un fichier de sauvegarde exporté par l'utilisateur. */
export interface BackupFile {
  app: 'pictolanguage'
  version: number
  exportedAt: string
  data: StoredData
}

/* ==========================================================================
   Lexique — le mot, indépendamment de toute position dans un tableau.

   Séparé de la disposition à dessein : un même mot peut occuper plusieurs
   cases (« moi », « vouloir » et « aide » sont aujourd'hui présents deux fois
   dans les données), et sa morphologie n'aurait alors à être saisie qu'une
   fois. C'est aussi ce qui permet de masquer une case sans masquer le mot
   partout ailleurs.
   ========================================================================== */

export type Personne = 'je' | 'tu' | 'il' | 'nous' | 'vous' | 'ils'

/**
 * Classe grammaticale, distincte du thème (« Aliments », « Lieux »…).
 *
 * Porte le codage couleur de la clé de Fitzgerald, standard en CAA
 * francophone. Le thème reste disponible comme mode d'affichage alternatif.
 * Cette liste est à valider par une orthophoniste avant d'être figée.
 */
export type ClasseGrammaticale =
  | 'pronom'
  | 'verbe'
  | 'adjectif'
  | 'nom'
  | 'adverbe'
  /** Déterminants, prépositions, conjonctions. */
  | 'petitMot'
  | 'question'
  | 'social'
  | 'negation'

export interface MorphoVerbe {
  classe: 'verbe'
  infinitif: string
  /**
   * Formes **nues**, sans pronom : « écoute », pas « j'écoute ». L'élision est
   * le travail de l'étape d'euphonie, qui seule connaît ce qui précède.
   *
   * Table explicite plutôt que moteur de règles : les verbes fréquents en CAA
   * (être, avoir, aller, vouloir, pouvoir, faire) sont précisément les
   * irréguliers, là où un moteur se tromperait. Une table est juste par
   * construction et se relit d'un coup d'œil.
   */
  present: Record<Personne, string>
  /** « vouloir », « aller », « pouvoir » : le verbe suivant reste à l'infinitif. */
  semiAuxiliaire?: boolean
  /** Régime du complément de lieu : aller + parc → « au parc ». */
  regime?: 'a' | 'de'
}

export interface MorphoNom {
  classe: 'nom'
  genre: 'm' | 'f'
  pluriel?: boolean
  /** Article à insérer quand le mot arrive nu dans la phrase. */
  determinant: 'indefini' | 'defini' | 'partitif' | 'aucun'
  /** Complément de lieu possible : croisé avec `regime` du verbe. */
  lieu?: boolean
  /**
   * Locutions figées, non dérivables : « peur » → « j'ai peur »,
   * « colère » → « je suis en colère ».
   */
  etat?: { verbe: 'avoir' | 'etre'; prefixe?: string }
}

export interface MorphoAdjectif {
  classe: 'adjectif'
  masculin: string
  feminin: string
  /** Verbe à insérer quand l'adjectif suit un sujet sans verbe. */
  copule?: 'etre' | 'avoir'
}

export interface MorphoPronom {
  classe: 'pronom'
  /** Forme sujet : « je ». */
  sujet: string
  /** Forme tonique, celle qu'affiche le pictogramme : « moi ». */
  tonique: string
  personne: Personne
}

export type Morpho = MorphoVerbe | MorphoNom | MorphoAdjectif | MorphoPronom

export interface EntreeLexique {
  /**
   * Identifiant applicatif stable — jamais l'id ARASAAC, qui n'est pas unique
   * dans nos données et qui est absent des pictogrammes personnalisés.
   */
  id: string
  /** Libellé affiché sous la vignette. */
  mot: string
  arasaacId?: number
  /** Pictogramme personnalisé : image stockée (data URI). Exclusif d'`arasaacId`. */
  imageUrl?: string
  classeGrammaticale: ClasseGrammaticale
  /** Thème historique, seule source du mode couleur alternatif. */
  theme?: string
  /**
   * Absente : le mot traverse la formulation tel quel. C'est la règle de
   * dégradation qui protège les mots ajoutés par un parent — « je veux
   * Doudou » plutôt qu'une forme inventée.
   */
  morpho?: Morpho
}

/* ==========================================================================
   Tableau, pages et cases.

   Une page est une grille de géométrie déclarée. Ses slots forment un tableau
   dense de longueur `colonnes × lignes` : l'index EST la position, et un slot
   vide vaut `null` sans jamais se refermer. C'est la condition de la
   planification motrice — un pictogramme donné occupe toujours la même case,
   y compris quand ses voisins sont masqués.
   ========================================================================== */

export interface Geometrie {
  colonnes: number
  lignes: number
}

/** Action de service, sans effet sur la phrase construite. */
export type Commande =
  | 'parler'
  | 'effacerTout'
  | 'effacerDernier'
  | 'retour'
  | 'accueil'

/**
 * Contenu d'un slot. Union discriminée, et non un champ optionnel : le rendu
 * et le clic se traitent par `switch` exhaustif, si bien qu'un cinquième type
 * de case ne pourra pas être oublié quelque part.
 */
export type Case =
  | { type: 'vocabulaire'; lexiqueId: string }
  /**
   * Ouvre une autre page. Illustrée par un emoji et non par un pictogramme
   * ARASAAC, à dessein : une case qui montrerait l'image de « pomme » mais
   * ouvrirait la page Aliments au lieu de dire « pomme » tromperait l'enfant.
   * Le coin replié de la carte achève de la distinguer d'un mot.
   */
  | { type: 'navigation'; pageCible: string; libelle: string; emoji: string }
  | { type: 'commande'; commande: Commande; libelle: string }

/**
 * Case telle que la grille la rend. Même principe que `Case` : une union que
 * le rendu parcourt par `switch`, pour qu'un nouveau type de case ne puisse
 * pas tomber en silence dans la branche d'un autre.
 */
export type CaseGrille =
  | { type: 'mot'; picto: PictogramItem }
  | (Extract<Case, { type: 'navigation' }> & { key: string })

export interface Page {
  id: string
  titre: string
  /** Exactement `colonnes × lignes` entrées. `null` = case vide qui garde sa place. */
  slots: (Case | null)[]
  /** Thème historique, source des couleurs en mode d'affichage thématique. */
  theme?: string
}

export interface Tableau {
  id: string
  nom: string
  version: number
  geometrie: Geometrie
  pageRacine: string
  pages: Page[]
}

/**
 * Adresse absolue et stable d'une case : `"<pageId>#<index>"`.
 *
 * Une chaîne plutôt qu'un objet parce que ces adresses vivent dans des
 * tableaux persistés en `localStorage` et dans des `Set` de recherche, où une
 * comparaison structurelle coûterait à chaque lecture.
 */
export type RefSlot = string
