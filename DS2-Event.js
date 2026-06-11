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
 * @return {Object}
 */
function getEventDetail(e) {
  const range = e.range,
    sheet = range.getSheet().getName()
  Logger.log(`Range: ${sheet}!${range.getA1Notation()}\nValue: ${e.value ?? `''`}\nEdited by: ${e.user.getEmail()}`)
  return {
    sheet,
    range: `${sheet}!${range.getA1Notation()}`,
    column: getColumnLetter(range.getColumn()),
    row: range.getRow(),
    user: e.user.getEmail(),
    value: e.value,
    oldValue: e.oldValue,
  }
}

/**
 * @param {Event} e
 * @return {Object}
 */
function getRemoteEventDetail(e) {
  const range = e.range,
    sheet = range.getSheet().getName()
  return {
    spreadsheetId: e.source.getId(),
    sheet,
    range: `${sheet}!${range.getA1Notation()}`,
    row: range.getRow(),
    user: e.user.getEmail(),
    column: getColumnLetter(range.getColumn()),
    value: range.getValue()
  }
}