import * as fs from 'node:fs'
import * as path from 'node:path'
import * as crypto from 'node:crypto'

import sshpk from 'sshpk'

import getServerIp from '../utils/getServerIp.mjs'

/**
 * Creates the SSH files for each server. Might generate a new SSH key pair.
 * @param {import('../resources/HCloud.mjs').default} hcloud - The Hetzner Cloud configuration.
 * @param {import('./Server.mjs').default} server - The server.
 */
export async function addKeyPairToServerFolder (hcloud, server) {
  for (const keyName of server.server.input.ssh_keys) {
    /**
     * @type {import('../resources/SSHKey.mjs').default}
     */
    const key = await hcloud.ssh_keys.find(key => key.name === keyName)
    if (key.generateKeys) {
      const keyPair = generateKeyPair(keyName)
      key.input.private_key = keyPair.privateKey
      key.input.public_key = keyPair.publicKey
    }

    if (!key.input.public_key) key.input.public_key = generatePublicKey(key.input.private_key)

    const output = path.resolve(hcloud.output, `hcloud_server_${server.server.name}`, '.ssh')
    if (!fs.existsSync(output)) await fs.promises.mkdir(output, { recursive: true })
    await fs.promises.writeFile(path.resolve(output, keyName), key.input.private_key)
    await fs.promises.writeFile(path.resolve(output, `${keyName}.pub`), key.input.public_key)
    fs.chmodSync(output, 0o700)
    fs.chmodSync(path.resolve(output, keyName), 0o600)
    fs.chmodSync(path.resolve(output, `${keyName}.pub`), 0o644)
  }
}

/**
 * Creates the .ssh/config file.
 * @param {import('../resources/HCloud.mjs').default} hcloud - The Hetzner Cloud configuration.
 * @param {import('./Server.mjs').default[]} servers - The servers.
 */
export async function createConfig (hcloud, servers) {
  const output = path.resolve(hcloud.output, '.ssh')
  if (!fs.existsSync(output)) await fs.promises.mkdir(output, { recursive: true })
  fs.chmodSync(output, 0o700)

  await fs.promises.writeFile(path.resolve(output, 'config'), (await Promise.all(servers.map(async (server) => {
    const keyName = server.server.input.ssh_keys[0]
    const file = path.resolve(hcloud.output, `hcloud_server_${server.server.name}`, '.ssh', keyName)
    if (!fs.existsSync(file)) throw new Error(`The SSH key "${keyName}" for server "${server.server.name}" does not exist.`)
    const key = await hcloud.ssh_keys.find(key => key.name === keyName)

    process.env[`TF_VAR_ssh_key_${keyName}_public_key`] = await fs.promises.readFile(`${file}.pub`, { encoding: 'utf-8' })
    process.env[`TF_VAR_ssh_key_${keyName}_private_key`] = await fs.promises.readFile(`${file}`, { encoding: 'utf-8' })

    return [
      `# ${server.server.name}`,
      `Host ${server.server.hostname}`,
      `  HostName ${getServerIp(hcloud, server.server)}`,
      `  User ${key.user || 'root'}`,
      '  StrictHostKeyChecking no',
      '  UserKnownHostsFile=/dev/null',
      `  IdentityFile ${file}`
    ].join('\n')
  }))).join('\n') + '\n')
  fs.chmodSync(path.resolve(output, 'config'), 0o644)
}

/**
 * Generates a new openSSH key pair.
 * @param {string} [name] - The name of the key.
 * @returns {{ privateKey: string, publicKey: string }} The private and public key.
 */
function generateKeyPair (name = '') {
  const keypair = crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  })

  const privateKey = sshpk.parsePrivateKey(keypair.privateKey, 'pem').toString('ssh')
  const publicKeyParsed = sshpk.parseKey(keypair.publicKey, 'pem')
  if (name) publicKeyParsed.comment = name
  const publicKey = publicKeyParsed.toString('ssh')

  return {
    privateKey,
    publicKey
  }
}

/**
 * Generates a public key from a private key.
 * @param {string} privateKey - The private key.
 * @returns {string} The public key.
 */
export function generatePublicKey (privateKey) {
  const privateKeyParsed = sshpk.parsePrivateKey(privateKey, 'ssh')
  const publicKey = privateKeyParsed.toPublic().toString('ssh')
  return publicKey
}
