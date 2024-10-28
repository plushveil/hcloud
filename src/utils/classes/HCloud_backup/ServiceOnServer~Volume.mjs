/**
 * A string representing a volume, usually in the format ${host_path}:${container_path}.
 * For example: /data:/var/lib/postgresql/data. Mounts the host machine's /data directory to the container's /var/lib/postgresql/data directory.
 */
export default class Volume {
  /**
   * The path on the host machine.
   * @type {string}
   */
  host_path

  /**
   * The path in the container.
   * @type {string}
   */
  container_path

  /**
   * Creates a new volume string instance.
   * @param {string} volume - The volume string.
   */
  constructor (volume) {
    if (typeof volume !== 'string' || !volume) throw new Error('Volume must be a string')
    const parts = volume.split(':')

    if (parts.length === 1) {
      this.host_path = volume
      this.container_path = volume
    } else if (parts.length === 2) {
      this.host_path = parts[0]
      this.container_path = parts[1]
    } else {
      throw new Error(`Volume must have 1 or 2 parts. Got ${parts.length} parts in "${volume}".`)
    }
  }
}
