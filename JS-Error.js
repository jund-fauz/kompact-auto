/**
 * @param {Error} e
 * @param {string} functionName
 * @param {Object} options
 */
function templateLogError(e, functionName = '', options = {}) {
  const { withThrow = true } = options
  Logger.log(`${functionName ? `Function: ${functionName}\n` : ''}Error: ${e.message}\n${e.stack}`)
  if (withThrow)
    throw e
}
