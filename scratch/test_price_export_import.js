// scratch/test_price_export_import.js
import { PriceManager } from '../js/priceManager.js';

// Mock localStorage for node environment
globalThis.localStorage = {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
    clear() { this._data = {}; }
};

console.log('--- 1. Testing PriceManager Initialization ---');
PriceManager.init();
const cfg = PriceManager.getConfig();
console.assert(cfg.categories[1].sqmPrice === 6500, 'Cat 1 initial price');
console.assert(cfg.categories[2].sqmPrice === 9800, 'Cat 2 initial price');
console.assert(cfg.categories[3].sqmPrice === 14500, 'Cat 3 initial price');
console.log('Init OK');

console.log('\n--- 2. Testing Add / Remove Color ---');
PriceManager.addColor({
    id: 'front_test_oak',
    name: 'Teszt Tölgy Fa',
    category: 3,
    type: 'front',
    color: '#a1887f'
});
console.assert(PriceManager.getColorCategory('front_test_oak') === 3, 'New color category should be 3');
console.assert(PriceManager.getColorPricePerSqm('front_test_oak') === 14500, 'New color price should match Cat 3');

PriceManager.removeColor('front_test_oak');
// Default fallback for unknown color is 2
console.assert(PriceManager.getColorCategory('front_test_oak') === 2, 'Deleted color should fallback to default 2');
console.log('Add/Remove Color OK');

console.log('\n--- 3. Testing Add / Remove Part ---');
PriceManager.addPart('Teszt Led Szalag Profil', 3200, 'fm');
console.assert(PriceManager.getPartUnitPrice('Teszt Led Szalag Profil') === 3200, 'New part price should be 3200');

PriceManager.removePart('Teszt Led Szalag Profil');
console.assert(PriceManager.getPartUnitPrice('Teszt Led Szalag Profil') === 150, 'Deleted part should fallback to default 150');
console.log('Add/Remove Part OK');

console.log('\n--- 4. Testing CSV Export ---');
const dummyTextures = {
    'front_k001': { name: 'Fehér Kőris', category: 'front', type: 'wood', color: '#f5f5f5' },
    'wt_3025': { name: 'Márvány Munkalap', category: 'worktop', type: 'stone', color: '#e0e0e0' }
};
const exportedCSV = PriceManager.exportToCSV(dummyTextures);
console.assert(exportedCSV.startsWith('\uFEFF'), 'CSV must start with UTF-8 BOM');
console.assert(exportedCSV.includes('Tipus;Azonosito;Megnevezes;Kategoria;Egyseg;Ar_HUF;Megjegyzes'), 'CSV header check');
console.assert(exportedCSV.includes('KategoriaAr;cat1;1. Kategória (Alap / Uni);1;m2;6500;Alap egyszínű lapok'), 'Cat1 row in CSV');
console.assert(exportedCSV.includes('Szin;front_k001;"Fehér Kőris";2;m2;9800;"wood"'), 'Color front_k001 in CSV');
console.assert(exportedCSV.includes('Vasalat;'), 'Vasalat rows present');
console.log('CSV Export OK, sample lines:');
console.log(exportedCSV.split('\r\n').slice(0, 6).join('\n'));

console.log('\n--- 5. Testing CSV Import with Price Update & Auto-Adding New Items ---');
const modifiedCSV = `\uFEFFTipus;Azonosito;Megnevezes;Kategoria;Egyseg;Ar_HUF;Megjegyzes\r
KategoriaAr;cat1;1. Kategória (Alap / Uni);1;m2;7200;Modositott ár\r
MunkalapAr;worktop;Konyhai Munkalap;Munkalap;fm;19500;Modositott munkalap\r
Szin;front_k001;"Fehér Kőris";3;m2;14500;"wood"\r
Szin;front_vadonat_uj;"Vadonat Új Antracit";1;m2;7200;"egyedi_szin"\r
Vasalat;part_custom1;"Rejtett Push-Open Lökőke";Vasalat;db;1850;"Hardver"\r
Vasalat;part_ex1;"Állítható műanyag bútorláb";Vasalat;db;420;"Hardver"\r
`;

const newlyCreatedMaterials = [];
const importResult = PriceManager.importFromCSV(modifiedCSV, (id, name) => {
    newlyCreatedMaterials.push({ id, name });
});

console.log('Import result:', importResult);
console.assert(importResult.success === true, 'Import must succeed');
console.assert(importResult.updatedCount >= 4, 'Updated count check');
console.assert(importResult.addedCount === 2, 'Should have added 2 new items (1 new color + 1 new hardware)');

// Verify updated items
console.assert(PriceManager.getConfig().categories[1].sqmPrice === 7200, 'Cat 1 sqmPrice updated to 7200');
console.assert(PriceManager.getConfig().worktop.perMeter === 19500, 'Worktop perMeter updated to 19500');
console.assert(PriceManager.getColorCategory('front_k001') === 3, 'front_k001 moved to category 3');
console.assert(PriceManager.getPartUnitPrice('Állítható műanyag bútorláb') === 420, 'Existing hardware price updated to 420');

// Verify auto-added new items
console.assert(PriceManager.getColorCategory('front_vadonat_uj') === 1, 'Auto-added color registered in Cat 1');
console.assert(newlyCreatedMaterials.some(m => m.id === 'front_vadonat_uj'), 'New material callback fired');
console.assert(PriceManager.getPartUnitPrice('Rejtett Push-Open Lökőke') === 1850, 'Auto-added hardware registered with price 1850');

console.log('All CSV Export, Import & Auto-Add assertions PASSED! 🎉');
