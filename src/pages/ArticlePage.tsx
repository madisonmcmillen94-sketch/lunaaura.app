import { Link, useParams } from 'react-router-dom'
import { getArticle } from '../lib/articles'

export default function ArticlePage() {
  const { slug } = useParams()
  const article = slug ? getArticle(slug) : undefined

  if (!article) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-12">
        <p className="text-[#c9c2dd]">Article not found.</p>
        <Link to="/learn" className="text-[#caa6ff] underline">
          Back to Learn
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-12">
      <Link to="/learn" className="text-sm text-[#b6acd1] hover:text-[#e9d9ff]">
        ← Learn
      </Link>
      <h1 className="text-3xl font-display mt-4 mb-2">{article.title}</h1>
      <p className="text-[#b6acd1] mb-8">{article.dek}</p>
      <div className="space-y-4 text-[#dcd6ec] leading-relaxed">
        {article.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </div>
  )
}
