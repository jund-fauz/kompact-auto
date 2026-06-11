const batching = 100,
  getSs = Sheets.Spreadsheets.get

/**
 * Menyinkronkan daftar editor proteksi dari Spreadsheet Sumber ke Spreadsheet Target.
 * Eksekusi O(1) jaringan. Terisolasi dari mutasi sheetId.
 * @param {string} source - ID Spreadsheet A (Sumber yang memiliki editor lengkap)
 * @param {string} target - ID Spreadsheet Baru (Target yang proteksinya sudah ada tapi editornya reset)
 * @param {Object} options
 */
function syncProtectionEditors(source, target, options = {}) {
  const { withLog = true } = options
  let { sheet = null } = options
  if (sheet)
    sheet = lazyWrap(sheet)
  if (withLog)
    Logger.log(`Melakukan sinkronasi proteksi: ${source} -> ${target}`)
  const fields = 'sheets(properties(title),protectedRanges(protectedRangeId,range,description,editors))'
  /** @type {Sheets_v4.Sheets.V4.Schema.Spreadsheet} */
  const sourceData = retry(() => getSs(source, { fields, ranges: sheet }), { withReturnValue: true, waitingInSec: 2 }),
    targetData = retry(() => getSs(target, { fields, ranges: sheet }), { withReturnValue: true, waitingInSec: 2 }),
    sourceProtectionMap = {}
  let requests = []
  sourceData.sheets.forEach(sheet => {
    if (sheet.protectedRanges)
      sheet.protectedRanges.forEach(prot => {
        const range = prot.range
        sourceProtectionMap[`${sheet.properties.title}::${range.startRowIndex || 0}_${range.endRowIndex || 'MAX'}_${range.startColumnIndex || 0}_${range.endColumnIndex || 'MAX'}`] = prot.editors
      })
  })
  targetData.sheets.forEach(sheet => {
    if (sheet.protectedRanges)
      sheet.protectedRanges.forEach(prot => {
        const range = prot.range
        const sourceEditors = sourceProtectionMap[`${sheet.properties.title}::${range.startRowIndex || 0}_${range.endRowIndex || 'MAX'}_${range.startColumnIndex || 0}_${range.endColumnIndex || 'MAX'}`]
        if (sourceEditors) {
          if (withLog)
            Logger.log(`Memproses: ${sheet.properties.title}::${range.startRowIndex || 0}_${range.endRowIndex || 'MAX'}_${range.startColumnIndex || 0}_${range.endColumnIndex || 'MAX'}`)
          requests.push({
            updateProtectedRange: {
              protectedRange: {
                protectedRangeId: prot.protectedRangeId,
                editors: sourceEditors
              },
              fields: 'editors'
            }
          })
        }
      })
  })
  if (requests.length) {
    if (requests.length < batching)
      batchUpdate({ requests, spreadsheetId: target })
    else
      do {
        batchUpdate({ requests: requests.splice(0, batching), spreadsheetId: target })
        if (withLog) Logger.log(`Berhasil update ${batching} proteksi. Kurang ${requests.length} lagi.`)
      } while (requests.length)
    if (withLog)
      Logger.log('Sinkronasi proteksi antar spreadsheet berhasil dilakukan')
  }
}

/**
 * Menyinkronkan editor proteksi dari satu Sheet ke satu atau BANYAK Sheet target menggunakan identitas absolut.
 * Eksekusi absolut: 1 Panggilan Baca O(1) dan 1 Panggilan Tulis O(1) terlepas dari jumlah target.
 * @param {number} sourceSheetId - ID numerik Sheet Sumber.
 * @param {number|number[]} targetSheetIds - ID numerik Sheet Target (Angka tunggal ATAU Array angka).
 * @param {Object} options - Konfigurasi opsional.
 */
function syncProtectionEditorsBetweenSheet(sourceSheetId, targetSheetIds, options = {}) {
  // 1. Normalisasi Parameter (Koersi Matriks Numerik)
  if (!targetSheetIds || (isArray(targetSheetIds) && !targetSheetIds.length)) {
    throw new Error("[FATAL] Parameter targetSheetIds kosong atau tidak memiliki nilai valid.")
  }

  // Memaksa input menjadi Array meskipun argumen yang diberikan hanya 1 angka (number)
  const targetsArray = isArray(targetSheetIds) ? targetSheetIds : [targetSheetIds]
  const { withLog = true, spreadsheetId = null } = options

  if (withLog) Logger.log(`[START] Kloning proteksi massal berbasis ID: '${sourceSheetId}' -> [${targetsArray.length} target]`)

  // Injeksi mutlak: Meminta 'sheetId' ke dalam objek properties.
  // 'title' tetap dipertahankan murni untuk kebutuhan pelaporan log agar mudah dibaca manusia.
  const fields = 'sheets(properties(sheetId,title),protectedRanges(protectedRangeId,range,description,editors))'

  if (withLog) Logger.log('Melakukan scanning proteksi...')
  // Ekstraksi Jaringan O(1)
  /** @type {Sheets_v4.Sheets.V4.Schema.Spreadsheet} */
  const ssData = retry(() => getSs(spreadsheetId, { fields }), { withReturnValue: true, waitingInSec: 2 })
  if (withLog) Logger.log('Scanning proteksi selesai.')

  let sourceSheet = null
  const targetSheetsData = []

  // 2. Resolusi Memori Massal (Berbasis Numerik)
  ssData.sheets.forEach(sheet => {
    const id = sheet.properties.sheetId
    if (id === sourceSheetId) {
      sourceSheet = sheet
    } else if (targetsArray.includes(id)) {
      targetSheetsData.push(sheet)
    }
  })

  // Validasi Eksistensi dan Integritas Memori
  if (!sourceSheet) throw new Error(`[FATAL] Sheet sumber dengan ID '${sourceSheetId}' tidak ditemukan di dalam dokumen.`)
  if (!targetSheetsData.length) throw new Error(`[FATAL] Tidak ada satupun ID Sheet target valid yang ditemukan dari daftar yang diberikan.`)

  // Peringatan jika ada target ID yang tidak valid (Mencegah Silent Failure)
  if (targetSheetsData.length < targetsArray.length && withLog) {
    const foundTargets = targetSheetsData.map(s => s.properties.sheetId)
    const missing = targetsArray.filter(t => !foundTargets.includes(t))
    Logger.log(`[WARNING] Target dilewati (ID Sheet tidak eksis): [${missing.join(', ')}]`)
  }

  const sourceProtectionMap = {}
  let requests = []

  // 3. Pembangunan Peta Memori Sumber (Hanya dieksekusi 1 kali)
  if (sourceSheet.protectedRanges) {
    sourceSheet.protectedRanges.forEach(prot => {
      const range = prot.range
      const isSheetLevel = !('startRowIndex' in range) && !('endRowIndex' in range) && !('startColumnIndex' in range) && !('endColumnIndex' in range)
      const key = isSheetLevel
        ? 'SHEET_LEVEL'
        : `${range.startRowIndex || 0}_${range.endRowIndex || 'MAX'}_${range.startColumnIndex || 0}_${range.endColumnIndex || 'MAX'}`
      sourceProtectionMap[key] = prot.editors
    })
  }

  // 4. Evaluasi Multi-Target di dalam RAM
  targetSheetsData.forEach(targetSheet => {
    if (targetSheet.protectedRanges) {
      targetSheet.protectedRanges.forEach(prot => {
        const range = prot.range
        const isSheetLevel = !('startRowIndex' in range) && !('endRowIndex' in range) && !('startColumnIndex' in range) && !('endColumnIndex' in range)
        const key = isSheetLevel
          ? 'SHEET_LEVEL'
          : `${range.startRowIndex || 0}_${range.endRowIndex || 'MAX'}_${range.startColumnIndex || 0}_${range.endColumnIndex || 'MAX'}`

        if (withLog)
          Logger.log(`Memproses: ${key}`)

        const sourceEditors = sourceProtectionMap[key]

        if (sourceEditors) {
          requests.push({
            updateProtectedRange: {
              protectedRange: {
                protectedRangeId: prot.protectedRangeId,
                editors: sourceEditors
              },
              fields: 'editors'
            }
          })
        }
      })
    }
  })

  // 5. Eksekusi Jaringan Massal (1 API Call)
  if (requests.length) {
    if (requests.length < batching)
      batchUpdate({ requests, spreadsheetId })
    else
      do {
        batchUpdate({ requests: requests.splice(0, batching), spreadsheetId })
        if (withLog) Logger.log(`Berhasil update ${batching} proteksi. Kurang ${requests.length} lagi.`)
      } while (requests.length)
    if (withLog) Logger.log(`[SUKSES] ${requests.length} blok proteksi didistribusikan ke ${targetSheetsData.length} Sheet target.`)
  } else {
    if (withLog) Logger.log(`[INFO] Tidak ada konfigurasi proteksi yang cocok untuk disinkronkan pada target.`)
  }
}

/**
 * @param {string[]} fileIds
 * @param {string[]} emails
 */
function addEmailsTo(fileIds, ...emails) {
  const token = ScriptApp.getOAuthToken(),
    addRequests = [],
    getRequests = fileIds.map(id => ({
      url: `https://sheets.googleapis.com/v4/spreadsheets/${id}?fields=${encodeURIComponent('sheets(protectedRanges(protectedRangeId,editors(users)))')}`,
      method: 'get',
      headers: {
        Authorization: `Bearer ${token}`
      },
      muteHttpExceptions: true
    }))

  const responses = UrlFetchApp.fetchAll(getRequests)

  responses.forEach((response, no) => {
    if (response.getResponseCode() === 200) {
      /** @type {Sheets_v4.Sheets.V4.Schema.Spreadsheet} */
      const data = JSON.parse(response.getContentText())
      const fileUpdateInstructions = []

      data.sheets.forEach(sheet => {
        if (sheet.protectedRanges)
          sheet.protectedRanges.forEach(prot => {
            fileUpdateInstructions.push({
              updateProtectedRange: {
                protectedRange: {
                  protectedRangeId: prot.protectedRangeId,
                  editors: {
                    'users': prot.editors?.users ? [...prot.editors.users, ...emails] : emails
                  }
                },
                fields: 'editors'
              }
            })
          })
      })
      if (fileUpdateInstructions.length)
        addRequests.push({
          url: `https://sheets.googleapis.com/v4/spreadsheets/${fileIds[no]}:batchUpdate`,
          method: 'post',
          contentType: 'application/json',
          headers: {
            Authorization: `Bearer ${token}`
          },
          payload: JSON.stringify({ requests: fileUpdateInstructions }),
          muteHttpExceptions: true
        })
    } else
      Logger.log(`Spreadsheet Id: ${fileIds[no]}\nResponse Code: ${response.getResponseCode()}\nDetail: ${response.getContentText()}`)
  })

  if (addRequests.length) {
    const addResponses = UrlFetchApp.fetchAll(addRequests)
    let successCount = 0, failCount = 0
    addResponses.forEach((res, i) => {
      const url = addRequests[i].url
      const fileId = url.match(/spreadsheets\/([^/:]+)/)?.[1] || 'unknown'
      const code = res.getResponseCode()
      if (code === 200) {
        successCount++
        Logger.log(`[OK] ${fileId}: Editor berhasil diperbarui`)
      } else {
        failCount++
        Logger.log(`[GAGAL] ${fileId}\n  Response Code: ${code}\n  Detail: ${res.getContentText()}`)
      }
    })
    Logger.log(`[SUMMARY] addEmailsTo selesai — Berhasil: ${successCount}, Gagal: ${failCount}, Total: ${addResponses.length}`)
  } else {
    Logger.log('[INFO] addEmailsTo: Tidak ada file yang memerlukan pembaruan editor')
  }
}

/**
 * @param {string} spreadsheetSourceId
 * @param {string} spreadsheetTargetId
 * @param {boolean} asViewer
 */
function syncRoles(spreadsheetSourceId, spreadsheetTargetId, asViewer = false) {
  if (!spreadsheetSourceId || !spreadsheetTargetId)
    throw Error(`⚠️ copyRoles dibatalkan: sourceId="${spreadsheetSourceId}", targetId="${spreadsheetTargetId}"`)

  const token = ScriptApp.getOAuthToken(), batchUrl = 'https://www.googleapis.com/batch/drive/v3', boundary = `batch_api_boundary_${new Date().getTime()}`
  let payload = ''

  // Get existing permissions on target to avoid duplicates
  const existingPermissions = retry(() => Drive.Permissions.list(spreadsheetTargetId, {
    fields: "permissions(emailAddress)",
    supportsAllDrives: true
  }).permissions, { withReturnValue: true, waitingInSec: 2 }) || [], existingMap = new Map()
  existingPermissions.forEach(perm => existingMap.set((perm.emailAddress || perm.type).toLowerCase(), perm.role))

  Drive.Permissions.list(spreadsheetSourceId, {
    fields: "permissions(emailAddress, role, type, domain)",
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