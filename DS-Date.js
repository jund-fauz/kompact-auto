/**
 * @param {Date|string} input
 * @return {number}
 */
function toSpreadsheetDate(input, dateOnly = typeof input === 'string' && input.length === 10) {
  const result = (
    (
      typeof input === 'string' ?
        new Date(input + (dateOnly ? 'T00:00:00Z' : ''))
        : input
    ).getTime() -
    new Date(Date.UTC(1899, 11, 30)).getTime()
  ) / (1000 * 3600 * 24)
  return dateOnly ? Math.floor(result) : result
}
