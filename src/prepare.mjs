import * as fs from 'node:fs'
import * as path from 'node:path'
import * as url from 'node:url'

import yaml from 'js-yaml'

import terraform from './services/terraform.mjs'
import * as ssh from './services/ssh.mjs'

import HCloud from './resources/HCloud.mjs'
import Server from './services/Server.mjs'

import * as utils from './utils/utils.mjs'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const __root = path.resolve(__dirname, '..')

/**
 * Creates a "docker-compose.yml" file for the given Hetzner Cloud YAML configuration file.
 * @param {string} [config='hcloud.yml']  - The path to the Hetzner Cloud YAML configuration file.
 * @param {string} [output='dist'] - The input and output directory.
 */
export default async function prepare (config = 'hcloud.yml', output = 'dist') {
  output = await utils.output(output, { clean: true, keep: ['terraform.tfstate', '.terraform', '.terraform.lock.hcl'] })
  const hcloud = await (new HCloud(config, output)).ready

  // terraform
  await terraform(hcloud)

  const servers = await Promise.all(await hcloud.servers.map((server) => (new Server(hcloud, server)).ready))
  const ports = servers.map(server => server.services.map(service => service.access.map(access => `${access.port.host}:${access.port.host}`)).flat()).flat()
    .filter((port, index, self) => port && self.indexOf(port) === index)

  for (const server of servers) {
    const serverOutput = path.resolve(output, `hcloud_server_${server.server.name}`)
    if (!fs.existsSync(serverOutput)) await fs.promises.mkdir(serverOutput, { recursive: true })

    // docker-compose
    const dockerCompose = await server.getDockerCompose(hcloud, servers, server)
    dockerCompose.services.haproxy = {
      image: 'haproxy:latest',
      volumes: ['./haproxy.cfg:/usr/local/etc/haproxy/haproxy.cfg:ro'],
      restart: 'always',
      ports,
      command: 'haproxy -f /usr/local/etc/haproxy/haproxy.cfg -d',
      extra_hosts: dockerCompose.services[Object.keys(dockerCompose.services)[0]].extra_hosts
    }
    await fs.promises.writeFile(path.resolve(serverOutput, 'docker-compose.yml'), yaml.dump(dockerCompose))

    // haproxy
    const haproxyConfig = await server.getHaproxyConfig(hcloud, servers)
    await fs.promises.writeFile(path.resolve(serverOutput, 'haproxy.cfg'), haproxyConfig.content())

    // cloud-init
    await fs.promises.copyFile(path.resolve(__root, 'cloud-init.yml'), path.resolve(serverOutput, 'cloud-init.yml'))

    // ssh
    await ssh.addKeyPairToServerFolder(hcloud, server)
  }

  // ssh
  await ssh.createConfig(hcloud, servers)
}
