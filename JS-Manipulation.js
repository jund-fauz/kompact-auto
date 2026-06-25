/**
 * @template T
 * @param {T} value
 * @param {{useJsObject?: boolean}} options
 * @return {T}
 */
function trim(value, options = {}) {
  const { useJsObject = false } = options
  if (isArray(value)) return value.map(val => trim(val, options))
  if (isObject(value)) {
    const result = initObject(value instanceof MLObject ? value.object : value).reEntries((key, value) => [key, trim(value, options)])
    if (useJsObject) return result.object
    return result
  }
  return isString(value) ? value.trim() : value
}