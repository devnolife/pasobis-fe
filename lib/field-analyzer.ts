export interface FieldAnalysis {
  type: 'text' | 'phone' | 'categorical' | 'numeric' | 'email' | 'date'
  required: boolean
  fillRate: string
  unique?: boolean
  samples: string[]
  pattern?: string
  values?: string[]
  issues?: string[]
  totalRecords: number
  emptyCount: number
  uniqueCount?: number
}

export interface FileAnalysisResult {
  summary: {
    totalRecords: number
    totalFields: number
    fileName: string
    fileSize?: string
    uploadDate?: string
  }
  fields: Record<string, FieldAnalysis>
  issues: string[]
  recommendations: string[]
  metadata: {
    processingTime: number
    confidence: number
    detectedEncoding?: string
  }
}

export interface ExpectedField {
  key: string
  patterns: string[]
  type: FieldAnalysis['type']
  required: boolean
  description: string
}

// Enhanced field definitions with better patterns and types
export const EXPECTED_FIELDS: ExpectedField[] = [
  {
    key: 'nama',
    patterns: [
      'nama', 'name', 'student_name', 'nama_mahasiswa', 'nama mahasiswa',
      'namamahasiswa', 'full_name', 'fullname', 'student', 'mahasiswa',
      'nama-mahasiswa', 'student-name', 'namalengkap', 'nama_lengkap'
    ],
    type: 'text',
    required: true,
    description: 'Student full name (required, should be unique)'
  },
  {
    key: 'hp_mahasiswa',
    patterns: [
      'hp_mahasiswa', 'hp mahasiswa', 'hpmahasiswa', 'phone', 'telephone',
      'no_hp', 'no hp', 'nohp', 'nomor_hp', 'nomor hp', 'nomorhp',
      'phone_number', 'phonenumber', 'mobile', 'whatsapp', 'wa',
      'contact', 'kontak', 'telepon', 'hp', 'handphone', 'no_telepon',
      'no telepon', 'notelepon', 'hp-mahasiswa', 'no-hp', 'nomor-hp'
    ],
    type: 'phone',
    required: true,
    description: 'Student phone number (Indonesian format preferred)'
  },
  {
    key: 'pilihan1',
    patterns: [
      'pilihan1', 'pilihan_1', 'pilihan 1', 'prodi1', 'prodi_1', 'prodi 1',
      'program1', 'program_1', 'program 1', 'first_choice', 'choice1',
      'pil1', 'pil_1', 'jurusan1', 'jurusan_1', 'pilihan_1', 'pilihan-1',
      'first', 'pertama', 'utama'
    ],
    type: 'categorical',
    required: true,
    description: 'First program choice (required)'
  },
  {
    key: 'pilihan2',
    patterns: [
      'pilihan2', 'pilihan_2', 'pilihan 2', 'prodi2', 'prodi_2', 'prodi 2',
      'program2', 'program_2', 'program 2', 'second_choice', 'choice2',
      'pil2', 'pil_2', 'jurusan2', 'jurusan_2', 'pilihan_2', 'pilihan-2',
      'second', 'kedua', 'cadangan'
    ],
    type: 'categorical',
    required: false,
    description: 'Second program choice (optional)'
  },
  {
    key: 'pilihan3',
    patterns: [
      'pilihan3', 'pilihan_3', 'pilihan 3', 'prodi3', 'prodi_3', 'prodi 3',
      'program3', 'program_3', 'program 3', 'third_choice', 'choice3',
      'pil3', 'pil_3', 'jurusan3', 'jurusan_3', 'pilihan_3', 'pilihan-3',
      'third', 'ketiga', 'alternatif'
    ],
    type: 'categorical',
    required: false,
    description: 'Third program choice (optional)'
  },
  {
    key: 'prodi_lulus',
    patterns: [
      'prodi_lulus', 'prodi lulus', 'prodilulus', 'graduation_program',
      'lulus_prodi', 'lulus prodi', 'lulusprodi', 'program_lulus',
      'program lulus', 'programlulus', 'jurusan_lulus', 'jurusan lulus',
      'prodi-lulus', 'lulus-prodi', 'program-lulus', 'previous_major',
      'major', 'asal_prodi', 'prodi_asal', 'background'
    ],
    type: 'categorical',
    required: false,
    description: 'Previous graduation program (optional)'
  }
]

// Enhanced pattern matching with fuzzy logic
function calculateFieldSimilarity(header: string, patterns: string[]): number {
  const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '')

  let maxSimilarity = 0

  for (const pattern of patterns) {
    const normalizedPattern = pattern.toLowerCase().replace(/[^a-z0-9]/g, '')

    // Exact match
    if (normalizedHeader === normalizedPattern) {
      return 1.0
    }

    // Contains match
    if (normalizedHeader.includes(normalizedPattern) || normalizedPattern.includes(normalizedHeader)) {
      const similarity = Math.min(normalizedPattern.length, normalizedHeader.length) /
        Math.max(normalizedPattern.length, normalizedHeader.length)
      maxSimilarity = Math.max(maxSimilarity, similarity * 0.9)
    }

    // Levenshtein distance for fuzzy matching
    const distance = levenshteinDistance(normalizedHeader, normalizedPattern)
    const maxLen = Math.max(normalizedHeader.length, normalizedPattern.length)
    const similarity = Math.max(0, 1 - distance / maxLen)

    if (similarity > 0.7) {
      maxSimilarity = Math.max(maxSimilarity, similarity * 0.8)
    }
  }

  return maxSimilarity
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      )
    }
  }

  return matrix[str2.length][str1.length]
}

// Analyze field type based on content
function analyzeFieldType(values: string[]): {
  type: FieldAnalysis['type']
  pattern?: string
  confidence: number
} {
  const nonEmptyValues = values.filter(v => v && v.trim().length > 0)
  if (nonEmptyValues.length === 0) {
    return { type: 'text', confidence: 0 }
  }

  let phoneCount = 0
  let emailCount = 0
  let numericCount = 0
  let dateCount = 0

  for (const value of nonEmptyValues.slice(0, 20)) { // Sample first 20 values
    const cleanValue = value.trim()

    // Phone number patterns (Indonesian)
    if (isIndonesianPhone(cleanValue)) {
      phoneCount++
    }

    // Email pattern
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanValue)) {
      emailCount++
    }

    // Numeric pattern
    if (/^\d+(\.\d+)?$/.test(cleanValue)) {
      numericCount++
    }

    // Date patterns
    if (isDateString(cleanValue)) {
      dateCount++
    }
  }

  const total = nonEmptyValues.length
  const phoneRate = phoneCount / total
  const emailRate = emailCount / total
  const numericRate = numericCount / total
  const dateRate = dateCount / total

  // Determine type based on highest confidence
  if (phoneRate > 0.7) {
    return {
      type: 'phone',
      pattern: 'Indonesian',
      confidence: phoneRate
    }
  }

  if (emailRate > 0.7) {
    return {
      type: 'email',
      confidence: emailRate
    }
  }

  if (numericRate > 0.8) {
    return {
      type: 'numeric',
      confidence: numericRate
    }
  }

  if (dateRate > 0.7) {
    return {
      type: 'date',
      confidence: dateRate
    }
  }

  // Check if it's categorical (limited unique values)
  const uniqueValues = [...new Set(nonEmptyValues.map(v => v.toLowerCase().trim()))]
  const uniqueRatio = uniqueValues.length / nonEmptyValues.length

  if (uniqueRatio < 0.5 && uniqueValues.length <= 20) {
    return {
      type: 'categorical',
      confidence: 1 - uniqueRatio
    }
  }

  return { type: 'text', confidence: 0.8 }
}

function isIndonesianPhone(value: string): boolean {
  const cleanValue = value.replace(/[^0-9+]/g, '')

  const patterns = [
    /^(\+62|62|0)8[1-9][0-9]{6,11}$/, // Standard Indonesian mobile
    /^(\+62|62|0)[1-9][0-9]{7,11}$/,  // General Indonesian number
    /^[0-9]{10,13}$/                   // Simple 10-13 digit validation
  ]

  return patterns.some(pattern => pattern.test(cleanValue))
}

function isDateString(value: string): boolean {
  const datePatterns = [
    /^\d{1,2}\/\d{1,2}\/\d{4}$/,       // MM/DD/YYYY or DD/MM/YYYY
    /^\d{1,2}-\d{1,2}-\d{4}$/,        // MM-DD-YYYY or DD-MM-YYYY
    /^\d{4}-\d{1,2}-\d{1,2}$/,        // YYYY-MM-DD
    /^\d{1,2}\s+\w+\s+\d{4}$/         // DD Month YYYY
  ]

  return datePatterns.some(pattern => pattern.test(value.trim())) || !isNaN(Date.parse(value))
}

// Calculate field statistics
function calculateFieldStats(values: string[], totalRecords: number): {
  fillRate: string
  emptyCount: number
  uniqueCount: number
  unique: boolean
  samples: string[]
} {
  const nonEmptyValues = values.filter(v => v && v.trim().length > 0)
  const emptyCount = totalRecords - nonEmptyValues.length
  const fillRate = totalRecords > 0 ?
    Math.round((nonEmptyValues.length / totalRecords) * 100) + '%' : '0%'

  const uniqueValues = [...new Set(nonEmptyValues.map(v => v.trim()))]
  const uniqueCount = uniqueValues.length
  const unique = uniqueCount === nonEmptyValues.length && nonEmptyValues.length > 0

  // Get diverse samples
  const samples = uniqueValues.slice(0, 5)

  return {
    fillRate,
    emptyCount,
    uniqueCount,
    unique,
    samples
  }
}

// Main analysis function
export function analyzeFileStructure(
  headers: string[],
  data: string[][],
  fileName: string,
  fileSize?: number
): FileAnalysisResult {
  const startTime = Date.now()
  const totalRecords = data.length

  const fields: Record<string, FieldAnalysis> = {}
  const issues: string[] = []
  const recommendations: string[] = []
  const mappedFields = new Set<string>()

  // Analyze each column
  headers.forEach((header, columnIndex) => {
    const columnValues = data.map(row => row[columnIndex] || '')

    // Find best matching expected field
    let bestMatch: { field: ExpectedField; similarity: number } | null = null

    for (const expectedField of EXPECTED_FIELDS) {
      if (mappedFields.has(expectedField.key)) continue

      const similarity = calculateFieldSimilarity(header, expectedField.patterns)

      if (similarity > 0.5 && (!bestMatch || similarity > bestMatch.similarity)) {
        bestMatch = { field: expectedField, similarity }
      }
    }

    // Analyze field content
    const typeAnalysis = analyzeFieldType(columnValues)
    const stats = calculateFieldStats(columnValues, totalRecords)

    let fieldKey = header
    let fieldType = typeAnalysis.type
    let required = false

    if (bestMatch && bestMatch.similarity > 0.7) {
      fieldKey = bestMatch.field.key
      fieldType = bestMatch.field.type
      required = bestMatch.field.required
      mappedFields.add(bestMatch.field.key)
    }

    // Build field analysis
    const fieldAnalysis: FieldAnalysis = {
      type: fieldType,
      required,
      fillRate: stats.fillRate,
      unique: stats.unique,
      samples: stats.samples,
      totalRecords,
      emptyCount: stats.emptyCount,
      uniqueCount: stats.uniqueCount
    }

    // Add type-specific properties
    if (fieldType === 'phone' && typeAnalysis.pattern) {
      fieldAnalysis.pattern = typeAnalysis.pattern
    }

    if (fieldType === 'categorical' && stats.uniqueCount <= 20) {
      const uniqueValues = [...new Set(columnValues.filter(v => v && v.trim().length > 0))]
      fieldAnalysis.values = uniqueValues.slice(0, 10) // Limit to 10 values
    }

    // Field-specific issues and recommendations
    const fieldIssues: string[] = []

    if (required && stats.emptyCount > 0) {
      fieldIssues.push(`${stats.emptyCount} missing values in required field`)
    }

    if (fieldType === 'phone') {
      const validPhones = columnValues.filter(v => v && isIndonesianPhone(v)).length
      const invalidPhones = totalRecords - stats.emptyCount - validPhones
      if (invalidPhones > 0) {
        fieldIssues.push(`${invalidPhones} invalid phone number formats`)
      }
    }

    if (fieldIssues.length > 0) {
      fieldAnalysis.issues = fieldIssues
    }

    fields[fieldKey] = fieldAnalysis
  })

  // Generate overall issues and recommendations
  const requiredFields = EXPECTED_FIELDS.filter(f => f.required)
  const foundRequiredFields = requiredFields.filter(f => mappedFields.has(f.key))

  if (foundRequiredFields.length < requiredFields.length) {
    const missingFields = requiredFields.filter(f => !mappedFields.has(f.key))
    issues.push(`Missing required fields: ${missingFields.map(f => f.key).join(', ')}`)
  }

  // Check for empty fields
  const emptyFields = Object.entries(fields)
    .filter(([_, analysis]) => analysis.fillRate === '0%')
    .map(([key, _]) => key)

  if (emptyFields.length > 0) {
    issues.push(`Empty fields: ${emptyFields.join(', ')}`)
  }

  // Generate recommendations
  Object.entries(fields).forEach(([fieldKey, analysis]) => {
    if (analysis.type === 'phone' && analysis.issues?.some(i => i.includes('invalid'))) {
      recommendations.push(`Validate phone format for field: ${fieldKey}`)
    }

    if (fieldKey === 'pilihan2' && analysis.fillRate !== '100%') {
      const fillPercentage = parseInt(analysis.fillRate.replace('%', ''))
      if (fillPercentage > 50) {
        recommendations.push(`Consider making pilihan2 required (${analysis.fillRate} filled)`)
      }
    }

    if (analysis.type === 'text' && !analysis.unique && analysis.required) {
      recommendations.push(`Check for duplicate values in ${fieldKey}`)
    }
  })

  const processingTime = Date.now() - startTime

  // Calculate overall confidence
  const mappingConfidence = mappedFields.size / Math.max(EXPECTED_FIELDS.filter(f => f.required).length, 1)
  const qualityScore = Object.values(fields).reduce((sum, field) => {
    const fillScore = parseInt(field.fillRate.replace('%', '')) / 100
    return sum + fillScore
  }, 0) / Object.keys(fields).length

  const confidence = (mappingConfidence * 0.6 + qualityScore * 0.4) * 100

  return {
    summary: {
      totalRecords,
      totalFields: headers.length,
      fileName,
      fileSize: fileSize ? formatFileSize(fileSize) : undefined,
      uploadDate: new Date().toISOString()
    },
    fields,
    issues,
    recommendations,
    metadata: {
      processingTime,
      confidence: Math.round(confidence),
      detectedEncoding: 'UTF-8'
    }
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Utility function to validate analysis result
export function validateAnalysisResult(result: FileAnalysisResult): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Check required fields
  const requiredFieldKeys = EXPECTED_FIELDS.filter(f => f.required).map(f => f.key)
  const foundRequiredFields = requiredFieldKeys.filter(key => key in result.fields)

  if (foundRequiredFields.length === 0) {
    errors.push('No required fields detected in the file')
  }

  // Check data quality
  const totalRecords = result.summary.totalRecords
  if (totalRecords === 0) {
    errors.push('No data records found in the file')
  }

  // Check for low confidence
  if (result.metadata.confidence < 50) {
    warnings.push(`Low confidence analysis (${result.metadata.confidence}%)`)
  }

  // Check fill rates for required fields
  Object.entries(result.fields).forEach(([key, analysis]) => {
    if (analysis.required) {
      const fillPercentage = parseInt(analysis.fillRate.replace('%', ''))
      if (fillPercentage < 80) {
        warnings.push(`Required field ${key} has low fill rate (${analysis.fillRate})`)
      }
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}
