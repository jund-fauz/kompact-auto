/**
 * @template T
 * @param {T} value
 * @return {T}
 */
function trim(value) {
  if (isArray(value)) return value.map(trim)
  if (isObject(value)) return initObject(value).reEntries((key, value) => [key, trim(value)]).object
  return isString(value) ? value.trim() : value
}