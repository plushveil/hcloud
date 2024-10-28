import * as utils from '../utils/utils.mjs'

export default class SSHKey {
  /**
   * Creates a new SSHKey resource
   * @param {import('../schema/SSHKey.mjs').default} input - The input complying to the SSHKey schema.
   * @param {import('./HCloud.mjs').default} hcloud - The HCloud instance.
   */
  constructor (input, hcloud) {
    this.files = {}
    this.ready = this.#init(input, hcloud).then(() => this)
  }

  /**
   * The input of the SSHKey resource.
   * @type {import('../schema/SSHKey.mjs').default}
   */
  input

  /**
   * Wether to generate a new key pair.
   * @type {boolean}
   */
  generateKeys = false

  /**
   * Initializes the SSHKey resource.
   * @param {import('../schema/SSHKey.mjs').default} input - The input complying to the SSHKey schema.
   * @param {import('./HCloud.mjs').default} hcloud - The HCloud
   */
  async #init (input, hcloud) {
    const generateKeyPair = () => { this.generateKeys = true; return '' }

    this.input = await utils.renderObj(input, { env: process.env, ...hcloud.input, generateKeyPair })
    this.name = utils.toResourceString(this.input.name)

    this.files[`resource_hcloud_ssh_key_${this.name}.tf.json`] = {
      resource: {
        hcloud_ssh_key: {
          [this.name]: {
            name: this.input.name,
            public_key: `\${var.ssh_key_${this.name}_public_key}`,
          }
        }
      }
    }

    this.files[`variable_ssh_key_${this.name}_public_key.tf.json`] = {
      variable: {
        [`ssh_key_${this.name}_public_key`]: {
          description: `The public key for the SSH key ${this.name}`,
          type: 'string',
          sensitive: true
        }
      }
    }

    this.files[`variable_ssh_key_${this.name}_private_key.tf.json`] = {
      variable: {
        [`ssh_key_${this.name}_private_key`]: {
          description: `The private key for the SSH key ${this.name}`,
          type: 'string',
          sensitive: true
        }
      }
    }
  }
}
