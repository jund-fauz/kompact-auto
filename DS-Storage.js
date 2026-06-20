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
    const keysMLArray = MLArray.init(keys, { flatting: true })
    let result = keysMLArray.mapToObject(key => ({
      [key]: parse(this.storage.getProperty(key) ?? 'null')
    }))
    if (result.values().length > 1)
      return result
    result = result.values()[0]
    if (isObject(result))
      result = initObject(result)
    return result
  }

  /**
   * @param {string|string[]|MLObject} keys
   * @param {Object|Object[]|null} values
   * @return {Storage}
   */
  set(keys, values = null) {
    const process = (key, value) => {
      this.storage.setProperty(key, JSON.stringify(value))
      return { [key]: value }
    }
    if (typeof keys === 'string')
      process(keys, values)
    else if (values) {
      if (keys.length !== values.length)
        throw Error('Panjang keys dan values tidak sama.')
      keys.forEach((key, no) => process(key, values[no]))
    } else
      keys.forEach(process)
    return this
  }

  /**
   * @param {string|string[]|MLArray<string>} keys
   * @param {*|*[]} values
   * @param {{defaultWrapAs: object|array|null}} options
   * @return {Object}
   */
  add(keys, values, options = {}) {
    const { defaultWrapAs = null } = options
    keys = initArray(keys)
    values = lazyWrap(values)
    let currentDatas = this.get(keys)
    if (!(currentDatas instanceof MLObject))
      currentDatas = initObject({ [keys[0]]: currentDatas })
    keys.iterate((key, no) => {
      if (isArray(currentDatas[key]))
        currentDatas[key].push(...values[no])
      else if (isObject(currentDatas[key]))
        currentDatas.set(key, { ...currentDatas[key], ...values[no] })
      else {
        let data
        switch (defaultWrapAs) {
          case object:
            data = { [key]: values[no] }
            break
          case array:
            data = wrap(values[no])
            break
          default:
            data = values[no]
            break
        }
        currentDatas.set(key, data)
      }
    })
    return this.set(currentDatas)
  }

  /**
   * @param {string|string[]} keys
   */
  delete(...keys) {
    initArray(keys, { flatting: true }).iterate(key => this.storage.deleteProperty(key))
    return this
  }

  deleteAll() {
    this.storage.deleteAllProperties()
    return this
  }
}

/**
 * @param {GoogleAppsScript.Properties.Properties} storage
 * @return {Storage}
 */
function initStorage(storage) {
  return new Storage(storage)
}