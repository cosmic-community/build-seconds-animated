'use client'

import type { PlayerScene } from '@/types'

interface SceneListProps {
  scenes: PlayerScene[]
  activeIndex: number
  onSelect: (startSeconds: number) => void
}

export default function SceneList({ scenes, activeIndex, onSelect }: SceneListProps) {
  if (!scenes || scenes.length === 0) {
    return null
  }

  let start = 0
  const items = scenes.map((scene, index) => {
    const item = { scene, index, start }
    start += scene.duration
    return item
  })

  return (
    <div>
      <h2 className="mb-3 text-lg font-bold">Scenes</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ scene, index, start: sceneStart }) => {
          const active = index === activeIndex
          return (
            <button
              key={scene.id}
              type="button"
              onClick={() => onSelect(sceneStart)}
              className={`rounded-xl border p-4 text-left transition-all ${
                active
                  ? 'border-violet-500 bg-violet-500/10'
                  : 'border-slate-800 bg-slate-900 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
                  style={{ backgroundColor: scene.backgroundColor, color: scene.textColor }}
                >
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">{scene.headline}</p>
                  <p className="text-xs text-slate-400">
                    {+sceneStart.toFixed(1)}s – {+(sceneStart + scene.duration).toFixed(1)}s
                  </p>
                </div>
              </div>
              {scene.subtext ? (
                <p className="mt-2 line-clamp-2 text-sm text-slate-400">{scene.subtext}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
                <span className="rounded-full bg-slate-800 px-2.5 py-1">✨ {scene.animationStyle}</span>
                {scene.stickmanAction ? (
                  <span className="rounded-full bg-slate-800 px-2.5 py-1">
                    🕺 {scene.stickmanAction}
                  </span>
                ) : null}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}