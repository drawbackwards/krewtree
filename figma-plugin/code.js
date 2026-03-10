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

  if (w >= 24 && h >= 16) {
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
  }
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

// ══════════════════════════════════════════════════════════════════════════════
// SITE PAGES BUILDER
// ══════════════════════════════════════════════════════════════════════════════

// ── Site brand tokens (separate from component T object) ──────────────────────
const C = {
  navy900:  { r: 0.039, g: 0.137, b: 0.176 }, // #0A232D
  navy950:  { r: 0.024, g: 0.082, b: 0.110 }, // footer ~#06151C
  sand50:   { r: 0.980, g: 0.976, b: 0.965 }, // very light sand
  sand200:  { r: 0.918, g: 0.898, b: 0.847 }, // light sand border
  sand300:  { r: 0.898, g: 0.855, b: 0.765 }, // medium-light sand text
  sand400:  { r: 0.878, g: 0.824, b: 0.706 }, // accent sand
  olive:    { r: 0.427, g: 0.459, b: 0.192 }, // #6D7531
  white:    { r: 1,     g: 1,     b: 1     },
  bgSubtle: { r: 0.965, g: 0.965, b: 0.965 }, // off-white alternating sections
  border:   { r: 0.878, g: 0.878, b: 0.878 },
  textDark: { r: 0.098, g: 0.098, b: 0.098 },
  textMute: { r: 0.502, g: 0.502, b: 0.502 },
  grey100:  { r: 0.941, g: 0.941, b: 0.941 },
  blue:     { r: 0.196, g: 0.435, b: 0.875 },
}

// ── AutoLayout frame factories ────────────────────────────────────────────────
function vFrame(opts) {
  opts = opts || {}
  const f = figma.createFrame()
  f.layoutMode = 'VERTICAL'
  f.primaryAxisSizingMode  = (opts.fixedH || opts.h) ? 'FIXED' : 'AUTO'
  f.counterAxisSizingMode  = opts.fixedW ? 'FIXED' : 'AUTO'
  if (opts.w) f.resize(opts.w, opts.h || 40)
  if (opts.bg) f.fills = [{ type: 'SOLID', color: opts.bg }]
  else f.fills = []
  f.paddingTop    = opts.pt != null ? opts.pt : (opts.py != null ? opts.py : (opts.p != null ? opts.p : 0))
  f.paddingBottom = opts.pb != null ? opts.pb : (opts.py != null ? opts.py : (opts.p != null ? opts.p : 0))
  f.paddingLeft   = opts.pl != null ? opts.pl : (opts.px != null ? opts.px : (opts.p != null ? opts.p : 0))
  f.paddingRight  = opts.pr != null ? opts.pr : (opts.px != null ? opts.px : (opts.p != null ? opts.p : 0))
  f.itemSpacing   = opts.gap != null ? opts.gap : 0
  f.primaryAxisAlignItems = opts.justify || 'MIN'
  f.counterAxisAlignItems = opts.align   || 'MIN'
  f.clipsContent  = false
  if (opts.r) f.cornerRadius = opts.r
  if (opts.stroke) {
    f.strokes = [{ type: 'SOLID', color: opts.stroke }]
    f.strokeWeight = opts.strokeW || 1
    f.strokeAlign  = 'INSIDE'
  }
  return f
}

function hFrame(opts) {
  const f = vFrame(opts)
  f.layoutMode = 'HORIZONTAL'
  return f
}

// ── Text node factory ─────────────────────────────────────────────────────────
function siteText(str, opts) {
  opts = opts || {}
  const t = figma.createText()
  t.fontName   = { family: 'Inter', style: opts.style || 'Regular' }
  t.characters = String(str)
  t.fontSize   = opts.size  || 14
  t.fills      = [{ type: 'SOLID', color: opts.color || C.textDark, opacity: opts.opacity != null ? opts.opacity : 1 }]
  if (opts.align) t.textAlignHorizontal = opts.align
  if (opts.lh)    t.lineHeight    = { unit: 'PIXELS', value: opts.lh }
  if (opts.ls)    t.letterSpacing = { unit: 'PIXELS', value: opts.ls }
  t.textAutoResize = 'HEIGHT'
  if (opts.fill)  t.layoutSizingHorizontal = 'FILL'
  if (opts.maxW)  t.textAutoResize = 'HEIGHT'
  return t
}

// ── Rect factory ──────────────────────────────────────────────────────────────
function siteRect(w, h, color, r) {
  const rect = figma.createRectangle()
  rect.resize(w, h)
  rect.fills = [{ type: 'SOLID', color: color }]
  if (r != null) rect.cornerRadius = r
  return rect
}

// ── Append helper ─────────────────────────────────────────────────────────────
function addAll(parent, children) {
  children.forEach(function(c) { parent.appendChild(c) })
}

// ── Fill-width helper: marks child to fill parent ────────────────────────────
function fillW(node) {
  node.layoutSizingHorizontal = 'FILL'
  return node
}

// ── SECTION: Navbar ───────────────────────────────────────────────────────────
function buildSiteNavbar() {
  const bar = hFrame({ w: 1440, h: 72, fixedH: true, fixedW: true, bg: C.navy900, px: 48, gap: 0, justify: 'SPACE_BETWEEN', align: 'CENTER' })
  bar.name = 'Navbar'

  const logo = siteText('krewtree', { style: 'Bold', size: 20, color: C.sand400 })
  bar.appendChild(logo)

  const navLinks = hFrame({ gap: 32, align: 'CENTER' })
  navLinks.name = 'nav-links'
  const links = ['Jobs', 'Companies', 'How It Works', 'Sign In']
  links.forEach(function(l) {
    const t = siteText(l, { size: 14, color: C.sand300, opacity: 0.7 })
    navLinks.appendChild(t)
  })

  const ctaBtn = hFrame({ bg: C.olive, r: 8, px: 20, py: 10, align: 'CENTER', justify: 'CENTER' })
  ctaBtn.name = 'Get Started'
  ctaBtn.appendChild(siteText('Get Started', { style: 'Medium', size: 14, color: C.white }))

  const right = hFrame({ gap: 24, align: 'CENTER' })
  right.appendChild(navLinks)
  right.appendChild(ctaBtn)
  bar.appendChild(right)
  return bar
}

// ── SECTION: Hero ─────────────────────────────────────────────────────────────
function buildSiteHero() {
  const section = vFrame({ w: 1440, fixedW: true, bg: C.white, py: 80, px: 120, gap: 48, align: 'CENTER' })
  section.name = 'Hero'

  // Header
  const header = vFrame({ gap: 16, align: 'CENTER' })
  header.name = 'hero-header'
  const badge = hFrame({ bg: C.olive, r: 999, px: 14, py: 6, gap: 6, align: 'CENTER' })
  badge.appendChild(siteText('● Regulix Partner Platform', { style: 'Medium', size: 12, color: C.white }))
  const h1 = siteText('What brings you to krewtree?', { style: 'Bold', size: 48, color: C.textDark, align: 'CENTER', ls: -1.5, lh: 54 })
  const sub = siteText('The job board built for real work — pick your path below.', { size: 18, color: C.textMute, align: 'CENTER' })
  addAll(header, [badge, h1, sub])
  section.appendChild(header)

  // Two path cards
  const cardsRow = hFrame({ gap: 20, align: 'MIN' })
  cardsRow.name = 'path-cards'

  // Worker card (navy)
  const workerCard = vFrame({ w: 520, bg: C.navy900, r: 16, p: 48, gap: 20, stroke: C.navy900 })
  workerCard.name = 'Worker Card'
  const wEmoji   = siteText('👷', { size: 32 })
  const wBadge   = hFrame({ bg: C.olive, r: 999, px: 12, py: 5 })
  wBadge.appendChild(siteText('For Workers', { style: 'Medium', size: 12, color: C.white }))
  const wH2      = siteText('I\'m looking\nfor work', { style: 'Bold', size: 32, color: C.sand300, lh: 36, ls: -0.5 })
  const wBody    = siteText('Browse thousands of verified hourly jobs. Build your profile and get Regulix-certified to get hired the same day.', { size: 15, color: C.sand300, opacity: 0.55, lh: 24 })
  const wList    = vFrame({ gap: 10 })
  const wChecks  = ['Browse 12,400+ live jobs', 'Build a verified work profile', 'Get Regulix Ready — hire same day']
  wChecks.forEach(function(item) {
    const row = hFrame({ gap: 10, align: 'CENTER' })
    row.appendChild(siteText('✓', { style: 'Bold', size: 13, color: C.olive }))
    row.appendChild(siteText(item, { size: 13, color: C.sand300, opacity: 0.65 }))
    wList.appendChild(row)
  })
  const wBtn = hFrame({ bg: C.olive, r: 8, px: 24, py: 12, align: 'CENTER', justify: 'CENTER' })
  wBtn.appendChild(siteText('Browse Jobs →', { style: 'Bold', size: 15, color: C.white }))
  addAll(workerCard, [wEmoji, wBadge, wH2, wBody, wList, wBtn])

  // Company card (sand)
  const companyCard = vFrame({ w: 520, bg: C.sand50, r: 16, p: 48, gap: 20, stroke: C.sand200 })
  companyCard.name = 'Company Card'
  const cEmoji  = siteText('🏢', { size: 32 })
  const cBadge  = hFrame({ bg: C.navy900, r: 999, px: 12, py: 5 })
  cBadge.appendChild(siteText('For Companies', { style: 'Medium', size: 12, color: C.white }))
  const cH2     = siteText('I\'m looking\nto hire', { style: 'Bold', size: 32, color: C.navy900, lh: 36, ls: -0.5 })
  const cBody   = siteText('Find pre-verified hourly workers ready to start immediately. No onboarding delays — hire same day with Regulix.', { size: 15, color: C.textMute, lh: 24 })
  const cList   = vFrame({ gap: 10 })
  const cChecks = ['Post jobs across every industry', 'Find Regulix Ready workers instantly', 'Hire same-day — no onboarding delays']
  cChecks.forEach(function(item) {
    const row = hFrame({ gap: 10, align: 'CENTER' })
    row.appendChild(siteText('✓', { style: 'Bold', size: 13, color: C.olive }))
    row.appendChild(siteText(item, { size: 13, color: C.textMute }))
    cList.appendChild(row)
  })
  const cBtn = hFrame({ bg: C.navy900, r: 8, px: 24, py: 12, align: 'CENTER', justify: 'CENTER' })
  cBtn.appendChild(siteText('Post a Job →', { style: 'Bold', size: 15, color: C.white }))
  addAll(companyCard, [cEmoji, cBadge, cH2, cBody, cList, cBtn])

  cardsRow.appendChild(workerCard)
  cardsRow.appendChild(companyCard)
  section.appendChild(cardsRow)

  // Stats row
  const stats = hFrame({ gap: 0, align: 'CENTER' })
  stats.name = 'stats'
  const statData = [['12,400+', 'Active Jobs'], ['54,000+', 'Workers'], ['620+', 'Verified Companies'], ['8', 'Industries']]
  statData.forEach(function(s, i) {
    const item = vFrame({ px: 32, py: 20, gap: 6, align: 'CENTER' })
    item.appendChild(siteText(s[0], { style: 'Bold', size: 30, color: C.textDark }))
    item.appendChild(siteText(s[1], { size: 13, color: C.textMute }))
    if (i < statData.length - 1) {
      item.strokes = [{ type: 'SOLID', color: C.border }]
      item.strokeWeight = 0
      // right border via separator rect
    }
    stats.appendChild(item)
    if (i < statData.length - 1) {
      stats.appendChild(siteRect(1, 60, C.border, 0))
    }
  })
  section.appendChild(stats)
  return section
}

// ── SECTION: Featured Jobs ────────────────────────────────────────────────────
function buildSiteFeaturedJobs() {
  const section = vFrame({ w: 1440, fixedW: true, bg: C.bgSubtle, py: 80, px: 120, gap: 32 })
  section.name = 'Featured Jobs'

  // Header row
  const headerRow = hFrame({ gap: 0, align: 'MIN', justify: 'SPACE_BETWEEN' })
  headerRow.name = 'section-header'
  fillW(headerRow)
  const headerLeft = vFrame({ gap: 8 })
  headerLeft.appendChild(siteText('Featured Jobs', { style: 'Bold', size: 28, color: C.textDark, ls: -0.3 }))
  headerLeft.appendChild(siteText('Hand-picked opportunities from verified employers.', { size: 16, color: C.textMute }))
  const browseBtn = hFrame({ bg: C.white, r: 8, px: 20, py: 10, align: 'CENTER', stroke: C.border })
  browseBtn.appendChild(siteText('Browse All Jobs →', { style: 'Medium', size: 14, color: C.navy900 }))
  headerRow.appendChild(headerLeft)
  headerRow.appendChild(browseBtn)
  section.appendChild(headerRow)

  // Job cards row
  const cardsRow = hFrame({ gap: 20 })
  cardsRow.name = 'job-cards'

  const jobs = [
    { title: 'Heavy Equipment Operator', company: 'BuildRight Corp', industry: 'Construction', type: 'Full-time', pay: '$28/hr', location: 'Denver, CO', skills: ['Excavator', 'Safety Cert', 'Forklift', 'OSHA 10'] },
    { title: 'Warehouse Associate', company: 'FlowLogix Inc', industry: 'Warehouse', type: 'Full-time', pay: '$19/hr', location: 'Phoenix, AZ', skills: ['Forklift', 'Inventory', 'Packing', 'RF Scanner'] },
    { title: 'HVAC Technician', company: 'CoolFlow Services', industry: 'Trades', type: 'Contract', pay: '$35/hr', location: 'Austin, TX', skills: ['EPA 608', 'Refrigerants', 'Diagnostics', 'CAC Systems'] },
  ]

  jobs.forEach(function(job) {
    const card = vFrame({ w: 360, bg: C.white, r: 12, p: 24, gap: 16, stroke: C.border })
    card.name = job.title

    // Card header
    const cardHeader = hFrame({ gap: 16, align: 'MIN' })
    const logo = hFrame({ w: 48, h: 48, fixedH: true, bg: C.grey100, r: 8, align: 'CENTER', justify: 'CENTER' })
    logo.resize(48, 48)
    logo.appendChild(siteText(job.company.slice(0, 2).toUpperCase(), { style: 'Bold', size: 13, color: C.textMute }))
    const titleCol = vFrame({ gap: 4 })
    titleCol.appendChild(siteText(job.title, { style: 'Bold', size: 16, color: C.textDark }))
    const companyRow = hFrame({ gap: 4, align: 'CENTER' })
    companyRow.appendChild(siteText(job.company, { size: 13, color: C.textMute }))
    companyRow.appendChild(siteText('✓', { size: 11, color: C.blue }))
    titleCol.appendChild(companyRow)
    const typeBadge = hFrame({ bg: C.grey100, r: 6, px: 10, py: 4 })
    typeBadge.appendChild(siteText(job.type, { style: 'Medium', size: 12, color: C.textMute }))
    cardHeader.appendChild(logo)
    cardHeader.appendChild(titleCol)
    cardHeader.appendChild(typeBadge)
    card.appendChild(cardHeader)

    // Meta row
    const meta = hFrame({ gap: 12, align: 'CENTER' })
    meta.appendChild(siteText('📍 ' + job.location, { size: 13, color: C.textMute }))
    meta.appendChild(siteText('🏭 ' + job.industry, { size: 13, color: C.textMute }))
    card.appendChild(meta)

    // Skills
    const skillsRow = hFrame({ gap: 6 })
    job.skills.forEach(function(skill) {
      const pill = hFrame({ bg: C.bgSubtle, r: 999, px: 10, py: 4, stroke: C.border })
      pill.appendChild(siteText(skill, { style: 'Medium', size: 11, color: C.navy900 }))
      skillsRow.appendChild(pill)
    })
    card.appendChild(skillsRow)

    // Footer
    const footer = hFrame({ gap: 0, align: 'CENTER', justify: 'SPACE_BETWEEN', pt: 16, stroke: C.border })
    fillW(footer)
    footer.strokes = [{ type: 'SOLID', color: C.border }]
    footer.strokeWeight = 1
    footer.strokeAlign  = 'INSIDE'
    const payText = siteText(job.pay, { style: 'Bold', size: 18, color: C.textDark })
    const applicants = siteText('24 applicants', { size: 12, color: C.textMute })
    footer.appendChild(payText)
    footer.appendChild(applicants)
    // top border separator
    const sep = siteRect(360, 1, C.border, 0)
    card.appendChild(sep)
    card.appendChild(footer)
    cardsRow.appendChild(card)
  })

  section.appendChild(cardsRow)
  return section
}

// ── SECTION: How It Works ─────────────────────────────────────────────────────
function buildSiteHowItWorks() {
  const section = vFrame({ w: 1440, fixedW: true, bg: C.white, py: 80, px: 120, gap: 64, align: 'CENTER' })
  section.name = 'How It Works'

  const header = vFrame({ gap: 12, align: 'CENTER' })
  header.appendChild(siteText('How krewtree Works', { style: 'Bold', size: 28, color: C.textDark, align: 'CENTER', ls: -0.3 }))
  header.appendChild(siteText('Three steps to your next job or your next great hire.', { size: 16, color: C.textMute, align: 'CENTER' }))
  section.appendChild(header)

  const stepsRow = hFrame({ gap: 0, align: 'MIN', justify: 'CENTER' })
  stepsRow.name = 'steps'

  const steps = [
    { n: '1', title: 'Create Your Profile', body: 'Sign up as a worker or employer and build your krewtree profile in minutes.' },
    { n: '2', title: 'Get Verified',         body: 'Complete Regulix verification for instant credibility with employers and workers.' },
    { n: '3', title: 'Start Working',        body: 'Match with jobs or workers same-day. No waiting, no delays — just real work.' },
  ]

  steps.forEach(function(step, i) {
    const col = vFrame({ w: 260, gap: 20, align: 'CENTER', px: 24 })
    col.name = 'Step ' + step.n

    const circle = hFrame({ w: 52, h: 52, fixedH: true, bg: C.navy900, r: 999, align: 'CENTER', justify: 'CENTER' })
    circle.resize(52, 52)
    circle.appendChild(siteText(step.n, { style: 'Bold', size: 18, color: C.sand400 }))

    const titleT = siteText(step.title, { style: 'Bold', size: 16, color: C.textDark, align: 'CENTER' })
    const bodyT  = siteText(step.body,  { size: 14, color: C.textMute, align: 'CENTER', lh: 22 })
    addAll(col, [circle, titleT, bodyT])
    stepsRow.appendChild(col)

    if (i < steps.length - 1) {
      const connector = vFrame({ w: 80, py: 0, align: 'CENTER', justify: 'CENTER' })
      connector.resize(80, 100)
      connector.primaryAxisSizingMode = 'FIXED'
      const line = siteRect(64, 2, C.border, 1)
      connector.appendChild(line)
      connector.primaryAxisAlignItems = 'CENTER'
      connector.counterAxisAlignItems = 'CENTER'
      stepsRow.appendChild(connector)
    }
  })

  section.appendChild(stepsRow)
  return section
}

// ── SECTION: Industries ───────────────────────────────────────────────────────
function buildSiteIndustries() {
  const section = vFrame({ w: 1440, fixedW: true, bg: C.bgSubtle, py: 80, px: 120, gap: 40, align: 'CENTER' })
  section.name = 'Industries'

  const header = vFrame({ gap: 12, align: 'CENTER' })
  header.appendChild(siteText('Browse by Industry', { style: 'Bold', size: 28, color: C.textDark, align: 'CENTER', ls: -0.3 }))
  header.appendChild(siteText('One account works across every industry.', { size: 16, color: C.textMute, align: 'CENTER' }))
  section.appendChild(header)

  const industries = [
    { icon: '🏗️', name: 'Construction',  jobs: '3,200' },
    { icon: '📦', name: 'Warehouse',      jobs: '2,800' },
    { icon: '🔧', name: 'Trades',         jobs: '1,900' },
    { icon: '🚛', name: 'Transport',      jobs: '1,650' },
    { icon: '🏭', name: 'Manufacturing',  jobs: '1,400' },
    { icon: '🌱', name: 'Agriculture',    jobs: '980'   },
    { icon: '🏨', name: 'Hospitality',    jobs: '870'   },
    { icon: '🛡️', name: 'Security',       jobs: '600'   },
  ]

  // Two rows of 4
  for (let row = 0; row < 2; row++) {
    const rowFrame = hFrame({ gap: 16 })
    rowFrame.name = 'industry-row-' + (row + 1)
    industries.slice(row * 4, row * 4 + 4).forEach(function(ind) {
      const btn = hFrame({ w: 240, bg: C.white, r: 12, px: 24, py: 20, gap: 14, align: 'CENTER', stroke: C.border })
      btn.name = ind.name
      btn.appendChild(siteText(ind.icon, { size: 28 }))
      const info = vFrame({ gap: 2 })
      info.appendChild(siteText(ind.name, { style: 'Bold', size: 15, color: C.textDark }))
      info.appendChild(siteText(ind.jobs + ' jobs', { size: 12, color: C.textMute }))
      btn.appendChild(info)
      rowFrame.appendChild(btn)
    })
    section.appendChild(rowFrame)
  }

  return section
}

// ── SECTION: CTA ──────────────────────────────────────────────────────────────
function buildSiteCTA() {
  const section = vFrame({ w: 1440, fixedW: true, bg: C.navy900, py: 80, px: 120, gap: 20, align: 'CENTER' })
  section.name = 'CTA'

  const badge = hFrame({ bg: C.olive, r: 999, px: 14, py: 6, gap: 6, align: 'CENTER' })
  badge.appendChild(siteText('● Regulix Verified Platform', { style: 'Medium', size: 12, color: C.white }))

  const h2   = siteText('Ready to build your krew?', { style: 'Bold', size: 40, color: C.sand300, align: 'CENTER', ls: -1, lh: 46 })
  const body = siteText('Join thousands of workers and employers already using krewtree to find faster, better matches — powered by Regulix.', { size: 18, color: C.sand300, opacity: 0.55, align: 'CENTER', lh: 29 })

  const btnRow = hFrame({ gap: 16, align: 'CENTER', justify: 'CENTER' })
  const btn1 = hFrame({ bg: C.sand300, r: 8, px: 28, py: 14, align: 'CENTER', justify: 'CENTER' })
  btn1.appendChild(siteText('Find Jobs Now', { style: 'Bold', size: 16, color: C.navy900 }))
  const btn2 = hFrame({ bg: C.olive, r: 8, px: 28, py: 14, align: 'CENTER', justify: 'CENTER' })
  btn2.appendChild(siteText('Post a Job', { style: 'Bold', size: 16, color: C.white }))
  btnRow.appendChild(btn1)
  btnRow.appendChild(btn2)

  addAll(section, [badge, h2, body, btnRow])
  return section
}

// ── SECTION: Footer ───────────────────────────────────────────────────────────
function buildSiteFooter() {
  const footer = hFrame({ w: 1440, fixedW: true, bg: C.navy950, py: 40, px: 48, gap: 0, justify: 'SPACE_BETWEEN', align: 'CENTER' })
  footer.name = 'Footer'
  footer.primaryAxisSizingMode = 'AUTO'

  const left = hFrame({ gap: 10, align: 'CENTER' })
  left.appendChild(siteText('krewtree', { style: 'Bold', size: 20, color: C.sand400 }))
  left.appendChild(siteText('· A Regulix Partner Platform', { size: 13, color: C.sand300, opacity: 0.3 }))

  const middle = hFrame({ gap: 24, align: 'CENTER' })
  const footLinks = ['About', 'Employers', 'Workers', 'Industries', 'Privacy', 'Terms']
  footLinks.forEach(function(l) {
    middle.appendChild(siteText(l, { size: 13, color: C.sand300, opacity: 0.4 }))
  })

  const right = siteText('© 2026 krewtree. All rights reserved.', { size: 13, color: C.sand300, opacity: 0.25 })

  footer.appendChild(left)
  footer.appendChild(middle)
  footer.appendChild(right)
  return footer
}

// ── Site main ─────────────────────────────────────────────────────────────────
async function mainSite() {
  await loadFonts()

  const page = figma.createPage()
  page.name = '🌿 krewtree site'
  await figma.setCurrentPageAsync(page)

  const frame = vFrame({ w: 1440, fixedW: true })
  frame.name = 'Landing Page — Desktop 1440'
  frame.fills = [{ type: 'SOLID', color: C.white }]
  page.appendChild(frame)

  const sections = [
    buildSiteNavbar(),
    buildSiteHero(),
    buildSiteFeaturedJobs(),
    buildSiteHowItWorks(),
    buildSiteIndustries(),
    buildSiteCTA(),
    buildSiteFooter(),
  ]

  sections.forEach(function(s) {
    s.layoutSizingHorizontal = 'FILL'
    frame.appendChild(s)
  })

  figma.viewport.scrollAndZoomIntoView([frame])
  figma.closePlugin('✅ Landing Page frame created on "🌿 krewtree site" page.')
}

// ══════════════════════════════════════════════════════════════════════════════
// COMMAND ROUTER
// ══════════════════════════════════════════════════════════════════════════════
if (figma.command === 'buildSite') {
  mainSite().catch(function(err) { figma.closePlugin('❌ ' + (err instanceof Error ? err.message : String(err))) })
} else {
  main().catch(function(err) { figma.closePlugin('❌ ' + (err instanceof Error ? err.message : String(err))) })
}
