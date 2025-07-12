export interface FieldMapping {
  sourceColumn: string
  targetField: string
  confidence: number
  sampleValues: string[]
}

export interface DetectionResult {
  mappings: FieldMapping[]
  unmappedColumns: string[]
  confidence: number
  errors: string[]
  warnings: string[]
}

export interface TargetField {
  key: string
  patterns: string[]
  validator?: (value: string) => boolean
  required: boolean
}

// Target field definitions with Indonesian language patterns
export const TARGET_FIELDS: TargetField[] = [
  {
    key: 'pilihan1',
    patterns: [
      'pilihan1', 'pilihan_1', 'pilihan 1', 'prodi1', 'prodi_1', 'prodi 1',
      'program1', 'program_1', 'program 1', 'first_choice', 'choice1',
      'pil1', 'pil_1', 'jurusan1', 'jurusan_1', 'pilihan_1', 'pilihan-1'
    ],
    required: true
  },
  {
    key: 'pilihan2',
    patterns: [
      'pilihan2', 'pilihan_2', 'pilihan 2', 'prodi2', 'prodi_2', 'prodi 2',
      'program2', 'program_2', 'program 2', 'second_choice', 'choice2',
      'pil2', 'pil_2', 'jurusan2', 'jurusan_2', 'pilihan_2', 'pilihan-2'
    ],
    required: true
  },
  {
    key: 'pilihan3',
    patterns: [
      'pilihan3', 'pilihan_3', 'pilihan 3', 'prodi3', 'prodi_3', 'prodi 3',
      'program3', 'program_3', 'program 3', 'third_choice', 'choice3',
      'pil3', 'pil_3', 'jurusan3', 'jurusan_3', 'pilihan_3', 'pilihan-3'
    ],
    required: true
  },
  {
    key: 'prodi_lulus',
    patterns: [
      'prodi_lulus', 'prodi lulus', 'prodilulus', 'graduation_program',
      'lulus_prodi', 'lulus prodi', 'lulusprodi', 'program_lulus',
      'program lulus', 'programlulus', 'jurusan_lulus', 'jurusan lulus',
      'prodi-lulus', 'lulus-prodi', 'program-lulus'
    ],
    required: false
  },
  {
    key: 'nama',
    patterns: [
      'nama', 'name', 'student_name', 'nama_mahasiswa', 'nama mahasiswa',
      'namamahasiswa', 'full_name', 'fullname', 'student', 'mahasiswa',
      'nama-mahasiswa', 'student-name'
    ],
    required: true
  },
  {
    key: 'number',
    patterns: [
      'hp_mahasiswa', 'hp mahasiswa', 'hpmahasiswa', 'phone', 'telephone',
      'no_hp', 'no hp', 'nohp', 'nomor_hp', 'nomor hp', 'nomorhp',
      'phone_number', 'phonenumber', 'mobile', 'whatsapp', 'wa',
      'contact', 'kontak', 'telepon', 'hp', 'handphone', 'no_telepon',
      'no telepon', 'notelepon', 'hp-mahasiswa', 'no-hp', 'nomor-hp'
    ],
    validator: (value: string) => {
      // More flexible Indonesian phone number validation
      const cleanValue = value.replace(/[^0-9+]/g, '')

      // Check if it's a valid Indonesian phone number format
      const patterns = [
        /^(\+62|62|0)8[1-9][0-9]{6,11}$/, // Standard Indonesian mobile
        /^(\+62|62|0)[1-9][0-9]{7,11}$/, // General Indonesian number
        /^[0-9]{10,13}$/ // Simple 10-13 digit validation
      ]

      return patterns.some(pattern => pattern.test(cleanValue))
    },
    required: true
  }
]

// Normalize string for comparison
function normalizeString(str: string): string {
  return str.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

// Calculate similarity between two strings with improved logic
function calculateSimilarity(str1: string, str2: string): number {
  const norm1 = normalizeString(str1)
  const norm2 = normalizeString(str2)

  if (norm1 === norm2) return 1.0

  // Check if one contains the other (high confidence)
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    const longer = norm1.length > norm2.length ? norm1 : norm2
    const shorter = norm1.length > norm2.length ? norm2 : norm1
    return 0.9 - (longer.length - shorter.length) * 0.1
  }

  // Check for partial matches
  const words1 = norm1.split(/[^a-z0-9]+/).filter(w => w.length > 0)
  const words2 = norm2.split(/[^a-z0-9]+/).filter(w => w.length > 0)

  let matchCount = 0
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1 === word2 || word1.includes(word2) || word2.includes(word1)) {
        matchCount++
        break
      }
    }
  }

  if (matchCount > 0) {
    return Math.min(0.8, matchCount / Math.max(words1.length, words2.length))
  }

  // Levenshtein distance for fuzzy matching
  const distance = levenshteinDistance(norm1, norm2)
  const maxLength = Math.max(norm1.length, norm2.length)
  const similarity = Math.max(0, 1 - distance / maxLength)

  return similarity > 0.5 ? similarity : 0
}

// Levenshtein distance implementation
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}

// Validate field content based on patterns and validators
function validateFieldContent(values: string[], targetField: TargetField): number {
  if (!values.length) return 0

  let validCount = 0
  const sampleSize = Math.min(values.length, 10)

  for (let i = 0; i < sampleSize; i++) {
    const value = values[i]?.trim()
    if (!value) continue

    if (targetField.validator) {
      if (targetField.validator(value)) {
        validCount++
      }
    } else {
      // For non-validator fields, check if content is reasonable
      if (value.length > 0 && value.length < 200) {
        // More lenient validation for text fields
        validCount++
      }
    }
  }

  return sampleSize > 0 ? validCount / sampleSize : 0
}

// Main field detection function with improved logic
export function detectFields(headers: string[], data: string[][]): DetectionResult {
  const mappings: FieldMapping[] = []
  const unmappedColumns: string[] = []
  const errors: string[] = []
  const warnings: string[] = []

  // Track which target fields have been mapped
  const mappedTargetFields = new Set<string>()

  // For each header, find the best matching target field
  headers.forEach((header, columnIndex) => {
    let bestMatch: { field: TargetField; confidence: number } | null = null

    TARGET_FIELDS.forEach(targetField => {
      if (mappedTargetFields.has(targetField.key)) return

      // Calculate header similarity
      const headerSimilarities = targetField.patterns.map(pattern =>
        calculateSimilarity(header, pattern)
      )
      const maxHeaderSimilarity = Math.max(...headerSimilarities)

      // Lower the threshold for better detection
      if (maxHeaderSimilarity > 0.3) {
        // Get sample values for this column
        const columnValues = data.map(row => row[columnIndex] || '').filter(Boolean)
        const sampleValues = columnValues.slice(0, 5)

        // Validate content
        const contentScore = validateFieldContent(columnValues, targetField)

        // Calculate combined confidence with better weighting
        const confidence = (maxHeaderSimilarity * 0.8) + (contentScore * 0.2)

        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = { field: targetField, confidence }
        }
      }
    })

    // Lower the confidence threshold for mapping
    if (bestMatch && bestMatch.confidence > 0.4) {
      const columnValues = data.map(row => row[columnIndex] || '').filter(Boolean)
      const sampleValues = columnValues.slice(0, 5)

      mappings.push({
        sourceColumn: header,
        targetField: bestMatch.field.key,
        confidence: bestMatch.confidence,
        sampleValues
      })

      mappedTargetFields.add(bestMatch.field.key)
    } else {
      unmappedColumns.push(header)
    }
  })

  // Check for missing required fields
  TARGET_FIELDS.forEach(targetField => {
    if (targetField.required && !mappedTargetFields.has(targetField.key)) {
      errors.push(`Required field '${targetField.key}' not found in headers`)
    }
  })

  // Generate warnings for low confidence mappings
  mappings.forEach(mapping => {
    if (mapping.confidence < 0.7) {
      warnings.push(`Low confidence mapping: '${mapping.sourceColumn}' → '${mapping.targetField}' (${Math.round(mapping.confidence * 100)}%)`)
    }
  })

  // Calculate overall confidence
  const totalConfidence = mappings.length > 0
    ? mappings.reduce((sum, mapping) => sum + mapping.confidence, 0) / mappings.length
    : 0

  return {
    mappings,
    unmappedColumns,
    confidence: totalConfidence,
    errors,
    warnings
  }
}

// Improved CSV parser that handles quoted fields properly
export function parseCSV(csvContent: string): { headers: string[]; data: string[][] } {
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

  const headers = parseCsvLine(lines[0])
  const data: string[][] = []

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i])
    if (row.some(cell => cell.length > 0)) {
      // Ensure row has same length as headers
      while (row.length < headers.length) {
        row.push('')
      }
      data.push(row)
    }
  }

  return { headers, data }
}

// Transform data according to field mappings
export function transformData(
  data: string[][],
  headers: string[],
  mappings: FieldMapping[]
): Record<string, string>[] {
  const mappingMap = new Map<string, string>()
  mappings.forEach(mapping => {
    mappingMap.set(mapping.sourceColumn, mapping.targetField)
  })

  return data.map(row => {
    const transformedRow: Record<string, string> = {}

    headers.forEach((header, index) => {
      const targetField = mappingMap.get(header)
      if (targetField) {
        let value = row[index] || ''

        // Clean phone numbers
        if (targetField === 'number') {
          value = value.replace(/[^0-9+]/g, '')
          // Convert to standard format
          if (value.startsWith('0')) {
            value = '+62' + value.substring(1)
          } else if (value.startsWith('62') && !value.startsWith('+62')) {
            value = '+' + value
          } else if (!value.startsWith('+') && value.length >= 10) {
            // Assume it's Indonesian number without country code
            value = '+62' + value
          }
        }

        transformedRow[targetField] = value
      }
    })

    return transformedRow
  })
}

// Validate transformed data with improved validation
export function validateTransformedData(data: Record<string, string>[]): {
  valid: Record<string, string>[]
  invalid: { row: Record<string, string>; errors: string[] }[]
} {
  const valid: Record<string, string>[] = []
  const invalid: { row: Record<string, string>; errors: string[] }[] = []

  data.forEach(row => {
    const errors: string[] = []

    // Check required fields
    TARGET_FIELDS.forEach(targetField => {
      if (targetField.required && !row[targetField.key]?.trim()) {
        errors.push(`Missing required field: ${targetField.key}`)
      }

      // Run validators
      if (targetField.validator && row[targetField.key]) {
        if (!targetField.validator(row[targetField.key])) {
          errors.push(`Invalid format for field: ${targetField.key}`)
        }
      }
    })

    if (errors.length === 0) {
      valid.push(row)
    } else {
      invalid.push({ row, errors })
    }
  })

  return { valid, invalid }
} 
