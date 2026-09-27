/**
 * Alkatrész- és Vasalatlista Menedzser (partsManager.js)
 * Kezeli a GLB és korpusz bútorok hardver / alkatrész igényeit:
 * - Állítható lábak és rögzítőcsavarok (4 lábhoz 4x4 csavar)
 * - Kivetőpántok és pánttalpak rögzítőcsavarokkal
 * - Fiókcsúszók és rögzítőcsavarok
 * - Összeépítő vasalatok (Konfirmátor csavar vs. Fa tipli + ragasztó vs. Minifix excenter)
 * - Fogantyúk, polctartók, függesztő vasalatok
 * - Szerkeszthető, bővíthető, törölhető, localStorage-ba menthető
 */

import { PriceManager } from './priceManager.js';

export const PartsManager = {
    STORAGE_KEY: 'butortervezo_parts_v1',

    // Mentett egyedi alkatrészlisták cache-je
    customPartsCache: null,

    // Hardver kategóriák
    CATEGORIES: {
        leg: { id: 'leg', name: 'Bútorláb', icon: '🦵' },
        hinge: { id: 'hinge', name: 'Kivetőpánt', icon: '🚪' },
        slide: { id: 'slide', name: 'Fióksín', icon: '🗄️' },
        joint: { id: 'joint', name: 'Összeépítő vasalat', icon: '⚙️' },
        screw: { id: 'screw', name: 'Rögzítőcsavar', icon: '🔩' },
        handle: { id: 'handle', name: 'Fogantyú', icon: '🤏' },
        shelf: { id: 'shelf', name: 'Polctartó', icon: '📏' },
        wall: { id: 'wall', name: 'Függesztő vasalat', icon: '🧱' },
        other: { id: 'other', name: 'Egyéb kellék', icon: '📦' }
    },

    /**
     * Cache betöltése a localStorage-ból
     */
    initCache() {
        if (this.customPartsCache !== null) return;
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            this.customPartsCache = raw ? JSON.parse(raw) : {};
        } catch (e) {
            console.warn('PartsManager: Nem sikerült betölteni a localStorage-ból:', e);
            this.customPartsCache = {};
        }
    },

    /**
     * Mentés a localStorage-ba
     */
    persistCache() {
        try {
            if (this.customPartsCache) {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.customPartsCache));
            }
        } catch (e) {
            console.error('PartsManager: Hiba a localStorage mentésekor:', e);
        }
    },

    /**
     * Egyedi kulcs képzése elem azonosítóhoz
     */
    getElementKey(elem) {
        if (!elem) return 'unknown';
        if (typeof elem === 'string') return elem.replace(/\.(glb|gltf)$/i, '');
        return elem.id || (elem.fileName ? elem.fileName.replace(/\.(glb|gltf)$/i, '') : (elem.name || 'unknown'));
    },

    /**
     * Alkatrészlista lekérése (mentett egyedi vagy alapértelmezett)
     */
    getPartsForElement(elem) {
        this.initCache();
        const key = this.getElementKey(elem);
        if (this.customPartsCache && this.customPartsCache[key]) {
            return JSON.parse(JSON.stringify(this.customPartsCache[key]));
        }
        return this.getDefaultPartsForElement(elem);
    },

    /**
     * Alkatrészlista mentése egy adott elemhez
     */
    savePartsForElement(elem, partsData) {
        this.initCache();
        const key = this.getElementKey(elem);
        this.customPartsCache[key] = {
            jointType: partsData.jointType || 'screw',
            items: partsData.items || [],
            updatedAt: new Date().toISOString()
        };
        this.persistCache();
        return this.customPartsCache[key];
    },

    /**
     * Visszaállítás alapértelmezettre
     */
    resetPartsForElement(elem) {
        this.initCache();
        const key = this.getElementKey(elem);
        if (this.customPartsCache && this.customPartsCache[key]) {
            delete this.customPartsCache[key];
            this.persistCache();
        }
        return this.getDefaultPartsForElement(elem);
    },

    /**
     * Alapértelmezett alkatrészlista számítása a GLB elem tulajdonságai alapján
     */
    getDefaultPartsForElement(elem, jointType = 'screw') {
        const key = this.getElementKey(elem);
        const fileName = (elem && elem.fileName) || (typeof elem === 'string' ? elem : '') || '';
        const name = (elem && elem.name) || fileName || '';
        const category = (elem && elem.category) || this.detectCategory(name, fileName);

        // Kinyerjük a szélességet a névből (pl. ef_60 -> 600mm, s_a1a1f_40 -> 400mm, s_asz4a1f_60_60 -> 600mm)
        const widthMatch = name.match(/_(\d{2,3})(?:_|$)/);
        const inferredWidth = widthMatch ? parseInt(widthMatch[1], 10) * (widthMatch[1].length === 2 ? 10 : 1) : 600;

        // Fiókok száma
        let drawerCount = 0;
        if (/3f/i.test(name)) drawerCount = 3;
        else if (/2f/i.test(name)) drawerCount = 2;
        else if (/1f/i.test(name) || /fs/i.test(name)) drawerCount = 1;

        // Ajtók száma
        let doorCount = 0;
        if (/a2/i.test(name)) doorCount = 2;
        else if (/a1/i.test(name)) doorCount = 1;
        else if (category === 'base_cabinet' && drawerCount === 0 && !/ny/i.test(name)) {
            doorCount = inferredWidth >= 700 ? 2 : 1;
        } else if (category === 'wall_cabinet') {
            doorCount = inferredWidth >= 700 ? 2 : 1;
        } else if (category === 'tall_cabinet') {
            doorCount = 2;
        }

        const isWall = (category === 'wall_cabinet' || category === 'hood_cabinet');
        const isTall = (category === 'tall_cabinet');
        const isBase = (!isWall && !isTall);

        const items = [];
        let idCounter = 1;
        const makeId = () => `part_${Date.now()}_${idCounter++}`;

        // 1. LÁBAK ÉS LÁBCSAVAROK (Alsó és Magas szekrényekhez)
        if (!isWall) {
            const legCount = inferredWidth >= 1000 ? 5 : 4;
            const legScrewsCount = legCount * 4; // 4 csavar lábanként

            items.push({
                id: makeId(),
                name: 'Állítható műanyag bútorláb',
                category: 'leg',
                qty: legCount,
                unit: 'db',
                note: `H: 100 mm (állítható: 95-125 mm), fekete korpuszláb`,
                removable: true
            });

            items.push({
                id: makeId(),
                name: 'Bútorláb rögzítő facsavar',
                category: 'screw',
                qty: legScrewsCount,
                unit: 'db',
                note: `3.5 × 16 mm süllyesztett fejű (${legCount} lábhoz, 4 db/láb)`,
                removable: true
            });

            items.push({
                id: makeId(),
                name: 'Lábazati rögzítőklipsz (szoknyatartó)',
                category: 'leg',
                qty: 2,
                unit: 'db',
                note: 'Lábazatléc / szokli felpattintásához a lábakra',
                removable: true
            });
        } else {
            // Felsőszekrény: Függesztő vasalat
            items.push({
                id: makeId(),
                name: 'Állítható felsőszekrény függesztő vasalat',
                category: 'wall',
                qty: 1,
                unit: 'pár',
                note: '3D állítású belső akasztó (jobbos + balos)',
                removable: true
            });

            items.push({
                id: makeId(),
                name: 'Fali függesztősín rögzítő dübel + kampós csavar',
                category: 'screw',
                qty: 2,
                unit: 'készlet',
                note: 'Ø 8 × 60 mm fali tipli + horganyzott csavar',
                removable: true
            });
        }

        // 2. KIVETŐPÁNTOK ÉS PÁNTSZÁRAK
        if (doorCount > 0) {
            // Magas szekrénynél 3-4 pánt/ajtó, normál szekrénynél 2 pánt/ajtó
            const hingesPerDoor = isTall ? 3 : 2;
            const totalHinges = doorCount * hingesPerDoor;
            const hingeScrews = totalHinges * 4; // 2 a talphoz, 2 a pántedényhez

            items.push({
                id: makeId(),
                name: '110° csillapított kivetőpánt (fékes)',
                category: 'hinge',
                qty: totalHinges,
                unit: 'db',
                note: `Beépített lágy záródású hidraulikus fékes pánt (${doorCount} ajtóhoz)`,
                removable: true
            });

            items.push({
                id: makeId(),
                name: 'Pánttalp (keresztlemez)',
                category: 'hinge',
                qty: totalHinges,
                unit: 'db',
                note: `H=0 mm magasságú excenteres szerelőtalp`,
                removable: true
            });

            items.push({
                id: makeId(),
                name: 'Kivetőpánt rögzítő facsavar',
                category: 'screw',
                qty: hingeScrews,
                unit: 'db',
                note: `3.5 × 16 mm süllyesztett (${totalHinges} pánthoz, 4 db/pánt)`,
                removable: true
            });
        }

        // 3. FIÓKSÍNEK ÉS RÖGZÍTŐIK
        if (drawerCount > 0) {
            const slideScrews = drawerCount * 8; // 4 csavar oldalanként = 8/pár

            items.push({
                id: makeId(),
                name: 'Teljes kihúzású golyós fióksín (fékes)',
                category: 'slide',
                qty: drawerCount,
                unit: 'pár',
                note: `L=500 mm (vagy korpuszméret szerint), soft-close fékes`,
                removable: true
            });

            items.push({
                id: makeId(),
                name: 'Fióksín rögzítő facsavar',
                category: 'screw',
                qty: slideScrews,
                unit: 'db',
                note: `3.5 × 16 mm Eurofejű / lencsefejű (${drawerCount} párhoz, 8 db/pár)`,
                removable: true
            });
        }

        // 4. FOGANTYÚK
        const handleCount = doorCount + drawerCount;
        if (handleCount > 0) {
            items.push({
                id: makeId(),
                name: 'Bútorfogantyú',
                category: 'handle',
                qty: handleCount,
                unit: 'db',
                note: 'Standard 128 mm vagy 160 mm furattávolságú fém fogantyú',
                removable: true
            });

            items.push({
                id: makeId(),
                name: 'Fogantyú rögzítő M4 csavar',
                category: 'screw',
                qty: handleCount * 2,
                unit: 'db',
                note: `M4 × 22 mm metrikus lencsefejű csavar (${handleCount} fogantyúhoz)`,
                removable: true
            });
        }

        // 5. BELSŐ POLCTARTÓK
        const shelfCount = isTall ? 3 : (isWall ? 2 : (doorCount > 0 ? 1 : 0));
        if (shelfCount > 0) {
            items.push({
                id: makeId(),
                name: 'Nikkelezett polctartó csap',
                category: 'shelf',
                qty: shelfCount * 4,
                unit: 'db',
                note: `Ø 5 mm fém csap (${shelfCount} polchoz, 4 db/polc)`,
                removable: true
            });
        }

        // 6. HÁTFAL RÖGZÍTŐ CSAVAROK / KAPCSOK
        items.push({
            id: makeId(),
            name: 'Hátfalrögzítő csavar alátéttel',
            category: 'screw',
            qty: isTall ? 40 : 24,
            unit: 'db',
            note: '3.0 × 20 mm hátfalcsavar peremes alátéttel HDF hátlaphoz',
            removable: true
        });

        // 7. KORPUSZ ÖSSZEÉPÍTŐ VASALAT (Joints)
        this.applyJointTypeToItems(items, jointType, isTall, makeId);

        return {
            jointType: jointType,
            items: items
        };
    },

    /**
     * Összeépítési mód alkalmazása a tételekre (Konfirmátor csavar vs. Fa tipli vs. Excenter)
     */
    applyJointTypeToItems(items, jointType, isTall, makeIdFn) {
        const makeId = makeIdFn || (() => `part_${Date.now()}_${Math.floor(Math.random() * 1000)}`);

        // Töröljük a meglévő összeépítő tételeket
        const filtered = items.filter(it => !it.isJointHardware);
        items.length = 0;
        items.push(...filtered);

        const konfirmatorCount = isTall ? 24 : 16;
        const dowelCount = isTall ? 32 : 20;
        const minifixCount = isTall ? 16 : 12;

        if (jointType === 'dowel') {
            // TIPLI ALAPÚ ÖSSZEÉPÍTÉS
            items.push({
                id: makeId(),
                name: 'Bordázott fa köldökcsap (Fa tipli)',
                category: 'joint',
                qty: dowelCount,
                unit: 'db',
                note: 'Ø 8 × 35 mm száraz bükkfa tipli korpuszkötéshez',
                isJointHardware: true,
                removable: true
            });

            items.push({
                id: makeId(),
                name: 'D3 vízálló faipari ragasztó (PVAc)',
                category: 'joint',
                qty: 1,
                unit: 'tubus',
                note: 'Gyorskötő expressz D3 faragasztó tiplikhez',
                isJointHardware: true,
                removable: true
            });
        } else if (jointType === 'minifix') {
            // MINIFIX / EXCENTERES ÖSSZEÉPÍTÉS
            items.push({
                id: makeId(),
                name: 'Minifix / Rastex excenter ház',
                category: 'joint',
                qty: minifixCount,
                unit: 'db',
                note: 'Ø 15 mm süllyeszthető cink excenter ház (18 mm laphoz)',
                isJointHardware: true,
                removable: true
            });

            items.push({
                id: makeId(),
                name: 'Minifix összekötő szár',
                category: 'joint',
                qty: minifixCount,
                unit: 'db',
                note: 'M6 menetes / Euro-menetes acél összekötő szár',
                isJointHardware: true,
                removable: true
            });

            items.push({
                id: makeId(),
                name: 'Bordázott fa köldökcsap (vezető tipli)',
                category: 'joint',
                qty: minifixCount,
                unit: 'db',
                note: 'Ø 8 × 35 mm fa tipli az elcsavarodás megakadályozására',
                isJointHardware: true,
                removable: true
            });
        } else {
            // KONFIRMÁTOR CSAVAROS (Alapértelmezett)
            items.push({
                id: makeId(),
                name: 'Konfirmátor csavar (Korpuszösszehúzó)',
                category: 'joint',
                qty: konfirmatorCount,
                unit: 'db',
                note: '7 × 50 mm horganyzott acél, 4 mm imbusz / SW4 nyílással',
                isJointHardware: true,
                removable: true
            });

            items.push({
                id: makeId(),
                name: 'Műanyag konfirmátor takarósapka',
                category: 'joint',
                qty: konfirmatorCount,
                unit: 'db',
                note: 'Pattintós takarófej a csavarfejek eltakarásához',
                isJointHardware: true,
                removable: true
            });
        }
    },

    /**
     * Kategória detektálása névből
     */
    detectCategory(name, fileName) {
        const full = `${name} ${fileName}`.toLowerCase();
        if (full.includes('wall') || full.includes('felso') || full.includes('f1a') || full.includes('f2a')) {
            return 'wall_cabinet';
        }
        if (full.includes('tall') || full.includes('pec') || full.includes('kamra') || full.includes('allo')) {
            return 'tall_cabinet';
        }
        return 'base_cabinet';
    },

    /**
     * Statisztika / összegzés az alkatrészlistáról
     */
    getSummary(partsList) {
        const items = (partsList && partsList.items) || [];
        let totalPieces = 0;
        const byCategory = {};

        items.forEach(it => {
            const qty = Number(it.qty) || 0;
            totalPieces += qty;
            const cat = it.category || 'other';
            byCategory[cat] = (byCategory[cat] || 0) + qty;
        });

        return {
            totalItems: items.length,
            totalPieces,
            byCategory
        };
    },

    /**
     * Bútorlapok és munkalap kinyerése / kiszámítása méretekkel, felülettel és árakkal
     */
    getBoardsForElement(elem, boardManager) {
        const boards = [];
        const targetId = elem ? (elem.id || elem.fileName) : null;
        let foundInScene = false;

        // 1. Megvizsgáljuk, hogy létezik-e lerakott bútorlap a 3D térben
        if (boardManager && boardManager.boards && targetId) {
            const sceneBoards = boardManager.boards.filter(b => {
                if (!b || !b.userData) return false;
                return b.userData.corpusId === targetId || b.userData.id === targetId || (b.userData.parentGroup && b.userData.parentGroup.userData && b.userData.parentGroup.userData.id === targetId);
            });

            if (sceneBoards.length > 0) {
                foundInScene = true;
                sceneBoards.forEach(b => {
                    const dimX = Math.round(Number(b.width) || 0);
                    const dimY = Math.round(Number(b.height) || 0);
                    const dimZ = Math.round(Number(b.depth) || Number(b.thickness) || 18);

                    let length = Math.max(dimX, dimY, dimZ);
                    let width = 0;
                    let thickness = Math.min(dimX, dimY, dimZ);
                    if (length === dimX) width = Math.max(dimY, dimZ);
                    else if (length === dimY) width = Math.max(dimX, dimZ);
                    else width = Math.max(dimX, dimY);

                    let type = 'corpus';
                    let isBack = false;
                    let isWorktop = false;

                    const bName = (b.name || '').toLowerCase();
                    if (b.type === 'worktop' || b.isWorktop || bName.includes('munkalap')) {
                        type = 'worktop';
                        isWorktop = true;
                    } else if (b.type === 'back' || b.isBack || bName.includes('hátfal') || thickness <= 4) {
                        type = 'back';
                        isBack = true;
                    } else if (b.type === 'door' || b.isDoor || bName.includes('ajtó')) {
                        type = 'door';
                    } else if (b.type === 'drawer' || b.isDrawer || bName.includes('fiók')) {
                        type = 'drawer';
                    } else if (b.type === 'shelf' || bName.includes('polc')) {
                        type = 'shelf';
                    }

                    const colorId = b.textureKey || (b.material && b.material.userData && b.material.userData.textureKey) || 'front_k001';
                    const colorCat = PriceManager ? PriceManager.getColorCategory(colorId) : 2;

                    const areaSqm = (length * width) / 1000000;
                    let unitPrice = 0;
                    let totalPrice = 0;

                    if (isWorktop) {
                        unitPrice = PriceManager ? PriceManager.getWorktopPrice(true) : 18000; // Ft / fm
                        totalPrice = Math.round((length / 1000) * unitPrice);
                    } else if (isBack) {
                        unitPrice = PriceManager ? PriceManager.getBackPanelPricePerSqm() : 2800; // Ft / m²
                        totalPrice = Math.round(areaSqm * unitPrice);
                    } else {
                        unitPrice = PriceManager ? PriceManager.getColorPricePerSqm(colorId) : 9800; // Ft / m²
                        totalPrice = Math.round(areaSqm * unitPrice);
                    }

                    boards.push({
                        name: b.name || 'Bútorlap',
                        type: type,
                        length: length,
                        width: width,
                        thickness: thickness,
                        count: 1,
                        areaSqm: Number(areaSqm.toFixed(3)),
                        colorId: colorId,
                        colorCategory: colorCat,
                        unitPrice: unitPrice,
                        totalPrice: totalPrice,
                        isWorktop: isWorktop,
                        isBack: isBack
                    });
                });
            }
        }

        // 2. Ha nincs a színtérben (vagy GLB modellként van a katalógusban), pontos konstrukciós számítás
        if (!foundInScene && elem) {
            const fileName = elem.fileName || '';
            const name = elem.name || fileName || 'Bútor';
            const category = elem.category || this.detectCategory(name, fileName);

            const widthMatch = name.match(/_(\d{2,3})(?:_|$)/);
            let totalW = widthMatch ? parseInt(widthMatch[1], 10) * (widthMatch[1].length === 2 ? 10 : 1) : 600;
            if (elem.dimensions && elem.dimensions.w) totalW = elem.dimensions.w;

            const isTall = (category === 'tall_cabinet');
            const isWall = (category === 'wall_cabinet' || category === 'hood_cabinet');
            const isBase = (!isTall && !isWall);

            const totalH = (elem.dimensions && elem.dimensions.h) ? elem.dimensions.h : (isTall ? 2000 : (isWall ? 600 : 720));
            const totalD = (elem.dimensions && elem.dimensions.d) ? elem.dimensions.d : (isWall ? 320 : 510);
            const thickness = 18;

            const baseColor = 'front_k001';
            const baseColorCat = PriceManager ? PriceManager.getColorCategory(baseColor) : 2;
            const sqmPrice = PriceManager ? PriceManager.getColorPricePerSqm(baseColor) : 9800;

            const addBoard = (bName, bType, len, wid, thk, count, cId, isWt = false, isBk = false) => {
                const area = (len * wid * count) / 1000000;
                let uPrice = sqmPrice;
                let tPrice = 0;
                const cCat = PriceManager ? PriceManager.getColorCategory(cId) : 2;

                if (isWt) {
                    uPrice = PriceManager ? PriceManager.getWorktopPrice(true) : 18000;
                    tPrice = Math.round((len / 1000) * uPrice * count);
                } else if (isBk) {
                    uPrice = PriceManager ? PriceManager.getBackPanelPricePerSqm() : 2800;
                    tPrice = Math.round(area * uPrice);
                } else {
                    uPrice = PriceManager ? PriceManager.getColorPricePerSqm(cId) : sqmPrice;
                    tPrice = Math.round(area * uPrice);
                }

                boards.push({
                    name: bName,
                    type: bType,
                    length: Math.round(len),
                    width: Math.round(wid),
                    thickness: thk,
                    count: count,
                    areaSqm: Number(area.toFixed(3)),
                    colorId: cId,
                    colorCategory: cCat,
                    unitPrice: uPrice,
                    totalPrice: tPrice,
                    isWorktop: isWt,
                    isBack: isBk
                });
            };

            // Oldallapok (2 db)
            addBoard('Korpusz oldallap (Jobb & Bal)', 'corpus', totalH, totalD, thickness, 2, baseColor);

            // Fenéklap (1 db)
            const innerW = totalW - 2 * thickness;
            addBoard('Korpusz fenéklap', 'corpus', innerW, totalD, thickness, 1, baseColor);

            // Tető / Hevederek
            if (isWall || isTall) {
                addBoard('Korpusz tetőlap', 'corpus', innerW, totalD, thickness, 1, baseColor);
            } else {
                addBoard('Első és hátsó hevederléc', 'corpus', innerW, 80, thickness, 2, baseColor);
            }

            // Hátfal (HDF 3mm)
            addBoard('HDF Hátfal lemez', 'back', totalH - 4, totalW - 4, 3, 1, 'white_matte', false, true);

            // Belső polcok
            const shelfCount = isTall ? 3 : (isWall ? 2 : 1);
            addBoard('Belső polclapon', 'shelf', innerW, totalD - 20, thickness, shelfCount, baseColor);

            // Ajtók / Fiókok
            let drawerCount = 0;
            if (/3f/i.test(name)) drawerCount = 3;
            else if (/2f/i.test(name)) drawerCount = 2;
            else if (/1f/i.test(name) || /fs/i.test(name)) drawerCount = 1;

            if (drawerCount > 0) {
                const frontH = Math.round((totalH - 4) / drawerCount) - 3;
                addBoard(`Fiókelő front (${drawerCount} db)`, 'door', totalW - 4, frontH, thickness, drawerCount, baseColor);
                // Fióktest káva lapok (oldalak, elő-hát, fenék)
                addBoard('Fióktest oldallapok', 'drawer', 500, frontH - 40, thickness, drawerCount * 2, 'white_matte');
                addBoard('Fióktest káva elő/hátlap', 'drawer', innerW - 30, frontH - 40, thickness, drawerCount * 2, 'white_matte');
            } else {
                const doorCount = (totalW >= 700 || /a2/i.test(name)) ? 2 : 1;
                const doorW = Math.round((totalW - (doorCount * 3)) / doorCount);
                addBoard(`Ajtófront (${doorCount} db)`, 'door', totalH - 4, doorW, thickness, doorCount, baseColor);
            }

            // Munkalap (alsó szekrénynél)
            if (isBase) {
                addBoard('Konyhai munkalap (38mm)', 'worktop', totalW, 600, 38, 1, 'wt_3025', true, false);
            }
        }

        return boards;
    }
};

