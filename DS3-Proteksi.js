/**
 * @param {string} spreadsheetSourceId
 * @param {string} spreadsheetTargetId
 * @param {boolean} asViewer
 */
function syncRoles(spreadsheetSourceId, spreadsheetTargetId, asViewer = false) {
  if (!spreadsheetSourceId || !spreadsheetTargetId)
    throw Error(`⚠️ copyRoles dibatalkan: sourceId="${spreadsheetSourceId}", targetId="${spreadsheetTargetId}"`)

  const token = ScriptApp.getOAuthToken(), batchUrl = 'https://www.googleapis.com/batch/drive/v3',
    boundary = `batch_api_boundary_${new Date().getTime()}`
  let payload = ''

  // Get existing permissions on target to avoid duplicates
  const existingPermissions = retry(() => Drive.Permissions.list(spreadsheetTargetId, {
    fields: 'permissions(emailAddress)',
    supportsAllDrives: true
  }).permissions, { withReturnValue: true, waitingInSec: 2 }) || [], existingMap = new Map()
  existingPermissions.forEach(perm => (perm.emailAddress || perm.type) && existingMap.set((perm.emailAddress || perm.type).toLowerCase(), perm.role))

  Drive.Permissions.list(spreadsheetSourceId, {
    fields: 'permissions(emailAddress, role, type, domain)',
    supportsAllDrives: true
  }).permissions.forEach((permission, no) => {
    if (permission.role === 'owner') return
    const key = (permission.emailAddress || permission.type).toLowerCase()
    const existingRole = existingMap.get(key)
    // Skip if permission already exists on target
    if (existingRole) {
      Logger.log(`⏭️ Skip (Akses sudah memadai): ${key} [${existingRole}]`)
      return
    }
    payload += `--${boundary}\r\nContent-Type: application/http\r\nContent-ID: item_${no}\r\n\r\nPOST https://www.googleapis.com/drive/v3/files/${spreadsheetTargetId}/permissions?supportsAllDrives=true&sendNotificationEmail=false HTTP/1.1\r\nContent-Type: application/json\r\n\r\n${JSON.stringify({
      role: asViewer ? 'reader' : (permission.role || 'reader'),
      type: 'user',
      emailAddress: permission.emailAddress
    })}\r\n\r\n`
  })

  if (payload) {
    payload += `--${boundary}--\r\n\r\n`

    const response = UrlFetchApp.fetch(batchUrl, {
      method: 'post',
      contentType: `multipart/mixed boundary=${boundary}`,
      payload,
      headers: {
        Authorization: `Bearer ${token}`
      },
      muteHttpExceptions: true
    })

    if (response.getResponseCode() === 200)
      Logger.log(`Berhasil mensinkronkan email antar spreadsheet`)
    else
      throw Error(`Response code: ${response.getResponseCode()}\nDetail: ${response.getContentText()}`)
  }
}