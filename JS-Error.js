/**
 * @param {Error} e
 * @param {string} functionName
 * @param {{withThrow?: boolean, prefixMessage?: string}} options
 */
function templateLogError(e, functionName = '', options = {}) {
  const { withThrow = true, prefixMessage = '' } = options
  Logger.log(`${prefixMessage ? `${prefixMessage}\n` : ''}${functionName ? `Function: ${functionName}\n` : ''}Error: ${e.message}\n${e.stack}`)
  if (withThrow)
    throw e
}
