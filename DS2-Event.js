/**
 * @typedef {Object} Event
 * @property {SpreadsheetApp.Range} range
 * @property {SpreadsheetApp.Spreadsheet} source
 * @property {any} value
 * @property {any} oldValue
 * @property {User} user
 */

/**
 * @param {Event} e
 * @param {{columnInLetter: boolean}} options
 * @return {Object}
 */
function getEventDetail(e, options = {}) {
  const { columnInLetter = false } = options,
    range = e.range,
    sheet = range.getSheet().getName(),
    column = range.getColumn()
  Logger.log(`Range: ${sheet}!${range.getA1Notation()}\nValue: ${e.value}\nEdited by: ${e.user.getEmail()}`)
  return {
    sheet,
    range: `${sheet}!${range.getA1Notation()}`,
    column: columnInLetter ? getColumnLetter(column) : column,
    row: range.getRow(),
    user: e.user.getEmail(),
    value: e.value,
    oldValue: e.oldValue,
  }
}

/**
 * @param {Event} e
 * @param {{columnInLetter: boolean}} options
 * @return {Object}
 */
function getRemoteEventDetail(e, options = {}) {
  return {
    spreadsheetId: e.source.getId(),
    ...getEventDetail(e,  options)
  }
}