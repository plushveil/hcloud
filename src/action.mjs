import core from '@actions/core'
import { apply } from './hcloud.mjs'

import * as utils from './utils/utils.mjs'

try {
  await main()
} catch (err) {
  console.error(err)
  core.setFailed(err.stack || err.message)
  process.exit(1)
}

/**
 * Main action steps.
 */
async function main () {
  if (!process.env.HCLOUD_TOKEN) throw new Error('The "HCLOUD_TOKEN" environment variable is required.')
  core.setSecret(process.env.HCLOUD_TOKEN)

  const config = core.getInput('config') || undefined
  const output = await utils.output('dist')

  await apply(config, output)

  core.setOutput('folder', output)
}
