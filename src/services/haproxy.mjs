import util from 'util'
import * as utils from '../utils/utils.mjs'

util.inspect.defaultOptions.depth = null

/**
 * @param {import('../resources/HCloud.mjs').default} hcloud - The Hetzner Cloud configuration.
 * @param {import('./Server.mjs').default[]} servers - A list of all servers.
 * @param {import('./Server.mjs').default} server - The server.
 * @returns {Promise<{ config: object, content: () => string }>} The HAProxy configuration.
 */
export async function getConfigForServer (hcloud, servers, server) {
  const config = {
    global: {
      log: 'stdout format raw local0',
    },
    defaults: {
      timeout: {
        connect: '5s',
        client: '30s',
        server: '30s'
      }
    }
  }

  const backend = []
  const allServices = servers.map(server => server.services).flat().filter((service, index, self) => self.findIndex(s => s.input.name === service.input.name) === index)

  for (const service of allServices) {
    for (let i = 0; i < service.access.length; i++) {
      const access = service.access[i]
      if (!access.port.cluster) continue
      backend.push({
        mode: access.mode,
        name: `${access.mode}_cluster_${utils.toResourceString(service.input.name)}${service.access.length > 1 ? `_${access.port.cluster}` : ''}`,
        servers: servers.filter(server => server.server.input.services.includes(service.input.name)).map(serviceServer => {
          const isContainerServer = server.server.name === serviceServer.server.name
          const serviceOnServer = serviceServer.services.find(s => s.input.name === service.input.name)

          return {
            name: serviceServer.server.hostname,
            address: `${serviceOnServer.name}:${isContainerServer ? access.port.container : access.port.cluster}`,
            check: true
          }
        })
      })
    }
  }

  for (const service of server.services) {
    for (let i = 0; i < service.access.length; i++) {
      const access = service.access[i]
      if (!access.port.cluster) continue

      backend.push({
        mode: access.mode,
        name: `${access.mode}_backend_${utils.toResourceString(service.input.name)}${service.access.length > 1 ? `_${access.port.cluster}` : ''}`,
        servers: [
          {
            name: server.server.hostname,
            address: `${service.name}:${access.port.container}`,
            check: true
          }
        ]
      })
    }
  }

  const frontend = []
  const ports = servers.map(server => server.services.map(service => service.access.map(access => access.port.cluster)).flat()).flat()
    .filter((port, index, self) => port && self.indexOf(port) === index)

  for (const port of ports) {
    const servicesOnPort = servers.map(server => server.services).flat().filter(service => service.access.some(access => access.port.cluster === port))
    const accesses = servicesOnPort.map(service => service.access.find(access => access.port.cluster === port))
    const modes = accesses.map(access => access.mode).filter((mode, index, self) => self.indexOf(mode) === index)

    for (const mode of modes) {
      const services = servicesOnPort.filter(service => service.access.find(access => access.port.cluster === port && access.mode === mode))
      const servicesOnThisServer = services.filter(service => service.serverName === server.server.name)
      const useBackend = []

      let defaultBackend = (() => {
        const service = servicesOnThisServer[0] || services[0]
        return `${mode}_cluster_${utils.toResourceString(service.input.name)}${service.access.length > 1 ? `_${port}` : ''}`
      })()

      if (mode === 'tcp' && services.length > 1) {
        if (servicesOnThisServer.length > 1) {
          throw new Error(`Service "${servicesOnThisServer[0].name}" is not accessible because multiple services are using the same port: "${port}".`)
        } else {
          defaultBackend = defaultBackend.replace(`${mode}_cluster_`, `${mode}_backend_`)
        }
      }

      if (mode === 'http' && services.length > 1) {
        useBackend.push(...[
          ...services.map((service) => {
            const conditions = []
            const access = service.access.find(access => mode === access.mode && access.port.cluster === port)
            const isServiceOnServer = server.services.find(s => s.input.name === service.input.name)
            const suffix = service.access.length > 1 ? `_${port}` : ''

            if (!isServiceOnServer) {
              conditions.push({
                backend: `${access.mode}_cluster_${utils.toResourceString(service.input.name)}${suffix}`,
                condition: `if { hdr(host) -i ${service.name} }`
              })
            }

            const ifs = []
            if (access.hostname) ifs.push(`hdr(host) -i ${access.hostname}`)
            if (access.path) ifs.push(`path_beg ${access.path}`)
            if (ifs.length > 0) {
              conditions.push({
                backend: `${access.mode}_${isServiceOnServer ? 'backend' : 'cluster'}_${utils.toResourceString(service.input.name)}${suffix}`,
                condition: `if { ${ifs.join(' } { ')} }`
              })
            }

            return conditions
          }).flat(),
          ...services.filter((service, index, self) => self.findIndex(s => s.input.name === service.input.name) === index).map((service) => {
            const suffix = service.access.length > 1 ? `_${port}` : ''
            return {
              backend: `${mode}_cluster_${utils.toResourceString(service.input.name)}${suffix}`,
              condition: `if { hdr(host) -i ${service.input.name} }`
            }
          })
        ].sort((a, b) => b.condition?.length - a.condition?.length))
      }

      frontend.push({
        name: `${mode}_front_${port}`,
        bind: `*:${port}`,
        mode,
        use_backend: useBackend,
        default_backend: defaultBackend
      })
    }
  }

  const result = { ...config, frontend, backend }
  return {
    config: result,
    content: () => convertToHAProxyConfig(result)
  }
}

/**
 * Converts the given JSON to a HAProxy configuration.
 * @param {object} json - The JSON.
 * @returns {string} The HAProxy configuration.
 */
function convertToHAProxyConfig (json) {
  let config = ''

  // Global Section
  config += 'global\n'
  for (const [key, value] of Object.entries(json.global)) {
    config += `    ${key} ${value}\n`
  }

  // Defaults Section
  config += '\ndefaults\n'
  for (const [key, value] of Object.entries(json.defaults)) {
    if (typeof value === 'object') {
      for (const [subKey, subValue] of Object.entries(value)) {
        config += `    timeout ${subKey} ${subValue}\n`
      }
    } else {
      config += `    ${key} ${value}\n`
    }
  }

  // Frontend Sections
  json.frontend.forEach(front => {
    config += `\nfrontend ${front.name}\n`
    config += `    bind ${front.bind}\n`
    config += `    mode ${front.mode}\n`
    if (front.use_backend.length > 0) {
      front.use_backend.forEach(backend => {
        config += `    use_backend ${backend.backend}${backend.condition ? ` ${backend.condition}` : ''}\n`
      })
    }
    config += `    default_backend ${front.default_backend}\n`
  })

  // Backend Sections
  json.backend.forEach(back => {
    config += `\nbackend ${back.name}\n`
    config += `    mode ${back.mode}\n`
    back.servers.forEach(server => {
      config += `    server ${server.name} ${server.address} check\n`
    })
  })

  return config
}
