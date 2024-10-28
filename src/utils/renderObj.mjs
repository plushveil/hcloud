import render from './render.mjs'

/**
 * Renders an object.
 * @param {object} obj - The object to render.
 * @param {object} params - The parameters to pass to the renderer.
 * @returns {Promise<object>} - The rendered object.
 */
export default async function renderObj (obj, params) {
  if (Array.isArray(obj)) return await Promise.all(obj.map(item => renderObj(item, params)))
  if (typeof obj === 'string') return await render(obj, params)
  if (typeof obj !== 'object' || !obj) return obj

  const result = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === 'string') {
      result[k] = await render(v, params)
      continue
    }

    if (v && Array.isArray(v)) {
      result[k] = await Promise.all(v.map(async (item) => {
        if (item && typeof item === 'object') return await renderObj(item, params)
        if (item && typeof item === 'string') return await render(item, params)
        return item
      }))
      continue
    }

    if (v && typeof v === 'object') {
      result[k] = await renderObj(v, params)
      continue
    }

    result[k] = v
  }

  return result
}
