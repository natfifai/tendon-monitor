import { useEffect, useState } from 'react'
import { BuilderComponent } from '@builder.io/react'
import { builder, isBuilderConfigured } from '../services/builderSetup.js'

export default function LayoutRenderer({ contentId, model = 'page', fallback }) {
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!isBuilderConfigured || !contentId) {
      setLoading(false)
      setNotFound(true)
      return
    }

    let active = true

    builder
      .get(model, { entry: contentId })
      .promise()
      .then((result) => {
        if (!active) return
        if (result) {
          setContent(result)
        } else {
          setNotFound(true)
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('[builder] failed to load content', err)
        if (active) {
          setNotFound(true)
          setLoading(false)
        }
      })

    return () => { active = false }
  }, [contentId, model])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading layout...</p>
      </div>
    )
  }

  if (notFound || !content) {
    return fallback || null
  }

  return <BuilderComponent model={model} content={content} />
}
