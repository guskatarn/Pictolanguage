import { useState, useEffect, useRef, CSSProperties } from 'react'
import { SentenceItem, InstallPromptEvent, UserProfile, PictogramItem } from './types'
import { useProfiles } from './hooks/useProfiles'
import { usePictograms } from './hooks/usePictograms'
import { useSpeech } from './hooks/useSpeech'
import ProfileSelector from './components/ProfileSelector'
import CategoryTabs from './components/CategoryTabs'
import PictogramCard from './components/PictogramCard'
import SentenceBar from './components/SentenceBar'
import CaseNavigation from './components/CaseNavigation'
import HistoryPanel from './components/HistoryPanel'
import SearchPanel from './components/SearchPanel'
import SettingsPanel from './components/SettingsPanel'
import StorageAlert from './components/StorageAlert'
import ParentGate from './components/ParentGate'
import { FAVORITES_CATEGORY_ID } from './data/defaultCategories'
import { GEOMETRIE, TABLEAU_TLA } from './data/tableauTla'

export type { InstallPromptEvent }

/** Ce que l'adulte a demandé à ouvrir, à exécuter une fois le code validé. */
type IntentionParent = 'reglages' | 'profils' | 'modelisation'

export default function App() {
  const {
    profiles,
    activeProfile,
    usedBytes,
    storageError,
    dismissStorageError,
    setActiveProfileId,
    createProfile,
    updateProfile,
    deleteProfile,
    addToHistory,
    parentPin,
    setParentPin,
    basculerMasque,
    basculerFavori,
    ajouterMotPerso,
    retirerMotPerso,
    updateSettings,
    reordonnerPages,
    exportData,
    importData,
  } = useProfiles()

  // `categories` = catégories de rangement (destination possible d'un
  // pictogramme). `tabs` = ce qu'affiche la barre d'onglets, favoris compris.
  const {
    categories,
    tabs,
    casesDeLaPage,
    casesFavorites,
    searchPictograms,
    searchArasaac,
  } = usePictograms(activeProfile)
  const { speak, isSpeaking } = useSpeech()

  const [activeCategory, setActiveCategory] = useState(TABLEAU_TLA.pageRacine)
  const [sentence, setSentence] = useState<SentenceItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null)
  /**
   * Mode parent : ouvert tant qu'aucun code n'est installé, sinon fermé à
   * chaque lancement. Volontairement en mémoire seulement — un mode parent
   * persisté resterait ouvert des jours durant sur la tablette d'un enfant, et
   * le verrou ne servirait plus à rien.
   */
  const [isParentMode, setIsParentMode] = useState(false)
  /**
   * Mode modélisation : l'adulte touche les pictogrammes en parlant, pour
   * montrer à l'enfant comment le tableau s'emploie. Chaque mot touché est dit
   * et sa case s'illumine, mais il n'entre ni dans la phrase de l'enfant ni
   * dans son historique — c'est l'adulte qui parle, pas l'enfant.
   *
   * En mémoire seulement, pour la même raison que le mode parent : un mode
   * oublié actif laisserait l'enfant, au lancement suivant, devant une grille
   * qui ne compose plus sa phrase.
   */
  const [isModelisation, setIsModelisation] = useState(false)
  const [demandeCode, setDemandeCode] = useState<null | IntentionParent>(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)

  // PWA install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as InstallPromptEvent)
      setShowInstallBanner(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // Sync active category with profile order. Comparé aux onglets et non aux
  // catégories : « Favoris » est un onglet valide, qu'il ne faut pas réinitialiser.
  useEffect(() => {
    if (tabs.length > 0 && !tabs.find((c) => c.id === activeCategory)) {
      setActiveCategory(tabs[0].id)
    }
  }, [tabs, activeCategory])

  const isFavoritesTab = activeCategory === FAVORITES_CATEGORY_ID
  /**
   * Les cases de la page affichée, `null` compris : le tableau a la longueur
   * de la géométrie déclarée, et c'est cette longueur qui garantit que rien ne
   * bouge quand une case se vide.
   */
  const cases = isFavoritesTab ? casesFavorites() : casesDeLaPage(activeCategory)
  const pageVide = cases.every((c) => c === null)

  /** Onglet ou case de navigation : les deux mènent au même endroit. */
  const allerALaPage = (pageId: string) => {
    setActiveCategory(pageId)
    gridRef.current?.scrollTo({ top: 0 })
  }

  const handlePictogramClick = (picto: PictogramItem) => {
    if (isModelisation && activeProfile) {
      // L'adulte montre : le mot est dit seul, sa case s'illumine, et la
      // phrase de l'enfant reste la sienne. L'adulte formule la phrase de vive
      // voix, comme il le ferait de toute façon en modélisant.
      speak(picto.word, {
        rate: activeProfile.settings.voiceRate,
        volume: activeProfile.settings.voiceVolume,
      })
      return
    }
    const item: SentenceItem = {
      key: `${picto.key}-${Date.now()}`,
      word: picto.word,
      arasaacId: picto.arasaacId,
      customImageUrl: picto.isCustom ? picto.imageUrl : undefined,
    }
    setSentence((prev) => [...prev, item])
  }

  const estVerrouille = parentPin !== null && !isParentMode

  /**
   * Exécute une action réservée à l'adulte, ou demande le code d'abord.
   * `intention` retient ce qu'il faudra ouvrir une fois le code validé.
   */
  const actionParent = (intention: IntentionParent) => {
    if (estVerrouille) {
      setDemandeCode(intention)
      return
    }
    ouvrirEspaceParent(intention)
  }

  const ouvrirEspaceParent = (intention: IntentionParent) => {
    switch (intention) {
      case 'reglages':
        setShowSettings(true)
        setShowHistory(false)
        break
      case 'profils':
        setActiveProfileId(null)
        break
      case 'modelisation':
        setIsModelisation(true)
        setShowHistory(false)
        break
    }
  }

  /**
   * Entrer demande le code, sortir non : un enfant qui active le mode par
   * mégarde se retrouverait avec des touches qui n'ajoutent plus rien à sa
   * phrase, alors qu'en sortir par mégarde ne fait que lui rendre sa grille.
   */
  const basculerModelisation = () => {
    if (isModelisation) setIsModelisation(false)
    else actionParent('modelisation')
  }

  const handleToggleFavorite = (picto: PictogramItem) => {
    // Le favori porte sur la case, pas sur le mot : c'est ce qui permet de
    // mettre « moi » en favori depuis la page Personnes sans l'y attacher
    // partout ailleurs dans le tableau.
    if (!activeProfile || !picto.refSlot) return
    basculerFavori(activeProfile.id, picto.refSlot)
  }

  const handleRemoveItem = (key: string) => {
    setSentence((prev) => prev.filter((i) => i.key !== key))
  }

  const handleClearAll = () => setSentence([])

  const handleSpeak = () => {
    if (!sentence.length || !activeProfile) return
    const text = sentence.map((i) => i.word).join(', ')
    speak(text, {
      rate: activeProfile.settings.voiceRate,
      volume: activeProfile.settings.voiceVolume,
    })
    addToHistory(activeProfile.id, sentence.map((i) => i.word))
    // La phrase reste affichée après avoir été dite. On redemande sans cesse à
    // un enfant de répéter — l'adulte n'a pas entendu, ou quelqu'un arrive —
    // et l'effacer l'obligeait à tout reconstruire pictogramme par
    // pictogramme. Elle s'efface par « ← Effacer » ou « ✕ Tout », et au
    // changement de profil.
  }

  const handleReplayHistory = (words: string[]) => {
    if (!activeProfile) return
    speak(words.join(', '), {
      rate: activeProfile.settings.voiceRate,
      volume: activeProfile.settings.voiceVolume,
    })
  }

  const handleInstall = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    const result = await installPrompt.userChoice
    if (result.outcome === 'accepted') setShowInstallBanner(false)
    setInstallPrompt(null)
  }

  const handleSelectProfile = (id: string) => {
    setActiveProfileId(id)
    setSentence([])
    setIsModelisation(false)
    // Chaque enfant retrouve son tableau par l'accueil, pas sur la page où le
    // précédent l'avait laissé.
    setActiveCategory(TABLEAU_TLA.pageRacine)
  }

  const handleCreateProfile = (name: string, avatar: string) => {
    createProfile(name, avatar)
  }

  const handleEditProfile = (profile: UserProfile) => {
    updateProfile(profile.id, { name: profile.name, avatar: profile.avatar })
  }

  const storageAlert = storageError ? (
    <StorageAlert message={storageError} onDismiss={dismissStorageError} />
  ) : null

  // Show profile selector if no active profile
  if (!activeProfile) {
    return (
      <>
        <ProfileSelector
          profiles={profiles}
          onSelect={handleSelectProfile}
          onCreate={handleCreateProfile}
          onEdit={handleEditProfile}
          onDelete={deleteProfile}
        />
        {storageAlert}
      </>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
      {/*
        Top bar. Elle change de couleur en modélisation : l'adulte qui reprend
        la tablette doit voir d'un coup d'œil que ses touches ne composeront
        pas la phrase de l'enfant, sans chercher un indicateur plus discret.
      */}
      <div
        className={`flex items-center justify-between px-3 py-2 text-white shrink-0 transition-colors ${
          isModelisation ? 'bg-teal-700' : 'bg-violet-700'
        }`}
      >
        {/*
          `min-w-0` sur le bouton et `shrink-0` sur les actions : c'est le
          prénom qui se tronque quand la place manque, jamais les boutons qui
          sortent de l'écran. Sur un téléphone de 360 px, bannière
          d'installation affichée, le total dépassait la largeur disponible.
        */}
        <button
          onClick={() => actionParent('profils')}
          className="flex min-h-[44px] min-w-0 items-center gap-2 bg-white/15 rounded-xl px-3 py-1.5 active:scale-95 transition-transform"
          aria-label="Changer de profil"
        >
          <span className="text-xl shrink-0">{activeProfile.avatar}</span>
          <span className="truncate font-bold text-sm">{activeProfile.name}</span>
        </button>

        <div className="flex shrink-0 items-center gap-2">
          {showInstallBanner && (
            <button
              onClick={handleInstall}
              className="bg-amber-400 text-amber-900 rounded-xl px-3 py-1.5 text-xs font-bold active:scale-95"
            >
              📲 Installer
            </button>
          )}
          {/*
            Actif, le bouton s'élargit et dit comment sortir : un mode dont on
            ne voit pas l'issue inquiète plus qu'il ne sert.
          */}
          <button
            onClick={basculerModelisation}
            className={`h-11 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 ${
              isModelisation ? 'bg-white text-teal-800 px-3 text-sm font-bold' : 'w-11 bg-white/15 text-xl'
            }`}
            aria-label="Mode modélisation"
            aria-pressed={isModelisation}
          >
            {/* 👆 et non 🧑‍🏫 : cette séquence composée s'affiche en deux
                glyphes (🧑 🏫) là où le système ne la connaît pas, Windows 10
                compris. Un caractère unique s'affiche partout. */}
            <span aria-hidden="true">👆</span>
            {/* Libellé réservé aux écrans larges : sur un téléphone de 360 px,
                il pousserait les autres boutons hors de la barre. La croix, la
                couleur et le bouton blanc suffisent à dire comment sortir. */}
            {isModelisation && (
              <span aria-hidden="true">
                <span className="hidden sm:inline">Modélisation </span>✕
              </span>
            )}
          </button>
          {/*
            La recherche reste accessible sans code : elle ne modifie rien, et
            son intérêt est justement d'aller vite au milieu d'un échange.
          */}
          <button
            onClick={() => setShowSearch(true)}
            className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center text-xl active:scale-95"
            aria-label="Chercher un mot"
          >
            🔍
          </button>
          <button
            onClick={() => {
              setShowHistory(true)
              setShowSettings(false)
            }}
            className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center text-xl active:scale-95"
            aria-label="Historique"
          >
            📜
          </button>
          <button
            onClick={() => actionParent('reglages')}
            className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center text-xl active:scale-95"
            aria-label="Paramètres"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Sentence bar */}
      <SentenceBar
        items={sentence}
        onRemoveItem={handleRemoveItem}
        onClearAll={handleClearAll}
        onSpeak={handleSpeak}
        isSpeaking={isSpeaking}
      />

      {/*
        Onglets + grille forment un bloc à part : en portrait ils restent
        empilés, en paysage `.app-body` les met côte à côte et les onglets
        deviennent une colonne à gauche. Voir index.css.
      */}
      <div className="app-body">
        <CategoryTabs categories={tabs} activeId={activeCategory} onSelect={allerALaPage} />

        {/*
          La grille défile sur les deux axes : sa géométrie est déclarée par le
          tableau et ne se reforme jamais pour tenir à l'écran. Une case garde
          sa place même hors du champ visible — c'est cette place que l'enfant
          apprend, et la faire varier avec la largeur de l'appareil reviendrait
          à la lui redemander à chaque fois.
        */}
        <div className="flex-1 min-w-0 overflow-auto" ref={gridRef}>
          {pageVide ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <span className="text-5xl mb-3">{isFavoritesTab ? '⭐' : '🏞️'}</span>
              {isFavoritesTab ? (
                <>
                  <p className="text-base">Aucun favori pour le moment</p>
                  <p className="text-sm mt-1">
                    Touchez l'étoile d'un pictogramme pour l'ajouter ici
                  </p>
                </>
              ) : (
                <>
                  <p className="text-base">Aucun pictogramme sur cette page</p>
                  <p className="text-sm mt-1">Ajoutes-en dans les paramètres</p>
                </>
              )}
            </div>
          ) : (
            <div
              className="picto-grid"
              data-taille={activeProfile.settings.tailleCase}
              style={{ '--colonnes': GEOMETRIE.colonnes } as CSSProperties}
            >
              {cases.map((contenu, index) => {
                if (contenu === null || (contenu.type === 'mot' && contenu.picto.isHidden)) {
                  // Case vide, et non case absente : la position de tous les
                  // pictogrammes suivants doit rester celle que l'enfant a
                  // apprise. Invisible et hors du parcours de lecture d'écran.
                  const cle = contenu?.type === 'mot' ? contenu.picto.key : `vide-${index}`
                  return <div key={cle} aria-hidden="true" />
                }
                switch (contenu.type) {
                  case 'mot':
                    return (
                      <PictogramCard
                        key={contenu.picto.key}
                        picto={contenu.picto}
                        size={activeProfile.settings.tailleCase}
                        modeCouleur={activeProfile.settings.modeCouleur}
                        onClick={handlePictogramClick}
                        onToggleFavorite={handleToggleFavorite}
                        // Verrou posé : l'étoile disparaît. C'était la réserve
                        // ouverte depuis le lot favoris — un enfant qui vise son
                        // mot touchait l'étoile d'à côté et n'entendait rien.
                        showFavorite={!estVerrouille}
                        illuminer={isModelisation}
                      />
                    )
                  case 'navigation':
                    return (
                      <CaseNavigation
                        key={contenu.key}
                        navigation={contenu}
                        size={activeProfile.settings.tailleCase}
                        modeCouleur={activeProfile.settings.modeCouleur}
                        onOuvrir={allerALaPage}
                      />
                    )
                }
              })}
            </div>
          )}
        </div>
      </div>

      {/* Overlays */}
      {showSearch && (
        <SearchPanel
          onSearch={searchPictograms}
          onSelect={handlePictogramClick}
          onClose={() => setShowSearch(false)}
          modeCouleur={activeProfile.settings.modeCouleur}
        />
      )}

      {showHistory && (
        <HistoryPanel
          history={activeProfile.history}
          onReplay={handleReplayHistory}
          onClose={() => setShowHistory(false)}
        />
      )}

      {showSettings && (
        <SettingsPanel
          parentPin={parentPin}
          onSetParentPin={setParentPin}
          onLock={() => {
            // Verrouiller, c'est rendre la tablette à l'enfant : la
            // modélisation s'arrête avec le reste de l'espace adulte.
            setIsParentMode(false)
            setIsModelisation(false)
            setShowSettings(false)
          }}
          profile={activeProfile}
          categories={categories}
          onClose={() => setShowSettings(false)}
          onUpdateSettings={(s) => updateSettings(activeProfile.id, s)}
          onReorderCategories={(order) => reordonnerPages(activeProfile.id, order)}
          onAddCustomPictogram={(word, imageUrl, pageId) =>
            ajouterMotPerso(activeProfile.id, word, imageUrl, pageId)
          }
          onRemoveCustomPictogram={(id) => retirerMotPerso(activeProfile.id, id)}
          onToggleHide={(ref) => basculerMasque(activeProfile.id, ref)}
          searchArasaac={searchArasaac}
          usedBytes={usedBytes}
          onExportData={exportData}
          onImportData={importData}
        />
      )}

      {demandeCode && (
        <ParentGate
          mode="verification"
          codeAttendu={parentPin}
          onSuccess={() => {
            setIsParentMode(true)
            ouvrirEspaceParent(demandeCode)
            setDemandeCode(null)
          }}
          onCancel={() => setDemandeCode(null)}
          onPinChange={(code) => setParentPin(code)}
        />
      )}

      {storageAlert}
    </div>
  )
}
