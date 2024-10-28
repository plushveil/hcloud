export default class Service {
  /**
   * The name of the service.
   * @type {string}
   */
  name

  /**
   * The images of the service.
   * @type {string[]}
   */
  images = []

  /**
   * The ports of the service.
   * @type {string[]}
   */
  ports = []

  /**
   * The uris of the service.
   * @type {string[]}
   */
  uris = []

  /**
   * The volumes of the service.
   * @type {string[]}
   */
  volumes = []

  /**
   * The environment variables of the service.
   * @type {object}
   */
  environment = {}

  /**
   * Creates a new service instance.
   * @param {Service} service - The data of the service.
   */
  constructor (service) {
    if (service.name === 'nginx') throw new Error('The service name "nginx" is reserved.')
    this.name = service.name
    this.images = service.images
    this.ports = service.ports
    this.uris = service.uris
    this.volumes = service.volumes
    this.environment = service.environment

    if (this.ports?.length && this.uris?.length) throw new Error(`The service "${this.name}" must only have ports or uris, not both.`)
  }
}
