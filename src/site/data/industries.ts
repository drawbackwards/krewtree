// ============================================================
// KREWTREE — Industry Seed Data
// Canonical skill tags per subdomain (Construction, Healthcare, Manufacturing)
// ============================================================

export type SkillTag = {
  id: string
  name: string
  aliases: string[]
}

export type IndustryDef = {
  id: string
  name: string
  slug: string
  icon: string
  color: string
  skills: SkillTag[]
}

export const INDUSTRIES: IndustryDef[] = [
  {
    id: 'construction',
    name: 'Construction',
    slug: 'construction',
    icon: '🏗️',
    color: '#8B6914',
    skills: [
      {
        id: 'carpentry',
        name: 'Carpentry',
        aliases: ['carpenter', 'woodwork', 'finish carpentry'],
      },
      {
        id: 'framing',
        name: 'Framing',
        aliases: ['wood framing', 'stud framing', 'structural framing', 'rough framing'],
      },
      {
        id: 'drywall',
        name: 'Drywall Installation',
        aliases: ['drywall', 'sheetrock', 'gypsum board', 'drywall finishing'],
      },
      {
        id: 'concrete',
        name: 'Concrete Work',
        aliases: ['concrete pouring', 'concrete finishing', 'flatwork', 'concrete placement'],
      },
      {
        id: 'masonry',
        name: 'Masonry',
        aliases: ['bricklaying', 'block laying', 'stonework', 'tuck pointing'],
      },
      {
        id: 'plumbing',
        name: 'Plumbing',
        aliases: ['plumber', 'pipe fitting', 'pipefitting', 'drain work'],
      },
      {
        id: 'electrical',
        name: 'Electrical Wiring',
        aliases: ['electrician', 'electrical', 'wiring', 'conduit'],
      },
      {
        id: 'hvac',
        name: 'HVAC',
        aliases: [
          'hvac tech',
          'heating and cooling',
          'air conditioning',
          'refrigeration',
          'mechanical',
        ],
      },
      {
        id: 'roofing',
        name: 'Roofing',
        aliases: ['roofer', 'shingles', 'flat roofing', 'metal roofing'],
      },
      {
        id: 'welding',
        name: 'Welding (MIG/TIG)',
        aliases: ['welder', 'mig welding', 'tig welding', 'stick welding', 'arc welding'],
      },
      {
        id: 'painting_int',
        name: 'Interior Painting',
        aliases: ['painter', 'interior paint', 'wall painting'],
      },
      {
        id: 'painting_ext',
        name: 'Exterior Painting',
        aliases: ['exterior paint', 'house painting', 'spray painting'],
      },
      {
        id: 'flooring',
        name: 'Flooring Installation',
        aliases: ['flooring', 'hardwood floors', 'laminate', 'vinyl plank', 'LVP'],
      },
      {
        id: 'tile',
        name: 'Tile Setting',
        aliases: ['tile setter', 'ceramic tile', 'porcelain tile', 'tile installation'],
      },
      {
        id: 'landscaping',
        name: 'Landscape Installation',
        aliases: ['landscaping', 'lawn care', 'hardscaping', 'irrigation'],
      },
      {
        id: 'excavation',
        name: 'Excavation',
        aliases: ['excavating', 'digging', 'grading', 'earthwork'],
      },
      {
        id: 'heavy_equip',
        name: 'Heavy Equipment Operation',
        aliases: ['equipment operator', 'heavy machinery', 'bulldozer', 'backhoe', 'excavator'],
      },
      {
        id: 'blueprint',
        name: 'Blueprint Reading',
        aliases: ['blueprints', 'plan reading', 'schematic reading', 'technical drawings'],
      },
      {
        id: 'osha',
        name: 'OSHA Safety Compliance',
        aliases: ['osha 10', 'osha 30', 'safety', 'job site safety', 'hazmat'],
      },
      {
        id: 'estimating',
        name: 'Cost Estimating',
        aliases: ['estimator', 'take-offs', 'bid preparation', 'project estimation'],
      },
      {
        id: 'steel',
        name: 'Steel Erection',
        aliases: ['ironworker', 'structural steel', 'steel framing', 'metal building'],
      },
      {
        id: 'insulation',
        name: 'Insulation Installation',
        aliases: ['insulation', 'spray foam', 'batt insulation', 'blown-in insulation'],
      },
      {
        id: 'waterproofing',
        name: 'Waterproofing',
        aliases: ['waterproof', 'moisture barrier', 'foundation waterproofing'],
      },
      {
        id: 'scaffolding',
        name: 'Scaffolding',
        aliases: ['scaffold erection', 'scaffold', 'aerial lift'],
      },
      { id: 'demolition', name: 'Demolition', aliases: ['demo', 'selective demo', 'abatement'] },
      {
        id: 'cabinets',
        name: 'Cabinet Making',
        aliases: ['cabinetry', 'kitchen cabinets', 'custom cabinets', 'millwork'],
      },
      {
        id: 'forklift',
        name: 'Forklift Operation',
        aliases: ['forklift certified', 'forklift operator', 'pallet jack'],
      },
      {
        id: 'crane',
        name: 'Crane Operation',
        aliases: ['crane operator', 'tower crane', 'mobile crane'],
      },
      {
        id: 'solar',
        name: 'Solar Panel Installation',
        aliases: ['solar installer', 'photovoltaic', 'PV systems', 'solar'],
      },
      {
        id: 'sprinkler',
        name: 'Sprinkler System Installation',
        aliases: ['fire suppression', 'sprinkler fitter', 'fire protection'],
      },
      {
        id: 'concrete_finish',
        name: 'Concrete Finishing',
        aliases: ['flatwork finishing', 'troweling', 'decorative concrete'],
      },
      {
        id: 'rebar',
        name: 'Rebar Installation',
        aliases: ['iron worker', 'rebar tying', 'reinforcing steel'],
      },
      {
        id: 'acoustic',
        name: 'Acoustic Ceiling',
        aliases: ['drop ceiling', 'suspended ceiling', 'T-bar ceiling'],
      },
      {
        id: 'epoxy',
        name: 'Epoxy Flooring',
        aliases: ['epoxy coating', 'industrial flooring', 'floor coating'],
      },
      {
        id: 'metal_framing',
        name: 'Metal Framing',
        aliases: ['light gauge steel', 'cold formed steel', 'metal studs'],
      },
      {
        id: 'stucco',
        name: 'Stucco Application',
        aliases: ['stucco', 'EIFS', 'plaster', 'lath and plaster'],
      },
      {
        id: 'foundation',
        name: 'Foundation Work',
        aliases: ['footings', 'foundation forms', 'grade beams'],
      },
      {
        id: 'surveying',
        name: 'Site Surveying',
        aliases: ['surveyor', 'total station', 'GPS surveying', 'layout'],
      },
      {
        id: 'glass',
        name: 'Glass & Glazing',
        aliases: ['glazier', 'window installation', 'storefront', 'curtain wall'],
      },
      {
        id: 'form_setting',
        name: 'Form Setting',
        aliases: ['concrete forms', 'ICF', 'form carpenter'],
      },
    ],
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    slug: 'healthcare',
    icon: '🏥',
    color: '#1a6e8c',
    skills: [
      {
        id: 'patient_care',
        name: 'Patient Care',
        aliases: ['direct patient care', 'bedside care', 'personal care'],
      },
      {
        id: 'vitals',
        name: 'Vital Signs Monitoring',
        aliases: ['vitals', 'blood pressure monitoring', 'pulse ox', 'temperature check'],
      },
      {
        id: 'medication_admin',
        name: 'Medication Administration',
        aliases: ['med pass', 'medication management', 'dispensing medication'],
      },
      {
        id: 'wound_care',
        name: 'Wound Care',
        aliases: ['dressing changes', 'wound assessment', 'wound irrigation'],
      },
      {
        id: 'iv_therapy',
        name: 'IV Therapy',
        aliases: ['IV insertion', 'intravenous therapy', 'peripheral IV', 'IV start'],
      },
      {
        id: 'cpr_aed',
        name: 'CPR / AED Certified',
        aliases: ['CPR', 'AED', 'BLS', 'basic life support', 'ACLS'],
      },
      {
        id: 'ehr',
        name: 'Electronic Health Records (EHR)',
        aliases: ['EHR', 'EMR', 'Epic', 'Cerner', 'electronic charting'],
      },
      {
        id: 'phlebotomy',
        name: 'Phlebotomy',
        aliases: ['blood draw', 'venipuncture', 'specimen collection'],
      },
      {
        id: 'pta',
        name: 'Physical Therapy Assistance',
        aliases: ['PTA', 'physical therapy aide', 'therapy support'],
      },
      {
        id: 'ota',
        name: 'Occupational Therapy Assistance',
        aliases: ['OTA', 'occupational therapy aide'],
      },
      {
        id: 'medical_terminology',
        name: 'Medical Terminology',
        aliases: ['clinical terminology', 'medical vocabulary'],
      },
      {
        id: 'hipaa',
        name: 'HIPAA Compliance',
        aliases: ['HIPAA', 'patient privacy', 'healthcare compliance'],
      },
      {
        id: 'care_planning',
        name: 'Care Planning',
        aliases: ['care plans', 'treatment planning', 'care coordination'],
      },
      {
        id: 'catheter',
        name: 'Catheter Care',
        aliases: ['foley catheter', 'urinary catheter', 'catheterization'],
      },
      {
        id: 'dementia_care',
        name: 'Dementia Care',
        aliases: ['Alzheimers care', 'memory care', 'cognitive impairment care'],
      },
      {
        id: 'pediatric',
        name: 'Pediatric Care',
        aliases: ['pediatrics', 'childcare nursing', 'neonatal'],
      },
      {
        id: 'mental_health',
        name: 'Mental Health Support',
        aliases: ['behavioral health', 'psychiatric care', 'crisis intervention'],
      },
      {
        id: 'dialysis',
        name: 'Dialysis Care',
        aliases: ['hemodialysis', 'peritoneal dialysis', 'renal care'],
      },
      {
        id: 'post_surgical',
        name: 'Post-Surgical Care',
        aliases: ['post-op care', 'surgical recovery', 'PACU'],
      },
      {
        id: 'hha',
        name: 'Home Health Aide (HHA)',
        aliases: ['HHA', 'home care aide', 'personal care aide'],
      },
      {
        id: 'cna',
        name: 'Certified Nursing Assistant (CNA)',
        aliases: ['CNA', 'nursing aide', 'nursing assistant'],
      },
      {
        id: 'medical_coding',
        name: 'Medical Coding (ICD-10)',
        aliases: ['medical billing', 'ICD-10', 'CPT codes', 'medical coder'],
      },
      {
        id: 'sterilization',
        name: 'Sterilization & Disinfection',
        aliases: ['sterilization', 'infection prevention', 'autoclave'],
      },
      {
        id: 'patient_lift',
        name: 'Patient Lifting & Transfer',
        aliases: ['patient transfer', 'Hoyer lift', 'mechanical lift', 'body mechanics'],
      },
      {
        id: 'infection_control',
        name: 'Infection Control',
        aliases: ['infection prevention', 'PPE', 'isolation precautions', 'hand hygiene'],
      },
      {
        id: 'emergency_response',
        name: 'Emergency Response',
        aliases: ['emergency care', 'code blue', 'rapid response', 'first aid'],
      },
      {
        id: 'nutrition_support',
        name: 'Nutrition Support',
        aliases: ['tube feeding', 'enteral nutrition', 'dietary support', 'feeding assistance'],
      },
      {
        id: 'respiratory',
        name: 'Respiratory Therapy',
        aliases: ['respiratory care', 'nebulizer', 'oxygen therapy', 'ventilator'],
      },
      {
        id: 'scheduling_docs',
        name: 'Scheduling & Documentation',
        aliases: ['charting', 'clinical documentation', 'scheduling'],
      },
      {
        id: 'glucose_monitoring',
        name: 'Blood Glucose Monitoring',
        aliases: ['blood sugar', 'glucometer', 'diabetic care', 'glucose check'],
      },
      {
        id: 'tracheostomy',
        name: 'Tracheostomy Care',
        aliases: ['trach care', 'tracheotomy', 'airway management'],
      },
      {
        id: 'specimen',
        name: 'Specimen Collection',
        aliases: ['lab specimens', 'swab collection', 'urine specimen', 'cultures'],
      },
      {
        id: 'ekg',
        name: 'EKG / ECG Monitoring',
        aliases: ['EKG', 'ECG', 'cardiac monitoring', '12-lead EKG'],
      },
      {
        id: 'pain_management',
        name: 'Pain Management',
        aliases: ['pain assessment', 'pain scale', 'comfort care'],
      },
      {
        id: 'fall_prevention',
        name: 'Fall Prevention',
        aliases: ['fall risk assessment', 'bed alarms', 'safe mobility'],
      },
      {
        id: 'behavioral_support',
        name: 'Behavioral Support',
        aliases: ['behavior management', 'de-escalation', 'ABA therapy support'],
      },
      {
        id: 'palliative',
        name: 'Palliative Care',
        aliases: ['hospice care', 'end of life care', 'comfort care'],
      },
      {
        id: 'colostomy',
        name: 'Colostomy / Ostomy Care',
        aliases: ['ostomy', 'colostomy bag', 'stoma care'],
      },
      {
        id: 'med_dispensing',
        name: 'Medication Dispensing',
        aliases: ['medication cart', 'Pyxis', 'automated dispensing'],
      },
      {
        id: 'bed_bath',
        name: 'Bathing & Hygiene Assistance',
        aliases: ['bed bath', 'personal hygiene', 'ADL assistance', 'activities of daily living'],
      },
    ],
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing',
    slug: 'manufacturing',
    icon: '🏭',
    color: '#4a6741',
    skills: [
      {
        id: 'assembly_line',
        name: 'Assembly Line Operation',
        aliases: ['assembly', 'production line', 'line operator'],
      },
      {
        id: 'quality_control',
        name: 'Quality Control (QC)',
        aliases: ['QC', 'quality assurance', 'QA', 'inspection', 'quality inspection'],
      },
      {
        id: 'cnc',
        name: 'CNC Machine Operation',
        aliases: ['CNC', 'CNC machinist', 'CNC operator', 'computer numerical control'],
      },
      {
        id: 'forklift_mfg',
        name: 'Forklift Certification',
        aliases: ['forklift', 'forklift operator', 'pallet jack', 'reach truck'],
      },
      {
        id: 'mig_welding',
        name: 'MIG Welding',
        aliases: ['MIG', 'wire welding', 'GMAW', 'gas metal arc'],
      },
      {
        id: 'tig_welding',
        name: 'TIG Welding',
        aliases: ['TIG', 'GTAW', 'heliarc', 'gas tungsten arc'],
      },
      {
        id: 'warehouse_mgmt',
        name: 'Warehouse Management',
        aliases: ['warehouse', 'WMS', 'fulfillment', 'distribution'],
      },
      {
        id: 'inventory_control',
        name: 'Inventory Control',
        aliases: ['inventory management', 'cycle counting', 'stockroom', 'parts management'],
      },
      {
        id: 'lean',
        name: 'Lean Manufacturing',
        aliases: ['lean', '5S', 'kaizen', 'continuous improvement', 'lean production'],
      },
      {
        id: 'six_sigma',
        name: 'Six Sigma',
        aliases: ['six sigma green belt', 'six sigma black belt', 'DMAIC', 'process improvement'],
      },
      {
        id: 'preventive_maint',
        name: 'Preventive Maintenance',
        aliases: ['PM', 'equipment maintenance', 'machine maintenance', 'maintenance tech'],
      },
      {
        id: 'blueprint_mfg',
        name: 'Blueprint Reading',
        aliases: ['blueprints', 'engineering drawings', 'GD&T', 'technical drawings'],
      },
      {
        id: 'material_handling',
        name: 'Material Handling',
        aliases: ['material movement', 'shipping and receiving', 'logistics'],
      },
      {
        id: 'production_sched',
        name: 'Production Scheduling',
        aliases: ['production planning', 'master schedule', 'capacity planning'],
      },
      {
        id: 'spc',
        name: 'Statistical Process Control (SPC)',
        aliases: ['SPC', 'control charts', 'process control', 'statistical quality control'],
      },
      {
        id: 'hydraulics',
        name: 'Hydraulic Systems',
        aliases: ['hydraulics', 'hydraulic maintenance', 'fluid power'],
      },
      {
        id: 'pneumatics',
        name: 'Pneumatic Systems',
        aliases: ['pneumatics', 'air systems', 'compressed air'],
      },
      {
        id: 'robotics',
        name: 'Robotics Operation',
        aliases: ['robot operator', 'robotic arm', 'automation', 'FANUC', 'ABB robots'],
      },
      {
        id: 'soldering',
        name: 'Soldering',
        aliases: ['electronics soldering', 'PCB soldering', 'hand soldering', 'wave soldering'],
      },
      {
        id: 'packaging',
        name: 'Packaging & Labeling',
        aliases: ['packaging', 'pack out', 'labeling', 'kitting'],
      },
      {
        id: 'osha_mfg',
        name: 'OSHA Safety Compliance',
        aliases: ['OSHA', 'safety compliance', 'lock out tag out', 'LOTO', 'PPE'],
      },
      {
        id: 'erp',
        name: 'ERP Systems',
        aliases: ['SAP', 'Oracle', 'ERP', 'MRP', 'manufacturing software'],
      },
      {
        id: 'injection_molding',
        name: 'Injection Molding',
        aliases: ['plastic injection', 'injection molder', 'thermoplastic molding'],
      },
      {
        id: 'stamping',
        name: 'Metal Stamping & Pressing',
        aliases: ['stamping press', 'die stamping', 'progressive die', 'metal forming'],
      },
      {
        id: 'haccp',
        name: 'Food Safety / HACCP',
        aliases: ['HACCP', 'food safety', 'GMP', 'good manufacturing practices', 'food grade'],
      },
      {
        id: 'plc',
        name: 'PLC Programming',
        aliases: [
          'PLC',
          'programmable logic controller',
          'Allen-Bradley',
          'Siemens PLC',
          'ladder logic',
        ],
      },
      {
        id: 'additive_mfg',
        name: '3D Printing / Additive Manufacturing',
        aliases: ['3D printing', 'additive manufacturing', 'FDM', 'SLA printing'],
      },
      {
        id: 'chemical_handling',
        name: 'Chemical Handling',
        aliases: ['hazmat', 'chemical safety', 'MSDS', 'SDS', 'hazardous materials'],
      },
      {
        id: 'precision_measuring',
        name: 'Precision Measuring',
        aliases: ['metrology', 'calipers', 'micrometers', 'CMM', 'gauging'],
      },
      {
        id: 'torque_tools',
        name: 'Torque Tools & Fastening',
        aliases: ['torque wrench', 'impact wrench', 'pneumatic tools', 'torque specs'],
      },
      {
        id: 'grinding',
        name: 'Surface Grinding',
        aliases: ['grinding', 'angle grinder', 'bench grinder', 'cylindrical grinding'],
      },
      {
        id: 'lathe',
        name: 'Lathe Operation',
        aliases: ['lathe', 'turning', 'manual lathe', 'CNC lathe'],
      },
      {
        id: 'milling',
        name: 'Milling Machine Operation',
        aliases: ['milling', 'manual mill', 'vertical mill', 'Bridgeport'],
      },
      {
        id: 'die_setting',
        name: 'Die Setting',
        aliases: ['die setter', 'tooling changeover', 'press setup'],
      },
      {
        id: 'extrusion',
        name: 'Extrusion Operation',
        aliases: ['extruder', 'plastic extrusion', 'aluminum extrusion', 'extrusion operator'],
      },
      {
        id: 'heat_treating',
        name: 'Heat Treating',
        aliases: ['heat treatment', 'annealing', 'hardening', 'tempering'],
      },
      {
        id: 'ndt',
        name: 'Non-Destructive Testing (NDT)',
        aliases: ['NDT', 'NDE', 'ultrasonic testing', 'dye penetrant', 'magnetic particle'],
      },
      {
        id: 'calibration',
        name: 'Calibration',
        aliases: ['instrument calibration', 'gage calibration', 'metrology'],
      },
      {
        id: 'kanban',
        name: 'Kanban Systems',
        aliases: ['kanban', 'pull system', 'JIT', 'just in time', 'visual management'],
      },
      {
        id: 'iso9001',
        name: 'ISO 9001 Compliance',
        aliases: ['ISO 9001', 'ISO certification', 'quality management system', 'QMS', 'AS9100'],
      },
    ],
  },
]

export const getIndustryById = (id: string): IndustryDef | undefined =>
  INDUSTRIES.find((i) => i.id === id)

export const getSkillsByIndustry = (industryId: string): SkillTag[] =>
  INDUSTRIES.find((i) => i.id === industryId)?.skills ?? []

export const findSkillMatch = (input: string, industryId: string): SkillTag | undefined => {
  const normalized = input.toLowerCase().trim()
  const skills = getSkillsByIndustry(industryId)
  return skills.find(
    (s) =>
      s.name.toLowerCase() === normalized || s.aliases.some((a) => a.toLowerCase() === normalized)
  )
}

export const searchSkills = (query: string, industryId: string): SkillTag[] => {
  if (!query.trim()) return []
  const normalized = query.toLowerCase().trim()
  const skills = getSkillsByIndustry(industryId)
  return skills.filter(
    (s) =>
      s.name.toLowerCase().includes(normalized) ||
      s.aliases.some((a) => a.toLowerCase().includes(normalized))
  )
}
