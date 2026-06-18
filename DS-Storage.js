/** Manipulasi Storage App Script */
class Storage {
  /** @param {PropertiesService.Properties} storage */
  constructor(storage) {
    this.storage = storage
  }

  /**
   * @param {string|string[]} keys
   * @return {MLObject|*|null}
   */
  get(...keys) {
    const keysMLArray = MLArray.init(keys, { flatting: true }),
      process = key => parse(this.storage.getProperty(key) ?? 'null')
    return keysMLArray.mapToObject(key => ({ [key]: process(key) }))
  }

  /**
   * @param {string|string[]|MLObject} keys
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
    if (values) {
      if (keys.length !== values.length)
        throw Error('Panjang keys dan values tidak sama.')
      return parse(keys.map((key, no) => process(key, values[no])))
    }
    return parse(keys.map(process))
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
    let currentDatas = this.get(keys)
    keys.forEach((key, no) => {
      if (isArray(currentDatas[key]))
        currentDatas[key].push(...values[no])
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
 * @param {GoogleAppsScript.Properties.Properties} storage
 * @return {Storage}
 */
function initStorage(storage) {
  return new Storage(storage)
}