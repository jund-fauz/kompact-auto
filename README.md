# 🤖 Kompact Auto

A comprehensive Google Apps Script (GAS) utility library providing a robust collection of reusable functions for automating Google Sheets, Drive operations, and common JavaScript patterns. Built with strict naming conventions and modular architecture for enterprise-grade automation.

**Repository:** [github.com/jund-fauz/kompact-auto](https://github.com/jund-fauz/kompact-auto)

## 📚 Overview

Kompact Auto is a meticulously organized GAS library designed to accelerate development of Google Sheets automations. It provides standardized utilities organized by data type and platform, eliminating code repetition and establishing best practices for Google Apps Script development.

### Key Principles

- **Consistent Naming** - Verb-based functions for operations, Noun-based for queries
- **Modular Organization** - Separate files per data type/category for clarity
- **Type Safety** - JSDoc annotations for all parameters and return types
- **Reusability** - 150+ battle-tested utility functions
- **Caching Strategy** - Global and local caching for performance optimization
- **Error Handling** - Comprehensive validation and retry mechanisms

## 🏗️ Architecture

### File Categories

```
DS = Drive Spreadsheet (Google Sheets operations)
F  = File (Google Drive operations)
GAS = Google App Script (Native GAS utilities)
JS = JavaScript (Vanilla JS utilities)
T  = Test (Test/Validation functions)
Z  = Type Definitions (Type utilities)
```

### Module Structure

**🗂️ Spreadsheet Operations (DS-)**
- `DS-Column.js` - Column manipulation and indexing
- `DS-Date.js` - Date formatting and parsing for Sheets
- `DS-Email.js` - Email utilities for Sheets
- `DS-Event.js` - Event handling for OnEdit/OnChange triggers
- `DS-Range.js` - Range parsing and A1 notation handling
- `DS-Request Builder.js` - Central interface for Sheets API batch operations
- `DS-UI.js` - UI components and dialogs

**📁 File Operations (F-)**
- `F-Drive.js` - Google Drive file/folder operations
- `F-Permission.js` - Drive permission and sharing management

**💾 Backend Storage (GAS-)**
- `GAS-Storage.js` - PropertiesService wrapper for persistent storage
- `Cache.js` - CacheService management

**🔧 JavaScript Utilities (JS-)**
- `JS-Array.js` - Array flattening, deduplication, manipulation
- `JS-Boolean.js` - Boolean validation and conversion
- `JS-Comparison.js` - Value comparison and equality checking
- `JS-Date.js` - Date parsing, validation, conversion
- `JS-Error.js` - Error handling utilities
- `JS-Iteration.js` - Iterator and loop utilities
- `JS-Manipulation.js` - Text and value transformation
- `JS-Object.js` - Object inspection and deep equality
- `JS-Operation.js` - Mathematical and logical operations
- `JS-String.js` - String manipulation and formatting

**🔍 Type System**
- `Z Type.js` - Type checking and validation utilities
- `index.d.ts` - TypeScript definitions

## 📖 Core Utilities (150+ Functions)

### Array Operations
- `flat()` - Flatten n-dimensional arrays
- `unique()` - Remove duplicates with precision support
- `sum()` - Accumulate with decimal precision
- `max()` - Find maximum value
- `subtract()` - Reduce array with absolute values

### String & Validation
- `toCamelCase()` - Convert to camelCase format
- `normalizeFromCamelCase()` - Convert camelCase to readable text
- `includes()` - Substring/element matching
- `containOneOf()` - Check for multiple values
- `endWith()` - Suffix validation
- `isFalsy()`, `isTruthy()` - Value checking

### Date & Time
- `formatDate()` - Format with 'yyyy-mm-dd' pattern
- `getCurrentDate()` - Get date components
- `isDate()` - Validate date format
- `isYear()` - Validate year bounds
- `toMLDate()` - Convert to Google Sheets date
- `toSpreadsheetDate()` - Convert from JS Date

### Comparison & Equality
- `sameWith()` - Deep object equality
- `isSame()` - Validate identical elements
- `lowerThan()` - Mathematical comparison
- `between()` - Range validation

### Type Checking
- `isObject()` - Object type validation
- `isTypeOf()` - Native typeof checking
- `isEmpty()` - Object emptiness check
- `isIterable()` - Iterator detection

### Drive Operations
- `getFileIdByName()` - Resolve file ID with caching
- `getFileIdsIn()` - List files in folder
- `getFolderIdFromPath()` - Navigate folder hierarchy
- `syncRoles()` - Replicate permissions
- `syncProtectionEditors()` - Sync cell protections

### Spreadsheet Operations
- `toA1Notation()` - Convert GridRange to A1 format
- `getColumnIndex()` - Convert column letter to index
- `getColumnLetter()` - Convert index to column letter
- `batchUpdate()` - Execute Sheets API batches
- `createRequest()` - Build SpreadsheetManipulation instances

### Caching & Performance
- `addToGlobalCache()` - Store state in memory
- `getGlobalCache()` - Retrieve cached data
- `resetCache()` - Clear all cached data

### Error Handling & Retry
- `retry()` - Auto back-off with retry attempts
- `templateLogError()` - Standard error logging

## 🎯 Usage Examples

### Import & Setup

```javascript
// The library is deployed as a Google Apps Script library
// Add via Script Editor → Libraries → Script ID: [library-id]

// Test connection
test(); // Prints: "Connected"
```

### Array Operations

```javascript
// Flatten nested arrays
const nested = [1, [2, [3, [4, 5]]]];
const flat = flat(nested); // [1, 2, 3, 4, 5]

// Get unique values with precision
const values = [1.1, 1.1, 2.2, 3.3];
const unique = unique(values); // [1.1, 2.2, 3.3]

// Sum with decimal support
sum([1.1, 2.2, 3.3]); // 6.6
```

### String Utilities

```javascript
// Convert to camelCase
toCamelCase("hello world example"); // "helloWorldExample"

// Normalize from camelCase
normalizeFromCamelCase("helloWorldExample"); // "Hello World Example"

// String matching
includes("hello world", "world"); // true
containOneOf("test", ["a", "b", "test"]); // true
```

### Date Operations

```javascript
// Format date
formatDate(new Date()); // "2026-06-16"

// Get date components
const date = getCurrentDate();
// { day: 2, date: 16, month: 5, year: 2026 }

// Validate date
isDate(new Date()); // true
isYear(2026, { min: 2000, max: 2050 }); // true
```

### Drive Operations

```javascript
// Get file ID with caching
const fileId = getFileIdByName("mySheet.xlsx", { mimeType: "..." });

// Navigate folder path
const folderId = getFolderIdFromPath("Shared Drive/Projects/2026");

// List files in folder
const files = getFileIdsIn(folderId);
```

### Spreadsheet Operations

```javascript
// Convert to A1 notation
toA1Notation({ col: 0, row: 0 }); // "A1"

// Get column letter
getColumnLetter(1); // "A"

// Batch update operation
batchUpdate(spreadsheetId, [request1, request2, ...]);
```

## 🔄 Function Dependency Map

The library has three levels of functions:

1. **Standalone Functions** - No dependencies on other library functions
2. **Consumer Functions** - Call other library functions
3. **Provider Functions** - Called by other library functions

This architecture ensures modularity and prevents circular dependencies.

### Example Dependency Chain
```
getFileIdByName()
  ├── calls: getFolderIdFromPath()
  ├── calls: retry()
  ├── calls: templateLogError()
  └── calls: addToGlobalCache()
```

## 📝 Naming Conventions

### Function Naming
- **Nouns** → Functions that return values
  - `getColumnIndex()`, `getCurrentDate()`, `getFileIdByName()`
  
- **Verbs** → Functions that perform operations
  - `formatDate()`, `syncRoles()`, `batchUpdate()`

### Parameter Conventions
- **Max 3 required parameters** - Additional params use `options` object
- **JSDoc annotations** - All parameters typed with `@param`
- **Default values** - Common patterns have sensible defaults

Example:
```javascript
/**
 * @param {string} value - Base value
 * @param {number} count - Repeat count
 * @param {Object} options - Optional settings
 * @param {boolean} options.reverse - Reverse output
 */
function repeat(value, count, options = {}) { ... }
```

## 🚀 Getting Started

### Installation

1. **Copy Script ID** - From the repository
2. **Add Library** - In your Google Apps Script project:
   - Click `Libraries` icon (➕)
   - Paste the Script ID
   - Set alias (e.g., `kompact`)
3. **Use Functions** - Call with library prefix: `kompact.getFileIdByName(...)`

### Basic Project Setup

```javascript
// appsscript.json
{
  "timeZone": "Asia/Jakarta",
  "exceptionLogging": "STACKDRIVER"
}

// Your script
function main() {
  const sheets = DriveApp.getFilesByName("data.xlsx");
  const fileId = kompact.getFileIdByName("data.xlsx");
  // ... use utilities
}
```

## 🔧 Configuration

### JSDoc Deployment
- Update deployment with script usage context
- Provide clear exception logging
- Set appropriate timezone

### CacheService
- Automatic cache expiration (6 hours)
- Manual reset available via `resetCache()`
- Thread-safe operations

### Retry Strategy
- Exponential back-off between attempts
- Configurable max attempts
- Automatic exception handling

## 📚 Documentation

Complete function documentation available in:
- **A-Docs.js** - Comprehensive function reference
- **index.d.ts** - TypeScript definitions
- Each module header - Usage examples and notes

### Documentation Structure

```javascript
/**
 * Function Description
 * @param {type} name - Parameter description
 * @returns {type} Return value description
 */
function functionName(name) { ... }
```

## 🤝 Contributing

Contributions welcome! Please follow:

1. **Naming conventions** - See section above
2. **Function categories** - Add to appropriate file
3. **JSDoc annotations** - All parameters and returns
4. **Keep functions focused** - Single responsibility
5. **Test thoroughly** - Use T-Connection for validation

## 📄 License

Open source under MIT License

## 🔗 Links

- **Repository:** [github.com/jund-fauz/kompact-auto](https://github.com/jund-fauz/kompact-auto)
- **Author:** [@jund-fauz](https://github.com/jund-fauz)
- **Issues:** [Report bugs](https://github.com/jund-fauz/kompact-auto/issues)

## 📞 Support

Need help?
- Check [A-Docs.js](./A-Docs.js) for detailed function reference
- Review module files for examples
- Open an issue with your use case

---

**Automate Google Sheets & Drive with confidence! 🚀✨**
