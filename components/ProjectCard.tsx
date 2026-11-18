import Link from 'next/link'
import type { PlayerProject } from '@/types'

interface ProjectCardProps {
  project: PlayerProject
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const first = project.scenes[0]
  const bg = first?.backgroundColor ?? '#1e293b'
  const fg = first?.textColor ?? '#ffffff'

  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group block overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 transition-all hover:-translate-y-1 hover:border-violet-500/50 hover:shadow-xl hover:shadow-violet-900/20"
    >
      <div
        className="relative flex h-44 items-center justify-center overflow-hidden"
        style={{ backgroundColor: bg }}
      >
        <svg
          viewBox="0 0 100 100"
          className="h-28 w-28 transition-transform duration-500 group-hover:scale-110"
          fill="none"
          stroke={fg}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="50" cy="20" r="9" fill={fg} />
          <line x1="50" y1="30" x2="50" y2="60" />
          <polyline points="50,38 32,52 24,44" />
          <polyline points="50,38 68,28 76,14" />
          <polyline points="50,60 40,76 36,90" />
          <polyline points="50,60 62,76 70,88" />
        </svg>
        <div className="absolute inset-x-0 bottom-0 h-1" style={{ backgroundColor: fg, opacity: 0.25 }} />
        <span className="absolute right-3 top-3 rounded-full bg-black/40 px-2.5 py-1 text-xs font-semibold text-white">
          ▶ {+project.totalDuration.toFixed(1)}s
        </span>
      </div>
      <div className="p-5">
        <h3 className="text-lg font-bold text-white group-hover:text-violet-200">{project.title}</h3>
        {project.description ? (
          <p className="mt-2 line-clamp-2 text-sm text-slate-400">{project.description}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
          <span className="rounded-full bg-slate-800 px-2.5 py-1">{project.scenes.length} scenes</span>
          <span className="rounded-full bg-slate-800 px-2.5 py-1">{project.aspectLabel}</span>
          <span className="rounded-full bg-slate-800 px-2.5 py-1">{project.fps} fps</span>
        </div>
      </div>
    </Link>
  )
}