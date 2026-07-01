/**
 * Konvensi penulisan skrip
 * A. Penamaan Fungsi
 *  1. Kata benda (noun) untuk fungsi yang mengembalikan nilai.
 *  2. Kata kerja (verb) untuk fungsi yang melakukan algoritma tertentu tanpa mengembalikan nilai.
 * B. Pengkategorian File
 *  - Tiap file diberikan kategori kode sesuai dengan platform / framework yang digunakan, dengan ketentuan:
 *   1. DS = Drive Spreadsheet
 *   2. F = File (Google Drive)
 *   3. GAS = Google App Script
 *   4. JS = JavaScript (Vanilla)
 *  -
 *  - Fungsi-fungsi dengan tujuan manipulasi untuk tipe data tertentu dipisahkan di dalam satu file untuk satu tipe data / kategori.
 * C. Pemisahan / Penggabungan Fungsi
 *  - Fungsi dipisah saat tujuan dari suatu fungsi sudah memiliki perbedaan yang jelas.
 *  - Fungsi tetap digabung apabila tujuan fungsi masih sama, meskipun dapat diberi parameter dengan tipe yang berbeda-beda.
 * D. Parameter Fungsi
 *  - Parameter dideklarasikan tipe nya menggunakan JSDoc.
 *  - Maksimal jumlah parameter yang wajib diisi adalah 3. Lebih dari itu dibungkus menggunakan parameter 'options' berbentuk objek.
 *  - Parameter bisa memiliki nilai default berupa nilai yang sering dipakai
 * E. Penamaan Deployment
 *  - Deployment diisi dengan kegunaannya di skrip apa
 *  - Perubahan / update kode cukup ditulis di git commit saja
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
     - getColumnIndex
     - ifTrue
     - resetCache
     - reverseBoolean
     - toJSObject
     - toSpreadsheetDate
     - toast

  2. Fungsi yang Memanggil Fungsi Lain
     -> Fungsi yang di dalamnya terdapat pemanggilan ke fungsi lain di library ini.
     - add (memanggil: getColumnNum, isString, lazyWrap, notSameWith)
     - addToGlobalCache (memanggil: getGlobalCache)
     - alert (memanggil: initString, ui)
     - batchUpdate (memanggil: retry)
     - between (memanggil: compare, lazyWrap, repeat)
     - compare (memanggil: isObject)
     - containOneOf (memanggil: getOptions, isTypeOf, trim)
     - filterCriteria (memanggil: isObject, isString, me, parse, protect)
     - formatNumber (memanggil: initString)
     - formattingFunc (memanggil: batchUpdate, between, getColumnNum, getGlobalCache, initArray, initDate, initObject, initString, isDate, isString, iterate, lazyWrap, notSameWith, repeat, sameWith, toString, trim)
     - getEventDetail (memanggil: getColumnLetter)
     - getFileIdByName (memanggil: addToGlobalCache, getFolderIdFromPath, getGlobalCache, notSameWith, retry, templateLogError)
     - getFileIdsIn (memanggil: getFolderIdFromPath, initArray, initObject, retry, templateLogError)
     - getFolderIdFromPath (memanggil: addToGlobalCache, getGlobalCache, retry)
     - getGlobalCache (memanggil: parse)
     - getOptions (memanggil: isObject)
     - getRemoteEventDetail (memanggil: getEventDetail)
     - isDate (memanggil: between, test)
     - isFalsy (memanggil: getOptions)
     - isSame (memanggil: flat)
     - isTruthy (memanggil: getOptions)
     - isTypeOf (memanggil: getOptions, isString)
     - isYear (memanggil: between)
     - lazyWrap (memanggil: isIterable, wrap)
     - lowerThan (memanggil: flat, getOptions)
     - max (memanggil: flat)
     - notSameWith (memanggil: compare, flat)
     - parse (memanggil: isAllArray)
     - process (memanggil: add, editRange, flat, getColumnLetter, getOptions, initArray, initObject, initString, isAllArray, isEmpty, isObject, isSame, isString, isTypeOf, iterate, lazyWrap, max, repeat, sum, toString, trim, unique, wrap)
     - protect (memanggil: between, lazyWrap)
     - rowProcess (memanggil: containOneOf, filterCriteria, flat, initObject, sameWith)
     - sameWith (memanggil: getOptions, isObject)
     - show (memanggil: isObject, ui)
     - subtract (memanggil: flat, getOptions)
     - sum (memanggil: flat, isTypeOf, unique)
     - syncRoles (memanggil: retry)
     - templating (memanggil: isObject)
     - toA1Notation (memanggil: getColumnLetter, test)
     - toMLDate (memanggil: initDate, isDate)
     - trim (memanggil: initObject, isObject, isString)
     - ui (memanggil: initArray)
     - wrap (memanggil: iterate)

  3. Fungsi yang Dipanggil Fungsi Lain
     -> Fungsi yang digunakan/dipanggil oleh fungsi lain di library ini.
     - add (dipanggil oleh: process)
     - addToGlobalCache (dipanggil oleh: getFileIdByName, getFolderIdFromPath)
     - batchUpdate (dipanggil oleh: createRequest, formattingFunc)
     - between (dipanggil oleh: formattingFunc, isDate, isYear, protect)
     - compare (dipanggil oleh: between, notSameWith)
     - containOneOf (dipanggil oleh: rowProcess)
     - filterCriteria (dipanggil oleh: rowProcess)
     - flat (dipanggil oleh: isSame, lowerThan, max, notSameWith, process, rowProcess, subtract, sum)
     - getColumnLetter (dipanggil oleh: getEventDetail, process, toA1Notation)
     - getColumnNum (dipanggil oleh: add, formattingFunc)
     - getEventDetail (dipanggil oleh: getRemoteEventDetail)
     - getFolderIdFromPath (dipanggil oleh: getFileIdByName, getFileIdsIn)
     - getGlobalCache (dipanggil oleh: addToGlobalCache, formattingFunc, getFileIdByName, getFolderIdFromPath)
     - getOptions (dipanggil oleh: containOneOf, isFalsy, isTruthy, isTypeOf, lowerThan, process, sameWith, subtract)
     - isAllArray (dipanggil oleh: parse, process)
     - isDate (dipanggil oleh: formattingFunc, toMLDate)
     - isEmpty (dipanggil oleh: process)
     - isIterable (dipanggil oleh: lazyWrap)
     - isObject (dipanggil oleh: compare, filterCriteria, getOptions, initDate, process, sameWith, show, templating, trim)
     - isSame (dipanggil oleh: process)
     - isString (dipanggil oleh: add, filterCriteria, formattingFunc, isTypeOf, process, trim)
     - isTypeOf (dipanggil oleh: containOneOf, process, sum)
     - iterate (dipanggil oleh: formattingFunc, process, wrap)
     - lazyWrap (dipanggil oleh: add, between, formattingFunc, process, protect)
     - max (dipanggil oleh: process)
     - me (dipanggil oleh: filterCriteria)
     - notSameWith (dipanggil oleh: add, formattingFunc, getFileIdByName)
     - parse (dipanggil oleh: filterCriteria, getGlobalCache)
     - protect (dipanggil oleh: filterCriteria)
     - repeat (dipanggil oleh: between, formattingFunc, process)
     - retry (dipanggil oleh: batchUpdate, getFileIdByName, getFileIdsIn, getFolderIdFromPath, syncRoles)
     - sameWith (dipanggil oleh: formattingFunc, rowProcess)
     - sum (dipanggil oleh: process)
     - templateLogError (dipanggil oleh: getFileIdByName, getFileIdsIn)
     - test (dipanggil oleh: isDate, toA1Notation)
     - trim (dipanggil oleh: containOneOf, formattingFunc, process)
     - ui (dipanggil oleh: alert, show)
     - unique (dipanggil oleh: process, sum)
     - wrap (dipanggil oleh: lazyWrap, process)

  4. Penjelasan Fungsi
     -> Rangkuman penjelasan kegunaan dari setiap fungsi global di library ini.
     - add: (TBD)
     - addToGlobalCache: Menambahkan data state ke cache memory lokal maupun CacheService GAS.
     - alert: Modal Pop-up box confirmation dialog UI statis natif SpreadsheetApp environment dengan button response.
     - batchUpdate: Central interface eksekutor payload request array method 'Sheets.Spreadsheets.batchUpdate'.
     - between: Operator constraint limit bounds limit evaluasi stat boolean validator math posisi tengah batas rentang dua value boundary limit and condition batas limit evaluator math min and max string oper limit limit string oper min string min condition.
     - compare: (TBD)
     - containOneOf: Toleransi bool filter check ketersediaan nilai substring karakter pada string base maupun elemen exact match dalam pool parameter pencocokan argumen target list.
     - filterCriteria: (TBD)
     - flat: Meratakan pemadatan kedalaman dimensi n-kali tak hingga nested array matrix list layer dalam memory object memory menjadi JS satu susunan pipih map data loop satu lapis base datar list native matrix elemen object loop values dimensi index perataan var param array spread base native layer level layer map parameter arrays object JS JS map JS JS JS.
     - formatNumber: Formatter angka ke string dengan zero-padding di depan menggunakan padStart sejumlah digitCount parameter.
     - formattingFunc: (TBD)
     - getColumnIndex: Mengonversi kolom huruf/alfabet A1 ke zero-based index API sheets protocol.
     - getColumnLetter: Mentransformasi index angka (misal: 1, 2) menjadi alfabet sheet native (misal: A, B).
     - getColumnNum: Helper utilitas resolver validasi untuk fallback referensi letter num column mapping Request builder class.
     - getEventDetail: Membangun custom JSON interface detail referensi (user, kolom, prevValue, cell) dari OnEdit/Onchange GAS trigger lokal.
     - getFileIdByName: Resolver file ID Google Drive berdasarkan nama lengkap dan tipe MIME via Drive.Files.list dengan caching global dan auto-retry.
     - getFileIdsIn: Fetching massal array string identifier id hash metadata segala sub-file anggota dari sebuah container parent root ID folder Gdrive.
     - getFolderIdFromPath: Penelusuran hirarki URL path navigasi slash '/' Google Drive meresolve hingga menemu string Folder ID absolut dari tree GDrive API.
     - getGlobalCache: Mengambil atau menginisialisasi cache global pada runtime memory.
     - getOptions: Pendeteksi argument extraction fallback utilitas params pemotong objek opsi terujung list param fungsi.
     - getRemoteEventDetail: Adaptasi custom JSON object interface onEdit event untuk referensi antar-spreadsheet (cross-ss) remote execution.
     - ifTrue: Ternary shorthand yang mengembalikan value jika condition truthy atau string kosong jika falsy untuk conditional insertion.
     - isAllArray: Validasi bool inspektor identifikasi konsisten kepastian seluruh input args parameter merupakan JS Arrays.
     - isDate: Validator pendeteksi parser penguji struktur data type instance date format time range boundary year format pattern verifikasi tanggal boolean type logic parameter tanggal validation verifikasi validation pattern format.
     - isEmpty: Validator boolean pengecekan kekosongan plain object yang tidak memiliki key sama sekali via Object.keys length.
     - isFalsy: Bool cek pembenaran seluruh himpunan array isian elemen parameter masuk memiliki properti value void / false / null representasi logic JS kekosongan bool false parameter stat.
     - isIterable: Validator boolean pengecekan keberadaan Symbol.iterator pada value untuk membedakan iterable dari primitif dan null.
     - isObject: Pemasti type verifikasi filter klasifikasi check array null data exclusion instance Object literal true object validation type detection property instance property logic object valid type logic check true validation detection validation type constraint validation type.
     - isSame: Validator boolean pemastian seluruh elemen argumen bernilai identik menggunakan Set size === 1 setelah di-flat.
     - isString: (TBD)
     - isTruthy: Bool cek kalkulasi verifikasi kondisi valid true/isi parameter matrix loop isian values boolean condition string.
     - isTypeOf: Pembanding native check constraint 'typeof' konsistensi boolean yang mengonfirmasi bahwa setiap var args matrix value data arrays match ke klasifikasi arg parameter type definition string.
     - isYear: Checker validator numeric value boolean penanggalan batas bounds threshold interval valid limit angka range format temporal batas logic constraint logic validator limit limit validator bounds temporal validation numeric limit logic pattern logic threshold number validator.
     - iterate: Pelaksana callback abstraction function iterator range for-loop counter pengulang builder accumulator output function step pengulangan pengulang step function return step return loop loop generator iterator counter loop loop iteration accumulator function.
     - lazyWrap: Pembungkus validasi jaring pengaman, membalut element object primitive dengan JS Array [] jika ternyata bukan format iterable Array.
     - lowerThan: Pemeriksa nilai bool matematis filter seleksi memastikan parameter utama bernilai lebih kecil dibawah ambang bounds rentang deret nilai daftar comparators komparasi string number array param array number param array komparasi limits number constraint comparasi list limits param array bounds min max param array limit and limit condition condition limit.
     - max: Pencari pemindai selector Math max native array extraction function extraction nilai puncak bounds limit array array array math map array map bounds math limit limit map map map limit map extraction array extraction limit array map extraction extraction math limit bounds limit map math limit array array extraction.
     - me: Shorthand fungsi pengambilan user runtime active address yang login (Session.getActiveUser().getEmail()).
     - notSameWith: Inversi exact-matcher equality komparator pemblokir list parameter hitam parameter whitelist, memastikan elemen nilai lolos absen pengecekan list target param list exclusion blacklist param.
     - parse: Penggabung merger builder destructuring Object assign constructor kompilator flatten array map key value rest dictionary dictionary obj object instance array object properties obj dictionary flat map constructor flatten map array merge.
     - process: (TBD)
     - protect: (TBD)
     - repeat: Fungsi replikator pengganda builder value/function exec hasil duplikasi n-kali element padding map JS Array dimension filler list panjang terulang.
     - resetCache: Mereset ulang semua CacheService yang tersimpan dari eksekusi aplikasi.
     - retry: Protektor decorator function re-executer callback auto back-off interval timeout handling exception throw protection API interval attempts recovery recovery catch retry execution catch recovery throw execution fallback attempt timeout handler throw attempt API attempt error handler.
     - reverseBoolean: Inverter boolean native negasi dan string Sheets TRUE FALSE swap dengan throw error jika input string tidak valid.
     - rowProcess: (TBD)
     - sameWith: Kalkulator deep equalizer pembanding komprehensif validasi struktur key prop property dalam plain JS Object primitive maupun nilai absolut parameter target and logic and or or or parameter boolean target parameter perbandingan object property deep property array.
     - show: Pop-over render kustom form window HTML dialog overlay dan transfer objek local payload script ke frontend views.
     - subtract: Kalkulator pengurangan berantai reduce array number string dengan opsi positive Math.abs pada hasil akhir.
     - sum: Pengakumulasi kalkulator reduce function penambah list number string precision support separator array precision addition number float reducer reducer float decimal precision decimal parser float parser accumulator reducer decimal.
     - syncRoles: Skrip utility penyetaraan hak Drive.Permissions (role writer/reader share external) duplikasi antar dua instance dokumen GDrive Spreadsheet.
     - templateLogError: Formatter struktur builder standard logging tracer call stack print trace report exception utilitas error format auto error console auto throw handler trace message string stack Logger exception utilitas string error throw logger message stack logger message logger message throw logger.
     - templating: Injeksi parsial variable arguments payload ke dalam eval HTML Template string GAS UI component.
     - test: Diagnostic ping verifikasi koneksi library dari project consumer yang mencetak status Connected ke Logger.
     - toA1Notation: Converter object GridRange (index x,y) menjadi penamaan A1 Notation string readable.
     - toJSObject: (TBD)
     - toMLDate: Konverter serial number tanggal Google Sheets epoch 30 Des 1899 ke native JS Date object dengan validasi isDate.
     - toSpreadsheetDate: Mengubah JS native timestamp dates/string menjadi angka float serial Google Sheets tanggal.
     - toast: Trigger render kotak popup kecil notifikasi ringan auto-hide di sudut workspace document UI pemakai.
     - trim: Deep-trim rekursif universal yang memproses string array dan object secara rekursif menghapus whitespace di kedua ujung nilai string.
     - ui: Arrow function shorthand untuk SpreadsheetApp.getUi() akses UI environment Spreadsheet.
     - unique: Filter native mutlak deduplikasi values himpunan Set pembersih seluruh anggota array nilai kembar yang berulang redundan dari master arrays data elemen.
     - wrap: Membungkus/membalut values native value list terluar dengan bracket [] array dimensi bertingkat spesifik parameter sedalam x dimension level tree wrap loop.

   5. Penjelasan Class
     -> Rangkuman kelas-kelas utama (Data Structures / API Wrappers) beserta metodenya.

     - DSRange: Parser dekomposer Notasi A1 string ke komponen kolom baris dan konverter ke objek GridRange API Sheets tanpa network call.
       > editRange: Factory function pembuat instans DSRange parser dekomposer Notasi A1 string ke komponen kolom baris dan GridRange API.
       > column: Mengekstrak kolom dari A1N, mendukung opsi zeroBased, isLetter, dan withLastColumn untuk kolom akhir range.
       > columnCount: Menghitung jumlah kolom dalam rentang A1N menggunakan selisih kolom awal dan akhir via subtract.
       > row: Mengekstrak nomor baris dari A1N, mendukung opsi withLastRow untuk baris akhir range.
       > rowCount: Menghitung jumlah baris dalam rentang A1N menggunakan selisih baris awal dan akhir, return Infinity jika tidak terdefinisi.
       > toGrid: Mengonversi A1N menjadi objek GridRange JSON {sheetId, startColumnIndex, endColumnIndex, startRowIndex, endRowIndex} untuk Sheets API.

     - MLArray: Extended Array subclass data structure utama library dengan 1-based indexing batch-safe mutation dan chainable utility methods.
       > initArray: (TBD)
       > init: Static factory yang membuat MLArray dari array/Set/value dengan opsi auto-flat, deleteNull, dan unique.
       > map: Override map bawaan sebagai jembatan tipe IntelliSense yang mengembalikan MLArray.
       > mapCast: Map yang otomatis meng-cast sub-array menjadi MLArray sebelum dikirim ke callback.
       > mapToObject: Shorthand map + parse, mengonversi hasil mapping ke MLObject.
       > slice: Override slice dengan 1-based index; throw error jika start/end bernilai 0.
       > join: Override join dengan pemisah 'dan' di elemen terakhir untuk keterbacaan bahasa Indonesia.
       > push: Override push dengan batch-safe chunking dan opsi 'many' untuk push paralel ke multi-index.
       > filter: Override filter in-place mutation yang mengubah array asli tanpa membuat salinan baru.
       > batch: Iterator helper yang menjalankan callback per chunk sejumlah batchSize dari posisi from hingga length.
       > lazyFlat: Meratakan array hanya jika memang ada nested sub-array, menghindari flat yang tidak perlu.
       > get: Akses elemen dengan 1-based index, mendukung negatif index dan multi-index return array.
       > addAfter: Menyisipkan satu atau banyak elemen setelah posisi at (1-based) dengan batch-safe splice.
       > deleteNull: Menghapus seluruh elemen falsy dari array secara in-place via filter.
       > search: Pencarian index elemen yang cocok dengan search value/function, mengembalikan array pasangan [start, end] range.
       > getValueWhere: Mencari objek pertama dalam array yang memiliki key === val menggunakan find.
       > getValuesExcept: Memfilter array objek yang key-nya tidak sama dengan val.
       > wrapInside: Membungkus setiap elemen array dengan wrap() sedalam dimension level.
       > unique: Deduplikasi in-place menggunakan Set setelah lazyFlat dan deleteNull.
       > toParam: Transpose 2D array — mengubah baris menjadi kolom per-index.
       > extract: Mengekstrak kolom tertentu dari 2D array berdasarkan 1-based index, mendukung multi-kolom dan wrap.
       > sort: Override sort dengan dukungan Ascending/Descending dan auto-deteksi number vs string comparison.
       > parse: Konversi array ke MLObject via fromEntries (jika 2D) atau assign (jika array of objects).

     - MLObject: Object wrapper class dengan cached entries keys values iterasi fungsional chainable dan reverse lookup utility methods.
       > initObject: Factory function pembuat instans MLObject wrapper dari plain object native JS.
       > fromEntries: Static factory yang membuat MLObject dari array entries [[key, value], ...].
       > assign: Static factory yang menggabungkan array of objects menjadi satu MLObject via Object.assign iteratif.
       > reverse: Membalik seluruh pasangan {key: value} menjadi {value: key} dalam object.
       > entries: Mengembalikan cached array entries [key, value] dari object, hanya dihitung sekali.
       > reEntries: Map + fromEntries — mentransformasi entries dengan callback lalu rebuild menjadi plain object.
       > forEach: Iterasi seluruh entries dengan callback(key, value) tanpa return value.
       > map: Iterasi seluruh entries dengan callback(key, value) dan mengembalikan array hasil mapping.
       > filter: Memfilter entries berdasarkan callback(key, value) boolean dan mengembalikan MLObject baru.
       > getValue: Mengambil value berdasarkan satu atau banyak key, mendukung opsi isDeleteNull untuk membersihkan null.
       > keys: Mengembalikan cached MLArray berisi seluruh key dari object.
       > values: Mengembalikan cached MLArray berisi seluruh value dari object.
       > getKeyByValue: Reverse lookup — mencari key berdasarkan value yang diberikan, mendukung multi-value.
       > delete: Menghapus key dari object internal dan instance property, mereset cache entries/keys/values.

     - SpreadsheetManipulation: Request builder dan batch executor utama Google Sheets API dengan fluent chainable interface untuk CRUD formatting proteksi dan struktural operasi.
       > createRequest: Factory function pembuat instans SpreadsheetManipulation request builder dari spreadsheetId/title dan sheet target.
       > selectSheet: Memilih sheet target berdasarkan nama/preset (Daily/Monthly/Active/All) dan meng-cache sheetId mapping.
       > selectedSheet: Mengambil instance SpreadsheetApp.Sheet yang sedang aktif dari cache.
       > selectedItems: Mengembalikan objek detail range aktif (sheet, range, kolom, baris, value) dari seleksi user.
       > selectedItem: Mengembalikan objek detail cell aktif tunggal (sheet, range, column, row, value).
       > get: Wrapper Sheets.Spreadsheets.get dengan parameter fields dan ranges, mendukung opsi sheet filter.
       > headers: Mengambil baris header dari sheet dengan caching global, mengembalikan MLArray dengan unshift placeholder.
       > column: Resolver nama kolom ke nomor/huruf kolom berdasarkan header row, mendukung multi-kolom dan prefix.
       > max: Mengambil jumlah maksimum baris atau kolom dari grid properties sheet dengan caching.
       > timezone: Mengambil timezone spreadsheet dari properties dengan caching.
       > value: Mengambil satu nilai tunggal dari range menggunakan Sheets.Values.get, return undefined jika kosong.
       > values: Mengambil data multi-range dengan batchGet, mendukung stack Horizontal/Vertical, filter, dateFormat, withHeader, dan notFiltered.
       > duplicateSheet: Menduplikasi sheet pertama yang terseleksi ke sheet baru dengan nama baru.
       > renameSheet: Mengganti nama sheet yang terseleksi via updateSheetProperties request.
       > moveFocus: Memindahkan fokus cursor aktif ke range A1N target pada sheet aktif.
       > search: Mencari baris/kolom yang mengandung searchValues menggunakan createTextFinder pada range tertentu.
       > merge: Menambahkan request mergeCells pada range yang diproses ke seluruh sheet target.
       > color: Mengatur warna teks foreground pada range, mendukung input hex string atau objek RGB.
       > resize: Mengubah lebar pixel kolom tertentu via updateDimensionProperties request.
       > autoFill: Menambahkan request autoFill pada range untuk mengisi pola data secara otomatis.
       > replace: Replikasi Find & Replace (Ctrl+H) via findReplace request, mendukung regex, matchCase, matchEntire.
       > delete: Menghapus sheet, proteksi, baris, atau kolom berdasarkan tipe dengan opsi include/except filter.
       > copyPaste: Menyalin range dari sourceSheet ke targetSheet dengan pasteType tertentu (format/formula/normal).
       > formatDate: Mengatur format tanggal pada range via repeatCell numberFormat request ke seluruh sheetId target.
       > toggleView: Menyembunyikan atau menampilkan sheet/baris/kolom via updateSheetProperties atau updateDimensionProperties.
       > insertAfter: Menyisipkan baris atau kolom baru setelah posisi tertentu dengan opsi inherit format.
       > insertCell: Menyisipkan cell baru pada range dengan shiftDimension Column atau Row.
       > sort: Mengurutkan range data dengan helper column, mendukung multi-kolom sort dan hideProcessed filter.
       > filter: Menerapkan basic filter pada range berdasarkan kolom dan condition type tertentu.
       > protect: Mengunci range/sheet dengan proteksi, mendukung editors, description, unprotectedRange, dan auto-delete proteksi lama.
       > empty: Mengosongkan nilai pada range menggunakan batchClear via addEmptyValueRequests.
       > inputAsRaw: Mengubah valueInputOption menjadi Raw agar input tidak di-parse oleh Sheets.
       > setValue: Menulis satu nilai ke satu atau banyak range, mendukung function callback untuk dynamic values.
       > setValues: Menulis array 2D values ke range, mendukung multi-range dengan distribusi values otomatis.
       > grant: Menandai flag untuk auto-grant IMPORTRANGE permission pada saat run dieksekusi.
       > run: Mengeksekusi seluruh queued requests (clear, values update, batchUpdate) secara berurutan dan mengembalikan responses.
       > processEdit: Mengeksekusi seluruh valueRequests via Sheets.Values.batchUpdate dalam batch.
       > processRequest: Mengeksekusi seluruh structural requests via Sheets.Spreadsheets.batchUpdate dalam batch.
       > addRequests: Menambahkan satu atau banyak request object ke antrian requests setelah di-flat.
       > addValueRequests: Menambahkan satu atau banyak value update object ke antrian valueRequests.
       > addEmptyValueRequests: Menambahkan range string ke antrian emptyValueRequests untuk batchClear.
       > deleteInvalidRequest: Membersihkan request yang tidak valid (empty object atau tipe salah) dari ketiga antrian.
       > processRange: Mengonversi RawRange input (array/string/object) menjadi array A1N string lengkap dengan sheet prefix.
       > isRangesAnArray: Validator helper yang mengecek apakah input ranges berformat array multi-range.
       > toGridRange: Mengonversi sheet name + range menjadi objek GridRange menggunakan editRange().toGrid().
       > setHeaderRow: Menyimpan nomor header row untuk sheet pertama yang terseleksi ke cache.

     - Storage: Wrapper class GAS PropertiesService.Properties dengan auto JSON serialize deserialize untuk get set add remove operasi penyimpanan.
       > initStorage: Factory function untuk menginisialisasi dan mengambil instans dari class Storage (GAS PropertiesService).
       > get: Membaca satu atau banyak key dari storage, auto JSON.parse dan return sebagai MLObject.
       > set: Menyimpan satu atau banyak key-value ke storage dengan auto JSON.stringify, mendukung input object/array.
       > add: Menambahkan value ke data existing — push ke array, spread ke object, atau wrap baru jika belum ada.
       > remove: Menghapus satu atau banyak key dari storage via deleteProperty.

     - MLDate: (TBD)
       > initDate: (TBD)

     - MLString: (TBD)
       > initString: (TBD)

 */
