class DSRange {
  /**
   *  @param {string} a1N
   *  @param {Object} options
   */
  constructor(a1N, options = {}) {
    const { withLog = true } = options
    this.a1N = a1N
    this.withSheet = this.a1N.includes('!')
    /** @type {string[]} */
    this.partialRange = (
      this.withSheet
        ? this.a1N.split('!')[1]
        : this.a1N
    ).split(':')
    this.withLog = withLog
  }

  /**
   * @param {Object} options
   * @return {string|string[]|number|number[]|null}
   */
  column(options = {}) {
    const { withLastColumn = false, zeroBased = false, withLog = true, isLetter = false } = options
    const columns = this.partialRange.map(a1N => {
      const column = a1N.match(Regex.ColumnLetter.WithoutNumber)?.[0]
      if (column) {
        if (zeroBased)
          return getColumnIndex(column)
        else if (!isLetter)
          return getColumnNum(column)
      }
      return column
    })
    if (this.withLog)
      Logger.log(`Function Name: getColumnFromA1N\nResult: ${toString(columns)}`)
    return withLastColumn
      ? columns
      : columns[0]
  }

  /** @return {number} */
  columnCount() {
    const columns = this.partialRange.map(a1N => {
      let result = a1N.match(Regex.ColumnLetter.WithoutNumber)[0]
      if (result?.length)
        result = getColumnNum(result)
      return result
    })
    if (!columns[0] || columns.length < 2 || !columns[1])
      return 1
    return subtract(columns.reverse())
  }

  /**
   * @param {Object} options
   * @return {number|number[]|null}
   */
  row(options = {}) {
    const { withLastRow } = options,
      rows = this.partialRange.map(a1N => parseInt(a1N.match(Regex.RowNumber)?.[0]))
    return withLastRow
      ? rows
      : rows[0]
  }

  /**
   * @param {Object} options
   * @return {number|number[]}
   */
  rowCount(options = {}) {
    const { needToFind = false } = options,
      rows = this.partialRange.map(a1N => a1N.match(Regex.RowNumber)[0])
    if (!rows[0] || rows.length < 2 || !rows[1])
      return needToFind ? Infinity : 1
    return subtract(rows.reverse())
  }

  /**
   * Mengonversi string Notasi A1 menjadi format GridRange yang kompatibel dengan API.
   * Beroperasi secara lokal di RAM tanpa pemanggilan jaringan.
   * @param {number} sheetId
   * @return {GridRange} Objek JSON GridRange.
   */
  toGrid(sheetId) {
    if (sheetId === null)
      throw Error('Anda lupa mencantumkan sheet id')
    const cols = this.column({ withLastColumn: true }),
      rows = this.row({ withLastRow: true }),
      startRowIndex = rows[0] ? (parseInt(rows[0], 10) - 1) : undefined,
      /** @type {GridRange} */
      gridRange = {
        sheetId,
        startColumnIndex: getColumnIndex(cols[0]),
        endColumnIndex: getColumnNum(cols[1] ?? cols[1]),
        startRowIndex
      }
    if (rows[1] || (rows[0] && !cols[1]))
      gridRange.endRowIndex = rows[1] ? parseInt(rows[1]) : startRowIndex
    return gridRange
  }
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
    rangeNotation

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

// Kedepannya akan dikembangkan agar bisa mengeksekusi semua hanya dalam 1 request. Tapi bentar.
/**
 * @deprecated
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
    values = getValues(getA1N(sheetName, startRow, startColumnTitle, {
      endColumn: endColumnTitle,
      endRow: beforeEmptyRow,
      withLog,
      spreadsheetId
    }), { spreadsheetId, isAll: true })
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
      getA1N(sheetName, startRow, startColumnTitle, {
        endRow: beforeEmptyRow,
        endColumn: headers.indexOf(helperColName),
        spreadsheetId,
        withLog
      }),
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
            getA1N(sheetName, startRow - 1, startColumnTitle, {
              untilLastRow: true,
              headerRow,
              endColumn: endColumnTitle,
              withLog
            })
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