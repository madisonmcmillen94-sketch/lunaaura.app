// Lightweight per-page <title>/<meta description> updates for a React SPA.
// No head-management library needed for something this small -- just write
// straight to the two tags index.html already has. This matters for SEO:
// without it every page shares index.html's generic title/description, so
// search results for every Learn article would look identical.

const DEFAULT_TITLE = 'LunaAura — Lunar, Planetary & Earth Rhythms for Your Nervous System'
const DEFAULT_DESCRIPTION =
  'LunaAura tracks moon phases, planetary transits, and earth activity, translating them into daily guidance for your nervous system, self-knowledge, and diaspora spiritual practice.'

export function setPageMeta({ title, description }: { title: string; description: string }) {
  document.title = title

  let meta = document.querySelector('meta[name="description"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', 'description')
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', description)

  // Reset to the site defaults on unmount so navigating away (e.g. to a
  // gated page) doesn't leave a stale title/description behind.
  return () => {
    document.title = DEFAULT_TITLE
    meta?.setAttribute('content', DEFAULT_DESCRIPTION)
  }
}
