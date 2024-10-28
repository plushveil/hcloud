import Image from './Service~Image.mjs'
import ServiceOnServer from './ServiceOnServer.mjs'

import * as utils from '../../utils/utils.mjs'

export default class Service {
  /**
   * The name of the service.
   */
  name

  /**
   * The hostname of the service.
   */
  hostname

  /**
   * The ports of the service.
   * @type {string[]}
   */
  ports

  /**
   * The uris of the service.
   * @type {string[]}
   */
  uris

  /**
   * The volumes of the service.
   * @type {string[]}
   */
  volumes

  /**
   * The servers of the service.
   * @type {import('./Server.mjs').default[]}
   */
  servers

  /**
   * The images of the service.
   * @type {Image[]}
   */
  images

  /**
   * The HCloudYAML instance.
   * @type {import('./HCloud.mjs').default}
   */
  #hcloud

  /**
   * The raw YAML data of the service.
   */
  #yaml

  /**
   * Creates a new server instance.
   * @param {import('../HCloudYAML/Service.mjs').default} service - The data of the SSH key.
   * @param {import('./HCloud.mjs').default} hcloud - The HCloudYAML instance.
   */
  constructor (service, hcloud) {
    this.name = service.name
    this.hostname = utils.toResourceString(this.name).replace(/_/g, '-')
    this.ports = service.ports
    this.uris = service.uris
    this.volumes = service.volumes

    this.#hcloud = hcloud
    this.#yaml = service
  }

  /**
   * Parses the service.
   */
  async parse () {
    this.servers = await this.#hcloud.servers.filter(server => server.services.includes(this.name))
    this.images = await this.parseImages()
  }

  /**
   * Retrieves the service configuration for a server.
   * @param {import('./Server.mjs').default} server - The server to load the service on.
   * @returns {Promise<object>} The service configuration.
   */
  async load (server) {
    const serviceOnServer = new ServiceOnServer(this, server)
    await serviceOnServer.parse()
    return serviceOnServer
  }

  /**
   * Parses the images of the service.
   * @returns {Promise<Image[]>} The images of the service.
   */
  async parseImages () {
    const imageStrings = (await utils.renderObj(this.#yaml.images, this.#hcloud.params)).map(image => new Image(image))
    const images = []
    for (const imageString of imageStrings) {
      try {
        images.push(...(await imageString.parse()))
      } catch (err) {
        err.message = `Invalid service configuration in "${this.name}". ${err.message}\n    in "${this.#hcloud.yaml.file}"`
        throw err
      }
    }
    return images
  }
}
