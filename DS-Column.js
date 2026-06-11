/**
 * @param {string} range
 * @param {Object} options
 * @return {number|number[]}
 */
function getColumnFromA1N(range, options = {}) {
  const { withLastColumn = false, zeroBased = false, withLog = true, isLetter = false } = options,
    cleanRange = (range.includes('!') ? range.split('!')[1] : range).split(':')
  const columns = cleanRange.map(range => {
    const column = range.match(Regex.ColumnLetter.WithoutNumber)?.[0]
    if (column)
      return isLetter
        ? column
        : zeroBased
          ? getColumnIndex(column)
          : getColumnNum(column)
    else
      return undefined
  })
  if (withLog)
    Logger.log(`Function Name: getColumnFromA1N\nResult: ${JSON.stringify(columns)}`)
  return withLastColumn ? columns : columns[0]
}

/**
 * @param {string} range
 * @return {number}
 */
function getColumnCountFromA1N(range) {
  const columns = (
    range.includes('!')
      ? range.split('!')[1]
      : range
  ).split(':').map(range => {
    let result = range.match(Regex.ColumnLetter.WithoutNumber)
    if (result?.length)
      result = getColumnNum(result[0])
    return result
  })
  if (!columns[0] || (range.length > 1 && !columns[1]))
    return 1
  return columns.length > 1 ? columns[1] - (columns[0] - 1) : 1
}

/**
 * Mengonversi nomor indeks kolom menjadi representasi huruf.
 * @param {number|string} columnNumber - Nomor kolom numerik (harus > 0).
 * @return {string} Representasi huruf kolom (misal: 'A', 'Z', 'AA').
 */
function getColumnLetter(columnNumber) {
  if (typeof columnNumber === 'string')
    return columnNumber
  else if (typeof columnNumber !== 'number' || Math.floor(columnNumber) <= 0)
    throw new Error("Parameter tidak valid: Input harus berupa bilangan bulat lebih besar dari 0.")

  let letter = '', tempNumber = Math.floor(columnNumber)

  while (tempNumber) {
    let remainder = (tempNumber - 1) % 26
    // 65 adalah kode ASCII untuk 'A'
    letter = String.fromCharCode(remainder + 65) + letter
    tempNumber = Math.floor((tempNumber - 1) / 26)
  }

  return letter;
}

/**
 * @param {string} columnLetter
 * @return {number}
 */
function getColumnNum(columnLetter) {
  let index = 0
  for (let i = 0; i < columnLetter.length; i++) {
    index = index * 26 + (columnLetter.toUpperCase().charCodeAt(i) - 64)
  }
  return index
}

/**
 * @param {string} columnLetter
 * @return {number}
 */
function getColumnIndex(columnLetter) {
  let index = 0
  for (let i = 0; i < columnLetter.length; i++) {
    index = index * 26 + (columnLetter.toUpperCase().charCodeAt(i) - 64)
  }
  return index - 1
}