/**
 * Központi Árlista és Színkategória Kezelő (priceManager.js)
 * Kezeli:
 * - 1-es, 2-es és 3-as színkategóriák m² árait
 * - Munkalap folyóméter és m² árakat
 * - Hátfal (HDF 3mm) m² árat
 * - Bútorlapszínek besorolását a kategóriákba
 * - Alkatrészek és vasalatok egységárait (Ft/db, Ft/pár stb.)
 * - Perzisztens mentést a localStorage-ba
 */

export const PriceManager = {
    STORAGE_KEY: 'butortervezo_prices_v1',

    // Alapértelmezett konfiguráció
    defaultConfig: {
        categories: {
            1: {
                id: 1,
                name: '1. Kategória',
                desc: 'Alap Uni színek (Fehér, Fekete, Szürke, Alap bútorlapok)',
                sqmPrice: 6500
            },
            2: {
                id: 2,
                name: '2. Kategória',
                desc: 'Standard faerezett színek (Tölgy, Bükk, Kőris, Dió standard)',
                sqmPrice: 9800
            },
            3: {
                id: 3,
                name: '3. Kategória',
                desc: 'Prémium faerezett, szinkronpórusos, akril & szupermatt lapok',
                sqmPrice: 14500
            }
        },
        worktop: {
            perMeter: 18000,   // Ft / folyóméter (standard 600mm széles munkalap)
            perSqm: 26000      // Ft / m²
        },
        backPanel: {
            sqmPrice: 2800     // Ft / m² (3mm fehér/szürke HDF hátfal)
        },
        edgeBanding: {
            perMeter: 450      // Ft / fm (0.4 - 2mm ABS élzárás gépi munkadíjjal)
        },
        // Színek besorolása kategóriákba (colorId -> categoryNumber: 1, 2, vagy 3)
        colorCategories: {
            'white_matte': 1,
            'front_3025': 2,
            'front_a865': 2,
            'front_k001': 2,
            'front_k002': 2,
            'front_k003': 2,
            'front_k004': 2,
            'front_k536': 3,
            'wt_3025': 2,
            'wt_4299': 2,
            'wt_k002': 2,
            'wt_k003': 2,
            'wt_k092': 2,
            'wt_k2738': 2,
            'wt_k367': 2,
            'wt_k536': 3,
            'wt_k551': 3,
            'wt_k552': 3,
            'wt_k553': 3,
            'wt_k756': 3,
            'wt_k758': 3,
            'wt_k820': 3,
            'stainless_steel': 3,
            'oven_black_glass': 3,
            'cooktop_glass': 3,
            'metal_chrome': 3
        },
        // Alkatrészek és vasalatok egységárai (Ft)
        partPrices: {
            'Állítható műanyag bútorláb': 350,
            'Bútorláb rögzítő facsavar': 12,
            'Lábazati rögzítőklipsz (szoknyatartó)': 180,
            '110° csillapított kivetőpánt (fékes)': 1250,
            'Pánttalp (keresztlemez)': 350,
            'Kivetőpánt rögzítő facsavar': 12,
            'Teljes kihúzású golyós fióksín (fékes)': 4800,
            'Fióksín rögzítő facsavar': 12,
            'Bútorfogantyú': 1600,
            'Fogantyú rögzítő M4 csavar': 45,
            'Nikkelezett polctartó csap': 65,
            'Hátfalrögzítő csavar alátéttel': 15,
            'Konfirmátor csavar (Korpuszösszehúzó)': 35,
            'Műanyag konfirmátor takarósapka': 15,
            'Bordázott fa köldökcsap (Fa tipli)': 12,
            'Bordázott fa köldökcsap (vezető tipli)': 12,
            'D3 vízálló faipari ragasztó (PVAc)': 1800,
            'Minifix / Rastex excenter ház': 120,
            'Minifix összekötő szár': 95,
            'Állítható felsőszekrény függesztő vasalat': 1450,
            'Fali függesztősín rögzítő dübel + kampós csavar': 450,
            'default_part': 150
        }
    },

    currentConfig: null,

    init() {
        if (this.currentConfig !== null) return;
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                this.currentConfig = {
                    ...this.defaultConfig,
                    ...parsed,
                    categories: { ...this.defaultConfig.categories, ...(parsed.categories || {}) },
                    colorCategories: { ...this.defaultConfig.colorCategories, ...(parsed.colorCategories || {}) },
                    partPrices: { ...this.defaultConfig.partPrices, ...(parsed.partPrices || {}) }
                };
            } else {
                this.currentConfig = JSON.parse(JSON.stringify(this.defaultConfig));
            }
        } catch (e) {
            console.warn('PriceManager: Hiba a konfiguráció betöltésekor:', e);
            this.currentConfig = JSON.parse(JSON.stringify(this.defaultConfig));
        }
    },

    persist() {
        try {
            if (this.currentConfig) {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.currentConfig));
            }
        } catch (e) {
            console.error('PriceManager: Nem sikerült menteni a localStorage-ba:', e);
        }
    },

    getConfig() {
        this.init();
        return this.currentConfig;
    },

    saveConfig(cfg) {
        this.currentConfig = JSON.parse(JSON.stringify(cfg));
        this.persist();
        return this.currentConfig;
    },

    resetToDefaults() {
        this.currentConfig = JSON.parse(JSON.stringify(this.defaultConfig));
        this.persist();
        return this.currentConfig;
    },

    /**
     * Színhez tartozó kategória száma (1, 2, vagy 3)
     */
    getColorCategory(colorId) {
        this.init();
        if (!colorId) return 1;
        const cleanId = String(colorId).toLowerCase();
        if (this.currentConfig.colorCategories[cleanId] !== undefined) {
            return this.currentConfig.colorCategories[cleanId];
        }
        if (cleanId.includes('white') || cleanId.includes('feher') || cleanId.includes('uni')) return 1;
        if (cleanId.includes('k536') || cleanId.includes('akril') || cleanId.includes('premium')) return 3;
        return 2; // Alapértelmezett: 2-es kategória faerezetekhez
    },

    /**
     * Szín kategóriájának beállítása (1, 2, vagy 3)
     */
    setColorCategory(colorId, catNum) {
        this.init();
        if (!colorId) return;
        this.currentConfig.colorCategories[String(colorId).toLowerCase()] = parseInt(catNum, 10) || 1;
        this.persist();
    },

    /**
     * Bútorlapszín m² egységára (HUF / m²)
     */
    getColorPricePerSqm(colorId) {
        this.init();
        const cat = this.getColorCategory(colorId);
        const catObj = this.currentConfig.categories[cat];
        return (catObj && catObj.sqmPrice) ? catObj.sqmPrice : 9800;
    },

    /**
     * Munkalap egységára (HUF / fm vagy HUF / m²)
     */
    getWorktopPrice(perMeter = true) {
        this.init();
        return perMeter ? this.currentConfig.worktop.perMeter : this.currentConfig.worktop.perSqm;
    },

    /**
     * Hátfal (HDF) m² egységára
     */
    getBackPanelPricePerSqm() {
        this.init();
        return this.currentConfig.backPanel.sqmPrice || 2800;
    },

    /**
     * Élzárás fm egységára
     */
    getEdgeBandingPricePerMeter() {
        this.init();
        return this.currentConfig.edgeBanding.perMeter || 450;
    },

    /**
     * Alkatrész / vasalat egységára név vagy kategória alapján
     */
    getPartUnitPrice(partName) {
        this.init();
        if (!partName) return this.currentConfig.partPrices['default_part'] || 150;

        // 1. Pontos egyezés
        if (this.currentConfig.partPrices[partName] !== undefined) {
            return this.currentConfig.partPrices[partName];
        }

        // 2. Részleges kulcsszavas keresés
        const pNameLower = partName.toLowerCase();
        for (const [key, price] of Object.entries(this.currentConfig.partPrices)) {
            if (pNameLower.includes(key.toLowerCase()) || key.toLowerCase().includes(pNameLower)) {
                return price;
            }
        }

        if (pNameLower.includes('lábcsavar') || pNameLower.includes('pántcsavar') || pNameLower.includes('fiókcsavar') || pNameLower.includes('3.5')) return 12;
        if (pNameLower.includes('láb')) return 350;
        if (pNameLower.includes('pánt') && !pNameLower.includes('talp')) return 1250;
        if (pNameLower.includes('talp')) return 350;
        if (pNameLower.includes('sín') || pNameLower.includes('fiók')) return 4800;
        if (pNameLower.includes('fogantyú') && !pNameLower.includes('csavar')) return 1600;
        if (pNameLower.includes('m4') || pNameLower.includes('fogantyú rögzítő')) return 45;
        if (pNameLower.includes('polctartó')) return 65;
        if (pNameLower.includes('hátfalcsavar') || pNameLower.includes('hátfalszeg')) return 15;
        if (pNameLower.includes('konfirmátor') && !pNameLower.includes('sapka')) return 35;
        if (pNameLower.includes('takarósapka')) return 15;
        if (pNameLower.includes('tipli') || pNameLower.includes('köldökcsap')) return 12;
        if (pNameLower.includes('ragasztó')) return 1800;
        if (pNameLower.includes('excenter') || pNameLower.includes('ház')) return 120;
        if (pNameLower.includes('szár')) return 95;
        if (pNameLower.includes('függesztő')) return 1450;
        if (pNameLower.includes('dübel') || pNameLower.includes('fali')) return 450;

        return this.currentConfig.partPrices['default_part'] || 150;
    },

    /**
     * Alkatrész egységár beállítása
     */
    setPartUnitPrice(partName, price) {
        this.init();
        this.currentConfig.partPrices[partName] = Math.max(0, parseInt(price, 10) || 0);
        this.persist();
    },

    /**
     * Kategória m² árának beállítása
     */
    setCategorySqmPrice(catNum, price) {
        this.init();
        if (this.currentConfig.categories[catNum]) {
            this.currentConfig.categories[catNum].sqmPrice = Math.max(0, parseInt(price, 10) || 0);
            this.persist();
        }
    },

    /**
     * Új szín hozzáadása
     */
    addColor(colorData) {
        this.init();
        if (!colorData || !colorData.id) return false;
        const id = String(colorData.id).trim().toLowerCase().replace(/\s+/g, '_');
        const cat = parseInt(colorData.category, 10) || 1;
        this.currentConfig.colorCategories[id] = cat;
        if (!this.currentConfig.customColors) this.currentConfig.customColors = {};
        this.currentConfig.customColors[id] = {
            id: id,
            name: colorData.name || id,
            category: cat,
            type: colorData.type || 'front',
            color: colorData.color || '#94a3b8'
        };
        this.persist();
        return true;
    },

    /**
     * Szín törlése
     */
    removeColor(colorId) {
        this.init();
        if (!colorId) return false;
        const id = String(colorId).trim().toLowerCase();
        delete this.currentConfig.colorCategories[id];
        if (this.currentConfig.customColors) {
            delete this.currentConfig.customColors[id];
        }
        this.persist();
        return true;
    },

    /**
     * Új alkatrész hozzáadása
     */
    addPart(partName, price, unit = 'db') {
        this.init();
        if (!partName) return false;
        const name = String(partName).trim();
        this.currentConfig.partPrices[name] = Math.max(0, parseInt(price, 10) || 0);
        if (!this.currentConfig.partUnits) this.currentConfig.partUnits = {};
        this.currentConfig.partUnits[name] = unit;
        this.persist();
        return true;
    },

    /**
     * Alkatrész törlése
     */
    removePart(partName) {
        this.init();
        if (!partName) return false;
        const name = String(partName).trim();
        delete this.currentConfig.partPrices[name];
        if (this.currentConfig.partUnits) {
            delete this.currentConfig.partUnits[name];
        }
        this.persist();
        return true;
    },

    /**
     * Teljes Árlista exportálása Excel-kompatibilis CSV formátumban (UTF-8 BOM, pontosvessző)
     */
    exportToCSV(allTextures = {}) {
        this.init();
        const cfg = this.currentConfig;
        let csv = '\uFEFF'; // UTF-8 BOM Excelhez
        csv += 'Tipus;Azonosito;Megnevezes;Kategoria;Egyseg;Ar_HUF;Megjegyzes\r\n';

        // 1. Kategória árak
        csv += `KategoriaAr;cat1;1. Kategória (Alap / Uni);1;m2;${cfg.categories[1].sqmPrice};Alap egyszínű lapok\r\n`;
        csv += `KategoriaAr;cat2;2. Kategória (Standard faerezett);2;m2;${cfg.categories[2].sqmPrice};Standard faerezetek\r\n`;
        csv += `KategoriaAr;cat3;3. Kategória (Prémium);3;m2;${cfg.categories[3].sqmPrice};Prémium és akril lapok\r\n`;
        csv += `MunkalapAr;worktop;Konyhai Munkalap;Munkalap;fm;${cfg.worktop.perMeter};38mm konyhai munkalap\r\n`;
        csv += `HatfalAr;back;HDF Hátfal lemez;Hatfal;m2;${cfg.backPanel.sqmPrice};3mm lakkozott hátlap\r\n`;
        csv += `ElzarasAr;edge;ABS Élzárás;Elzaras;fm;${cfg.edgeBanding.perMeter};0.4 - 2mm ABS élzárás\r\n`;

        // 2. Színek
        const exportedColors = new Set();
        for (const [tKey, tex] of Object.entries(allTextures || {})) {
            const cat = this.getColorCategory(tKey);
            const isWorktop = (tex.category === 'worktop' || tKey.startsWith('wt_'));
            const unit = isWorktop ? 'fm' : 'm2';
            const price = isWorktop ? cfg.worktop.perMeter : (cfg.categories[cat]?.sqmPrice || 9800);
            const name = (tex.name || tKey).replace(/;/g, ',');
            csv += `Szin;${tKey};"${name}";${cat};${unit};${price};"${tex.type || 'wood'}"\r\n`;
            exportedColors.add(tKey);
        }
        for (const [cKey, cat] of Object.entries(cfg.colorCategories || {})) {
            if (!exportedColors.has(cKey)) {
                const isWorktop = cKey.startsWith('wt_');
                const unit = isWorktop ? 'fm' : 'm2';
                const price = isWorktop ? cfg.worktop.perMeter : (cfg.categories[cat]?.sqmPrice || 9800);
                const customName = cfg.customColors && cfg.customColors[cKey] ? cfg.customColors[cKey].name : cKey;
                csv += `Szin;${cKey};"${customName}";${cat};${unit};${price};"egyedi_szin"\r\n`;
                exportedColors.add(cKey);
            }
        }

        // 3. Vasalatok és alkatrészek
        for (const [pName, price] of Object.entries(cfg.partPrices || {})) {
            if (pName === 'default_part') continue;
            let unit = 'db';
            const lower = pName.toLowerCase();
            if (lower.includes('sín') || lower.includes('függesztő')) unit = 'pár';
            else if (lower.includes('ragasztó')) unit = 'tubus';
            else if (lower.includes('dübel') || lower.includes('készlet')) unit = 'készlet';
            if (cfg.partUnits && cfg.partUnits[pName]) unit = cfg.partUnits[pName];

            const safeName = pName.replace(/;/g, ',');
            csv += `Vasalat;part_${Math.abs(this.hashCode(pName))};"${safeName}";Vasalat;${unit};${price};"Hardver"\r\n`;
        }

        return csv;
    },

    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0;
        }
        return hash;
    },

    /**
     * Excel / CSV beolvasása, meglévők frissítése és új elemek hozzáadása
     */
    importFromCSV(csvText, onNewMaterialCallback) {
        this.init();
        if (!csvText) return { success: false, message: 'Üres fájl.' };

        const lines = csvText.split(/\r?\n/);
        let updatedCount = 0;
        let addedCount = 0;
        const cfg = this.currentConfig;

        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('Tipus;') || trimmed.startsWith('Tipus,')) return;

            const delim = trimmed.includes(';') ? ';' : ',';
            const parts = trimmed.split(delim).map(s => s.replace(/^"|"$/g, '').trim());

            if (parts.length < 6) return;

            const [type, id, name, category, unit, priceStr] = parts;
            const price = parseInt(priceStr, 10);

            if (type === 'KategoriaAr') {
                if (id === 'cat1' && !isNaN(price)) { cfg.categories[1].sqmPrice = price; updatedCount++; }
                else if (id === 'cat2' && !isNaN(price)) { cfg.categories[2].sqmPrice = price; updatedCount++; }
                else if (id === 'cat3' && !isNaN(price)) { cfg.categories[3].sqmPrice = price; updatedCount++; }
            } else if (type === 'MunkalapAr') {
                if (!isNaN(price)) { cfg.worktop.perMeter = price; updatedCount++; }
            } else if (type === 'HatfalAr') {
                if (!isNaN(price)) { cfg.backPanel.sqmPrice = price; updatedCount++; }
            } else if (type === 'ElzarasAr') {
                if (!isNaN(price)) { cfg.edgeBanding.perMeter = price; updatedCount++; }
            } else if (type === 'Szin') {
                const colorId = (id || name).trim().toLowerCase().replace(/\s+/g, '_');
                const catNum = parseInt(category, 10) || 1;

                if (cfg.colorCategories[colorId] !== undefined) {
                    cfg.colorCategories[colorId] = catNum;
                    updatedCount++;
                } else {
                    // ÚJ SZÍN TALÁLVA! Hozzáadjuk az árlistához!
                    this.addColor({
                        id: colorId,
                        name: name || colorId,
                        category: catNum,
                        type: 'front',
                        color: '#94a3b8'
                    });
                    if (typeof onNewMaterialCallback === 'function') {
                        onNewMaterialCallback(colorId, name || colorId);
                    }
                    addedCount++;
                }
            } else if (type === 'Vasalat') {
                const partName = (name || id).trim();
                if (!isNaN(price)) {
                    if (cfg.partPrices[partName] !== undefined) {
                        cfg.partPrices[partName] = price;
                        updatedCount++;
                    } else {
                        // ÚJ VASALAT TALÁLVA! Hozzáadjuk!
                        this.addPart(partName, price, unit || 'db');
                        addedCount++;
                    }
                }
            }
        });

        this.persist();
        return {
            success: true,
            updatedCount: updatedCount,
            addedCount: addedCount
        };
    }
};
