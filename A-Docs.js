/**
 * Note buat besok:
 * - Sederhanakan const range = prot.range di DS3-Proteksi.gs
 * - Filter sheet Request Builder
 * - Hapus fungsi getLong&ShortMonth
 */

/**
 * Konvensi penulisan skrip
 * A. Penamaan Fungsi
 *  1. Kata benda (noun) untuk fungsi yang mengembalikan nilai.
 *  2. Kata kerja (verb) untuk fungsi yang melakukan algoritma tertentu tanpa mengembalikan nilai.
 * B. Pengkategorian File
 *  - Tiap file diberikan kategori kode sesuai dengan platform / framework yang digunakan, dengan ketentuan:
 *   1. DS = Drive Spreadsheet
 *   2. F = File (Google Drive)
 *   3. JS = JavaScript (Vanilla)
 *  - Fungsi-fungsi dengan tujuan manipulasi untuk tipe data tertentu dipisahkan di dalam satu file untuk satu tipe data / kategori.
 * C. Pemisahan / Penggabungan Fungsi
 *  - Fungsi dipisah saat tujuan dari suatu fungsi sudah memiliki perbedaan yang jelas.
 *  - Fungsi tetap digabung apabila tujuan fungsi masih sama, meskipun dapat diberi parameter dengan tipe yang berbeda-beda.
 * D. Parameter Fungsi
 *  - Parameter dideklarasikan tipe nya menggunakan JSDoc.
 *  - Maksimal jumlah parameter yang wajib diisi adalah 3. Lebih dari itu dibungkus menggunakan parameter 'options' berbentuk objek.
 *  - Parameter bisa memiliki nilai default berupa nilai yang sering dipakai
 */

/*
  KET:

  DS  = Drive Spreadsheet
  F   = File (Drive)
  JS  = JavaScript
  T   = Test

  ==== DOKUMENTASI FUNGSI ====

  1. Fungsi Berdiri Sendiri (Standalone)
     -> Fungsi yang tidak memanggil dan tidak dipanggil oleh fungsi lain di library ini.
     - duplicate
     - extract
     - getMonth
     - getValueWhere
     - me
     - toParam
     - toSpreadsheetDate

  2. Fungsi yang Memanggil Fungsi Lain
     -> Fungsi yang di dalamnya terdapat pemanggilan ke fungsi lain di library ini.
     - add (memanggil: addRequest, get, id, isObject, lazyWrap, push, set, toGridRange, values)
     - addEmailsTo (memanggil: batchUpdate, get, id, push)
     - addEmptyValueRequest (memanggil: filter, flat, push, values)
     - addRequest (memanggil: batchUpdate, filter, flat, isObject, push)
     - addToGlobalCache (memanggil: getGlobalCache, value)
     - addValueRequest (memanggil: batchUpdate, filter, flat, isObject, push, values)
     - alert (memanggil: ButtonSet, includes)
     - autoFill (memanggil: addRequest, toGridRange, values)
     - batchUpdate (memanggil: get, getActiveSpreadsheet, retry)
     - between (memanggil: compare, value)
     - buildFromExistingRequests (memanggil: getActiveSpreadsheet)
     - capitalize (memanggil: slice, value)
     - color (memanggil: addRequest, toGridRange, values)
     - compare (memanggil: isObject, value)
     - containOneOf (memanggil: flat, includes, isTypeOf, value)
     - copyPaste (memanggil: addRequest, batchUpdate, filter, flat, getActiveSpreadsheet, getSheet, id, includes, isAllArray, toGridRange, unique)
     - copySheet (memanggil: rename, resetCache, setSheet, values)
     - create (memanggil: getActiveSpreadsheet)
     - delete (memanggil: addRequest, filter, get, includes, lazyWrap, notSameWith, repeat)
     - deleteNull (memanggil: filter, value)
     - dif (memanggil: flat, getOptions)
     - empty (memanggil: addEmptyValueRequest, filter, processRange, values)
     - endWith (memanggil: flat, getOptions, process, value)
     - filter (memanggil: addRequest, getColumnByHeader, isObject, processRange, toGridRange, toObject)
     - filterCriteria (memanggil: batchUpdate, filter, getA1N, push, toGridRange)
     - findRow (memanggil: getA1N, getActiveSpreadsheet, getValues, includes, processRange, values)
     - formattingFunc (memanggil: formatDate, getHeaders, getIndexesWith, isDate, slice, toCamelCase, value, values)
     - get (memanggil: flat, getOptions)
     - getA1N (memanggil: getActiveSpreadsheet)
     - getA1NByEmptyRow (memanggil: findRow, getA1N, getActiveSpreadsheet)
     - getA1NByName (memanggil: get, getActiveSpreadsheet, toA1Notation)
     - getActive (memanggil: getColumnLetter, getValue, value)
     - getAllDailySheets (memanggil: filter, getActiveSpreadsheet, notSameWith, sort, test, value)
     - getAllMonthSheets (memanggil: filter, getActiveSpreadsheet, includes)
     - getAllSheetsByName (memanggil: containOneOf, getActiveSpreadsheet, retry, toCamelCase)
     - getColumnByHeader (memanggil: getActiveSpreadsheet, getColumnLetter, getHeaders, isObject, push, toCamelCase)
     - getColumnByType (memanggil: getColumnByHeader, getColumnLetter, isAllArray, test)
     - getColumnCountFromA1N (memanggil: getColumnNum, includes)
     - getColumnFromA1N (memanggil: getColumnIndex, getColumnNum, includes)
     - getEventDetail (memanggil: getColumnLetter, getSheet, value)
     - getFileIdsIn (memanggil: getFolderIdFromPath, id, includes, retry, templateLogError)
     - getFolderIdFromPath (memanggil: addToGlobalCache, filter, getGlobalCache, id, replace, retry)
     - getGlobalCache (memanggil: get, value)
     - getHeaders (memanggil: addToGlobalCache, getActiveSpreadsheet, getGlobalCache, getValues)
     - getIndexesWith (memanggil: filter, includes, push, slice, value, values)
     - getLongMonth (memanggil: id, value)
     - getMonthlySheet (memanggil: filter, getActiveSpreadsheet)
     - getOptions (memanggil: isObject)
     - getRemoteEventDetail (memanggil: getColumnLetter, getSheet, getValue, value)
     - getRowCountFromA1N (memanggil: includes)
     - getRowFromA1N (memanggil: includes)
     - getSheet (memanggil: addToGlobalCache, filter, get, getActiveSpreadsheet, getGlobalCache, includes, retry, unique)
     - getShortMonth (memanggil: id)
     - getSpreadsheetTimeZone (memanggil: batchUpdate, getActiveSpreadsheet)
     - getValue (memanggil: flat, get, getA1N, getActiveSpreadsheet, processRange, values)
     - getValues (memanggil: delete, flat, get, getA1N, getActiveSpreadsheet, getColumnFromA1N, getRowCountFromA1N, getRowFromA1N, isAllArray, isObject, max, push, repeat, replace, sum, unique, values, wrap)
     - getValuesByColumn (memanggil: values)
     - getValuesExcept (memanggil: filter, values)
     - grantAllImportrange (memanggil: add, getActiveSpreadsheet, id, includes)
     - id (memanggil: addToGlobalCache, getFolderIdFromPath, getGlobalCache, notSameWith, replace, retry, templateLogError)
     - includes (memanggil: flat, value)
     - insertAfter (memanggil: add, addRequest, getColumnNum, id, notSameWith, values)
     - insertCell (memanggil: addRequest, notSameWith, toGridRange, values)
     - isAllArray (memanggil: value)
     - isDate (memanggil: between, test, value)
     - isFalsy (memanggil: filter, flat)
     - isObject (memanggil: flat, value, values)
     - isTruthy (memanggil: filter, flat)
     - isTypeOf (memanggil: flat)
     - isUnique (memanggil: flat, value)
     - isYear (memanggil: between, value)
     - iterate (memanggil: push)
     - join (memanggil: slice, values)
     - lazyWrap (memanggil: value, wrap)
     - lowerThan (memanggil: flat, getOptions, value)
     - max (memanggil: flat, get, getColumnLetter)
     - notSameWith (memanggil: compare, flat, includes, value)
     - process (memanggil: isObject, value, values)
     - processRange (memanggil: filter, get, getColumnLetter, getValues, includes, isObject, isTypeOf, lazyWrap, replace, sameWith, slice, toObject, wrap)
     - protect (memanggil: addRequest, between, filter, get, id, includes, processRange, push, toGridRange, toObject)
     - push (memanggil: flat, values)
     - remove (memanggil: lazyWrap)
     - rename (memanggil: addRequest, values)
     - repeat (memanggil: value)
     - replace (memanggil: addRequest, toGridRange, values)
     - resetCache (memanggil: remove)
     - resize (memanggil: addRequest, getColumnNum, values)
     - rowProcess (memanggil: containOneOf, filter, filterCriteria, flat, get, getA1N, push, sameWith, values)
     - run (memanggil: batchUpdate, delete, grant, grantAllImportrange)
     - sameWith (memanggil: flat, getOptions, value)
     - set (memanggil: values)
     - setSheet (memanggil: filter, getSheet, includes, iterate, lazyWrap, unique, wrap)
     - setValue (memanggil: batchUpdate, delete, getA1N, getActiveSpreadsheet, getRowCountFromA1N, repeat, value, values, wrap)
     - setValues (memanggil: batchUpdate, delete, getA1N, getActiveSpreadsheet, getColumnCountFromA1N, getRowCountFromA1N, repeat, value, values)
     - show (memanggil: isObject)
     - sort (memanggil: isTypeOf)
     - sortRange (memanggil: batchUpdate, findRow, getA1N, getActiveSpreadsheet, getHeaders, getValues, push, setValues, slice, sort, toGridRange, values)
     - sum (memanggil: flat, isTypeOf, replace, unique)
     - syncProtectionEditors (memanggil: batchUpdate, lazyWrap, push, retry)
     - syncProtectionEditorsBetweenSheet (memanggil: batchUpdate, filter, getActiveSpreadsheet, id, includes, join, push, retry)
     - syncRoles (memanggil: get, retry, set)
     - templating (memanggil: Button, isObject)
     - toA1Notation (memanggil: getColumnLetter, test)
     - toast (memanggil: getActiveSpreadsheet)
     - toCamelCase (memanggil: replace)
     - toDate (memanggil: isDate, value)
     - toggleView (memanggil: add, addRequest, filter, id, includes, lazyWrap, notSameWith, value, values)
     - toGridRange (memanggil: getActiveSpreadsheet, getColumnIndex, getSheet, includes)
     - toObject (memanggil: flat)
     - unique (memanggil: filter, flat)
     - value (memanggil: addValueRequest, getColumnFromA1N, getRowCountFromA1N, getRowFromA1N, isTypeOf, processRange, repeat, values, wrap)
     - values (memanggil: addValueRequest, getColumnCountFromA1N, getRowCountFromA1N, processRange, repeat, value)
     - wrap (memanggil: iterate, value)

  3. Fungsi yang Dipanggil Fungsi Lain
     -> Fungsi yang digunakan/dipanggil oleh fungsi lain di library ini.
     - add (dipanggil oleh: grantAllImportrange, insertAfter, toggleView)
     - addEmptyValueRequest (dipanggil oleh: empty)
     - addRequest (dipanggil oleh: add, autoFill, color, copyPaste, delete, filter, insertAfter, insertCell, protect, rename, replace, resize, toggleView)
     - addToGlobalCache (dipanggil oleh: getFolderIdFromPath, getHeaders, getSheet, id)
     - addValueRequest (dipanggil oleh: value, values)
     - batchUpdate (dipanggil oleh: addEmailsTo, addRequest, addValueRequest, copyPaste, filterCriteria, getSpreadsheetTimeZone, run, setValue, setValues, sortRange, syncProtectionEditors, syncProtectionEditorsBetweenSheet)
     - between (dipanggil oleh: isDate, isYear, protect)
     - Button (dipanggil oleh: templating)
     - ButtonSet (dipanggil oleh: alert)
     - compare (dipanggil oleh: between, notSameWith)
     - containOneOf (dipanggil oleh: getAllSheetsByName, rowProcess)
     - delete (dipanggil oleh: getValues, run, setValue, setValues)
     - filter (dipanggil oleh: addEmptyValueRequest, addRequest, addValueRequest, copyPaste, delete, deleteNull, empty, filterCriteria, getAllDailySheets, getAllMonthSheets, getFolderIdFromPath, getIndexesWith, getMonthlySheet, getSheet, getValuesExcept, isFalsy, isTruthy, processRange, protect, rowProcess, setSheet, syncProtectionEditorsBetweenSheet, toggleView, unique)
     - filterCriteria (dipanggil oleh: rowProcess)
     - findRow (dipanggil oleh: getA1NByEmptyRow, sortRange)
     - flat (dipanggil oleh: addEmptyValueRequest, addRequest, addValueRequest, containOneOf, copyPaste, dif, endWith, get, getValue, getValues, includes, isFalsy, isObject, isTruthy, isTypeOf, isUnique, lowerThan, max, notSameWith, push, rowProcess, sameWith, sum, toObject, unique)
     - formatDate (dipanggil oleh: formattingFunc)
     - get (dipanggil oleh: add, addEmailsTo, batchUpdate, delete, getA1NByName, getGlobalCache, getSheet, getValue, getValues, max, processRange, protect, rowProcess, syncRoles)
     - getA1N (dipanggil oleh: filterCriteria, findRow, getA1NByEmptyRow, getValue, getValues, rowProcess, setValue, setValues, sortRange)
     - getActiveSpreadsheet (dipanggil oleh: batchUpdate, buildFromExistingRequests, copyPaste, create, findRow, getA1N, getA1NByEmptyRow, getA1NByName, getAllDailySheets, getAllMonthSheets, getAllSheetsByName, getColumnByHeader, getHeaders, getMonthlySheet, getSheet, getSpreadsheetTimeZone, getValue, getValues, grantAllImportrange, setValue, setValues, sortRange, syncProtectionEditorsBetweenSheet, toGridRange, toast)
     - getColumnByHeader (dipanggil oleh: filter, getColumnByType)
     - getColumnCountFromA1N (dipanggil oleh: setValues, values)
     - getColumnFromA1N (dipanggil oleh: getValues, value)
     - getColumnIndex (dipanggil oleh: getColumnFromA1N, toGridRange)
     - getColumnLetter (dipanggil oleh: getActive, getColumnByHeader, getColumnByType, getEventDetail, getRemoteEventDetail, max, processRange, toA1Notation)
     - getColumnNum (dipanggil oleh: getColumnCountFromA1N, getColumnFromA1N, insertAfter, resize)
     - getFolderIdFromPath (dipanggil oleh: getFileIdsIn, id)
     - getGlobalCache (dipanggil oleh: addToGlobalCache, getFolderIdFromPath, getHeaders, getSheet, id)
     - getHeaders (dipanggil oleh: formattingFunc, getColumnByHeader, sortRange)
     - getIndexesWith (dipanggil oleh: formattingFunc)
     - getOptions (dipanggil oleh: dif, endWith, get, lowerThan, sameWith)
     - getRowCountFromA1N (dipanggil oleh: getValues, setValue, setValues, value, values)
     - getRowFromA1N (dipanggil oleh: getValues, value)
     - getSheet (dipanggil oleh: copyPaste, getEventDetail, getRemoteEventDetail, setSheet, toGridRange)
     - getValue (dipanggil oleh: getActive, getRemoteEventDetail)
     - getValues (dipanggil oleh: findRow, getHeaders, processRange, sortRange)
     - grant (dipanggil oleh: run)
     - grantAllImportrange (dipanggil oleh: run)
     - id (dipanggil oleh: add, addEmailsTo, copyPaste, getFileIdsIn, getFolderIdFromPath, getLongMonth, getShortMonth, grantAllImportrange, insertAfter, protect, syncProtectionEditorsBetweenSheet, toggleView)
     - includes (dipanggil oleh: alert, containOneOf, copyPaste, delete, findRow, getAllMonthSheets, getColumnCountFromA1N, getColumnFromA1N, getFileIdsIn, getIndexesWith, getRowCountFromA1N, getRowFromA1N, getSheet, grantAllImportrange, notSameWith, processRange, protect, setSheet, syncProtectionEditorsBetweenSheet, toGridRange, toggleView)
     - isAllArray (dipanggil oleh: copyPaste, getColumnByType, getValues)
     - isDate (dipanggil oleh: formattingFunc, toDate)
     - isObject (dipanggil oleh: add, addRequest, addValueRequest, compare, filter, getColumnByHeader, getOptions, getValues, process, processRange, show, templating)
     - isTypeOf (dipanggil oleh: containOneOf, processRange, sort, sum, value)
     - iterate (dipanggil oleh: setSheet, wrap)
     - join (dipanggil oleh: syncProtectionEditorsBetweenSheet)
     - lazyWrap (dipanggil oleh: add, delete, processRange, remove, setSheet, syncProtectionEditors, toggleView)
     - max (dipanggil oleh: getValues)
     - notSameWith (dipanggil oleh: delete, getAllDailySheets, id, insertAfter, insertCell, toggleView)
     - process (dipanggil oleh: endWith)
     - processRange (dipanggil oleh: empty, filter, findRow, getValue, protect, value, values)
     - push (dipanggil oleh: add, addEmailsTo, addEmptyValueRequest, addRequest, addValueRequest, filterCriteria, getColumnByHeader, getIndexesWith, getValues, iterate, protect, rowProcess, sortRange, syncProtectionEditors, syncProtectionEditorsBetweenSheet)
     - remove (dipanggil oleh: resetCache)
     - rename (dipanggil oleh: copySheet)
     - repeat (dipanggil oleh: delete, getValues, setValue, setValues, value, values)
     - replace (dipanggil oleh: getFolderIdFromPath, getValues, id, processRange, sum, toCamelCase)
     - resetCache (dipanggil oleh: copySheet)
     - retry (dipanggil oleh: batchUpdate, getAllSheetsByName, getFileIdsIn, getFolderIdFromPath, getSheet, id, syncProtectionEditors, syncProtectionEditorsBetweenSheet, syncRoles)
     - sameWith (dipanggil oleh: processRange, rowProcess)
     - set (dipanggil oleh: add, syncRoles)
     - setSheet (dipanggil oleh: copySheet)
     - setValues (dipanggil oleh: sortRange)
     - slice (dipanggil oleh: capitalize, formattingFunc, getIndexesWith, join, processRange, sortRange)
     - sort (dipanggil oleh: getAllDailySheets, sortRange)
     - sum (dipanggil oleh: getValues)
     - templateLogError (dipanggil oleh: getFileIdsIn, id)
     - test (dipanggil oleh: getAllDailySheets, getColumnByType, isDate, toA1Notation)
     - toA1Notation (dipanggil oleh: getA1NByName)
     - toCamelCase (dipanggil oleh: formattingFunc, getAllSheetsByName, getColumnByHeader)
     - toGridRange (dipanggil oleh: add, autoFill, color, copyPaste, filter, filterCriteria, insertCell, protect, replace, sortRange)
     - toObject (dipanggil oleh: filter, processRange, protect)
     - unique (dipanggil oleh: copyPaste, getSheet, getValues, setSheet, sum)
     - value (dipanggil oleh: addToGlobalCache, between, capitalize, compare, containOneOf, deleteNull, endWith, formattingFunc, getActive, getAllDailySheets, getEventDetail, getGlobalCache, getIndexesWith, getLongMonth, getRemoteEventDetail, includes, isAllArray, isDate, isObject, isUnique, isYear, lazyWrap, lowerThan, notSameWith, process, repeat, sameWith, setValue, setValues, toDate, toggleView, values, wrap)
     - values (dipanggil oleh: add, addEmptyValueRequest, addValueRequest, autoFill, color, copySheet, empty, findRow, formattingFunc, getIndexesWith, getValue, getValues, getValuesByColumn, getValuesExcept, insertAfter, insertCell, isObject, join, process, push, rename, replace, resize, rowProcess, set, setValue, setValues, sortRange, toggleView, value)
     - wrap (dipanggil oleh: getValues, lazyWrap, processRange, setSheet, setValue, value)

  4. Fungsi yang Saling Memanggil
     -> Fungsi-fungsi yang di dalam implementasinya dapat saling memanggil.
     - addRequest <-> filter
     - addValueRequest <-> values
     - filter <-> processRange
     - getFolderIdFromPath <-> id
     - repeat <-> value
     - value <-> values
     - value <-> wrap

  5. Penjelasan Fungsi
     -> Rangkuman penjelasan kegunaan dari setiap fungsi di library ini.
     - getGlobalCache: Mengambil atau menginisialisasi cache global pada runtime memory.
     - addToGlobalCache: Menambahkan data state ke cache memory lokal maupun CacheService GAS.
     - resetCache: Mereset ulang semua CacheService yang tersimpan dari eksekusi aplikasi.
     - getColumnByHeader: Mencari index angka atau huruf suatu kolom spesifik dari judul baris header Sheet.
     - getColumnFromA1N: Memisahkan referensi kolom alfabetis atau nilai indeks numerik dari notasi string A1.
     - getColumnCountFromA1N: Menghitung jumlah jarak lebar kolom yang ada di dalam referensi string Notasi A1.
     - getColumnLetter: Mentransformasi index angka (misal: 1, 2) menjadi alfabet sheet native (misal: A, B).
     - getColumnNum: Helper utilitas resolver validasi untuk fallback referensi letter num column mapping Request builder class.
     - getColumnIndex: Mengonversi kolom huruf/alfabet A1 ke zero-based index API sheets protocol.
     - toSpreadsheetDate: Mengubah JS native timestamp dates/string menjadi angka float serial Google Sheets tanggal.
     - getHeaders: Mengambil array string yang mencakup urutan judul-judul head row di Spreadsheet.
     - getA1N: Membuat syntax notasi A1 berdasar gabungan koordinat start-end baris kolom numerik maupun string.
     - getA1NByName: Lookup reference Notasi A1 melalui parameter mapping Named Ranges spreadsheet asli.
     - toGridRange: Wrapper method helper internal instance untuk mengubah konvensi A1 menjadi json format grid obj.
     - toA1Notation: Converter object GridRange (index x,y) menjadi penamaan A1 Notation string readable.
     - sortRange: Mengeksekusi penyusunan ulang order range berdasar filter dan column referensi yang disediakan.
     - copyPaste: Mengeksekusi API sheets request untuk menyalin suatu area ke tujuan destinasi dengan paste options.
     - findRow: Memanggil native lookup find-row text via GoogleTextFinder tanpa async network delays object.
     - getRowFromA1N: Mengekstrak angka baris pertama dari syntax string notasi A1.
     - getRowCountFromA1N: Mengkalkulasi selisih interval total baris secara matematis dari representasi A1 Notation.
     - getA1NByEmptyRow: Mencari baris selang seling yang pertama kosong untuk membangun A1 notation titik append entri baru.
     - get: Membaca serta mem-parse data konfigurasi atau nilai local list dari AppsScript PropertiesService.
     - set: Meng-assign dan menetapkan properti baru bentuk JSON raw string payload di PropertiesService.
     - add: Menggabungkan set nilai ke list konfigurasi PropertiesService array tanpa menghapus yang lama.
     - remove: Menghapus instance key tersimpan dari list properti sistem PropertiesService AppsScript.
     - getValue: Mengekstrak native direct string cell referensi utilitas eksekusi real time read fetch value.
     - getValues: Mengekstrak array multi dimensional read fetching data pada current sheet instance tanpa antrian builder request.
     - setValue: Shorthand API entry tunggal primitive/seragam rentang bulk ke lembaran spreadsheet sheet.
     - setValues: Fungsi utama push tulis arrays 2D massal ke spreadsheet melalui request format Batch Update API local.
     - getEventDetail: Membangun custom JSON interface detail referensi (user, kolom, prevValue, cell) dari OnEdit/Onchange GAS trigger lokal.
     - getRemoteEventDetail: Adaptasi custom JSON object interface onEdit event untuk referensi antar-spreadsheet (cross-ss) remote execution.
     - getSheet: Pembangun id/name map layer semua sheets pada ActiveSs dengan local in-memory auto-caching.
     - getActive: Melacak highlight koordinat kursor dan metadata informasi context sel lembar aktif pemakai.
     - getAllMonthSheets: Mengambil array koleksi metadata SheetProperties untuk daftar sheet bernama bulan-bulan singkat kalender standar.
     - getMonthlySheet: Memperoleh single objek properti Sheet yang penamaannya mencerminkan index parameter bulan dicari.
     - getAllDailySheets: Memperoleh array properties metadata dari sheet yang penamaannya berbentuk format digit hari kalender (1-31).
     - getAllSheetsByName: Mengembalikan Dict keys metadata yang disaring berdasarkan target list penamaan spesifik whitelist exception layer sheets.
     - getActiveSpreadsheet: Shorthand helper penarikan instan Spreadsheet.getActiveSpreadsheet().getId().
     - getSpreadsheetTimeZone: Menyajikan status ID timeZone regional script lembar document (misal: 'Asia/Jakarta').
     - batchUpdate: Central interface eksekutor payload request array method 'Sheets.Spreadsheets.batchUpdate'.
     - toast: Trigger render kotak popup kecil notifikasi ringan auto-hide di sudut workspace document UI pemakai.
     - show: Pop-over render kustom form window HTML dialog overlay dan transfer objek local payload script ke frontend views.
     - templating: Injeksi parsial variable arguments payload ke dalam eval HTML Template string GAS UI component.
     - alert: Modal Pop-up box confirmation dialog UI statis natif SpreadsheetApp environment dengan button response.
     - syncProtectionEditors: Alat sinkronasi replika rules/hak izin proteksi editor range lembar asal dengan cell id sejenis di spreadsheet kembaran.
     - syncProtectionEditorsBetweenSheet: Pemindah masal pengaturan security proteksi cell dari master id sheet referensi ke array id sheets replika target dokumen lokal.
     - addEmailsTo: Skrip utility penginject address user editor baru ke seluruh kolektif ProtectedRanges yang terdapat pada file-file referensi external.
     - syncRoles: Skrip utility penyetaraan hak Drive.Permissions (role writer/reader share external) duplikasi antar dua instance dokumen GDrive Spreadsheet.
     - grantAllImportrange: Mengurai string regex rumus cell 'IMPORTRANGE', mengekstrak seluruh sumber doc URL sheet nya, kemudian memaksa persetujuan bypass auto grant Access.
     - me: Shorthand fungsi pengambilan user runtime active address yang login (Session.getActiveUser().getEmail()).
     - duplicate: Pola awal wrapper fungsi penggandaan objek file Google Drive berbasis Drive API source ID.
     - create: Factory pemanggil Class obj 'SsRequests' selaku Builder pattern penumpuk deret manipulasi aksi Sheets.
     - buildFromExistingRequests: Merekonstruksi kembali object SsRequests builder dengan restore state/array antrian manipulasi dari JSON existing.
     - setSheet: Menentukan/Filter nama/ID target scope lembaran utama tujuan seluruh operasi API Request chain sesudahnya.
     - color: Menambahkan payload manipulasi API cell color update formatter format styling text.
     - resize: Menambahkan format perintah pembaruan grid column resize dimensi dalam pixel dimension.
     - autoFill: Menambahkan payload pendorong copy auto-progress drag sel ke API batchRequests array list.
     - copySheet: Merender local clone / copy instan layer target sheet saat ini melalui spreadsheet local object api.
     - replace: Menambahkan payload fungsi manipulasi utilitas mass search/replace text cell global text find.
     - delete: Menambahkan payload penyingkiran mutlak struktur layer sheets, row range baris, atau cell prot rule object dari document.
     - formatDate: Transformator tanggal converter string formatter object format masking pattern date 'yyyy-mm-dd' utilitas format Asia/Jakarta locale native Utilities library Apps Script pattern formatter lokal ID mask.
     - toggleView: Menambahkan instruksi hide atau unhide baris, kolom, atau sheet view properti dari list array eksekusi API request.
     - insertAfter: Mencantumkan operasi penyisipan pergeseran shift sel dimensi ruang baris/kolom kosong pasca node penunjuk di array requests.
     - insertCell: Mencantumkan set penyisipan insert range shift koordinat dalam area rentang area tertentu ke array request.
     - rename: Mempush operasi UpdateSheetProperties modifikasi sheetTitle / nama baru pada array antrian payload batch.
     - max: Pencari pemindai selector Math max native array extraction function extraction nilai puncak bounds limit array array array math map array map bounds math limit limit map map map limit map extraction array extraction limit array map extraction extraction math limit bounds limit map math limit array array extraction.
     - empty: Mencantumkan range baris pada array instruksi pembersihan batchClear hapus konten data sel.
     - value: Mengompres injeksi object Value tunggal entry format sel/rentang sel per 2D dimension API UserEntered data request.
     - values: Melakukan loop dan push injection format Array 2D besar update API UpdateValues pada penampungan memori API Update Values.
     - grant: Menetapkan flag tanda statis untuk mengaktifkan skrip utilitas 'grantAllImportrange' otomatis pada ujung runtime build Request run().
     - run: Klimaks method, meluncurkan dan mengeksekusi semua antrian tumpukan Payload API Call (batchClear, Values Update, dan BatchUpdate Formatting) secara asinkron jaringan internet ke backend Sheets server.
     - addRequest: Push paksa injeksi json array syntax batchUpdate native valid ke pipeline instance class obj manual request.
     - addValueRequest: Push paksa injeksi syntax raw array values update target pipeline memory buffer class instance API batch update.
     - addEmptyValueRequest: Push manual string A1Notation grid coordinate ke dalam target pool antrian daftar batch clear removal content.
     - processRange: Mentransformasi logic filter exception multi sheet name input ranges kedalam mapping notasi A1 string mutlak beresolusi komplit array.
     - filter: Menyisipkan konstruksi format SetBasicFilter properties penciptaan filter logika rules conditions criteria.
     - protect: Menyusun struktur konfigurasi JSON ProtectedRanges rights management security protection ke batchUpdate object push pipeline.
     - getFolderIdFromPath: Penelusuran hirarki URL path navigasi slash '/' Google Drive meresolve hingga menemu string Folder ID absolut dari tree GDrive API.
     - id: Mengambil string ID hash metadata drive root object files/folder API berdasarkan query pencarian string judul unik.
     - getFileIdsIn: Fetching massal array string identifier id hash metadata segala sub-file anggota dari sebuah container parent root ID folder Gdrive.
     - deleteNull: Membersihkan referensi residu falsy null/undefined kekosongan value object loop dari sekumpulan list Array.
     - getOptions: Pendeteksi argument extraction fallback utilitas params pemotong objek opsi terujung list param fungsi.
     - isAllArray: Validasi bool inspektor identifikasi konsisten kepastian seluruh input args parameter merupakan JS Arrays.
     - lazyWrap: Pembungkus validasi jaring pengaman, membalut element object primitive dengan JS Array [] jika ternyata bukan format iterable Array.
     - getValueWhere: Helper referensi cari/search lookup dict pencarian objek array map berdasar kunci identitas pasangan properti JSON value kembar.
     - getValuesExcept: Extractor penyaring filter object list penghapus kecocokan target property list parameter dengan data key filter condition value dictionary.
     - getValuesByColumn: Slicing dimensi vertikal map row matrix excel array 2d yang mencabut dan merangkum list isian data satu pilar column parameter array base 1.
     - getIndexesWith: Pemetaan posisi mapping loop iterator angka baris urut scan (grouping index span) matching suatu filter list isian matrix data array.
     - slice: Pemotong blok start-end substring JS primitive array berbasis manusia 1-indexed count (end count range disertakan).
     - repeat: Fungsi replikator pengganda builder value/function exec hasil duplikasi n-kali element padding map JS Array dimension filler list panjang terulang.
     - wrap: Membungkus/membalut values native value list terluar dengan bracket [] array dimensi bertingkat spesifik parameter sedalam x dimension level tree wrap loop.
     - unique: Filter native mutlak deduplikasi values himpunan Set pembersih seluruh anggota array nilai kembar yang berulang redundan dari master arrays data elemen.
     - isTruthy: Bool cek kalkulasi verifikasi kondisi valid true/isi parameter matrix loop isian values boolean condition string.
     - isFalsy: Bool cek pembenaran seluruh himpunan array isian elemen parameter masuk memiliki properti value void / false / null representasi logic JS kekosongan bool false parameter stat.
     - isTypeOf: Pembanding native check constraint 'typeof' konsistensi boolean yang mengonfirmasi bahwa setiap var args matrix value data arrays match ke klasifikasi arg parameter type definition string.
     - sort: Pelaksana penyusunan mutate urutan sort locale alfabet string maupun minus mathematical sort data obj di sebuah native memory list parameter referential data obj.
     - join: Penyusun grammatical text generator, menyambung array ke CSV string delimiter dan koma pemisah imbuhan akhir konjungsi 'dan' pada terminal elemen array list string.
     - push: Mendorong masuk penyatuan array multi level variatif dimension input var list spread arg masuk list data elemen map pada object property host parameter mutable array master host obj target mem pointer list primitive push spread parameter target loop data host append loop array obj masuk params masuk target native params arguments.
     - flat: Meratakan pemadatan kedalaman dimensi n-kali tak hingga nested array matrix list layer dalam memory object memory menjadi JS satu susunan pipih map data loop satu lapis base datar list native matrix elemen object loop values dimensi index perataan var param array spread base native layer level layer map parameter arrays object JS JS map JS JS JS.
     - toParam: Matriks pivot rotator 2D table map baris x, y transpos perputaran baris vertikal menjadi urutan index list per-baris row-colum format column arrays index JS obj arrays arrays base JS array matrix column row JS obj arrays arrays arrays JS matrix.
     - extract: Mencabut blok urutan dimensi ke-n vertikal kolom matrix 2D map table row array-dalam berbasis 0-index tanpa header list per row cell get JS JS obj index base array map per row index col per map cell matrix JS loop JS map loop per row cell loop array.
     - containOneOf: Toleransi bool filter check ketersediaan nilai substring karakter pada string base maupun elemen exact match dalam pool parameter pencocokan argumen target list.
     - isUnique: Bool validator verifikasi Set homogen size dimensi apakah seluruh args elemen referensi masukan set parameter object parameter kumpulan adalah entitas var nilai yang sama eksak seragam 1 dimensi varian type data unik seragam eksak var.
     - sameWith: Kalkulator deep equalizer pembanding komprehensif validasi struktur key prop property dalam plain JS Object primitive maupun nilai absolut parameter target and logic and or or or parameter boolean target parameter perbandingan object property deep property array.
     - notSameWith: Inversi exact-matcher equality komparator pemblokir list parameter hitam parameter whitelist, memastikan elemen nilai lolos absen pengecekan list target param list exclusion blacklist param.
     - between: Operator constraint limit bounds limit evaluasi stat boolean validator math posisi tengah batas rentang dua value boundary limit and condition batas limit evaluator math min and max string oper limit limit string oper min string min condition.
     - lowerThan: Pemeriksa nilai bool matematis filter seleksi memastikan parameter utama bernilai lebih kecil dibawah ambang bounds rentang deret nilai daftar comparators komparasi string number array param array number param array komparasi limits number constraint comparasi list limits param array bounds min max param array limit and limit condition condition limit.
     - getMonth: Pengekstrak index angka native numerikal integer kalkulasi extract dari representasi standard bulan calendar JS object dates format angka calendar numeral JS array numeral calendar parameter Date num base dates object.
     - getShortMonth: Translator konversi locale string ID id-ID 3 character ejaan singkat string representasi akronim lokal bulan dates native JS JS locale name ejaan string locale dates lokal ID ID string lokal parameter date string locale local date locale dates string locale dates locale month ID locale string locales lokal local strings.
     - getLongMonth: Penerjemah konversi text string locale ID penamaan ejaan fullname penuh representation string local locale bahasa bulan JS Native array date name text month nama penamaan string name language ejaan fullname penamaan string language locale name.
     - toDate: Dekoder translator converter float integer number MS Excel Spreadsheet days offset konversi epoch millisecond Date Object converter date native number system timestamp object parameter format MS MS date number date converter number system number number MS number number system MS format timestamp.
     - isDate: Validator pendeteksi parser penguji struktur data type instance date format time range boundary year format pattern verifikasi tanggal boolean type logic parameter tanggal validation verifikasi validation pattern format.
     - isYear: Checker validator numeric value boolean penanggalan batas bounds threshold interval valid limit angka range format temporal batas logic constraint logic validator limit limit validator bounds temporal validation numeric limit logic pattern logic threshold number validator.
     - templateLogError: Formatter struktur builder standard logging tracer call stack print trace report exception utilitas error format auto error console auto throw handler trace message string stack Logger exception utilitas string error throw logger message stack logger message logger message throw logger.
     - iterate: Pelaksana callback abstraction function iterator range for-loop counter pengulang builder accumulator output function step pengulangan pengulang step function return step return loop loop generator iterator counter loop loop iteration accumulator function.
     - retry: Protektor decorator function re-executer callback auto back-off interval timeout handling exception throw protection API interval attempts recovery recovery catch retry execution catch recovery throw execution fallback attempt timeout handler throw attempt API attempt error handler.
     - isObject: Pemasti type verifikasi filter klasifikasi check array null data exclusion instance Object literal true object validation type detection property instance property logic object valid type logic check true validation detection validation type constraint validation type.
     - toObject: Penggabung merger builder destructuring Object assign constructor kompilator flatten array map key value rest dictionary dictionary obj object instance array object properties obj dictionary flat map constructor flatten map array merge.
     - sum: Pengakumulasi kalkulator reduce function penambah list number string precision support separator array precision addition number float reducer reducer float decimal precision decimal parser float parser accumulator reducer decimal.
     - dif: Penurun selisih operasi reduce pengurang sequence list arrays value list modulus perbandingan absolute difference difference value math absolute value sequence float list value array logic difference difference array array float difference difference difference sequence float absolute math difference logic absolute difference array.
     - toCamelCase: Regex konverter pengubah sentence text regex spasi parser mapper lowercase mapper casing mapper casing identifier regex pattern mapper parser sentence camelCase regex regex sentence parser camel case sentence regex string regex string regex identifier mapper mapper regex sentence.
     - capitalize: Pemisah string manipulator index upper character mapper text case mapper mapper string text slice mapper string mapper uppercase mapper mapper slice slice mapper mapper text upper mapper string mapper uppercase string mapper slice slice text text uppercase uppercase slice uppercase string uppercase string string uppercase text slice text.
     - includes: Matcher validasi pencarian sub-text bool index of search pattern pencocokan text array arg list text string arg list text string list string arg list pattern string pattern string search substring arg search text array search arg string search array array search array substring pattern arg pattern text string array string string string search string.
     - endWith: Validasi bool suffix penutup kata akhir substring ekor kata postfix text pencocokan array logic array array string suffix postfix arg arg arg postfix substring text postfix string substring text logic array string postfix string logic postfix array text arg array arg suffix logic text string logic text.

 */
