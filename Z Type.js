// Internal Use
// noinspection JSValidateJSDoc,ES6ConvertVarToLetConst

const CacheType = Object.freeze({
  Header: 'headers',
  SheetIds: 'sheetIds',
  FolderIds: 'folderIds',
  FileIds: 'fileIds'
})

// External Use
/** @return {Ui} */
var ui = () => SpreadsheetApp.getUi()

/** @return {_Button} */
var Button = () => ui().Button

/** @return {_ButtonSet} */
var ButtonSet = () => ui().ButtonSet

var { RANGE: RangeProt, SHEET: SheetProt } = SpreadsheetApp.ProtectionType
// noinspection ES6ConvertVarToLetConst
var { GOOGLE_SHEETS: Spreadsheet, FOLDER: Folder } = MimeType

/** Type for Storage Manipulation */
var array = 'ARRAY'
var object = 'OBJECT'

/** Sheet Type for Request Builder */
var Daily = 'DAILY'
var Monthly = 'MONTHLY'
var Active = 'ACTIVE'
var All = 'ALL'

/**
 * @enum {string}
 */
var OrderBy = Object.freeze({
  a: 'asc',
  d: 'desc'
})

var Horizontal = 'horizontal'
var Vertical = 'vertical'

var And = '&&'
var Or = '||'

var Row = 'ROWS'
var Sheet = 'SHEET'
var Column = 'COLUMNS'
var Protection = 'Prot'

var NotEmpty = '#NOT_EMPTY#'

/**
 * @enum {RegExp}
 */
var Regex = Object.freeze({
  Daily: /^([1-9]|[12][0-9]|3[01])$/,
  ColumnLetter: {
    WithNumber: /^[A-Z]+\d+/,
    WithoutNumber: /^[A-Z]+/
  },
  RowNumber: /[0-9]+$/,
  Importrange: {
    SsId: /(IMPORTRANGE\s*\(\s*["'])([^"']*)(["']\s*,)/gi,
    Range: /(IMPORTRANGE\s*\(\s*["'][^"']*["']\s*,\s*["'])([^"']*)(["']\s*\))/gi
  },
  Invoice: /^[a-zA-Z]+[-_]\d+/
})

/** #Sheets API */

/** ValueRenderOption */
var Formatted = 'FORMATTED_VALUE'
var Unformatted = 'UNFORMATTED_VALUE'
var Formula = 'FORMULA'

/** ValueInputOption */
var Raw = 'RAW'
var UserEntered = 'USER_ENTERED'

/** PasteType */
var PasteValues = 'PASTE_VALUES'
var PasteNormal = 'PASTE_NORMAL'
var PasteFormat = 'PASTE_FORMAT'
var PasteFormula = 'PASTE_FORMULA'

/** MergeType */
var MergeAll = 'MERGE_ALL'
var MergeColumns = 'MERGE_COLUMNS'
var MergeRows = 'MERGE_ROWS'

var White = {
  red: 1,
  green: 1,
  blue: 1
}

/**
 * @enum {string}
 */
var ConditionType = Object.freeze({
  B: 'BLANK',
  NB: 'NOT_BLANK',
  E: 'ERROR',
})