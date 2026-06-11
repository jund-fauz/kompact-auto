class Storage {
  /**
   * @param {PropertiesService.Properties} storage
   */
  constructor(storage) {
    /** @type {PropertiesService.Properties} storage */
    this.storage = storage
  }
}

/**
 * Mengambil dari Array atau Local Storage
 * @param {PropertiesService.Properties|Object[]} source
 * @param {number[]|string[]} at
 * @return {Object|Object[]}
 */
function get(source, ...at) {
  if (isArray(source)) {
    const { isOneBasedIndex = true } = getOptions(at)
    at = flat(at)
    if (at.length === 1) {
      const index = at[0]
      return index === 0
        ? undefined
        : index > 0
          ? source[index - isOneBasedIndex]
          : source.at(index)
    }
    return at.map(index => index === 0
      ? undefined
      : index > 0
        ? source[index - isOneBasedIndex]
        : source.at(index))
  }
  at = flat(at)
  const process = key => JSON.parse(source.getProperty(key) ?? 'null')
  if (at.length === 1)
    return process(at)
  else
    return Object.assign({}, ...at.map(key => ({ [key]: process(key) })))
}

/**
 * @param {PropertiesService.Properties} source
 * @param {string|string[]|Object} keys
 * @param {Object|Object[]|null} values
 */
function set(source, keys, values = null) {
  const process = (key, value) => {
    source.setProperty(key, JSON.stringify(value))
    return { [key]: value }
  }

  if (typeof keys === 'string')
    return process(keys, values)[keys]
  if (isObject(keys))
    keys = Object.entries(keys)
  else if (keys.length !== values.length)
    throw Error('Panjang keys dan values tidak sama.')
  return keys.map((key, no) => process(key, values[no]))
}

/**
 * @param {PropertiesService.Properties} source
 * @param {string|string[]} keys
 * @param {Object|Object[]} values
 */
function add(source, keys, values) {
  keys = lazyWrap(keys)
  values = lazyWrap(values)
  const currentDatas = get(source, keys)
  if (!isObject(currentDatas))
    currentDatas = { keys: currentDatas }
  keys.forEach((key, index) => {
    if (isArray(currentDatas[key]))
      push(currentDatas[key], values[index])
    else if (isObject(currentDatas[key]))
      currentDatas[key] = { ...currentDatas[key], ...values[index] }
    else
      currentDatas[key]
  })
  set(source, keys, values)
}

/**
 * @param {PropertiesService.Properties} source
 * @param {string|string[]} keys
 */
function remove(source, keys) {
  keys = lazyWrap(keys)
  keys.forEach(key => source.deleteProperty(key))
}