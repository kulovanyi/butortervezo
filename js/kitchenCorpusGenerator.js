/**
 * Paraméteres Konyha Korpusz Generátor (kitchenCorpusGenerator.js)
 * Precíz mm-es konyhabútor korpuszok generálása egyedi összekötő-, hátfal-, lábazat-, szokli- és munkalap eltolásokkal.
 */

export class KitchenCorpusGenerator {
    /**
     * Standard alapértelmezett konyhai korpusz konfiguráció
     */
    static getDefaultConfig() {
        return {
            type: 'base', // 'base', 'wall', 'tall'

            // Korpusz fő befoglaló méretek (az oldallapok és fenéklap adják a fő méretet)
            width: 600,
            height: 720,      // Korpusz magassága lábak nélkül
            depth: 560,       // Korpusz mélysége (oldallapok mélysége)
            thickness: 18,    // Lapvastagság (korpusz)
            textureKey: 'front_k001',

            // Korpusz lekerekítés (mm)
            edgeRadius: 1,

            // 1. Oldallapok
            sides: {
                enabled: true
            },

            // 2. Alsó lap (Fenéklap)
            bottom: {
                enabled: true,
                placement: 'between', // 'between' (oldalak közé) vagy 'under' (oldalak alá)
                offsetFromGround: 0
            },

            // 3. Felső rész
            topType: 'stretchers', // 'stretchers' (összekötő lécek) vagy 'full_top' (teljes tetőlap)

            // Első összekötő léc
            frontStretcher: {
                enabled: true,
                width: 80,          // Léc szélessége
                orientation: 'flat', // 'flat' (fekvő) vagy 'vertical' (élre állított)
                insetFront: 0        // Mennyivel van beljebb a korpusz első síkjától (mm) - alapértelmezett: 0
            },

            // Hátsó összekötő léc
            backStretcher: {
                enabled: true,
                width: 80,
                orientation: 'flat', // 'flat' vagy 'vertical'
                insetBack: 0         // Mennyivel van beljebb a korpusz hátsó síkjától (mm) - alapértelmezett: 0
            },

            // Teljes tetőlap
            fullTop: {
                placement: 'between' // 'between' vagy 'on_top'
            },

            // 4. Hátfal
            backPanel: {
                enabled: true,
                thickness: 3,         // 3mm HDF vagy 18mm bútorlap
                type: 'surface',      // 'surface' (rászegelt kívülről), 'groove' (nútba ültetett), 'rabbet' (falcolt)
                gap: 2.5,             // 2.5 mm réshézag / peremvisszaállás
                height: null,         // Opcionális egyedi magasság (ha null, akkor H - 2*gap)
                offsetY: 0,           // Függőleges eltolás (mm)
                insetBack: 20,        // Hátfal bemélyesztése (nútosnál), felületi rászegelésnél a korpusz mögé kerül (-3mm)
                textureKey: 'white_matte'
            },

            // 5. Lábak
            legs: {
                enabled: true,
                height: 100,          // Láb magassága mm-ben
                diameter: 45,
                insetX: 50,
                insetZ: 50,
                count: 4
            },

            // 6. Szokli / Lábazati takaróléc
            plinth: {
                enabled: true,
                height: 100,
                thickness: 18,
                insetFront: 20,       // Mennyivel van beljebb a korpusz frontjától (lábtér - 20mm alapértelmezett)
                textureKey: 'front_k001'
            },

            // 7. Konyhai Munkalap
            worktop: {
                enabled: true,
                thickness: 38,        // 28mm vagy 38mm
                depth: 600,           // Munkalap teljes mélysége (mm)
                overhangFront: 25,    // Elülső túllógás a korpusz frontján túl (mm)
                overhangBack: 15,     // Hátsó túllógás a korpusz hátulján túl (mm)
                overhangLeft: 0,
                overhangRight: 0,
                edgeRadius: 3,        // 38mm-es munkalap 3mm lekerekítéssel
                textureKey: 'wt_3025',
                // Munkalap hátfal (fali panel / csempepótló)
                splashback: {
                    enabled: false,   // Bekapcsolható a varázslóban
                    height: 600,      // 60 cm (600 mm)
                    thickness: 5,     // 0.5 cm (5 mm mélység/vastagság)
                    textureKey: 'wt_3025'
                }
            },

            // 8. Belső Polcok
            shelves: {
                count: 1,
                thickness: 18,
                insetFront: 15
            },

            // 9. Dinamikusan hozzáadott Front Elemek & Készülékek (Ajtók, Fiókok, Beépíthető Sütő / Főzőlap)
            elements: []
        };
    }

    /**
     * Bútorlapok pontos geometriai generálása
     */
    static generateBoards(config) {
        const boards = [];
        const cfg = { ...this.getDefaultConfig(), ...config };

        const W = Number(cfg.width);
        const H = Number(cfg.height);
        const D = Number(cfg.depth);
        const Th = Number(cfg.thickness);
        const tex = cfg.textureKey || 'white_matte';
        const defaultRadius = cfg.edgeRadius !== undefined ? Number(cfg.edgeRadius) : 1;

        // Alap Y magasság (ha van láb, a korpusz a láb magasságától indul)
        const legH = (cfg.legs && cfg.legs.enabled) ? Number(cfg.legs.height) : 0;
        const corpusBaseY = legH;

        // ----------------------------------------------------
        // 1. OLDALFALAK (Bal és Jobb) - Fő mélységet adják (-D/2 .. +D/2)
        // ----------------------------------------------------
        if (cfg.sides && cfg.sides.enabled) {
            const sideH = (cfg.bottom.placement === 'under') ? (H - Th) : H;
            const sideY = (cfg.bottom.placement === 'under') ? (corpusBaseY + Th + sideH / 2) : (corpusBaseY + sideH / 2);

            // Bal oldalfal
            boards.push({
                name: 'Bal Korpusz Oldalfal',
                width: Th,
                height: sideH,
                depth: D,
                thickness: Th,
                type: 'vertical_side',
                textureKey: cfg.sides.textureKey || tex,
                x: -W / 2 + Th / 2,
                y: sideY,
                z: 0,
                edgeBanding: '0.4mm ABS'
            });

            // Jobb oldalfal
            boards.push({
                name: 'Jobb Korpusz Oldalfal',
                width: Th,
                height: sideH,
                depth: D,
                thickness: Th,
                type: 'vertical_side',
                textureKey: cfg.sides.textureKey || tex,
                x: W / 2 - Th / 2,
                y: sideY,
                z: 0,
                edgeBanding: '0.4mm ABS'
            });
        }

        // ----------------------------------------------------
        // 2. ALSÓ LAP (Fenéklap)
        // ----------------------------------------------------
        if (cfg.bottom && cfg.bottom.enabled) {
            const isBetween = cfg.bottom.placement === 'between';
            const bottomW = isBetween ? (W - 2 * Th) : W;
            const bottomY = corpusBaseY + Th / 2;

            boards.push({
                name: 'Fenéklap',
                width: bottomW,
                height: Th,
                depth: D,
                thickness: Th,
                type: 'horizontal',
                textureKey: tex,
                x: 0,
                y: bottomY,
                z: 0,
                edgeBanding: '0.4mm ABS'
            });
        }

        // ----------------------------------------------------
        // 3. FELSŐ RÉSZ: ÖSSZEKÖTŐK VAGY TELJES TETŐLAP
        // ----------------------------------------------------
        const innerW = W - 2 * Th;
        const topY_between = corpusBaseY + H - Th / 2;
        const topY_onTop = corpusBaseY + H + Th / 2;

        if (cfg.topType === 'full_top') {
            const isBetween = cfg.fullTop?.placement === 'between';
            const topW = isBetween ? innerW : W;
            const topY = isBetween ? topY_between : topY_onTop;

            boards.push({
                name: 'Tetőlap',
                width: topW,
                height: Th,
                depth: D,
                thickness: Th,
                type: 'horizontal',
                textureKey: tex,
                x: 0,
                y: topY,
                z: 0,
                edgeBanding: '0.4mm ABS'
            });
        } else {
            // ÖSSZEKÖTŐ LÉCEK (Alsószekrény)

            // Első összekötő léc
            if (cfg.frontStretcher && cfg.frontStretcher.enabled) {
                const fsW = Number(cfg.frontStretcher.width) || 80;
                const isFlat = cfg.frontStretcher.orientation !== 'vertical';
                const insetF = Number(cfg.frontStretcher.insetFront) || 0;

                const lHeight = isFlat ? Th : fsW;
                const lDepth = isFlat ? fsW : Th;
                const lY = isFlat ? topY_between : (corpusBaseY + H - fsW / 2);
                const lZ = (D / 2) - insetF - (lDepth / 2);

                boards.push({
                    name: 'Első Összekötő Léc',
                    width: innerW,
                    height: lHeight,
                    depth: lDepth,
                    thickness: Th,
                    type: 'horizontal',
                    textureKey: tex,
                    x: 0,
                    y: lY,
                    z: lZ,
                    edgeBanding: '0.4mm ABS'
                });
            }

            // Hátsó összekötő léc
            if (cfg.backStretcher && cfg.backStretcher.enabled) {
                const bsW = Number(cfg.backStretcher.width) || 80;
                const isFlat = cfg.backStretcher.orientation !== 'vertical';
                const insetB = Number(cfg.backStretcher.insetBack) || 0;

                const lHeight = isFlat ? Th : bsW;
                const lDepth = isFlat ? bsW : Th;
                const lY = isFlat ? topY_between : (corpusBaseY + H - bsW / 2);
                const lZ = (-D / 2) + insetB + (lDepth / 2);

                boards.push({
                    name: 'Hátsó Összekötő Léc',
                    width: innerW,
                    height: lHeight,
                    depth: lDepth,
                    thickness: Th,
                    type: 'horizontal',
                    textureKey: tex,
                    x: 0,
                    y: lY,
                    z: lZ,
                    edgeBanding: '0.4mm ABS'
                });
            }
        }

        // ----------------------------------------------------
        // 4. HÁTFAL (HDF / Bútorlap)
        // ----------------------------------------------------
        if (cfg.backPanel && cfg.backPanel.enabled) {
            const backTh = Number(cfg.backPanel.thickness) || 3;
            const backType = cfg.backPanel.type || 'surface';
            const insetBack = Number(cfg.backPanel.insetBack) || 20;
            const gap = cfg.backPanel.gap !== undefined && cfg.backPanel.gap !== null ? Number(cfg.backPanel.gap) : 2.5;
            const customH = (cfg.backPanel.height !== undefined && cfg.backPanel.height !== null && cfg.backPanel.height !== '') ? Number(cfg.backPanel.height) : null;
            const offsetY = Number(cfg.backPanel.offsetY) || 0;

            let backW = innerW;
            let backH = (customH && customH > 0) ? customH : H;
            let backZ = 0;

            if (backType === 'surface') {
                // RÁSZÖGELT / RÁSZÉGELT: A korpusz hátfalára fekszik fel 2.5mm peremhézaggal
                backW = W - (2 * gap);
                backH = (customH && customH > 0) ? customH : (H - (2 * gap));
                backZ = (-D / 2) - (backTh / 2);
            } else if (backType === 'groove') {
                // NÚTBA ÜLTETETT: A korpusz belsejében fut, insetBack mm-re a hátuljától
                backW = innerW + 16; // 8mm nút mindkét oldalon
                backH = (customH && customH > 0) ? customH : (H - (2 * Th) + 16);
                backZ = (-D / 2) + insetBack + (backTh / 2);
            } else if (backType === 'rabbet') {
                // FALCOLT: Szintben a hátfal élével
                backW = innerW + 16;
                backH = (customH && customH > 0) ? customH : (H - (2 * Th) + 16);
                backZ = (-D / 2) + (backTh / 2);
            }

            const backY = corpusBaseY + H / 2 + offsetY;

            boards.push({
                name: `Hátfal (${backTh}mm ${backType === 'surface' ? 'rászegelt' : (backType === 'rabbet' ? 'falcolt' : 'nútos')})`,
                width: Math.round(backW),
                height: Math.round(backH),
                depth: backTh,
                thickness: backTh,
                type: 'back',
                textureKey: cfg.backPanel.textureKey || 'white_matte',
                x: 0,
                y: Math.round(backY),
                z: backZ,
                edgeBanding: 'Nincs élzárás'
            });
        }

        // ----------------------------------------------------
        // 5. BELSŐ POLCOK
        // ----------------------------------------------------
        if (cfg.shelves && Number(cfg.shelves.count) > 0) {
            const shelfCount = Number(cfg.shelves.count);
            const shelfTh = Number(cfg.shelves.thickness) || Th;
            const insetF = Number(cfg.shelves.insetFront) || 15;
            
            // Hátfal helye a polc mélységéhez
            let backInset = 0;
            if (cfg.backPanel && cfg.backPanel.enabled) {
                if (cfg.backPanel.type === 'groove') {
                    backInset = Number(cfg.backPanel.insetBack) + Number(cfg.backPanel.thickness);
                }
            }

            const shelfW = innerW - 2; // 2mm szerelési hézag
            const shelfD = D - insetF - backInset;
            const shelfZ = (D / 2) - insetF - (shelfD / 2);

            const internalH = H - 2 * Th;
            const stepY = internalH / (shelfCount + 1);

            for (let i = 1; i <= shelfCount; i++) {
                const shelfY = corpusBaseY + Th + (i * stepY);
                boards.push({
                    name: `Belső Polc ${i}`,
                    width: Math.round(shelfW),
                    height: shelfTh,
                    depth: Math.round(shelfD),
                    thickness: shelfTh,
                    type: 'shelf',
                    textureKey: cfg.shelves.textureKey || tex,
                    x: 0,
                    y: Math.round(shelfY),
                    z: Math.round(shelfZ),
                    edgeBanding: '0.4mm ABS'
                });
            }
        }

        // ----------------------------------------------------
        // 6. LÁBAZAT / LÁBAK
        // ----------------------------------------------------
        if (cfg.legs && cfg.legs.enabled && legH > 0) {
            const insetX = Number(cfg.legs.insetX) || 50;
            const insetZ = Number(cfg.legs.insetZ) || 50;
            const legSize = Number(cfg.legs.diameter) || 45;

            const legPositions = [
                { name: 'Bal Első Láb', x: -W / 2 + insetX, z: D / 2 - insetZ },
                { name: 'Jobb Első Láb', x: W / 2 - insetX, z: D / 2 - insetZ },
                { name: 'Bal Hátsó Láb', x: -W / 2 + insetX, z: -D / 2 + insetZ },
                { name: 'Jobb Hátsó Láb', x: W / 2 - insetX, z: -D / 2 + insetZ }
            ];

            legPositions.forEach(pos => {
                boards.push({
                    name: pos.name,
                    width: legSize,
                    height: legH,
                    depth: legSize,
                    thickness: legSize,
                    type: 'horizontal',
                    textureKey: 'metal_chrome',
                    x: pos.x,
                    y: legH / 2,
                    z: pos.z,
                    edgeBanding: 'Nincs élzárás'
                });
            });
        }

        // ----------------------------------------------------
        // 7. SZOKLI / LÁBAZATI TAKARÓLÉC
        // ----------------------------------------------------
        if (cfg.plinth && cfg.plinth.enabled && legH > 0) {
            const plinthH = Number(cfg.plinth.height) || legH;
            const plinthTh = Number(cfg.plinth.thickness) || 18;
            const insetFront = cfg.plinth.insetFront !== undefined ? Number(cfg.plinth.insetFront) : 20;
            const plinthZ = (D / 2) - insetFront - (plinthTh / 2);

            boards.push({
                name: 'Szokli Előlap',
                isPlinth: true,
                width: W,
                height: plinthH,
                depth: plinthTh,
                thickness: plinthTh,
                type: 'plinth',
                textureKey: cfg.plinth.textureKey || tex,
                x: 0,
                y: plinthH / 2,
                z: plinthZ,
                edgeBanding: '0.4mm ABS'
            });
        }

        // ----------------------------------------------------
        // 8. KONYHAI MUNKALAP & MUNKALAP HÁTFAL
        // ----------------------------------------------------
        if (cfg.worktop && cfg.worktop.enabled) {
            const wtTh = Number(cfg.worktop.thickness) || 38;
            const overhangF = Number(cfg.worktop.overhangFront) || 25;
            const overhangB = Number(cfg.worktop.overhangBack) || 15;
            const overhangL = Number(cfg.worktop.overhangLeft) || 0;
            const overhangR = Number(cfg.worktop.overhangRight) || 0;
            const wtRadius = cfg.worktop?.edgeRadius !== undefined ? Number(cfg.worktop.edgeRadius) : 3;

            // A munkalap tényleges mélysége a korpusz mélysége + első és hátsó túllógások
            const wtD = Number(cfg.worktop.depth) || (D + overhangF + overhangB);
            const wtW = W + overhangL + overhangR;
            const wtY = corpusBaseY + H + (wtTh / 2);
            
            // Z pozíció: a korpusz elöl +D/2, hátul -D/2.
            const wtZ = (overhangF - overhangB) / 2;
            const wtTex = cfg.worktop.textureKey || 'wt_3025';

            boards.push({
                name: `Munkalap (${wtTh}mm, ${wtW}×${wtD})`,
                isWorktop: true,
                width: wtW,
                height: wtTh,
                depth: wtD,
                thickness: wtTh,
                edgeRadius: wtRadius,
                type: 'worktop',
                textureKey: wtTex,
                x: (overhangR - overhangL) / 2,
                y: wtY,
                z: wtZ,
                edgeBanding: '2.0mm ABS'
            });

            // Munkalap Hátfal (Fali panel / Csempepótló)
            if (cfg.worktop.splashback && cfg.worktop.splashback.enabled) {
                const sbH = Number(cfg.worktop.splashback.height) || 600; // 60cm
                const sbTh = Number(cfg.worktop.splashback.thickness !== undefined ? cfg.worktop.splashback.thickness : 5); // 0.5cm (5mm)
                // A munkalap tetejére ül fel, a munkalap hátuljának síkjában (egész szélességben végigér a munkalap hátulján)
                const sbY = corpusBaseY + H + wtTh + (sbH / 2);
                const sbZ = (-D / 2 - overhangB) + (sbTh / 2);
                const sbTex = cfg.worktop.splashback.textureKey || wtTex;

                boards.push({
                    name: `Munkalap Hátfalpanel (${sbH}×${wtW}×${sbTh}mm)`,
                    isSplashback: true,
                    width: wtW,
                    height: sbH,
                    depth: sbTh,
                    thickness: sbTh,
                    type: 'back',
                    textureKey: sbTex,
                    x: (overhangR - overhangL) / 2,
                    y: sbY,
                    z: sbZ,
                    edgeBanding: '0.4mm ABS'
                });
            }
        }

        // ----------------------------------------------------
        // 9. DINAMIKUS FRONT ELEMEK & KÉSZÜLÉKEK (Ajtók, Fiókok, Beépíthető Sütő / Főzőlap)
        // ----------------------------------------------------
        if (cfg.elements && Array.isArray(cfg.elements) && cfg.elements.length > 0) {
            let currentAllocatedY = 0;

            cfg.elements.forEach((elem, elemIdx) => {
                const elemType = elem.type || 'door';
                const gap = elem.gap !== undefined ? Number(elem.gap) : 3;
                const frontTh = Number(elem.thickness) || 18;
                const frontTex = elem.textureKey || tex;
                const elemH = Number(elem.height) || (H - currentAllocatedY);
                const actualH = Math.max(10, elemH - 2 * gap);
                const actualW = Math.max(10, W - 2 * gap);
                const centerY = corpusBaseY + currentAllocatedY + elemH / 2;
                const frontZ = (D / 2) + (frontTh / 2);

                currentAllocatedY += elemH;

                if (elemType === 'door') {
                    const doorType = elem.doorType || 'single_left'; // 'single_left', 'single_right', 'double', 'lift_up'
                    const hasHandle = elem.hasHandle !== false;

                    if (doorType === 'lift_up') {
                        // 1. FELNYÍLÓ AJTÓ (Lift-Up Flap Door)
                        boards.push({
                            name: `Felnyíló Ajtó Front (${Math.round(actualW)}×${Math.round(actualH)})`,
                            width: Math.round(actualW),
                            height: Math.round(actualH),
                            depth: frontTh,
                            thickness: frontTh,
                            type: 'door',
                            isDoor: true,
                            doorType: 'lift_up',
                            textureKey: frontTex,
                            x: 0,
                            y: centerY,
                            z: frontZ,
                            edgeBanding: '2.0mm ABS'
                        });

                        // 3D Felső kivetőpántok és gázteleszkópok
                        KitchenCorpusGenerator.addLiftUpHardware(boards, {
                            doorX: 0,
                            doorY: centerY,
                            doorW: actualW,
                            doorH: actualH,
                            frontTh,
                            D,
                            W,
                            Th
                        });

                        // Fogantyú: alul középen vízszintesen
                        if (hasHandle) {
                            const handleW = Math.min(160, Math.max(80, actualW - 120));
                            boards.push({
                                name: 'Felnyíló Ajtó Fogantyú',
                                width: handleW,
                                height: 12,
                                depth: 25,
                                thickness: 12,
                                type: 'hardware',
                                isHardware: true,
                                isHandle: true,
                                textureKey: 'metal_chrome',
                                x: 0,
                                y: centerY - (actualH / 2) + 35,
                                z: frontZ + frontTh / 2 + 12.5,
                                edgeBanding: 'Nincs'
                            });
                        }
                    } else if (doorType === 'double') {
                        // 2. KÉTSZÁRNYÚ AJTÓ (Double Door)
                        const doubleDoorW = Math.max(10, (actualW - 3) / 2); // 3mm hézag a két szárny között
                        const leftDoorX = -(doubleDoorW / 2 + 1.5);
                        const rightDoorX = (doubleDoorW / 2 + 1.5);

                        // Bal szárny
                        boards.push({
                            name: `Ajtó Bal Szárny (${Math.round(doubleDoorW)}×${Math.round(actualH)})`,
                            width: Math.round(doubleDoorW),
                            height: Math.round(actualH),
                            depth: frontTh,
                            thickness: frontTh,
                            type: 'door',
                            isDoor: true,
                            doorType: 'single_left',
                            textureKey: frontTex,
                            x: leftDoorX,
                            y: centerY,
                            z: frontZ,
                            edgeBanding: '2.0mm ABS'
                        });

                        // Jobb szárny
                        boards.push({
                            name: `Ajtó Jobb Szárny (${Math.round(doubleDoorW)}×${Math.round(actualH)})`,
                            width: Math.round(doubleDoorW),
                            height: Math.round(actualH),
                            depth: frontTh,
                            thickness: frontTh,
                            type: 'door',
                            isDoor: true,
                            doorType: 'single_right',
                            textureKey: frontTex,
                            x: rightDoorX,
                            y: centerY,
                            z: frontZ,
                            edgeBanding: '2.0mm ABS'
                        });

                        // Kivetőpántok a bal és jobb szárnyhoz
                        KitchenCorpusGenerator.addConcealedHinges(boards, {
                            doorX: leftDoorX,
                            doorY: centerY,
                            doorW: doubleDoorW,
                            doorH: actualH,
                            frontTh,
                            D,
                            W,
                            Th,
                            side: 'left'
                        });
                        KitchenCorpusGenerator.addConcealedHinges(boards, {
                            doorX: rightDoorX,
                            doorY: centerY,
                            doorW: doubleDoorW,
                            doorH: actualH,
                            frontTh,
                            D,
                            W,
                            Th,
                            side: 'right'
                        });

                        // Fogantyúk
                        if (hasHandle) {
                            boards.push({
                                name: 'Bal Ajtó Fogantyú',
                                width: 12,
                                height: 140,
                                depth: 25,
                                thickness: 12,
                                type: 'hardware',
                                isHardware: true,
                                isHandle: true,
                                textureKey: 'metal_chrome',
                                x: -20,
                                y: centerY,
                                z: frontZ + frontTh / 2 + 12.5,
                                edgeBanding: 'Nincs'
                            });
                            boards.push({
                                name: 'Jobb Ajtó Fogantyú',
                                width: 12,
                                height: 140,
                                depth: 25,
                                thickness: 12,
                                type: 'hardware',
                                isHardware: true,
                                isHandle: true,
                                textureKey: 'metal_chrome',
                                x: 20,
                                y: centerY,
                                z: frontZ + frontTh / 2 + 12.5,
                                edgeBanding: 'Nincs'
                            });
                        }
                    } else {
                        // 3. EGYSZÁRNYÚ AJTÓ (Single Door: Balos vagy Jobbos)
                        boards.push({
                            name: `Ajtó Front (${Math.round(actualW)}×${Math.round(actualH)})`,
                            width: Math.round(actualW),
                            height: Math.round(actualH),
                            depth: frontTh,
                            thickness: frontTh,
                            type: 'door',
                            isDoor: true,
                            doorType: doorType,
                            textureKey: frontTex,
                            x: 0,
                            y: centerY,
                            z: frontZ,
                            edgeBanding: '2.0mm ABS'
                        });

                        // 3D Kivetőpántok
                        const isLeft = doorType !== 'single_right';
                        KitchenCorpusGenerator.addConcealedHinges(boards, {
                            doorX: 0,
                            doorY: centerY,
                            doorW: actualW,
                            doorH: actualH,
                            frontTh,
                            D,
                            W,
                            Th,
                            side: isLeft ? 'left' : 'right'
                        });

                        if (hasHandle) {
                            const handleX = (doorType === 'single_right') ? (-actualW / 2 + 35) : (actualW / 2 - 35);
                            boards.push({
                                name: 'Ajtó Rúdfogantyú',
                                width: 12,
                                height: 140,
                                depth: 25,
                                thickness: 12,
                                type: 'hardware',
                                isHardware: true,
                                isHandle: true,
                                textureKey: 'metal_chrome',
                                x: handleX,
                                y: centerY,
                                z: frontZ + frontTh / 2 + 12.5,
                                edgeBanding: 'Nincs'
                            });
                        }
                    }
                } else if (elemType === 'drawer') {
                    // FIÓK ELŐLAP
                    const hasHandle = elem.hasHandle !== false;

                    boards.push({
                        name: `Fiók Előlap ${elemIdx + 1} (${Math.round(actualW)}×${Math.round(actualH)})`,
                        width: Math.round(actualW),
                        height: Math.round(actualH),
                        depth: frontTh,
                        thickness: frontTh,
                        type: 'drawer',
                        isDrawer: true,
                        textureKey: frontTex,
                        x: 0,
                        y: centerY,
                        z: frontZ,
                        edgeBanding: '2.0mm ABS'
                    });

                    if (hasHandle) {
                        const handleW = Math.min(160, Math.max(80, actualW - 80));
                        boards.push({
                            name: `Fiók Fogantyú ${elemIdx + 1}`,
                            width: handleW,
                            height: 12,
                            depth: 25,
                            thickness: 12,
                            type: 'hardware',
                            isHardware: true,
                            isHandle: true,
                            textureKey: 'metal_chrome',
                            x: 0,
                            y: centerY,
                            z: frontZ + frontTh / 2 + 12.5,
                            edgeBanding: 'Nincs'
                        });
                    }
                } else if (elemType === 'oven') {
                    // BEÉPÍTHETŐ SÜTŐ ÉS FŐZŐLAP
                    // 1. Sütő Fekete Üveg Alap Front
                    boards.push({
                        name: `Beépíthető Sütő Test (${Math.round(actualW)}×${Math.round(actualH)})`,
                        width: Math.round(actualW),
                        height: Math.round(actualH),
                        depth: 20,
                        thickness: 20,
                        type: 'appliance',
                        isAppliance: true,
                        textureKey: 'oven_black_glass',
                        x: 0,
                        y: centerY,
                        z: (D / 2) + 10,
                        edgeBanding: 'Nincs'
                    });

                    // 2. Sütő Kezelőpanel felül (Rozsdamentes acél)
                    const panelH = Math.min(110, actualH * 0.22);
                    boards.push({
                        name: 'Sütő Kezelőpanel (Inox)',
                        width: Math.round(actualW - 4),
                        height: Math.round(panelH),
                        depth: 4,
                        thickness: 4,
                        type: 'appliance',
                        isAppliance: true,
                        textureKey: 'stainless_steel',
                        x: 0,
                        y: centerY + (actualH / 2) - (panelH / 2),
                        z: (D / 2) + 21,
                        edgeBanding: 'Nincs'
                    });

                    // 3. Sütő Fogantyú (Kényelmes vízszintes acél rúd)
                    const ovenHandleW = Math.min(460, actualW - 80);
                    boards.push({
                        name: 'Sütő Ajtó Fogantyú',
                        width: ovenHandleW,
                        height: 16,
                        depth: 28,
                        thickness: 16,
                        type: 'hardware',
                        isHardware: true,
                        isHandle: true,
                        textureKey: 'stainless_steel',
                        x: 0,
                        y: centerY + (actualH / 2) - panelH - 25,
                        z: (D / 2) + 34,
                        edgeBanding: 'Nincs'
                    });

                    // 4. Sütő Betekintő Ablak (Belső sötétített üveg mező)
                    const windowW = Math.max(100, actualW - 120);
                    const windowH = Math.max(100, actualH - panelH - 80);
                    boards.push({
                        name: 'Sütő Üvegablak',
                        width: Math.round(windowW),
                        height: Math.round(windowH),
                        depth: 3,
                        thickness: 3,
                        type: 'appliance',
                        isAppliance: true,
                        textureKey: 'oven_black_glass',
                        x: 0,
                        y: centerY - (panelH / 2) - 15,
                        z: (D / 2) + 21,
                        edgeBanding: 'Nincs'
                    });

                    // 5. Beépíthető Indukciós Főzőlap (ha a munkalap be van kapcsolva)
                    if (elem.includeCooktop !== false && cfg.worktop && cfg.worktop.enabled) {
                        const wtTh = Number(cfg.worktop.thickness) || 38;
                        const cookW = Math.min(590, Math.max(280, W - 10));
                        const cookD = Math.min(520, Math.max(280, (Number(cfg.worktop.depth) || 600) - 50));
                        const wtZ = (Number(cfg.worktop.overhangFront || 25) - Number(cfg.worktop.overhangBack || 15)) / 2;

                        boards.push({
                            name: `Indukciós Főzőlap (${cookW}×${cookD} mm)`,
                            width: cookW,
                            height: 4,
                            depth: cookD,
                            thickness: 4,
                            type: 'appliance',
                            isAppliance: true,
                            textureKey: 'cooktop_glass',
                            x: 0,
                            y: corpusBaseY + H + wtTh + 2,
                            z: wtZ,
                            edgeBanding: 'Nincs'
                        });
                    }
                }
            });
        }

        // Attach default edgeRadius to any board that doesn't have it set
        boards.forEach(b => {
            if (b.edgeRadius === undefined) {
                b.edgeRadius = defaultRadius;
            }
        });

        return boards;
    }

    /**
     * 3D Kivetőpántok generálása ajtóhoz (Blum/Hettich szabvány szerint)
     */
    static addConcealedHinges(boards, p) {
        const { doorX, doorY, doorW, doorH, frontTh, D, W, Th, side } = p;
        
        // Pántok száma az ajtó magassága (doorH) alapján
        let hingeOffsets = [];
        if (doorH < 900) {
            hingeOffsets = [100, doorH - 100];
        } else if (doorH < 1600) {
            hingeOffsets = [100, doorH / 2, doorH - 100];
        } else if (doorH < 2000) {
            hingeOffsets = [100, doorH * 0.35, doorH * 0.65, doorH - 100];
        } else {
            hingeOffsets = [100, doorH * 0.28, doorH * 0.50, doorH * 0.72, doorH - 100];
        }

        hingeOffsets.forEach((offY, hIdx) => {
            const hY = (doorY - doorH / 2) + offY;

            if (side === 'left' || side === 'right') {
                const isLeft = side === 'left';
                // Pántedény középpont X: ajtó élétől 21.5 mm (Ø35mm edény)
                const cupX = isLeft ? (doorX - doorW / 2 + 21.5) : (doorX + doorW / 2 - 21.5);
                // Szerelőtalp X: korpusz belső oldalán
                const plateX = isLeft ? (-W / 2 + Th + 2) : (W / 2 - Th - 2);
                const armX = (cupX + plateX) / 2;

                // 1. Pántedény (Ø35mm csésze az ajtó belső felületén)
                boards.push({
                    name: `Pántedény Ø35mm ${isLeft ? 'Bal' : 'Jobb'} ${hIdx + 1}`,
                    width: 35,
                    height: 35,
                    depth: 6,
                    thickness: 6,
                    type: 'hardware',
                    isHardware: true,
                    isHinge: true,
                    textureKey: 'metal_chrome',
                    x: cupX,
                    y: hY,
                    z: (D / 2) - 1,
                    edgeBanding: 'Nincs'
                });

                // 2. Csuklós Pántkar (fém kar állítócsavarral)
                boards.push({
                    name: `Pántkar ${isLeft ? 'Bal' : 'Jobb'} ${hIdx + 1}`,
                    width: Math.max(12, Math.abs(cupX - plateX)),
                    height: 18,
                    depth: 28,
                    thickness: 18,
                    type: 'hardware',
                    isHardware: true,
                    isHinge: true,
                    textureKey: 'metal_chrome',
                    x: armX,
                    y: hY,
                    z: (D / 2) - 14,
                    edgeBanding: 'Nincs'
                });

                // 3. Szerelőtalp (a korpusz belső oldalán, 37mm-re elölről)
                boards.push({
                    name: `Pánt Szerelőtalp ${isLeft ? 'Bal' : 'Jobb'} ${hIdx + 1}`,
                    width: 4,
                    height: 32,
                    depth: 37,
                    thickness: 4,
                    type: 'hardware',
                    isHardware: true,
                    isHinge: true,
                    textureKey: 'metal_chrome',
                    x: plateX,
                    y: hY,
                    z: (D / 2) - 18.5,
                    edgeBanding: 'Nincs'
                });
            }
        });
    }

    /**
     * Felnyíló ajtó vasalatok: 2 db felső pánt + 2 db gázteleszkóp
     */
    static addLiftUpHardware(boards, p) {
        const { doorX, doorY, doorW, doorH, frontTh, D, W, Th } = p;
        
        // 1. Felső 2 db pánt (bal és jobb oldalt 100mm-re a szélektől)
        const topHingesX = [-doorW / 2 + 100, doorW / 2 - 100];
        const topHingeY = doorY + doorH / 2 - 20;

        topHingesX.forEach((hx, idx) => {
            // Pántedény
            boards.push({
                name: `Felnyíló Pántedény ${idx + 1}`,
                width: 35,
                height: 35,
                depth: 6,
                thickness: 6,
                type: 'hardware',
                isHardware: true,
                isHinge: true,
                textureKey: 'metal_chrome',
                x: hx,
                y: topHingeY,
                z: (D / 2) - 1,
                edgeBanding: 'Nincs'
            });
            // Felső pántkar
            boards.push({
                name: `Felnyíló Pántkar ${idx + 1}`,
                width: 18,
                height: 18,
                depth: 30,
                thickness: 18,
                type: 'hardware',
                isHardware: true,
                isHinge: true,
                textureKey: 'metal_chrome',
                x: hx,
                y: topHingeY + 8,
                z: (D / 2) - 15,
                edgeBanding: 'Nincs'
            });
        });

        // 2. Gázteleszkópok a bal és jobb oldalon
        const strutSides = [
            { name: 'Bal Gázteleszkóp', x: -W / 2 + Th + 12 },
            { name: 'Jobb Gázteleszkóp', x: W / 2 - Th - 12 }
        ];

        strutSides.forEach(st => {
            // Gázkamra henger
            boards.push({
                name: `${st.name} Ház`,
                width: 14,
                height: 14,
                depth: 120,
                thickness: 14,
                type: 'hardware',
                isHardware: true,
                textureKey: 'metal_chrome',
                x: st.x,
                y: doorY - 30,
                z: (D / 2) - 110,
                edgeBanding: 'Nincs'
            });

            // Króm dugattyúrúd
            boards.push({
                name: `${st.name} Dugattyúrúd`,
                width: 7,
                height: 7,
                depth: 70,
                thickness: 7,
                type: 'hardware',
                isHardware: true,
                textureKey: 'metal_chrome',
                x: st.x,
                y: doorY + 10,
                z: (D / 2) - 35,
                edgeBanding: 'Nincs'
            });

            // Front rögzítőtalp
            boards.push({
                name: `${st.name} Front Talp`,
                width: 20,
                height: 20,
                depth: 4,
                thickness: 4,
                type: 'hardware',
                isHardware: true,
                textureKey: 'metal_chrome',
                x: st.x,
                y: doorY + 25,
                z: (D / 2) - 2,
                edgeBanding: 'Nincs'
            });
        });
    }
}
