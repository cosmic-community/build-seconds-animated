import Link from 'next/link'

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
          <span aria-hidden="true">🎬</span>
          <span>Build Seconds Animated</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium text-slate-300">
          <Link href="/" className="hover:text-white">
            Home
          </Link>
          <Link href="/#projects" className="hover:text-white">
            Projects
          </Link>
        </nav>
      </div>
    </header>
  )
}