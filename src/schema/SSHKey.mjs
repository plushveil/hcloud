export default class SSHKey {
  /**
   * The name of the SSH key.
   * @type {string}
   */
  name

  /**
   * The user of the SSH key.
   * @type {string}
   */
  user

  /**
   * The private key of the SSH key.
   * @type {string}
   */
  private_key

  /**
   * The public key of the SSH key.
   * @type {string}
   */
  public_key

  /**
   * Creates a new SSH key instance.
   * @param {SSHKey} sshKey - The data of the SSH key.
   */
  constructor (sshKey) {
    this.name = sshKey.name
    this.user = sshKey.user
    this.private_key = sshKey.private_key
    this.public_key = sshKey.public_key
  }
}
