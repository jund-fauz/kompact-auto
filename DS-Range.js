class DSRange {
  /**
   *  @param {string} a1N
   *  @param {{withLog?: boolean}} options
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
   * @param {{withLastColumn?: boolean, zeroBased?: boolean, isLetter?: boolean}} options
   * @return {string|string[]|number|number[]|null}
   */
  column(options = {}) {
    const { withLastColumn = false, zeroBased = false, isLetter = false } = options
    const columns = this.partialRange.map(a1N => {
      const column = a1N.match(Regex.ColumnLetter.WithoutNumber)?.[0]
      if (column)
        if (!isLetter)
          return getColumnNum(column) - zeroBased
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
    const columns = this.column({ withLastColumn: true })
    if (!columns[0] || columns.length < 2 || !columns[1])
      return 1
    return subtract(columns.reverse()) + 1
  }

  /**
   * @param {{withLastRow?: boolean}} options
   * @return {number|number[]|null}
   */
  row(options = {}) {
    const { withLastRow = false } = options,
      rows = this.partialRange.map(a1N => parseInt(a1N.match(Regex.RowNumber)?.[0]))
    return withLastRow
      ? rows
      : rows[0]
  }

  /**
   * @param {{needToFind?: boolean}} options
   * @return {number}
   */
  rowCount(options = {}) {
    const { needToFind = false } = options,
      rows = this.partialRange.map(a1N => a1N.match(Regex.RowNumber)?.[0])
    if (!rows?.[0] || rows.length < 2 || !rows?.[1])
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
      /** @type {GridRange} */
      gridRange = { sheetId }
    if (cols[0]) {
      gridRange.startColumnIndex = cols[0] - 1
      gridRange.endColumnIndex = cols[0]
    }
    if (rows[0])
      gridRange.startRowIndex = rows[0] - 1
    if (cols[1])
      gridRange.endColumnIndex = cols[1]
    if (rows[1] || (rows[0] && !cols[1]))
      gridRange.endRowIndex = rows[1] ?? rows[0]
    return gridRange
  }
}

/**
 * @param {string} a1N
 * @param {{withLog?: boolean}} options
 * @return {DSRange}
 */
function editRange(a1N, options = {}) {
  return new DSRange(a1N, options)
}

/**
 * Mengonversi objek GridRange JSON API menjadi string Notasi A1.
 * Resolusi memori O(1) dan dilengkapi dengan sanitasi leksikal nama sheet.
 * @param {string} sheet - Nama sheet.
 * @param {GridRange} gridRange - Objek JSON GridRange dari Sheets API.
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