import { useState, useEffect, useRef } from 'react'
import { SentenceItem, InstallPromptEvent, UserProfile } from './types'
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
import { DEFAULT_CATEGORIES } from './data/defaultCategories'
import { CORE_VOCABULARY } from './data/coreVocabulary'

export type { InstallPromptEvent }

export default function App() {
  const {
    profiles,
    activeProfile,
    setActiveProfileId,
    createProfile,
    updateProfile,
    deleteProfile,
    addToHistory,
    toggleHidePictogram,
    addCustomPictogram,
    removeCustomPictogram,
    updateSettings,
    reorderCategories,
  } = useProfiles()

  const { categories, getPictogramsForCategory, searchArasaac } = usePictograms(activeProfile)
  const { speak, isSpeaking } = useSpeech()

  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? 'besoins')
  const [sentence, setSentence] = useState<SentenceItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null)
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

  // Sync active category with profile order
  useEffect(() => {
    if (categories.length > 0 && !categories.find((c) => c.id === activeCategory)) {
      setActiveCategory(categories[0].id)
    }
  }, [categories, activeCategory])

  const pictograms = getPictogramsForCategory(activeCategory)
  const activeCategoryData = DEFAULT_CATEGORIES.find((c) => c.id === activeCategory)

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
    setSentence([])
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

  // Show profile selector if no active profile
  if (!activeProfile) {
    return (
      <ProfileSelector
        profiles={profiles}
        onSelect={handleSelectProfile}
        onCreate={handleCreateProfile}
        onEdit={handleEditProfile}
        onDelete={deleteProfile}
      />
    )
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-violet-700 text-white shrink-0">
        <button
          onClick={() => setActiveProfileId(null)}
          className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-1.5 active:scale-95 transition-transform"
          aria-label="Changer de profil"
        >
          <span className="text-xl">{activeProfile.avatar}</span>
          <span className="font-bold text-sm" style={{ maxWidth: 96, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {activeProfile.name}
          </span>
        </button>

        <div className="flex items-center gap-2">
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
            className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-xl active:scale-95"
            aria-label="Historique"
          >
            📜
          </button>
          <button
            onClick={() => {
              setShowSettings(true)
              setShowHistory(false)
            }}
            className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-xl active:scale-95"
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

      {/* Category tabs */}
      <CategoryTabs
        categories={categories}
        activeId={activeCategory}
        onSelect={(id) => {
          setActiveCategory(id)
          gridRef.current?.scrollTo({ top: 0 })
        }}
      />

      {/* Pictogram grid */}
      <div className="flex-1 overflow-y-auto" ref={gridRef}>
        <div className={`picto-grid-${activeProfile.settings.pictogramSize}`}>
          {pictograms.map((picto) => (
            <PictogramCard
              key={picto.key}
              picto={picto}
              size={activeProfile.settings.pictogramSize}
              bgColor={activeCategoryData?.bgColor ?? '#F3F4F6'}
              borderColor={activeCategoryData?.tabColor ?? '#6B7280'}
              onClick={handlePictogramClick}
            />
          ))}
          {pictograms.length === 0 && (
            <div
              className="flex flex-col items-center justify-center py-16 text-gray-400"
              style={{ gridColumn: '1 / -1' }}
            >
              <span className="text-5xl mb-3">🏞️</span>
              <p className="text-base">Aucun pictogramme dans cette catégorie</p>
              <p className="text-sm mt-1">Ajoutes-en dans les paramètres</p>
            </div>
          )}
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
          searchArasaac={searchArasaac}
        />
      )}
    </div>
  )
}
