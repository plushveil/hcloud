import * as fs from 'node:fs'
import * as path from 'node:path'

/**
 * Creates a folder of "terraform.tf" files for the given Hetzner Cloud YAML configuration file.
 * @param {import('../resources/HCloud.mjs').default} hcloud - The Hetzner Cloud configuration.
 */
export default async function terraform (hcloud) {
  await Promise.all(Object.entries(hcloud.files).map(async ([file, content]) => {
    await fs.promises.writeFile(path.join(hcloud.output, file), JSON.stringify(content, null, 2))
  }))

  for await (const ssh of hcloud.ssh_keys) {
    await Promise.all(Object.entries(ssh.files).map(async ([file, content]) => {
      await fs.promises.writeFile(path.join(hcloud.output, file), JSON.stringify(content, null, 2))
    }))
  }

  for await (const server of hcloud.servers) {
    await Promise.all(Object.entries(server.files).map(async ([file, content]) => {
      await fs.promises.writeFile(path.join(hcloud.output, file), JSON.stringify(content, null, 2))
    }))
  }

  for await (const volume of hcloud.volumes) {
    await Promise.all(Object.entries(volume.files).map(async ([file, content]) => {
      await fs.promises.writeFile(path.join(hcloud.output, file), JSON.stringify(content, null, 2))
    }))
  }
}
