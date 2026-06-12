/**
 * Cek apakah sebuah nilai merupakan objek plain, bukan array dan bukan null
 * @param {any} values
 * @return {boolean}
 */
function isObject(...values) {
  return flat(values).every(value => value && typeof value === 'object' && !isArray(value))
}

/**
 * @param {Object[]|string} param
 * @return {Object}
 */
function toObject(param) {
  if (typeof param === 'string')
    return JSON.parse(param)
  return Object.assign({}, ...param)
}