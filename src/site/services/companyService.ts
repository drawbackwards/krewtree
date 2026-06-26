import { supabase, getCurrentUserId } from '@/lib/supabase'

// ── Company Profile ─────────────────────────────────────────────────────────────

export type CompanyProfileRow = {
  id: string
  name: string
  tagline: string
  logo_url: string | null
  industry: string
  additional_industries: string[]
  size: string
  founded: number | null
  website: string
  description: string
  mission: string
  culture: string
  phone: string
  phone_public: boolean
  email_public: boolean
  address_public: boolean
  hq_street: string
  hq_city: string
  hq_state: string
  hq_postal_code: string
  service_area_radius: number
  service_area_override: string
  contract_types: string[]
  facebook_url: string
  instagram_url: string
  linkedin_url: string
  youtube_url: string
  tiktok_url: string
  regulix_connected: boolean
  is_verified: boolean
  profile_complete_pct: number
}

const COMPANY_PROFILE_SELECT =
  'id, name, tagline, logo_url, industry, additional_industries, size, founded, website, ' +
  'description, mission, culture, phone, phone_public, email_public, address_public, ' +
  'hq_street, hq_city, hq_state, hq_postal_code, service_area_radius, service_area_override, ' +
  'contract_types, facebook_url, instagram_url, linkedin_url, youtube_url, tiktok_url, ' +
  'regulix_connected, is_verified, profile_complete_pct'

export async function getCompanyProfile(
  companyId: string
): Promise<{ data: CompanyProfileRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from('company_profiles')
    .select(COMPANY_PROFILE_SELECT)
    .eq('id', companyId)
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as unknown as CompanyProfileRow, error: null }
}

// Lightweight logo lookup for the navbar avatar — selects a single column
// instead of the full ~30-column profile row that getCompanyProfile returns.
export async function getCompanyLogoUrl(
  companyId: string
): Promise<{ data: string | null; error: string | null }> {
  const { data, error } = await supabase
    .from('company_profiles')
    .select('logo_url')
    .eq('id', companyId)
    .maybeSingle()

  if (error) return { data: null, error: error.message }
  return { data: (data?.logo_url as string | null) ?? null, error: null }
}

// ── Upsert (Identity + About) ──────────────────────────────────────────────────
// Phase 2 writes only the Identity & basics + About fields directly. Phase 3
// will introduce an RPC for atomic license / location / photo replacement.

export type UpsertCompanyBasicsParams = {
  name: string
  tagline: string
  industry: string
  additional_industries: string[]
  phone: string
  website: string
  hq_city: string
  hq_state: string
  phone_public: boolean
  size: string
  founded: number | null
  description: string
}

export async function upsertCompanyBasics(
  companyId: string,
  params: UpsertCompanyBasicsParams
): Promise<{ error: string | null; profileCompletePct: number }> {
  const { error } = await supabase
    .from('company_profiles')
    .update({
      name: params.name,
      tagline: params.tagline,
      industry: params.industry,
      additional_industries: params.additional_industries,
      phone: params.phone,
      website: params.website,
      hq_city: params.hq_city,
      hq_state: params.hq_state,
      phone_public: params.phone_public,
      size: params.size,
      founded: params.founded,
      description: params.description,
    })
    .eq('id', companyId)

  if (error) return { error: error.message, profileCompletePct: 0 }
  const { pct } = await recomputeProfileCompletePct(companyId)
  return { error: null, profileCompletePct: pct }
}

// ── Logo upload ────────────────────────────────────────────────────────────────
// Reuses the existing `avatars` bucket — its RLS only requires the path to
// start with the caller's auth.uid(), which works for both workers and companies.

export async function uploadCompanyLogo(
  companyId: string,
  file: File
): Promise<{ url: string | null; error: string | null }> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${companyId}/logo.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) return { url: null, error: uploadError.message }

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return { url: `${data.publicUrl}?t=${Date.now()}`, error: null }
}

export async function updateCompanyLogoUrl(
  companyId: string,
  logoUrl: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('company_profiles')
    .update({ logo_url: logoUrl })
    .eq('id', companyId)
  if (error) return { error: error.message }
  return { error: null }
}

// ── Completeness ───────────────────────────────────────────────────────────────
// Advisory percentage shown on the company dashboard. Pure function — fed by
// recomputeProfileCompletePct, which reads everything from the DB.

export function computeProfileCompletePct(p: {
  name: string
  industry: string
  hq_city: string
  hq_state: string
  phone: string
  description: string
  website: string
  founded: number | null
  size: string
  logoUrl?: string | null
  licenseCount?: number
  photoCount?: number
  benefitCount?: number
}): number {
  let pct = 0
  // 20 — identity required (set at signup; almost always 20)
  if (
    p.name.trim() &&
    p.industry.trim() &&
    p.hq_city.trim() &&
    p.hq_state.trim() &&
    p.phone.trim()
  ) {
    pct += 20
  }
  // 20 — description
  if (p.description.trim().length >= 40) pct += 20
  // 10 — website
  if (p.website.trim()) pct += 10
  // 5 — founded year
  if (p.founded) pct += 5
  // 5 — size band
  if (p.size.trim()) pct += 5
  // 15 — logo
  if (p.logoUrl && p.logoUrl.trim()) pct += 15
  // 10 — at least one license
  if ((p.licenseCount ?? 0) > 0) pct += 10
  // 10 — at least one photo
  if ((p.photoCount ?? 0) > 0) pct += 10
  // 5 — at least one benefit
  if ((p.benefitCount ?? 0) > 0) pct += 5
  return Math.min(pct, 100)
}

// Reads everything that contributes to the score and writes the result back to
// company_profiles.profile_complete_pct. Called at the end of every section save.
export async function recomputeProfileCompletePct(
  companyId: string
): Promise<{ pct: number; error: string | null }> {
  const [profileRes, licenses, photos, benefits] = await Promise.all([
    supabase
      .from('company_profiles')
      .select(
        'name, industry, hq_city, hq_state, phone, description, website, founded, size, logo_url'
      )
      .eq('id', companyId)
      .single(),
    supabase
      .from('company_licenses')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId),
    supabase
      .from('company_photos')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId),
    supabase
      .from('company_benefits')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId),
  ])

  if (profileRes.error) return { pct: 0, error: profileRes.error.message }
  const p = profileRes.data as {
    name: string
    industry: string
    hq_city: string
    hq_state: string
    phone: string
    description: string
    website: string
    founded: number | null
    size: string
    logo_url: string | null
  }
  const pct = computeProfileCompletePct({
    ...p,
    logoUrl: p.logo_url,
    licenseCount: licenses.count ?? 0,
    photoCount: photos.count ?? 0,
    benefitCount: benefits.count ?? 0,
  })
  const { error } = await supabase
    .from('company_profiles')
    .update({ profile_complete_pct: pct })
    .eq('id', companyId)
  if (error) return { pct, error: error.message }
  return { pct, error: null }
}

// ── Public profile (read-only, respects privacy toggles) ─────────────────────

export type PublicCompanyJob = {
  id: string
  title: string
  industry: string
  industry_slug: string
  type: string | null
  location: string
  pay_min: number | null
  pay_max: number | null
  pay_type: string | null
  skills: string[] | null
  created_at: string
}

export type PublicCompanyProfile = {
  id: string
  name: string
  tagline: string
  logo_url: string | null
  industry: string
  additional_industries: string[]
  size: string
  founded: number | null
  description: string
  website: string

  // Phone/email/HQ address respect their public flags. When private, the
  // string is empty and the UI shows a "Message company" affordance instead.
  phone: string
  email: string
  hq_full_address: string
  hq_city: string
  hq_state: string

  service_area_radius: number
  service_area_override: string

  contract_types: string[]
  facebook_url: string
  instagram_url: string
  linkedin_url: string
  youtube_url: string
  tiktok_url: string

  is_verified: boolean
  regulix_connected: boolean

  licenses: CompanyLicenseRow[]
  additional_locations: CompanyAdditionalLocationRow[]
  photos: CompanyPhotoRow[]
  benefits: string[]
  jobs: PublicCompanyJob[]
}

export async function getPublicCompanyProfile(
  companyId: string
): Promise<{ data: PublicCompanyProfile | null; error: string | null }> {
  // Reads the masked view, not the base table: phone/address are already
  // gated by the company's *_public flags in SQL (the anon key can't read the
  // raw contact columns), and soft-deleted companies are excluded by the view.
  // The view isn't in the generated types, so use the same loose `from` escape
  // hatch the services use for non-generated relations.
  const db = supabase as unknown as { from: (t: string) => ReturnType<typeof supabase.from> }
  const profileQuery = db
    .from('company_public_profiles')
    .select(
      'id, name, tagline, logo_url, industry, additional_industries, size, founded, ' +
        'description, website, phone, hq_full_address, hq_city, hq_state, ' +
        'service_area_radius, service_area_override, contract_types, facebook_url, ' +
        'instagram_url, linkedin_url, youtube_url, tiktok_url, is_verified, regulix_connected'
    )
    .eq('id', companyId)
    .maybeSingle()

  const [profileRes, licensesRes, locationsRes, photosRes, benefitsRes, jobsRes] =
    await Promise.all([
      profileQuery,
      getCompanyLicenses(companyId),
      getCompanyAdditionalLocations(companyId),
      getCompanyPhotos(companyId),
      getCompanyBenefits(companyId),
      supabase
        .from('jobs')
        .select(
          'id, title, industry, industry_slug, type, location, pay_min, pay_max, pay_type, skills, created_at'
        )
        .eq('company_id', companyId)
        .eq('status', 'active')
        .order('created_at', { ascending: false }),
    ])

  if (profileRes.error) return { data: null, error: profileRes.error.message }
  // maybeSingle returns null when the company doesn't exist or is soft-deleted
  // (the view filters deleted_at), which both surface as "not found".
  if (!profileRes.data) return { data: null, error: null }
  const p = profileRes.data as unknown as {
    id: string
    name: string
    tagline: string
    logo_url: string | null
    industry: string
    additional_industries: string[]
    size: string
    founded: number | null
    description: string
    website: string
    phone: string
    hq_full_address: string
    hq_city: string
    hq_state: string
    service_area_radius: number
    service_area_override: string
    contract_types: string[]
    facebook_url: string
    instagram_url: string
    linkedin_url: string
    youtube_url: string
    tiktok_url: string
    is_verified: boolean
    regulix_connected: boolean
  }

  // phone and hq_full_address arrive already masked by the view per the
  // company's *_public flags. Email isn't on company_profiles (it lives in
  // auth, which RLS won't expose to workers), so contact happens via messaging
  // (per spec §8.7); when email_public is wired, add a public_email column.

  return {
    data: {
      id: p.id,
      name: p.name,
      tagline: p.tagline,
      logo_url: p.logo_url,
      industry: p.industry,
      additional_industries: p.additional_industries ?? [],
      size: p.size,
      founded: p.founded,
      description: p.description,
      website: p.website,
      phone: p.phone,
      email: '',
      hq_full_address: p.hq_full_address,
      hq_city: p.hq_city,
      hq_state: p.hq_state,
      service_area_radius: p.service_area_radius,
      service_area_override: p.service_area_override,
      contract_types: p.contract_types ?? [],
      facebook_url: p.facebook_url,
      instagram_url: p.instagram_url,
      linkedin_url: p.linkedin_url,
      youtube_url: p.youtube_url,
      tiktok_url: p.tiktok_url,
      is_verified: p.is_verified,
      regulix_connected: p.regulix_connected,
      licenses: licensesRes.data,
      additional_locations: locationsRes.data,
      photos: photosRes.data,
      benefits: benefitsRes.data,
      jobs: (jobsRes.data ?? []) as PublicCompanyJob[],
    },
    error: null,
  }
}

// ── Phone update (spec §4.7 Account & billing) ───────────────────────────────
// Phone verification is deferred (SMS costs); this just writes the user-entered
// number. The verification record on the column stays unset.

export async function updateCompanyPhone(
  companyId: string,
  phone: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('company_profiles').update({ phone }).eq('id', companyId)
  if (error) return { error: error.message }
  return { error: null }
}

// ── Photo reports (spec §4.5) ─────────────────────────────────────────────────

export async function reportPhoto(
  photoId: string,
  reason: string
): Promise<{ error: string | null }> {
  const userId = await getCurrentUserId()
  if (!userId) return { error: 'You must be signed in to report a photo.' }
  const { error } = await supabase.from('photo_reports').insert({
    photo_id: photoId,
    reporter_id: userId,
    reason: reason.trim(),
  })
  if (error) return { error: error.message }
  return { error: null }
}

// ── Soft delete ──────────────────────────────────────────────────────────────

export async function deleteCompany(): Promise<{ error: string | null }> {
  // RPC handles the cascading work atomically: closes open jobs, archives
  // active applications, marks company_profiles.deleted_at.
  const { error } = await supabase.rpc('soft_delete_company')
  if (error) return { error: error.message }
  return { error: null }
}

// ── Licenses ───────────────────────────────────────────────────────────────────

export type CompanyLicenseRow = {
  id: string
  license_type: string
  jurisdiction: string
  license_number: string
  expiration_date: string | null
  verification_status: string
}

export async function getCompanyLicenses(
  companyId: string
): Promise<{ data: CompanyLicenseRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from('company_licenses')
    .select('id, license_type, jurisdiction, license_number, expiration_date, verification_status')
    .eq('company_id', companyId)
    .order('display_order', { ascending: true })
  if (error) return { data: [], error: error.message }
  return { data: (data ?? []) as CompanyLicenseRow[], error: null }
}

export type SaveLicenseEntry = {
  license_type: string
  jurisdiction: string
  license_number: string
  expiration_date: string | null
}

// Full-replace: delete all existing licenses, then insert the new set.
// "Other" type entries pass through unchanged; verification status is computed
// from expiration_date (expired vs. unverified).
export async function saveCompanyLicenses(
  companyId: string,
  licenses: SaveLicenseEntry[]
): Promise<{ error: string | null }> {
  const today = new Date().toISOString().slice(0, 10)
  const { error: delErr } = await supabase
    .from('company_licenses')
    .delete()
    .eq('company_id', companyId)
  if (delErr) return { error: delErr.message }

  if (licenses.length > 0) {
    const rows = licenses
      .filter((l) => l.license_type && l.jurisdiction && l.license_number)
      .map((l, idx) => ({
        company_id: companyId,
        license_type: l.license_type,
        jurisdiction: l.jurisdiction,
        license_number: l.license_number,
        expiration_date: l.expiration_date,
        verification_status:
          l.expiration_date && l.expiration_date < today ? 'expired' : 'unverified',
        display_order: idx,
      }))
    if (rows.length > 0) {
      const { error: insErr } = await supabase.from('company_licenses').insert(rows)
      if (insErr) return { error: insErr.message }
    }
  }

  await recomputeProfileCompletePct(companyId)
  return { error: null }
}

// ── Additional locations ──────────────────────────────────────────────────────

export type CompanyAdditionalLocationRow = {
  id: string
  name: string
  street: string
  city: string
  state: string
  postal_code: string
  radius: number | null
}

export async function getCompanyAdditionalLocations(
  companyId: string
): Promise<{ data: CompanyAdditionalLocationRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from('company_additional_locations')
    .select('id, name, street, city, state, postal_code, radius')
    .eq('company_id', companyId)
    .order('display_order', { ascending: true })
  if (error) return { data: [], error: error.message }
  return { data: (data ?? []) as CompanyAdditionalLocationRow[], error: null }
}

// ── Photos ────────────────────────────────────────────────────────────────────

export type CompanyPhotoRow = {
  id: string
  url: string
  caption: string
}

export async function getCompanyPhotos(
  companyId: string
): Promise<{ data: CompanyPhotoRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from('company_photos')
    .select('id, url, caption')
    .eq('company_id', companyId)
    .order('display_order', { ascending: true })
  if (error) return { data: [], error: error.message }
  return { data: (data ?? []) as CompanyPhotoRow[], error: null }
}

export async function uploadCompanyPhoto(
  companyId: string,
  file: File,
  index: number
): Promise<{ url: string | null; error: string | null }> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${companyId}/photo-${index}-${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) return { url: null, error: uploadError.message }

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return { url: data.publicUrl, error: null }
}

// ── Benefits ─────────────────────────────────────────────────────────────────

export async function getCompanyBenefits(
  companyId: string
): Promise<{ data: string[]; error: string | null }> {
  const { data, error } = await supabase
    .from('company_benefits')
    .select('label')
    .eq('company_id', companyId)
    .order('display_order', { ascending: true })
  if (error) return { data: [], error: error.message }
  return { data: (data ?? []).map((r) => r.label), error: null }
}

// ── Contract types & benefits ────────────────────────────────────────────────

export type SaveContractBenefitsParams = {
  contract_types: string[]
  benefits: string[]
}

export async function saveCompanyContractBenefits(
  companyId: string,
  params: SaveContractBenefitsParams
): Promise<{ error: string | null }> {
  const { error: profErr } = await supabase
    .from('company_profiles')
    .update({ contract_types: params.contract_types })
    .eq('id', companyId)
  if (profErr) return { error: profErr.message }

  // Benefits full-replace
  const { error: delBenErr } = await supabase
    .from('company_benefits')
    .delete()
    .eq('company_id', companyId)
  if (delBenErr) return { error: delBenErr.message }
  if (params.benefits.length > 0) {
    const rows = params.benefits.map((label, idx) => ({
      company_id: companyId,
      label,
      display_order: idx,
    }))
    const { error: insBenErr } = await supabase.from('company_benefits').insert(rows)
    if (insBenErr) return { error: insBenErr.message }
  }

  await recomputeProfileCompletePct(companyId)
  return { error: null }
}

// ── Hiring & Culture (photos + social URLs) ──────────────────────────────────

export type SaveHiringParams = {
  photos: { url: string; caption: string }[]
  facebook_url: string
  instagram_url: string
  linkedin_url: string
  youtube_url: string
  tiktok_url: string
}

export async function saveCompanyHiring(
  companyId: string,
  params: SaveHiringParams
): Promise<{ error: string | null }> {
  const { error: profErr } = await supabase
    .from('company_profiles')
    .update({
      facebook_url: params.facebook_url,
      instagram_url: params.instagram_url,
      linkedin_url: params.linkedin_url,
      youtube_url: params.youtube_url,
      tiktok_url: params.tiktok_url,
    })
    .eq('id', companyId)
  if (profErr) return { error: profErr.message }

  // Photos full-replace
  const { error: delPhotosErr } = await supabase
    .from('company_photos')
    .delete()
    .eq('company_id', companyId)
  if (delPhotosErr) return { error: delPhotosErr.message }
  if (params.photos.length > 0) {
    const rows = params.photos.map((p, idx) => ({
      company_id: companyId,
      url: p.url,
      caption: p.caption,
      display_order: idx,
    }))
    const { error: insPhotosErr } = await supabase.from('company_photos').insert(rows)
    if (insPhotosErr) return { error: insPhotosErr.message }
  }

  await recomputeProfileCompletePct(companyId)
  return { error: null }
}
