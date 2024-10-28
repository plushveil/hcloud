/**
 * A string mapping a port from the host machine to a port on the container, usually in the format ${public_port}:${container_port}.
 */
export default class Port {
  /**
   * The public port.
   * @type {string}
   */
  public_port

  /**
   * The container port. If not set, the public port is assumed.
   * @type {string}
   */
  container_port

  /**
   * Creates a new port string instance.
   * @param {string} port - The port string.
   */
  constructor (port) {
    if (typeof port === 'number') port = port.toString()
    if (typeof port !== 'string' || !port) throw new Error('Port must be a string')

    if (port.includes(':')) {
      this.public_port = port.split(':')[0]
      this.container_port = port.split(':')[1]
    } else {
      this.public_port = null
      this.container_port = port
    }
  }
}
