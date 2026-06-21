var Capitalize = 'capitalize',
  LowerCase = 'lowercase',
  UpperCase = 'uppercase'

class MLString extends String {
  toJSON() {
    return this.toString()
  }

  /**
   * @return {string}
   */
  toCamelCase() {
    if (this.length === 1 && this.match(/[^a-zA-Z0-9]+(.)/g).length)
      return this
    return this
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
      .replace(/^[A-Z]/, (char) => char.toLowerCase())
      .replace(/\W+/, '')
  }

  /**
   * @param {Capitalize|LowerCase|UpperCase|string} mode
   * @return {string}
   */
  normalizeFromCamelCase(mode = Capitalize) {
    const result = this.replace(/[A-Z]/, ' $1')
    switch (mode) {
      case Capitalize:
        return this.capitalize(result)
      case LowerCase:
        return result.toLowerCase()
      case UpperCase:
        return result.toUpperCase()
    }
  }

  /**
   * @return {string}
   */
  capitalize() {
    return this[0].toUpperCase() + this.slice(1).toLowerCase()
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
   * @param {string[]} searchValues
   * @return {boolean}
   */
  endWith(...searchValues) {
    const { logic = And } = getOptions(searchValues),
      process = searchValue => this.endsWith(searchValue)
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