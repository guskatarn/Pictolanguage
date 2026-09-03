import { useState } from 'react'
import { UserProfile, PictogramSize, Category } from '../types'
import { ImportMode, ImportOutcome } from '../hooks/useProfiles'
import { fileToStoredImage, remoteImageToStoredImage, isStoredLocally } from '../utils/image'
import BackupTab from './BackupTab'
import CategoryManager from './CategoryManager'

interface Props {
  profile: UserProfile
  categories: Category[]
  onClose: () => void
  onUpdateSettings: (settings: Partial<UserProfile['settings']>) => void
  onReorderCategories: (order: string[]) => void
  /** Renvoie `false` si l'ajout n'a pas pu être enregistré (quota saturé). */
  onAddCustomPictogram: (word: string, imageUrl: string, categoryId: string) => boolean
  onRemoveCustomPictogram: (id: string) => void
  onToggleHide: (pictoId: number) => void
  onToggleHideCustom: (customId: string) => void
  searchArasaac: (keyword: string) => Promise<{ arasaacId?: number; word: string; imageUrl: string }[]>
  usedBytes: number
  onExportData: () => void
  onImportData: (raw: string, mode: ImportMode) => ImportOutcome
}

type Tab = 'display' | 'voice' | 'categories' | 'custom' | 'backup'

export default function SettingsPanel({
  profile,
  categories,
  onClose,
  onUpdateSettings,
  onReorderCategories,
  onAddCustomPictogram,
  onRemoveCustomPictogram,
  onToggleHide,
  onToggleHideCustom,
  searchArasaac,
  usedBytes,
  onExportData,
  onImportData,
}: Props) {
  // Les vues (« Favoris ») ne peuvent pas accueillir de pictogramme : les
  // exclure ici évite qu'un ajout disparaisse dans une catégorie inexistante.
  const storageCategories = categories.filter((c) => !c.isView)

  const [activeTab, setActiveTab] = useState<Tab>('display')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{ arasaacId?: number; word: string; imageUrl: string }[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [customWord, setCustomWord] = useState('')
  const [customCategory, setCustomCategory] = useState(storageCategories[0]?.id ?? '')
  const [customImageUrl, setCustomImageUrl] = useState('')
  const [customError, setCustomError] = useState<string | null>(null)
  const [isPreparingImage, setIsPreparingImage] = useState(false)
  const [isSavingCustom, setIsSavingCustom] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setIsSearching(true)
    const results = await searchArasaac(searchQuery)
    setSearchResults(results)
    setIsSearching(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // Remise à zéro du champ : re-choisir le même fichier doit redéclencher `change`.
    e.target.value = ''
    if (!file) return
    setCustomError(null)
    setIsPreparingImage(true)
    try {
      // La photo est redimensionnée et ré-encodée avant tout stockage : une
      // image brute d'appareil photo saturerait le quota localStorage à elle seule.
      setCustomImageUrl(await fileToStoredImage(file))
    } catch (err) {
      setCustomImageUrl('')
      setCustomError(err instanceof Error ? err.message : 'Image inutilisable.')
    } finally {
      setIsPreparingImage(false)
    }
  }

  const handleAddCustom = async () => {
    if (!customWord.trim() || !customImageUrl || !customCategory) return
    setCustomError(null)
    setIsSavingCustom(true)
    try {
      // Un pictogramme choisi dans la recherche ARASAAC n'est encore qu'une URL
      // distante : on rapatrie l'image pour qu'il reste affichable hors ligne.
      const storedImage = isStoredLocally(customImageUrl)
        ? customImageUrl
        : await remoteImageToStoredImage(customImageUrl)
      // En cas d'échec, le message de quota est porté par l'alerte globale.
      if (!onAddCustomPictogram(customWord.trim(), storedImage, customCategory)) return
      setCustomWord('')
      setCustomImageUrl('')
    } catch (err) {
      setCustomError(err instanceof Error ? err.message : 'Ajout impossible.')
    } finally {
      setIsSavingCustom(false)
    }
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'display', label: 'Affichage', icon: '🖼️' },
    { id: 'voice', label: 'Voix', icon: '🔊' },
    { id: 'categories', label: 'Catégories', icon: '📂' },
    { id: 'custom', label: 'Ajouter', icon: '➕' },
    { id: 'backup', label: 'Sauvegarde', icon: '💾' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm h-full flex flex-col shadow-2xl fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-violet-600 text-white shrink-0">
          <h2 className="text-lg font-bold">⚙️ Paramètres</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 px-1.5 py-2 bg-violet-50 shrink-0 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`shrink-0 flex flex-col items-center px-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === t.id
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-500 hover:bg-violet-100'
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Display Tab */}
          {activeTab === 'display' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-2">
                  Taille des pictogrammes
                </label>
                <div className="flex gap-2">
                  {(['S', 'M', 'L'] as PictogramSize[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => onUpdateSettings({ pictogramSize: s })}
                      className={`flex-1 py-3 rounded-xl font-bold text-lg border-2 transition-all ${
                        profile.settings.pictogramSize === s
                          ? 'bg-violet-600 text-white border-violet-600'
                          : 'bg-white text-gray-600 border-gray-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <button
                  onClick={() => onUpdateSettings({ showCoreBar: !profile.settings.showCoreBar })}
                  className="w-full flex items-center justify-between bg-gray-50 rounded-xl p-3 border border-gray-100"
                >
                  <span className="text-left">
                    <span className="text-sm font-bold text-gray-700 block">
                      Barre de mots rapides
                    </span>
                    <span className="text-xs text-gray-500">
                      Mots fréquents (moi, veux, stop, oui, non...) toujours visibles
                    </span>
                  </span>
                  <span
                    className={`shrink-0 w-11 h-6 rounded-full relative transition-colors ${
                      profile.settings.showCoreBar ? 'bg-violet-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        profile.settings.showCoreBar ? 'translate-x-[22px]' : 'translate-x-0.5'
                      }`}
                    />
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Voice Tab */}
          {activeTab === 'voice' && (
            <div className="space-y-5">
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1">
                  Vitesse de la voix: {profile.settings.voiceRate.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={profile.settings.voiceRate}
                  onChange={(e) => onUpdateSettings({ voiceRate: Number(e.target.value) })}
                  className="w-full accent-violet-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                  <span>Lent</span>
                  <span>Rapide</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1">
                  Volume: {Math.round(profile.settings.voiceVolume * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={profile.settings.voiceVolume}
                  onChange={(e) => onUpdateSettings({ voiceVolume: Number(e.target.value) })}
                  className="w-full accent-violet-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                  <span>🔇</span>
                  <span>🔊</span>
                </div>
              </div>
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <CategoryManager
              profile={profile}
              categories={storageCategories}
              onReorderCategories={onReorderCategories}
              onToggleHide={onToggleHide}
              onToggleHideCustom={onToggleHideCustom}
            />
          )}

          {/* Add Custom Tab */}
          {activeTab === 'custom' && (
            <div className="space-y-4">
              {/* Search ARASAAC */}
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-2">
                  🔍 Rechercher dans ARASAAC
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Ex: chien, musique..."
                    className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="bg-violet-600 text-white rounded-xl px-3 py-2 text-sm font-bold disabled:opacity-50"
                  >
                    {isSearching ? '...' : 'OK'}
                  </button>
                </div>

                {searchResults.length > 0 && (
                  <div className="mt-2 grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                    {searchResults.map((r, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setCustomImageUrl(r.imageUrl)
                          setCustomWord(r.word)
                        }}
                        className={`flex flex-col items-center p-1.5 rounded-xl border-2 text-xs font-bold transition-all ${
                          customImageUrl === r.imageUrl
                            ? 'border-violet-500 bg-violet-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <img
                          src={r.imageUrl}
                          alt={r.word}
                          className="w-12 h-12 object-contain"
                        />
                        <span className="text-gray-700 text-center leading-tight mt-0.5 truncate w-full">
                          {r.word}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm font-bold text-gray-700 mb-2">📷 Ou charger une image</p>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="text-sm w-full" />
                {isPreparingImage && (
                  <p className="text-xs text-violet-600 font-bold mt-1.5">
                    Préparation de l'image…
                  </p>
                )}
              </div>

              {customImageUrl && (
                <div className="flex items-center gap-3 bg-violet-50 rounded-xl p-3">
                  <img src={customImageUrl} alt="preview" className="w-16 h-16 object-contain rounded-lg bg-white" />
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={customWord}
                      onChange={(e) => setCustomWord(e.target.value)}
                      placeholder="Mot..."
                      className="w-full border-2 border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:border-violet-400 focus:outline-none"
                    />
                    <select
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:border-violet-400 focus:outline-none"
                    >
                      {storageCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {customError && (
                <p role="alert" className="text-xs font-bold text-red-700 bg-red-50 rounded-lg p-2.5 leading-snug">
                  {customError}
                </p>
              )}

              <button
                onClick={handleAddCustom}
                disabled={
                  !customWord.trim() ||
                  !customImageUrl ||
                  !customCategory ||
                  isPreparingImage ||
                  isSavingCustom
                }
                className="w-full bg-violet-600 text-white rounded-xl py-3 font-bold text-base disabled:opacity-40 active:scale-95"
              >
                {isSavingCustom ? 'Enregistrement…' : '➕ Ajouter ce pictogramme'}
              </button>

              {/* Custom pictograms list */}
              {profile.customPictograms.length > 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm font-bold text-gray-700 mb-2">Mes pictogrammes</p>
                  <div className="space-y-2">
                    {profile.customPictograms.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center gap-3 bg-gray-50 rounded-xl p-2 border border-gray-100"
                      >
                        <img src={c.imageUrl} alt={c.word} className="w-12 h-12 object-contain rounded-lg bg-white" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-gray-800 truncate">{c.word}</p>
                          <p className="text-xs text-gray-500">
                            {storageCategories.find((cat) => cat.id === c.categoryId)?.name ??
                              c.categoryId}
                          </p>
                        </div>
                        <button
                          onClick={() => onRemoveCustomPictogram(c.id)}
                          className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Backup Tab */}
          {activeTab === 'backup' && (
            <BackupTab
              usedBytes={usedBytes}
              onExport={onExportData}
              onImport={onImportData}
            />
          )}
        </div>

        {/*
          Attribution ARASAAC — obligation juridique, pas une politesse : les
          pictogrammes sont sous licence CC BY-NC-SA et l'application les
          redistribue (images embarquées dans public/pictograms/). Voir NOTICE.md.
        */}
        <div className="shrink-0 border-t border-gray-200 bg-gray-50 px-4 py-2.5">
          <p className="text-[11px] leading-snug text-gray-500 text-center">
            Pictogrammes :{' '}
            <a
              href="https://arasaac.org"
              target="_blank"
              rel="noreferrer"
              className="underline text-violet-600"
            >
              ARASAAC
            </a>{' '}
            — auteur Sergio Palao, propriété du Gouvernement d'Aragon, sous licence{' '}
            <a
              href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.fr"
              target="_blank"
              rel="noreferrer"
              className="underline text-violet-600"
            >
              CC BY-NC-SA 4.0
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
