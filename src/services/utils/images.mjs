/**
 * @typedef {object} Image
 * @property {string} registry - The registry.
 * @property {string} organization - The organization.
 * @property {string} repository - The repository.
 * @property {string} tag - The tag.
 */

/**
 * Get all images from the server
 * @param {string[]} imageStrings - The service to get images from.
 * @returns {Promise<Image[]>} - The images.
 */
export default async function getAllImages (imageStrings) {
  const images = []

  for (const imageString of imageStrings) {
    const image = parseImageString(imageString)
    for (const k of ['registry', 'organization', 'repository', 'tag']) {
      if (!image[k]) throw new Error(`The ${k} can not be resolved. near "${imageString}"`)
    }
    if (image.organization === '*') throw new Error(`The organization wildcard (*) can not be resolved, near "${imageString}"`)

    const repositories = image.repository === '*' ? await getAllPackages(image.organization) : [image.repository]
    for (const repository of repositories) {
      const tags = image.tag === '*' ? await getAllTags(image.organization, repository) : [image.tag]
      for (const tag of tags) {
        images.push({
          registry: image.registry,
          organization: image.organization,
          repository,
          tag
        })
      }
    }
  }

  return images
}

/**
 * Returns all repositories of an organization.
 * @param {string} organization - The organization name.
 * @returns {Promise<string[]>} The repositories.
 */
async function getAllPackages (organization) {
  const headers = {
    headers: {
      Authorization: `token ${process.env.GITHUB_TOKEN}`
    }
  }
  const user = await (await fetch(`https://api.github.com/users/${organization}`, headers)).json()
  const type = user.type === 'Organization' ? 'orgs' : 'users'
  const response = await fetch(`https://api.github.com/${type}/${organization}/packages?package_type=container`, headers)
  if (response.status !== 200) throw new Error(`Failed to fetch packages: ${response.statusText}. ${await response.text()}`)
  const packages = await response.json()
  return packages.map(pkg => pkg.name)
}

/**
 * Returns all tags of a repository.
 * @param {string} organization - The organization name.
 * @param {string} repository - The repository name.
 * @returns {Promise<string[]>} The tags.
 */
async function getAllTags (organization, repository) {
  const headers = {
    headers: {
      Authorization: `token ${process.env.GITHUB_TOKEN}`
    }
  }
  const user = await (await fetch(`https://api.github.com/users/${organization}`, headers)).json()
  const type = user.type === 'Organization' ? 'orgs' : 'users'
  const response = await fetch(`https://api.github.com/${type}/${organization}/packages/container/${repository}/versions`, headers)
  if (response.status !== 200) throw new Error(`Failed to fetch versions: ${response.statusText}. ${await response.text()}`)
  const versions = await response.json()

  const tags = []
  for (const version of versions) {
    for (const tag of version.metadata.container.tags) {
      tags.push(tag)
    }
  }

  return tags
}

/**
 * Parse an image string. An image string is in the format ${registry}/${org}/${repo}:${tag}. Where each field can be omitted. Only an empty string is not allowed.
 * @param {string} imageString - The image string.
 * @returns {{registry: string|null, organization: string, repository: string, tag: string}} - The parsed image.
 */
function parseImageString (imageString) {
  if (typeof imageString !== 'string' || !imageString) throw new Error('Image must be a string')

  if (!imageString.includes(':')) {
    return {
      registry: 'ghcr.io',
      organization: process.env.GITHUB_ACTOR,
      repository: process.env.GITHUB_REF_NAME,
      tag: imageString
    }
  }

  const tag = imageString.split(':').slice(1).join(':')
  imageString = imageString.replace(`:${tag}`, '')

  const slashes = imageString.split('/').length - 1
  if (slashes === 0) {
    return {
      registry: 'ghcr.io',
      organization: process.env.GITHUB_ACTOR,
      repository: imageString || process.env.GITHUB_REF_NAME,
      tag
    }
  }

  if (slashes === 1) {
    return {
      registry: 'ghcr.io',
      organization: imageString.split('/')[0],
      repository: imageString.split('/').slice(1).join('/'),
      tag
    }
  }

  return {
    registry: imageString.split('/')[0],
    organization: imageString.split('/')[1],
    repository: imageString.split('/').slice(2).join('/'),
    tag
  }
}
