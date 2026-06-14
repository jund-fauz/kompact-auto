/**
 * @param {string|boolean} value
 */
function reverseBoolean(value) {
  switch (typeof value) {
    case 'boolean':
      return !value
    case 'string':
      switch (value) {
        case 'TRUE':
          return 'FALSE'
        case 'FALSE':
          return 'TRUE'
        default:
          throw Error('Value tidak valid.')
      }
  }
}

/**
 * @param {boolean} condition
 * @param {any} value
 * @return {any|string}
 */
function ifTrue(condition, value) {
  return condition ? value : ''
}