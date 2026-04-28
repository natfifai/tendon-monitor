import { builder } from '@builder.io/react'

const apiKey = import.meta.env.VITE_BUILDER_API_KEY

if (apiKey) {
  builder.init(apiKey)
} else {
  console.warn(
    '[builder] Missing VITE_BUILDER_API_KEY. Server driven UI disabled.'
  )
}

export const isBuilderConfigured = !!apiKey
export { builder }
