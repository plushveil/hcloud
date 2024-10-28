export default class AsyncIterable {
  #resolvedItems
  #items
  #map

  /**
   * Creates a new AsyncIterable instance.
   * @param {Array} items - The items.
   * @param {Function} [map] - The map function.
   * @returns {AsyncIterable} The AsyncIterable instance.
   */
  constructor (items, map = (item) => item) {
    this.#items = items
    this.#map = map
  }

  /**
   * Iterates over the items.
   * @yields {any} The item.
   */
  async * [Symbol.asyncIterator] () {
    const items = await this.#get()
    for (const item of items) yield item
  }

  /**
   * Gets the items.
   * @returns {Promise<Array>} The items.
   */
  async #get () {
    if (this.#resolvedItems) return this.#resolvedItems
    const resolvedItems = await Promise.all(this.#items.map((item) => this.#map(item)))
    this.#resolvedItems = resolvedItems
    return this.#resolvedItems
  }

  /**
   * Filters the items.
   * @param {...any} args - The arguments.
   * @returns {Promise<Array>} The filtered items.
   */
  async filter (...args) {
    return (await this.#get()).filter(...args)
  }

  /**
   * Finds an item.
   * @param {...any} args - The arguments.
   * @returns {Promise<any>} The found item.
   */
  async find (...args) {
    return (await this.#get()).find(...args)
  }

  /**
   * Maps the items.
   * @param {...any} args - The arguments.
   * @returns {Promise<Array>} The mapped items.
   */
  async map (...args) {
    return (await this.#get()).map(...args)
  }

  /**
   * Executes a function on each item.
   * @param {...any} args - The arguments.
   * @returns {Promise<void>}
   */
  async forEach (...args) {
    return Promise.allSettled((await this.#get()).map(...args))
  }
}
