export default function Footer() {
  return (
    <footer className="border-t border-slate-800 py-8 text-center text-sm text-slate-500">
      <p>
        © {new Date().getFullYear()} Build Seconds Animated · Every frame is drawn in code ·
        Content by{' '}
        <a
          href="https://www.cosmicjs.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-violet-300 hover:text-violet-200"
        >
          Cosmic
        </a>
      </p>
    </footer>
  )
}