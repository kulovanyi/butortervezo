/**
 * Wavefront OBJ és MTL Exportáló Modul (objExporter.js)
 * Professzionális 3D CAD/DCC export (Blender, 3ds Max, Maya, Rhino, SketchUp, Cinema 4D).
 * 
 * Kiemelt funkciók a kérésnek megfelelően:
 * 1. Minden konyha elem külön 3D Objectként ('o') jelenik meg a 3D szoftverek Outliner / Elemfájában.
 * 2. Négy különálló, szabványos anyagtípus (Material slots):
 *    - korpusz (váz, oldallapok, fenéklap, tető, összekötők, hátfal, polcok, szokli)
 *    - front (ajtók, fiókelők, előlapok)
 *    - munkalap (konyhai munkalapok, saroklevágott elemek, vízzárók)
 *    - kiegeszitok (fogantyúk, fém/műanyag lábak, pántok, beépített gépek)
 * 3. Valósághű színek kinyerése a projekt anyagaiból az MTL fájlba.
 * 4. fflate ZIP csomagolás: azonnali, egykattintásos letöltés (OBJ + MTL).
 */

export class ObjExporter {
    /**
     * Meghatározza, hogy egy adott mesh melyik anyagcsoporthoz tartozik:
     * 'korpusz' | 'front' | 'munkalap' | 'kiegeszitok'
     */
    static resolveCategory(mesh) {
        let curr = mesh;
        while (curr) {
            const d = curr.userData || {};
            const name = (d.name || curr.name || '').toLowerCase();

            // 1. Munkalap (Worktop)
            if (d.isWorktop || d.type === 'worktop' || d.isSplashback ||
                name.includes('munkalap') || name.includes('vízzáró') || name.includes('vizzaro')) {
                return 'munkalap';
            }

            // 2. Front (Ajtók, fiókok)
            if (d.isFront || d.isDoor || d.isDrawer || d.type === 'door' || d.type === 'drawer' ||
                name.includes('ajtó') || name.includes('ajto') || name.includes('fiók') || name.includes('fiok') ||
                name.includes('front') || name.includes('előlap') || name.includes('elolap')) {
                return 'front';
            }

            // 3. Kiegészítők (Hardware: fogantyúk, lábak, pántok, beépített gépek)
            if (d.isHardware || d.type === 'hardware' || d.isHandle || d.isLeg || d.isHinge ||
                d.isAppliance || d.type === 'appliance' ||
                name.includes('fogantyú') || name.includes('fogantyu') || name.includes('láb') || name.includes('lab') ||
                name.includes('pánt') || name.includes('pant') || name.includes('mosogató') || name.includes('mosogato') ||
                name.includes('sütő') || name.includes('suto') || name.includes('főzőlap') || name.includes('fozolap') ||
                name.includes('csaptelep')) {
                return 'kiegeszitok';
            }

            // 4. Korpusz (Váz alkatrészek)
            if (d.type === 'side' || d.type === 'bottom' || d.type === 'top' || d.type === 'shelf' || d.type === 'back' ||
                name.includes('oldallap') || name.includes('fenéklap') || name.includes('feneklap') ||
                name.includes('hátfal') || name.includes('hatfal') || name.includes('polc') ||
                name.includes('összekötő') || name.includes('osszekoto') || name.includes('tető') ||
                name.includes('szokli') || name.includes('lábazat') || name.includes('labazat') ||
                name.includes('korpusz') || name.includes('osztófal') || name.includes('osztofal')) {
                return 'korpusz';
            }

            if (d.isCorpus) break;
            curr = curr.parent;
        }

        return 'korpusz';
    }

    /**
     * Ellenőrzi, hogy a mesh exportálandó valós 3D geometria-e
     */
    static isExportableMesh(mesh) {
        if (!mesh || !mesh.isMesh || !mesh.geometry) return false;
        if (mesh.name === '__selection_outline__' || mesh.name === '__selection_highlight__') return false;
        if (mesh.isLine || mesh.isLineSegments || mesh.isPoints) return false;
        if (mesh.userData && (mesh.userData.isHelper || mesh.userData.isGizmo)) return false;
        if (mesh.visible === false) return false;
        return true;
    }

    /**
     * Szövegbiztonság OBJ objektumnevekhez (Blender & 3D szoftver kompatibilitás)
     */
    static sanitizeName(name, fallback = 'Konyha_Elem') {
        if (!name) return fallback;
        const clean = String(name)
            .replace(/[\[\]\(\)\{\}\<\>]/g, '')
            .replace(/[\s	,;:/\]+/g, '_')
            .replace(/[^\w\d\-_áéíóöőúüűÁÉÍÓÖŐÚÜŰ]/g, '')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
        return clean || fallback;
    }

    /**
     * Megkeresi a 4 kategóriához tartozó reprezentatív színeket az MTL fájlhoz
     */
    static extractCategoryColors(boardManager) {
        const colors = {
            korpusz: { r: 0.90, g: 0.90, b: 0.92, name: 'Korpusz' },
            front: { r: 0.25, g: 0.45, b: 0.55, name: 'Front' },
            munkalap: { r: 0.22, g: 0.24, b: 0.28, name: 'Munkalap' },
            kiegeszitok: { r: 0.75, g: 0.75, b: 0.78, name: 'Kiegészítők' }
        };

        if (!boardManager || !boardManager.boards) return colors;

        boardManager.boards.forEach(b => {
            if (!b.mesh || !b.mesh.material || !b.mesh.material.color) return;
            const cat = this.resolveCategory(b.mesh);
            if (colors[cat]) {
                const c = b.mesh.material.color;
                colors[cat].r = Math.round(c.r * 1000) / 1000;
                colors[cat].g = Math.round(c.g * 1000) / 1000;
                colors[cat].b = Math.round(c.b * 1000) / 1000;
            }
        });

        return colors;
    }

    /**
     * MTL (Material Template Library) generálása
     */
    static generateMTL(boardManager) {
        const colors = this.extractCategoryColors(boardManager);
        const timestamp = new Date().toISOString();

        let mtl = # Wavefront Material Library
# Készítette: 3D Bútortervező Studio
# Exportálva: 
# Anyagok száma: 4 (korpusz, front, munkalap, kiegeszitok)

# ==========================================
# 1. KORPUSZ ANYAG (Vázszerkezet)
# ==========================================
newmtl korpusz
Ka 0.2500 0.2500 0.2500
Kd   
Ks 0.2000 0.2000 0.2000
Ns 25.0000
d 1.0000
illum 2

# ==========================================
# 2. FRONT ANYAG (Ajtók, Fiókelők)
# ==========================================
newmtl front
Ka 0.2500 0.2500 0.2500
Kd   
Ks 0.3500 0.3500 0.3500
Ns 45.0000
d 1.0000
illum 2

# ==========================================
# 3. MUNKALAP ANYAG (Konyhapult)
# ==========================================
newmtl munkalap
Ka 0.2500 0.2500 0.2500
Kd   
Ks 0.4000 0.4000 0.4000
Ns 55.0000
d 1.0000
illum 2

# ==========================================
# 4. KIEGÉSZÍTŐK ANYAG (Fogantyúk, Lábak, Pántok)
# ==========================================
newmtl kiegeszitok
Ka 0.2500 0.2500 0.2500
Kd   
Ks 0.8500 0.8500 0.8500
Ns 85.0000
d 1.0000
illum 2
;
        return mtl;
    }

    /**
     * Wavefront OBJ generálása
     * - Minden konyhai korpusz külön Object: o [Név]
     * - Mindegyik elemen belül a felületek kategóriák szerint csoportosítva (usemtl korpusz, usemtl front, usemtl munkalap, usemtl kiegeszitok)
     */
    static generateOBJ(boardManager, mtlFilename = 'konyha_terv.mtl') {
        if (!boardManager) return '';

        // Three.js transzformációs segédváltozók
        const normalMatrix = new THREE.Matrix3();
        const tempV = new THREE.Vector3();
        const tempN = new THREE.Vector3();
        const tempUV = new THREE.Vector2();

        let obj = # Wavefront OBJ File
# Készítette: 3D Bútortervező Studio
# Mértékegység: milliméter (mm)
# Koordináta-rendszer: X=Jobbra, Y=Felfelé, Z=Előre
mtllib 

;

        let vertexOffset = 1;
        let uvOffset = 1;
        let normalOffset = 1;

        // Korpusz egységek és egyedi lapok gyűjtése
        const corpora = boardManager.corpora || [];
        const corpusElementIds = new Set(corpora.map(c => c.userData && c.userData.id));

        // Önálló (nem korpuszhoz tartozó) lapok
        const standaloneBoards = (boardManager.boards || []).filter(b => !b.corpusId || !corpusElementIds.has(b.corpusId));

        // 1. KONYHAI KORPUSZ ELEMEK EXPORTÁLÁSA
        corpora.forEach((corpusGroup, cIdx) => {
            corpusGroup.updateMatrixWorld(true);
            const corpusData = corpusGroup.userData || {};
            const rawName = corpusData.name || Konyha_Elem_;
            const objName = this.sanitizeName(rawName, Konyha_Elem_);

            obj += # -----------------------------------------------------
;
            obj += # KONYHA ELEM #: 
;
            obj += # -----------------------------------------------------
;
            obj += o 
;

            // Meshek gyűjtése és kategória szerinti csoportosítása
            const categorizedMeshes = {
                korpusz: [],
                front: [],
                munkalap: [],
                kiegeszitok: []
            };

            corpusGroup.traverse(child => {
                if (this.isExportableMesh(child)) {
                    child.updateMatrixWorld(true);
                    const cat = this.resolveCategory(child);
                    if (categorizedMeshes[cat]) {
                        categorizedMeshes[cat].push(child);
                    } else {
                        categorizedMeshes.korpusz.push(child);
                    }
                }
            });

            // Kategóriák sorrendje a tiszta szerkezetért
            const categories = ['korpusz', 'front', 'munkalap', 'kiegeszitok'];

            categories.forEach(cat => {
                const meshes = categorizedMeshes[cat];
                if (meshes.length === 0) return;

                obj += usemtl 
;

                meshes.forEach(mesh => {
                    const geometry = mesh.geometry;
                    const posAttr = geometry.attributes.position;
                    const normAttr = geometry.attributes.normal;
                    const uvAttr = geometry.attributes.uv;

                    if (!posAttr || posAttr.count === 0) return;

                    normalMatrix.getNormalMatrix(mesh.matrixWorld);

                    const vStart = vertexOffset;
                    const uvStart = uvOffset;
                    const nStart = normalOffset;

                    // Csúcsok (Vertices)
                    for (let i = 0; i < posAttr.count; i++) {
                        tempV.fromBufferAttribute(posAttr, i);
                        tempV.applyMatrix4(mesh.matrixWorld);
                        obj +=    
;
                    }

                    // Textúra koordináták (UVs)
                    const hasUV = !!(uvAttr && uvAttr.count > 0);
                    if (hasUV) {
                        for (let i = 0; i < uvAttr.count; i++) {
                            tempUV.fromBufferAttribute(uvAttr, i);
                            obj += t  
;
                        }
                    }

                    // Normálvektorok (Normals)
                    const hasNorm = !!(normAttr && normAttr.count > 0);
                    if (hasNorm) {
                        for (let i = 0; i < normAttr.count; i++) {
                            tempN.fromBufferAttribute(normAttr, i);
                            tempN.applyMatrix3(normalMatrix).normalize();
                            obj += n   
;
                        }
                    }

                    // Lapok (Faces)
                    const index = geometry.index;
                    if (index) {
                        for (let i = 0; i < index.count; i += 3) {
                            const i0 = index.getX(i);
                            const i1 = index.getX(i + 1);
                            const i2 = index.getX(i + 2);

                            const v0 = vStart + i0;
                            const v1 = vStart + i1;
                            const v2 = vStart + i2;

                            if (hasUV && hasNorm) {
                                const u0 = uvStart + i0;
                                const u1 = uvStart + i1;
                                const u2 = uvStart + i2;
                                const n0 = nStart + i0;
                                const n1 = nStart + i1;
                                const n2 = nStart + i2;
                                obj +=  // // //
;
                            } else if (hasNorm) {
                                const n0 = nStart + i0;
                                const n1 = nStart + i1;
                                const n2 = nStart + i2;
                                obj +=  // // //
;
                            } else if (hasUV) {
                                const u0 = uvStart + i0;
                                const u1 = uvStart + i1;
                                const u2 = uvStart + i2;
                                obj +=  / / /
;
                            } else {
                                obj +=    
;
                            }
                        }
                    } else {
                        // Nem indexelt geometria
                        for (let i = 0; i < posAttr.count; i += 3) {
                            const v0 = vStart + i;
                            const v1 = vStart + i + 1;
                            const v2 = vStart + i + 2;

                            if (hasUV && hasNorm) {
                                const u0 = uvStart + i;
                                const u1 = uvStart + i + 1;
                                const u2 = uvStart + i + 2;
                                const n0 = nStart + i;
                                const n1 = nStart + i + 1;
                                const n2 = nStart + i + 2;
                                obj +=  // // //
;
                            } else if (hasNorm) {
                                const n0 = nStart + i;
                                const n1 = nStart + i + 1;
                                const n2 = nStart + i + 2;
                                obj +=  // // //
;
                            } else if (hasUV) {
                                const u0 = uvStart + i;
                                const u1 = uvStart + i + 1;
                                const u2 = uvStart + i + 2;
                                obj +=  / / /
;
                            } else {
                                obj +=    
;
                            }
                        }
                    }

                    vertexOffset += posAttr.count;
                    if (hasUV) uvOffset += uvAttr.count;
                    if (hasNorm) normalOffset += normAttr.count;
                });
            });

            obj += 
;
        });

        // 2. ÖNÁLLÓ EGYEDI BÚTORLAPOK EXPORTÁLÁSA (ha vannak)
        if (standaloneBoards.length > 0) {
            obj += # -----------------------------------------------------
;
            obj += # EGYEDI BÚTORLAPOK
;
            obj += # -----------------------------------------------------
;
            obj += o Egyedi_Butorlapok
;

            const standaloneCat = {
                korpusz: [],
                front: [],
                munkalap: [],
                kiegeszitok: []
            };

            standaloneBoards.forEach(b => {
                if (b.mesh && this.isExportableMesh(b.mesh)) {
                    b.mesh.updateMatrixWorld(true);
                    const cat = this.resolveCategory(b.mesh);
                    if (standaloneCat[cat]) standaloneCat[cat].push(b.mesh);
                    else standaloneCat.korpusz.push(b.mesh);
                }
            });

            ['korpusz', 'front', 'munkalap', 'kiegeszitok'].forEach(cat => {
                const meshes = standaloneCat[cat];
                if (meshes.length === 0) return;

                obj += usemtl 
;

                meshes.forEach(mesh => {
                    const geometry = mesh.geometry;
                    const posAttr = geometry.attributes.position;
                    const normAttr = geometry.attributes.normal;
                    const uvAttr = geometry.attributes.uv;

                    if (!posAttr || posAttr.count === 0) return;

                    normalMatrix.getNormalMatrix(mesh.matrixWorld);

                    const vStart = vertexOffset;
                    const uvStart = uvOffset;
                    const nStart = normalOffset;

                    for (let i = 0; i < posAttr.count; i++) {
                        tempV.fromBufferAttribute(posAttr, i);
                        tempV.applyMatrix4(mesh.matrixWorld);
                        obj +=    
;
                    }

                    const hasUV = !!(uvAttr && uvAttr.count > 0);
                    if (hasUV) {
                        for (let i = 0; i < uvAttr.count; i++) {
                            tempUV.fromBufferAttribute(uvAttr, i);
                            obj += t  
;
                        }
                    }

                    const hasNorm = !!(normAttr && normAttr.count > 0);
                    if (hasNorm) {
                        for (let i = 0; i < normAttr.count; i++) {
                            tempN.fromBufferAttribute(normAttr, i);
                            tempN.applyMatrix3(normalMatrix).normalize();
                            obj += n   
;
                        }
                    }

                    const index = geometry.index;
                    if (index) {
                        for (let i = 0; i < index.count; i += 3) {
                            const i0 = index.getX(i);
                            const i1 = index.getX(i + 1);
                            const i2 = index.getX(i + 2);
                            const v0 = vStart + i0;
                            const v1 = vStart + i1;
                            const v2 = vStart + i2;

                            if (hasUV && hasNorm) {
                                obj +=  // // //
;
                            } else if (hasNorm) {
                                obj +=  // // //
;
                            } else {
                                obj +=    
;
                            }
                        }
                    }

                    vertexOffset += posAttr.count;
                    if (hasUV) uvOffset += uvAttr.count;
                    if (hasNorm) normalOffset += normAttr.count;
                });
            });
        }

        return obj;
    }

    /**
     * Letöltés indítása közvetlen böngésző Blob segítségével
     */
    static triggerDownload(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
    }

    /**
     * ZIP csomag exportálása és letöltése (OBJ + MTL együtt)
     */
    static exportZip(boardManager, baseFilename = 'konyha_terv') {
        const objName = ${baseFilename}.obj;
        const mtlName = ${baseFilename}.mtl;
        const zipName = ${baseFilename}_obj.zip;

        const objContent = this.generateOBJ(boardManager, mtlName);
        const mtlContent = this.generateMTL(boardManager);

        // Ha elérhető az fflate tömörítő könyvtár
        if (typeof fflate !== 'undefined' && typeof fflate.zipSync === 'function') {
            try {
                const zipData = fflate.zipSync({
                    [objName]: fflate.strToU8(objContent),
                    [mtlName]: fflate.strToU8(mtlContent)
                });
                const blob = new Blob([zipData], { type: 'application/zip' });
                this.triggerDownload(blob, zipName);
                return { success: true, filename: zipName, format: 'zip' };
            } catch (err) {
                console.warn('[OBJ Export] Hiba a ZIP tömörítéskor, visszaváltás OBJ letöltésre:', err);
            }
        }

        // Tartalék mód: OBJ fájl közvetlen letöltése
        const blob = new Blob([objContent], { type: 'text/plain;charset=utf-8' });
        this.triggerDownload(blob, objName);
        return { success: true, filename: objName, format: 'obj' };
    }

    /**
     * Csak az OBJ fájl letöltése
     */
    static exportOBJOnly(boardManager, baseFilename = 'konyha_terv') {
        const objName = ${baseFilename}.obj;
        const mtlName = ${baseFilename}.mtl;
        const objContent = this.generateOBJ(boardManager, mtlName);
        const blob = new Blob([objContent], { type: 'text/plain;charset=utf-8' });
        this.triggerDownload(blob, objName);
        return { success: true, filename: objName };
    }

    /**
     * Csak az MTL anyagfájl letöltése
     */
    static exportMTLOnly(boardManager, baseFilename = 'konyha_terv') {
        const mtlName = ${baseFilename}.mtl;
        const mtlContent = this.generateMTL(boardManager);
        const blob = new Blob([mtlContent], { type: 'text/plain;charset=utf-8' });
        this.triggerDownload(blob, mtlName);
        return { success: true, filename: mtlName };
    }
}

if (typeof window !== 'undefined') {
    window.ObjExporter = ObjExporter;
}
