import Link from 'next/link'
import { getProjects, toPlayerProject } from '@/lib/cosmic'
import ProjectCard from '@/components/ProjectCard'
import VideoPlayer from '@/components/VideoPlayer'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const projects = await getProjects()
  const players = projects.map(toPlayerProject)
  const featured =
    players.find((p) => p.slug === 'stickman-animation' && p.scenes.length > 0) ??
    players.find((p) => p.scenes.length > 0)

  return (
    <div>
      <section className="relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/30 via-slate-950 to-fuchsia-900/20" />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200">
            🎬 100% code-generated · no video files
          </p>
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-6xl">
            Build{' '}
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Seconds
            </span>{' '}
            Animated
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-300">
            Short animated videos drawn live on a canvas from your Cosmic content. A procedural
            stickman walks, jumps, dances and waves, and you can export it as a WebM file.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {featured ? (
              <Link
                href={`/projects/${featured.slug}`}
                className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
              >
                ▶ Open featured project
              </Link>
            ) : null}
            <a
              href="#projects"
              className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800"
            >
              Browse all projects
            </a>
          </div>
        </div>
      </section>

      {featured ? (
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-fuchsia-300">
                Featured
              </p>
              <h2 className="text-2xl font-bold">{featured.title}</h2>
            </div>
            <Link
              href={`/projects/${featured.slug}`}
              className="text-sm font-medium text-violet-300 hover:text-violet-200"
            >
              View project page →
            </Link>
          </div>
          <VideoPlayer project={featured} />
        </section>
      ) : null}

      <section id="projects" className="mx-auto max-w-6xl px-4 pb-20 pt-4 sm:px-6">
        <h2 className="mb-6 text-2xl font-bold">All Video Projects</h2>
        {players.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center text-slate-400">
            No video projects yet. Add some in your Cosmic dashboard.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {players.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}