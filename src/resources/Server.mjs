import * as utils from '../utils/utils.mjs'

export default class Server {
  /**
   * Creates a new Server resource instance.
   * @param {import('../schema/Server.mjs').default} input - The input complying to the Server schema.
   * @param {import('./HCloud.mjs').default} hcloud - The HCloud instance.
   */
  constructor (input, hcloud) {
    this.files = {}
    this.ready = this.#init(input, hcloud).then(() => this)
  }

  /**
   * @type {import('../schema/Server.mjs').default} The input.
   */
  input

  /**
   * Initializes the Server resource.
   * @param {import('../schema/Server.mjs').default} input - The input complying to the Server schema.
   * @param {import('./HCloud.mjs').default} hcloud - The HCloud instance.
   */
  async #init (input, hcloud) {
    this.input = await utils.renderObj(input, { env: process.env, ...hcloud.input })
    this.name = utils.toResourceString(this.input.name)
    this.hostname = utils.toHostnameString(this.input.name)

    this.files[`resource_hcloud_server_${this.name}.tf.json`] = {
      resource: {
        hcloud_server: {
          [this.name]: {
            name: this.hostname,
            server_type: this.input.server_type,
            image: 'debian-12',
            location: this.input.location,
            user_data: `\${file("${hcloud.output}/hcloud_server_${this.name}/cloud-init.yml")}`,
            ssh_keys: this.input.ssh_keys.map(sshname => {
              const name = utils.toResourceString(sshname)
              return `\${hcloud_ssh_key.${name}.id}`
            }),
            public_net: {
              ipv4_enabled: true,
              ipv6_enabled: true
            }
          }
        }
      }
    }
  }
}
