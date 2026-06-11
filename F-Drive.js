const config = {
  includeItemsFromAllDrives: true,
  supportsAllDrives: true,
  fields: "files(id)",
}, customConfig = {
  pageSize: 1,
}

/**
 * Mendapatkan Folder object dari path
 * Contoh: "/Folder1/SubFolder2/SubFolder3"
 * @param {string} path Path folder (dimulai dengan /)
 * @param {Object} options
 * @return {string|null} ID Folder atau null jika tidak ditemukan
 */
function getFolderIdFromPath(path, options = {}) {
  const cache = getGlobalCache(), { isSharedAccount = false, withLog = true } = options
  if (!cache.folderIds[path]) {
    if (withLog)
      Logger.log(`Function: getFolderIdFromPath\nisSharedAccount: ${isSharedAccount}`)
    const parts = path.split('/').filter(part => part.length),
      execute = (folder) => {
        const q = `name = '${folder.replace(/'/g, "\\'")}' and mimeType = '${Folder}' and trashed = false${!isSharedAccount || parentId !== 'root' ? ` and '${parentId}' in parents` : ''}`
        if (withLog)
          Logger.log(`Query: ${q}`)
        parentId = retry(() => Drive.Files.list({ q, ...customConfig, ...config }).files[0].id, { withReturnValue: true, waitingInSec: 3 })
      }
    let parentId = 'root'
    for (const folder of parts)
      execute(folder)
    if (parentId === 'root')
      return null
    else
      addToGlobalCache(CacheType.FolderIds, path, parentId)
    if (withLog)
      Logger.log(`Result: ${cache.folderIds[path]}`)
  }
  return cache.folderIds[path]
}

/**
 * @param {string} name Nama harus lengkap dan sama agar file sesuai yang diharapkan
 * @param {string} type
 * @param {Object} options
 * @return {string}
 */
function getFileIdByName(name, type = Spreadsheet, options = {}) {
  if (notSameWith(type, Spreadsheet, Folder)) throw Error('Tipe tidak valid.')
  const cache = getGlobalCache(), { folderPath = '', folderId = '', isSharedAccount = false, withLog = true, notRequiredToFound = false } = options, cacheKey = folderPath + name
  if (!cache.fileIds[cacheKey]) {
    let parentId = null
    if (folderId)
      parentId = folderId
    else if (folderPath)
      parentId = getFolderIdFromPath(folderPath, { isSharedAccount })
    try {
      let q = `name = '${name.replace(/'/g, "\\'")}' and trashed = false and mimeType = '${type}'`
      if (parentId)
        q += ` and '${parentId}' in parents`
      if (withLog)
        Logger.log(`Function: getFileIdByName\nQuery: ${q}`)
      const result = retry(() => Drive.Files.list({ q, ...customConfig, ...config })?.files[0]?.id, { withReturnValue: true })
      if (withLog)
        Logger.log(`Result: ${result}`)
      if (result != undefined)
        addToGlobalCache(CacheType.FileIds, cacheKey, result)
      else
        if (!notRequiredToFound)
          throw Error(`Drive.Files.list return ${result}`)
        else
          return null
    } catch (e) {
      templateLogError(e, 'getFileIdByName')
    }
  }
  return cache.fileIds[cacheKey]
}

/**
 * @param {string} path
 * @param {Object} options
 * @return {string[]|Object[]}
 */
function getFileIdsIn(path, options = {}) {
  const { ownedBy = null, withLog = true, isSharedAccount = false, withName = false } = options,
    /** @type {string} */
    parentFolderId = path.includes('/') ? retry(() => getFolderIdFromPath(path, { isSharedAccount, withLog }), { withReturnValue: true }) : path
  let results = {}
  try {
    let q = `'${parentFolderId}' in parents and trashed = false`
    if (ownedBy)
      q += ` and '${ownedBy}' in owners`
    const files = retry(() => Drive.Files.list({ q, ...config, fields: `files(id${withName ? ',name' : ''})` }).files, { withReturnValue: true })
    if (!withName)
      results = files.map(file => file.id)
    else
      files.forEach(file => results[file.name] = file.id)
  } catch (e) {
    templateLogError(e, 'getFilesIn')
  }
  return results
}