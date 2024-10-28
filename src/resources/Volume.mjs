import * as utils from '../utils/utils.mjs'

export default class Volume {
  /**
   * Creates a new Volume resource instance.
   * @param {import('../schema/Volume.mjs').default} input - The input complying to the Volume schema.
   * @param {import('./HCloud.mjs').default} hcloud - The HCloud instance.
   */
  constructor (input, hcloud) {
    this.files = {}
    this.ready = this.#init(input, hcloud).then(() => this)
  }

  /**
   * Initializes the Volume resource.
   * @param {import('../schema/Volume.mjs').default} input - The input complying to the Volume schema.
   * @param {import('./HCloud.mjs').default} hcloud - The HCloud instance.
   */
  async #init (input, hcloud) {
    this.input = await utils.renderObj(input, { env: process.env, ...hcloud.input })
    this.name = utils.toResourceString(this.input.name)

    this.files[`resource_hcloud_volume_${this.name}.tf.json`] = {
      resource: {
        hcloud_volume: {
          [this.name]: {
            name: this.input.name,
            size: this.input.size,
            location: this.input.location,
            format: 'ext4'
          }
        }
      }
    }

    const servers = await hcloud.servers.filter(server => server.input.volumes?.includes(this.name))
    if (servers.length > 1) throw new Error(`Volume "${this.name}" is attached to multiple servers.`)
    for (const server of servers) {
      const connection = await hcloud.ssh_keys.find(sshKey => server.input.ssh_keys.includes(sshKey.input.name))
      this.files[`resource_hcloud_volume_attachment_${this.name}.tf.json`] = {
        resource: {
          hcloud_volume_attachment: {
            [this.name]: {
              volume_id: `\${hcloud_volume.${this.name}.id}`,
              server_id: `\${hcloud_server.${server.name}.id}`,
              connection: {
                type: 'ssh',
                user: connection.input.user || 'root',
                private_key: `\${var.ssh_key_${connection.name}_private_key}`,
                host: `\${hcloud_server.${server.name}.ipv4_address}`
              },
              provisioner: [
                {
                  'remote-exec': {
                    inline: [
                      `mkdir -p ${this.input.path}`,
                      `mount \${hcloud_volume.${this.name}.linux_device} ${this.input.path}`
                    ]
                  }
                }
              ]
            }
          }
        }
      }
    }
  }
}
