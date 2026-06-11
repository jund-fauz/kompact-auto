/**
 * @param {string} range
 * @param {Object} options
 * @return {number|number[]}
 */
function getRowFromA1N(range, options = {}) {
  const { withLastRow = false } = options
  range = (range.includes('!') ? range.split('!')[1] : range).split(':')
  const rows = range.map(range => parseInt(range.match(Regex.RowNumber)?.[0]))
  return withLastRow ? rows : parseInt(rows[0])
}

/**
 * @param {string} range
 * @return {number}
 */
function getRowCountFromA1N(range, options = {}) {
  const { needToFind = false } = options
  range = (range.includes('!') ? range.split('!')[1] : range).split(':')
  const rows = range.map(range => range.match(Regex.RowNumber))
  if (!rows[0] || (range.length > 1 && !rows[1]))
    return needToFind ? Infinity :1
  return rows.length > 1 ? rows[1] - (rows[0] - 1) : 1
}