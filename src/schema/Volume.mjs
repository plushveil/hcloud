export default class Volume {
  /**
   * The name of the volume.
   * @type {string}
   */
  name

  /**
   * The size of the volume.
   * @type {number}
   */
  size

  /**
   * The path of the volume.
   * @type {string}
   */
  path

  /**
   * Creates a new volume instance.
   * @param {Volume} volume - The data of the volume.
   */
  constructor (volume) {
    if (volume.name.startsWith('attachment')) throw new Error('Volume name must not start with "attachment"')
    this.name = volume.name
    this.size = volume.size
    this.path = volume.path
  }
}
