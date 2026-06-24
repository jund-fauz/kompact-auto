/**
 *  @typedef {GoogleAppsScript.Sheets.Schema.GridRange} GridRange
 *  @typedef {{
 *   endColumn?: string|number,
 *   endRow?: number,
 *   untilLastRow?: boolean,
 *   isLastHeader?: boolean,
 *   rowCount?: number,
 *   columnCount?: number,
 *   headerRow?: number,
 *   headerOrder?: number
 *  }} RangeOptions
 *  @typedef {[number,string|number,RangeOptions?]|[number,string|number,RangeOptions?][]|string|string[]} RawRange
 *  @typedef {PasteNormal|PasteFormula|PasteFormat|string} PasteType
 *  @typedef {Formatted|Unformatted|Formula|string} ValueRenderOption
 *  @typedef {Horizontal|Vertical|string} Stack
 *  @typedef {string|number|MLArray<string|number>} SheetType
 *  @typedef {{
 *  isAll?: boolean,
 *  notFiltered?: boolean,
 *  filterViewName?: string,
 *  withRows?: boolean,
 *  dateFormat?: string,
 *  stack?: Stack,
 *  vro?: ValueRenderOption,
 *  fillEmpty?: boolean,
 *  withHeader?: boolean,
 *  sheet?: SheetType
 * }} ValuesOption
 * @typedef {{
 *   requests?: MLArray<Object>,
 *   valueRequests?: MLArray<Object>,
 *   customRequests?: Object,
 *   except?: SheetType,
 *   batch?: number,
 *   withoutRetry?: boolean,
 *   afterRun?: function,
 *   withLog?: boolean,
 *   headerRow?: Object<string,number>
 * }} SpreadsheetManipulationOptions
 * @typedef {{except?: SheetType, includeInvalid?: boolean, sheet?: SheetType, withoutSheet?: boolean}} ProcessRangeOptions
 */


class SpreadsheetManipulation {
  /**
   * @param {string|null} spreadsheetIdOrTitle
   * @param {SheetType|null} sheet
   * @param {SpreadsheetManipulationOptions} options
   */
  constructor(spreadsheetIdOrTitle = null, sheet = null, options = {}) {
    const {
      requests = null,
      valueRequests = null,
      customRequests = null,
      except = null,
      batch = 1000,
      withoutRetry = false,
      afterRun = null,
      withLog = true,
      headerRow = {}
    } = options
    this.requests = MLArray.init(requests ?? [])
    this.valueRequests = MLArray.init(valueRequests ?? [])
    this.emptyValueRequests = MLArray.init([])
    this.customRequests = customRequests ?? {}
    this.responses = []
    this.spreadsheet = spreadsheetIdOrTitle ?? SpreadsheetApp.getActiveSpreadsheet().getId()
    this.spreadsheetId = this.spreadsheet.includes(' ') ? getFileIdByName(this.spreadsheet) : this.spreadsheet
    this.batch = batch
    this.withoutRetry = withoutRetry
    this.withLog = withLog
    this.vio = UserEntered
    this.headerRow = headerRow
    /** @type {ValuesOption} */
    this.valuesOption = {}
    /** @type {{ activeSheet: SpreadsheetApp.Sheet, timezone: string, namedRanges: GoogleAppsScript.Sheets.Schema.NamedRange[] }} */
    this.cache = {}
    this.updateValueFirst = false
    /** @type {number|null} */
    this.delay = null
    if (afterRun)
      this.afterRun = afterRun
    if (!this.spreadsheetId)
      throw Error('Tidak ada spreadsheet yang sedang aktif saat ini.')
    if (sheet)
      this.selectSheet(sheet, except)
  }

  /**
   * Memilih sheet target berdasarkan nama/preset (Daily/Monthly/Active/All) dan meng-cache sheetId mapping.
   * @param {SheetType} sheet
   * @param {SheetType} except
   * @return {SpreadsheetManipulation}
   */
  selectSheet(sheet, except = null) {
    Logger.log(`Menuju sheet ${sheet}`)
    let cache = getGlobalCache()[CacheType.SheetIds][this.spreadsheetId]
    if (!cache) {
      /** @type {GoogleAppsScript.Sheets.Schema.Sheet[]} */
      const sp = retry(() => this.get({ fields: 'sheets.properties(sheetId,title)' }).sheets, { withReturnValue: true }),
        /** @type {{[keys: string]: number}} */
        result = {}
      sp.forEach(sheet => result[sheet.properties.title] = sheet.properties.sheetId)
      addToGlobalCache(CacheType.SheetIds, this.spreadsheetId, result)
      cache = initObject({ ...result })
    } else
      cache = initObject({ ...cache })

    switch (sheet) {
      case Daily:
        /** @type {MLArray<string>} */
        this.sheet = MLArray.init(iterate(i => `${i}`, { until: 31 }))
        break
      case Monthly:
        this.sheet = MLArray.init(shortMonths)
        break
      case Active:
        this.sheet = MLArray.init(this.selectedSheet().getName())
        this.sheetId = initObject({ [this.sheet[0]]: this.selectedSheet().getSheetId() })
        return this
      case All:
        this.sheet = cache.keys()
        break
      default:
        this.sheet = MLArray.init(sheet).castToString().unique()
    }

    cache.keys().forEach(key => {
      if (!this.sheet.includes(key))
        cache.delete(key)
    })

    if (this.withLog)
      Logger.log(cache.keys())

    if (cache.keys().length !== this.sheet.length)
      throw Error(`Sheet ${this.sheet.immutableFilter(sheet => !cache.keysVersion.includes(sheet)).join()} tidak ada.`)

    if (except) {
      except = MLArray.init(except)
      this.sheet.filter(sheet => !except.includes(sheet))
      except.forEach(name => cache.delete(name))
    }

    this.sheetId = cache
    return this
  }

  /**
   * Mengambil instance SpreadsheetApp.Sheet yang sedang aktif dari cache.
   * @return {GoogleAppsScript.Spreadsheet.Sheet}
   */
  selectedSheet() {
    if (!this.cache.activeSheet)
      this.cache.activeSheet = SpreadsheetApp.getActiveSheet()
    return this.cache.activeSheet
  }

  /**
   * Mengembalikan objek detail range aktif (sheet, range, kolom, baris, value) dari seleksi user.
   * @return {Object}
   */
  selectedItems() {
    const activeSheet = this.selectedSheet(),
      range = activeSheet.getActiveRange()
    return {
      sheet: activeSheet.getName(),
      range: range.getA1Notation(),
      startColumn: getColumnLetter(range.getColumn()),
      endColumn: getColumnLetter(range.getColumn()),
      startRow: range.getRow(),
      endRow: range.getLastRow(),
      value: range.getValue()
    }
  }

  /**
   * Mengembalikan objek detail cell aktif tunggal (sheet, range, column, row, value).
   * @param {{columnInNumber?: boolean}} options
   * @return {Object}
   */
  selectedItem(options = {}) {
    const { columnInNumber = false } = options,
      activeSheet = this.selectedSheet(),
      cell = activeSheet.getActiveCell()

    return {
      sheet: activeSheet.getName(),
      range: cell.getA1Notation(),
      column: columnInNumber
        ? cell.getColumn()
        : getColumnLetter(cell.getColumn()),
      row: cell.getRow(),
      value: cell.getValue()
    }
  }

  /**
   * Wrapper Sheets.Spreadsheets.get dengan parameter fields dan ranges, mendukung opsi sheet filter.
   * @param {{ranges?: RawRange, sheet?: SheetType|null, fields: string}} optionParams
   * @return {GoogleAppsScript.Sheets.Schema.Spreadsheet}
   */
  get(optionParams = {}) {
    const { ranges = null, sheet = this.sheet, ...options } = optionParams
    if (!options.fields && !ranges)
      Logger.log('⚠️WARNING! Ini akan me-load semua data spreadsheet!')
    switch (true) {
      case !!ranges:
        options.ranges = this.processRange(ranges, { sheet })
        break
      case !!sheet:
        options.ranges = lazyWrap(sheet)
        break
    }
    return spreadsheet.get(this.spreadsheetId, options)
  }

  /**
   * Mengambil baris header dari sheet dengan caching global, mengembalikan MLArray dengan unshift placeholder.
   * @param {{headerRow?: number, unshiftCounts?: number, sheet?: string}} options
   * @return {MLArray<string>}
   */
  headers(options = {}) {
    const { headerRow = this.headerRow[this.sheet[0]] ?? 1, unshiftCounts = 1, sheet = this.sheet[0] } = options,
      cacheKey = `${this.spreadsheetId}_${sheet}_${headerRow}`,
      cache = getGlobalCache()
    if (!cache.headers[cacheKey])
      addToGlobalCache(
        CacheType.Header,
        cacheKey,
        this.values(`${headerRow}:${headerRow}`, { fillEmpty: false, sheet })
      )
    const headers = [...cache.headers[cacheKey]],
      unshiftArr = Array.from({ length: unshiftCounts }, () => '')
    headers.unshift(...unshiftArr)
    return MLArray.init(headers)
  }

  /**
   * @return {GoogleAppsScript.Sheets.Schema.NamedRange[]}
   */
  namedRanges() {
    if (!this.cache.namedRanges)
      this.cache.namedRanges = this.get({ fields: 'namedRanges' }).namedRanges
    return this.cache.namedRanges
  }

  /**
   * Resolver nama kolom ke nomor/huruf kolom berdasarkan header row, mendukung multi-kolom dan prefix.
   * @param {string|string[]} columnName
   * @param {{
   *    headerRow?: number,
   *    isLastHeader?: boolean,
   *    lastHeaders?: string|string[],
   *    isLetter?: boolean,
   *    unshiftCounts?: number,
   *    withHeader?: boolean,
   *    prefix?: string,
   *    lastHeaderPrefix?: string,
   *    sheet?: string
   *   }} options
   * @return {string|string[]|number|number[]|MLObject}
   */
  column(columnName, options = {}) {
    const {
        headerRow = this.headerRow[this.sheet[0]] ?? 1,
        isLastHeader = false,
        isLetter = false,
        unshiftCounts = 1,
        withHeader = false,
        prefix = '',
        lastHeaderPrefix = '',
        sheet = this.sheet[0]
      } = options,
      headers = this.headers({ headerRow, sheet, unshiftCounts }),
      cols = []
    columnName = lazyWrap(columnName)
    let { lastHeaders = null } = options,
      result = {}
    const process = (column, isLastHeader) => {
      const colNum = isLastHeader ? headers.lastIndexOf(column) : headers.indexOf(column)
      if (colNum < 1) throw Error(`Kolom dengan judul ${column} tidak ada pada sheet ${sheet}. Spreadsheet: ${this.spreadsheetId}`)
      const col = isLetter ? getColumnLetter(colNum) : colNum
      if (withHeader) {
        column = column.toLowerCase()
        if (prefix && !isLastHeader)
          column = prefix + ' ' + column
        if (lastHeaderPrefix && isLastHeader)
          column = lastHeaderPrefix + ' ' + column
        result[initString(column).toCamelCase()] = col
      } else
        cols.push(col)
    }
    columnName.forEach((column) => process(column, isLastHeader))
    if (lastHeaders) {
      lastHeaders = lazyWrap(lastHeaders)
      lastHeaders.forEach((column) => process(column, true))
    }
    if (!withHeader)
      result = cols.length > 2 ? cols : cols[0]
    else
      result = initObject(result)
    if (this.withLog)
      Logger.log(`\nHeader: ${headers}\nCols: ${cols}\nResult: ${result instanceof MLObject ? result.entries() : result}`)
    return result
  }

  /**
   * Mengambil jumlah maksimum baris atau kolom dari grid properties sheet dengan caching.
   * @param {Column|Row|string} type
   * @param {{isLetter?: boolean, sheet?: SheetType}} options
   * @return {number|string}
   */
  max(type, options = {}) {
    const { isLetter = false, sheet = this.sheet[0] } = options,
      key = `max_${sheet}_${type}`
    switch (type) {
      case Column:
        if (!this.cache[key])
          this.cache[key] = this.get({
            fields: 'sheets.properties.gridProperties.columnCount',
            sheet: sheet
          }).sheets[0].properties.gridProperties.columnCount
        return isLetter ? getColumnLetter(this.cache[key]) : this.cache[key]
      case Row:
        if (!this.cache[key])
          this.cache[key] = this.get({
            fields: 'sheets.properties.gridProperties.rowCount',
            sheet: sheet
          }).sheets[0].properties.gridProperties.rowCount
        return this.cache[key]
    }
  }

  /**
   * Mengambil timezone spreadsheet dari properties dengan caching.
   * @return {string}
   */
  timezone() {
    if (!this.cache.timezone)
      this.cache.timezone = this.get({ sheet: null, fields: 'properties.timeZone' }).properties.timeZone
    return this.cache.timezone
  }

  /**
   * Mengambil satu nilai tunggal dari range menggunakan Sheets.Values.get, return undefined jika kosong.
   * @param {RawRange} ranges
   * @param {{vro?: ValueRenderOption, sheet?: string}|Object} options
   * @return {undefined|any}
   */
  value(ranges, options = {}) {
    const { vro = Formatted, sheet = this.sheet[0], ...optionsForAPI } = options
    ranges = this.processRange(ranges, { includeInvalid: true, sheet })[0]
    if (ranges.endsWith('#SKIP#'))
      return undefined
    let values = spreadsheet.Values.get(this.spreadsheetId, ranges, { ...optionsForAPI, valueRenderOption: vro }).values
    if (values)
      values = values.flat(2)
    return !values?.length ? undefined : trim(values[0])
  }

  /**
   * Mengambil data multi-range dengan batchGet, mendukung stack Horizontal/Vertical, filter, dateFormat, withHeader, dan notFiltered.
   * @template T
   * @param {RawRange} ranges
   * @param {ValuesOption} options
   * @return {MLArray<T>|MLArray<T[]>|MLObject|{[key: string]: MLArray<T>}}
   */
  values(ranges, options = {}) {
    ranges = lazyWrap(ranges)
    if (!ranges.some(isArray))
      ranges = wrap(ranges)
    const {
        isAll = false,
        notFiltered = false,
        filterViewName = null,
        withRows = false,
        dateFormat = '',
        stack = Horizontal,
        vro = Formatted,
        fillEmpty = true,
        withHeader = false,
        ...rest
      } = isEmpty(options) ? this.valuesOption : options,
      /**
       * @template T
       * @param {T[][]} vals
       * @param {number} rowCount
       * @return {Array<T>}
       */
      dataProcess = (vals, rowCount) => {
        if (rowCount !== Infinity && vals.length < rowCount)
          vals = vals.concat(repeat(() => [], rowCount - vals.length))
        return vals.length ? vals : repeat(() => [], rowCount === Infinity ? 1 : rowCount)
      }
    let headerRow = this.headerRow[this.sheet[0]] ?? 1,
      column = 0,
      sampleRange = '',
      {
        sheet = this.sheet,
        ...optionsForAPI
      } = rest
    if (ranges.every(isArray))
      headerRow = unique(ranges.map(range => range.at(-1).headerRow))[0] ?? 1
    ranges = this.processRange(ranges, { sheet })
    const isRangesAnArray = isArray(ranges)
    if (notFiltered || withHeader) {
      sampleRange = isRangesAnArray ? ranges[0] : ranges
      sheet = (isRangesAnArray ? ranges[0] : ranges).split('!')[0]
    }
    if (filterViewName || withHeader)
      column = editRange(sampleRange, { withLog: this.withLog }).column({ withLastColumn: true })
    if (this.withLog)
      Logger.log(ranges)
    let values = (isRangesAnArray
      ? spreadsheet.Values.batchGet(this.spreadsheetId, {
        ranges, ...optionsForAPI,
        valueRenderOption: vro
      }).valueRanges.map((result, index) => {
        let vals = result.values || []
        const rowCount = editRange(ranges[index]).rowCount()
        return dataProcess(vals, rowCount)
      })
      : (() => {
        const dSRange = editRange(ranges)
        let rowCount = dSRange.rowCount({ needToFind: true }),
          currentRow = dSRange.row(), result = []
        if (rowCount <= 5000)
          result = spreadsheet.Values.get(this.spreadsheetId, ranges, {
            ...optionsForAPI,
            valueRenderOption: vro
          }).values || []
        else {
          if (rowCount === Infinity)
            rowCount = this.max(Row)
          while (currentRow < rowCount) {
            let endRow = currentRow + 4999
            if (endRow > rowCount)
              endRow = rowCount
            result.push(...(spreadsheet.Values.get(this.spreadsheetId, ranges.replace(/[0-9]+:/, `${currentRow}:`).replace(/[0-9]*$/, `${endRow}`), {
              ...optionsForAPI,
              valueRenderOption: vro
            }).values || [[]]))
            currentRow += 5000
          }
        }
        return dataProcess(result, rowCount)
      })()).asMLArray()
    if (this.withLog)
      Logger.log('Options: ' + JSON.stringify(options))
    let combinedHeaders = [], widths
    if (isAll && isRangesAnArray && stack === Horizontal)
      widths = ranges.map((range, no) => max(editRange(range).column(), values[no] ? max(values[no].map(row => row.length), 1) : 1))
    if (isAll && withHeader) {
      const headers = this.headers({ sheet, headerRow, unshiftCounts: 0 })
      combinedHeaders = isRangesAnArray && stack === Horizontal
        ? ranges.flatMap((range, no) => {
          const startCol = editRange(range, { withLog: this.withLog }).column() || 1,
            sliced = headers.slice(startCol, startCol + widths[no] - 1)
          return Array.from({ length: widths[no] }, (_, i) => sliced[i] || '')
        })
        : headers.slice(...column)
    }
    if (values.length)
      if (isAll && isRangesAnArray)
        if (stack === Vertical)
          values = values.flat(1)
        else if (fillEmpty) {
          const length = max(values.map(data => data ? data.length : 0)),
            totalWidth = sum(widths),
            newValues = new MLArray(length)
          for (let r = 0; r < length; r++) {
            const newRow = new Array(totalWidth)
            let colOffset = 0
            for (let b = 0; b < values.length; b++) {
              const block = values[b],
                rowData = block?.[r] ?? [],
                blockWidth = widths[b]

              for (let c = 0; c < blockWidth; c++)
                newRow[colOffset + c] = rowData?.[c] ?? ''

              colOffset += blockWidth
            }
            newValues[r] = newRow
          }
          values = newValues
        } else
          values = MLArray.from({ length: max(values.map(block => block.length)) }, (_, row) => values.map(block => (block[row] || [])).lazyFlat())
      else if (!isAll || !isRangesAnArray) {
        if (isRangesAnArray) values = values.flat(1)
        if (fillEmpty)
          values = values.map(row => row?.length ? row : [''])
        if (!isAll) values = values.flat(1)
      }
    if (notFiltered) {
      let rangeRows = editRange(sampleRange).row({ withLastRow: true }),
        rows = [],
        firstRow = 0,
        currentRow = 0
      const rowProcess = (isHidden, index) => {
        if (!isHidden || firstRow)
          currentRow = rangeRows[0] + index
        if (firstRow && isHidden) {
          rows.push([firstRow, currentRow - 1])
          firstRow = 0
        }
        if (!firstRow && !isHidden)
          firstRow = currentRow
      }
      if (filterViewName) {
        /** @type {MLObject<visibleBackgroundColor: GoogleAppsScript.Sheets.Schema.Color>} */
        const specsMap = initObject({})
        // noinspection JSUnresolvedReference
        const metadatas = {},
          /** @type {{[key: string]: any}} */
          filterSpecs = this.get({ ranges: sampleRange, fields: 'sheets(filterViews)', sheet }).sheets[0].filterViews
            .find(fV => fV.title === filterViewName)
            ?.filterSpecs || []
        filterSpecs.forEach(spec => {
          specsMap[spec.columnIndex] = spec.filterCriteria
          if (this.withLog)
            Logger.log(`Hidden Values: ${JSON.stringify(spec.filterCriteria.hiddenValues)}\nVisible Background Color: ${spec.filterCriteria.visibleBackgroundColor}`)
        })
        if (filterSpecs.some(filter => filter.filterCriteria?.visibleBackgroundColor)) {
          const columnWithBgColor = specsMap.keys().immutableFilter(key => specsMap[key].visibleBackgroundColor),
            bgColorData = this.get({
              ranges: columnWithBgColor.map(key => [rangeRows[0], Number(key) + 1, { endRow: rangeRows[1] }]),
              fields: 'sheets(data(rowData(values(effectiveFormat(backgroundColor)))))',
              sheet
            }).sheets[0].data
          columnWithBgColor.forEach((columnIndex, realIndex) => {
            metadatas[columnIndex] = bgColorData[realIndex]?.rowData || []
          })
        }
        values.filter((rowData, row) => {
          let isHidden = false
          for (const columnIndex in specsMap) {
            const realIndex = columnIndex - column[0] + 1,
              { hiddenValues, visibleBackgroundColor } = specsMap[columnIndex]
            // noinspection JSDeprecatedSymbols
            if (
              containOneOf(String(rowData[realIndex] || ''), hiddenValues)
              || (visibleBackgroundColor && !sameWith(metadatas?.[columnIndex]?.[row]?.values[0]?.effectiveFormat?.backgroundColor, visibleBackgroundColor, { withLog: this.withLog }))
            )
              isHidden = true
          }
          if (withRows)
            rowProcess(isHidden, row)
          return !isHidden
        })
      } else {
        let rowMetadata = []
        try {
          const sheetsData = this.get({
            ranges: isRangesAnArray ? ranges : [ranges],
            fields: 'sheets(data(rowMetadata(hiddenByFilter)))',
            sheet
          }).sheets[0].data
          rowMetadata = isRangesAnArray && isAll && stack === Vertical
            ? sheetsData.map(data => data.rowMetadata || []).flat(1)
            : sheetsData[0].rowMetadata || []
          values.filter((_, index) => {
            const isNotHidden = !rowMetadata?.[index]?.hiddenByFilter
            if (withRows)
              rowProcess(!isNotHidden, index)
            return isNotHidden
          })
        } catch (e) {
          rowMetadata = []
        }
      }
      if (withRows) {
        if (firstRow) rows.push([firstRow, currentRow])
        values = { values, rows }
      }
    }
    if (values && dateFormat) {
      let currentValues = values?.rows ? values.values : values
      const formattingFunc = cell => isDate(cell) ? formatDate({ input: cell, format: dateFormat }) : cell,
        /** Untuk memangkas looping, baris 1 digunakan sebagai sample */
        dateColumns = isAll && currentValues[0].search(value => isDate(value))

      for (let r = 0; r < currentValues.length; r++)
        if (isAll)
          for (let c = 0; c < dateColumns.length; c++)
            currentValues[r][dateColumns[c]] = formattingFunc(currentValues[r][dateColumns[c]])
        else
          currentValues[r] = formattingFunc(currentValues[r])

      if (values?.rows)
        values.values = currentValues
      else
        values = currentValues
    }
    if (isAll && withHeader) {
      const tempValues = {}
      combinedHeaders.forEach((header, index) => tempValues[initString(header).toCamelCase()] = (values?.rows ? values.values : values).map(value => value[index]))
      if (values?.rows)
        values.values = tempValues
      else
        values = initObject(tempValues)
    }
    return !values ? [] : trim(values)
  }

  /**
   * Menduplikasi sheet pertama yang terseleksi ke sheet baru dengan nama baru.
   * @param {string} newName
   * @return {SpreadsheetManipulation}
   */
  duplicateSheet(newName) {
    const { sheetId } = spreadsheet.Sheets.copyTo({ destinationSpreadsheetId: this.spreadsheetId }, this.spreadsheetId, this.sheetId.values()[0]),
      cache = getGlobalCache()[CacheType.SheetIds][this.spreadsheetId]
    if (cache)
      cache[newName] = sheetId
    this.sheet = initArray(newName).castToString()
    this.sheetId = initObject({ [newName]: sheetId })
    return this.renameSheet(newName)
  }

  /**
   * Mengganti nama sheet yang terseleksi via updateSheetProperties request.
   * @param {string} newName
   * @return {SpreadsheetManipulation}
   */
  renameSheet(newName) {
    batchUpdate({
      requests: [{
        updateSheetProperties: {
          properties: {
            sheetId: this.sheetId.values()[0],
            title: newName.toString()
          },
          fields: 'title'
        }
      }],
      spreadsheetId: this.spreadsheetId
    })
    return this
  }

  /**
   * Memindahkan fokus cursor aktif ke range A1N target pada sheet aktif.
   * @param {string} to A1Notation
   * @return {SpreadsheetManipulation}
   */
  moveFocus(to) {
    this.selectedSheet().setActiveRange(
      this.selectedSheet().getRange(this.processRange(to, { sheet: this.selectedSheet().getName() })[0])
    )
    return this
  }

  /**
   * Mencari baris/kolom yang mengandung searchValues menggunakan createTextFinder pada range tertentu.
   * @param {number|string} startRowOrRow
   * @param {string|number} startColumnOrColumn
   * @param {string|string[]} searchValues
   * @param {Column|Row|string} type
   * @param {{headerRow?: number, isLastHeader?: boolean, defaultValue?: number, sheet?: SheetType}} options
   * @return {number}
   */
  search(startRowOrRow, startColumnOrColumn, searchValues, type, options = {}) {
    const {
        sheet = this.sheet[0],
        headerRow = this.headerRow[sheet] ?? 1,
        isLastHeader = false,
        defaultValue = 0
      } = options,
      /** @type {RangeOptions} */
      optionsForRange = {
        headerRow,
        isLastHeader
      }
    switch (type) {
      case Column:
        optionsForRange.endColumn = 0
        break
      case Row:
        optionsForRange.untilLastRow = true
        break
      default:
        return defaultValue
    }
    const range = SpreadsheetApp
      .openById(this.spreadsheetId)
      .getSheetByName(sheet)
      .getRange(this.processRange([startRowOrRow, startColumnOrColumn, optionsForRange], { sheet })[0].split('!')[1])
    searchValues = lazyWrap(searchValues)
    let result = 0, i = 0
    while (i < searchValues.length && !result) {
      if (searchValues[i] === NotEmpty || !searchValues[i])
        result = range.createTextFinder('.+').matchEntireCell(true).useRegularExpression(true).findPrevious()?.getRow() + !searchValues[i]
      else
        result = range.createTextFinder(searchValues[i]).matchEntireCell(true).findNext()?.getRow()
      i++
    }
    return result || defaultValue
  }

  /**
   * Menambahkan request mergeCells pada range yang diproses ke seluruh sheet target.
   * @param {RawRange} range
   * @param {string} type MergeType
   * @return {SpreadsheetManipulation}
   */
  merge(range, type) {
    return this.addRequests(
      this.processRange(range).map(range => ({
        mergeCells: {
          range: this.toGridRange(range.split('!')[0], range),
          mergeType: type
        }
      }))
    )
  }

  /**
   * Mengatur warna teks foreground pada range, mendukung input hex string atau objek RGB.
   * @param {RawRange} range
   * @param {string|Object} color
   * @return {SpreadsheetManipulation}
   */
  setColor(range, color) {
    if (typeof color === 'string') {
      if (color.includes('#'))
        color = color.replaceAll('#', '')
      if (color.length === 3)
        color = color.split('').map(c => c + c).join('')
      const int = parseInt(color, 16)
      color = {
        red: ((int >> 16) & 255) / 255,
        green: ((int >> 8) & 255) / 255,
        blue: (int & 255) / 255
      }
    }
    if (!('alpha' in color))
      color.alpha = 1
    return this.addRequests(
      this.sheetId.values().map(sheetId => ({
        repeatCell: {
          range: this.toGridRange(sheetId, range),
          cell: {
            userEnteredFormat: {
              textFormat: {
                foregroundColor: color
              }
            }
          },
          fields: 'userEnteredFormat.textFormat.foregroundColor'
        }
      }))
    )
  }

  /**
   * Mengubah lebar pixel kolom tertentu via updateDimensionProperties request.
   * @param {string|number} column
   * @param {number} sizeInPixel
   * @return {SpreadsheetManipulation}
   */
  resize(column, sizeInPixel) {
    if (isString(column))
      column = getColumnNum(column)
    return this.addRequests(
      this.sheetId.values().map(sheetId => ({
        updateDimensionProperties: {
          range: {
            sheetId,
            dimension: 'COLUMNS',
            startIndex: column - 1,
            endIndex: column
          },
          properties: {
            pixelSize: sizeInPixel
          },
          fields: 'pixelSize'
        }
      }))
    )
  }

  /**
   * Menambahkan request autoFill pada range untuk mengisi pola data secara otomatis.
   * @param {RawRange} range
   * @return {SpreadsheetManipulation}
   */
  autoFill(range) {
    const sheetId = this.sheetId.values()[0]
    return this.addRequests({
      autoFill: {
        range: this.toGridRange(sheetId, range),
        useAlternateSeries: false
      }
    })
  }

  /**
   * Replikasi Find & Replace (Ctrl+H) via findReplace request, mendukung regex, matchCase, matchEntire.
   * @param {{
   *  find?: string,
   *  replace?: string,
   *  range?: RawRange,
   *  matchEntire?: boolean,
   *  matchCase?: boolean,
   *  regex?: boolean,
   *  includeFormula?: boolean,
   *  sheet?: SheetType,
   *  except?: SheetType
   * }} options
   * @return {SpreadsheetManipulation}
   */
  replace(options = {}) {
    const {
      find = '',
      replace = '',
      range = null,
      matchEntire = false,
      matchCase = false,
      regex = false,
      includeFormula = false,
      sheet = this.sheet,
      except = null
    } = options
    if (!find) return this
    if (regex && matchEntire)
      Logger.log('Pemberitahuan: Variabel matchEntire Anda tidak akan digunakan karena Anda sudah memakai regex')
    const request = {
      find: find.toString(),
      replacement: replace.toString()
    }
    if (matchCase)
      request.matchCase = true
    if (matchEntire)
      request.matchEntireCell = true
    if (regex)
      request.searchByRegex = true
    if (includeFormula)
      request.includeFormulas = true
    if (!range) {
      if (sameWith(All, sheet, sheet[0], { logic: Or })) {
        request.allSheets = true
        return this.addRequests({ findReplace: request })
      }
      return this.addRequests(this.processSheet(sheet, except).map(sheet => ({
        findReplace: {
          ...request,
          sheetId: this.sheetId[sheet]
        }
      })))
    }
    return this.addRequests(
      this.processRange(range, { sheet, except }).map(range => ({
        findReplace: { ...request, range: this.toGridRange(...range.split('!')) }
      }))
    )
  }

  /**
   * Menghapus sheet, proteksi, baris, atau kolom berdasarkan tipe dengan opsi include/except filter.
   * @param {Row|Column|Sheet|Protection|string} type
   * @param {{include?: number, except?: number, number?: number|number[], key?: number, range?: RawRange}} options
   * @return {SpreadsheetManipulation}
   */
  delete(type, options = {}) {
    let { include = null, except = null, number = null, key = null, range = null } = options,
      sheet = this.sheet

    if (include && except)
      Logger.log('WARNING! Sintaks redundan. Pilih antara \'include\' ataupun \'except\'')
    if (include) {
      include = lazyWrap(include)
      sheet.filter(sheet => include.includes(sheet))
    }
    if (except) {
      except = lazyWrap(except)
      sheet.filter(sheet => !except.includes(sheet))
    }

    switch (type) {
      case Sheet:
        this.addRequests(sheet.map(sheet => ({
          deleteSheet: {
            sheetId: this.sheetId[sheet]
          }
        })))
        break
      case Protection:
        this.addRequests(
          (this.get({
            fields: `sheets(protectedRanges(protectedRangeId${key ? ',description' : ''}))`,
            ranges: range,
            sheet
          }).sheets || [])
            .flatMap(sheet => sheet.protectedRanges || [])
            .filter(prot => prot?.protectedRangeId && (key ? prot.description === key : true))
            .map(protection => {
              Logger.log(`Menghapus proteksi ${protection.protectedRangeId}`)
              return {
                deleteProtectedRange: protection
              }
            })
        )
        break
      default:
        if (notSameWith(type, Row, Column) || !number) {
          Logger.log('Nomor baris belum didefinisikan atau tipe tidak valid. Skip')
          return this
        }
        if (typeof number === 'number')
          number = repeat(number, 2)
        this.addRequests(
          this.sheet.map(sheet => ({
            deleteDimension: {
              range: {
                sheetId: this.sheetId[sheet],
                dimension: type,
                startIndex: number[0] - 1,
                endIndex: number[1]
              }
            }
          }))
        )
        break
    }
    return this
  }

  /**
   * Menyalin range dari sourceSheet ke targetSheet dengan pasteType tertentu (format/formula/normal).
   * @param {string} sourceSheet
   * @param {RawRange} range
   * @param {PasteType} pasteType
   * @param {{targetSheet?: string|string[], targetRange?: RawRange}} options
   * @return {SpreadsheetManipulation}
   */
  copyPaste(sourceSheet, range, pasteType, options = {}) {
    let { targetSheet = this.sheet.immutableFilter(name => name !== sourceSheet), targetRange = null } = options
    targetSheet = lazyWrap(targetSheet)
    if (typeof sourceSheet === 'number')
      sourceSheet = sourceSheet.toString()
    return this.addRequests(targetSheet.map(name => ({
      copyPaste: {
        source: this.toGridRange(sourceSheet, range),
        destination: this.toGridRange(name, targetRange ?? range),
        pasteType
      }
    })))
  }

  /**
   * Mengatur format tanggal pada range via repeatCell numberFormat request ke seluruh sheetId target.
   * @param {RawRange} range
   * @param {string} format
   * @return {SpreadsheetManipulation}
   */
  formatDate(range, format) {
    const add = id => ({
      repeatCell: {
        range: this.toGridRange(id, range),
        cell: {
          userEnteredFormat: {
            numberFormat: {
              type: 'DATE',
              pattern: format
            }
          }
        },
        fields: 'userEnteredFormat.numberFormat'
      }
    })
    return this.addRequests(this.sheetId.values().map(add))
  }

  /**
   * Menyembunyikan atau menampilkan sheet/baris/kolom via updateSheetProperties atau updateDimensionProperties.
   * @param {Sheet|Row|Column|string} type
   * @param {boolean} view
   * @param {{columnOrRow?: number|string, count?: number, except?: SheetType}} options
   * @return {SpreadsheetManipulation}
   */
  toggleView(type, view, options = {}) {
    let { columnOrRow = null, count = 1, except = null } = options
    if (!this.sheet)
      return this
    if (notSameWith(type, Sheet, Row, Column)) {
      Logger.log(`Tipe ${type} tidak valid. Proses hide diskip.`)
      return this
    }
    except = lazyWrap(except)

    let add
    if (type === Sheet) {
      add = id => ({
        updateSheetProperties: {
          properties: {
            sheetId: id,
            hidden: !view
          },
          fields: 'hidden'
        }
      })
      return this.addRequests(this.sheetId.entries().immutableFilter(([key, _]) => !except.includes(key)).map(([_, value]) => add(value)))
    } else {
      columnOrRow--
      add = id => ({
        updateDimensionProperties: {
          range: {
            sheetId: id,
            dimension: type,
            startIndex: columnOrRow,
            endIndex: columnOrRow + count
          },
          properties: {
            hiddenByUser: !view
          },
          fields: 'hiddenByUser'
        }
      })
      return this.addRequests(this.sheetId.values().map(add))
    }
  }

  /**
   * Menyisipkan baris atau kolom baru setelah posisi tertentu dengan opsi inherit format.
   * @param {number|string} columnOrRow
   * @param {Column|Row|string} type
   * @param {{count?: number, inherit?: boolean}} options
   * @return {SpreadsheetManipulation}
   */
  insertAfter(columnOrRow, type, options = {}) {
    if (notSameWith(type, Column, Row))
      throw Error(`Tipe ${type} tidak valid`)
    if (isString(columnOrRow))
      if (type === Column)
        columnOrRow = getColumnNum(columnOrRow)
      else throw Error(`Baris ${columnOrRow} tidak valid`)

    const { count = 1, inherit = true } = options,
      add = id => ({
        insertDimension: {
          range: {
            sheetId: id,
            dimension: type,
            startIndex: columnOrRow,
            endIndex: columnOrRow + count
          },
          inheritFromBefore: inherit
        }
      })
    return this.addRequests(this.sheetId.values().map(add))
  }

  /**
   * Menyisipkan cell baru pada range dengan shiftDimension Column atau Row.
   * @param {RawRange} range
   * @param {Column|Row|string} type
   * @return {SpreadsheetManipulation}
   */
  insertCell(range, type) {
    if (!type)
      throw Error('Tipe belum didefinisikan')
    else if (notSameWith(type, Column, Row))
      throw Error(`Tipe ${type} tidak valid.`)

    return this.addRequests(
      this.sheetId.values().map(sheetId => ({
        insertRange: {
          range: this.toGridRange(sheetId, this.processRange(range)[0]),
          shiftDimension: type
        }
      }))
    )
  }

  /**
   * Mengurutkan range data dengan helper column, mendukung multi-kolom sort dan hideProcessed filter.
   * @param {string} startColumnTitle
   * @param {string} notEmptyColumnTitle
   * @param {string} endColumnTitle
   * @param {string|string[]} sortByColumnTitle
   * @param {{
   *  startRow?: number,
   *  isAscending?: boolean,
   *  ascendingSortCol?: string|string[],
   *  hideProcessed?: boolean,
   *  headerRow?: number,
   *  hideDelay?: number,
   *  sheet?: string
   * }} options
   * @return {SpreadsheetManipulation}
   */
  sort(startColumnTitle, notEmptyColumnTitle, endColumnTitle, sortByColumnTitle, options = {}) {
    this.run()
    this.updateValueFirst = true
    if (isArray(sortByColumnTitle))
      if (sortByColumnTitle.length > 2)
        throw Error('Maksimal 2 kolom untuk di-sort dengan posisi kosong di atas. Jika ingin sorting biasa, gunakan \'ascendingSortCol\' di parameter terakhir (options).')
      else if (sortByColumnTitle.length < 2)
        throw Error('Minimal 2 kolom untuk di-sort dengan posisi kosong di atas menggunakan array. Jika ingin menggunakan 1 kolom, masukkan sebagai string biasa.')

    const {
        startRow = 2,
        isAscending = true,
        ascendingSortCol = null,
        hideProcessed = false,
        sheet = this.sheet[0],
        headerRow = this.headerRow[sheet] ?? 1
      } = options,
      headers = this.headers({ headerRow }),
      helperColName = 'FILTER HELPER',
      beforeEmptyRow = this.search(startRow, notEmptyColumnTitle, '', Row) - 1,
      values = this.values([startRow, startColumnTitle, {
        endColumn: endColumnTitle,
        endRow: beforeEmptyRow,
      }], { isAll: true })
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
      sortGridRange = this.toGridRange(
        sheet,
        [startRow, startColumnTitle, {
          endRow: beforeEmptyRow,
          endColumn: headers.indexOf(helperColName)
        }]
      )

    this.setValues([startRow, headers.indexOf(helperColName)], helperValues)

    if (ascendingSortCol)
      sortSpecs.push(...ascendingSortCol.map(col => ({
        dimensionIndex: headers.indexOf(col) - 1,
        sortOrder: ascending
      })))

    this.addRequests({
      sortRange: {
        range: sortGridRange,
        sortSpecs
      }
    })

    if (this.delay)
      Utilities.sleep(this.delay * 1000)
    this.run()
    this.empty([startRow, headers.indexOf(helperColName), { endRow: beforeEmptyRow }])
      .updateValueFirst = false
    if (hideProcessed) {
      const filterCriteria = column => ({
        [headers.indexOf(column) - 1]: {
          condition: {
            type: ConditionType.B
          }
        }
      })
      return this.addRequests({
        setBasicFilter: {
          filter: {
            range: this.toGridRange(sheet, [startRow - 1, startColumnTitle, {
                untilLastRow: true,
                headerRow,
                endColumn: endColumnTitle
              }]
            ),
            criteria: isArray(sortByColumnTitle)
              ? Object.assign({}, ...sortByColumnTitle.map(filterCriteria))
              : filterCriteria(sortByColumnTitle)
          }
        }
      })
    }
    return this
  }

  /**
   * Menerapkan basic filter pada range berdasarkan kolom dan condition type tertentu.
   * @param {string|Object[]} ranges
   * @param {number|string} column
   * @param {ConditionType} condition
   * @param {{resetFilter?: boolean}} options
   * @return {SpreadsheetManipulation}
   */
  filter(ranges, column, condition, options = {}) {
    const rangeOptions = {}
    if (typeof ranges !== 'string') {
      const { headerRow = this.headerRow[this.sheet[0]] ?? 1, isLastHeader = false } = isObject(ranges.at(-1))
        ? ranges.at(-1)
        : ranges.every(isArray) && isObject(ranges[0].at(-1))
          ? ranges[0].at(-1)
          : {}
      rangeOptions.headerRow = headerRow
      rangeOptions.isLastHeader = isLastHeader
    }
    ranges = this.processRange(ranges)
    const columnObject = this.sheet.mapToObject(sheet => ({
      [this.sheetId[sheet]]: isString(column) ? this.column(column, {
        ...rangeOptions,
        sheet
      }) : column
    }))
    Logger.log(`Filter\nRange: ${JSON.stringify(ranges)}`)
    const { resetFilter = true } = options,
      gridRanges = ranges.map(range => this.toGridRange(...range.split('!')))

    if (resetFilter)
      this.addRequests(
        gridRanges.map(gridRange => ({
          clearBasicFilter: {
            sheetId: gridRange.sheetId
          }
        }))
      )

    this.addRequests(
      gridRanges.map(gridRange => ({
        setBasicFilter: {
          filter: {
            range: gridRange,
            criteria: {
              [columnObject[gridRange.sheetId] - 1]: {
                condition: {
                  type: condition
                }
              }
            }
          }
        }
      }))
    )
    return this
  }

  /**
   * Mengunci range/sheet dengan proteksi, mendukung editors, description, unprotectedRange, dan auto-delete proteksi lama.
   * @param {{
   *  description?: string,
   *  editors?: string|string[],
   *  deleteOldProtection?: boolean,
   *  range?: RawRange,
   *  unprotectedRange?: RawRange
   * }} options
   * @return {SpreadsheetManipulation}
   */
  protect(options = {}) {
    const {
      description = '',
      editors = me(),
      deleteOldProtection = true
    } = options
    const addConfig = [],
      deleteConfig = MLArray.init([])
    /** @type {GoogleAppsScript.Sheets.Schema.Sheet[]} */
    let sheets,
      { range = null, unprotectedRange = null } = options
    if (range)
      range = this.processRange(range)
    if (unprotectedRange)
      unprotectedRange = this.processRange(unprotectedRange)
    if (!this.sheet && !range)
      return this
    /** @type {Object.<string, GridRange>} */
    let gridRanges = null
    if (!isObject(range))
      gridRanges = parse(
        range
          ? range.map(range => ({ [range]: this.toGridRange(...range.split('!')) }))
          : this.sheet.map(sheet => ({ [sheet]: { sheetId: this.sheetId[sheet] } }))
      )
    if ((!this.sheet || range) && unprotectedRange)
      unprotectedRange = null
    if (deleteOldProtection) {
      if (!this.deleteProtections)
        this.deleteProtections = this.get({ fields: `sheets(properties(title),protectedRanges(protectedRangeId,range))` }).sheets
      sheets = this.deleteProtections
    }

    if (unprotectedRange)
      unprotectedRange = parse(
        this.sheet.map(sheet => ({
          [sheet]: unprotectedRange.filter(range => range.startsWith(sheet + '!')).map(range => this.toGridRange(sheet, range))
        }))
      )

    const protect = (range) => {
      if (deleteOldProtection) {
        const targetSheet = sheets.length > 1 ? sheets.find(sheet => sheet.properties.title === (range.includes('!') ? range.split('!')[0] : range)) : sheets[0]
        if (targetSheet?.protectedRanges) {
          const gridRange = gridRanges?.[range] ?? range,
            targetProt = targetSheet.protectedRanges.filter(prot =>
              range.includes('!')
                ? between(gridRange.startRowIndex, [prot.range.startRowIndex, prot.range.endRowIndex ?? 1e9], gridRange.endRowIndex ?? 1e9, ['<=<', '<<='])
                && between(gridRange.startColumnIndex, [prot.range.startColumnIndex, prot.range.endColumnIndex ?? 1e9], gridRange.endColumnIndex ?? 1e9, ['<=<', '<<='])
                : Object.keys(prot.range).every(key => key === 'sheetId')
            )
          if (targetProt.length)
            deleteConfig.push(targetProt.map(prot => prot.protectedRangeId))
        }
      }
      const toInput = {
        range: gridRanges?.[range] ?? range
      }
      if (description)
        toInput.description = description
      if (editors)
        toInput.editors = {
          users: lazyWrap(editors)
        }
      if (unprotectedRange)
        toInput.unprotectedRanges = unprotectedRange[range]
      addConfig.push(toInput)
      Logger.log(`Mengunci range / sheet ${JSON.stringify(range)}`)
    }

    (range ?? this.sheet).forEach(protect)

    this.addRequests(
      deleteConfig.map(id => ({
        deleteProtectedRange: {
          protectedRangeId: id
        }
      })),
      addConfig.map(config => ({
        addProtectedRange: {
          protectedRange: config
        }
      }))
    )
    return this
  }

  /**
   * Mengosongkan nilai pada range menggunakan batchClear via addEmptyValueRequests.
   * @param {RawRange} ranges
   * @param {ProcessRangeOptions} options
   * @return {SpreadsheetManipulation}
   */
  empty(ranges, options = {}) {
    ranges = this.processRange(ranges, options)
    return this.addEmptyValueRequests(ranges)
  }

  /**
   * Mengubah valueInputOption menjadi Raw agar input tidak di-parse oleh Sheets.
   * @return {SpreadsheetManipulation}
   */
  inputAsRaw() {
    this.vio = Raw
    return this
  }

  /**
   * Menulis satu nilai ke satu atau banyak range, mendukung function callback untuk dynamic values.
   * @param {RawRange} ranges
   * @param {Object|Object[]|Object[][]|Function} values
   * @param {{except?: string|string[], includeInvalid?: boolean, sheet?: SheetType, withoutSheet?: boolean, isRaw?: boolean}} options
   * @return {SpreadsheetManipulation}
   */
  setValue(ranges, values, options = {}) {
    const isValuesArray = isArray(values)
    if (this.isRangesAnArray(ranges) && isTypeOf('string', ...ranges) && isValuesArray && ranges.length !== values.length)
      throw Error('Jumlah value dan range yang dimasukkan sebagai parameter tidak sama.')
    const { isRaw = false, ...rest } = options
    ranges = this.processRange(ranges, rest)
    const isValues2d = isValuesArray && values.every(isArray)
    let currentNo = 0, currentSheet = null
    if (this.withLog)
      Logger.log(`Value: ${values}\nTipe Value: ${typeof values}\nIs Value Function: ${typeof values === 'function'}`)
    this.addValueRequests(
      ranges.map((/** @type {string} */ range) => {
        const sheet = range.split('!')[0]
        if (sheet !== currentSheet) {
          currentSheet = sheet
          currentNo = 0
        } else
          currentNo++
        const dsRange = editRange(range),
          rowCount = dsRange.rowCount(),
          calculatedValues = typeof values === 'function'
            ? values(sheet, dsRange.columnCount({ isLetter: true }), dsRange.row())
            : values,
          isCalculated2d = isArray(calculatedValues) && calculatedValues.every(isArray)
        if (this.withLog)
          Logger.log(`Calculated Values: ${calculatedValues}`)
        return {
          range,
          values: isValues2d
            ? values
            : isCalculated2d
              ? calculatedValues
              : repeat(wrap(calculatedValues), rowCount)
        }
      })
    )
    return this
  }

  /**
   * Menulis array 2D values ke range, mendukung multi-range dengan distribusi values otomatis.
   * @param {string|string[]|Object[]|Object[][]} ranges
   * @param {Object|Object[]|Object[][]|Object[][][]} values
   * @param {{except?: string|string[], includeInvalid?: boolean, sheet?: SheetType, withoutSheet?: boolean}} options
   * @return {SpreadsheetManipulation}
   */
  setValues(ranges, values, options = {}) {
    const isValuesArray = isArray(values),
      isValues2d = isValuesArray && values.every(isArray),
      isRangesAnArray = this.isRangesAnArray(ranges)
    if (isRangesAnArray && isTypeOf('string', ...ranges) && isValues2d && ranges.length !== values.length)
      throw Error('Jumlah value dan range yang dimasukkan sebagai parameter tidak sama.')
    ranges = this.processRange(ranges, options)
    let currentNo = 0, currentSheet = null
    this.addValueRequests(
      ranges.map(/** @type {string} */range => {
        const sheet = range.split('!')[0]
        if (sheet !== currentSheet) {
          currentSheet = sheet
          currentNo = 0
        } else
          currentNo++
        const dsRange = editRange(range),
          rowCount = dsRange.rowCount(),
          columnCount = dsRange.columnCount()
        return {
          range,
          values: (isValues2d && isRangesAnArray)
            ? values[currentNo]?.every(isArray)
              ? values[currentNo]
              : repeat(values[currentNo], rowCount)
            : isValues2d
              ? values
              : repeat(isValuesArray ? values : repeat(values, columnCount), rowCount)
        }
      })
    )
    return this
  }

  /**
   * Menandai flag untuk auto-grant IMPORTRANGE permission pada saat run dieksekusi.
   * @return {SpreadsheetManipulation}
   */
  grant() {
    this.customRequests.grant = true
    return this
  }

  /**
   * Mengeksekusi seluruh queued requests (clear, values update, batchUpdate) secara berurutan dan mengembalikan responses.
   * @param {any[]} params
   * @return {Object[]}
   */
  run(...params) {
    this.deleteInvalidRequest()
    const total = this.requests.length + this.valueRequests.length + this.emptyValueRequests.length
    while (this.emptyValueRequests.length) {
      Logger.log(`Mengeksekusi ${Math.min(this.batch, this.emptyValueRequests.length)} values clear`)
      spreadsheet.Values.batchClear({ ranges: this.emptyValueRequests.splice(0, this.batch) }, this.spreadsheetId)
    }
    if (this.updateValueFirst) {
      this.processEdit()
      this.processRequest(...params)
    } else {
      this.processRequest(...params)
      this.processEdit()
    }
    Logger.log(`Berhasil mengeksekusi ${total} request pada spreadsheet ${this.spreadsheet}`)
    const customRequestKeys = Object.keys(this.customRequests)
    if (customRequestKeys.length) {
      customRequestKeys.forEach(key => {
        switch (key) {
          case 'grant':
            const token = ScriptApp.getOAuthToken()
            const sources = new Set()
            const ss = SpreadsheetApp.openById(this.spreadsheetId)
            const matches = ss
              .createTextFinder('IMPORTRANGE')
              .matchFormulaText(true)
              .findAll()

            matches.forEach(range => {
              const formula = range.getFormula()
              if (formula) {
                for (const match of formula.matchAll(Regex.Importrange.SpreadsheetId)) {
                  const raw = match[2]
                  let id = raw
                  if (raw?.includes('/')) {
                    const parts = raw.split('/d/')
                    if (parts.length > 1)
                      id = parts[1].split('/')[0]
                    else
                      continue
                  }
                  if (id?.length > 10)
                    sources.add(id)
                }
              }
            })

            if (sources.size === 0) {
              Logger.log('Tidak ditemukan IMPORTRANGE dalam file ini.')
              return
            }

            // Siapkan request secara paralel
            const sourceIds = Array.from(sources)
            const requests = sourceIds.map(id => ({
              url: `https://docs.google.com/spreadsheets/d/${this.spreadsheetId || ss.getId()}/externaldata/addimportrangepermissions?donorDocId=${id}`,
              method: 'post',
              headers: { Authorization: `Bearer ${token}` },
              muteHttpExceptions: true
            }))
            // Eksekusi HTTP request secara massal
            const responses = UrlFetchApp.fetchAll(requests)
            let success = 0, fail = 0

            responses.forEach((res, no) => {
              const code = res.getResponseCode()
              if (code === 200) {
                success++
                Logger.log(`✅ donorDocId: ${sourceIds[no]}`)
              } else {
                fail++
                Logger.log(`❌ donorDocId: ${sourceIds[no]}\n  Response Code: ${code}\n  Detail: ${res.getContentText()}`)
              }
            })
            Logger.log(`grantAllImportrange selesai — Berhasil: ${success}, Gagal: ${fail}, Total: ${responses.length}`)
            delete this.customRequests.grant
            break
        }
      })
    }
    return this.responses
  }

  /**
   * Mengeksekusi seluruh valueRequests via Sheets.Values.batchUpdate dalam batch.
   */
  processEdit() {
    while (this.valueRequests.length) {
      Logger.log(`Mengeksekusi ${Math.min(this.batch, this.requests.length)} values update`)
      spreadsheet.Values.batchUpdate({
        data: this.valueRequests.splice(0, this.batch),
        valueInputOption: this.vio
      }, this.spreadsheetId)
    }
  }

  /**
   * Mengeksekusi seluruh structural requests via Sheets.Spreadsheets.batchUpdate dalam batch.
   * @param {any[]} params
   */
  processRequest(...params) {
    while (this.requests.length) {
      Logger.log(`Mengeksekusi ${Math.min(this.batch, this.requests.length)} request`)
      const toExecuteRequests = this.requests.splice(0, this.batch)
      this.responses.push(...(batchUpdate({
        requests: toExecuteRequests,
        spreadsheetId: this.spreadsheetId,
        withoutRetry: toString(toExecuteRequests).toLowerCase().includes('protect')
      })?.replies || []))
      if (this.afterRun)
        this.afterRun(this.requests.length, ...params)
    }
  }

  /**
   * Menambahkan satu atau banyak request object ke antrian requests setelah di-flat.
   * @param {Object|Object[]} array
   * @return {SpreadsheetManipulation}
   */
  addRequests(...array) {
    array = flat(array)
    if (array.length)
      this.requests.push(array)
    return this
  }

  /**
   * Menambahkan satu atau banyak value update object ke antrian valueRequests.
   * @param {Object[]|Object[][]} array
   * @return {SpreadsheetManipulation}
   */
  addValueRequests(...array) {
    array = flat(array)
    if (array.length)
      this.valueRequests.push(array)
    return this
  }

  /**
   * Menambahkan range string ke antrian emptyValueRequests untuk batchClear.
   * @param {Object[]|Object[][]} array
   * @return {SpreadsheetManipulation}
   */
  addEmptyValueRequests(...array) {
    array = flat(array)
    if (array.length)
      this.emptyValueRequests.push(array)
    return this
  }

  /**
   * Membersihkan request yang tidak valid (empty object atau tipe salah) dari ketiga antrian.
   */
  deleteInvalidRequest() {
    if (this.requests.length)
      this.requests = trim(this.requests.filter(req => isObject(req) && Object.keys(req).length))
    if (this.valueRequests.length)
      this.valueRequests = trim(this.valueRequests.filter(req => isObject(req) && Object.keys(req).length))
    if (this.emptyValueRequests.length)
      this.emptyValueRequests = trim(this.emptyValueRequests.filter(req => isString(req)))
  }

  processSheet(sheet, except) {
    if (isString(sheet))
      sheet = initArray(sheet.split(', '))
    if (typeof sheet === 'number' || (isArray(sheet) && isTypeOf('number', sheet)))
      sheet = initArray(sheet).map(sheet => sheet.toString())
    if (except) {
      if (isString(except))
        except = initArray(except.split(', '))
      sheet = sheet.immutableFilter(sheet => !except.includes(sheet))
    }
    return sheet
  }

  /**
   * Mengonversi RawRange input (array/string/object) menjadi array A1N string lengkap dengan sheet prefix.
   * @param {RawRange} ranges
   * @param {ProcessRangeOptions} options
   * @return {string[]}
   */
  processRange(ranges, options = {}) {
    ranges = lazyWrap(ranges)
    let {
      except = null,
      includeInvalid = false,
      sheet = this.sheet,
      withoutSheet = false
    } = options
    sheet = this.processSheet(sheet, except)

    if (isTypeOf('string', ranges)) {
      if (withoutSheet) return ranges
      ranges = ranges.map(/** @param {string} range */range => {
        if (isString(range) && /[^A-Z:!\d]/.test(range)) {
          /** @type {GridRange} */
          const namedRange = this.namedRanges()?.find(namedRange => namedRange.name === range)?.range
          range = namedRange ? toA1Notation(this.sheetId.getKeyByValue(namedRange.sheetId), namedRange) : '#SKIP#'
        }
        return range
      })
      return sheet.flatMap(sheet =>
        ranges.map(range =>
          range?.includes('!')
            ? range.split('!')[0] === sheet
              ? range
              : range.replace(/^[a-zA-Z1-9]+!/, `${sheet}!`)
            : `${sheet}!${range}`
        )
      )
    } else if (isObject(...ranges)) {
      return sheet.flatMap(sheet =>
        ranges.map(range => ({ ...range, sheetId: this.sheetId[sheet] }))
      )
    }

    if (!isArray(ranges[0]))
      ranges = wrap(ranges)
    ranges = sheet.flatMap(sheet =>
      ranges.map((/** @type {Object[]} */ range) => {
        return typeof range?.[0] === 'number'
          ? [sheet, ...range]
          : range[0] !== sheet
            ? [sheet, ...range.slice(1)]
            : range
      })
    )

    let
      /** @type {MLArray[]} */
      headers,
      lastRows, lastColumns
    if (ranges.some(range => isTypeOf('string', range[2], range.at(-1).endColumn, { logic: Or }) && max(range[2]?.length ?? 1, range.at(-1).endColumn?.length ?? 1) > 1)) {
      const cacheKey = `${this.spreadsheetId}_${sheet}_mix_${this.headerRow[sheet] ?? ranges[0].at(-1).headerRow ?? 1}`,
        cache = getGlobalCache()
      if (!cache.headers[cacheKey]) {
        const row = this.headerRow[sheet] ?? ranges[0].at(-1)?.headerRow ?? 1
        addToGlobalCache(
          CacheType.Header,
          cacheKey,
          this.values([`${row}:${row}`], {
            spreadsheetId: this.spreadsheetId,
            fillEmpty: false,
            isAll: true,
            stack: Vertical,
            sheet
          })
        )
      }
      headers = cache[CacheType.Header][cacheKey].map(array => initArray(array))
    }

    if (ranges.some(range => sameWith(0, range[1], range[2], range.at(-1).endRow, range.at(-1).endColumn, {
      logic: Or,
      withLog: false
    }))) {
      const key = `max_${sheet}_mix`
      if (!this.cache[key])
        this.cache[key] = this.get({ fields: 'sheets.properties(title,gridProperties(rowCount,columnCount))' }).sheets
      lastRows = parse(this.cache[key].map(({ properties }) => ({ [properties.title]: properties.gridProperties.rowCount })))
      lastColumns = parse(this.cache[key].map(({ properties }) => ({ [properties.title]: properties.gridProperties.columnCount })))
    }

    ranges = ranges
      .flatMap(range => {
        if (this.withLog)
          Logger.log(range)
        const options = range.at(-1)
        let {
            endColumn = null,
            endRow = null,
            untilLastRow = false,
            isLastHeader = false,
            rowCount = null,
            columnCount = null,
            headerOrder = 1
          } = isObject(options) ? options : {},
          startColumn = range[2]
        if (isAllArray(startColumn, endColumn) && startColumn?.length < endColumn?.length)
          throw Error(`Tidak valid. Jumlah endColumns lebih banyak dari startColumns.`)
        startColumn = lazyWrap(startColumn)
        endColumn = lazyWrap(endColumn)
        /**
         * @param {number|string|MLString} column
         * @param no
         * @return {string}
         */
        const process = (column, no) => {
          if (column instanceof String)
            column = column.toString()
          const startColumnNum = typeof column === 'string' && column.length > 1
            ? (isLastHeader
            ? headers?.[sheet.indexOf(range[0])]?.lastIndexOf(column)
            : headers?.[sheet.indexOf(range[0])]?.findIndexInOrder(column, headerOrder)) + 1
            : column || lastColumns[range[0]]
          if (!startColumnNum) {
            Logger.log(`Sheet ${range[0]} tidak memiliki kolom ${column}. Range dilewati`)
            return `${range[0]}!#SKIP#`
          }
          let startColumn = getColumnLetter(startColumnNum),
            result = `${range[0]}!${startColumn}${range[1] || lastRows[range[0]]}`
          let endColumnLocal = endColumn[no]
          if (endColumnLocal != null) {
            if (endColumnLocal instanceof String)
              endColumnLocal = endColumnLocal.toString()
            const endColumnNum = typeof endColumnLocal === 'string' && endColumnLocal.length > 1
              ? (isLastHeader
              ? headers?.[sheet.indexOf(range[0])]?.lastIndexOf(endColumnLocal)
              : headers?.[sheet.indexOf(range[0])]?.findIndexInOrder(endColumnLocal, headerOrder)) + 1
              : endColumnLocal || lastColumns[range[0]]
            if (!endColumnNum) {
              Logger.log(`Sheet ${range[0]} tidak memiliki kolom ${endColumnLocal}. Range dilewati`)
              return `${range[0]}!#SKIP#`
            }
            endColumnLocal = getColumnLetter(endColumnNum)
          } else if (columnCount)
            endColumnLocal = getColumnLetter(startColumnNum + columnCount - 1)
          if (untilLastRow || endColumnLocal || endRow || rowCount)
            result += `:${endColumnLocal || startColumn}${!untilLastRow ? rowCount ? (range[1] + rowCount - 1) : endRow ?? range[1] ?? lastRows[range[0]] : ''}`
          if (this.withLog)
            Logger.log(result)
          return result
        }
        return startColumn.map(process)
      })

    if (!includeInvalid)
      ranges = ranges.filter(range => !range.endsWith('#SKIP#'))

    return withoutSheet ? unique(ranges.map(range => range.split('!')[1])) : ranges
  }

  /**
   * Validator helper yang mengecek apakah input ranges berformat array multi-range.
   * @param {any} ranges
   * @return {boolean}
   */
  isRangesAnArray(ranges) {
    return isArray(ranges) && (isTypeOf('string', ...ranges) || isAllArray(...ranges) || isObject(...ranges) || isArray(ranges[1]))
  }

  /**
   * Mengonversi sheet name + range menjadi objek GridRange menggunakan editRange().toGrid().
   * @param {string} sheet
   * @param {RawRange} range
   * @return {GridRange}
   */
  toGridRange(sheet, range) {
    let sheetName = sheet, sheetId = sheet
    if (isString(sheetName))
      sheetId = this.sheetId[sheet]
    else
      sheetName = this.sheetId.getKeyByValue(sheet)
    if (!isString(range))
      range = this.processRange(range, { sheet: sheetName })[0]
    return editRange(range).toGrid(sheetId)
  }

  /**
   * Menyimpan nomor header row untuk sheet pertama yang terseleksi ke cache.
   * @param {number} headerRow
   * @return {SpreadsheetManipulation}
   */
  setHeaderRow(headerRow) {
    if (!this.headerRow[this.sheet[0]])
      this.headerRow[this.sheet[0]] = headerRow
    return this
  }
}

/**
 * Membuat instans class Request Builder
 * @param {string|null} spreadsheetIdOrTitle
 * @param {string|string[]|null} sheet
 * @param {SpreadsheetManipulationOptions} options
 * @return {SpreadsheetManipulation}
 */
function createRequest(spreadsheetIdOrTitle = null, sheet = null, options = {}) {
  return new SpreadsheetManipulation(spreadsheetIdOrTitle, sheet, options)
}

/** Helper */

/**
 * - Shorthand untuk Sheets.Spreadsheets.batchUpdate
 * @param {{requests?: Object[], spreadsheetId?: string|null, attempts?: number, withoutRetry?: boolean}|GoogleAppsScript.Sheets.Schema.BatchUpdateSpreadsheetRequest} options
 * @return {GoogleAppsScript.Sheets.Schema.BatchUpdateSpreadsheetResponse}
 */
function batchUpdate(options = {}) {
  const { requests = [], spreadsheetId = null, attempts = 3, withoutRetry = false, ...optionsForAPI } = options
  if (requests.length)
    return retry(() => spreadsheet.batchUpdate({ requests, ...optionsForAPI }, spreadsheetId), {
      attempts: withoutRetry ? 1 : attempts,
      withReturnValue: true
    })
  else
    throw Error('Tidak ada request yang dikirim. Objek \'requests\' kosong')
}

/** @type {GoogleAppsScript.Sheets.Collection.SpreadsheetsCollection} */
var spreadsheet = Sheets.Spreadsheets