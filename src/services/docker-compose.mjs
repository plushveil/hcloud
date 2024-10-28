import * as utils from '../utils/utils.mjs'

/**
 * Retrieves the content of a Docker Compose file.
 * @param {import('../resources/HCloud.mjs').default} hcloud - The Hetzner Cloud configuration.
 * @param {import('./Server.mjs').default[]} servers - The servers.
 * @param {import('./Server.mjs').default} server - The server.
 * @returns {Promise<object>} The Docker Compose file content.
 */
export async function getDockerComposeForServer (hcloud, servers, server) {
  const dockerCompose = {
    services: {}
  }

  const hosts = []
  for (const otherServer of servers) {
    if (otherServer === server) continue
    const ip = utils.getServerIp(hcloud, otherServer.server)
    hosts.push(`${otherServer.server.hostname}:${ip}`)
    for (const service of otherServer.services) hosts.push(`${service.name}:${ip}`)
  }

  for (const service of server.services) {
    const ports = service.access.map(access => !access.port.cluster && `${access.port.host}:${access.port.container}`).filter(Boolean)
    dockerCompose.services[service.name] = {
      image: service.imageUri,
      environment: service.environment,
      extra_hosts: hosts,
      restart: 'always',
      ports: ports.length ? ports : undefined
    }

    if (service.input.volumes?.length) {
      dockerCompose.services[service.name].volumes = service.input.volumes
    }
  }

  return dockerCompose
}
