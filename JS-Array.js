/** Override fungsi2 bawaan Array */

var isArray = Array.isArray

/**
 * @param {Object[]} array
 * @param {OrderBy} orderBy
 */
function sort(array, orderBy = OrderBy.a) {
  array.sort((a, b) => {
    if (orderBy === OrderBy.d)
      [a, b] = [b, a]
    if (isTypeOf('number', a, b))
      return a - b
    else
      return a.localeCompare(b)
  })
}

/**
 * Sama seperti fungsi slice pada array, tapi ini menggunakan 1-based index dan end tetap dimasukkan ke hasil array.
 * @param {Object[]} array
 * @param {number} start 1-based index
 * @param {number|null} end 1-based index
 * @return {Object[]}
 */
function slice(array, start, end = null) {
  if (start > 0)
    start = start - 1
  return end ? array.slice(start, end) : array.slice(start)
}

/**
 * @param {Object[]} array
 * @param {number} at 1-based index
 * @param {Object[]} data
 */
function addAfter(array, at, ...data) {
  array.splice(at, 0, ...flat(data))
}

/**
 * @param {Object[]} array
 * @param {Object} options
 * @return {string}
 */
function join(array, options = {}) {
  switch (array.length) {
    case 0: return ''
    case 1: return String(array[0])
  }
  const { and = 'dan' } = options
  return `${array.slice(0, -1).join(', ')} ${and} ${array.at(-1)}`
}

/**
 * @param {Object[]} array
 * @param {Object[]} values
 */
function push(array, ...values) {
  const { many = false } = getOptions(values)
  if (many)
    array.forEach((arr, no) => values[no] && arr.push(...values[no]))
  else
    array.push(...flat(values))
}

/**
 * Lazy flat untuk array 2D
 * @param {Object[]|Object[][]} array
 * @return {Object[]}
 */
function flat(array) {
  if (array.some(isArray))
    array = array.flat(Infinity)
  return array
}

/** Fungsi2 custom sesuai kebutuhan */

function deleteNull(array) {
  return array.filter(value => value)
}

/**
 * @param {Object[]} array
 * @return {Object}
 */
function getOptions(array) {
  return isObject(array.at(-1)) ? array.pop() : {}
}

/**
 * @param {any} arg
 * @return {boolean}
 */
function isAllArray(...arg) {
  return arg.length > 1 ? arg.every(isArray) : isArray(arg[0])
}

/**
 * @param {Object|Object[]} value
 * @return {Object[]}
 */
function lazyWrap(value) {
  if (isArray(value)) return value
  return wrap(value)
}

/**
 * Ket: Fungsi hanya untuk manipulasi array
 * @param {Object[]} arr
 * @param {string} key
 * @param {any} val
 * @return {any}
 */
function getValueWhere(arr, key, val) {
  return arr.find(k => k[key] === val)
}

/**
 * Ket: Fungsi hanya untuk manipulasi array
 * @param {Object[]} arr
 * @param {string} key
 * @param {any} val
 * @return {Object[]}
 */
function getValuesExcept(arr, key, val) {
  return arr.filter(k => k[key] !== val)
}

/**
 * @param {Object[][]} values
 * @param {number} column
 */
function getValuesByColumn(values, column) {
  return values.map(rowData => rowData[column - 1])
}

/**
 * @param {any} search
 * @param {Object[]} values
 * @param {Object} options
 * @return {number[]|number[][]}
 */
function getIndexesWith(search, values, options = {}) {
  const { withLog = true, plus = 0 } = options
  let rows = [], firstRow = null, currentRow = null
  if (withLog) {
    Logger.log(`Function Name: getIndexesWith`)
    Logger.log(`Search Value: ${JSON.stringify(search)}`)
    Logger.log(`Values: ${values}`)
    Logger.log(`Index Plus: ${plus}`)
  }
  const isSearchArray = isArray(search)
  values.forEach((value, index) => {
    if (typeof value === 'string')
      value = value.trim()
    const isSame = typeof search === 'function'
      ? search(value)
      : isSearchArray
        ? search.includes(value)
        : search === value
    if (isSame || firstRow != null)
      currentRow = plus + index
    if (firstRow != null && !isSame) {
      rows.push([firstRow, currentRow - 1])
      firstRow = null
    } else if (isSame && firstRow == null)
      firstRow = currentRow
  })
  if (firstRow) rows.push([firstRow, currentRow])
  return rows
}

/**
 * @param {any} valueOrFunction
 * @param {number} count
 * @return {Object[]}
 */
function repeat(valueOrFunction, count = 1) {
  return Array.from({ length: count }, typeof valueOrFunction === 'function' ? valueOrFunction : () => valueOrFunction)
}

/**
 * @param {any} value
 * @param {number} dimension
 * @return {any}
 */
function wrap(value, dimension = 1) {
  iterate(() => value = [value], { until: dimension - 1 })
  return value
}

/**
 * @param {Object[]} array
 * @param {number} dimension
 * @return {any}
 */
function wrapInside(array, dimension = 1) {
  return array.map(value => wrap(value, dimension))
}

/**
 * Pembersihan data duplikat di sebuah array
 * @param {Object[]} array
 * @return {Object[]}
 */
function unique(...array) {
  array = flat(array).filter(data => data)
  return [...new Set(array)]
}

/**
 * @param {Object[][]} array
 * @return {Object[][]}
 */
function toParam(array) {
  let result = []
  for (let i = 0; i < array[0].length; i++)
    result[i] = array.map(content => content[i])
  return result
}

/**
 * Extract 2d array by index
 * @param {Object[][]} array
 * @param {number[]} at
 * @return {Object[]|Object[][]|Object[][][]}
 */
function extract(array, ...at) {
  const { useWrap = 0, isOneBasedIndex = false } = getOptions(at),
    process = (content, at) => useWrap ? wrap(content[at - isOneBasedIndex], useWrap) : content[at - isOneBasedIndex]
  return at.length ? at.map(at => array.map(content => process(content, at))) : process(array, at[0])
}