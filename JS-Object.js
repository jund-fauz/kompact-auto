/**
 *  ML: MASTER LIBRARY
 *  @template T
 */
class MLObject {
  /**
   * @param {Object<string, T>} object
   */
  constructor(object) {
    this.object = object
    this.entriesVersion = null
    this.valuesVersion = null
    this.forEach((key, value) => {
      if (!(key in this))
        this[key] = value
    })
  }

  /**
   * Membalikkan { key: value } di Object menjadi { value: key }
   * @return {Object<T, string>}
   */
  reverse() {
    return this.reEntries((key, value) => [value, key])
  }

  /**
   * @return {[string, T][]}
   */
  entries() {
    if (!this.entriesVersion)
      this.entriesVersion = Object.entries(this.object)
    return this.entriesVersion
  }

  /**
   * @param {(key: string, value: T) => [string, T]|boolean} callbackFunc
   * @return {Object<string,T>}
   */
  reEntries(callbackFunc) {
    return Object.fromEntries(this.map(callbackFunc))
  }

  /**
   * @param {(key: string, value: T) => [string, T][]|any} func
   */
  forEach(func) {
    this.entries().forEach(([key, value]) => func(key, value))
  }

  /**
   * @param {(key: string, value: T) => [string, T][]|any} func
   * @return {[string, T][]|any}
   */
  map(func) {
    return this.entries().map(([key, value]) => func(key, value))
  }

  /**
   * @param {(key: string, value: T) => boolean} func
   * @return {MLObject}
   */
  filter(func) {
    return new MLObject(toObject(this.entries().filter(([key, value]) => func(key, value))))
  }

  /**
   * Mendapatkan nilai berdasarkan key (bisa banyak) dari suatu object
   * @param {string|{isDeleteNull: boolean}} keys
   * @return {T|T[]}
   */
  getValue(...keys) {
    const { isDeleteNull = false } = getOptions(keys)
    keys = flat(keys)
    const process = key => this.object[key],
      processArrayValue = value => isArray(value) && value.length === 1 ? value[0] : value
    if (isAllArray(this.values()))
      return Object.values(this.object).map(processArrayValue)
    return keys.length > 1
      ? isDeleteNull
        ? deleteNull(keys.map(process))
        : keys.map(process)
      : process(keys[0])
  }

  values() {
    if (!this.valuesVersion)
      this.valuesVersion = Object.values(this.object)
    return this.valuesVersion
  }

  /**
   * @param {T} values
   * @return {string|string[]}
   */
  getKeyByValue(...values) {
    values = flat(values)
    const result = this.filter((key, value) => values.includes(value)).map(key => key)
    return result.length > 1 ? result : result[0]
  }
}

/**
 * @param {Object} object
 * @return {MLObject}
 */
function initializeObject(object) {
  return new MLObject(object)
}

/**
 * Cek apakah sebuah nilai merupakan objek plain, bukan array dan bukan null
 * @param {any} values
 * @return {boolean}
 */
function isObject(...values) {
  return flat(values).every(value => value && typeof value === 'object' && !isArray(value))
}

/**
 * @param {Object} object
 * @return {boolean}
 */
function isEmpty(object) {
  return !(!!Object.keys(object).length)
}

/**
 * @template T
 * @param {Object<string, T>[]|[string, T]|string} param
 * @return {Object<string, T>}
 */
function toObject(param) {
  if (typeof param === 'string')
    return JSON.parse(param)
  if (isAllArray(...param))
    return Object.fromEntries(param)
  return Object.assign({}, ...param)
}