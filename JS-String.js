/**
 * @param {string} string
 * @return {string}
 */
function toCamelCase(string) {
  return string
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
    .replace(/^[A-Z]/, (char) => char.toLowerCase())
    .replace(/[\W]+/, '')
}

/**
 * @param {string} string
 * @return {string}
 */
function capitalize(string) {
  return string[0].toUpperCase() + string.slice(1).toLowerCase()
}

/**
 * Mengecek apakah suatu teks ada di dalam teks lain
 * @param {string} value
 * @param {string[]} searchValues
 * @return {boolean}
 */
function includes(value, ...searchValues) {
  return flat(searchValues).every(searchValue => value.includes(searchValue))
}

/**
 * @param {string} value
 * @param {string[]} searchValues
 * @return {boolean}
 */
function endWith(value, ...searchValues) {
  const { logic = And } = getOptions(searchValues),
    process = searchValue => value.endsWith(searchValue)
  return logic === And
    ? flat(searchValues).every(process)
    : flat(searchValues).some(process)
}

/**
 * @param {number|string} number
 * @param {number} digitCount
 * @return {string}
 */
function formatNumber(number, digitCount = 2) {
  return String(number).padStart(digitCount, '0')
}

/**
 * @param {Object|Object[]} param
 */
function toString(param) {
  return JSON.stringify(param)
}