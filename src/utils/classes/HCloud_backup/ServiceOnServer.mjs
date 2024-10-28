import Port from './ServiceOnServer~Port.mjs'
import URI from './ServiceOnServer~URI.mjs'
import Volume from './ServiceOnServer~Volume.mjs'

import * as utils from '../../utils/utils.mjs'

export default class ServiceOnServer {
  /**
   * The ports of the service.
   * @type {Port[]}
   */
  ports = []

  /**
   * The proxies of the service.
   * @type {URI[]}
   */
  uris = []

  /**
   * The volumes of the service.
   * @type {Volume[]}
   */
  volumes = []

  /**
   * The service associated with this instance.
   * @type {import('./Service.mjs').default}
   */
  #service

  /**
   * The server associated with this instance.
   * @type {import('./Server.mjs').default}
   */
  #server

  /**
   * The parameters of the service.
   * @type {object}
   */
  #params

  /**
   * Creates a new ServiceOnServer instance.
   * @param {import('./Service.mjs').default} service - The service.
   * @param {import('./Server.mjs').default} server - The server.
   */
  constructor (service, server) {
    this.#service = service
    this.#server = server
    this.#params = { ...this.#service.params, server: { ...this.#server } }
  }

  /**
   * Parses the service.
   */
  async parse () {
    if (this.#service.ports) {
      const ports = []
      for (const image of this.#service.images) ports.push(...(await utils.renderObj(this.#service.ports, { ...this.#params, image })))
      this.ports = ports.filter((port, index, self) => self.indexOf(port) === index).map(port => new Port(port))
    }

    if (this.#service.uris) {
      const uris = []
      for (const image of this.#service.images) uris.push(...(await utils.renderObj(this.#service.uris, { ...this.#params, image })))
      this.uris = uris.filter((uri, index, self) => self.indexOf(uri) === index).map(uri => new URI(uri))
    }

    if (this.#service.volumes) {
      const volumes = []
      for (const image of this.#service.images) volumes.push(...(await utils.renderObj(this.#service.volumes, { ...this.#params, image })))
      this.volumes = volumes.filter((volume, index, self) => self.indexOf(volume) === index).map(volume => new Volume(volume))
    }
  }
}
