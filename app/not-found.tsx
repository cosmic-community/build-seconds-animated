import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-6xl">🎬</p>
      <h1 className="mt-4 text-3xl font-bold">Scene not found</h1>
      <p className="mt-2 text-slate-400">The page you are looking for doesn&apos;t exist.</p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-500"
      >
        Back home
      </Link>
    </div>
  )
}