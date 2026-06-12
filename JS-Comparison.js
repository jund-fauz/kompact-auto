/**
 * @param {any} value
 * @param {Object[]} contains
 * @return {boolean}
 */
function containOneOf(value, ...contains) {
  const { caseSensitive = false } = getOptions(contains)
  contains = flat(contains)
  if (isTypeOf('string', value, contains)) {
    value = value.trim()
    return contains.some(val =>
      caseSensitive
        ? value.includes(val)
        : value.toLowerCase().includes(val.toLowerCase())
    )
  } else
    return contains.includes(value)
}

/**
 * @param {Object[]} arr
 * @result {boolean}
 */
function isSame(...arr) {
  return new Set(flat(arr)).size === 1
}

/**
 * @param {any} value
 * @param {Object[]} arr
 * @return {boolean}
 */
function sameWith(value, ...arr) {
  const { withLog = true, logic = And } = (
    isObject(arr.at(-1)) &&
    ('withLog' in arr.at(-1)
    || 'logic' in arr.at(-1))
  ) ? getOptions(arr) : {}
  arr = flat(arr)
  if (withLog) {
    Logger.log(`Value: ${JSON.stringify(value)}`)
    Logger.log(`Compare With: ${JSON.stringify(arr)}`)
  }
  const compare = val =>
    isObject(value) && isObject(val)
      ? Object.keys(val).every(key => val[key] === value[key])
      : val === value
  return logic === And
    ? arr.every(compare)
    : arr.some(compare)
}

/**
 * @param {any} value
 * @param {Object[]} arr
 * @return {boolean}
 */
function notSameWith(value, ...arr) {
  return !flat(arr).includes(value)
}

/**
 * Membandingkan 3 value dengan prinsip "Between And"
 * @param {number} start
 * @param {number} value
 * @param {number} until
 * @param {string} compare
 * @return {boolean}
 */
function between(start, value, until, compare = '<') {
  [start, value, until] = [start ?? 0, value ?? 0, until ?? 0]
  switch (compare) {
    case '<':
      return (start < value) && (value < until)
    case '<=':
      return (start <= value) && (value <= until)
  }
}

/**
 * @param {number} value
 * @param {number[]} comparations
 */
function lowerThan(value, ...comparations) {
  const { logic = And } = getOptions(comparations),
    isLowerThan = comparation => value < comparation
  return logic === And
    ? flat(comparations).every(isLowerThan)
    : flat(comparations).some(isLowerThan)
}

/**
 * @param {any|any[]} arr
 * @return {boolean}
 */
function isTruthy(...arr) {
  arr = flat(arr)
  return arr.filter(data => data).length === arr.length
}

/**
 * @param {any|any[]} arr
 * @return {boolean}
 */
function isFalsy(...arr) {
  arr = flat(arr)
  return arr.filter(data => !data).length === arr.length
}

/**
 * Mengecek tipe data menggunakan "typeof" bawaan JavaScript untuk banyak variabel sekaligus
 * @param {string} type
 * @param {Object[]} array
 * @return {boolean}
 */
function isTypeOf(type, ...array) {
  const { logic = And } = getOptions(array)
  return logic === And
    ? flat(array).every(val => typeof val === type)
    : flat(array).some(val => typeof val === type)
}