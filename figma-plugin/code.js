// ─────────────────────────────────────────────────────────────────────────────
// krewtree component builder — Figma Plugin
//
// Creates all 19 krewtree UI component sets on a new page.
// Variant property names match the .figma.tsx Code Connect files exactly.
//
// Run once → all component sets are created → copy node URLs into
// the .figma.tsx placeholder strings → run: npx figma connect publish
// ─────────────────────────────────────────────────────────────────────────────

// ── Brand tokens ──────────────────────────────────────────────────────────────
const T = {
  navy:     { r: 0.039, g: 0.137, b: 0.176 }, // #0A232D
  sand:     { r: 0.898, g: 0.855, b: 0.765 }, // #E5DAC3
  olive:    { r: 0.427, g: 0.459, b: 0.192 }, // #6D7531
  charcoal: { r: 0.271, g: 0.271, b: 0.271 }, // #454545
  silver:   { r: 0.780, g: 0.780, b: 0.780 }, // #C7C7C7
  white:    { r: 1,     g: 1,     b: 1     },
  ghost:    { r: 0.949, g: 0.949, b: 0.949 },
  red:      { r: 0.820, g: 0.192, b: 0.192 },
  green:    { r: 0.082, g: 0.541, b: 0.373 },
  amber:    { r: 0.800, g: 0.518, b: 0.067 },
  blue:     { r: 0.196, g: 0.435, b: 0.875 },
}

// ── Font helpers ──────────────────────────────────────────────────────────────
async function loadFonts() {
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' })
  await figma.loadFontAsync({ family: 'Inter', style: 'Medium' })
  await figma.loadFontAsync({ family: 'Inter', style: 'Bold' })
}

// ── Component variant factory ─────────────────────────────────────────────────
// Creates a single ComponentNode — named for Figma's variant system.
// variantName must follow "Prop=Value, Prop=Value" format.
function makeVariant(variantName, fill, w, h, textColor, cornerRadius) {
  const c = figma.createComponent()
  c.resize(w, h)
  c.name = variantName
  c.fills = [{ type: 'SOLID', color: fill }]
  c.cornerRadius = cornerRadius != null ? cornerRadius : 6

  // Display label: first variant's value  e.g. "Primary" from "Variant=Primary, Size=md"
  const displayLabel = variantName.split(', ')[0].split('=').pop() || variantName

  const t = figma.createText()
  t.fontName = { family: 'Inter', style: 'Medium' }
  t.characters = displayLabel
  t.fontSize = Math.min(13, Math.max(9, Math.floor(h * 0.30)))
  t.fills = [{ type: 'SOLID', color: textColor || T.white }]
  t.resize(w - 8, h)
  t.x = 4
  t.y = 0
  t.textAlignHorizontal = 'CENTER'
  t.textAlignVertical = 'CENTER'
  c.appendChild(t)
  return c
}

// ── Component set factory ─────────────────────────────────────────────────────
// variantDefs: [{ name, fill, w, h, tc?, r? }]
// extraProps: [{ name, type: 'BOOLEAN'|'TEXT', default }]
function makeSet(page, setName, variantDefs, extraProps) {
  const components = variantDefs.map(v =>
    makeVariant(v.name, v.fill, v.w, v.h, v.tc, v.r)
  )
  components.forEach(c => page.appendChild(c))
  const set = figma.combineAsVariants(components, page)
  set.name = setName

  for (const prop of (extraProps || [])) {
    const def = prop.type === 'BOOLEAN' ? false : (prop.default || '')
    set.addComponentProperty(prop.name, prop.type, def)
  }
  return set
}

// ── Layout state ──────────────────────────────────────────────────────────────
const LEFT = 80
const GAP  = 96
let   Y    = 80

function placeSet(page, set, sectionLabel) {
  // Section header
  const lbl = figma.createText()
  lbl.fontName = { family: 'Inter', style: 'Bold' }
  lbl.characters = sectionLabel
  lbl.fontSize = 22
  lbl.fills = [{ type: 'SOLID', color: T.navy }]
  lbl.x = LEFT
  lbl.y = Y
  page.appendChild(lbl)
  Y += 40

  set.x = LEFT
  set.y = Y
  Y += set.height + GAP
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT BUILDERS
// ══════════════════════════════════════════════════════════════════════════════

function buildButton(page) {
  const variantFill = { Primary: T.navy, Secondary: T.ghost, Accent: T.olive, Outline: T.white, Ghost: T.white, Danger: T.red, Link: T.white }
  const variantText = { Primary: T.white, Secondary: T.navy, Accent: T.white, Outline: T.navy, Ghost: T.navy, Danger: T.white, Link: T.blue }
  const sizeW = { sm: 88, md: 104, lg: 120, xl: 144 }
  const sizeH = { sm: 32, md: 40, lg: 48, xl: 56 }
  const variants = []
  for (const v of ['Primary','Secondary','Accent','Outline','Ghost','Danger','Link']) {
    for (const s of ['sm','md','lg','xl']) {
      variants.push({ name: `Variant=${v}, Size=${s}`, fill: variantFill[v], w: sizeW[s], h: sizeH[s], tc: variantText[v] })
    }
  }
  placeSet(page, makeSet(page, 'Button', variants, [
    { name: 'Loading',    type: 'BOOLEAN', default: false },
    { name: 'Full Width', type: 'BOOLEAN', default: false },
    { name: 'Label',      type: 'TEXT',    default: 'Button' },
  ]), 'Button')
}

function buildBadge(page) {
  const fills = { Primary: T.navy, Secondary: T.sand, Accent: T.olive, Success: T.green, Warning: T.amber, Danger: T.red, Info: T.blue, Neutral: T.silver }
  const texts  = { Primary: T.white, Secondary: T.navy, Accent: T.white, Success: T.white, Warning: T.white, Danger: T.white, Info: T.white, Neutral: T.charcoal }
  const sizeW = { sm: 52, md: 68, lg: 84 }
  const sizeH = { sm: 20, md: 24, lg: 28 }
  const variants = []
  for (const v of Object.keys(fills)) {
    for (const s of ['sm','md','lg']) {
      variants.push({ name: `Variant=${v}, Size=${s}`, fill: fills[v], w: sizeW[s], h: sizeH[s], tc: texts[v], r: 999 })
    }
  }
  placeSet(page, makeSet(page, 'Badge', variants, [
    { name: 'Dot',   type: 'BOOLEAN', default: false },
    { name: 'Label', type: 'TEXT',    default: 'Badge' },
  ]), 'Badge')
}

function buildInput(page) {
  const fills = { Default: T.white, Focus: T.white, Error: T.white, Disabled: T.ghost }
  const texts  = { Default: T.charcoal, Focus: T.navy, Error: T.red, Disabled: T.silver }
  const sizeW = { sm: 260, md: 320, lg: 380 }
  const sizeH = { sm: 36, md: 44, lg: 52 }
  const variants = []
  for (const state of ['Default','Focus','Error','Disabled']) {
    for (const s of ['sm','md','lg']) {
      variants.push({ name: `State=${state}, Size=${s}`, fill: fills[state], w: sizeW[s], h: sizeH[s], tc: texts[state] })
    }
  }
  placeSet(page, makeSet(page, 'Input', variants, [
    { name: 'Label',       type: 'TEXT', default: 'Label' },
    { name: 'Placeholder', type: 'TEXT', default: 'Enter value…' },
    { name: 'Helper Text', type: 'TEXT', default: '' },
    { name: 'Error',       type: 'TEXT', default: '' },
    { name: 'Required',    type: 'BOOLEAN', default: false },
  ]), 'Input')
}

function buildTextarea(page) {
  const fills = { Default: T.white, Focus: T.white, Error: T.white, Disabled: T.ghost }
  const texts  = { Default: T.charcoal, Focus: T.navy, Error: T.red, Disabled: T.silver }
  const variants = ['Default','Focus','Error','Disabled'].map(s => ({
    name: `State=${s}`, fill: fills[s], w: 320, h: 100, tc: texts[s],
  }))
  placeSet(page, makeSet(page, 'Textarea', variants, [
    { name: 'Label',       type: 'TEXT',    default: 'Label' },
    { name: 'Placeholder', type: 'TEXT',    default: 'Enter text…' },
    { name: 'Helper Text', type: 'TEXT',    default: '' },
    { name: 'Error',       type: 'TEXT',    default: '' },
    { name: 'Required',    type: 'BOOLEAN', default: false },
    { name: 'No Resize',   type: 'BOOLEAN', default: false },
  ]), 'Textarea')
}

function buildSelect(page) {
  const fills = { Default: T.white, Focus: T.white, Error: T.white, Disabled: T.ghost }
  const texts  = { Default: T.charcoal, Focus: T.navy, Error: T.red, Disabled: T.silver }
  const sizeW = { sm: 200, md: 240, lg: 280 }
  const sizeH = { sm: 36, md: 44, lg: 52 }
  const variants = []
  for (const state of ['Default','Focus','Error','Disabled']) {
    for (const s of ['sm','md','lg']) {
      variants.push({ name: `State=${state}, Size=${s}`, fill: fills[state], w: sizeW[s], h: sizeH[s], tc: texts[state] })
    }
  }
  placeSet(page, makeSet(page, 'Select', variants, [
    { name: 'Label',       type: 'TEXT', default: 'Label' },
    { name: 'Placeholder', type: 'TEXT', default: 'Select option' },
    { name: 'Helper Text', type: 'TEXT', default: '' },
    { name: 'Error',       type: 'TEXT', default: '' },
    { name: 'Required',    type: 'BOOLEAN', default: false },
  ]), 'Select')
}

function buildCheckbox(page) {
  const fills = { Unchecked: T.white, Checked: T.navy, Indeterminate: T.navy, Disabled: T.ghost }
  const texts  = { Unchecked: T.charcoal, Checked: T.white, Indeterminate: T.white, Disabled: T.silver }
  const variants = ['Unchecked','Checked','Indeterminate','Disabled'].map(s => ({
    name: `State=${s}`, fill: fills[s], w: 168, h: 40, tc: texts[s], r: 4,
  }))
  placeSet(page, makeSet(page, 'Checkbox', variants, [
    { name: 'Label',       type: 'TEXT', default: 'Checkbox label' },
    { name: 'Helper Text', type: 'TEXT', default: '' },
    { name: 'Error',       type: 'TEXT', default: '' },
  ]), 'Checkbox')
}

function buildRadio(page) {
  const fills = { Unchecked: T.white, Checked: T.navy, Disabled: T.ghost }
  const texts  = { Unchecked: T.charcoal, Checked: T.white, Disabled: T.silver }
  const variants = ['Unchecked','Checked','Disabled'].map(s => ({
    name: `State=${s}`, fill: fills[s], w: 144, h: 40, tc: texts[s], r: 999,
  }))
  placeSet(page, makeSet(page, 'Radio', variants, [
    { name: 'Label', type: 'TEXT', default: 'Radio label' },
  ]), 'Radio')

  const groupVariants = ['Vertical','Horizontal'].map(o => ({
    name: `Orientation=${o}`, fill: T.ghost,
    w: o === 'Vertical' ? 168 : 360,
    h: o === 'Vertical' ? 128 : 40,
    tc: T.navy,
  }))
  placeSet(page, makeSet(page, 'Radio Group', groupVariants), 'Radio Group')
}

function buildSwitch(page) {
  const fills = { Off: T.silver, On: T.olive, Disabled: T.ghost }
  const texts  = { Off: T.charcoal, On: T.white, Disabled: T.silver }
  const sizeW = { sm: 104, md: 120, lg: 140 }
  const sizeH = { sm: 28,  md: 36,  lg: 44  }
  const variants = []
  for (const state of ['Off','On','Disabled']) {
    for (const s of ['sm','md','lg']) {
      variants.push({ name: `State=${state}, Size=${s}`, fill: fills[state], w: sizeW[s], h: sizeH[s], tc: texts[state], r: 999 })
    }
  }
  placeSet(page, makeSet(page, 'Switch', variants, [
    { name: 'Label',          type: 'TEXT', default: 'Switch label' },
    { name: 'Label Position', type: 'TEXT', default: 'right' },
  ]), 'Switch')
}

function buildCard(page) {
  const shadows = ['Flat','Raised','Elevated']
  const sizeW = { sm: 240, md: 320, lg: 400 }
  const sizeH = { sm: 160, md: 200, lg: 240 }
  const variants = []
  for (const shadow of shadows) {
    for (const s of ['sm','md','lg']) {
      variants.push({ name: `Shadow=${shadow}, Size=${s}`, fill: T.white, w: sizeW[s], h: sizeH[s], tc: T.navy, r: 12 })
    }
  }
  placeSet(page, makeSet(page, 'Card', variants, [
    { name: 'Interactive', type: 'BOOLEAN', default: false },
    { name: 'Has Header',  type: 'BOOLEAN', default: true  },
    { name: 'Has Footer',  type: 'BOOLEAN', default: false },
  ]), 'Card')
}

function buildAvatar(page) {
  const fills = { Primary: T.navy, Secondary: T.sand, Accent: T.olive, Neutral: T.silver }
  const texts  = { Primary: T.white, Secondary: T.navy, Accent: T.white, Neutral: T.white }
  const sizes  = { xs: 24, sm: 32, md: 40, lg: 48, xl: 56, xxl: 72 }
  const variants = []
  for (const [v, fill] of Object.entries(fills)) {
    for (const [s, dim] of Object.entries(sizes)) {
      variants.push({ name: `Variant=${v}, Size=${s}`, fill, w: dim, h: dim, tc: texts[v], r: 999 })
    }
  }
  placeSet(page, makeSet(page, 'Avatar', variants, [
    { name: 'Initials', type: 'TEXT', default: 'JD' },
    { name: 'Status',   type: 'TEXT', default: 'none' },
  ]), 'Avatar')

  const groupVariants = Object.entries(sizes).map(([s, dim]) => ({
    name: `Size=${s}`, fill: T.silver, w: dim * 3 + 16, h: dim + 4, tc: T.navy, r: 999,
  }))
  placeSet(page, makeSet(page, 'Avatar Group', groupVariants), 'Avatar Group')
}

function buildModal(page) {
  const sizeDims = { sm: [360,240], md: [480,320], lg: [640,420], xl: [800,520], Full: [960,600] }
  const variants = Object.entries(sizeDims).map(([s, [w, h]]) => ({
    name: `Size=${s}`, fill: T.white, w, h, tc: T.navy, r: 12,
  }))
  placeSet(page, makeSet(page, 'Modal', variants, [
    { name: 'Title',       type: 'TEXT',    default: 'Modal title' },
    { name: 'Description', type: 'TEXT',    default: '' },
    { name: 'Show Close',  type: 'BOOLEAN', default: true  },
    { name: 'Has Footer',  type: 'BOOLEAN', default: false },
  ]), 'Modal')
}

function buildTabs(page) {
  const variants = ['Underline','Pill'].map(v => ({
    name: `Variant=${v}`, fill: T.ghost, w: 320, h: 48, tc: T.navy, r: v === 'Pill' ? 999 : 0,
  }))
  placeSet(page, makeSet(page, 'Tabs', variants, [
    { name: 'Active Tab', type: 'TEXT', default: 'tab-1' },
  ]), 'Tabs')
}

function buildAlert(page) {
  const fills = { Info: T.blue, Success: T.green, Warning: T.amber, Danger: T.red, Neutral: T.silver }
  const texts  = { Info: T.white, Success: T.white, Warning: T.white, Danger: T.white, Neutral: T.charcoal }
  const variants = Object.entries(fills).map(([v, fill]) => ({
    name: `Variant=${v}`, fill, w: 380, h: 64, tc: texts[v], r: 8,
  }))
  placeSet(page, makeSet(page, 'Alert', variants, [
    { name: 'Title',       type: 'TEXT',    default: 'Alert title' },
    { name: 'Description', type: 'TEXT',    default: '' },
    { name: 'Closable',    type: 'BOOLEAN', default: false },
  ]), 'Alert')
}

function buildProgress(page) {
  const fills = { Accent: T.olive, Primary: T.navy, Success: T.green, Warning: T.amber, Danger: T.red }
  const sizeH = { sm: 4, md: 8, lg: 12 }
  const variants = []
  for (const [color, fill] of Object.entries(fills)) {
    for (const [s, h] of Object.entries(sizeH)) {
      variants.push({ name: `Color=${color}, Size=${s}`, fill, w: 280, h, tc: T.white, r: 999 })
    }
  }
  placeSet(page, makeSet(page, 'Progress', variants, [
    { name: 'Label',         type: 'TEXT',    default: '' },
    { name: 'Show Value',    type: 'BOOLEAN', default: false },
    { name: 'Indeterminate', type: 'BOOLEAN', default: false },
  ]), 'Progress')
}

function buildSpinner(page) {
  const fills = { Accent: T.olive, Primary: T.navy, Secondary: T.sand, White: T.silver, Current: T.charcoal }
  const sizeDim = { xs: 12, sm: 16, md: 24, lg: 32, xl: 40 }
  const variants = []
  for (const [color, fill] of Object.entries(fills)) {
    for (const [s, dim] of Object.entries(sizeDim)) {
      variants.push({ name: `Color=${color}, Size=${s}`, fill, w: dim, h: dim, tc: T.white, r: 999 })
    }
  }
  placeSet(page, makeSet(page, 'Spinner', variants, [
    { name: 'Label', type: 'TEXT', default: 'Loading…' },
  ]), 'Spinner')
}

function buildTooltip(page) {
  const variants = ['Top','Bottom','Left','Right'].map(p => ({
    name: `Position=${p}`, fill: T.navy, w: 120, h: 36, tc: T.white, r: 6,
  }))
  placeSet(page, makeSet(page, 'Tooltip', variants, [
    { name: 'Content',  type: 'TEXT',    default: 'Tooltip text' },
    { name: 'Disabled', type: 'BOOLEAN', default: false },
  ]), 'Tooltip')
}

function buildToast(page) {
  const fills = { Info: T.blue, Success: T.green, Warning: T.amber, Danger: T.red }
  const variants = Object.entries(fills).map(([v, fill]) => ({
    name: `Variant=${v}`, fill, w: 320, h: 64, tc: T.white, r: 8,
  }))
  placeSet(page, makeSet(page, 'Toast', variants, [
    { name: 'Title',       type: 'TEXT', default: 'Notification title' },
    { name: 'Description', type: 'TEXT', default: '' },
    { name: 'Position',    type: 'TEXT', default: 'top-right' },
  ]), 'Toast')
}

function buildLabel(page) {
  const states = ['Default','Required','Disabled']
  const texts  = { Default: T.navy, Required: T.navy, Disabled: T.silver }
  const variants = states.map(s => ({
    name: `State=${s}`, fill: T.ghost, w: 160, h: 32, tc: texts[s], r: 4,
  }))
  placeSet(page, makeSet(page, 'Label', variants, [
    { name: 'Text',     type: 'TEXT',    default: 'Field label' },
    { name: 'Hint',     type: 'TEXT',    default: '' },
    { name: 'Required', type: 'BOOLEAN', default: false },
    { name: 'Disabled', type: 'BOOLEAN', default: false },
  ]), 'Label')
}

function buildDivider(page) {
  const variants = [
    { name: 'Orientation=Horizontal', fill: T.silver, w: 320, h: 2,  tc: T.charcoal, r: 0 },
    { name: 'Orientation=Vertical',   fill: T.silver, w: 2,   h: 80, tc: T.charcoal, r: 0 },
  ]
  placeSet(page, makeSet(page, 'Divider', variants, [
    { name: 'Strong', type: 'BOOLEAN', default: false },
    { name: 'Label',  type: 'TEXT',    default: '' },
  ]), 'Divider')
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════
async function main() {
  await loadFonts()

  const page = figma.createPage()
  page.name = '🌿 krewtree components'
  await figma.setCurrentPageAsync(page)

  buildButton(page)
  buildBadge(page)
  buildInput(page)
  buildTextarea(page)
  buildSelect(page)
  buildCheckbox(page)
  buildRadio(page)
  buildSwitch(page)
  buildCard(page)
  buildAvatar(page)
  buildModal(page)
  buildTabs(page)
  buildAlert(page)
  buildProgress(page)
  buildSpinner(page)
  buildTooltip(page)
  buildToast(page)
  buildLabel(page)
  buildDivider(page)

  figma.viewport.scrollAndZoomIntoView(page.children)
  figma.closePlugin('✅ 19 krewtree component sets created on "🌿 krewtree components" page.')
}

main().catch(err => figma.closePlugin('❌ ' + (err instanceof Error ? err.message : String(err))))
