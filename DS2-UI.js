
/**
 * @param {string|number} params
 */
function toast(...params) {
  SpreadsheetApp.getActiveSpreadsheet().toast(...params)
}

// Menampilkan halaman print
/**
 * @param {GoogleAppsScript.HTML.HtmlTemplate} template
 * @param {Object|any} data
 * @param {Object} options
 */
function show(template, data, options = {}) {
  const { isPrint = false, title = '', width = 100, height = 100 } = options
  if (isObject(data)) {
    const keys = Object.keys(data)
    keys.forEach(key => template[key] = data[key])
  } else
    template.data = data
  // noinspection JSUndefinedPropertyAssignment
  template.isPrintMode = isPrint
  const htmlOutput = template.evaluate().setWidth(width).setHeight(height)
  ui().showModalDialog(htmlOutput, isPrint ? "Proses Cetak Berjalan..." : title)
}

/**
 * @param {GoogleAppsScript.HTML.HtmlTemplate} template
 * @param {Object|null|any} data
 * @return {GoogleAppsScript.HTML.HtmlOutput}
 */
function templating(template, data = null) {
  if (data)
    if (isObject(data)) {
      const keys = Object.keys(data)
      keys.forEach(key => template[key] = data[key])
    } else
      template.data = data
  return template.evaluate()
}

/**
 * @param {string} content
 * @param {Object} options
 * @return {GoogleAppsScript.Base.Button}
 */
function alert(content, options = {}) {
  const { buttonSet = ButtonSet().OK, title = '' } = options
  if (typeof content !== 'string')
    content = JSON.stringify(content)
  if (includes(content, '[', ']'))
    content = content.replaceAll('[[', '[\n\t[').replaceAll('],[', '],\n[').replaceAll(']]', ']\n\t]')
  return ui().alert(title, content, buttonSet)
}