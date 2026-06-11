/**
 * @param {string} sheetName
 * @param {number} startRow
 * @param {string|number|string[]} startColumn - Dapat berupa judul / header, notasi A1 (hanya support sampai 3 huruf), dan nomor kolom. Dapat memasukkan lebih dari 1 untuk judul kolom
 * @param {Object} options
 * @return {string}
 */
function getA1N(sheetName, startRow, startColumn, options = {}) {
  const {
    headerRow = 1,
    isLastHeader = false,
    untilLastRow = false,
    spreadsheetId = null,
    withSheetName = true,
    endRow = null,
    withLog = true,
    rowCount = null
  } = options
  let { endColumn = null } = options
  if (withLog) {
    Logger.log(`Function name: getA1N`)
    Logger.log(`Sheet: ${sheetName}`)
    Logger.log('Header Row: ' + headerRow)
    Logger.log('First Column Title: ' + startColumn)
    Logger.log('Last Column Title: ' + endColumn)
  }
  const getColumnByType = column => {
    if (typeof column === 'string')
      return column.length > 1 || !Regex.ColumnLetter.WithoutNumber.test(column)
        ? create(spreadsheetId, sheetName, { withLog }).column(column, { headerRow, isLastHeader, isLetter: true })
        : column
    else if (typeof column === 'number')
      return getColumnLetter(column)
  }, isNotOneCell = untilLastRow || endRow || rowCount
  if (isAllArray(startColumn, endColumn) && startColumn.length !== endColumn?.length)
    throw Error(`Panjang startColumn dan endColumn berbeda.`)
  startColumn = isArray(startColumn) ? startColumn.map(column => getColumnByType(column)) : getColumnByType(startColumn)
  endColumn = isArray(endColumn) ? endColumn.map(column => getColumnByType(column)) : getColumnByType(endColumn)
  let result
  if (isArray(startColumn)) {
    result = startColumn.map((column, no) => {
      let a1n = (withSheetName ? `${sheetName}!` : '') + column + startRow
      if (isNotOneCell || endColumn?.[no])
        a1n += `:${endColumn?.[no] || column}${untilLastRow ? '' : rowCount ? startRow + rowCount - 1 : endRow || startRow}`
      return a1n
    })
  } else {
    result = (withSheetName ? `${sheetName}!` : '') + startColumn + startRow
    if (isNotOneCell || endColumn)
      result += `:${endColumn || startColumn}${untilLastRow ? '' : rowCount ? startRow + rowCount - 1 : endRow || startRow}`
  }
  if (withLog)
    Logger.log(`Result: ${result}`)
  return result
}

/**
 * @param {string} sheetName
 * @param {string} rangeName
 * @param {Object} options
 */
function getA1NByName(sheetName, rangeName, options = {}) {
  const { spreadsheetId = null } = options,
    ssData = spreadsheet.get(spreadsheetId, { fields: 'namedRanges(name,range)' })
  return ssData.namedRanges?.length ? toA1Notation(sheetName, ssData.namedRanges.find(range => range.name === rangeName).range) : null
}

/**
 * Mengonversi string Notasi A1 menjadi format GridRange yang kompatibel dengan API.
 * Beroperasi secara lokal di RAM tanpa pemanggilan jaringan.
 * @param {string} a1Notation - Rentang dalam format A1 (misal: "Sheet1!B2:D")
 * @param {Object} options
 * @return {Sheets_v4.Sheets.V4.Schema.GridRange} Objek JSON GridRange.
 */
function toGridRange(a1Notation, options = {}) {
  const { sheetId = null } = options
  if (sheetId == null)
    throw Error('Anda lupa mencantumkan sheet id')
  const a1NotationParts = a1Notation.split('!'),
    cleanRange = (a1NotationParts[1] ?? a1NotationParts[0]).split(':'),
    cols = cleanRange.map(range => range.match(Regex.ColumnLetter.WithoutNumber)?.[0]),
    rows = cleanRange.map(range => range.match(Regex.RowNumber)?.[0]),
    startRowIndex = rows[0] ? parseInt(rows[0], 10) - 1 : undefined,
    gridRange = {
      sheetId,
      startColumnIndex: getColumnIndex(cols[0]),
      endColumnIndex: getColumnIndex((cols[1] ?? cols[0])) + 1,
      startRowIndex,
    }
  if (rows[1])
    gridRange.endRowIndex = parseInt(rows[1], 10)
  else if (rows[0] && !cols[1])
    gridRange.endRowIndex = startRowIndex

  return gridRange
}

/**
 * Mengonversi objek GridRange JSON API menjadi string Notasi A1.
 * Resolusi memori O(1) dan dilengkapi dengan sanitasi leksikal nama sheet.
 * @param {string} sheet - Nama sheet.
 * @param {Object} gridRange - Objek JSON GridRange dari Sheets API.
 * @return {string} Notasi A1 (Misal: "'MEI'!B2:D10").
 */
function toA1Notation(sheet, gridRange) {
  // 3. Pemetaan Batas Koordinat (Manajemen Eksklusif API)
  Logger.log(gridRange)
  const hasStartCol = gridRange?.startColumnIndex !== undefined,
    hasEndCol = gridRange?.endColumnIndex !== undefined,
    hasStartRow = gridRange?.startRowIndex !== undefined,
    hasEndRow = gridRange?.endRowIndex !== undefined,
    startCol = hasStartCol ? getColumnLetter(gridRange.startColumnIndex + 1) : '',
    endCol = hasEndCol ? getColumnLetter(gridRange.endColumnIndex) : '',
    startRow = hasStartRow ? gridRange.startRowIndex + 1 : '',
    endRow = hasEndRow ? gridRange.endRowIndex : ''

  // 4. Konstruksi String Memori
  let startCell = `${startCol}${startRow}`,
    endCell = `${endCol}${endRow}`,
    rangeNotation = ''

  // Evaluasi Kolaps Koordinat (Menghindari "A1:A1", diganti menjadi "A1")
  if (startCell === endCell)
    rangeNotation = startCell
  else if (!startCell)
    rangeNotation = endCell
  else if (!endCell)
    rangeNotation = startCell
  else
    rangeNotation = `${startCell}:${endCell}`

  Logger.log(rangeNotation)

  // 5. Sanitasi Leksikal Nama Sheet (Wajib jika ada spasi/karakter khusus)
  if (sheet) {
    // Jika nama sheet memiliki karakter selain alfanumerik biasa, bungkus dengan kutip tunggal
    const needsQuotes = /[^a-zA-Z]/.test(sheet)
    const safeSheetName = needsQuotes ? `'${sheet}'` : sheet
    return `${safeSheetName}!${rangeNotation}`
  }

  return sheet + (rangeNotation ? `!${rangeNotation}` : '')
}

// Kedepannya akan dikembangkan agar bisa mengeksekusi semua hanya dalam 1 request. Tapi bentar.
/**
 * @param {string} sheetName
 * @param {string} startColumnTitle
 * @param {string} notEmptyColumnTitle
 * @param {string} endColumnTitle
 * @param {string|string[]} sortByColumnTitle
 * @param {Object} options
 */
function sortRange(sheetName, startColumnTitle, notEmptyColumnTitle, endColumnTitle, sortByColumnTitle, options = {}) {
  if (isArray(sortByColumnTitle))
    if (sortByColumnTitle.length > 2)
      throw Error('Maksimal 2 kolom untuk di-sort dengan posisi kosong di atas. Jika ingin sorting biasa, gunakan \'ascendingSortCol\' di parameter terakhir (options).')
    else if (sortByColumnTitle.length < 2)
      throw Error('Minimal 2 kolom untuk di-sort dengan posisi kosong di atas menggunakan array. Jika ingin menggunakan 1 kolom, masukkan sebagai string biasa.')

  const {
    startRow = 2,
    isAscending = true,
    ascendingSortCol = null,
    spreadsheetId = null,
    withLog = true,
    hideProcessed = false,
    headerRow = 1,
    hideDelay = 0
  } = options, headers = getHeaders(sheetName, { spreadsheetId, headerRow }), helperColName = 'FILTER HELPER',
    beforeEmptyRow = findRow(sheetName, startRow, notEmptyColumnTitle, '', { spreadsheetId, withLog }) - 1,
    values = getValues(getA1N(sheetName, startRow, startColumnTitle, { endColumn: endColumnTitle, endRow: beforeEmptyRow, withLog, spreadsheetId }), { spreadsheetId, isAll: true })
  headers.splice(headers.indexOf(endColumnTitle) + 1, 1, helperColName)
  const slicedHeader = headers.slice(
    headers.indexOf(startColumnTitle),
    headers.indexOf(endColumnTitle) + 1
  )
  let col1, col2
  if (isArray(sortByColumnTitle)) {
    col1 = slicedHeader.indexOf(sortByColumnTitle[0])
    col2 = slicedHeader.indexOf(sortByColumnTitle[1])
  } else {
    col1 = slicedHeader.indexOf(sortByColumnTitle)
    col2 = col1
  }
  const helperValues = values.map(row => [(row[col1] || row[col2]) ? 1 : 0]),
    ascending = isAscending ? 'ASCENDING' : 'DESCENDING',
    sortSpecs = [{
      dimensionIndex: headers.indexOf(helperColName) - 1,
      sortOrder: 'ASCENDING'
    }],
    sortGridRange = toGridRange(
      getA1N(sheetName, startRow, startColumnTitle, { endRow: beforeEmptyRow, endColumn: headers.indexOf(helperColName), spreadsheetId, withLog }),
      { spreadsheetId }
    )

  setValues(helperValues, getA1N(
    sheetName,
    startRow,
    headers.indexOf(helperColName),
    { withLog, spreadsheetId }
  ), { valueInputOption: 'USER_ENTERED', spreadsheetId })

  if (ascendingSortCol)
    sortSpecs.push(...ascendingSortCol.map(col => ({
      dimensionIndex: headers.indexOf(col) - 1,
      sortOrder: ascending
    })))

  const requests = [{
    sortRange: {
      range: sortGridRange,
      sortSpecs
    }
  }]

  if (hideDelay)
    Utilities.sleep(hideDelay * 1000)
  batchUpdate({ requests, spreadsheetId })
  requests.length = 0
  requests.push({
    repeatCell: {
      range: toGridRange(
        getA1N(sheetName, startRow, headers.indexOf(helperColName), { endRow: beforeEmptyRow, spreadsheetId, withLog }),
        { spreadsheetId }
      ),
      cell: {},
      fields: 'userEnteredValue'
    }
  })
  if (hideProcessed) {
    const filterCriteria = column => ({
      [headers.indexOf(column) - 1]: {
        condition: {
          type: ConditionType.B
        }
      }
    })
    requests.push({
      setBasicFilter: {
        filter: {
          range: toGridRange(
            getA1N(sheetName, startRow - 1, startColumnTitle, { untilLastRow: true, headerRow, endColumn: endColumnTitle, withLog })
          ),
          criteria: isArray(sortByColumnTitle)
            ? Object.assign({}, ...sortByColumnTitle.map(filterCriteria))
            : filterCriteria(sortByColumnTitle)
        }
      }
    })
  }
  batchUpdate({ requests, spreadsheetId })
}