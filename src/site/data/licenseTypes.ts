// ============================================================
// KREWTREE — License Types Seed Data
// Canonical license type list per industry. Scoped per industry,
// parallels the skill taxonomy pattern.
// ============================================================

export type LicenseTypeDef = {
  id: string
  label: string
  industryIds: string[]
}

export const LICENSE_TYPES: LicenseTypeDef[] = [
  { id: 'general_contractor', label: 'General contractor', industryIds: ['construction'] },
  {
    id: 'general_contractor_residential',
    label: 'General contractor — residential',
    industryIds: ['construction'],
  },
  {
    id: 'general_contractor_commercial',
    label: 'General contractor — commercial',
    industryIds: ['construction'],
  },
  { id: 'specialty_contractor', label: 'Specialty contractor', industryIds: ['construction'] },
  { id: 'electrical', label: 'Electrical', industryIds: ['construction'] },
  { id: 'plumbing', label: 'Plumbing', industryIds: ['construction'] },
  { id: 'hvac', label: 'HVAC / mechanical', industryIds: ['construction'] },
  { id: 'refrigeration', label: 'Refrigeration', industryIds: ['construction'] },
  { id: 'solar', label: 'Solar', industryIds: ['construction'] },
  { id: 'low_voltage', label: 'Low voltage / data', industryIds: ['construction'] },
  { id: 'fire_protection', label: 'Fire protection / sprinkler', industryIds: ['construction'] },
  { id: 'elevator', label: 'Elevator', industryIds: ['construction'] },
  { id: 'roofing', label: 'Roofing', industryIds: ['construction'] },
  { id: 'concrete', label: 'Concrete', industryIds: ['construction'] },
  { id: 'masonry', label: 'Masonry', industryIds: ['construction'] },
  { id: 'drywall', label: 'Drywall', industryIds: ['construction'] },
  { id: 'painting', label: 'Painting', industryIds: ['construction'] },
  { id: 'flooring', label: 'Flooring', industryIds: ['construction'] },
  { id: 'carpentry', label: 'Carpentry / framing', industryIds: ['construction'] },
  { id: 'cabinetry', label: 'Cabinetry', industryIds: ['construction'] },
  { id: 'glazing', label: 'Glazing', industryIds: ['construction'] },
  { id: 'insulation', label: 'Insulation', industryIds: ['construction'] },
  {
    id: 'landscaping_lic',
    label: 'Landscaping',
    industryIds: ['construction', 'landscaping'],
  },
  { id: 'excavation', label: 'Excavation / grading', industryIds: ['construction'] },
  { id: 'paving', label: 'Paving / asphalt', industryIds: ['construction'] },
  { id: 'fencing', label: 'Fencing', industryIds: ['construction'] },
  { id: 'pool_spa', label: 'Pool / spa', industryIds: ['construction'] },
  { id: 'irrigation', label: 'Irrigation', industryIds: ['construction', 'landscaping'] },
  { id: 'tree_service', label: 'Tree service', industryIds: ['construction', 'landscaping'] },
  { id: 'demolition', label: 'Demolition', industryIds: ['construction'] },
  { id: 'welding', label: 'Welding', industryIds: ['construction'] },
  { id: 'crane_rigging', label: 'Crane / rigging', industryIds: ['construction'] },
  { id: 'boring_drilling', label: 'Boring / drilling', industryIds: ['construction'] },
  { id: 'hazmat', label: 'Hazmat / asbestos abatement', industryIds: ['construction'] },
  { id: 'pest_control', label: 'Pest control', industryIds: ['construction', 'landscaping'] },
  { id: 'other', label: 'Other', industryIds: ['construction'] },
]

export const getLicenseTypesByIndustry = (industryId: string): LicenseTypeDef[] =>
  LICENSE_TYPES.filter((lt) => lt.industryIds.includes(industryId))

export const getLicenseTypesByIndustries = (industryIds: string[]): LicenseTypeDef[] => {
  if (industryIds.length === 0) return []
  const set = new Set(industryIds)
  return LICENSE_TYPES.filter((lt) => lt.industryIds.some((id) => set.has(id)))
}

export const getLicenseTypeById = (id: string): LicenseTypeDef | undefined =>
  LICENSE_TYPES.find((lt) => lt.id === id)
