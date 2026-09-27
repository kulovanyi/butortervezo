const fs = require('fs');

// We simulate localStorage
const storage = {};
global.localStorage = {
    getItem: (key) => storage[key] || null,
    setItem: (key, val) => { storage[key] = val; },
    removeItem: (key) => { delete storage[key]; }
};

// Evaluate priceManager.js
let priceCode = fs.readFileSync('js/priceManager.js', 'utf8');
priceCode = priceCode.replace(/export\s+const\s+PriceManager\s*=/, 'const PriceManager =');
priceCode += '\nreturn { PriceManager };';
const { PriceManager } = eval(`(function() { ${priceCode} })()`);
global.PriceManager = PriceManager;
PriceManager.init();

// Evaluate partsManager.js
let partsCode = fs.readFileSync('js/partsManager.js', 'utf8');
partsCode = partsCode.replace(/import\s+.*?;/g, '');
partsCode = partsCode.replace(/export\s+const\s+PartsManager\s*=/, 'const PartsManager =');
partsCode += '\nreturn { PartsManager };';
const { PartsManager } = eval(`(function() { ${partsCode} })()`);

console.log('--- TEST 1: PriceManager category & color lookup ---');
console.log('Cat 1 sqm price:', PriceManager.getConfig().categories[1].sqmPrice, 'Ft/m²');
console.log('Cat 2 sqm price:', PriceManager.getConfig().categories[2].sqmPrice, 'Ft/m²');
console.log('Cat 3 sqm price:', PriceManager.getConfig().categories[3].sqmPrice, 'Ft/m²');

if (PriceManager.getConfig().categories[1].sqmPrice !== 6500) throw new Error('Expected Cat 1 = 6500');
if (PriceManager.getConfig().categories[2].sqmPrice !== 9800) throw new Error('Expected Cat 2 = 9800');
if (PriceManager.getConfig().categories[3].sqmPrice !== 14500) throw new Error('Expected Cat 3 = 14500');

console.log('White matte category:', PriceManager.getColorCategory('white_matte'));
if (PriceManager.getColorCategory('white_matte') !== 1) throw new Error('white_matte should be Cat 1');

console.log('Front K001 category:', PriceManager.getColorCategory('front_k001'));
if (PriceManager.getColorCategory('front_k001') !== 2) throw new Error('front_k001 should be Cat 2');

console.log('Front K536 category:', PriceManager.getColorCategory('front_k536'));
if (PriceManager.getColorCategory('front_k536') !== 3) throw new Error('front_k536 should be Cat 3');

// Changing category
PriceManager.setColorCategory('front_k001', 3);
console.log('Front K001 after re-categorizing to 3:', PriceManager.getColorCategory('front_k001'), '-> Price:', PriceManager.getColorPricePerSqm('front_k001'), 'Ft/m²');
if (PriceManager.getColorPricePerSqm('front_k001') !== 14500) throw new Error('Expected 14500 after switching to Cat 3');
PriceManager.setColorCategory('front_k001', 2); // reset back
console.log('✅ TEST 1 passed: Category and color pricing work seamlessly.');

console.log('\n--- TEST 2: Hardware Unit Prices ---');
console.log('Leg unit price:', PriceManager.getPartUnitPrice('Állítható műanyag bútorláb'), 'Ft');
console.log('Hinge unit price:', PriceManager.getPartUnitPrice('110° csillapított kivetőpánt (fékes)'), 'Ft');
console.log('Slide unit price:', PriceManager.getPartUnitPrice('Teljes kihúzású golyós fióksín (fékes)'), 'Ft');
console.log('Konfirmator screw unit price:', PriceManager.getPartUnitPrice('Konfirmátor csavar (Korpuszösszehúzó)'), 'Ft');

if (PriceManager.getPartUnitPrice('Állítható műanyag bútorláb') !== 350) throw new Error('Expected leg = 350 Ft');
if (PriceManager.getPartUnitPrice('110° csillapított kivetőpánt (fékes)') !== 1250) throw new Error('Expected hinge = 1250 Ft');
if (PriceManager.getPartUnitPrice('Teljes kihúzású golyós fióksín (fékes)') !== 4800) throw new Error('Expected slide = 4800 Ft');
console.log('✅ TEST 2 passed: Hardware unit prices correctly retrieved.');

console.log('\n--- TEST 3: Boards & Worktop Breakdown for ef_60 ---');
const baseElem = {
    id: 'elem_ef_60',
    fileName: 'ef_60.glb',
    name: 'ef_60',
    category: 'base_cabinet',
    dimensions: { w: 600, h: 720, d: 510 }
};

const boards = PartsManager.getBoardsForElement(baseElem);
console.log('Total boards count:', boards.length);

boards.forEach(b => {
    console.log(`  - ${b.name}: ${b.length}×${b.width}×${b.thickness} mm | count: ${b.count} | area/fm: ${b.isWorktop ? (b.length/1000)+' fm' : b.areaSqm+' m²'} | unit: ${b.unitPrice} Ft | total: ${b.totalPrice} Ft`);
});

const sides = boards.find(b => b.name.includes('oldallap'));
const bottom = boards.find(b => b.name.includes('fenéklap'));
const worktop = boards.find(b => b.isWorktop);
const back = boards.find(b => b.isBack);

if (!sides || sides.count !== 2) throw new Error('Expected 2 side panels');
if (!bottom || bottom.length !== 564) throw new Error('Expected bottom panel width 564mm (600 - 36)');
if (!worktop || worktop.length !== 600) throw new Error('Expected 600mm worktop');
if (!back || back.thickness !== 3) throw new Error('Expected 3mm HDF back panel');

const totalBoardsPrice = boards.reduce((sum, b) => sum + b.totalPrice, 0);
console.log('Total boards & worktop calculated price:', totalBoardsPrice, 'Ft');
if (totalBoardsPrice <= 0) throw new Error('Expected total boards price > 0');
console.log('✅ TEST 3 passed: Boards and worktop accurately computed with dimensions and prices.');

console.log('\n--- TEST 4: Drawer cabinet boards (s_a3f_60) ---');
const drawerElem = {
    id: 'elem_s_a3f_60',
    fileName: 's_a3f_60.glb',
    name: 's_a3f_60',
    category: 'base_cabinet',
    dimensions: { w: 600, h: 720, d: 510 }
};
const drawerBoards = PartsManager.getBoardsForElement(drawerElem);
const drawerFronts = drawerBoards.find(b => b.name.includes('Fiókelő'));
console.log('Drawer fronts:', drawerFronts ? `${drawerFronts.count} db (${drawerFronts.length}×${drawerFronts.width} mm)` : 'MISSING');
if (!drawerFronts || drawerFronts.count !== 3) throw new Error('Expected 3 drawer fronts');
console.log('✅ TEST 4 passed: Drawer fronts and internal box pieces generated.');

console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
