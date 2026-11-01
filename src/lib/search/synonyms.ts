// Medical Synonyms and Aliases Registry
// Centralized, curated mapping between medical abbreviations, colloquial phrases, and formal test names.

export interface SynonymGroup {
    primary: string
    aliases: string[]
    category: string
    units?: string[]
}

export const MEDICAL_SYNONYM_GROUPS: SynonymGroup[] = [
    {
        primary: 'hemoglobin',
        aliases: ['hb', 'hgb', 'haemoglobin', 'hemoglobin count', 'total hemoglobin'],
        category: 'Blood Test',
        units: ['g/dL', 'g/l']
    },
    {
        primary: 'complete blood count',
        aliases: ['cbc', 'complete hemogram', 'hemogram', 'blood count', 'full blood count', 'fbc'],
        category: 'Blood Test'
    },
    {
        primary: 'blood pressure',
        aliases: ['bp', 'systolic', 'diastolic', 'blood pressure reading', 'hypertension check'],
        category: 'Vital Signs',
        units: ['mmHg']
    },
    {
        primary: 'glucose',
        aliases: ['blood sugar', 'fasting blood sugar', 'fbs', 'ppbs', 'post prandial blood sugar', 'rbs', 'random blood sugar', 'fasting glucose', 'plasma glucose'],
        category: 'Blood Test',
        units: ['mg/dL', 'mmol/L']
    },
    {
        primary: 'hba1c',
        aliases: ['glycated hemoglobin', 'glycosylated hemoglobin', 'a1c', 'estimated average glucose'],
        category: 'Blood Test',
        units: ['%']
    },
    {
        primary: 'platelets',
        aliases: ['platelet count', 'plt', 'thrombocytes', 'thrombocyte count'],
        category: 'Blood Test',
        units: ['/cumm', '10^3/uL', '10^9/L', 'lakhs/cumm', 'k/uL']
    },
    {
        primary: 'white blood cells',
        aliases: ['wbc', 'wbc count', 'leukocytes', 'total leukocyte count', 'tlc'],
        category: 'Blood Test',
        units: ['/cumm', '10^3/uL', '/mcL']
    },
    {
        primary: 'red blood cells',
        aliases: ['rbc', 'rbc count', 'erythrocytes', 'total rbc count', 'total erythrocyte count'],
        category: 'Blood Test',
        units: ['mil/uL', 'million/cumm', '10^6/uL']
    },
    {
        primary: 'cholesterol',
        aliases: ['lipid', 'lipid profile', 'total cholesterol', 'serum cholesterol', 'chol', 'ldl', 'hdl', 'triglycerides', 'vldl'],
        category: 'Blood Test',
        units: ['mg/dL', 'mmol/L']
    },
    {
        primary: 'creatinine',
        aliases: ['serum creatinine', 'creat', 'renal function', 'kidney function', 'kft', 'rft'],
        category: 'Blood Test',
        units: ['mg/dL', 'umol/L']
    },
    {
        primary: 'blood urea nitrogen',
        aliases: ['bun', 'urea', 'serum urea'],
        category: 'Blood Test',
        units: ['mg/dL', 'mmol/L']
    },
    {
        primary: 'liver function',
        aliases: ['lft', 'liver function test', 'sgot', 'ast', 'sgpt', 'alt', 'bilirubin', 'total bilirubin', 'alkaline phosphatase', 'alp'],
        category: 'Blood Test'
    },
    {
        primary: 'thyroid',
        aliases: ['tft', 'thyroid profile', 'tsh', 'thyroid stimulating hormone', 'free t3', 'free t4', 'total t3', 'total t4'],
        category: 'Blood Test',
        units: ['uIU/mL', 'mIU/L', 'ng/dL', 'pg/mL']
    },
    {
        primary: 'urinalysis',
        aliases: ['urine routine', 'urine test', 'urine analysis', 'urine examination', 'routine urine'],
        category: 'Pathology'
    },
    {
        primary: 'radiology',
        aliases: ['x-ray', 'xray', 'chest x-ray', 'cxr', 'ct scan', 'mri', 'ultrasound', 'usg', 'sonography', 'radiological'],
        category: 'Radiology'
    },
    {
        primary: 'prescription',
        aliases: ['rx', 'doctor prescription', 'medication chart', 'prescribed medicines', 'medicines'],
        category: 'Prescription'
    },
    {
        primary: 'discharge summary',
        aliases: ['discharge card', 'hospital discharge', 'inpatient summary', 'discharge report'],
        category: 'Discharge Summary'
    }
]

// Expand a term to all known synonyms and aliases
export function expandSynonyms(term: string): string[] {
    const cleanTerm = term.trim().toLowerCase()
    if (!cleanTerm) return []

    const expansions = new Set<string>()
    expansions.add(cleanTerm)

    for (const group of MEDICAL_SYNONYM_GROUPS) {
        const matchesPrimary = group.primary.toLowerCase() === cleanTerm
        const matchesAlias = group.aliases.some(a => a.toLowerCase() === cleanTerm || cleanTerm.includes(a.toLowerCase()) || a.toLowerCase().includes(cleanTerm))

        if (matchesPrimary || matchesAlias) {
            expansions.add(group.primary)
            for (const alias of group.aliases) {
                expansions.add(alias)
            }
        }
    }

    return Array.from(expansions)
}

// Normalize a medical term to its canonical standard name if known
export function normalizeMedicalTerm(rawTerm: string): string {
    const clean = rawTerm.trim().toLowerCase()
    for (const group of MEDICAL_SYNONYM_GROUPS) {
        if (group.primary.toLowerCase() === clean) return group.primary
        if (group.aliases.some(a => a.toLowerCase() === clean)) {
            return group.primary
        }
    }
    return clean
}
