import * as fs from 'node:fs'
import * as path from 'node:path'

import * as utils from './utils.mjs'

const defaultIP = '127.0.0.1'

/**
 * Gets the IP of a server. Defaults to '127.0.0.1'
 * @param {import('../resources/HCloud.mjs').default} hcloud - The Hetzner Cloud configuration.
 * @param {import('../schema/Server.mjs').default} server - The server.
 * @returns {string} The IP.
 */
export default function getServerIp (hcloud, server) {
  const tfstate = path.resolve(hcloud.output, 'terraform.tfstate')
  if (!fs.existsSync(tfstate)) return defaultIP
  try {
    const state = JSON.parse(fs.readFileSync(tfstate, { encoding: 'utf-8' }))
    const resources = state.resources || []
    const resource = resources.find(resource => resource.name === utils.toResourceString(server.name) && resource.type === 'hcloud_server')
    const ip = resource?.instances?.[0]?.attributes?.ipv4_address
    return ip || defaultIP
  } catch (err) {
    return defaultIP
  }
}
