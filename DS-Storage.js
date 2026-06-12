// noinspection JSUnusedGlobalSymbols

/** Manipulasi Storage App Script */
class Storage {
  /** @param {PropertiesService.Properties} storage */
  constructor(storage) {
    this.storage = storage
  }

  /**
   * @param {string[]} keys
   * @return {Object|Object[]}
   */
  get(...keys) {
    keys = flat(keys)
    const process = key => toObject(this.storage.getProperty(key) ?? 'null')
    if (keys.length === 1)
      return process(keys)
    else
      return Object.assign({}, ...keys.map(key => ({ [key]: process(key) })))
  }

  /**
   * @param {string|string[]|Object} keys
   * @param {Object|Object[]|null} values
   * @return {Object}
   */
  set(keys, values = null) {
    const process = (key, value) => {
      this.storage.setProperty(key, JSON.stringify(value))
      return { [key]: value }
    }
    if (typeof keys === 'string')
      return process(keys, values)[keys]
    if (isObject(keys))
      keys = Object.entries(keys)
    else if (keys.length !== values.length)
      throw Error('Panjang keys dan values tidak sama.')
    return toObject(keys.map((key, no) => process(key, values[no])))
  }

  /**
   * @param {string|string[]} keys
   * @param {Object|Object[]} values
   * @param {Object} options
   * @return {Object}
   */
  add(keys, values, options = {}) {
    const { defaultWrapAs = object } = options
    keys = lazyWrap(keys)
    values = lazyWrap(values)
    let currentDatas = get(keys)
    keys.forEach((key, no) => {
      if (isArray(currentDatas[key]))
        push(currentDatas[key], values[no])
      else if (isObject(currentDatas[key]))
        currentDatas[key] = { ...currentDatas[key], ...values[no] }
      else
        switch (defaultWrapAs) {
          case object:
            currentDatas[key] = { [key]: values[no] }
            break
          case array:
            currentDatas[key] = wrap(values[no])
            break
          default:
            throw Error(`Tipe ${defaultWrapAs} invalid.`)
        }
    })
    return this.set(currentDatas)
  }

  /**
   * @param {string[]} keys
   */
  remove(...keys) {
    keys = flat(keys)
    keys.forEach(key => this.storage.deleteProperty(key))
  }
}

/**
 * @param {PropertiesService.Properties} storage
 * @return {Storage}
 */
function initializeStorage(storage) {
  return new Storage(storage)
}