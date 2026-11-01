// Verification Test Suite for MedVault Search Engine & Clinical Parsers
import { parseNaturalSearchQuery } from './src/lib/search/query-parser.ts'
import { expandSynonyms, normalizeMedicalTerm } from './src/lib/search/synonyms.ts'
import {
    extractClinicalDate,
    extractDeterministicMeasurements,
    detectDocumentCategory,
    extractKeywords,
    generateFactualSummary
} from './src/lib/search/extractor.ts'

console.log('--- RUNNING MEDVAULT SEARCH & PARSER TEST SUITE ---\n')

let passed = 0
let failed = 0

function assert(condition, message) {
    if (condition) {
        console.log(`[PASS] ${message}`)
        passed++
    } else {
        console.error(`[FAIL] ${message}`)
        failed++
    }
}

// 1. Test Query 1: "Find my latest hemoglobin report."
const q1 = parseNaturalSearchQuery('Find my latest hemoglobin report.')
assert(q1.sortOrder === 'newest', 'Q1: Detected latest/newest sort order')
assert(q1.allExpandedTerms.includes('hemoglobin'), 'Q1: Includes hemoglobin')
assert(q1.allExpandedTerms.includes('hb'), 'Q1: Expanded synonym to hb')
assert(q1.isOpenIntent === false, 'Q1: Not an open action')

// 2. Test Query 2: "Show all blood test reports."
const q2 = parseNaturalSearchQuery('Show all blood test reports.')
assert(q2.category === 'Blood Test', 'Q2: Detected category Blood Test')

// 3. Test Query 3: "Find documents containing blood pressure or BP readings."
const q3 = parseNaturalSearchQuery('Find documents containing blood pressure or BP readings.')
assert(q3.allExpandedTerms.includes('blood pressure'), 'Q3: Includes blood pressure')
assert(q3.allExpandedTerms.includes('bp'), 'Q3: Includes bp synonym')

// 4. Test Query 4: "Get my CBC reports from the last six months."
const q4 = parseNaturalSearchQuery('Get my CBC reports from the last six months.')
assert(q4.startDate !== undefined, 'Q4: Calculated 6-month timeframe start date')
assert(q4.allExpandedTerms.includes('cbc'), 'Q4: Contains CBC')
assert(q4.allExpandedTerms.includes('complete blood count'), 'Q4: Expanded CBC to complete blood count')

// 5. Test Query 5: "Show reports that mention glucose, cholesterol, or creatinine."
const q5 = parseNaturalSearchQuery('Show reports that mention glucose, cholesterol, or creatinine.')
assert(q5.allExpandedTerms.includes('glucose'), 'Q5: Contains glucose')
assert(q5.allExpandedTerms.includes('blood sugar'), 'Q5: Expanded glucose to blood sugar')
assert(q5.allExpandedTerms.includes('cholesterol'), 'Q5: Contains cholesterol')
assert(q5.allExpandedTerms.includes('creatinine'), 'Q5: Contains creatinine')

// 6. Test Query 6: "Open the newest hemoglobin report."
const q6 = parseNaturalSearchQuery('Open the newest hemoglobin report.')
assert(q6.isOpenIntent === true, 'Q6: Detected open intent')
assert(q6.sortOrder === 'newest', 'Q6: Detected newest sort order')
assert(q6.allExpandedTerms.includes('hemoglobin'), 'Q6: Contains hemoglobin')

// 7. Clinical Date Extraction
const textWithDate = `
METROPOLIS CLINICAL LABORATORY
Patient: John Doe
Date: 14/03/2025
Sample Collected: 14/03/2025 08:30 AM
Report Date: 14/03/2025 02:00 PM
`
const parsedDate = extractClinicalDate(textWithDate)
assert(parsedDate === '2025-03-14', `Clinical date extracted correctly: ${parsedDate}`)

// 8. Structured Measurement Extraction
const cbcReportText = `
COMPLETE BLOOD COUNT (CBC)
HEMOGLOBIN: 14.2 g/dL (Reference Range: 13.0 - 17.0)
TOTAL LEUKOCYTE COUNT (WBC): 7200 /cumm (Reference: 4000 - 11000)
PLATELET COUNT: 250000 /cumm (Reference: 150000 - 450000)
FASTING BLOOD SUGAR: 92 mg/dL
SERUM CREATININE: 0.9 mg/dL
BLOOD PRESSURE: 120/80 mmHg
`
const measurements = extractDeterministicMeasurements(cbcReportText, '2025-03-14')
assert(measurements.length >= 5, `Extracted ${measurements.length} measurements`)

const hb = measurements.find(m => m.normalizedTestName === 'hemoglobin')
assert(hb !== undefined && hb.valueNumeric === 14.2 && hb.unit === 'g/dL', `Hemoglobin extracted accurately: ${hb?.valueNumeric} ${hb?.unit}`)

const bp = measurements.find(m => m.normalizedTestName === 'blood_pressure')
assert(bp !== undefined && bp.valueText === '120/80' && bp.unit === 'mmHg', `Blood pressure extracted: ${bp?.valueText} ${bp?.unit}`)

const fbs = measurements.find(m => m.normalizedTestName === 'glucose')
assert(fbs !== undefined && fbs.valueNumeric === 92, `Glucose extracted: ${fbs?.valueNumeric} ${fbs?.unit}`)

const creat = measurements.find(m => m.normalizedTestName === 'creatinine')
assert(creat !== undefined && creat.valueNumeric === 0.9, `Creatinine extracted: ${creat?.valueNumeric} ${creat?.unit}`)

// 9. Document Category Detection & Summary Generation
const category = detectDocumentCategory(cbcReportText, 'Routine Health Check')
assert(category === 'Blood Test', `Detected category: ${category}`)

const summary = generateFactualSummary(category, measurements, '2025-03-14', 'Routine Health Check')
assert(summary.includes('Blood Test') && summary.includes('Hemoglobin: 14.2 g/dL'), `Factual summary generated without hallucination: ${summary}`)

console.log(`\nTEST RESULTS: ${passed} Passed, ${failed} Failed`)
if (failed > 0) process.exit(1)
