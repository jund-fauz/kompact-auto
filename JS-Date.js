// Manipulasi untuk spreadsheet tahunan

class MLDate extends Date {
  constructor(...values) {
    if (values.length)
      super(...values)
    else
      super()
    this.date = super.getDate()
    this.month = this.getMonth()
    this.shortMonth = shortMonths.get(this.month)
    this.longMonth = longMonths.get(this.month)
    this.year = super.getFullYear()
  }

  getMonth() {
    return super.getMonth() + 1
  }

  /**
   * @param month
   * @param {number|null} date
   * @return {MLDate}
   */
  setMonth(month, date = null) {
    month--
    if (date)
      super.setMonth(month, date)
    else
      super.setMonth(month)
    this.month = this.getMonth()
    this.shortMonth = shortMonths.get(this.month)
    this.longMonth = longMonths.get(this.month)
    return this
  }

  /**
   * @param date
   * @return {MLDate}
   */
  setDate(date) {
    super.setDate(date)
    this.date = super.getDate()
    return this
  }

  lastMonth() {
    return new MLDate(this.getTime()).setDate(1).setMonth(this.getMonth() - 1)
  }

  nextMonth() {
    return new MLDate(this.getTime()).setDate(1).setMonth(this.getMonth() + 1)
  }

  format(format) {
    return Utilities.formatDate(this, 'Asia/Jakarta', format)
  }
}

/**
 * @param {number|string|Date|MLDate} value
 * @return {MLDate}
 */
function initDate(...value) {
  if (value.length)
    return new MLDate(...value)
  else
    return new MLDate()
}

/** @type {MLArray<string>} */
var shortMonths = MLArray.init([
  'JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN',
  'JUL', 'AGS', 'SEP', 'OKT', 'NOV', 'DES'
])

/** @type {MLArray<string>} */
var longMonths = MLArray.init([
  'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
  'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
])

/**
 * @param {{input?: string|Date, format: string}} options
 */
function formatDate(options = {}) {
  const { input = null, format } = options
  return Utilities.formatDate(
    input
      ? typeof input === 'string'
        ? new Date(input)
        : input
      : new Date(),
    'Asia/Jakarta',
    format
  )
}

function getCurrentDate() {
  const today = new MLDate()
  return {
    day: today.getDay(),
    date: today.getDate(),
    month: today.getMonth(),
    year: today.getFullYear()
  }
}

/**
 * Convert tanggal dalam bentuk angka dari spreadsheet ke objek Date di JavaScript
 * @param {number} value
 * @return {Date}
 */
function toJSDate(value) {
  const date = new Date(Math.round((value - 25569) * 86400000))
  if (!isDate(date)) throw Error(`${value} bukanlah angka tanggal yang valid`)
  return date
}

/**
 * Cek apakah string / objek Date adalah tanggal yang valid
 * @param {string|Date} value
 * @return {boolean}
 */
function isDate(value) {
  if (value instanceof Date) return !isNaN(value.getTime())
  if (typeof value !== 'string' || Regex.Invoice.test(value)) return false
  const date = new Date(value)
  return !isNaN(date.getTime()) && between(1999, date.getFullYear(), 2099)
}

/**
 * Cek apakah nilai yang diberikan merupakan tahun yang valid (1999 - 2099)
 * @param {any} value
 * @return {boolean}
 */
function isYear(value) {
  value = Number(value)
  return !isNaN(value) && between(1999, value, 2099)
}