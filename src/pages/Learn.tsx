import { Link } from 'react-router-dom'
import { articles } from '../lib/articles'

export default function Learn() {
  return (
    <div className="max-w-3xl mx-auto px-5 py-12">
      <h1 className="text-3xl font-display mb-2">Learn</h1>
      <p className="text-[#c9c2dd] mb-10">
        Plain-language explainers on the astronomy and earth science behind LunaAura —
        what’s established, what’s intuitive interpretation, and how to tell the difference.
      </p>
      <div className="space-y-4">
        {articles.map((a) => (
          <Link
            key={a.slug}
            to={`/learn/${a.slug}`}
            className="block glow-card rounded-2xl p-6 hover:border-[#caa6ff]/40 transition-colors"
          >
            <h2 className="text-xl font-display mb-1">{a.title}</h2>
            <p className="text-[#b6acd1] text-sm">{a.dek}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
