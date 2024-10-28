import PortString from './ServiceOnServer~Port.mjs'

/**
 * A string representing a reverse proxy configuration, usually in the format ${strategy}://${domain}:${port_string}/${path}.
 */
export default class URI {
  /**
   * The load balancing strategy.
   * @type {string}
   */
  strategy

  /**
   * The domain configuration.
   * @type {string}
   */
  domain

  /**
   * The port configuration.
   * @type {string}
   */
  port_string

  /**
   * The path to be used for the service.
   * @type {string}
   */
  path

  /**
   * Creates a new proxy string instance.
   * @param {string} proxy - The proxy string.
   */
  constructor (proxy) {
    if (typeof proxy !== 'string' || !proxy) throw new Error('Proxy must be a string')

    if (proxy.includes('://')) {
      this.strategy = proxy.split('://')[0]
      proxy = proxy.split('://').slice(1).join('://')
    } else {
      this.strategy = 'least_conn'
    }

    if (proxy.includes(':')) {
      this.domain = proxy.split(/[:/]/)[0]
      proxy = proxy.slice(this.domain.length)

      this.port_string = new PortString(proxy.split('/')[0].slice(1) || '80')
      proxy = proxy.split('/').slice(1).join('/')
      this.path = '/' + proxy
    } else {
      this.domain = proxy.split('/')[0]
      proxy = proxy.split('/').slice(1).join('/')
      this.path = proxy
      if (!this.path.startsWith('/')) this.path = '/' + this.path
      this.port_string = new PortString('80')
    }
  }
}
