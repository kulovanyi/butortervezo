const fs = require('fs');

// We simulate localStorage
const storage = {};
global.localStorage = {
    getItem: (key) => storage[key] || null,
    setItem: (key, val) => { storage[key] = val; },
    removeItem: (key) => { delete storage[key]; }
};

let priceCode = fs.readFileSync('js/priceManager.js', 'utf8');
priceCode = priceCode.replace(/export\s+const\s+PriceManager\s*=/, 'const PriceManager =');
priceCode += '\nreturn { PriceManager };';
const { PriceManager } = eval(`(function() { ${priceCode} })()`);
global.PriceManager = PriceManager;
PriceManager.init();

// Read partsManager.js and clean exports to evaluate in node
let partsCode = fs.readFileSync('js/partsManager.js', 'utf8');
partsCode = partsCode.replace(/import\s+.*?;/g, '');
partsCode = partsCode.replace(/export\s+const\s+PartsManager\s*=/, 'const PartsManager =');
partsCode += '\nmodule.exports = { PartsManager };';

const evalEnv = eval(`(function() { ${partsCode}; return { PartsManager }; })()`);
const PartsManager = evalEnv.PartsManager;

console.log('--- TEST 1: Default parts calculation for base cabinet (ef_60) ---');
const baseElem = {
    id: 'elem_ef_60',
    fileName: 'ef_60.glb',
    name: 'ef_60',
    category: 'base_cabinet'
};

const parts = PartsManager.getDefaultPartsForElement(baseElem);
console.log('Parts count:', parts.items.length);

const leg = parts.items.find(p => p.category === 'leg');
const legScrew = parts.items.find(p => p.name.includes('Bútorláb rögzítő facsavar'));
console.log('Legs:', leg ? `${leg.qty} ${leg.unit} (${leg.name})` : 'MISSING');
console.log('Leg screws:', legScrew ? `${legScrew.qty} ${legScrew.unit} (${legScrew.name})` : 'MISSING');

if (!leg || leg.qty !== 4) throw new Error('Expected 4 legs for ef_60');
if (!legScrew || legScrew.qty !== 16) throw new Error('Expected 16 leg screws (4x4) for ef_60');
console.log('✅ TEST 1 passed: 4 legs and 16 screws (4x4) correctly computed.');

console.log('\n--- TEST 2: Joint type switching (screw -> dowel / tipli -> minifix) ---');
console.log('Initial joint type:', parts.jointType);
const konfScrew = parts.items.find(p => p.name.includes('Konfirmátor csavar'));
console.log('Konfirmator csavar present:', !!konfScrew, konfScrew ? `${konfScrew.qty} db` : '');
if (!konfScrew) throw new Error('Expected konfirmator screw initially');

// Switch to dowel (tipli)
PartsManager.applyJointTypeToItems(parts.items, 'dowel', false);
parts.jointType = 'dowel';
const konfAfter = parts.items.find(p => p.name.includes('Konfirmátor csavar'));
const dowelItem = parts.items.find(p => p.name.includes('fa köldökcsap') || p.name.includes('tipli'));
const glueItem = parts.items.find(p => p.name.includes('ragasztó'));

console.log('After switch to dowel:');
console.log('  Konfirmator screw present:', !!konfAfter);
console.log('  Dowel (tipli) present:', !!dowelItem, dowelItem ? `${dowelItem.qty} ${dowelItem.unit} (${dowelItem.name})` : '');
console.log('  Glue present:', !!glueItem, glueItem ? `${glueItem.qty} ${glueItem.unit} (${glueItem.name})` : '');

if (konfAfter) throw new Error('Konfirmator screw should be removed in dowel mode');
if (!dowelItem || dowelItem.qty < 20) throw new Error('Expected at least 20 dowels');
if (!glueItem) throw new Error('Expected wood glue');
console.log('✅ TEST 2 passed: Dowel (tipli) mode correctly replaces screws with dowels and glue.');

console.log('\n--- TEST 3: Drawer cabinet with 3 drawers (s_a3f_60) ---');
const drawerElem = {
    id: 'elem_s_a3f_60',
    fileName: 's_a3f_60.glb',
    name: 's_a3f_60',
    category: 'base_cabinet'
};
const drawerParts = PartsManager.getDefaultPartsForElement(drawerElem);
const slide = drawerParts.items.find(p => p.category === 'slide');
const slideScrew = drawerParts.items.find(p => p.name.includes('Fióksín rögzítő'));
console.log('Slides:', slide ? `${slide.qty} ${slide.unit} (${slide.name})` : 'MISSING');
console.log('Slide screws:', slideScrew ? `${slideScrew.qty} ${slideScrew.unit} (${slideScrew.name})` : 'MISSING');
if (!slide || slide.qty !== 3) throw new Error('Expected 3 slide pairs');
if (!slideScrew || slideScrew.qty !== 24) throw new Error('Expected 24 slide screws (3x8)');
console.log('✅ TEST 3 passed: 3 drawer slides and 24 screws (3x8) correctly computed.');

console.log('\n--- TEST 4: Persistence (save, retrieve, reset) ---');
PartsManager.savePartsForElement(baseElem, parts);
const loaded = PartsManager.getPartsForElement(baseElem);
console.log('Loaded jointType from storage:', loaded.jointType);
if (loaded.jointType !== 'dowel') throw new Error('Failed to retrieve saved parts');

PartsManager.resetPartsForElement(baseElem);
const resetParts = PartsManager.getPartsForElement(baseElem);
console.log('Reset parts jointType:', resetParts.jointType);
if (resetParts.jointType !== 'screw') throw new Error('Failed to reset parts');
console.log('✅ TEST 4 passed: Save, retrieve, and reset work seamlessly with persistence.');

console.log('\n--- TEST 5: Summary Calculation ---');
const summary = PartsManager.getSummary(resetParts);
console.log('Summary:', summary);
if (summary.totalItems <= 0 || summary.totalPieces <= 0) throw new Error('Invalid summary');
console.log('✅ TEST 5 passed: Summary calculated accurately.');

console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
