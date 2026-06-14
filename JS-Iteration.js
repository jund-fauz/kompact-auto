/**
 * @template T
 * @param {() => void|T} func
 * @param {Object} options
 * @return {void|T[]}
 */
function iterate(func, options = {}) {
  let { from = 1, until = 1 } = options
  if (from > until && until === 1)
    until = from
  const { untilBefore = false, addition = 1, withReturnValue = func(from++) } = options,
    result = [withReturnValue]
  for (let i = from; i <= (until - untilBefore); i += addition) {
    if (withReturnValue)
      result.push(func(i))
    else
      func(i)
  }
  if (withReturnValue)
    return result
}

/**
 * @template T
 * @param {() => void|T} func
 * @param {Object} options
 * @return {void|T[]|any}
 */
function retry(func, options = {}) {
  const { attempts = 3, waitingInSec = 2, withReturnValue = false, fallback = null } = options
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      if (withReturnValue)
        return func()
      else
        func()
    } catch (e) {
      if (attempt === attempts) {
        if (typeof fallback === 'function')
          if (withReturnValue)
            return fallback()
          else
            fallback()
        else if (withReturnValue)
          return fallback
        throw e
      }
      Logger.log(`Retry ${attempt}/${attempts}: ${e.message}`)
      Utilities.sleep(attempt * waitingInSec * 1000)
    }
  }
}