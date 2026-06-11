// Manipulasi untuk spreadsheet tahunan
/** @type {string[]} */
var shortMonths = Object.freeze([
  'JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN',
  'JUL', 'AGS', 'SEP', 'OKT', 'NOV', 'DES'
])

/** @type {string[]} */
var longMonths = Object.freeze([
  'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
  'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
])

/**
 * @param {Object} options
 */
function formatDate(options = {}) {
  const { input = null, format } = options
  let date = input ? typeof input === 'string' ? new Date(input) : input : new Date()
  return Utilities.formatDate(date, 'Asia/Jakarta', format)
}

/**
 * @param {Date} date
 * @return {number}
 */
function getMonth(date) {
  return date.getMonth() + 1
}

/**
 * @param {Date} date
 * @param {boolean} isUppercase
 * @return {string}
 */
function getShortMonth(date, isUppercase = false) {
  let data = date.toLocaleString('id-ID', { month: 'short' })
  if (isUppercase)
    data = data.toUpperCase()
  return data
}

/**
 * @param {Date} date
 * @param {boolean} isUppercase
 * @return {string}
 */
function getLongMonth(date, isUppercase = false) {
  let data = date.toLocaleString('id-ID', { month: 'long' })
  if (isUppercase)
    data = data.toUpperCase()
  return data
}

/**
 * @param {number} value
 * @return {Date}
 */
function toDate(value) {
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