# Field Analyzer Documentation

## Overview
The Field Analyzer is a powerful tool that automatically detects and analyzes the structure of Excel/CSV files containing student data. It provides detailed insights about field types, data quality, and compliance with expected formats.

## Features

### 🔍 **Automatic Field Detection**
- Detects field types: text, phone, email, categorical, numeric, date
- Maps columns to expected student data fields
- Calculates confidence scores for field mappings

### 📊 **Data Quality Analysis**
- Fill rates for each field (% of non-empty data)
- Unique value counts and duplicate detection
- Sample data preview for each field
- Identifies missing required fields

### 🇮🇩 **Indonesian Phone Number Validation**
- Validates Indonesian phone number formats
- Supports formats: 08xx, +62xx, 62xx
- Detects and reports invalid phone numbers

### 📋 **Expected Field Structure**

#### Required Fields:
- **nama/name**: Student full name (should be unique)
- **hp_mahasiswa/phone**: Student phone number (Indonesian format)
- **pilihan1/choice1**: First program choice (required)

#### Optional Fields:
- **pilihan2/choice2**: Second program choice
- **pilihan3/choice3**: Third program choice  
- **prodi_lulus**: Previous graduation program

## Usage

### 1. Upload File
- Drag and drop or click to browse
- Supported formats: Excel (.xlsx, .xls), CSV (.csv)
- Maximum file size: 10MB

### 2. Analysis Process
The analyzer will:
1. Parse the file structure
2. Detect field types based on content
3. Map columns to expected fields
4. Calculate data quality metrics
5. Generate recommendations

### 3. Review Results
The analysis provides:
- **Summary**: Total records, fields, confidence score
- **Field Details**: Type, fill rate, samples, issues
- **Issues**: Missing fields, data quality problems
- **Recommendations**: Suggestions for improvement

## Output Format

```json
{
  "summary": {
    "totalRecords": 13,
    "totalFields": 6,
    "fileName": "student-data.xlsx",
    "confidence": 85
  },
  "fields": {
    "nama": {
      "type": "text",
      "required": true,
      "fillRate": "100%",
      "unique": true,
      "samples": ["John Doe", "Jane Smith"]
    },
    "hp_mahasiswa": {
      "type": "phone",
      "required": true,
      "fillRate": "100%",
      "pattern": "Indonesian"
    },
    "pilihan1": {
      "type": "categorical",
      "required": true,
      "fillRate": "100%",
      "values": ["Teknik Informatika", "Sistem Informasi"]
    }
  },
  "issues": ["Empty fields: pilihan3"],
  "recommendations": ["Validate phone format"]
}
```

## Field Type Detection

### Phone Numbers
Automatically detects Indonesian phone number patterns:
- Standard mobile: 08xx-xxxx-xxxx
- International: +62-8xx-xxxx-xxxx  
- Domestic: 62-8xx-xxxx-xxxx

### Categorical Fields
Identifies fields with limited unique values (e.g., program choices):
- Shows all possible values
- Calculates uniqueness ratio
- Useful for dropdown/selection fields

### Text Fields
General text content:
- Names, descriptions, addresses
- Checks for uniqueness (important for names)
- Validates reasonable length

## Best Practices

### File Preparation
1. Use clear, descriptive column headers
2. Ensure consistent data formats
3. Remove empty rows/columns
4. Use standard phone number formats

### Header Naming
The analyzer recognizes various header patterns:
- **Name fields**: nama, name, nama_mahasiswa, student_name
- **Phone fields**: hp, phone, hp_mahasiswa, nomor_hp
- **Choice fields**: pilihan1, choice1, prodi1, program1

### Data Quality
- Aim for >90% fill rates on required fields
- Ensure phone numbers follow Indonesian format
- Use consistent program/course names
- Check for duplicate student names

## Error Handling

### Common Issues
- **Missing required fields**: Add columns for nama, hp_mahasiswa, pilihan1
- **Invalid phone numbers**: Use format 081234567890 or +6281234567890
- **Low fill rates**: Complete missing data for required fields
- **Duplicate names**: Ensure each student has unique name

### File Format Issues
- **Large files**: Keep under 10MB limit
- **Encoding**: Use UTF-8 encoding for special characters
- **Excel versions**: Use .xlsx format for best compatibility

## Integration

The Field Analyzer can be integrated with:
- Student registration systems
- Data import pipelines
- Quality assurance workflows
- Batch processing tools

## Sample Data

A sample CSV file is provided at `/public/sample-student-data.csv` that demonstrates the expected structure and can be used for testing the analyzer.

## Support

For technical support or feature requests, please refer to the project documentation or contact the development team.
