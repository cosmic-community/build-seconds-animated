// app/projects/[slug]/page.tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getProjectBySlug, toPlayerProject } from '@/lib/cosmic'
import VideoPlayer from '@/components/VideoPlayer'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const project = await getProjectBySlug(slug)
  return {
    title: project ? `${project.title} | Build Seconds Animated` : 'Project not found',
  }
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const project = await getProjectBySlug(slug)

  if (!project) {
    notFound()
  }

  const player = toPlayerProject(project)

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <meta
        name="cosmic-context"
        content={JSON.stringify({ object_id: project.id, object_type: project.type })}
      />
      <Link href="/" className="text-sm text-slate-400 hover:text-slate-200">
        ← All projects
      </Link>

      <header className="mb-6 mt-4">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{player.title}</h1>
        {player.description ? (
          <p className="mt-3 max-w-3xl text-slate-300">{player.description}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-200">
            ⏱ {+player.totalDuration.toFixed(1)}s
          </span>
          <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-200">
            🎞️ {player.scenes.length} scenes
          </span>
          <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-200">
            📐 {player.aspectLabel}
          </span>
          <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-200">
            ⚡ {player.fps} fps
          </span>
        </div>
      </header>

      {player.scenes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center text-slate-400">
          This project has no scenes yet. Connect some Scenes to it in Cosmic.
        </div>
      ) : (
        <VideoPlayer project={player} />
      )}
    </div>
  )
}