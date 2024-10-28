import AsyncIterable from '../utils/classes/AsyncIterable.mjs'

import HCloudSchema from '../schema/HCloud.mjs'

import SSHKey from './SSHKey.mjs'
import Server from './Server.mjs'
import Volume from './Volume.mjs'

export default class HCloud {
  /**
   * Creates a new Hetzner Cloud instance.
   * @param {string} config - The path to the Hetzner Cloud YAML configuration file.
   * @param {string} output - The path to the output directory.
   */
  constructor (config, output) {
    this.files = {}
    this.output = output
    this.ready = this.#init(config).then(() => this)
  }

  /**
   * The schema input.
   * @type {import('../schema/HCloud.mjs').default}
   */
  input

  /**
   * Initializes the Hetzner Cloud instance.
   * @param {string} config - The path to the Hetzner Cloud YAML configuration file.
   */
  async #init (config) {
    this.input = new HCloudSchema(config)

    this.files['terraform.tf.json'] = {
      terraform: {
        required_providers: {
          hcloud: {
            source: 'hetznercloud/hcloud',
            version: '1.48.1'
          }
        }
      }
    }

    this.files['provider_hcloud.tf.json'] = {
      provider: {
        hcloud: {
          // eslint-disable-next-line no-template-curly-in-string
          token: '${var.HCLOUD_TOKEN}'
        }
      }
    }

    this.files['variable_hcloud_token.tf.json'] = {
      variable: {
        HCLOUD_TOKEN: {
          description: 'The API token for Hetzner Cloud',
          type: 'string'
        }
      }
    }
  }

  /**
   * A list of all SSH keys that are defined in the HCloud instance.
   * @type {AsyncIterable<SSHKey>}
   */
  get ssh_keys () {
    return new AsyncIterable(this.input.ssh_keys, (item) => (new SSHKey(item, this)).ready)
  }

  /**
   * A list of all servers that are defined in the HCloud instance.
   * @type {AsyncIterable<Server>}
   */
  get servers () {
    return new AsyncIterable(this.input.servers, (item) => (new Server(item, this)).ready)
  }

  /**
   * A list of all volumes that are defined in the HCloud instance.
   * @type {AsyncIterable<Volume>}
   */
  get volumes () {
    return new AsyncIterable(this.input.volumes, (item) => (new Volume(item, this)).ready)
  }
}
