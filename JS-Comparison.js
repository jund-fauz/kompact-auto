/**
 * @typedef {And|Or|string} Logic
 */

/**
 * @param {string} value
 * @param {string} contains
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
 * @param {any} arr
 * @return {boolean}
 */
function isSame(...arr) {
  return new Set(flat(arr)).size === 1
}

/**
 * @param {any} value
 * @param {any|{withLog?: boolean, logic: Logic}} arr
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
 * @param {any} arr
 * @return {boolean}
 */
function notSameWith(value, ...arr) {
  return !flat(arr).includes(value)
}

/**
 * Membandingkan 3 value dengan prinsip "Between And"
 * @param {number} start
 * @param {number|number[]} value
 * @param {number} until
 * @param {string|string[]} compare
 * @return {boolean}
 */
function between(start, value, until, compare = '<') {
  [start, value, until] = [start ?? 0, lazyWrap(value).map(value => value ?? 0), until ?? 0]
  compare = lazyWrap(compare)
  if (value.length !== compare.length && value.length === 1)
    value = repeat(value[0], compare.length)
  return compare.every((compare, no) => {
    switch (compare) {
      case '<':
        return (start < value[no]) && (value[no] < until)
      case '<=':
        return (start <= value[no]) && (value[no] <= until)
      case '<=<':
        return (start <= value[no]) && (value[no] < until)
      case '<<=':
        return (start < value[no]) && (value[no] <= until)
    }
  })
}

/**
 * @param {number} value
 * @param {number} comparations
 */
function lowerThan(value, ...comparations) {
  const { logic = And } = getOptions(comparations),
    isLowerThan = comparation => value < comparation
  return logic === And
    ? flat(comparations).every(isLowerThan)
    : flat(comparations).some(isLowerThan)
}

/**
 * @param {any|{logic: Logic}} array
 * @return {boolean}
 */
function isTruthy(...array) {
  const { logic = And } = getOptions(array)
  array = flat(array)
  return logic === And
    ? array.filter(data => data).length === array.length
    : array.some(data => data)
}

/**
 * @param {any|{logic: Logic}} array
 * @return {boolean}
 */
function isFalsy(...array) {
  const { logic = And } = getOptions(array)
  array = flat(array)
  return logic === And
    ? array.filter(data => !data).length === array.length
    : array.some(data => !data)
}

/**
 * Mengecek tipe data menggunakan "typeof" bawaan JavaScript untuk banyak variabel sekaligus
 * @param {string} type
 * @param {any} array
 * @return {boolean}
 */
function isTypeOf(type, ...array) {
  const { logic = And } = getOptions(array)
  array = flat(array)
  return logic === And
    ? array.every(val => typeof val === type)
    : array.some(val => typeof val === type)
}