/**
 * @return {Object}
 */
function getGlobalCache() {
  if (globalThis._appCache) return globalThis._appCache
  const scriptCache = CacheService.getScriptCache(),
    cache = scriptCache.get('MASTER_APP_CACHE')
  globalThis._appCache = cache ? JSON.parse(cache) : {
    headers: {},
    folderIds: {},
    fileIds: {},
    sheetIds: {}
  }
  return globalThis._appCache
}

/**
 * @param {string} type
 * @param {string} cacheKey
 * @param {any} value
 * @param {number} duration
 */
function addToGlobalCache(type, cacheKey, value, duration = 21600) {
  const cache = getGlobalCache(),
    scriptCache = CacheService.getScriptCache()
  cache[type][cacheKey] = value
  scriptCache.put('MASTER_APP_CACHE', JSON.stringify(cache), duration)
}

function resetCache() {
  CacheService.getScriptCache().remove('MASTER_APP_CACHE')
  globalThis._appCache = {
    headers: {},
    folderIds: {},
    fileIds: {},
    sheetIds: {}
  }
}