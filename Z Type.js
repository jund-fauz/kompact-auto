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

  /** Type */
  mlArray = 'MLArray',
  mlObject = 'MLObject',

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
  Header = 'HEADER',

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
  PasteNoBorders = 'PASTE_NO_BORDERS',

  /** MergeType */
  MergeAll = 'MERGE_ALL',
  MergeColumns = 'MERGE_COLUMNS',
  MergeRows = 'MERGE_ROWS',

  White = {
    red: 1,
    green: 1,
    blue: 1
  },

  /** Filter Condition */
  DateBefore = 'DATE_BEFORE',
  DateAfter = 'DATE_AFTER',
  DateOnOrBefore = 'DATE_ON_OR_BEFORE',
  DateOnOrAfter = 'DATE_ON_OR_AFTER',
  DateEq = 'DATE_EQ',
  DateNotEq = 'DATE_NOT_EQ',
  DateBetween = 'DATE_BETWEEN',
  DateNotBetween = 'DATE_NOT_BETWEEN',
  NumberGreater = 'NUMBER_GREATER',
  NumberGreaterThanOrEqual = 'NUMBER_GREATER_THAN_OR_EQUAL',
  NumberLess = 'NUMBER_LESS',
  NumberLessThanOrEqual = 'NUMBER_LESS_THAN_OR_EQUAL',
  NumberEq = 'NUMBER_EQ',
  NumberNotEq = 'NUMBER_NOT_EQ',
  NumberBetween = 'NUMBER_BETWEEN',
  NumberNotBetween = 'NUMBER_NOT_BETWEEN',
  TextContains = 'TEXT_CONTAINS',
  TextNotContains = 'TEXT_NOT_CONTAINS',
  TextStartsWith = 'TEXT_STARTS_WITH',
  TextEndsWith = 'TEXT_ENDS_WITH',
  TextEq = 'TEXT_EQ',
  TextIsValidEmail = 'TEXT_IS_VALID_EMAIL',
  TextIsValidUrl = 'TEXT_IS_VALID_URL',
  Blank = 'BLANK',
  NotBlank = 'NOT_BLANK',
  DateIsValid = 'DATE_IS_VALID',
  BooleanExpression = 'BOOLEAN_EXPRESSION',
  OneOfList = 'ONE_OF_LIST',
  OneOfRange = 'ONE_OF_RANGE',
  NotOneOfList = 'NOT_ONE_OF_LIST',
  NotOneOfRange = 'NOT_ONE_OF_RANGE',
  CustomFormula = 'CUSTOM_FORMULA',

  /** Relative Date Condition */
  Tomorrow = 'TOMORROW',
  Today = 'TODAY',
  Yesterday = 'YESTERDAY',
  PastWeek = 'PAST_WEEK',
  PastMonth = 'PAST_MONTH',
  PastYear = 'PAST_YEAR'