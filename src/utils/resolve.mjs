import * as path from 'node:path'
import * as fs from 'node:fs'
import * as url from 'node:url'

/**
 * Resolve a path to an absolute path.
 * @param {string} filepath - The path to resolve.
 * @param {string[]} [directories] - The directories to search in.
 * @returns {string} - The resolved path.
 */
export default function resolve (filepath, directories = [process.cwd()]) {
  if (typeof filepath !== 'string' || !filepath) throw new TypeError('Expected a string')
  filepath = filepath.includes('://') ? url.fileURLToPath(filepath) : filepath
  if (path.isAbsolute(filepath)) {
    if (!fs.existsSync(filepath) || !fs.statSync(filepath).isFile()) throw new Error(`File not found: ${filepath}`)
    return filepath
  }

  for (const directory of directories) {
    const resolved = path.resolve(directory, ...filepath.split('/'))
    if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) return resolved
  }

  throw new Error(`File not found: ${filepath}`)
}
