/**
 * Wavefront OBJ es MTL Exportalo Modul (objExporter.js)
 * Professzionalis 3D CAD/DCC (Blender, 3ds Max, Maya, Rhino, SketchUp, Cinema 4D).
 */

export class ObjExporter {
    static resolveCategory(mesh) {
        let curr = mesh;
        while (curr) {
            const d = curr.userData || {};
            const name = (d.name || curr.name || '').toLowerCase();

            if (d.isWorktop || d.type === 'worktop' || d.isSplashback ||
                name.includes('munkalap') || name.includes('vizzaro') || name.includes('vízzáró')) {
                return 'munkalap';
            }

            if (d.isFront || d.isDoor || d.isDrawer || d.type === 'door' || d.type === 'drawer' ||
                name.includes('ajto') || name.includes('ajtó') || name.includes('fiok') || name.includes('fiók') ||
                name.includes('front') || name.includes('elolap') || name.includes('előlap')) {
                return 'front';
            }

            if (d.isHardware || d.type === 'hardware' || d.isHandle || d.isLeg || d.isHinge ||
                d.isAppliance || d.type === 'appliance' ||
                name.includes('fogantyu') || name.includes('fogantyú') || name.includes('lab') || name.includes('láb') ||
                name.includes('pant') || name.includes('pánt') || name.includes('mosogato') || name.includes('mosogató') ||
                name.includes('suto') || name.includes('sütő') || name.includes('fozolap') || name.includes('főzőlap') ||
                name.includes('csaptelep')) {
                return 'kiegeszitok';
            }

            if (d.type === 'side' || d.type === 'bottom' || d.type === 'top' || d.type === 'shelf' || d.type === 'back' ||
                name.includes('oldallap') || name.includes('feneklap') || name.includes('fenéklap') ||
                name.includes('hatfal') || name.includes('hátfal') || name.includes('polc') ||
                name.includes('osszekoto') || name.includes('összekötő') || name.includes('teto') || name.includes('tető') ||
                name.includes('szokli') || name.includes('labazat') || name.includes('lábazat') ||
                name.includes('korpusz') || name.includes('osztofal') || name.includes('osztófal')) {
                return 'korpusz';
            }

            if (d.isCorpus) break;
            curr = curr.parent;
        }

        return 'korpusz';
    }

    static isExportableMesh(mesh) {
        if (!mesh || !mesh.isMesh || !mesh.geometry) return false;
        if (mesh.name === '__selection_outline__' || mesh.name === '__selection_highlight__') return false;
        if (mesh.isLine || mesh.isLineSegments || mesh.isPoints) return false;
        if (mesh.userData && (mesh.userData.isHelper || mesh.userData.isGizmo)) return false;
        if (mesh.visible === false) return false;
        return true;
    }

    static sanitizeName(name, fallback = 'Konyha_Elem') {
        if (!name) return fallback;
        const clean = String(name)
            .replace(/[^a-zA-Z0-9_áéíóöőúüűÁÉÍÓÖŐÚÜŰ]+/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
        return clean || fallback;
    }

    static extractCategoryColors(boardManager) {
        const colors = {
            korpusz: { r: 0.90, g: 0.90, b: 0.92 },
            front: { r: 0.25, g: 0.45, b: 0.55 },
            munkalap: { r: 0.22, g: 0.24, b: 0.28 },
            kiegeszitok: { r: 0.75, g: 0.75, b: 0.78 }
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

    static generateMTL(boardManager) {
        const colors = this.extractCategoryColors(boardManager);
        const timestamp = new Date().toISOString();

        let mtl = '# Wavefront Material Library\n';
        mtl += '# Keszitette: 3D Butortervezo Studio\n';
        mtl += '# Exportalva: ' + timestamp + '\n\n';

        mtl += 'newmtl korpusz\n';
        mtl += 'Ka 0.2500 0.2500 0.2500\n';
        mtl += 'Kd ' + colors.korpusz.r.toFixed(4) + ' ' + colors.korpusz.g.toFixed(4) + ' ' + colors.korpusz.b.toFixed(4) + '\n';
        mtl += 'Ks 0.2000 0.2000 0.2000\n';
        mtl += 'Ns 25.0000\n';
        mtl += 'd 1.0000\n';
        mtl += 'illum 2\n\n';

        mtl += 'newmtl front\n';
        mtl += 'Ka 0.2500 0.2500 0.2500\n';
        mtl += 'Kd ' + colors.front.r.toFixed(4) + ' ' + colors.front.g.toFixed(4) + ' ' + colors.front.b.toFixed(4) + '\n';
        mtl += 'Ks 0.3500 0.3500 0.3500\n';
        mtl += 'Ns 45.0000\n';
        mtl += 'd 1.0000\n';
        mtl += 'illum 2\n\n';

        mtl += 'newmtl munkalap\n';
        mtl += 'Ka 0.2500 0.2500 0.2500\n';
        mtl += 'Kd ' + colors.munkalap.r.toFixed(4) + ' ' + colors.munkalap.g.toFixed(4) + ' ' + colors.munkalap.b.toFixed(4) + '\n';
        mtl += 'Ks 0.4000 0.4000 0.4000\n';
        mtl += 'Ns 55.0000\n';
        mtl += 'd 1.0000\n';
        mtl += 'illum 2\n\n';

        mtl += 'newmtl kiegeszitok\n';
        mtl += 'Ka 0.2500 0.2500 0.2500\n';
        mtl += 'Kd ' + colors.kiegeszitok.r.toFixed(4) + ' ' + colors.kiegeszitok.g.toFixed(4) + ' ' + colors.kiegeszitok.b.toFixed(4) + '\n';
        mtl += 'Ks 0.8500 0.8500 0.8500\n';
        mtl += 'Ns 85.0000\n';
        mtl += 'd 1.0000\n';
        mtl += 'illum 2\n';

        return mtl;
    }

    static generateOBJ(boardManager, mtlFilename = 'konyha_terv.mtl') {
        if (!boardManager) return '';

        const normalMatrix = new THREE.Matrix3();
        const tempV = new THREE.Vector3();
        const tempN = new THREE.Vector3();
        const tempUV = new THREE.Vector2();

        let obj = '# Wavefront OBJ File\n';
        obj += '# Keszitette: 3D Butortervezo Studio\n';
        obj += '# Mertekegyseg: millimeter (mm)\n';
        obj += 'mtllib ' + mtlFilename + '\n\n';

        let vertexOffset = 1;
        let uvOffset = 1;
        let normalOffset = 1;

        const corpora = boardManager.corpora || [];
        const corpusElementIds = new Set(corpora.map(c => c.userData && c.userData.id));
        const standaloneBoards = (boardManager.boards || []).filter(b => !b.corpusId || !corpusElementIds.has(b.corpusId));

        corpora.forEach((corpusGroup, cIdx) => {
            corpusGroup.updateMatrixWorld(true);
            const corpusData = corpusGroup.userData || {};
            const rawName = corpusData.name || ('Konyha_Elem_' + (cIdx + 1));
            const objName = this.sanitizeName(rawName, 'Konyha_Elem_' + (cIdx + 1));

            obj += 'o ' + objName + '\n';

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

            const categories = ['korpusz', 'front', 'munkalap', 'kiegeszitok'];

            categories.forEach(cat => {
                const meshes = categorizedMeshes[cat];
                if (meshes.length === 0) return;

                obj += 'usemtl ' + cat + '\n';

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
                        obj += 'v ' + tempV.x.toFixed(3) + ' ' + tempV.y.toFixed(3) + ' ' + tempV.z.toFixed(3) + '\n';
                    }

                    const hasUV = !!(uvAttr && uvAttr.count > 0);
                    if (hasUV) {
                        for (let i = 0; i < uvAttr.count; i++) {
                            tempUV.fromBufferAttribute(uvAttr, i);
                            obj += 'vt ' + tempUV.x.toFixed(4) + ' ' + tempUV.y.toFixed(4) + '\n';
                        }
                    }

                    const hasNorm = !!(normAttr && normAttr.count > 0);
                    if (hasNorm) {
                        for (let i = 0; i < normAttr.count; i++) {
                            tempN.fromBufferAttribute(normAttr, i);
                            tempN.applyMatrix3(normalMatrix).normalize();
                            obj += 'vn ' + tempN.x.toFixed(4) + ' ' + tempN.y.toFixed(4) + ' ' + tempN.z.toFixed(4) + '\n';
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
                                const u0 = uvStart + i0;
                                const u1 = uvStart + i1;
                                const u2 = uvStart + i2;
                                const n0 = nStart + i0;
                                const n1 = nStart + i1;
                                const n2 = nStart + i2;
                                obj += 'f ' + v0 + '/' + u0 + '/' + n0 + ' ' + v1 + '/' + u1 + '/' + n1 + ' ' + v2 + '/' + u2 + '/' + n2 + '\n';
                            } else if (hasNorm) {
                                const n0 = nStart + i0;
                                const n1 = nStart + i1;
                                const n2 = nStart + i2;
                                obj += 'f ' + v0 + '//' + n0 + ' ' + v1 + '//' + n1 + ' ' + v2 + '//' + n2 + '\n';
                            } else if (hasUV) {
                                const u0 = uvStart + i0;
                                const u1 = uvStart + i1;
                                const u2 = uvStart + i2;
                                obj += 'f ' + v0 + '/' + u0 + ' ' + v1 + '/' + u1 + ' ' + v2 + '/' + u2 + '\n';
                            } else {
                                obj += 'f ' + v0 + ' ' + v1 + ' ' + v2 + '\n';
                            }
                        }
                    } else {
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
                                obj += 'f ' + v0 + '/' + u0 + '/' + n0 + ' ' + v1 + '/' + u1 + '/' + n1 + ' ' + v2 + '/' + u2 + '/' + n2 + '\n';
                            } else if (hasNorm) {
                                const n0 = nStart + i;
                                const n1 = nStart + i + 1;
                                const n2 = nStart + i + 2;
                                obj += 'f ' + v0 + '//' + n0 + ' ' + v1 + '//' + n1 + ' ' + v2 + '//' + n2 + '\n';
                            } else if (hasUV) {
                                const u0 = uvStart + i;
                                const u1 = uvStart + i + 1;
                                const u2 = uvStart + i + 2;
                                obj += 'f ' + v0 + '/' + u0 + ' ' + v1 + '/' + u1 + ' ' + v2 + '/' + u2 + '\n';
                            } else {
                                obj += 'f ' + v0 + ' ' + v1 + ' ' + v2 + '\n';
                            }
                        }
                    }

                    vertexOffset += posAttr.count;
                    if (hasUV) uvOffset += uvAttr.count;
                    if (hasNorm) normalOffset += normAttr.count;
                });
            });

            obj += '\n';
        });

        if (standaloneBoards.length > 0) {
            obj += 'o Egyedi_Butorlapok\n';

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

                obj += 'usemtl ' + cat + '\n';

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
                        obj += 'v ' + tempV.x.toFixed(3) + ' ' + tempV.y.toFixed(3) + ' ' + tempV.z.toFixed(3) + '\n';
                    }

                    const hasUV = !!(uvAttr && uvAttr.count > 0);
                    if (hasUV) {
                        for (let i = 0; i < uvAttr.count; i++) {
                            tempUV.fromBufferAttribute(uvAttr, i);
                            obj += 'vt ' + tempUV.x.toFixed(4) + ' ' + tempUV.y.toFixed(4) + '\n';
                        }
                    }

                    const hasNorm = !!(normAttr && normAttr.count > 0);
                    if (hasNorm) {
                        for (let i = 0; i < normAttr.count; i++) {
                            tempN.fromBufferAttribute(normAttr, i);
                            tempN.applyMatrix3(normalMatrix).normalize();
                            obj += 'vn ' + tempN.x.toFixed(4) + ' ' + tempN.y.toFixed(4) + ' ' + tempN.z.toFixed(4) + '\n';
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
                                obj += 'f ' + v0 + '/' + (uvStart + i0) + '/' + (nStart + i0) + ' ' + v1 + '/' + (uvStart + i1) + '/' + (nStart + i1) + ' ' + v2 + '/' + (uvStart + i2) + '/' + (nStart + i2) + '\n';
                            } else if (hasNorm) {
                                obj += 'f ' + v0 + '//' + (nStart + i0) + ' ' + v1 + '//' + (nStart + i1) + ' ' + v2 + '//' + (nStart + i2) + '\n';
                            } else {
                                obj += 'f ' + v0 + ' ' + v1 + ' ' + v2 + '\n';
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

    static exportZip(boardManager, baseFilename = 'konyha_terv') {
        const objName = baseFilename + '.obj';
        const mtlName = baseFilename + '.mtl';
        const zipName = baseFilename + '_obj.zip';

        const objContent = this.generateOBJ(boardManager, mtlName);
        const mtlContent = this.generateMTL(boardManager);

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
                console.warn('[OBJ Export] Hiba a ZIP csomagolaskor:', err);
            }
        }

        const blob = new Blob([objContent], { type: 'text/plain;charset=utf-8' });
        this.triggerDownload(blob, objName);
        return { success: true, filename: objName, format: 'obj' };
    }

    static exportOBJOnly(boardManager, baseFilename = 'konyha_terv') {
        const objName = baseFilename + '.obj';
        const mtlName = baseFilename + '.mtl';
        const objContent = this.generateOBJ(boardManager, mtlName);
        const blob = new Blob([objContent], { type: 'text/plain;charset=utf-8' });
        this.triggerDownload(blob, objName);
        return { success: true, filename: objName };
    }

    static exportMTLOnly(boardManager, baseFilename = 'konyha_terv') {
        const mtlName = baseFilename + '.mtl';
        const mtlContent = this.generateMTL(boardManager);
        const blob = new Blob([mtlContent], { type: 'text/plain;charset=utf-8' });
        this.triggerDownload(blob, mtlName);
        return { success: true, filename: mtlName };
    }
}

if (typeof window !== 'undefined') {
    window.ObjExporter = ObjExporter;
}
