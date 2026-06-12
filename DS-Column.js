/**
 * Mengonversi nomor indeks kolom menjadi representasi huruf.
 * @param {number|string} columnNumber - Nomor kolom numerik (harus > 0).
 * @return {string} Representasi huruf kolom (misal: 'A', 'Z', 'AA').
 */
function getColumnLetter(columnNumber) {
  if (typeof columnNumber === 'string')
    return columnNumber
  else if (typeof columnNumber !== 'number' || Math.floor(columnNumber) <= 0)
    throw new Error("Parameter tidak valid: Input harus berupa bilangan bulat lebih besar dari 0.")

  let letter = '', tempNumber = Math.floor(columnNumber)

  while (tempNumber) {
    let remainder = (tempNumber - 1) % 26
    // 65 adalah kode ASCII untuk 'A'
    letter = String.fromCharCode(remainder + 65) + letter
    tempNumber = Math.floor((tempNumber - 1) / 26)
  }

  return letter;
}

/**
 * @param {string} columnLetter
 * @return {number}
 */
function getColumnNum(columnLetter) {
  let index = 0
  for (let i = 0; i < columnLetter.length; i++) {
    index = index * 26 + (columnLetter.toUpperCase().charCodeAt(i) - 64)
  }
  return index
}

/**
 * @param {string} columnLetter
 * @return {number}
 */
function getColumnIndex(columnLetter) {
  let index = 0
  for (let i = 0; i < columnLetter.length; i++) {
    index = index * 26 + (columnLetter.toUpperCase().charCodeAt(i) - 64)
  }
  return index - 1
}