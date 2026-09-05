/**
 * Szabászati és 2D Tábla Kiosztási Menedzser (cutListManager.js)
 * Kizárólag valódi bútorlapok kezelése, 2800×2070 mm-es táblákra történő
 * intelligens 2D vágásoptimalizálás (nesting), fűrészlap térköz (kerf) kezelés,
 * interaktív 2D Canvas vizualizáció, CSV export és nyomtatás.
 */

export class CutListManager {
    constructor(boardManager) {
        this.boardManager = boardManager;
        this.sqmPrice = 12500; // Alapértelmezett bútorlap m² ár (HUF)
        this.edgePricePerM = 450; // Élzárás fm ár (HUF)
        this.defaultSheetWidth = 2800; // mm
        this.defaultSheetHeight = 2070; // mm
        this.defaultKerf = 4; // mm (fűrészlap vastagság)
        this.defaultTrim = 10; // mm (szélezési levágás)
        this.currentCutListData = null;
        this.activeSheetIndex = 0;
    }

    /**
     * Csak a valódi bútorlap alkatrészek szűrése (kizárva a fogantyúkat, lábakat, készülékeket)
     */
    filterFurnitureBoards() {
        const allBoards = this.boardManager.boards || [];
        return allBoards.filter(b => {
            if (!b) return false;
            // Kizárások
            if (b.isHardware || b.type === 'hardware' || b.isHandle) return false;
            if (b.isAppliance || b.type === 'appliance') return false;
            if (b.type === 'leg') return false;
            if (b.name && (b.name.includes('Fogantyú') || b.name.includes('Láb') || b.name.includes('Sütő') || b.name.includes('Főzőlap'))) return false;
            // Valódi lapméretek ellenőrzése
            const w = Number(b.width) || 0;
            const h = Number(b.height) || 0;
            const d = Number(b.depth) || 0;
            if (w <= 0 || h <= 0 || d <= 0) return false;
            return true;
        });
    }

    /**
     * Részletes alkatrészlista és 2D táblakiosztás generálása
     */
    generateCutList(options = {}) {
        const sheetW = Number(options.sheetWidth) || this.defaultSheetWidth;
        const sheetH = Number(options.sheetHeight) || this.defaultSheetHeight;
        const kerf = options.kerf !== undefined ? Number(options.kerf) : this.defaultKerf;
        const trim = options.trim !== undefined ? Number(options.trim) : this.defaultTrim;

        const validBoards = this.filterFurnitureBoards();
        let totalAreaSqm = 0;
        let totalEdgeMeters = 0;
        const parts = [];

        validBoards.forEach((b, index) => {
            let length = 0;
            let width = 0;
            let thickness = Number(b.thickness) || 18;

            const dimX = Math.round(Number(b.width));
            const dimY = Math.round(Number(b.height));
            const dimZ = Math.round(Number(b.depth));

            // Fő síkméretek meghatározása
            if (dimX >= dimZ && dimX >= dimY) {
                length = dimX;
                width = dimZ > dimY ? dimZ : dimY;
                thickness = Math.min(dimX, dimY, dimZ);
            } else if (dimY >= dimX && dimY >= dimZ) {
                length = dimY;
                width = dimZ > dimX ? dimZ : dimX;
                thickness = Math.min(dimX, dimY, dimZ);
            } else {
                length = dimZ;
                width = dimX > dimY ? dimX : dimY;
                thickness = Math.min(dimX, dimY, dimZ);
            }

            length = Math.max(1, length);
            width = Math.max(1, width);
            thickness = Math.max(1, thickness);

            let isBack = false;
            let partType = 'corpus';
            if (b.type === 'back' || b.isBack || (b.name && b.name.toLowerCase().includes('hátfal')) || thickness <= 4) {
                partType = 'back';
                isBack = true;
            } else if (b.type === 'door' || b.isDoor || (b.name && b.name.includes('Ajtó'))) {
                partType = 'door';
            } else if (b.type === 'drawer' || b.isDrawer || (b.name && b.name.includes('Fiók'))) {
                partType = 'drawer';
            } else if (b.type === 'shelf' || (b.name && b.name.includes('Polc'))) {
                partType = 'shelf';
            } else if (b.type === 'worktop' || b.isWorktop || (b.name && b.name.includes('Munkalap'))) {
                partType = 'worktop';
            }

            const areaSqm = (length * width) / 1000000;
            totalAreaSqm += areaSqm;

            // Élzárás folyóméter (hátfalaknál nem számolunk élzárást)
            const edgeBandingVal = isBack ? 'Nincs élzárás' : (b.edgeBanding || '0.4mm ABS');
            const hasEdgeBanding = !edgeBandingVal.includes('Nincs');
            const perimeterMeters = ((length * 2) + (width * 2)) / 1000;
            if (hasEdgeBanding) {
                totalEdgeMeters += perimeterMeters;
            }

            parts.push({
                sno: index + 1,
                id: b.id,
                name: b.name || (isBack ? 'Hátfal' : `Bútorlap ${index + 1}`),
                type: partType,
                isBack: isBack,
                length: length,
                width: width,
                thickness: thickness,
                areaSqm: Number(areaSqm.toFixed(3)),
                edgeMeters: Number(perimeterMeters.toFixed(2)),
                edgeBanding: edgeBandingVal,
                textureKey: b.textureKey || (isBack ? 'back_white' : 'white_matte'),
                textureName: isBack ? '3mm HDF Hátfal lemez' : (b.mesh?.userData?.textureName || b.textureKey || 'Bútorlap'),
                boardRef: b
            });
        });

        const boardParts = parts.filter(p => !p.isBack && p.type !== 'back');
        const backParts = parts.filter(p => p.isBack || p.type === 'back');

        const boardAreaSqm = boardParts.reduce((acc, p) => acc + p.areaSqm, 0);
        const backAreaSqm = backParts.reduce((acc, p) => acc + p.areaSqm, 0);

        // 2D Tábla Kiosztási Algoritmus (Nesting) futtatása - KIZÁRÓLAG a bútorlapokra (hátfalak nélkül)
        const nestingResult = this.packPartsToSheets(parts, sheetW, sheetH, kerf, trim);

        const materialCost = (boardAreaSqm * this.sqmPrice) + (backAreaSqm * (this.sqmPrice * 0.35));
        const edgeCost = totalEdgeMeters * this.edgePricePerM;
        const estimatedTotal = materialCost + edgeCost;

        this.currentCutListData = {
            parts: parts,
            totalPieces: parts.length,
            boardPieces: boardParts.length,
            backPieces: backParts.length,
            totalAreaSqm: Number(totalAreaSqm.toFixed(3)),
            boardAreaSqm: Number(boardAreaSqm.toFixed(3)),
            backAreaSqm: Number(backAreaSqm.toFixed(3)),
            totalEdgeMeters: Number(totalEdgeMeters.toFixed(2)),
            materialCost: Math.round(materialCost),
            edgeCost: Math.round(edgeCost),
            estimatedTotal: Math.round(estimatedTotal),
            sheetWidth: sheetW,
            sheetHeight: sheetH,
            kerf: kerf,
            trim: trim,
            sheets: nestingResult.sheets,
            totalSheetsCount: nestingResult.sheets.length,
            overallEfficiency: nestingResult.overallEfficiency
        };

        return this.currentCutListData;
    }

    /**
     * 2D Guillotine / Best-Fit Decreasing Táblakiosztási Algoritmus
     * A hátfalakat (3mm HDF lemez) kihagyja a 18mm-es bútorlap táblákról!
     */
    packPartsToSheets(parts, sheetW, sheetH, kerf, trim) {
        // Hátfalak kiszűrése a táblakiosztásból
        const validBoardParts = parts.filter(p => {
            if (p.isBack || p.type === 'back') return false;
            if (p.name && p.name.toLowerCase().includes('hátfal')) return false;
            if (p.thickness && Number(p.thickness) <= 5) return false;
            return true;
        });

        if (validBoardParts.length === 0) {
            return { sheets: [], overallEfficiency: 0 };
        }

        const usableW = Math.max(100, sheetW - 2 * trim);
        const usableH = Math.max(100, sheetH - 2 * trim);
        const sheetArea = (sheetW * sheetH) / 1000000;

        // Elemek másolása és rendezése csökkenő felület és maximális dimenzió szerint
        const itemsToPack = validBoardParts.map(p => ({
            ...p,
            w: Math.max(p.length, p.width), // hosszabb oldal
            h: Math.min(p.length, p.width), // rövidebb oldal
            placed: false
        })).sort((a, b) => (b.w * b.h) - (a.w * a.h) || b.w - a.w);

        const sheets = [];

        const createNewSheet = (sheetIndex) => {
            return {
                sheetIndex: sheetIndex,
                sheetW: sheetW,
                sheetH: sheetH,
                usableW: usableW,
                usableH: usableH,
                trim: trim,
                kerf: kerf,
                placedParts: [],
                freeRectangles: [{ x: 0, y: 0, w: usableW, h: usableH }],
                usedAreaSqm: 0,
                efficiency: 0,
                wasteAreaSqm: 0,
                wastePercent: 0
            };
        };

        itemsToPack.forEach(part => {
            let placed = false;

            // Megpróbáljuk elhelyezni a meglévő táblákon
            for (let sIdx = 0; sIdx < sheets.length; sIdx++) {
                const sheet = sheets[sIdx];
                if (this.tryPlacePartInSheet(sheet, part, kerf)) {
                    placed = true;
                    break;
                }
            }

            // Ha nem fért el a meglévő táblákon, új táblát nyitunk
            if (!placed) {
                const newSheet = createNewSheet(sheets.length);
                if (this.tryPlacePartInSheet(newSheet, part, kerf)) {
                    sheets.push(newSheet);
                    placed = true;
                } else {
                    // Ha a darab túl nagy még egy üres táblára is
                    console.warn(`Alkatrész (${part.name}: ${part.length}×${part.width}) nagyobb mint a tábla hasznos mérete!`);
                    newSheet.placedParts.push({
                        part: part,
                        x: 0,
                        y: 0,
                        w: Math.min(part.w, usableW),
                        h: Math.min(part.h, usableH),
                        rotated: false
                    });
                    sheets.push(newSheet);
                }
            }
        });

        // Statisztikák számítása minden táblához
        let totalUsedArea = 0;
        sheets.forEach(sheet => {
            let sheetUsedArea = 0;
            sheet.placedParts.forEach(p => {
                sheetUsedArea += (p.w * p.h) / 1000000;
            });
            sheet.usedAreaSqm = Number(sheetUsedArea.toFixed(3));
            sheet.efficiency = Number(((sheet.usedAreaSqm / sheetArea) * 100).toFixed(1));
            sheet.wasteAreaSqm = Number(Math.max(0, sheetArea - sheet.usedAreaSqm).toFixed(3));
            sheet.wastePercent = Number((100 - sheet.efficiency).toFixed(1));
            totalUsedArea += sheetUsedArea;
        });

        const totalSheetArea = sheets.length * sheetArea;
        const overallEfficiency = totalSheetArea > 0 ? Number(((totalUsedArea / totalSheetArea) * 100).toFixed(1)) : 0;

        return {
            sheets: sheets,
            overallEfficiency: overallEfficiency
        };
    }

    /**
     * Megpróbál elhelyezni egy alkatrészt a megadott tábla szabad téglalapjaiban (Best-Fit Guillotine)
     */
    tryPlacePartInSheet(sheet, part, kerf) {
        let bestRectIdx = -1;
        let bestRotated = false;
        let bestShortSideFit = Number.POSITIVE_INFINITY;
        let bestAreaFit = Number.POSITIVE_INFINITY;

        const freeRects = sheet.freeRectangles;

        for (let i = 0; i < freeRects.length; i++) {
            const rect = freeRects[i];

            // 1. Normál orientáció
            if (rect.w >= part.w && rect.h >= part.h) {
                const leftoverHoriz = rect.w - part.w;
                const leftoverVert = rect.h - part.h;
                const shortSide = Math.min(leftoverHoriz, leftoverVert);
                const areaFit = (rect.w * rect.h) - (part.w * part.h);

                if (shortSide < bestShortSideFit || (shortSide === bestShortSideFit && areaFit < bestAreaFit)) {
                    bestRectIdx = i;
                    bestRotated = false;
                    bestShortSideFit = shortSide;
                    bestAreaFit = areaFit;
                }
            }

            // 2. 90°-kal elforgatott orientáció
            if (rect.w >= part.h && rect.h >= part.w) {
                const leftoverHoriz = rect.w - part.h;
                const leftoverVert = rect.h - part.w;
                const shortSide = Math.min(leftoverHoriz, leftoverVert);
                const areaFit = (rect.w * rect.h) - (part.h * part.w);

                if (shortSide < bestShortSideFit || (shortSide === bestShortSideFit && areaFit < bestAreaFit)) {
                    bestRectIdx = i;
                    bestRotated = true;
                    bestShortSideFit = shortSide;
                    bestAreaFit = areaFit;
                }
            }
        }

        if (bestRectIdx === -1) return false;

        const targetRect = freeRects.splice(bestRectIdx, 1)[0];
        const placedW = bestRotated ? part.h : part.w;
        const placedH = bestRotated ? part.w : part.h;

        // Alkatrész rögzítése a táblán
        sheet.placedParts.push({
            part: part,
            x: targetRect.x,
            y: targetRect.y,
            w: placedW,
            h: placedH,
            rotated: bestRotated
        });

        // Guillotine vágás mentén felosztjuk a maradék szabad téglalapokat
        const rightW = targetRect.w - placedW - kerf;
        const topH = targetRect.h - placedH - kerf;

        if (rightW > 0) {
            freeRects.push({
                x: targetRect.x + placedW + kerf,
                y: targetRect.y,
                w: rightW,
                h: placedH
            });
        }

        if (topH > 0) {
            freeRects.push({
                x: targetRect.x,
                y: targetRect.y + placedH + kerf,
                w: targetRect.w,
                h: topH
            });
        }

        return true;
    }

    /**
     * Tábla 2D Kiosztási terv kirajzolása HTML5 Canvas-re
     */
    renderSheetToCanvas(canvas, sheetIndex = 0) {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const data = this.currentCutListData;
        if (!data || !data.sheets || data.sheets.length === 0) {
            canvas.width = 600;
            canvas.height = 300;
            ctx.fillStyle = '#090d16';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#64748b';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Nincsenek bútorlapok a szabászati tervben.', canvas.width / 2, canvas.height / 2);
            return;
        }

        const validIndex = Math.min(Math.max(0, sheetIndex), data.sheets.length - 1);
        this.activeSheetIndex = validIndex;
        const sheet = data.sheets[validIndex];

        const container = canvas.parentElement;
        const containerWidth = (container ? container.clientWidth : 800) || 800;
        const containerHeight = (container ? container.clientHeight : 420) || 420;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = containerWidth * dpr;
        canvas.height = containerHeight * dpr;
        canvas.style.width = `${containerWidth}px`;
        canvas.style.height = `${containerHeight}px`;

        ctx.scale(dpr, dpr);

        // Háttér törlése
        ctx.fillStyle = '#0b0f19';
        ctx.fillRect(0, 0, containerWidth, containerHeight);

        // Méretezési arány (fit to canvas keeping aspect ratio)
        const padX = 40;
        const padY = 40;
        const availW = containerWidth - (2 * padX);
        const availH = containerHeight - (2 * padY);

        const scaleX = availW / sheet.sheetW;
        const scaleY = availH / sheet.sheetH;
        const scale = Math.min(scaleX, scaleY);

        const drawW = sheet.sheetW * scale;
        const drawH = sheet.sheetH * scale;
        const startX = (containerWidth - drawW) / 2;
        const startY = (containerHeight - drawH) / 2;

        // 1. Tábla külső körvonala (Nyers 2800×2070 mm-es tábla)
        ctx.fillStyle = '#1e2638';
        ctx.fillRect(startX, startY, drawW, drawH);
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(startX, startY, drawW, drawH);

        // Tábla méret feliratok a külső éleken
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`↔ ${sheet.sheetW} mm`, startX + drawW / 2, startY - 10);
        ctx.textAlign = 'left';
        ctx.fillText(`↕ ${sheet.sheetH} mm`, startX + drawW + 8, startY + drawH / 2);

        // 2. Szélezési (Trim) margó szaggatott vonallal
        const trimX = startX + (sheet.trim * scale);
        const trimY = startY + (sheet.trim * scale);
        const trimW = sheet.usableW * scale;
        const trimH = sheet.usableH * scale;

        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
        ctx.strokeRect(trimX, trimY, trimW, trimH);
        ctx.setLineDash([]);

        // Színpaletta alkatrész típusok szerint
        const partColors = {
            corpus: { fill: '#1e3a8a', stroke: '#3b82f6', text: '#e0f2fe' },   // Kék
            door: { fill: '#854d0e', stroke: '#eab308', text: '#fef08a' },     // Sárga/Arany
            drawer: { fill: '#065f46', stroke: '#10b981', text: '#a7f3d0' },   // Zöld
            shelf: { fill: '#4c1d95', stroke: '#8b5cf6', text: '#ede9fe' },    // Lila
            worktop: { fill: '#831843', stroke: '#ec4899', text: '#fbcfe8' },  // Rózsaszín
            back: { fill: '#334155', stroke: '#64748b', text: '#cbd5e1' }      // Szürke
        };

        // 3. Elhelyezett alkatrészek kirajzolása
        sheet.placedParts.forEach(item => {
            const px = trimX + (item.x * scale);
            const py = trimY + (item.y * scale);
            const pw = item.w * scale;
            const ph = item.h * scale;

            const theme = partColors[item.part.type] || partColors.corpus;

            // Alkatrész téglalap kitöltése
            ctx.fillStyle = theme.fill;
            ctx.fillRect(px, py, pw, ph);

            // Körvonal
            ctx.strokeStyle = theme.stroke;
            ctx.lineWidth = 1.2;
            ctx.strokeRect(px, py, pw, ph);

            // Szöveg és méretek megjelenítése, ha van elég hely
            if (pw > 35 && ph > 20) {
                ctx.save();
                ctx.beginPath();
                ctx.rect(px + 2, py + 2, pw - 4, ph - 4);
                ctx.clip();

                ctx.fillStyle = theme.text;
                ctx.font = pw > 90 ? 'bold 11px sans-serif' : '10px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                const partNum = `#${item.part.sno}`;
                const partName = item.part.name;
                const dimStr = `${Math.round(item.w)}×${Math.round(item.h)} mm`;

                if (ph > 40) {
                    ctx.fillText(`${partNum} ${partName}`, px + pw / 2, py + ph / 2 - 7);
                    ctx.font = '10px sans-serif';
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
                    ctx.fillText(dimStr, px + pw / 2, py + ph / 2 + 8);
                } else {
                    ctx.fillText(`${partNum} (${dimStr})`, px + pw / 2, py + ph / 2);
                }

                ctx.restore();
            }
        });

        // 4. Vízjel / Tábla sarok statisztika
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`Tábla ${validIndex + 1} / ${data.sheets.length} | Hasznos: ${sheet.efficiency}% | Vágásrés: ${sheet.kerf} mm`, startX + 6, startY + drawH - 8);
    }

    /**
     * Alkatrészlista exportálása CSV fájlba
     */
    exportCSV() {
        const data = this.currentCutListData || this.generateCutList();
        if (!data || data.parts.length === 0) {
            alert('Nincs alkatrész a szabászati listában!');
            return;
        }

        let csvContent = '\uFEFF';
        csvContent += 'Sorszám;Megnevezés;Típus;Hosszúság (mm);Szélesség (mm);Vastagság (mm);Anyag / Dekor;Élzárás;Felület (m²);Élhossz (fm)\r\n';

        data.parts.forEach(p => {
            csvContent += `${p.sno};"${p.name}";"${p.type}";${p.length};${p.width};${p.thickness};"${p.textureName}";"${p.edgeBanding}";${p.areaSqm};${p.edgeMeters}\r\n`;
        });

        csvContent += `\r\nÖsszesítés;;;;;;;;\r\n`;
        csvContent += `Bútorlap darabszám:;${data.totalPieces} db;;;;;;;\r\n`;
        csvContent += `Szükséges táblák (2800×2070 mm):;${data.totalSheetsCount} db;;;;;;;\r\n`;
        csvContent += `Kihozatali hatékonyság:;${data.overallEfficiency} %;;;;;;;\r\n`;
        csvContent += `Összes alkatrész felület:;${data.totalAreaSqm} m²;;;;;;;\r\n`;
        csvContent += `Összes élzárás:;${data.totalEdgeMeters} fm;;;;;;;\r\n`;
        csvContent += `Becsült alapanyag költség:;${data.estimatedTotal.toLocaleString('hu-HU')} Ft;;;;;;;\r\n`;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `szabaszati_terv_2800x2070_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Formázott nyomtatás és PDF készítés
     */
    printCutList(furnitureName = 'Konyhabútor Projekt') {
        const data = this.currentCutListData || this.generateCutList();
        const win = window.open('', '_blank');

        let rowsHtml = '';
        data.parts.forEach(p => {
            rowsHtml += `
                <tr>
                    <td style="text-align:center; padding:6px; border:1px solid #cbd5e1;">${p.sno}</td>
                    <td style="padding:6px; border:1px solid #cbd5e1; font-weight:600;">${p.name}</td>
                    <td style="text-align:right; padding:6px; border:1px solid #cbd5e1;">${p.length} mm</td>
                    <td style="text-align:right; padding:6px; border:1px solid #cbd5e1;">${p.width} mm</td>
                    <td style="text-align:right; padding:6px; border:1px solid #cbd5e1;">${p.thickness} mm</td>
                    <td style="padding:6px; border:1px solid #cbd5e1;">${p.textureName}</td>
                    <td style="padding:6px; border:1px solid #cbd5e1;">${p.edgeBanding}</td>
                    <td style="text-align:right; padding:6px; border:1px solid #cbd5e1;">${p.areaSqm} m²</td>
                </tr>
            `;
        });

        win.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Szabászati és Táblakiosztási Jegyzék - ${furnitureName}</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; color: #1e293b; }
                    h1 { font-size: 22px; margin-bottom: 5px; color: #0f172a; }
                    .meta { color: #64748b; font-size: 13px; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
                    th { background: #f1f5f9; padding: 8px; border: 1px solid #cbd5e1; text-align: left; font-weight: bold; }
                    .summary { margin-top: 25px; padding: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; }
                    @media print {
                        body { padding: 0; }
                        button { display: none; }
                    }
                </style>
            </head>
            <body>
                <h1>📐 Szabászati és Táblakiosztási Jegyzék</h1>
                <div class="meta">Projekt: <strong>${furnitureName}</strong> | Dátum: ${new Date().toLocaleDateString('hu-HU')} | Táblaméret: <strong>${data.sheetWidth} × ${data.sheetHeight} mm</strong></div>
                
                <table>
                    <thead>
                        <tr>
                            <th style="width:40px; text-align:center;">#</th>
                            <th>Alkatrész Neve</th>
                            <th style="text-align:right;">Hossz</th>
                            <th style="text-align:right;">Szélesség</th>
                            <th style="text-align:right;">Vastagság</th>
                            <th>Anyag / Dekor</th>
                            <th>Élzárás</th>
                            <th style="text-align:right;">Felület</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>

                <div class="summary">
                    <p><strong>Összes bútorlap darabszám:</strong> ${data.totalPieces} db lap</p>
                    <p><strong>Szükséges táblák száma (2800×2070 mm):</strong> ${data.totalSheetsCount} db tábla</p>
                    <p><strong>Átlagos kihozatali hatékonyság:</strong> ${data.overallEfficiency}%</p>
                    <p><strong>Teljes hasznos bútorlap felület:</strong> ${data.totalAreaSqm} m²</p>
                    <p><strong>Szükséges élzárás hossz:</strong> ~${data.totalEdgeMeters} fm</p>
                    <p><strong>Becsült alapanyag költség:</strong> ~${data.estimatedTotal.toLocaleString('hu-HU')} Ft</p>
                </div>

                <div style="margin-top:20px; text-align:center;">
                    <button onclick="window.print()" style="padding:10px 20px; background:#2563eb; color:#fff; border:none; border-radius:6px; cursor:pointer; font-weight:bold;">🖨️ Nyomtatás / PDF mentés</button>
                </div>
            </body>
            </html>
        `);
        win.document.close();
    }
}
