import * as cmd from 'node:child_process'
import * as path from 'node:path'
import * as fs from 'node:fs'

import createConfigs from './prepare.mjs'
import syncServices from './orchestrate.mjs'

/**
 * Creates a "docker-compose.yml" file for the given Hetzner Cloud YAML configuration file.
 * @param {string} [config='hcloud.yml']  - The path to the Hetzner Cloud YAML configuration file.
 * @param {string} [output='dist'] - The input and output directory.
 * @returns {Promise<void>}
 */
export async function prepare (config = 'hcloud.yml', output = 'dist') {
  return createConfigs(config, output)
}

/**
 * Creates a "docker-compose.yml" file for the given Hetzner Cloud YAML configuration file.
 * @param {string} [config='hcloud.yml']  - The path to the Hetzner Cloud YAML configuration file.
 * @param {string} [output='dist'] - The input and output directory.
 */
export async function apply (config = 'hcloud.yml', output = 'dist') {
  await prepare(config, output)
  if (!fs.existsSync(path.resolve(output, '.terraform'))) {
    try {
      cmd.execSync('terraform init', { cwd: output, stdio: 'inherit' })
      cmd.execSync('terraform validate', { cwd: output, stdio: 'inherit' })
    } catch (err) {
      process.exit(1)
    }
  }

  cmd.execSync('terraform apply -auto-approve', { cwd: output, stdio: 'inherit' })
  await prepare(config, output)

  await orchestrate(config, output)
}

/**
 * Syncs the local files with the remote server.
 * @param {string} [config='hcloud.yml']  - The path to the Hetzner Cloud YAML configuration file.
 * @param {string} [output='dist'] - The input and output directory.
 */
export async function orchestrate (config = 'hcloud.yml', output = 'dist') {
  await syncServices(config, output)
}
