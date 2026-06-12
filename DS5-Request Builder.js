// noinspection JSValidateJSDoc

/**
 * Tipe data diubah biar bisa autocomplete lokal?
 * @typedef {GoogleAppsScript.Sheets.Schema.GridRange} GridRange
 */


class SpreadsheetManipulation {
  /**
   * @param {string|null} spreadsheetIdOrTitle
   * @param {string|string[]|null} sheet
   * @param {Object} options
   */
  constructor(spreadsheetIdOrTitle = null, sheet = null, options = {}) {
    const { requests = null, valueRequests = null, customRequests = null, except = null, batch = 1000, withoutRetry = false, afterRun = null, withLog = true } = options
    /** @type {Object[]} */
    this.requests = requests ?? []
    this.valueRequests = valueRequests ?? []
    this.emptyValueRequests = []
    this.customRequests = customRequests ?? {}
    this.responses = []
    this.spreadsheet = spreadsheetIdOrTitle ?? SpreadsheetApp.getActiveSpreadsheet().getId()
    this.spreadsheetId = this.spreadsheet.includes(' ') ? getFileIdByName(this.spreadsheet) : this.spreadsheet
    this.batch = batch
    this.withoutRetry = withoutRetry
    this.withLog = withLog
    /** @type {{ activeSheet: SpreadsheetApp.Sheet }} */
    this.cache = {}
    if (afterRun)
      this.afterRun = afterRun
    if (!this.spreadsheetId)
      throw Error('Tidak ada spreadsheet yang sedang aktif saat ini.')
    if (sheet)
      this.selectSheet(sheet, except)
  }

  selectSheet(sheet, except = null) {
    Logger.log(`Menuju sheet ${sheet}`)
    let cache = getGlobalCache()[CacheType.SheetIds][this.spreadsheetId]
    if (!cache) {
      /** @type {Sheets_v4.Sheets.V4.Schema.Sheet[]} */
      const sp = retry(() => this.get({ fields: 'sheets.properties(sheetId,title)' }).sheets, { withReturnValue: true }),
        result = {}
      sp.forEach(sheet => result[sheet.properties.title] = sheet.properties.sheetId)
      addToGlobalCache(CacheType.SheetIds, this.spreadsheetId, result)
      cache = { ...result }
    } else
      cache = { ...cache }

    switch (sheet) {
      case Daily:
        /** @type {string[]} */
        this.sheet = iterate(i => i.toString(), { until: 31 })
        break
      case Monthly:
        this.sheet = [...shortMonths]
        break
      case Active:
        this.sheet = wrap(this.selectedSheet().getName())
        this.sheetId = { [this.sheet[0]]: this.selectedSheet().getSheetId() }
        return this
      case All:
        this.sheet = Object.keys(cache)
        break
      default:
        this.sheet = unique(lazyWrap(sheet).map(sheet => typeof sheet === 'number' ? sheet.toString() : sheet))
    }

    Object.keys(cache).forEach(key => {
      if (!this.sheet.includes(key))
        delete cache[key]
    })

    const keys = Object.keys(cache)
    if (keys.length !== this.sheet.length)
      throw Error(`Sheet ${join(this.sheet.filter(sheet => !keys.includes(sheet)))} tidak ada.`)

    if (except) {
      except = lazyWrap(except)
      this.sheet = this.sheet.filter(sheet => !except.includes(sheet))
      except.forEach(name => delete cache[name])
    }

    this.sheetId = cache
    return this
  }

  selectedSheet() {
    if (!this.cache.activeSheet)
      this.cache.activeSheet = SpreadsheetApp.getActiveSheet()
    return this.cache.activeSheet
  }

  /**
   * Mengambil range yang sedang aktif
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
   * Mengambil cell yang sedang aktif (dikelilingi oleh border yang lebih gelap)
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
   * @return {Sheets_v4.Sheets.V4.Schema.Spreadsheet}
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

  headers(options = {}) {
    const { headerRow = 1, unshiftCounts = 1, sheet = this.sheet[0] } = options
    const cacheKey = `${this.spreadsheetId}_${sheet}_${headerRow}`,
      cache = getGlobalCache()
    if (!cache.headers[cacheKey])
      addToGlobalCache(
        CacheType.Header,
        cacheKey,
        this.getValues(`${headerRow}:${headerRow}`, { fillEmpty: false, sheet })
      )
    const headers = [...cache.headers[cacheKey]]
    const unshiftArr = Array.from({ length: unshiftCounts }, () => '')
    headers.unshift(...unshiftArr)
    return headers
  }

  /**
   * @param {string|string[]} columnName
   * @param {Object} options
   * @return {string|string[]|number|number[]}
   */
  column(columnName, options = {}) {
    const { headerRow = 1, isLastHeader = false, isLetter = false, unshiftCounts = 1, withHeader = false, prefix = '', sheet = this.sheet[0] } = options,
      headers = this.headers({ headerRow, sheet, unshiftCounts }),
      cols = [],
      isCNArray = isArray(columnName),
      length = isCNArray ? columnName.length : 1
    let result = {}, i = 0, name = isCNArray ? columnName[i] : columnName
    do {
      const colNum = isLastHeader ? headers.lastIndexOf(name) : headers.indexOf(name)
      if (colNum < 1) throw Error(`Kolom dengan judul ${name} tidak ada pada sheet ${sheet}. Spreadsheet: ${this.spreadsheetId}`)
      const col = isLetter ? getColumnLetter(colNum) : colNum
      if (withHeader) {
        name = name.toLowerCase()
        if (prefix)
          name = prefix + ' ' + name
        result[toCamelCase(name)] = col
      }
      else
        cols.push(col)
      i++
      name = columnName?.[i]
    } while (i < length)
    if (!withHeader)
      result = isCNArray ? cols : cols[0]
    if (this.withLog)
      Logger.log(`\nHeader: ${headers}\nCols: ${cols}\nResult: ${isObject(result) ? Object.entries(result) : result}`)
    return result
  }

  max(type, options = {}) {
    const { isLetter = false } = options,
      key = `max_${this.sheet[0]}_${type}`
    switch (type) {
      case Column:
        if (!this.cache[key])
          this.cache[key] = this.get({ fields: 'sheets.properties.gridProperties.columnCount', sheet: this.sheet[0] }).sheets[0].properties.gridProperties.columnCount
        return isLetter ? getColumnLetter(this.cache[key]) : this.cache[key]
      case Row:
        if (!this.cache[key])
          this.cache[key] = this.get({ fields: 'sheets.properties.gridProperties.rowCount', sheet: this.sheet[0] }).sheets[0].properties.gridProperties.rowCount
        return this.cache[key]
    }
  }

  /** @return {string} */
  timezone() {
    if (!this.cache.timezone)
      this.cache.timezone = this.get({ sheet: null, fields: 'properties.timeZone' }).properties.timeZone
    return this.cache.timezone
  }

  value(ranges, options = {}) {
    const { vro = Formatted, ...optionsForAPI } = options
    ranges = this.processRange(ranges, { includeInvalid: true })[0]
    if (ranges.endsWith('#SKIP#'))
      return this
    let values = spreadsheet.Values.get(this.spreadsheetId, ranges, { ...optionsForAPI, valueRenderOption: vro }).values
    if (values)
      values = values.flat(2)
    return !values?.length ? undefined : values[0]
  }

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
    } = options,
      dataProcess = (vals, rowCount) => {
        if (rowCount !== Infinity && vals.length < rowCount)
          vals = vals.concat(repeat(() => [], rowCount - vals.length))
        return vals.length ? vals : repeat(() => [], rowCount === Infinity ? 1 : rowCount)
      }
    let headerRow = 1, column = 0, sampleRange = '', { sheet = this.sheet, ...optionsForAPI } = rest
    if (ranges.every(isArray))
      headerRow = unique(ranges.map(range => range.at(-1).headerRow))[0] ?? 1
    ranges = this.processRange(ranges, { sheet })
    const isRangesAnArray = isArray(ranges)
    if (notFiltered || withHeader) {
      sampleRange = isRangesAnArray ? ranges[0] : ranges
      sheet = (isRangesAnArray ? ranges[0] : ranges).split('!')[0]
    }
    if (filterViewName || withHeader)
      column = getColumnFromA1N(sampleRange, { withLastColumn: true, withLog: this.withLog })
    if (this.withLog)
      Logger.log(ranges)
    let values = isRangesAnArray
      ? spreadsheet.Values.batchGet(this.spreadsheetId, { ranges, ...optionsForAPI, valueRenderOption: vro }).valueRanges.map((result, index) => {
        let vals = result.values || []
        const rowCount = getRowCountFromA1N(ranges[index])
        return dataProcess(vals, rowCount)
      })
      : (() => {
        let rowCount = getRowCountFromA1N(ranges, { needToFind: true })
        let currentRow = getRowFromA1N(ranges), result = []
        if (rowCount <= 5000)
          result = spreadsheet.Values.get(this.spreadsheetId, ranges, { ...optionsForAPI, valueRenderOption: vro }).values || []
        else {
          if (rowCount === Infinity)
            rowCount = this.max(Row)
          while (currentRow < rowCount) {
            let endRow = currentRow + 4999
            if (endRow > rowCount)
              endRow = rowCount
            result.push(...(spreadsheet.Values.get(this.spreadsheetId, ranges.replace(/[0-9]+:/, `${currentRow}:`).replace(/[0-9]*$/, `${endRow}`), { ...optionsForAPI, valueRenderOption: vro }).values || [[]]))
            currentRow += 5000
          }
        }
        return dataProcess(result, rowCount)
      })()
    if (this.withLog)
      Logger.log('Options: ' + JSON.stringify(options))
    let combinedHeaders = [], widths
    if (isAll && isRangesAnArray && stack === Horizontal)
      widths = ranges.map((range, no) => max(getColumnCountFromA1N(range), values[no] ? max(values[no].map(row => row.length), 1) : 1))
    if (isAll && withHeader) {
      const headers = this.headers({ sheet, headerRow, unshiftCounts: 0 })
      combinedHeaders = isRangesAnArray && stack === Horizontal
        ? ranges.flatMap((range, no) => {
          const startCol = getColumnFromA1N(range, { withLog: this.withLog }) || 1
          const sliced = slice(headers, startCol, startCol + widths[no] - 1)
          return Array.from({ length: widths[no] }, (_, i) => sliced[i] || '')
        })
        : slice(headers, ...column)
    }
    if (values.length)
      if (isAll && isRangesAnArray)
        if (stack === Vertical)
          values = values.flat(1)
        else if (fillEmpty) {
          const length = max(values.map(data => data ? data.length : 0)),
            totalWidth = sum(widths),
            newValues = new Array(length)
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
          values = Array.from({ length: max(values.map(block => block.length)) }, (_, row) => values.map(block => (block[row] || [])).flat())
      else if (!isAll || !isRangesAnArray) {
        if (isRangesAnArray) values = values.flat(1)
        if (fillEmpty)
          values = values.map(row => row?.length ? row : [''])
        if (!isAll) values = values.flat(1)
      }
    if (notFiltered) {
      let rangeRows = getRowFromA1N(sampleRange, { withLastRow: true }),
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
        const specsMap = {}, metadatas = {},
          filterSpecs = this.get({ ranges: sampleRange, fields: 'sheets(filterViews)', sheet }).sheets[0].filterViews
            .find(fV => fV.title === filterViewName)
            ?.filterSpecs || []
        filterSpecs.forEach(spec => {
          specsMap[spec.columnIndex] = spec.filterCriteria
          if (this.withLog)
            Logger.log(`Hidden Values: ${JSON.stringify(spec.filterCriteria.hiddenValues)}\nVisible Background Color: ${spec.filterCriteria.visibleBackgroundColor}`)
        })
        if (filterSpecs.some(filter => filter.filterCriteria?.visibleBackgroundColor)) {
          const columnWithBgColor = Object.keys(specsMap).filter(key => specsMap[key].visibleBackgroundColor),
            bgColorData = this.get({
              ranges: columnWithBgColor.map(key => [rangeRows[0], Number(key) + 1, { endRow: rangeRows[1] }]),
              fields: 'sheets(data(rowData(values(effectiveFormat(backgroundColor)))))',
              sheet
            }).sheets[0].data
          columnWithBgColor.forEach((columnIndex, realIndex) => {
            metadatas[columnIndex] = bgColorData[realIndex]?.rowData || []
          })
        }
        values = values.filter((rowData, row) => {
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
          const sheetsData = this.get({ ranges: isRangesAnArray ? ranges : [ranges], fields: 'sheets(data(rowMetadata(hiddenByFilter)))', sheet }).sheets[0].data
          rowMetadata = isRangesAnArray && isAll && stack === Vertical
            ? sheetsData.map(data => data.rowMetadata || []).flat(1)
            : sheetsData[0].rowMetadata || []
          values = values.filter((_, index) => {
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
        dateColumns = isAll && getIndexesWith((value) => isDate(value), currentValues[0])

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
      combinedHeaders.forEach((header, index) => tempValues[toCamelCase(header)] = (values?.rows ? values.values : values).map(value => value[index]))
      if (values?.rows)
        values.values = tempValues
      else
        values = tempValues
    }
    return !values ? [] : values
  }

  duplicateSheet(newName) {
    spreadsheet.Sheets.copyTo({ destinationSpreadsheetId: this.spreadsheetId }, this.spreadsheetId, Object.values(this.sheetId)[0])
    resetCache()
    this.rename(newName)
    this.selectSheet(newName)
    return this
  }

  renameSheet(newName) {
    return this.addRequests({
      updateSheetProperties: {
        properties: {
          sheetId: Object.values(this.sheetId)[0],
          title: newName
        },
        fields: 'title'
      }
    })
  }

  /**
   * @param {string} to A1Notation
   */
  moveFocus(to) {
    this.selectedSheet().setActiveRange(
      this.selectedSheet().getRange(this.processRange(to, { sheet: this.selectedSheet().getName() })[0])
    )
    return this
  }

  getRowByValue(startRow, column, searchValues, options = {}) {
    const { headerRow = 1, isLastHeader = false, defaultValue = 0 } = options,
      range = SpreadsheetApp
        .openById(this.spreadsheetId)
        .getSheetByName(this.sheet[0])
        .getRange(this.processRange([startRow, column, { headerRow, isLastHeader, untilLastRow: true }], { sheet: this.sheet[0] })[0].split('!')[1])
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

  color(range, color) {
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
      Object.values(this.sheetId).map(sheetId => ({
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

  resize(column, sizeInPixel) {
    if (typeof column === 'string')
      column = getColumnNum(column)
    return this.addRequests(
      Object.values(this.sheetId).map(sheetId => ({
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

  autoFill(range) {
    const sheetId = Object.values(this.sheetId)[0]
    return this.addRequests({
      autoFill: {
        range: this.toGridRange(sheetId, range),
        useAlternateSeries: false
      }
    })
  }

  /**
   * Mereplikasi Find & Replace (Ctrl + H)
   */
  replace(options = {}) {
    const { find = '', replace = '', range = null, matchEntire = false, matchCase = false, regex = false, includeFormula = true } = options
    if (!find) return this
    if (regex && matchEntire)
      Logger.log('Pemberitahuan: Variabel matchEntire Anda tidak akan digunakan karena Anda sudah memakai regex')
    const request = {
      findReplace: {
        find,
        replacement: replace
      }
    }
    if (range)
      request.findReplace.range = this.toGridRange(Object.values(this.sheetId)[0], range)
    else
      request.findReplace.allSheets = true
    if (matchCase)
      request.findReplace.matchCase = true
    if (matchEntire)
      request.findReplace.matchEntireCell = true
    if (regex)
      request.findReplace.searchByRegex = true
    if (includeFormula)
      request.findReplace.includeFormulas = true
    return this.addRequests(request)
  }

  delete(type, options = {}) {
    let { include = null, except = null, number = null, key = null, range = null } = options,
      sheet = this.sheet

    if (include && except)
      Logger.log('WARNING! Sintaks redundan. Pilih antara \'include\' ataupun \'except\'')
    if (include) {
      include = lazyWrap(include)
      sheet = sheet.filter(sheet => include.includes(sheet))
    }
    if (except) {
      except = lazyWrap(except)
      sheet = sheet.filter(sheet => !except.includes(sheet))
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
          this.get({ fields: `sheets.protectedRanges(protectedRangeId${key ? ',description' : ''})`, ranges: range, sheet })
            .sheets
            .flatMap(sheet => sheet.protectedRanges)
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

  copyPaste(sourceSheet, range, pasteType, options = {}) {
    let { targetSheet = this.sheet.filter(name => name !== sourceSheet), targetRange = null } = options
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
    return this.addRequests(Object.values(this.sheetId).map(add))
  }

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
      return this.addRequests(Object.entries(this.sheetId).filter(([key, _]) => !except.includes(key)).map(([_, value]) => add(value)))
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
      return this.addRequests(Object.values(this.sheetId).map(add))
    }
  }

  insertAfter(columnOrRow, type, options = {}) {
    if (notSameWith(type, Column, Row))
      throw Error(`Tipe ${type} tidak valid`)
    if (typeof columnOrRow === 'string')
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
    return this.addRequests(Object.values(this.sheetId).map(add))
  }

  insertCell(range, type) {
    if (!type)
      throw Error('Tipe belum didefinisikan')
    else if (notSameWith(type, Column, Row))
      throw Error(`Tipe ${type} tidak valid.`)

    return this.addRequests(
      Object.values(this.sheetId).map(sheetId => ({
        insertRange: {
          range: this.toGridRange(sheetId, this.processRange(range)[0]),
          shiftDimension: type
        }
      }))
    )
  }

  /**
   * @param {string|Object[]} ranges
   * @param {number|string} column
   * @param {ConditionType} condition
   * @param {Object} options
   */
  filter(ranges, column, condition, options = {}) {
    const rangeOptions = {}
    if (typeof ranges !== 'string') {
      const { headerRow = 1, isLastHeader = false } = isObject(ranges.at(-1))
        ? ranges.at(-1)
        : ranges.every(isArray) && isObject(ranges[0].at(-1))
          ? ranges[0].at(-1)
          : {}
      rangeOptions.headerRow = headerRow
      rangeOptions.isLastHeader = isLastHeader
    }
    ranges = this.processRange(ranges)
    column = toObject(this.sheet.map(sheet => ({ [this.sheetId[sheet]]: typeof column === 'string' ? this.column(column, { ...rangeOptions, sheet }) : column })))
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
              [column[gridRange.sheetId] - 1]: {
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
   * @param {Object} options
   */
  protect(options = {}) {
    const { description = '', editors = null, deleteOldProtection = true } = options
    const addConfig = [],
      deleteConfig = []
    /** @type {Sheets_v4.Sheets.V4.Schema.Sheet[]} */
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
      gridRanges = toObject(
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
      unprotectedRange = toObject(
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
                ? between(gridRange.startRowIndex, prot.range.startRowIndex, gridRange.endRowIndex ?? 1e9, '<=')
                && between(gridRange.startColumnIndex, prot.range.startColumnIndex, gridRange.endColumnIndex ?? 1e9, '<=')
                : Object.keys(prot.range).every(key => key === 'sheetId')
            )
          if (targetProt.length)
            push(deleteConfig, targetProt.map(prot => prot.protectedRangeId))
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

  empty(ranges, options = {}) {
    ranges = this.processRange(ranges, options)
    return this.addEmptyValueRequests(ranges)
  }

  /**
   * @param {string|string[]|Object[]|Object[][]} ranges
   * @param {Object|Object[]|Object[][]} values
   * @param options
   */
  setValue(ranges, values, options = {}) {
    const isValuesArray = isArray(values)
    if (this.isRangesAnArray(ranges) && isTypeOf('string', ...ranges) && isValuesArray && ranges.length !== values.length)
      throw Error('Jumlah value dan range yang dimasukkan sebagai parameter tidak sama.')
    ranges = this.processRange(ranges, options)
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
        const rowCount = getRowCountFromA1N(range),
          calculatedValues = typeof values === 'function'
            ? values(sheet, getColumnFromA1N(range, { isLetter: true }), getRowFromA1N(range))
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
   * @param {string|string[]|Object[]|Object[][]} ranges
   * @param {Object|Object[]|Object[][]|Object[][][]} values
   * @param options
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
      ranges.map(/** @type {string} */ range => {
        const sheet = range.split('!')[0]
        if (sheet !== currentSheet) {
          currentSheet = sheet
          currentNo = 0
        } else
          currentNo++
        const rowCount = getRowCountFromA1N(range),
          columnCount = getColumnCountFromA1N(range)
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

  grant() {
    this.customRequests.grant = true
    return this
  }

  /** @param {any[]} params */
  run(...params) {
    if (this.emptyValueRequests.length)
      spreadsheet.Values.batchClear({ ranges: this.emptyValueRequests }, this.spreadsheetId)
    if (this.requests.length) {
      this.responses.push(...(batchUpdate({
        requests: this.requests,
        spreadsheetId: this.spreadsheetId,
        withoutRetry: Object.keys(this.requests).some(request => request.toLowerCase().includes('protect'))
      })?.replies || []))
      if (this.afterRun)
        this.afterRun(0, ...params)
    }
    if (this.valueRequests.length)
      spreadsheet.Values.batchUpdate({ data: this.valueRequests, valueInputOption: this.isRaw ? Raw : UserEntered }, this.spreadsheetId)
    const customRequestKeys = Object.keys(this.customRequests)
    Logger.log(`Berhasil mengeksekusi ${this.requests.length + this.valueRequests.length + this.emptyValueRequests.length} request pada spreadsheet ${this.spreadsheet}`)
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
                for (const match of formula.matchAll(Regex.Importrange.SsId)) {
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
              Logger.log("Tidak ditemukan IMPORTRANGE dalam file ini.")
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
   * @param {Object[]|Object[][]} array
   */
  addRequests(...array) {
    array = flat(array).filter(req => isObject(req) && Object.keys(req).length)
    if (array.length)
      this.requests.push(...array)
    while (this.requests.length >= this.batch) {
      Logger.log(`Mengeksekusi ${this.batch} request`)
      const toExecuteRequests = this.requests.splice(0, this.batch)
      this.responses.push(...(batchUpdate({
        requests: toExecuteRequests,
        spreadsheetId: this.spreadsheetId,
        withoutRetry: Object.keys(toExecuteRequests).some(request => request.toLowerCase().includes('protect'))
      })?.replies || []))
      if (this.afterRun)
        this.afterRun(this.requests.length)
    }
    return this
  }

  /**
   * @param {Object[]|Object[][]} array
   */
  addValueRequests(...array) {
    array = flat(array).filter(req => isObject(req) && Object.keys(req).length)
    if (array.length)
      this.valueRequests.push(...array)
    while (this.valueRequests.length >= this.batch) {
      Logger.log(`Mengeksekusi ${this.batch} values update`)
      spreadsheet.Values.batchUpdate({ data: this.valueRequests.splice(0, this.batch), valueInputOption: this.isRaw ? Raw : UserEntered }, this.spreadsheetId)
    }
    return this
  }

  /**
   * @param {Object[]|Object[][]} array
   */
  addEmptyValueRequests(...array) {
    array = flat(array).filter(req => typeof req === 'string')
    if (array.length)
      this.emptyValueRequests.push(...array)
    while (this.emptyValueRequests.length >= this.batch) {
      Logger.log(`Mengeksekusi ${this.batch} values clear`)
      spreadsheet.Values.batchClear({ ranges: this.emptyValueRequests.splice(0, this.batch) }, this.spreadsheetId)
    }
    return this
  }

  /**
   * @param {string|Object[]} ranges
   * @param options
   * @return {string[]}
   */
  processRange(ranges, options = {}) {
    let { include = null, except = null, includeInvalid = false, sheet = this.sheet, withoutSheet = false } = options
    sheet = lazyWrap(sheet)
    if (include && except)
      Logger.log('WARNING! Sintaks redundan. Pilih antara \'include\' ataupun \'except\'')
    if (include) {
      if (typeof include === 'string')
        include = include.split(', ')
      sheet = sheet.filter(sheet => include.includes(sheet))
    }
    if (except) {
      if (typeof except === 'string')
        except = except.split(', ')
      sheet = sheet.filter(sheet => !except.includes(sheet))
    }
    ranges = lazyWrap(ranges)

    if (isTypeOf('string', ranges)) {
      if (withoutSheet) return ranges
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

    let headers, lastRows, lastColumns
    if (ranges.some(range => isTypeOf('string', range[2], range.at(-1).endColumn, { logic: Or }) && max(range[2]?.length ?? 1, range.at(-1).endColumn?.length ?? 1) > 1)) {
      const cacheKey = `${this.spreadsheetId}_${this.sheet}_mix_${ranges[0].at(-1).headerRow ?? 1}`,
        cache = getGlobalCache()
      if (!cache.headers[cacheKey]) {
        const row = ranges[0].at(-1)?.headerRow ?? 1
        addToGlobalCache(
          CacheType.Header,
          cacheKey,
          this.getValues(`${row}:${row}`, { spreadsheetId: this.spreadsheetId, fillEmpty: false, isAll: true, stack: Vertical })
        )
      }
      headers = cache[CacheType.Header][cacheKey]
    }

    if (ranges.some(range => sameWith(0, !range[1], !range[2], range.at(-1).endRow, range.at(-1).endColumn, { logic: Or, withLog: false }))) {
      const key = `max_${sheet}_mix`
      if (!this.cache[key])
        this.cache[key] = this.get({ fields: 'sheets.properties(title,gridProperties(rowCount,columnCount))' }).sheets
      lastRows = toObject(metadata.map(sheet => ({ [sheet.properties.title]: this.cache[key].properties.gridProperties.rowCount })))
      lastColumns = toObject(metadata.map(sheet => ({ [sheet.properties.title]: this.cache[key].properties.gridProperties.columnCount })))
    }


    ranges = ranges
      .flatMap(range => {
        if (this.withLog)
          Logger.log(range)
        const options = range.at(-1)
        let { endColumn = null, endRow = null, untilLastRow = false, isLastHeader = false, rowCount = null, columnCount = null } = isObject(options) ? options : {},
          startColumn = range[2]
        if (isAllArray(startColumn, endColumn) && startColumn.length !== endColumn?.length)
          throw Error(`Panjang startColumn dan endColumn berbeda.`)
        startColumn = lazyWrap(startColumn)
        endColumn = lazyWrap(endColumn)
        const process = (column, no) => {
          const startColumnNum = typeof column === 'string' && column.length > 1
            ? (isLastHeader
              ? headers?.[this.sheet.indexOf(range[0])]?.lastIndexOf(column)
              : headers?.[this.sheet.indexOf(range[0])]?.indexOf(column)) + 1
            : column || lastColumns[range[0]]
          let endColumnLocal = endColumn[no]
          if (!startColumnNum) {
            Logger.log(`Sheet ${range[0]} tidak memiliki kolom ${column}. Range dilewati`)
            return `${range[0]}!#SKIP#`
          }
          let startColumn = getColumnLetter(startColumnNum),
            result = `${range[0]}!${startColumn}${range[1] || lastRows[range[0]]}`
          if (endColumnLocal) {
            const endColumnNum = typeof endColumnLocal === 'string' && endColumnLocal.length > 1
              ? (isLastHeader ? headers?.[this.sheet.indexOf(range[0])]?.lastIndexOf(endColumnLocal)
                : headers?.[this.sheet.indexOf(range[0])]?.indexOf(endColumnLocal)) + 1 : endColumnLocal || lastColumns[range[0]]
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

  isRangesAnArray(ranges) {
    return isArray(ranges) && (isTypeOf('string', ...ranges) || isAllArray(...ranges) || isObject(...ranges) || isArray(ranges[1]))
  }

  toGridRange(sheet, range) {
    if (typeof sheet === 'string')
      sheet = this.sheetId[sheet]
    if (typeof range !== 'string')
      range = this.processRange(range, { sheet })[0]
    return toGridRange(range, { sheetId: sheet })
  }
}

/**
 * Membuat instans class Request Builder
 * @param {string} spreadsheetIdOrTitle
 * @param {string} sheet
 * @param options
 * @return {Spreadsheet}
 */
function createRequest(spreadsheetIdOrTitle, sheet = null, options = {}) {
  return new SpreadsheetManipulation(spreadsheetIdOrTitle, sheet, options)
}

/** Helper */

/**
 * - Shorthand untuk Sheets.Spreadsheets.batchUpdate
 * @param {Object} options
 * @return {Sheets_v4.Sheets.V4.Schema.BatchUpdateSpreadsheetResponse}
 */
function batchUpdate(options = {}) {
  const { requests = [], spreadsheetId = null, attempts = 3, withoutRetry = false, ...optionsForAPI } = options
  if (requests.length)
    return retry(() => spreadsheet.batchUpdate({ requests, ...optionsForAPI }, spreadsheetId), { attempts: withoutRetry ? 1 : attempts, withReturnValue: true })
  else
    throw Error('Tidak ada request yang dikirim. Objek \'requests\' kosong')
}

/** @type {Sheets_v4.Sheets.V4.Collection.SpreadsheetsCollection} */
var spreadsheet = Sheets.Spreadsheets