import * as XLSX from 'xlsx'

export interface ParsedFileData {
  headers: string[]
  data: string[][]
  fileType: 'csv' | 'xlsx'
}

// Parse XLSX file with improved handling
export function parseXLSX(file: File): Promise<ParsedFileData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })

        // Get the first worksheet
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]

        // Convert to JSON format with better handling
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
          blankrows: false,
          raw: false // Ensure strings are returned as strings
        }) as string[][]

        if (jsonData.length === 0) {
          reject(new Error('XLSX file is empty'))
          return
        }

        // Clean and process headers
        const headers = jsonData[0]
          .map(h => String(h).trim())
          .filter(h => h.length > 0)

        if (headers.length === 0) {
          reject(new Error('No valid headers found in XLSX file'))
          return
        }

        // Process data rows
        const rows = jsonData.slice(1)
          .filter(row => row.some(cell => String(cell).trim().length > 0))
          .map(row => {
            // Ensure row has same length as headers and clean values
            const cleanRow = []
            for (let i = 0; i < headers.length; i++) {
              const cellValue = row[i] !== undefined ? String(row[i]).trim() : ''
              cleanRow.push(cellValue)
            }
            return cleanRow
          })

        resolve({
          headers,
          data: rows,
          fileType: 'xlsx'
        })
      } catch (error) {
        reject(new Error(`Failed to parse XLSX file: ${error}`))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read XLSX file'))
    }

    reader.readAsArrayBuffer(file)
  })
}

// Parse CSV file with improved handling
export function parseCSVFile(file: File): Promise<ParsedFileData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const csvContent = e.target?.result as string

        // Use the improved CSV parser from field-detector
        const { headers, data } = parseCSVContent(csvContent)

        if (headers.length === 0) {
          reject(new Error('No valid headers found in CSV file'))
          return
        }

        resolve({
          headers,
          data,
          fileType: 'csv'
        })
      } catch (error) {
        reject(new Error(`Failed to parse CSV file: ${error}`))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read CSV file'))
    }

    reader.readAsText(file, 'UTF-8')
  })
}

// Improved CSV content parser that handles quoted fields properly
function parseCSVContent(csvContent: string): { headers: string[]; data: string[][] } {
  const lines = csvContent.split('\n').filter(line => line.trim())
  if (lines.length === 0) {
    throw new Error('CSV file is empty')
  }

  // Function to parse a CSV line properly handling quotes
  function parseCsvLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    let i = 0

    while (i < line.length) {
      const char = line[i]

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"'
          i += 2
        } else {
          // Toggle quote state
          inQuotes = !inQuotes
          i++
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
        result.push(current.trim())
        current = ''
        i++
      } else {
        current += char
        i++
      }
    }

    // Add the last field
    result.push(current.trim())

    return result
  }

  const headers = parseCsvLine(lines[0]).filter(h => h.length > 0)
  const data: string[][] = []

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i])
    if (row.some(cell => cell.length > 0)) {
      // Ensure row has same length as headers
      while (row.length < headers.length) {
        row.push('')
      }
      // Trim to headers length if longer
      if (row.length > headers.length) {
        row.splice(headers.length)
      }
      data.push(row)
    }
  }

  return { headers, data }
}

// Universal file parser
export function parseFile(file: File): Promise<ParsedFileData> {
  const fileName = file.name.toLowerCase()

  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    return parseXLSX(file)
  } else if (fileName.endsWith('.csv')) {
    return parseCSVFile(file)
  } else {
    return Promise.reject(new Error('Unsupported file format. Please use CSV or XLSX files.'))
  }
} 
