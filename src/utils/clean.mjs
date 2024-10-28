import * as fs from 'fs'
import * as path from 'path'

/**
 * Removes all the files in the given directory
 * @param {string} directory - The directory to clean
 * @param {object} [options] - The options
 * @param {string[]} [options.keep] - The files to keep
 */
export default async function clean (directory, options = {}) {
  if (!fs.existsSync(directory)) return
  if (!options?.keep?.length) {
    await fs.promises.rm(directory, { recursive: true })
    await fs.promises.mkdir(directory)
  } else {
    for (const dirent of await fs.promises.readdir(directory, { withFileTypes: true })) {
      if (options.keep.includes(dirent.name)) continue
      if (dirent.isDirectory()) {
        await clean(path.resolve(directory, dirent.name), options)
        const files = await fs.promises.readdir(path.resolve(directory, dirent.name))
        if (!files.length) await fs.promises.rmdir(path.resolve(directory, dirent.name))
      } else {
        await fs.promises.unlink(path.resolve(directory, dirent.name))
      }
    }
  }
}
