import { useState } from 'react'
import { PictogramItem, PictogramSize } from '../types'

interface Props {
  picto: PictogramItem
  size: PictogramSize
  bgColor: string
  borderColor: string
  onClick: (picto: PictogramItem) => void
}

const sizeMap: Record<PictogramSize, { img: number; text: string; padding: string }> = {
  S: { img: 80, text: 'text-xs', padding: 'p-1.5' },
  M: { img: 110, text: 'text-sm', padding: 'p-2' },
  L: { img: 140, text: 'text-base', padding: 'p-2.5' },
}

export default function PictogramCard({ picto, size, bgColor, borderColor, onClick }: Props) {
  const [imgError, setImgError] = useState(false)
  const s = sizeMap[size]

  return (
    <button
      className={`picto-card flex flex-col items-center rounded-2xl border-2 w-full ${s.padding}`}
      style={{ backgroundColor: bgColor, borderColor }}
      onClick={() => onClick(picto)}
      aria-label={picto.word}
    >
      <div
        className="flex items-center justify-center rounded-xl overflow-hidden bg-white"
        style={{ width: s.img, height: s.img, minWidth: s.img, minHeight: s.img }}
      >
        {imgError ? (
          <span style={{ fontSize: s.img * 0.45 }}>🖼️</span>
        ) : (
          <img
            src={picto.imageUrl}
            alt={picto.word}
            width={s.img}
            height={s.img}
            className="object-contain"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        )}
      </div>
      <span
        className={`${s.text} font-bold mt-1.5 text-center leading-tight`}
        style={{ color: borderColor, maxWidth: s.img + 8, wordBreak: 'break-word' }}
      >
        {picto.word}
      </span>
    </button>
  )
}
