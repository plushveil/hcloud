import * as path from 'node:path'
import * as fs from 'node:fs'
import * as url from 'node:url'

import clean from './clean.mjs'

/**
 * Resolve a path to an absolute path.
 * @param {string} folderpath - The path to resolve.
 * @param {object} [options] - The options.
 * @param {boolean} [options.clean] - Whether to create the directory.
 * @param {string[]} [options.keep] - The files to keep.
 * @returns {Promise<string>} - The resolved path.
 */
export default async function output (folderpath, options = {}) {
  options.clean = options.clean ?? false

  if (typeof folderpath !== 'string' || !folderpath) throw new TypeError('Expected a string')
  folderpath = folderpath.includes('://') ? url.fileURLToPath(folderpath) : folderpath
  if (path.isAbsolute(folderpath)) {
    if (!fs.existsSync(folderpath)) fs.mkdirSync(folderpath, { recursive: true })
    if (!fs.statSync(folderpath).isDirectory()) throw new Error(`File not found: ${folderpath}`)
    if (options.clean) await clean(folderpath, { keep: options.keep })
    return folderpath
  }

  const directories = [process.cwd()]
  for (const directory of directories) {
    const resolved = path.resolve(directory, ...folderpath.split('/'))
    if (!fs.existsSync(resolved)) fs.mkdirSync(resolved, { recursive: true })
    if (fs.statSync(resolved).isDirectory()) {
      if (options.clean) await clean(folderpath, { keep: options.keep })
      return resolved
    }
  }

  throw new Error(`File not found: ${folderpath}`)
}
