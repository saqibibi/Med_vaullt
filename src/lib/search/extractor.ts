import { GoogleGenAI } from '@google/genai'
import { normalizeMedicalTerm, expandSynonyms, MEDICAL_SYNONYM_GROUPS } from './synonyms'

export interface ExtractedMeasurement {
    testName: string
    normalizedTestName: string
    valueNumeric: number | null
    valueText: string
    unit: string | null
    referenceRange: string | null
    testDate: string | null // ISO YYYY-MM-DD
    pageNumber: number
    sourceExcerpt: string
    confidence: number
}

export interface ExtractedDocumentData {
    extractedText: string
    summary: string
    category: string
    keywords: string[]
    reportDate: string | null // ISO YYYY-MM-DD
    confidence: number
    measurements: ExtractedMeasurement[]
}

// 1. Text extraction from PDF
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
    try {
        // Dynamic import to avoid bundling issues in edge runtimes
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdf = require('pdf-parse')
        const data = await pdf(buffer)
        return data.text || ''
    } catch (err) {
        console.warn('PDF text extraction error:', err)
        return ''
    }
}

// 2. OCR extraction from Image
export async function extractTextFromImage(buffer: Buffer): Promise<string> {
    try {
        const { createWorker } = await import('tesseract.js')
        const worker = await createWorker('eng')
        const ret = await worker.recognize(buffer)
        await worker.terminate()
        return ret.data.text || ''
    } catch (err) {
        console.warn('Image OCR error:', err)
        return ''
    }
}

// 3. Clinical Date Extraction from text
export function extractClinicalDate(text: string): string | null {
    if (!text) return null

    // Look for dates following keywords like Date, Sample Date, Collected, Reported, Examined
    const contextPatterns = [
        /(?:date|collected|reported|specimen|tested|examined|sample\s+date|report\s+date|collection\s+date)[:\s-]*([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4})/i,
        /(?:date|collected|reported|specimen|tested|examined|sample\s+date|report\s+date|collection\s+date)[:\s-]*([0-9]{4}[/-][0-9]{1,2}[/-][0-9]{1,2})/i,
        /(?:date|collected|reported|specimen|tested|examined|sample\s+date|report\s+date|collection\s+date)[:\s-]*([0-9]{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+[0-9]{4})/i,
        /(?:date|collected|reported|specimen|tested|examined|sample\s+date|report\s+date|collection\s+date)[:\s-]*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+[0-9]{1,2}[\s,]+[0-9]{4})/i
    ]

    for (const pattern of contextPatterns) {
        const match = text.match(pattern)
        if (match && match[1]) {
            const parsed = parseDateString(match[1])
            if (parsed) return parsed
        }
    }

    // General date pattern fallback
    const generalDatePattern = /\b([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{4})\b/
    const generalMatch = text.match(generalDatePattern)
    if (generalMatch && generalMatch[1]) {
        const parsed = parseDateString(generalMatch[1])
        if (parsed) return parsed
    }

    return null
}

function parseDateString(raw: string): string | null {
    try {
        const clean = raw.trim()
        const d = new Date(clean)
        if (!isNaN(d.getTime()) && d.getFullYear() >= 1990 && d.getFullYear() <= new Date().getFullYear() + 1) {
            return d.toISOString().split('T')[0]
        }

        // Try manual parsing for DD/MM/YYYY or MM/DD/YYYY
        const parts = clean.split(/[/-]/)
        if (parts.length === 3) {
            let day = parseInt(parts[0], 10)
            let month = parseInt(parts[1], 10)
            let year = parseInt(parts[2], 10)

            if (parts[0].length === 4) {
                // YYYY-MM-DD
                year = parseInt(parts[0], 10)
                month = parseInt(parts[1], 10)
                day = parseInt(parts[2], 10)
            } else if (year < 100) {
                year = 2000 + year
            }

            // Basic validation
            if (month > 12 && day <= 12) {
                // swap month and day
                const tmp = month
                month = day
                day = tmp
            }

            if (year >= 1990 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                const pad = (n: number) => n.toString().padStart(2, '0')
                return `${year}-${pad(month)}-${pad(day)}`
            }
        }
    } catch {
        return null
    }
    return null
}

// 4. Deterministic Medical Measurement Extraction
interface MeasurementSpec {
    name: string
    normalized: string
    patterns: RegExp[]
    defaultUnit: string
}

const MEASUREMENT_SPECS: MeasurementSpec[] = [
    {
        name: 'Hemoglobin',
        normalized: 'hemoglobin',
        patterns: [
            /(?:hemoglobin|haemoglobin|hb|hgb)[^0-9\n\r]{0,30}?([0-9]{1,2}(?:\.[0-9]{1,2})?)\s*(g\/dL|g\/l|gm\/dl|gm%|\b)/i
        ],
        defaultUnit: 'g/dL'
    },
    {
        name: 'Blood Pressure',
        normalized: 'blood_pressure',
        patterns: [
            /(?:blood\s*pressure|b\.?p\.?)[^0-9\n\r]{0,25}?([0-9]{2,3}\s*\/\s*[0-9]{2,3})\s*(mmHg|\b)/i,
            /\b([0-9]{2,3}\s*\/\s*[0-9]{2,3})\s*mmHg\b/i
        ],
        defaultUnit: 'mmHg'
    },
    {
        name: 'Fasting Blood Glucose',
        normalized: 'glucose',
        patterns: [
            /(?:fasting\s*blood\s*sugar|fbs|fasting\s*glucose|fasting\s*plasma\s*glucose)[^0-9\n\r]{0,25}?([0-9]{2,3}(?:\.[0-9]{1,2})?)\s*(mg\/dL|mmol\/L|\b)/i,
            /(?:glucose|blood\s*sugar|rbs|ppbs)[^0-9\n\r]{0,25}?([0-9]{2,3}(?:\.[0-9]{1,2})?)\s*(mg\/dL|mmol\/L|\b)/i
        ],
        defaultUnit: 'mg/dL'
    },
    {
        name: 'HbA1c',
        normalized: 'hba1c',
        patterns: [
            /(?:hba1c|glycated\s*hemoglobin|glycosylated\s*hb)[^0-9\n\r]{0,25}?([0-9]{1,2}(?:\.[0-9]{1,2})?)\s*(%|\b)/i
        ],
        defaultUnit: '%'
    },
    {
        name: 'Total Platelet Count',
        normalized: 'platelets',
        patterns: [
            /(?:platelet\s*count|platelets|plt|thrombocytes)[^0-9\n\r]{0,30}?([0-9]{1,7}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)\s*(\/cumm|10\^3\/uL|10\^9\/L|lakhs?\/cumm|k\/uL|\b)/i
        ],
        defaultUnit: '/cumm'
    },
    {
        name: 'Total Leukocyte Count (WBC)',
        normalized: 'white_blood_cells',
        patterns: [
            /(?:total\s*leukocyte\s*count|wbc\s*count|wbc|tlc|total\s*wbc)[^0-9\n\r]{0,30}?([0-9]{1,6}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)\s*(\/cumm|10\^3\/uL|\/mcL|\b)/i
        ],
        defaultUnit: '/cumm'
    },
    {
        name: 'Total RBC Count',
        normalized: 'red_blood_cells',
        patterns: [
            /(?:total\s*rbc\s*count|rbc\s*count|rbc|erythrocytes)[^0-9\n\r]{0,30}?([0-9]{1,2}(?:\.[0-9]{1,2})?)\s*(mil\/uL|million\/cumm|10\^6\/uL|\b)/i
        ],
        defaultUnit: 'mil/uL'
    },
    {
        name: 'Total Cholesterol',
        normalized: 'cholesterol',
        patterns: [
            /(?:total\s*cholesterol|serum\s*cholesterol|cholesterol)[^0-9\n\r]{0,25}?([0-9]{2,3}(?:\.[0-9]{1,2})?)\s*(mg\/dL|mmol\/L|\b)/i
        ],
        defaultUnit: 'mg/dL'
    },
    {
        name: 'HDL Cholesterol',
        normalized: 'hdl_cholesterol',
        patterns: [
            /(?:hdl\s*cholesterol|hdl)[^0-9\n\r]{0,25}?([0-9]{2,3}(?:\.[0-9]{1,2})?)\s*(mg\/dL|mmol\/L|\b)/i
        ],
        defaultUnit: 'mg/dL'
    },
    {
        name: 'LDL Cholesterol',
        normalized: 'ldl_cholesterol',
        patterns: [
            /(?:ldl\s*cholesterol|ldl)[^0-9\n\r]{0,25}?([0-9]{2,3}(?:\.[0-9]{1,2})?)\s*(mg\/dL|mmol\/L|\b)/i
        ],
        defaultUnit: 'mg/dL'
    },
    {
        name: 'Triglycerides',
        normalized: 'triglycerides',
        patterns: [
            /(?:triglycerides|serum\s*triglycerides)[^0-9\n\r]{0,25}?([0-9]{2,3}(?:\.[0-9]{1,2})?)\s*(mg\/dL|mmol\/L|\b)/i
        ],
        defaultUnit: 'mg/dL'
    },
    {
        name: 'Serum Creatinine',
        normalized: 'creatinine',
        patterns: [
            /(?:serum\s*creatinine|creatinine)[^0-9\n\r]{0,25}?([0-9]{1,2}(?:\.[0-9]{1,2})?)\s*(mg\/dL|umol\/L|\b)/i
        ],
        defaultUnit: 'mg/dL'
    },
    {
        name: 'Blood Urea',
        normalized: 'urea',
        patterns: [
            /(?:blood\s*urea|serum\s*urea|bun)[^0-9\n\r]{0,25}?([0-9]{1,3}(?:\.[0-9]{1,2})?)\s*(mg\/dL|mmol\/L|\b)/i
        ],
        defaultUnit: 'mg/dL'
    },
    {
        name: 'TSH (Thyroid Stimulating Hormone)',
        normalized: 'tsh',
        patterns: [
            /(?:tsh|thyroid\s*stimulating\s*hormone)[^0-9\n\r]{0,25}?([0-9]{1,3}(?:\.[0-9]{1,2})?)\s*(uIU\/mL|mIU\/L|\b)/i
        ],
        defaultUnit: 'uIU/mL'
    }
]

export function extractDeterministicMeasurements(
    text: string,
    testDate: string | null
): ExtractedMeasurement[] {
    const measurements: ExtractedMeasurement[] = []
    if (!text) return measurements

    const seenTests = new Set<string>()

    for (const spec of MEASUREMENT_SPECS) {
        for (const pattern of spec.patterns) {
            const match = text.match(pattern)
            if (match && match[1]) {
                const rawVal = match[1].replace(/,/g, '').trim()
                const unit = (match[2] && match[2].trim()) ? match[2].trim() : spec.defaultUnit
                const isNumeric = !isNaN(Number(rawVal))
                const valNum = isNumeric ? parseFloat(rawVal) : null

                // Validate reasonable physiological bounds
                if (valNum !== null && valNum <= 0) continue
                if (spec.normalized === 'hemoglobin' && valNum !== null && (valNum < 1 || valNum > 30)) continue
                if (spec.normalized === 'creatinine' && valNum !== null && (valNum < 0.1 || valNum > 30)) continue

                if (!seenTests.has(spec.normalized)) {
                    seenTests.add(spec.normalized)

                    // Find excerpt around match
                    const matchIndex = match.index || 0
                    const start = Math.max(0, matchIndex - 30)
                    const end = Math.min(text.length, matchIndex + match[0].length + 40)
                    const excerpt = text.slice(start, end).replace(/\s+/g, ' ').trim()

                    measurements.push({
                        testName: spec.name,
                        normalizedTestName: spec.normalized,
                        valueNumeric: valNum,
                        valueText: rawVal,
                        unit: unit,
                        referenceRange: null, // Only filled if explicitly validated
                        testDate: testDate,
                        pageNumber: 1,
                        sourceExcerpt: excerpt,
                        confidence: 0.95
                    })
                    break // Next spec
                }
            }
        }
    }

    return measurements
}

// 5. Category Detection
export function detectDocumentCategory(text: string, title?: string): string {
    const content = `${title || ''} ${text}`.toLowerCase()

    if (/\b(cbc|hemogram|blood count|platelet|wbc|rbc|hemoglobin|haemoglobin|lipid|cholesterol|creatinine|lft|kft|tsh|glucose|fbs|serology)\b/i.test(content)) {
        return 'Blood Test'
    }
    if (/\b(x-ray|xray|mri|ct scan|ultrasound|sonography|radiology|mammogram|echocardiogram)\b/i.test(content)) {
        return 'Radiology'
    }
    if (/\b(prescription|rx|tablet|capsule|syrup|dosage|daily|dispense|refill|dr\.)\b/i.test(content)) {
        return 'Prescription'
    }
    if (/\b(discharge summary|discharge card|admission date|discharge date|hospital course)\b/i.test(content)) {
        return 'Discharge Summary'
    }
    if (/\b(urine|urinalysis|stool|routine examination)\b/i.test(content)) {
        return 'Pathology'
    }

    return 'Medical Document'
}

// 6. Keywords Extraction
export function extractKeywords(text: string, category: string, measurements: ExtractedMeasurement[]): string[] {
    const keywords = new Set<string>()

    keywords.add(category.toLowerCase())

    for (const m of measurements) {
        keywords.add(m.testName.toLowerCase())
        keywords.add(m.normalizedTestName.toLowerCase())
        const expansions = expandSynonyms(m.normalizedTestName)
        for (const exp of expansions) {
            keywords.add(exp.toLowerCase())
        }
    }

    // Check for common medical terms in text
    for (const group of MEDICAL_SYNONYM_GROUPS) {
        const primaryRegex = new RegExp(`\\b${group.primary}\\b`, 'i')
        if (primaryRegex.test(text)) {
            keywords.add(group.primary)
            for (const alias of group.aliases) {
                keywords.add(alias)
            }
        }
    }

    return Array.from(keywords).slice(0, 30)
}

// 7. Deterministic Summary Generation
export function generateFactualSummary(
    category: string,
    measurements: ExtractedMeasurement[],
    testDate: string | null,
    title?: string
): string {
    const dateStr = testDate ? `dated ${testDate}` : ''
    const titleStr = title ? `"${title}"` : 'Report'

    if (measurements.length > 0) {
        const measurementSummaries = measurements
            .slice(0, 4)
            .map(m => `${m.testName}: ${m.valueText}${m.unit ? ' ' + m.unit : ''}`)
            .join(', ')

        return `${category} ${titleStr} ${dateStr}. Extracted measurements include: ${measurementSummaries}.`.replace(/\s+/g, ' ').trim()
    }

    return `${category} ${titleStr} ${dateStr}. Stored securely in vault search index.`.replace(/\s+/g, ' ').trim()
}

// 8. Optional Gemini AI Extractor
export async function extractWithGemini(
    text: string,
    mimeType: string,
    buffer?: Buffer
): Promise<ExtractedDocumentData | null> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
    if (!apiKey) return null

    try {
        const ai = new GoogleGenAI({ apiKey })

        const prompt = `You are a clinical document parser. Analyze this medical document and extract structured metadata strictly according to what is explicitly stated in the document.
Do NOT invent test results, values, or dates. If a field is missing, set it to null.
Do NOT provide disease diagnoses, medical advice, or treatment plans.

Return a valid JSON object matching this schema:
{
  "summary": "Concise factual summary (1-2 sentences)",
  "category": "One of: Blood Test, Vital Signs, Radiology, Prescription, Discharge Summary, Pathology, Medical Document",
  "keywords": ["array", "of", "search", "keywords", "and", "synonyms"],
  "reportDate": "YYYY-MM-DD or null if not explicitly mentioned",
  "measurements": [
    {
      "testName": "e.g. Hemoglobin",
      "normalizedTestName": "e.g. hemoglobin",
      "valueNumeric": 13.5,
      "valueText": "13.5",
      "unit": "g/dL",
      "referenceRange": "12.0 - 15.5",
      "sourceExcerpt": "Exact sentence or row where found"
    }
  ]
}`

        let responseText = ''

        // If we have an image buffer, we can send it directly
        if (buffer && mimeType.startsWith('image/')) {
            const base64Data = buffer.toString('base64')
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: prompt },
                            { inlineData: { mimeType, data: base64Data } }
                        ]
                    }
                ]
            })
            responseText = response.text || ''
        } else if (text) {
            // Text-based PDF or extracted text
            const truncatedText = text.slice(0, 10000)
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: `${prompt}\n\nDocument Text:\n${truncatedText}` }
                        ]
                    }
                ]
            })
            responseText = response.text || ''
        }

        if (!responseText) return null

        // Parse JSON
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        if (!jsonMatch) return null

        const parsed = JSON.parse(jsonMatch[0])
        const measurements: ExtractedMeasurement[] = (parsed.measurements || []).map((m: {
            testName?: string
            normalizedTestName?: string
            valueNumeric?: number | null
            valueText?: string
            unit?: string | null
            referenceRange?: string | null
            sourceExcerpt?: string
        }) => ({
            testName: m.testName || 'Unknown Test',
            normalizedTestName: normalizeMedicalTerm(m.normalizedTestName || m.testName || ''),
            valueNumeric: typeof m.valueNumeric === 'number' ? m.valueNumeric : null,
            valueText: String(m.valueText || m.valueNumeric || ''),
            unit: m.unit || null,
            referenceRange: m.referenceRange || null,
            testDate: parsed.reportDate || null,
            pageNumber: 1,
            sourceExcerpt: m.sourceExcerpt || '',
            confidence: 0.98
        }))

        return {
            extractedText: text,
            summary: parsed.summary || 'Clinical document summary',
            category: parsed.category || 'Medical Document',
            keywords: parsed.keywords || [],
            reportDate: parsed.reportDate || null,
            confidence: 0.98,
            measurements
        }
    } catch (err) {
        console.warn('Gemini extraction failed, falling back to local extractor:', err)
        return null
    }
}

// 9. Master Document Processing Pipeline
export async function processMedicalDocument(params: {
    buffer: Buffer
    fileName: string
    mimeType: string
    userTitle?: string
    userSummary?: string
}): Promise<ExtractedDocumentData> {
    const { buffer, fileName, mimeType, userTitle, userSummary } = params

    let rawText = ''

    // Step A: Extract Raw Text
    if (mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
        rawText = await extractTextFromPdf(buffer)
    } else if (mimeType.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(fileName)) {
        rawText = await extractTextFromImage(buffer)
    }

    // Step B: Attempt AI extraction if API key configured
    const aiResult = await extractWithGemini(rawText, mimeType, buffer)
    if (aiResult) {
        // If user already supplied a custom summary, respect user summary if present
        if (userSummary && userSummary.trim()) {
            aiResult.summary = userSummary.trim()
        }
        return aiResult
    }

    // Step C: Deterministic Clinical Fallback
    const reportDate = extractClinicalDate(rawText)
    const category = detectDocumentCategory(rawText, userTitle)
    const measurements = extractDeterministicMeasurements(rawText, reportDate)
    const keywords = extractKeywords(rawText, category, measurements)

    const summary = (userSummary && userSummary.trim())
        ? userSummary.trim()
        : generateFactualSummary(category, measurements, reportDate, userTitle)

    return {
        extractedText: rawText,
        summary,
        category,
        keywords,
        reportDate,
        confidence: measurements.length > 0 ? 0.92 : 0.8,
        measurements
    }
}
