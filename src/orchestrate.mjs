import * as path from 'node:path'
import * as cmd from 'node:child_process'
import * as fs from 'node:fs'

import HCloud from './resources/HCloud.mjs'

import * as utils from './utils/utils.mjs'

/**
 * Syncs the local files with the remote server.
 * @param {string} [config='hcloud.yml']  - The path to the Hetzner Cloud YAML configuration file.
 * @param {string} [output='dist'] - The input and output directory.
 */
export default async function orchestrate (config, output) {
  output = await utils.output(output)
  const hcloud = await (new HCloud(config, output)).ready

  const result = await hcloud.servers.forEach(server => orchestrateServer(hcloud, server))
  const err = result.find(({ status }) => status === 'rejected')
  if (err) {
    console.error(err.reason)
    process.exit(1)
  }
}

/**
 * Orchestrates the given server.
 * @param {HCloud} hcloud - The Hetzner Cloud instance.
 * @param {import('./resources/Server.mjs').default} server - The server.
 */
async function orchestrateServer (hcloud, server) {
  const { name, hostname } = server
  const output = path.resolve(hcloud.output, `hcloud_server_${name}`)
  const config = `${path.relative(process.cwd(), path.resolve(hcloud.output, '.ssh', 'config').replaceAll(path.sep, '/'))}`
  const ip = utils.getServerIp(hcloud, server)
  if (ip === '127.0.0.1') throw new Error(`The server "${name}" has no IP address.`)

  // wait until ssh is available
  const sshOptions = `-F ${config} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null`
  let inProgressMessage = false
  while (true) {
    const { stdout } = await run(`ssh ${sshOptions} -o ConnectTimeout=5 ${hostname} "cloud-init status"`, { timeout: 180000 })
    if (stdout.trim() !== 'status: running') break
    if (!inProgressMessage) {
      console.log(`Waiting for cloud-init to finish on server "${name}"...`)
      console.log('This may take a few minutes, but you can connect to the server in the meantime.')
      console.log(`$ ssh -F ${config} ${hostname}`)
      inProgressMessage = true
    }
  }

  // copy docker-compose.yml haproxy.cfg
  let hasUpdate = false
  for (const file of ['docker-compose.yml', 'haproxy.cfg']) {
    const remote = (await run(`ssh ${sshOptions} ${hostname} "cat ~/${file}"`, { throw: false })).stdout
    const local = await fs.promises.readFile(path.resolve(output, file), { encoding: 'utf-8' })

    if (remote.trim() !== local.trim()) {
      await run(`scp ${sshOptions} ${path.resolve(output, file)} ${hostname}:~/${file}`)
      hasUpdate = true
    }
  }

  // initiate docker compose if not already running
  if (hasUpdate) {
    const composeFileContent = await fs.promises.readFile(path.resolve(output, 'docker-compose.yml'), { encoding: 'utf-8' })
    if (composeFileContent.includes('ghcr.io')) {
      await run(`ssh ${sshOptions} ${hostname} "echo \\"${process.env.GITHUB_TOKEN}\\" | docker login ghcr.io -u \\"${process.env.GITHUB_ACTOR}\\" --password-stdin"`)
    }
    cmd.execSync(`ssh ${sshOptions} ${hostname} "docker compose -f ~/docker-compose.yml up -d"`, { stdio: 'inherit' })
    cmd.execSync(`ssh ${sshOptions} ${hostname} "docker image prune -a --filter \\"until=24h\\""`, { stdio: 'inherit' })
  }
}

/**
 * Executes the given command until it succeeds.
 * @param {string} command - The command.
 * @param {object} [options] - The options.
 * @param {number} [options.timeout=30000] - The timeout.
 * @param {boolean} [options.throw=true] - Whether to throw an error on failure.
 * @returns {Promise<{ stdout: string, stderr: string }>} The result.
 */
async function run (command, options = {}) {
  options.timeout ||= 10000

  const output = { code: 1, stdout: '', stderr: '' }
  const start = Date.now()
  while (Date.now() - start < options.timeout) {
    await new Promise((resolve) => {
      const stdout = []
      const stderr = []
      const child = cmd.exec(command)
      child.on('error', (err) => { stderr.push(err.toString()) })
      child.stdout.on('data', data => stdout.push(data))
      child.stderr.on('data', data => stderr.push(data))
      child.on('exit', (code) => {
        output.code = code
        output.stdout = stdout.join('')
        output.stderr = stderr.join('')
        return resolve()
      })
    })
    if (output.code === 0) return output
  }

  if (options.throw !== false) {
    throw new Error(`Command "${command}" failed with code ${output.code}.\n${output.stderr}`)
  } else {
    return output
  }
}
