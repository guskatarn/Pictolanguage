import { useState, useEffect, useRef } from 'react'
import { SentenceItem, InstallPromptEvent, UserProfile, PictogramItem } from './types'
import { useProfiles } from './hooks/useProfiles'
import { usePictograms } from './hooks/usePictograms'
import { useSpeech } from './hooks/useSpeech'
import ProfileSelector from './components/ProfileSelector'
import CategoryTabs from './components/CategoryTabs'
import PictogramCard from './components/PictogramCard'
import SentenceBar from './components/SentenceBar'
import CoreVocabularyBar from './components/CoreVocabularyBar'
import HistoryPanel from './components/HistoryPanel'
import SettingsPanel from './components/SettingsPanel'
import StorageAlert from './components/StorageAlert'
import ParentGate from './components/ParentGate'
import { DEFAULT_CATEGORIES, FAVORITES_CATEGORY_ID } from './data/defaultCategories'
import { CORE_VOCABULARY } from './data/coreVocabulary'

export type { InstallPromptEvent }

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
    toggleHidePictogram,
    toggleHideCustomPictogram,
    toggleFavorite,
    toggleFavoriteCustom,
    addCustomPictogram,
    removeCustomPictogram,
    updateSettings,
    reorderCategories,
    exportData,
    importData,
  } = useProfiles()

  // `categories` = catégories de rangement (destination possible d'un
  // pictogramme). `tabs` = ce qu'affiche la barre d'onglets, favoris compris.
  const { categories, tabs, getPictogramsForCategory, getFavoritePictograms, searchArasaac } =
    usePictograms(activeProfile)
  const { speak, isSpeaking } = useSpeech()

  const [activeCategory, setActiveCategory] = useState(DEFAULT_CATEGORIES[0]?.id ?? 'besoins')
  const [sentence, setSentence] = useState<SentenceItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null)
  /**
   * Mode parent : ouvert tant qu'aucun code n'est installé, sinon fermé à
   * chaque lancement. Volontairement en mémoire seulement — un mode parent
   * persisté resterait ouvert des jours durant sur la tablette d'un enfant, et
   * le verrou ne servirait plus à rien.
   */
  const [isParentMode, setIsParentMode] = useState(false)
  const [demandeCode, setDemandeCode] = useState<null | 'reglages' | 'profils'>(null)
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
  const pictograms = isFavoritesTab
    ? getFavoritePictograms()
    : getPictogramsForCategory(activeCategory)
  const handlePictogramClick = (picto: {
    key: string
    word: string
    arasaacId?: number
    imageUrl: string
    isCustom: boolean
  }) => {
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
  const actionParent = (intention: 'reglages' | 'profils') => {
    if (estVerrouille) {
      setDemandeCode(intention)
      return
    }
    ouvrirEspaceParent(intention)
  }

  const ouvrirEspaceParent = (intention: 'reglages' | 'profils') => {
    if (intention === 'reglages') {
      setShowSettings(true)
      setShowHistory(false)
    } else {
      setActiveProfileId(null)
    }
  }

  const handleToggleFavorite = (picto: PictogramItem) => {
    if (!activeProfile) return
    if (picto.isCustom && picto.customId) {
      toggleFavoriteCustom(activeProfile.id, picto.customId)
    } else if (picto.arasaacId !== undefined) {
      toggleFavorite(activeProfile.id, picto.arasaacId)
    }
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
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-violet-700 text-white shrink-0">
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

      {/* Core vocabulary bar (mots fréquents toujours accessibles) */}
      {activeProfile.settings.showCoreBar !== false && (
        <CoreVocabularyBar words={CORE_VOCABULARY} onClick={handlePictogramClick} />
      )}

      {/*
        Onglets + grille forment un bloc à part : en portrait ils restent
        empilés, en paysage `.app-body` les met côte à côte et les onglets
        deviennent une colonne à gauche. Voir index.css.
      */}
      <div className="app-body">
        <CategoryTabs
          categories={tabs}
          activeId={activeCategory}
          onSelect={(id) => {
            setActiveCategory(id)
            gridRef.current?.scrollTo({ top: 0 })
          }}
        />

        {/* Pictogram grid */}
        <div className="flex-1 min-w-0 overflow-y-auto" ref={gridRef}>
          <div className={`picto-grid-${activeProfile.settings.pictogramSize}`}>
            {pictograms.map((picto) =>
              picto.isHidden ? (
                // Case vide, et non case absente : la position de tous les
                // pictogrammes suivants doit rester celle que l'enfant a
                // apprise. Invisible et hors du parcours de lecture d'écran.
                <div key={picto.key} aria-hidden="true" />
              ) : (
              <PictogramCard
                key={picto.key}
                picto={picto}
                size={activeProfile.settings.pictogramSize}
                onClick={handlePictogramClick}
                onToggleFavorite={handleToggleFavorite}
                // Verrou posé : l'étoile disparaît. C'était la réserve ouverte
                // depuis le lot favoris — un enfant qui vise son mot touchait
                // l'étoile d'à côté et n'entendait rien.
                showFavorite={!estVerrouille}
              />
              ),
            )}
            {pictograms.length === 0 && (
              <div
                className="flex flex-col items-center justify-center py-16 text-gray-400"
                style={{ gridColumn: '1 / -1' }}
              >
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
                    <p className="text-base">Aucun pictogramme dans cette catégorie</p>
                    <p className="text-sm mt-1">Ajoutes-en dans les paramètres</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlays */}
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
            setIsParentMode(false)
            setShowSettings(false)
          }}
          profile={activeProfile}
          categories={categories}
          onClose={() => setShowSettings(false)}
          onUpdateSettings={(s) => updateSettings(activeProfile.id, s)}
          onReorderCategories={(order) => reorderCategories(activeProfile.id, order)}
          onAddCustomPictogram={(word, imageUrl, categoryId) =>
            addCustomPictogram(activeProfile.id, { word, imageUrl, categoryId })
          }
          onRemoveCustomPictogram={(id) => removeCustomPictogram(activeProfile.id, id)}
          onToggleHide={(id) => toggleHidePictogram(activeProfile.id, id)}
          onToggleHideCustom={(id) => toggleHideCustomPictogram(activeProfile.id, id)}
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
