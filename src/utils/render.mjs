const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor

/**
 * Render a string with the given parameters.
 * @param {content} content - The content to render.
 * @param {object} [params] - The parameters to replace in the content.
 * @returns {Promise<string>} - The rendered content.
 */
export default function render (content, params = {}) {
  const keys = Object.keys(params)
  if (keys.length === 0) return content
  const values = Object.values(params)
  const fn = new AsyncFunction(...keys, `return \`${content}\``)
  return fn(...values)
}
