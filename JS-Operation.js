/**
 * @param {number[]} arr
 * @return {number}
 */
function sum(...arr) {
  arr = flat(arr)
  let decimalNum = 0
  if (isTypeOf('string', arr)) {
    decimalNum = unique(arr.map(val => val.split('.')[1]?.length))[0] ?? 0
    arr = arr.map(val => val.replace('.', ''))
  }
  const result = arr.reduce((total, num) => total + (typeof num === 'number' ? num : Number(num)), 0)
  return result / (10 ** decimalNum)
}

/**
 * @param {number[]|string[]} arr
 * @return {number}
 */
function subtract(...arr) {
  const { positive = true } = getOptions(arr)
  arr = flat(arr)
  if (!arr.length) return 0
  const result = arr.reduce((total, num) => total - (typeof num === 'number' ? num : Number(num)))
  return positive ? Math.abs(result) : result
}

/**
 * @param {number[]} number
 * @return {number}
 */
function max(...number) {
  return Math.max(...flat(number))
}