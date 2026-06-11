/**
 * Cek apakah sebuah nilai merupakan objek plain, bukan array dan bukan null
 * @param {any} values
 * @return {boolean}
 */
function isObject(...values) {
  return flat(values).every(value => value && typeof value === 'object' && !isArray(value))
}

/**
 * @param {Object[]} array
 * @return {Object}
 */
function toObject(...array) {
  return Object.assign({}, ...flat(array))
}