import * as utils from '../utils/utils.mjs'

import * as uriUtils from './utils/uri.mjs'
import getAllImages from './utils/images.mjs'

import * as compose from './docker-compose.mjs'
import * as haproxy from './haproxy.mjs'

export default class Server {
  /**
   * Creates a new service.
   * @param {import('../resources/HCloud.mjs').default} hcloud - The Hetzner Cloud configuration.
   * @param {import('../resources/Server.mjs').default} server - The server.
   */
  constructor (hcloud, server) {
    this.ready = this.#init(hcloud, server).then(() => this)
  }

  /**
   * @type {Service[]} The services.
   */
  services

  /**
   * @type {import('../resources/Server.mjs').default} The server.
   */
  server

  /**
   * Initializes the service.
   * @param {import('../resources/HCloud.mjs').default} hcloud - The Hetzner Cloud configuration.
   * @param {import('../resources/Server.mjs').default} server - The server.
   */
  async #init (hcloud, server) {
    this.server = server
    this.services = []
    for (const serviceName of server.input.services) {
      const service = hcloud.input.services.find(service => service.name === serviceName)
      if (!service) {
        throw new Error([
          `Unknown service "${serviceName}" in server "${server.name}".`,
          `    in file://${hcloud.input.file}`
        ].join('\n'))
      }

      const images = await getAllImages(await utils.renderObj(service.images, { env: process.env, ...hcloud.input }))
      for (let i = 0; i < images.length; i++) {
        const image = images[i]
        const name = utils.toHostnameString(`${server.hostname}-${service.name}-${i}`)
        this.services.push(await (new Service(hcloud, server, service, image, name)).ready)
      }
    }
  }

  /**
   * Retrieves the Docker Compose file for the server.
   * @param {import('../resources/HCloud.mjs').default} hcloud - The Hetzner Cloud configuration.
   * @param {Server[]} servers - The servers.
   * @returns {Promise<object>} The Docker Compose file.
   */
  getDockerCompose (hcloud, servers) {
    return compose.getDockerComposeForServer(hcloud, servers, this)
  }

  /**
   * Retrieves the haproxy configuration for the server.
   * @param {import('../resources/HCloud.mjs').default} hcloud - The Hetzner Cloud configuration.
   * @param {Server[]} servers - The servers.
   * @returns {Promise<object>} The haproxy configuration.
   */
  getHaproxyConfig (hcloud, servers) {
    return haproxy.getConfigForServer(hcloud, servers, this)
  }
}

class Service {
  /**
   * Creates a new service.
   * @param {import('../resources/HCloud.mjs').default} hcloud - The Hetzner Cloud configuration.
   * @param {import('../resources/Server.mjs').default} server - The server.
   * @param {import('../schema/Service.mjs').default} service - The service.
   * @param {import('./utils/images.mjs').Image} image - The image.
   * @param {string} name - The name.
   */
  constructor (hcloud, server, service, image, name) {
    this.ready = this.#init(hcloud, server, service, image, name).then(() => this)
  }

  /**
   * @type {import('../schema/Service.mjs').default} The service.
   */
  input

  /**
   * Initializes the service.
   * @param {import('../resources/HCloud.mjs').default} hcloud - The Hetzner Cloud configuration.
   * @param {import('../resources/Server.mjs').default} server - The server.
   * @param {import('../schema/Service.mjs').default} service - The service.
   * @param {import('./utils/images.mjs').Image} image - The image.
   * @param {string} name - The name.
   */
  async #init (hcloud, server, service, image, name) {
    const context = { env: process.env, ...hcloud.input, server, service, image, hostname: name }
    this.environment = await utils.renderObj({ ...server.input.environment, ...service.environment }, context)
    this.input = await utils.renderObj(service, context)
    this.serverName = server.name
    this.name = name

    this.image = image
    this.imageUri = `${image.registry}/${image.organization}/${image.repository}:${image.tag}`

    this.access = []
    for (const port of (this.input.ports || [])) {
      const parts = port.split(':')
      if (parts.length === 1) {
        this.access.push({ mode: 'tcp', port: { cluster: null, host: parts[0], container: parts[0] } })
      } else if (parts.length === 2) {
        this.access.push({ mode: 'tcp', port: { cluster: null, host: parts[0], container: parts[1] } })
      } else if (parts.length === 3) {
        this.access.push({ mode: 'tcp', port: { cluster: parts[0], host: parts[1], container: parts[2] } })
      } else {
        throw new Error(`Invalid service configuration in "${server.name}" for service "${service.name}". Invalid port "${port}".`)
      }
    }

    for (const uri of (this.input.uris || [])) {
      const hostname = uriUtils.getHostname(uri)
      const path = uriUtils.getPath(uri)
      for (const port of uriUtils.getPorts(uri)) {
        this.access.push({
          mode: 'http',
          hostname,
          port,
          path
        })
      }
    }
  }
}
