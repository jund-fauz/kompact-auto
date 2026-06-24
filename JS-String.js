var Capitalize = 'capitalize',
  LowerCase = 'lowercase',
  UpperCase = 'uppercase'

class MLString extends String {
  toJSON() {
    return this.toString()
  }

  /**
   * @return {MLString}
   */
  toCamelCase() {
    return initString(
      this
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
        .replace(/^[A-Z]/, (char) => char.toLowerCase())
        .replace(/\W+/, '')
    )
  }

  /**
   * @param {Capitalize|LowerCase|UpperCase|string} mode
   * @return {MLString}
   */
  normalizeFromCamelCase(mode = Capitalize) {
    const result = this.replace(/[A-Z]/g, ' $&')
    switch (mode) {
      case Capitalize:
        return initString(result).capitalize(result)
      case LowerCase:
        return initString(result.toLowerCase())
      case UpperCase:
        return initString(result.toUpperCase())
    }
  }

  /**
   * @return {MLString}
   */
  capitalize() {
    return initString(this[0].toUpperCase() + this.slice(1).toLowerCase())
  }

  /**
   * Mengecek apakah suatu teks ada di dalam teks lain
   * @param {string[]} searchValues
   * @return {boolean}
   */
  includes(...searchValues) {
    return flat(searchValues).every(searchValue => super.includes(searchValue))
  }

  /**
   * @param {string|{logic?: And|Or|string, caseInsensitive?: boolean}} searchValues
   * @return {boolean}
   */
  endWith(...searchValues) {
    const { logic = And, caseInsensitive = false } = getOptions(searchValues),
      process = searchValue => caseInsensitive ? this.toLowerCase().endsWith(searchValue.toLowerCase()) : this.endsWith(searchValue)
    return logic === And
      ? flat(searchValues).every(process)
      : flat(searchValues).some(process)
  }

  /**
   * @param {number} digitCount
   * @return {string}
   */
  formatNumber(digitCount = 2) {
    return this.padStart(digitCount, '0')
  }
}

/**
 * @param {*} value
 * @return {MLString}
 */
function initString(value) {
  return new MLString(value)
}

/**
 * @param {number} number
 * @param {number} digitCount
 * @return {string}
 */
function formatNumber(number, digitCount = 2) {
  return String(number).padStart(digitCount, '0')
}

/**
 * @param {Object|Object[]} param
 */
function toString(param) {
  return JSON.stringify(param)
}

function isString(value) {
  return typeof value === 'string' || value instanceof String
}