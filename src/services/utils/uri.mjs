/**
 * Retrieves the hostname from a URI.
 * @param {string} uri - The URI.
 * @returns {string} The hostname.
 */
export function getHostname (uri) {
  if (uri.includes('://')) uri = uri.slice(uri.indexOf('://') + 3)
  return uri.split(/[:/]/)[0]
}

/**
 * Retrieves the path from a URI.
 * @param {string} uri - The URI.
 * @returns {string} The path.
 */
export function getPath (uri) {
  if (uri.includes('://')) uri = uri.slice(uri.indexOf('://') + 3)
  return uri.includes('/') ? `/${uri.split(/\//).slice(1).join('/')}` : '/'
}

/**
 * Retrieves the ports from a URI.
 * @param {string} uri - The URI.
 * @returns {{ cluster: string, host: string, container: string }[]} The ports.
 */
export function getPorts (uri) {
  if (!uri.match(/\d/)) {
    return [
      { cluster: '443', host: '443', container: '443' },
      { cluster: '80', host: '80', container: '80' }
    ]
  }

  if (uri.includes('://')) uri = uri.slice(uri.indexOf('://') + 3)
  if (uri.includes('/')) uri = uri.split('/')[0]
  const parts = uri.split(':')
  if (parts.length === 1) {
    if (parts[0].match(/^\d+$/)) return [{ cluster: null, host: parts[0], container: parts[0] }]
    return [
      { cluster: '443', host: '443', container: '443' },
      { cluster: '80', host: '80', container: '80' }
    ]
  } else if (parts.length === 2) {
    return [{ cluster: null, host: parts[1], container: parts[1] }]
  } else if (parts.length === 3) {
    return [{ cluster: null, host: parts[2], container: parts[3] }]
  } else if (parts.length === 4) {
    return [{ cluster: parts[1], host: parts[2], container: parts[3] }]
  } else {
    throw new Error(`Invalid URI: ${uri}. Can not parse the port.`)
  }
}
