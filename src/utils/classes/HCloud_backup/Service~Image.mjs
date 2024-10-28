/**
 * A string representing one or more images, usually in the format ghcr.io/${org}/${repo}:${tag}.
 * Each field can be omitted. Only an empty string is not allowed.
 */
export default class Image {
  /**
   * The registry of the image. If not set "ghcr.io" is assumed.
   * @type {string|null}
   */
  registry

  /**
   * The organization of the image. If not set "${env.GITHUB_ACTOR}" is assumed.
   * @type {string}
   */
  organization

  /**
   * The repository of the image. If not set "${env.GITHUB_REF_NAME}" is assumed.
   * The "*" character is a wildcard, which matches all repositories of the organization.
   */
  repository

  /**
   * The tag of the image. If not set the image string is invalid.
   * The "*" character is a wildcard, which matches all tags of the repository.
   * @type {string}
   */
  tag

  /**
   * Creates a new image string instance.
   * @param {string} image - The image string.
   */
  constructor (image) {
    if (typeof image !== 'string' || !image) throw new Error('Image must be a string')
    this.yaml = image

    if (image.includes(':')) {
      this.tag = image.split(':').slice(1).join(':')
      image = image.replace(`:${this.tag}`, '')
    } else {
      this.tag = image
      image = ''
    }

    const slashes = image.split('/').length - 1
    if (slashes === 0) {
      this.registry = 'ghcr.io'
      this.organization = '*'
      this.repository = image || '*'
    } else if (slashes === 1) {
      this.registry = 'ghcr.io'
      this.organization = image.split('/')[0]
      this.repository = image.split('/').slice(1).join('/')
    } else {
      this.registry = image.split('/')[0]
      this.organization = image.split('/')[1]
      this.repository = image.split('/').slice(2).join('/')
    }
  }

  /**
   * Returns a list of resolved images.
   * @returns {Promise<Image[]>} The resolved images.
   */
  async parse () {
    const images = []
    if (this.organization === '*') this.organization = process.env.GITHUB_ACTOR || '*'
    if (this.repository === '*') this.repository = process.env.GITHUB_REF_NAME || '*'

    if (this.organization.includes('*')) {
      throw new Error([
        `The organization wildcard (${this.organization}) can not be resolved. Environment variable "GITHUB_ACTOR" is not set.`,
        `near "${this.yaml}"`
      ].join('\n    '))
    }

    if (this.registry !== 'ghcr.io') {
      const properties = ['repository', 'tag']
      for (const k of properties) {
        if (this[k].includes('*')) {
          throw new Error([
            `The ${k} wildcard (${this[k]}) can not be resolved with registry "${this.registry}".`,
            `near "${this.yaml}"`
          ].join('\n    '))
        }
      }
    } else if (!process.env.GITHUB_TOKEN) {
      const properties = ['repository', 'tag']
      for (const k of properties) {
        if (this[k].includes('*')) {
          throw new Error([
            `The ${k} wildcard (${this[k]}) can not be resolved without a GitHub token. Set the "GITHUB_TOKEN" environment variable.`,
            `near "${this.yaml}"`
          ].join('\n    '))
        }
      }
    }

    const packageNames = this.repository.includes('*') ? await getAllPackages(this.organization) : [this.repository]
    for (const packageName of packageNames) {
      const tags = this.tag.includes('*') ? await getAllTags(this.organization, packageName) : [this.tag]
      for (const tag of tags) {
        images.push(new Image(`${this.registry}/${this.organization}/${packageName}:${tag}`))
      }
    }

    return images
  }
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
  const packages = await (await fetch(`https://api.github.com/${type}/${organization}/packages?package_type=container`, headers)).json()
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
  const versions = await (await fetch(`https://api.github.com/${type}/${organization}/packages/container/${repository}/versions`, headers)).json()

  const tags = []
  for (const version of versions) {
    for (const tag of version.metadata.container.tags) {
      tags.push(tag)
    }
  }

  return tags
}
