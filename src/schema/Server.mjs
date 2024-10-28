export default class Server {
  /**
   * The name of the server.
   * @type {string}
   */
  name

  /**
   * The type of the server.
   * @type {"CX22"|"CX32"|"CX42"|"CX52"|"CPX11"|"CPX21"|"CPX31"|"CPX41"|"CPX51"|"CAX11"|"CAX21"|"CAX31"|"CAX41"|"CCX13"|"CCX23"|"CCX33"|"CCX43"|"CCX53"|"CCX63"}
   * @see https://docs.hetzner.cloud/#server-types-get-all-server-types
   */
  server_type

  /**
   * The location of the server.
   * @type {"fsn1"|"nbg1"|"hel1"|"ash"|"hil"|"sin"}
   * @see https://docs.hetzner.cloud/#locations-get-all-locations
   */
  location

  /**
   * The names of the SSH keys.
   * @type {string[]}
   */
  ssh_keys = []

  /**
   * The environment variables of the server.
   * @type {object}
   */
  environment = {}

  /**
   * The names of the services.
   * @type {string[]}
   */
  services = []

  /**
   * The names of the volumes.
   * @type {string[]}
   */
  volumes = []

  /**
   * Creates a new server instance.
   * @param {Server} server - The data of the server.
   */
  constructor (server) {
    this.name = server.name
    this.server_type = server.server_type
    this.location = server.location
    this.ssh_keys = server.ssh_keys
    this.environment = server.environment
    this.services = server.services
    this.volumes = server.volumes
  }
}
