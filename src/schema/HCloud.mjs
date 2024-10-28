import * as fs from 'node:fs'
import * as path from 'node:path'
import * as url from 'node:url'

import yaml from 'js-yaml'
import Ajv from 'ajv'

import * as utils from '../utils/utils.mjs'

import SSHKey from './SSHKey.mjs'
import Server from './Server.mjs'
import Service from './Service.mjs'
import Volume from './Volume.mjs'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const __root = path.resolve(__dirname, '..', '..')

const schema = JSON.parse(await fs.promises.readFile(path.resolve(__root, 'hcloud.schema.json'), { encoding: 'utf8' }))
const ajv = new Ajv()
const validate = ajv.compile(schema)

/**
 * Parses and validates the given Hetzner Cloud YAML configuration file.
 * @param {string} hcloud - The path to the Hetzner Cloud YAML configuration file.
 * @returns {Promise<HCloud>} - The parsed Hetzner Cloud YAML configuration file.
 */
export default class HCloud {
  /**
   * The SSH keys.
   * @type {SSHKey[]}
   */
  ssh_keys = []

  /**
   * The servers.
   * @type {Server[]}
   */
  servers = []

  /**
   * The services.
   * @type {Service[]}
   */
  services = []

  /**
   * The volumes.
   * @type {Volume[]}
   */
  volumes = []

  /**
   * Creates a new Hetzner Cloud instance.
   * @param {string} config - The path to the Hetzner Cloud YAML configuration file.
   */
  constructor (config) {
    this.file = utils.resolve(config)
    const data = yaml.load(fs.readFileSync(this.file, { encoding: 'utf8' }))
    if (!validate(data)) throw new Error([ajv.errorsText(validate.errors), `in file://${this.file}`].join('\n    '))
    this.ssh_keys = Object.entries(data.ssh_keys).map(([name, sshKey]) => new SSHKey({ name, ...sshKey }))
    this.servers = Object.entries(data.servers).map(([name, server]) => new Server({ name, ...server }))
    this.services = Object.entries(data.services).map(([name, service]) => new Service({ name, ...service }))
    this.volumes = Object.entries(data.volumes || {}).map(([name, volume]) => new Volume({ name, ...volume }))
  }
}
