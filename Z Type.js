// Internal Use
// noinspection JSValidateJSDoc,ES6ConvertVarToLetConst

const CacheType = Object.freeze({
  Header: 'headers',
  SheetIds: 'sheetIds',
  FolderIds: 'folderIds',
  FileIds: 'fileIds'
})

// External Use
/** @return {GoogleAppsScript.Base.Ui} */
var ui = () => SpreadsheetApp.getUi(),

  Button = () => ui().Button,

  ButtonSet = () => ui().ButtonSet,

  { RANGE: RangeProt, SHEET: SheetProt } = SpreadsheetApp.ProtectionType,
  { GOOGLE_SHEETS: Spreadsheet, FOLDER: Folder } = MimeType,

  /** Type for Storage Manipulation */
  array = 'ARRAY',
  object = 'OBJECT',

  /** Sheet Type for Request Builder */
  Daily = 'DAILY',
  Monthly = 'MONTHLY',
  Active = 'ACTIVE',
  All = 'ALL',

  Ascending = 'ASC',
  Descending = 'DESC',

  Horizontal = 'horizontal',
  Vertical = 'vertical',

  And = '&&',
  Or = '||',

  Row = 'ROWS',
  Sheet = 'SHEET',
  Column = 'COLUMNS',
  Protection = 'Prot',

  NotEmpty = '#NOT_EMPTY#',

  /**
   * @enum {RegExp}
   */
  Regex = Object.freeze({
    Daily: /^([1-9]|[12][0-9]|3[01])$/,
    ColumnLetter: {
      WithNumber: /^[A-Z]+\d+/,
      WithoutNumber: /^[A-Z]+/
    },
    RowNumber: /[0-9]+$/,
    Importrange: {
      SpreadsheetId: /(IMPORTRANGE\s*\(\s*["'])([^"']*)(["']\s*,)/gi,
      Range: /(IMPORTRANGE\s*\(\s*["'][^"']*["']\s*,\s*["'])([^"']*)(["']\s*\))/gi
    },
    Invoice: /^[a-zA-Z]+[-_]\d+/,
    AllCharacterWithoutFormula: '(?s)^[^=].*'
  }),

  /** #Sheets API */

  /** ValueRenderOption */
  Formatted = 'FORMATTED_VALUE',
  Unformatted = 'UNFORMATTED_VALUE',
  Formula = 'FORMULA',

  /** ValueInputOption */
  Raw = 'RAW',
  UserEntered = 'USER_ENTERED',

  /** PasteType */
  PasteValues = 'PASTE_VALUES',
  PasteNormal = 'PASTE_NORMAL',
  PasteFormat = 'PASTE_FORMAT',
  PasteFormula = 'PASTE_FORMULA',
  PasteDataValidation = 'PASTE_DATA_VALIDATION',
  PasteConditionalFormatting = 'PASTE_CONDITIONAL_FORMATTING',
  PasteNoBorders = 'PASTE_NO_BORDERS'

  /** MergeType */
  MergeAll = 'MERGE_ALL',
  MergeColumns = 'MERGE_COLUMNS',
  MergeRows = 'MERGE_ROWS',

  White = {
    red: 1,
    green: 1,
    blue: 1
  },

  /**
   * @enum {string}
   */
  ConditionType = Object.freeze({
    B: 'BLANK',
    NB: 'NOT_BLANK',
    E: 'ERROR',
  }),

  /** Pengkategorian Spreadsheet */
  Lm = ['ANTAM', 'EK', 'EKU', 'SG', 'HA', 'TEMBAGA', 'LM CAMPUR', 'LM VALENT', 'PERAK', 'PERAK STARSILVER', 'CT'],
  Cabang = ['JKT', 'SMG', 'SBY'],
  Divisi = ['CT', 'LM'],
  CabangStargold = ['KRANGGAN', 'MAG', 'ROYAL'],
  Uang = [...Cabang, 'LM']