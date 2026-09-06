/**
 * Bútorlap és Korpusz Egység Menedzser (boardManager.js)
 * Bútorlapok és egybefüggő Konyha Korpusz egységek kezelése
 */

import { MaterialManager } from './textures.js';
import { KitchenCorpusGenerator } from './kitchenCorpusGenerator.js';
import { ModelManager } from './modelManager.js';

/**
 * Box / Triplanar UV leképezés generátor
 * Biztosítja, hogy a Three.js Extrude és Box geometriákon a faerezet és egyéb textúrák
 * valósághű méretben (nem összenyomva/eltorzítva) jelenjenek meg minden oldalon és élen.
 */
export function applyBoxUVs(geometry, w, h, d, tileSize = 800) {
    if (!geometry || !geometry.attributes || !geometry.attributes.position) return geometry;
    const pos = geometry.attributes.position;
    const norm = geometry.attributes.normal;
    const count = pos.count;
    const uvs = new Float32Array(count * 2);

    for (let i = 0; i < count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);

        const nx = norm ? norm.getX(i) : 0;
        const ny = norm ? norm.getY(i) : 0;
        const nz = norm ? norm.getZ(i) : 1;

        const absX = Math.abs(nx);
        const absY = Math.abs(ny);
        const absZ = Math.abs(nz);

        let u, v;

        if (absX >= absY && absX >= absZ) {
            // X felület normálvektora (Oldallap nagy síkja: Z-Y sík)
            u = (z + d / 2) / tileSize;
            v = (y + h / 2) / tileSize;
        } else if (absY >= absX && absY >= absZ) {
            // Y felület normálvektora (Fenéklap, tetőlap, polc nagy síkja: X-Z sík)
            u = (x + w / 2) / tileSize;
            v = (z + d / 2) / tileSize;
        } else {
            // Z felület normálvektora (Hátfal, ajtó nagy síkja: X-Y sík)
            u = (x + w / 2) / tileSize;
            v = (y + h / 2) / tileSize;
        }

        uvs[i * 2] = u;
        uvs[i * 2 + 1] = v;
    }

    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.attributes.uv.needsUpdate = true;
    return geometry;
}

/**
 * Lekerekített bútorlap / munkalap geometria generátor
 * Pontos (w, h, d) befoglaló méretekkel és lekerekített (beveled) élekkel
 */
export function createRoundedBoxGeometry(w, h, d, radius = 1, bevelSegments = 2) {
    const minDim = Math.min(w, h, d);
    const maxAllowedRadius = (minDim / 2) - 0.1;
    const r = Math.min(Math.max(0, Number(radius) !== undefined ? Number(radius) : 1), Math.max(0, maxAllowedRadius));

    if (r <= 0.05) {
        const geo = new THREE.BoxGeometry(w, h, d);
        applyBoxUVs(geo, w, h, d, 800);
        geo.parameters = { width: w, height: h, depth: d, radius: 0 };
        return geo;
    }

    try {
        const innerW = Math.max(0.1, w - 2 * r);
        const innerH = Math.max(0.1, h - 2 * r);
        const x0 = -innerW / 2;
        const x1 = innerW / 2;
        const y0 = -innerH / 2;
        const y1 = innerH / 2;

        const shape = new THREE.Shape();
        shape.moveTo(x0 + r, y0);
        shape.lineTo(x1 - r, y0);
        shape.absarc(x1 - r, y0 + r, r, -Math.PI / 2, 0, false);
        shape.lineTo(x1, y1 - r);
        shape.absarc(x1 - r, y1 - r, r, 0, Math.PI / 2, false);
        shape.lineTo(x0 + r, y1);
        shape.absarc(x0 + r, y1 - r, r, Math.PI / 2, Math.PI, false);
        shape.lineTo(x0, y0 + r);
        shape.absarc(x0 + r, y0 + r, r, Math.PI, 3 * Math.PI / 2, false);

        const extrudeDepth = Math.max(0.1, d - 2 * r);
        const extrudeSettings = {
            depth: extrudeDepth,
            bevelEnabled: true,
            bevelSegments: bevelSegments,
            steps: 1,
            bevelSize: r,
            bevelThickness: r
        };

        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geometry.center();
        geometry.computeVertexNormals();
        applyBoxUVs(geometry, w, h, d, 800);
        geometry.parameters = { width: w, height: h, depth: d, radius: r };
        return geometry;
    } catch (e) {
        console.warn('Fallback to BoxGeometry:', e);
        const fallback = new THREE.BoxGeometry(w, h, d);
        applyBoxUVs(fallback, w, h, d, 800);
        fallback.parameters = { width: w, height: h, depth: d, radius: 0 };
        return fallback;
    }
}
/**
 * Konyhai Munkalap Geometria Generátor
 * CSAK az elülső (+Z) felső és alsó élek vannak lekerekítve.
 * A bal és jobb oldali végek (-X és +X) és a hátsó fal felőli él (-Z) 90°-os sík vágások,
 * így az egymás mellé helyezett munkalapok hézagmentesen, tökéletesen egybefüggenek.
 */
export function createWorktopGeometry(w, h, d, radius = 3) {
    const r = Math.min(Math.max(0, Number(radius) !== undefined ? Number(radius) : 3), Math.min(h / 2 - 0.1, d / 2 - 0.1));

    if (r <= 0.05) {
        const geo = new THREE.BoxGeometry(w, h, d);
        applyBoxUVs(geo, w, h, d, 800);
        geo.parameters = { width: w, height: h, depth: d, radius: 0, isWorktop: true };
        return geo;
    }

    try {
        const shape = new THREE.Shape();
        const halfH = h / 2;
        const halfD = d / 2;

        // Y-Z síkbeli keresztmetszet (Z a vízszintes mélység, Y a függőleges magasság)
        // Kezdés a hátsó alsó saroknál (CCW körbejárás)
        shape.moveTo(-halfD, -halfH);
        // Alsó sík felület az elülső alsó sarokig
        shape.lineTo(halfD - r, -halfH);
        // Elülső alsó lekerekítés
        shape.absarc(halfD - r, -halfH + r, r, -Math.PI / 2, 0, false);
        // Elülső függőleges él
        shape.lineTo(halfD, halfH - r);
        // Elülső felső lekerekítés
        shape.absarc(halfD - r, halfH - r, r, 0, Math.PI / 2, false);
        // Felső sík felület vissza a hátfalig
        shape.lineTo(-halfD, halfH);
        // Hátsó egyenes él (sík 90° fal felőli él)
        shape.lineTo(-halfD, -halfH);

        const extrudeSettings = {
            depth: w,
            bevelEnabled: false,
            steps: 1
        };

        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        // Elforgatjuk az extrúzió tengelyét X-re úgy, hogy a lekerekítés a front (+Z) felé essen
        geometry.rotateY(-Math.PI / 2);
        geometry.center();
        geometry.computeVertexNormals();
        applyBoxUVs(geometry, w, h, d, 800);
        geometry.parameters = { width: w, height: h, depth: d, radius: r, isWorktop: true };
        return geometry;
    } catch (e) {
        console.warn('Fallback worktop geometry:', e);
        const fallback = new THREE.BoxGeometry(w, h, d);
        applyBoxUVs(fallback, w, h, d, 800);
        fallback.parameters = { width: w, height: h, depth: d, radius: 0, isWorktop: true };
        return fallback;
    }
}

/**
 * Szokli Takaróléc Geometria Generátor
 * A bal és jobb oldali végek 90°-os síkok, így a szomszédos szoklik hézagmentesen összeolvadnak.
 */
export function createPlinthGeometry(w, h, d) {
    const geo = new THREE.BoxGeometry(w, h, d);
    applyBoxUVs(geo, w, h, d, 800);
    geo.parameters = { width: w, height: h, depth: d, isPlinth: true };
    return geo;
}

/**
 * Saroklevágott / Lekerekített Végzáró Bútorlap Geometria Generátor
 * (Fenéklap, Polcok és Tetőlap sarokcsapással vagy íves lekerekítéssel a nyitott saroknál)
 */
export function createCornerCutBoardGeometry(w, h, d, cornerCut) {
    const side = cornerCut.side || 'right'; // 'right' (Jobbos - jobb elöl nyitott) | 'left' (Balos - bal elöl nyitott)
    const cornerType = cornerCut.type || 'chamfer'; // 'chamfer' | 'round'
    const cutX = Math.min(Math.max(1, Number(cornerCut.sizeX) || 80), Math.max(1, w - 10));
    const cutZ = Math.min(Math.max(1, Number(cornerCut.sizeZ) || 80), Math.max(1, d - 10));
    const radius = Math.min(Math.max(1, Number(cornerCut.radius) || Number(cornerCut.sizeX) || 80), Math.max(1, Math.min(w - 10, d - 10)));

    try {
        const shape = new THREE.Shape();
        const hw = w / 2;
        const hd = d / 2;

        if (side === 'right') {
            // Jobbos végzáró: A nyitott sarok a jobb elülső (+hw, +hd)
            if (cornerType === 'chamfer') {
                shape.moveTo(-hw, -hd);              // Bal hátsó sarok
                shape.lineTo(+hw, -hd);              // Jobb hátsó sarok
                shape.lineTo(+hw, +hd - cutZ);       // Jobb oldal a levágásig
                shape.lineTo(+hw - cutX, +hd);       // Levágás az elülső oldalra
                shape.lineTo(-hw, +hd);              // Bal első sarok
                shape.lineTo(-hw, -hd);              // Zárás
            } else {
                // Lekerekített íves sarok (+hw, +hd)
                shape.moveTo(-hw, -hd);
                shape.lineTo(+hw, -hd);
                shape.lineTo(+hw, +hd - radius);
                shape.absarc(+hw - radius, +hd - radius, radius, 0, Math.PI / 2, false);
                shape.lineTo(-hw, +hd);
                shape.lineTo(-hw, -hd);
            }
        } else {
            // Balos végzáró: A nyitott sarok a bal elülső (-hw, +hd)
            if (cornerType === 'chamfer') {
                shape.moveTo(+hw, -hd);              // Jobb hátsó sarok
                shape.lineTo(+hw, +hd);              // Jobb első sarok
                shape.lineTo(-hw + cutX, +hd);       // Elülső él a levágásig
                shape.lineTo(-hw, +hd - cutZ);       // Levágás a bal oldalra
                shape.lineTo(-hw, -hd);              // Bal hátsó sarok
                shape.lineTo(+hw, -hd);              // Zárás
            } else {
                // Lekerekített íves sarok (-hw, +hd)
                shape.moveTo(+hw, -hd);
                shape.lineTo(+hw, +hd);
                shape.lineTo(-hw + radius, +hd);
                shape.absarc(-hw + radius, +hd - radius, radius, Math.PI / 2, Math.PI, false);
                shape.lineTo(-hw, -hd);
                shape.lineTo(+hw, -hd);
            }
        }

        const extrudeSettings = {
            depth: h,
            bevelEnabled: false,
            steps: 1
        };

        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geometry.rotateX(Math.PI / 2);
        geometry.center();
        geometry.computeVertexNormals();
        applyBoxUVs(geometry, w, h, d, 800);
        geometry.parameters = { width: w, height: h, depth: d, cornerCut };
        return geometry;
    } catch (e) {
        console.warn('Fallback to BoxGeometry for corner cut:', e);
        const fallback = new THREE.BoxGeometry(w, h, d);
        applyBoxUVs(fallback, w, h, d, 800);
        fallback.parameters = { width: w, height: h, depth: d };
        return fallback;
    }
}

export function mergeSimpleGeometries(geometries) {
    const nonIndexed = geometries.map(g => g.index ? g.toNonIndexed() : g);
    let totalCount = 0;
    nonIndexed.forEach(g => {
        totalCount += g.attributes.position.count;
    });

    const posArray = new Float32Array(totalCount * 3);
    const normArray = new Float32Array(totalCount * 3);

    let offset = 0;
    nonIndexed.forEach(g => {
        const pos = g.attributes.position.array;
        const norm = g.attributes.normal ? g.attributes.normal.array : null;
        posArray.set(pos, offset * 3);
        if (norm) {
            normArray.set(norm, offset * 3);
        }
        offset += g.attributes.position.count;
    });

    const merged = new THREE.BufferGeometry();
    merged.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    merged.setAttribute('normal', new THREE.BufferAttribute(normArray, 3));
    return merged;
}

/**
 * Saroklevágott Munkalap Geometria Generátor
 * CSAK az elülső fő munkalap él kap 3mm lekerekítést (postforming),
 * míg a 45°-os saroklevágás és a nyitott oldal 90°-os sík (éles) vágás marad.
 */
export function createCornerCutWorktopGeometry(w, h, d, radius = 3, cornerCut = {}) {
    const side = cornerCut.side || 'right'; // 'right' | 'left'
    const cornerType = cornerCut.type || 'chamfer'; // 'chamfer' | 'round'
    const cutX = Math.min(Math.max(1, Number(cornerCut.sizeX) || 80), Math.max(1, w - 10));
    const cutZ = Math.min(Math.max(1, Number(cornerCut.sizeZ) || 80), Math.max(1, d - 10));
    const r = Math.min(Math.max(0, Number(radius) !== undefined ? Number(radius) : 3), Math.min(h / 2 - 0.1, d / 2 - 0.1));

    try {
        const wA = w - cutX;
        if (wA <= 5) {
            return createCornerCutBoardGeometry(w, h, d, cornerCut);
        }

        if (side === 'right') {
            // A) Bal oldali fő munkalap szakasz (R3 elülső él lekerekítéssel)
            const geoA = createWorktopGeometry(wA, h, d, r);
            const xA = -w / 2 + wA / 2;
            geoA.translate(xA, 0, 0);

            // B) Jobb oldali sarok szakasz (sík 90° vágásokkal, nincs elülső R3 él)
            const shapeB = new THREE.Shape();
            const xStart = w / 2 - cutX;
            const xEnd = w / 2;
            const zBack = -d / 2;
            const zCutSide = d / 2 - cutZ;
            const zFront = d / 2;

            shapeB.moveTo(xStart, zBack);
            shapeB.lineTo(xEnd, zBack);
            shapeB.lineTo(xEnd, zCutSide);
            if (cornerType === 'round') {
                const roundR = Math.min(cutX, cutZ);
                shapeB.absarc(xEnd - roundR, zFront - roundR, roundR, 0, Math.PI / 2, false);
            } else {
                shapeB.lineTo(xStart, zFront);
            }
            shapeB.lineTo(xStart, zBack);

            const geoB = new THREE.ExtrudeGeometry(shapeB, { depth: h, bevelEnabled: false, steps: 1 });
            geoB.rotateX(Math.PI / 2);
            geoB.translate(0, h / 2, 0);

            const merged = mergeSimpleGeometries([geoA, geoB]);
            merged.computeVertexNormals();
            applyBoxUVs(merged, w, h, d, 800);
            merged.parameters = { width: w, height: h, depth: d, radius: r, cornerCut, isWorktop: true };
            return merged;
        } else {
            // Balos végzáró munkalap
            // A) Jobb oldali fő munkalap szakasz (R3 elülső él lekerekítéssel)
            const geoA = createWorktopGeometry(wA, h, d, r);
            const xA = w / 2 - wA / 2;
            geoA.translate(xA, 0, 0);

            // B) Bal oldali sarok szakasz (sík 90° vágásokkal)
            const shapeB = new THREE.Shape();
            const xStart = -w / 2;
            const xEnd = -w / 2 + cutX;
            const zBack = -d / 2;
            const zCutSide = d / 2 - cutZ;
            const zFront = d / 2;

            shapeB.moveTo(xStart, zBack);
            shapeB.lineTo(xEnd, zBack);
            shapeB.lineTo(xEnd, zFront);
            if (cornerType === 'round') {
                const roundR = Math.min(cutX, cutZ);
                shapeB.absarc(xStart + roundR, zFront - roundR, roundR, Math.PI / 2, Math.PI, false);
            } else {
                shapeB.lineTo(xStart, zCutSide);
            }
            shapeB.lineTo(xStart, zBack);

            const geoB = new THREE.ExtrudeGeometry(shapeB, { depth: h, bevelEnabled: false, steps: 1 });
            geoB.rotateX(Math.PI / 2);
            geoB.translate(0, h / 2, 0);

            const merged = mergeSimpleGeometries([geoA, geoB]);
            merged.computeVertexNormals();
            applyBoxUVs(merged, w, h, d, 800);
            merged.parameters = { width: w, height: h, depth: d, radius: r, cornerCut, isWorktop: true };
            return merged;
        }
    } catch (e) {
        console.warn('Fallback corner cut worktop geometry:', e);
        return createCornerCutBoardGeometry(w, h, d, cornerCut);
    }
}

/**
 * Megfelelő geometriát választ a bútorlap típusa alapján
 */
export function createBoardGeometry(boardData) {
    const width = Number(boardData.width) || 600;
    const height = Number(boardData.height) || 18;
    const depth = Number(boardData.depth) || 400;
    const isSplashback = boardData.isSplashback || (boardData.name && boardData.name.includes('Hátfalpanel'));
    const isWorktop = !isSplashback && (boardData.isWorktop || boardData.type === 'worktop' || (boardData.name && boardData.name.includes('Munkalap')));
    const isPlinth = boardData.isPlinth || boardData.type === 'plinth' || (boardData.name && boardData.name.includes('Szokli'));

    if (boardData.cornerCut && boardData.cornerCut.enabled) {
        if (isWorktop) {
            const rad = boardData.edgeRadius !== undefined ? Number(boardData.edgeRadius) : 3;
            return createCornerCutWorktopGeometry(width, height, depth, rad, boardData.cornerCut);
        }
        return createCornerCutBoardGeometry(width, height, depth, boardData.cornerCut);
    }
    if (boardData.isHardware || boardData.type === 'hardware') {
        const geo = new THREE.BoxGeometry(width, height, depth);
        applyBoxUVs(geo, width, height, depth, 400);
        geo.parameters = { width, height, depth, isHardware: true };
        return geo;
    }
    if (isWorktop) {
        const rad = boardData.edgeRadius !== undefined ? Number(boardData.edgeRadius) : 3;
        return createWorktopGeometry(width, height, depth, rad);
    }
    if (isPlinth || isSplashback || boardData.type === 'back' || boardData.isBack || depth <= 4) {
        const geo = new THREE.BoxGeometry(width, height, depth);
        applyBoxUVs(geo, width, height, depth, 800);
        geo.parameters = { width, height, depth, isPlinth: !!isPlinth, isSplashback: !!isSplashback, isBack: boardData.type === 'back' || boardData.isBack };
        return geo;
    }
    const rad = boardData.edgeRadius !== undefined ? Number(boardData.edgeRadius) : 1;
    return createRoundedBoxGeometry(width, height, depth, rad);
}

export class BoardManager {
    constructor(scene3D) {
        this.scene3D = scene3D;
        this.boards = [];   // Egyedi és korpusz alkatrészlapok listája (CutListhez és méretezéshez)
        this.corpora = [];  // Konyha Korpusz egységek listája (THREE.Group)
        this.customGroups = []; // Egyedi bútorlap csoportok listája (THREE.Group)
        this.boardCounter = 1;
        this.corpusCounter = 1;
        this.groupCounter = 1;
        this.activeTextureKey = 'front_k001';
    }

    /**
     * Új önálló bútorlap hozzáadása a térhez
     */
    createBoard(options = {}) {
        const id = 'board_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        const name = options.name || `Bútorlap ${this.boardCounter++}`;
        const width = Number(options.width) || 600;
        const height = Number(options.height) || 18;
        const depth = Number(options.depth) || 400;
        const thickness = Number(options.thickness) || (options.type === 'back' ? 3 : 18);
        const textureKey = options.textureKey || this.activeTextureKey;
        const type = options.type || 'horizontal';
        const edgeRadius = options.edgeRadius !== undefined ? Number(options.edgeRadius) : (type === 'worktop' ? 3 : 1);

        const x = options.x !== undefined ? Number(options.x) : 0;
        const y = options.y !== undefined ? Number(options.y) : (height / 2);
        const z = options.z !== undefined ? Number(options.z) : 0;

        const rotX = options.rotX !== undefined ? Number(options.rotX) : 0;
        const rotY = options.rotY !== undefined ? Number(options.rotY) : 0;
        const rotZ = options.rotZ !== undefined ? Number(options.rotZ) : 0;

        const geometry = createBoardGeometry({ ...options, width, height, depth, edgeRadius, type });
        const material = MaterialManager.createMaterial(textureKey);

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        mesh.rotation.set(
            THREE.MathUtils.degToRad(rotX),
            THREE.MathUtils.degToRad(rotY),
            THREE.MathUtils.degToRad(rotZ)
        );
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const edges = new THREE.EdgesGeometry(geometry, 20);
        const lineMat = new THREE.LineBasicMaterial({ color: '#38bdf8', linewidth: 2 });
        const outlineMesh = new THREE.LineSegments(edges, lineMat);
        outlineMesh.name = '__selection_outline__';
        outlineMesh.visible = false;
        outlineMesh.renderOrder = 9998;
        mesh.add(outlineMesh);

        const highlightMat = new THREE.MeshBasicMaterial({
            color: 0xf59e0b,
            transparent: true,
            opacity: 0.35,
            depthWrite: false,
            depthTest: true,
            polygonOffset: true,
            polygonOffsetFactor: -2,
            polygonOffsetUnits: -4,
            side: THREE.DoubleSide
        });
        const highlightMesh = new THREE.Mesh(geometry, highlightMat);
        highlightMesh.name = '__selection_highlight__';
        highlightMesh.visible = false;
        highlightMesh.renderOrder = 9999;
        mesh.add(highlightMesh);

        const boardData = {
            id: id,
            name: name,
            width: width,
            height: height,
            depth: depth,
            thickness: thickness,
            edgeRadius: edgeRadius,
            type: type,
            textureKey: textureKey,
            edgeBanding: options.edgeBanding || '0.4mm ABS',
            edgeBandingSides: options.edgeBandingSides || { top: true, bottom: true, left: true, right: true },
            x: x,
            y: y,
            z: z,
            rotX: rotX,
            rotY: rotY,
            rotZ: rotZ,
            locked: false,
            visible: true,
            mesh: mesh,
            outlineMesh: outlineMesh,
            highlightMesh: highlightMesh
        };

        mesh.userData = boardData;

        this.scene3D.scene.add(mesh);
        this.scene3D.boardMeshes.push(mesh);
        this.boards.push(boardData);

        return boardData;
    }

    /**
     * EGYBEFÜGGŐ KONYHA KORPUSZ EGYSÉG LÉTREHOZÁSA (Egyetlen egységként kezelve!)
     */
    createCorpus(config, x = 0, y = 0, z = 0) {
        const corpusId = 'corpus_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        const corpusGroup = new THREE.Group();
        corpusGroup.position.set(x, y, z);

        const corpusName = `Konyha Elem ${this.corpusCounter++} (${config.width}×${config.height})`;

        corpusGroup.userData = {
            id: corpusId,
            name: corpusName,
            isCorpus: true,
            config: JSON.parse(JSON.stringify(config)),
            width: config.width,
            height: config.height,
            depth: config.depth,
            x: x,
            y: y,
            z: z
        };

        // Bútorlapok legenerálása a varázsló konfigurációjából
        const generatedBoards = KitchenCorpusGenerator.generateBoards(config);

        generatedBoards.forEach((boardData, index) => {
            const bId = `${corpusId}_b_${index}`;
            let mesh;

            if (boardData.isHardware && boardData.isHandle && boardData.modelId && ModelManager.hasModel(boardData.modelId)) {
                mesh = ModelManager.createHandleMesh(boardData);
            } else if (boardData.isHardware && boardData.isLeg && boardData.modelId && ModelManager.hasModel(boardData.modelId)) {
                mesh = ModelManager.createLegMesh(boardData);
            } else if (boardData.isHardware && boardData.isHinge) {
                mesh = ModelManager.createHingeMesh(boardData);
            } else {
                const geometry = createBoardGeometry(boardData);
                const material = MaterialManager.createMaterial(boardData.textureKey || config.textureKey || 'white_matte');
                mesh = new THREE.Mesh(geometry, material);
                mesh.position.set(boardData.x, boardData.y, boardData.z);
                if (boardData.rotY !== undefined) mesh.rotation.y = THREE.MathUtils.degToRad(boardData.rotY);
                else if (boardData.rotationY !== undefined) mesh.rotation.y = boardData.rotationY;
                if (boardData.rotX !== undefined) mesh.rotation.x = THREE.MathUtils.degToRad(boardData.rotX);
                else if (boardData.rotationX !== undefined) mesh.rotation.x = boardData.rotationX;
                if (boardData.rotZ !== undefined) mesh.rotation.z = THREE.MathUtils.degToRad(boardData.rotZ);
                else if (boardData.rotationZ !== undefined) mesh.rotation.z = boardData.rotationZ;

                const edges = new THREE.EdgesGeometry(geometry, 20);
                const lineMat = new THREE.LineBasicMaterial({ color: '#38bdf8', linewidth: 2 });
                const outlineMesh = new THREE.LineSegments(edges, lineMat);
                outlineMesh.name = '__selection_outline__';
                outlineMesh.visible = false;
                outlineMesh.renderOrder = 9998;
                mesh.add(outlineMesh);

                const highlightMat = new THREE.MeshBasicMaterial({
                    color: 0xf59e0b,
                    transparent: true,
                    opacity: 0.35,
                    depthWrite: false,
                    depthTest: true,
                    polygonOffset: true,
                    polygonOffsetFactor: -2,
                    polygonOffsetUnits: -4,
                    side: THREE.DoubleSide
                });
                const highlightMesh = new THREE.Mesh(geometry, highlightMat);
                highlightMesh.name = '__selection_highlight__';
                highlightMesh.visible = false;
                highlightMesh.renderOrder = 9999;
                mesh.add(highlightMesh);

                boardData.outlineMesh = outlineMesh;
                boardData.highlightMesh = highlightMesh;
            }

            mesh.castShadow = true;
            mesh.receiveShadow = true;

            const fullBoardData = {
                ...boardData,
                id: bId,
                corpusId: corpusId,
                mesh: mesh,
                name: boardData.name || `Korpusz Elem ${index + 1}`
            };

            mesh.userData = fullBoardData;

            corpusGroup.add(mesh);
            this.boards.push(fullBoardData);
        });

        this.corpora.push(corpusGroup);
        this.scene3D.scene.add(corpusGroup);

        this.updateKitchenContinuity();
        return corpusGroup;
    }

    /**
     * KONYHA ELEM MÓDOSÍTÁSA A VARÁZSLÓBÓL (In-place frissítés)
     */
    updateCorpusConfig(corpusGroup, newConfig) {
        if (!corpusGroup || !corpusGroup.userData || !corpusGroup.userData.isCorpus) return;

        const corpusId = corpusGroup.userData.id;

        // 1. Meglévő mesh-ek eltávolítása a csoportból és a globális listákból
        const childrenToRemove = [...corpusGroup.children];
        childrenToRemove.forEach(child => {
            corpusGroup.remove(child);
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (child.material.map) child.material.map.dispose();
                child.material.dispose();
            }
        });

        this.boards = this.boards.filter(b => b.corpusId !== corpusId);

        // 2. Új konfiguráció mentése
        corpusGroup.userData.config = JSON.parse(JSON.stringify(newConfig));
        corpusGroup.userData.width = newConfig.width;
        corpusGroup.userData.height = newConfig.height;
        corpusGroup.userData.depth = newConfig.depth;
        corpusGroup.userData.name = `Konyha Elem (${newConfig.width}×${newConfig.height})`;

        // 3. Új alkatrészlapok legenerálása
        const generatedBoards = KitchenCorpusGenerator.generateBoards(newConfig);

        generatedBoards.forEach((boardData, index) => {
            const bId = `${corpusId}_b_${index}`;
            let mesh;

            if (boardData.isHardware && boardData.isHandle && boardData.modelId && ModelManager.hasModel(boardData.modelId)) {
                mesh = ModelManager.createHandleMesh(boardData);
            } else if (boardData.isHardware && boardData.isLeg && boardData.modelId && ModelManager.hasModel(boardData.modelId)) {
                mesh = ModelManager.createLegMesh(boardData);
            } else if (boardData.isHardware && boardData.isHinge) {
                mesh = ModelManager.createHingeMesh(boardData);
            } else {
                const geometry = createBoardGeometry(boardData);
                const material = MaterialManager.createMaterial(boardData.textureKey || newConfig.textureKey || 'white_matte');
                mesh = new THREE.Mesh(geometry, material);
                mesh.position.set(boardData.x, boardData.y, boardData.z);
                if (boardData.rotY !== undefined) mesh.rotation.y = THREE.MathUtils.degToRad(boardData.rotY);
                else if (boardData.rotationY !== undefined) mesh.rotation.y = boardData.rotationY;
                if (boardData.rotX !== undefined) mesh.rotation.x = THREE.MathUtils.degToRad(boardData.rotX);
                else if (boardData.rotationX !== undefined) mesh.rotation.x = boardData.rotationX;
                if (boardData.rotZ !== undefined) mesh.rotation.z = THREE.MathUtils.degToRad(boardData.rotZ);
                else if (boardData.rotationZ !== undefined) mesh.rotation.z = boardData.rotationZ;

                const edges = new THREE.EdgesGeometry(geometry, 20);
                const lineMat = new THREE.LineBasicMaterial({ color: '#38bdf8', linewidth: 2 });
                const outlineMesh = new THREE.LineSegments(edges, lineMat);
                outlineMesh.name = '__selection_outline__';
                outlineMesh.visible = false;
                outlineMesh.renderOrder = 9998;
                mesh.add(outlineMesh);

                const highlightMat = new THREE.MeshBasicMaterial({
                    color: 0xf59e0b,
                    transparent: true,
                    opacity: 0.35,
                    depthWrite: false,
                    depthTest: true,
                    polygonOffset: true,
                    polygonOffsetFactor: -2,
                    polygonOffsetUnits: -4,
                    side: THREE.DoubleSide
                });
                const highlightMesh = new THREE.Mesh(geometry, highlightMat);
                highlightMesh.name = '__selection_highlight__';
                highlightMesh.visible = false;
                highlightMesh.renderOrder = 9999;
                mesh.add(highlightMesh);

                boardData.outlineMesh = outlineMesh;
                boardData.highlightMesh = highlightMesh;
            }

            mesh.castShadow = true;
            mesh.receiveShadow = true;

            const fullBoardData = {
                ...boardData,
                id: bId,
                corpusId: corpusId,
                parentGroup: corpusGroup,
                mesh: mesh
            };

            mesh.userData = fullBoardData;

            corpusGroup.add(mesh);
            this.scene3D.boardMeshes.push(mesh);
            this.boards.push(fullBoardData);
        });

        this.scene3D.updateDimensionVisualizer();
        this.updateKitchenContinuity();
        return corpusGroup;
    }

    /**
     * Textúra alkalmazása teljes Konyha Korpuszra (Front vagy Munkalap/Hátfal kategória alapján)
     */
    applyTextureToCorpus(corpusGroupOrId, textureKey) {
        const corpusGroup = typeof corpusGroupOrId === 'string'
            ? this.corpora.find(c => c.userData.id === corpusGroupOrId)
            : corpusGroupOrId;
        if (!corpusGroup || !corpusGroup.userData || !corpusGroup.userData.config) return;

        const config = corpusGroup.userData.config;
        const texInfo = MaterialManager.textures[textureKey] || MaterialManager.textures['front_k001'];
        if (!texInfo) return;

        const isWorktopTex = texInfo.category === 'worktop';

        if (isWorktopTex) {
            // Munkalap textúra -> Munkalap és Munkalap hátfalpanel (splashback) frissítése
            if (!config.worktop) config.worktop = {};
            config.worktop.textureKey = textureKey;
            if (config.worktop.splashback) {
                config.worktop.splashback.textureKey = textureKey;
            }

            const corpusBoards = this.boards.filter(b => b.corpusId === corpusGroup.userData.id);
            corpusBoards.forEach(b => {
                if (b.isWorktop || b.type === 'worktop' || b.isSplashback) {
                    b.textureKey = textureKey;
                    if (b.mesh) {
                        const oldMat = b.mesh.material;
                        b.mesh.material = MaterialManager.createMaterial(textureKey);
                        if (oldMat && oldMat.map) oldMat.map.dispose();
                        if (oldMat) oldMat.dispose();
                        b.mesh.userData.textureKey = textureKey;
                    }
                }
            });
            this.updateKitchenContinuity();
        } else {
            // Front / Bútorlap textúra -> Minden korpusz lap frissítése KIVÉVE a hátfalat (mindig fehér) és munkalapot/splashbacket/gépeket
            config.textureKey = textureKey;
            if (config.sides) config.sides.textureKey = textureKey;
            if (config.plinth) config.plinth.textureKey = textureKey;

            const corpusBoards = this.boards.filter(b => b.corpusId === corpusGroup.userData.id);
            corpusBoards.forEach(b => {
                const isWorktop = b.isWorktop || b.type === 'worktop' || b.isSplashback;
                const isBackPanel = !b.isSplashback && (b.type === 'back' || (b.name && b.name.includes('Hátfal')));
                const isAppliance = b.isAppliance || b.type === 'appliance';
                const isHardware = b.isHardware || b.type === 'hardware' || b.isHinge || b.isHandle;

                if (isWorktop || isBackPanel || isAppliance || isHardware) {
                    return; // Munkalapot, korpusz fehér hátfalat, gépeket és pántokat/fogantyúkat ne írjuk felül
                }

                b.textureKey = textureKey;
                if (b.mesh) {
                    const oldMat = b.mesh.material;
                    b.mesh.material = MaterialManager.createMaterial(textureKey);
                    if (oldMat && oldMat.map) oldMat.map.dispose();
                    if (oldMat) oldMat.dispose();
                    b.mesh.userData.textureKey = textureKey;
                }
            });
        }
    }

    /**
     * Korpusz törlése
     */
    deleteCorpus(corpusId) {
        const corpusIdx = this.corpora.findIndex(c => c.userData.id === corpusId);
        if (corpusIdx === -1) return;

        const corpusGroup = this.corpora[corpusIdx];

        if (this.scene3D.selectedTarget === corpusGroup) {
            this.scene3D.selectBoard(null);
        }

        const children = [...corpusGroup.children];
        children.forEach(mesh => {
            corpusGroup.remove(mesh);
            if (mesh.isGroup || (mesh.children && mesh.children.length > 0)) {
                mesh.traverse(child => {
                    if (child.isMesh) {
                        if (child.geometry) child.geometry.dispose();
                        if (child.material) {
                            if (Array.isArray(child.material)) {
                                child.material.forEach(m => {
                                    if (m.map) m.map.dispose();
                                    m.dispose();
                                });
                            } else {
                                if (child.material.map) child.material.map.dispose();
                                child.material.dispose();
                            }
                        }
                    }
                });
            } else {
                if (mesh.geometry) mesh.geometry.dispose();
                if (mesh.material) {
                    if (Array.isArray(mesh.material)) {
                        mesh.material.forEach(m => {
                            if (m.map) m.map.dispose();
                            m.dispose();
                        });
                    } else {
                        if (mesh.material.map) mesh.material.map.dispose();
                        mesh.material.dispose();
                    }
                }
            }

            const meshIdx = this.scene3D.boardMeshes.indexOf(mesh);
            if (meshIdx > -1) this.scene3D.boardMeshes.splice(meshIdx, 1);
        });

        this.boards = this.boards.filter(b => b.corpusId !== corpusId);
        this.scene3D.scene.remove(corpusGroup);
        this.corpora.splice(corpusIdx, 1);

        this.scene3D.updateDimensionVisualizer();
        this.updateKitchenContinuity();
    }

    /**
     * Korpusz duplikálása
     */
    duplicateCorpus(corpusId) {
        const source = this.corpora.find(c => c.userData.id === corpusId);
        if (!source) return null;

        const config = JSON.parse(JSON.stringify(source.userData.config));
        const offsetX = source.position.x + (config.width || 600) + 20;
        const newCorpus = this.createCorpus(config, offsetX, source.position.y, source.position.z);
        this.scene3D.selectBoard(newCorpus);
        this.updateKitchenContinuity();
        return newCorpus;
    }

    /**
     * EGYEDI BÚTORLAPOK CSOPORTOSÍTÁSA (Create Group)
     */
    createGroup(boardIds, groupName) {
        if (!boardIds || boardIds.length < 1) return null;

        const targetBoards = this.boards.filter(b => boardIds.includes(b.id) && !b.corpusId);
        if (targetBoards.length === 0) return null;

        // Számoljuk ki a csoport befoglaló méretét és középpontját
        const box = new THREE.Box3();
        targetBoards.forEach(b => {
            if (b.mesh) {
                b.mesh.updateWorldMatrix(true, false);
                box.expandByObject(b.mesh);
            }
        });

        const center = new THREE.Vector3();
        box.getCenter(center);
        const size = new THREE.Vector3();
        box.getSize(size);

        const groupId = 'group_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        const name = groupName || `Csoport ${this.groupCounter++} (${targetBoards.length} lap)`;

        const group = new THREE.Group();
        group.position.copy(center);
        group.userData = {
            id: groupId,
            name: name,
            isCustomGroup: true,
            isCorpus: false,
            width: Math.round(size.x),
            height: Math.round(size.y),
            depth: Math.round(size.z),
            x: Math.round(center.x),
            y: Math.round(center.y),
            z: Math.round(center.z)
        };

        this.scene3D.scene.add(group);

        targetBoards.forEach(b => {
            if (b.parentGroup && b.parentGroup !== group) {
                b.parentGroup.remove(b.mesh);
            }
            group.attach(b.mesh);
            b.groupId = groupId;
            b.parentGroup = group;
        });

        this.customGroups.push(group);
        this.scene3D.updateDimensionVisualizer();
        return group;
    }

    /**
     * CSOPORT SZÉTBONTÁSA (Ungroup)
     */
    ungroup(groupId) {
        const groupIdx = this.customGroups.findIndex(g => g.userData.id === groupId);
        if (groupIdx === -1) return [];

        const group = this.customGroups[groupIdx];
        const childBoards = this.boards.filter(b => b.groupId === groupId);

        const unpackedMeshes = [];
        childBoards.forEach(b => {
            if (b.mesh) {
                this.scene3D.scene.attach(b.mesh);
                b.groupId = null;
                b.parentGroup = null;
                b.x = Math.round(b.mesh.position.x);
                b.y = Math.round(b.mesh.position.y);
                b.z = Math.round(b.mesh.position.z);
                b.rotX = Math.round(THREE.MathUtils.radToDeg(b.mesh.rotation.x));
                b.rotY = Math.round(THREE.MathUtils.radToDeg(b.mesh.rotation.y));
                b.rotZ = Math.round(THREE.MathUtils.radToDeg(b.mesh.rotation.z));
                unpackedMeshes.push(b.mesh);
            }
        });

        if (this.scene3D.selectedTarget === group) {
            this.scene3D.selectBoard(null);
        }

        this.scene3D.scene.remove(group);
        this.customGroups.splice(groupIdx, 1);
        this.scene3D.updateDimensionVisualizer();
        return unpackedMeshes;
    }

    /**
     * LAP KIVÉTELE A CSOPORTBÓL (Extract Single Board)
     */
    removeBoardFromGroup(boardId) {
        const board = this.boards.find(b => b.id === boardId);
        if (!board || !board.groupId) return null;

        const groupId = board.groupId;
        const group = this.customGroups.find(g => g.userData.id === groupId);

        if (board.mesh) {
            this.scene3D.scene.attach(board.mesh);
            board.groupId = null;
            board.parentGroup = null;
            board.x = Math.round(board.mesh.position.x);
            board.y = Math.round(board.mesh.position.y);
            board.z = Math.round(board.mesh.position.z);
            board.rotX = Math.round(THREE.MathUtils.radToDeg(board.mesh.rotation.x));
            board.rotY = Math.round(THREE.MathUtils.radToDeg(board.mesh.rotation.y));
            board.rotZ = Math.round(THREE.MathUtils.radToDeg(board.mesh.rotation.z));
        }

        const remaining = this.boards.filter(b => b.groupId === groupId);
        if (remaining.length === 0 && group) {
            const gIdx = this.customGroups.indexOf(group);
            if (gIdx > -1) this.customGroups.splice(gIdx, 1);
            this.scene3D.scene.remove(group);
        } else if (group) {
            const box = new THREE.Box3();
            remaining.forEach(b => { if (b.mesh) box.expandByObject(b.mesh); });
            const size = new THREE.Vector3();
            box.getSize(size);
            group.userData.width = Math.round(size.x);
            group.userData.height = Math.round(size.y);
            group.userData.depth = Math.round(size.z);
        }

        this.scene3D.updateDimensionVisualizer();
        return board;
    }

    /**
     * CSOPORT DUPLIKÁLÁSA
     */
    duplicateGroup(groupId) {
        const sourceGroup = this.customGroups.find(g => g.userData.id === groupId);
        if (!sourceGroup) return null;

        const childBoards = this.boards.filter(b => b.groupId === groupId);
        const offsetX = 50;
        const offsetZ = 50;

        const newBoardIds = [];
        childBoards.forEach(b => {
            const worldPos = new THREE.Vector3();
            const worldQuat = new THREE.Quaternion();
            b.mesh.getWorldPosition(worldPos);
            b.mesh.getWorldQuaternion(worldQuat);
            const euler = new THREE.Euler().setFromQuaternion(worldQuat);

            const cloneData = {
                name: `${b.name} (másolat)`,
                width: b.width,
                height: b.height,
                depth: b.depth,
                thickness: b.thickness,
                edgeRadius: b.edgeRadius !== undefined ? b.edgeRadius : 1,
                type: b.type,
                textureKey: b.textureKey,
                edgeBanding: b.edgeBanding,
                x: worldPos.x + offsetX,
                y: worldPos.y,
                z: worldPos.z + offsetZ,
                rotX: Math.round(THREE.MathUtils.radToDeg(euler.x)),
                rotY: Math.round(THREE.MathUtils.radToDeg(euler.y)),
                rotZ: Math.round(THREE.MathUtils.radToDeg(euler.z))
            };

            const created = this.createBoard(cloneData);
            newBoardIds.push(created.id);
        });

        const newGroup = this.createGroup(newBoardIds, `${sourceGroup.userData.name} (másolat)`);
        if (newGroup) {
            this.scene3D.selectBoard(newGroup);
        }
        return newGroup;
    }

    /**
     * CSOPORT ÉS ELEMEINEK TÖRLÉSE
     */
    deleteGroup(groupId) {
        const groupIdx = this.customGroups.findIndex(g => g.userData.id === groupId);
        if (groupIdx === -1) return;

        const group = this.customGroups[groupIdx];
        if (this.scene3D.selectedTarget === group) {
            this.scene3D.selectBoard(null);
        }

        const childBoards = [...this.boards.filter(b => b.groupId === groupId)];
        childBoards.forEach(b => {
            this.deleteBoard(b.id);
        });

        this.scene3D.scene.remove(group);
        this.customGroups.splice(groupIdx, 1);
        this.scene3D.updateDimensionVisualizer();
    }

    /**
     * CSOPORT ADATAINAK FRISSÍTÉSE
     */
    updateGroup(groupId, newParams) {
        const group = this.customGroups.find(g => g.userData.id === groupId);
        if (!group) return null;
        if (newParams.name) {
            group.userData.name = newParams.name;
        }
        if (newParams.textureKey) {
            const childBoards = this.boards.filter(b => b.groupId === groupId);
            childBoards.forEach(b => {
                b.textureKey = newParams.textureKey;
                MaterialManager.applyTextureToMesh(b.mesh, newParams.textureKey);
            });
        }
        return group;
    }

    /**
     * Egymás mellett lévő korpuszok konyhabútor elemeinek (munkalap, szokli és munkalap hátfal) összehangolása
     */
    updateKitchenContinuity() {
        this.updateWorktopContinuity();
        this.updatePlinthContinuity();
        this.updateSplashbackContinuity();
    }

    /**
     * Egymás mellett lévő korpuszok munkalapjainak és textúráinak összehangolása
     * (Egybefüggő folytonos erezet és minta a teljes konyhasor mentén, csúszásmentesen)
     */
    updateWorktopContinuity() {
        const worktopItems = [];
        const tileSize = 800; // Pontosan megegyezik az applyBoxUVs tileSize-szal (800 mm)

        this.boards.forEach(b => {
            if (!b.mesh) return;
            const isWorktop = b.isWorktop || b.type === 'worktop' || (b.name && b.name.includes('Munkalap'));
            if (!isWorktop) return;

            const worldPos = new THREE.Vector3();
            b.mesh.getWorldPosition(worldPos);
            const w = b.width || (b.mesh.geometry.parameters && b.mesh.geometry.parameters.width) || 600;
            const d = b.depth || (b.mesh.geometry.parameters && b.mesh.geometry.parameters.depth) || 600;
            const h = b.height || (b.mesh.geometry.parameters && b.mesh.geometry.parameters.height) || 38;

            worktopItems.push({
                board: b,
                mesh: b.mesh,
                worldX: worldPos.x,
                worldY: worldPos.y,
                worldZ: worldPos.z,
                width: w,
                height: h,
                depth: d,
                minX: worldPos.x - w / 2,
                textureKey: b.textureKey || 'wt_3025'
            });
        });

        if (worktopItems.length === 0) return;

        worktopItems.forEach(item => {
            const texInfo = MaterialManager.textures[item.textureKey] || MaterialManager.textures['wt_3025'];
            if (!texInfo || !texInfo.texture) return;

            const clonedTexture = texInfo.texture.clone();
            clonedTexture.wrapS = THREE.RepeatWrapping;
            clonedTexture.wrapT = THREE.RepeatWrapping;

            // Pontos matematikai textúra offset a világkoordináta alapján (csúszásmentes illesztés)
            const offX = ((item.minX % tileSize) + tileSize) % tileSize / tileSize;

            clonedTexture.repeat.set(1, 1);
            clonedTexture.offset.set(offX, 0);
            clonedTexture.needsUpdate = true;

            item.mesh.material = new THREE.MeshStandardMaterial({
                map: clonedTexture,
                roughness: texInfo.roughness !== undefined ? texInfo.roughness : 0.7,
                metalness: texInfo.metalness !== undefined ? texInfo.metalness : 0.05
            });
        });
    }

    /**
     * Egymás mellett lévő korpuszok szoklijainak (plinth) összehangolása
     * (Egybefüggő folytonos takaróléc textúra a teljes lábazat mentén, csúszásmentesen)
     */
    updatePlinthContinuity() {
        const plinthItems = [];
        const tileSize = 800; // Pontosan megegyezik az applyBoxUVs tileSize-szal (800 mm)

        this.boards.forEach(b => {
            if (!b.mesh) return;
            const isPlinth = b.isPlinth || b.type === 'plinth' || (b.name && b.name.includes('Szokli'));
            if (!isPlinth) return;

            const worldPos = new THREE.Vector3();
            b.mesh.getWorldPosition(worldPos);
            const w = b.width || (b.mesh.geometry.parameters && b.mesh.geometry.parameters.width) || 600;
            const d = b.depth || (b.mesh.geometry.parameters && b.mesh.geometry.parameters.depth) || 18;
            const h = b.height || (b.mesh.geometry.parameters && b.mesh.geometry.parameters.height) || 100;

            plinthItems.push({
                board: b,
                mesh: b.mesh,
                worldX: worldPos.x,
                worldY: worldPos.y,
                worldZ: worldPos.z,
                width: w,
                height: h,
                depth: d,
                minX: worldPos.x - w / 2,
                textureKey: b.textureKey || 'front_k001'
            });
        });

        if (plinthItems.length === 0) return;

        plinthItems.forEach(item => {
            const texInfo = MaterialManager.textures[item.textureKey] || MaterialManager.textures['front_k001'];
            if (!texInfo || !texInfo.texture) return;

            const clonedTexture = texInfo.texture.clone();
            clonedTexture.wrapS = THREE.RepeatWrapping;
            clonedTexture.wrapT = THREE.RepeatWrapping;

            const offX = ((item.minX % tileSize) + tileSize) % tileSize / tileSize;

            clonedTexture.repeat.set(1, 1);
            clonedTexture.offset.set(offX, 0);
            clonedTexture.needsUpdate = true;

            item.mesh.material = new THREE.MeshStandardMaterial({
                map: clonedTexture,
                roughness: texInfo.roughness !== undefined ? texInfo.roughness : 0.85,
                metalness: texInfo.metalness !== undefined ? texInfo.metalness : 0.05
            });
        });
    }

    /**
     * Egymás mellett lévő korpuszok munkalap hátfalpaneljeinek (splashback) összehangolása
     * (Egybefüggő folytonos fali panel textúra a teljes konyhasor mentén, csúszásmentesen)
     */
    updateSplashbackContinuity() {
        const splashbackItems = [];
        const tileSize = 800; // Pontosan megegyezik az applyBoxUVs tileSize-szal (800 mm)

        this.boards.forEach(b => {
            if (!b.mesh) return;
            const isSplashback = b.isSplashback || (b.name && b.name.includes('Hátfalpanel'));
            if (!isSplashback) return;

            const worldPos = new THREE.Vector3();
            b.mesh.getWorldPosition(worldPos);
            const w = b.width || (b.mesh.geometry.parameters && b.mesh.geometry.parameters.width) || 600;
            const d = b.depth || (b.mesh.geometry.parameters && b.mesh.geometry.parameters.depth) || 5;
            const h = b.height || (b.mesh.geometry.parameters && b.mesh.geometry.parameters.height) || 600;

            splashbackItems.push({
                board: b,
                mesh: b.mesh,
                worldX: worldPos.x,
                worldY: worldPos.y,
                worldZ: worldPos.z,
                width: w,
                height: h,
                depth: d,
                minX: worldPos.x - w / 2,
                textureKey: b.textureKey || 'wt_3025'
            });
        });

        if (splashbackItems.length === 0) return;

        splashbackItems.forEach(item => {
            const texInfo = MaterialManager.textures[item.textureKey] || MaterialManager.textures['wt_3025'];
            if (!texInfo || !texInfo.texture) return;

            const clonedTexture = texInfo.texture.clone();
            clonedTexture.wrapS = THREE.RepeatWrapping;
            clonedTexture.wrapT = THREE.RepeatWrapping;

            const offX = ((item.minX % tileSize) + tileSize) % tileSize / tileSize;

            clonedTexture.repeat.set(1, 1);
            clonedTexture.offset.set(offX, 0);
            clonedTexture.needsUpdate = true;

            item.mesh.material = new THREE.MeshStandardMaterial({
                map: clonedTexture,
                roughness: texInfo.roughness !== undefined ? texInfo.roughness : 0.7,
                metalness: texInfo.metalness !== undefined ? texInfo.metalness : 0.05
            });
        });
    }

    /**
     * Bútorlap gyors sablonok
     */
    createBoardFromPreset(presetType, mainDims = { w: 600, h: 800, d: 400, th: 18 }) {
        const { w, h, d, th } = mainDims;
        let params = {};

        switch (presetType) {
            case 'vertical_left':
                params = {
                    name: 'Bal Oldallap',
                    type: 'vertical_side',
                    width: th,
                    height: h,
                    depth: d,
                    thickness: th,
                    x: -w / 2 + th / 2,
                    y: h / 2,
                    z: 0
                };
                break;
            case 'vertical_right':
                params = {
                    name: 'Jobb Oldallap',
                    type: 'vertical_side',
                    width: th,
                    height: h,
                    depth: d,
                    thickness: th,
                    x: w / 2 - th / 2,
                    y: h / 2,
                    z: 0
                };
                break;
            case 'bottom':
                params = {
                    name: 'Fenéklap',
                    type: 'horizontal',
                    width: w - (2 * th),
                    height: th,
                    depth: d,
                    thickness: th,
                    x: 0,
                    y: th / 2,
                    z: 0
                };
                break;
            case 'top':
                params = {
                    name: 'Tetőlap',
                    type: 'horizontal',
                    width: w,
                    height: th,
                    depth: d,
                    thickness: th,
                    x: 0,
                    y: h - th / 2,
                    z: 0
                };
                break;
            case 'shelf':
                params = {
                    name: 'Belső Polc',
                    type: 'shelf',
                    width: w - (2 * th) - 2,
                    height: th,
                    depth: d - 20,
                    thickness: th,
                    x: 0,
                    y: h / 2,
                    z: -10
                };
                break;
            case 'back':
                params = {
                    name: 'Hátfal (HDF)',
                    type: 'back',
                    width: w - 10,
                    height: h - 10,
                    depth: 3,
                    thickness: 3,
                    textureKey: 'white_matte',
                    x: 0,
                    y: h / 2,
                    z: -d / 2 + 1.5
                };
                break;
            case 'door':
                params = {
                    name: 'Ajtó Front',
                    type: 'door',
                    width: w - 4,
                    height: h - 4,
                    depth: th,
                    thickness: th,
                    x: 0,
                    y: h / 2,
                    z: d / 2 + th / 2
                };
                break;
            default:
                params = {
                    name: 'Egyedi Lap',
                    width: 500,
                    height: th,
                    depth: 300,
                    thickness: th,
                    x: 0,
                    y: th / 2,
                    z: 0
                };
                break;
        }

        return this.createBoard(params);
    }

    updateBoard(id, newParams) {
        const board = this.boards.find(b => b.id === id);
        if (!board || board.corpusId) return null; // Korpusz elemeket nem egyenként szerkesztünk!

        let geoNeedsUpdate = false;

        if (newParams.width !== undefined && newParams.width !== board.width) {
            board.width = Math.max(1, Number(newParams.width));
            geoNeedsUpdate = true;
        }
        if (newParams.height !== undefined && newParams.height !== board.height) {
            board.height = Math.max(1, Number(newParams.height));
            geoNeedsUpdate = true;
        }
        if (newParams.depth !== undefined && newParams.depth !== board.depth) {
            board.depth = Math.max(1, Number(newParams.depth));
            geoNeedsUpdate = true;
        }
        if (newParams.thickness !== undefined && newParams.thickness !== board.thickness) {
            board.thickness = Math.max(1, Number(newParams.thickness));
            board.height = board.thickness;
            geoNeedsUpdate = true;
        }
        if (newParams.type !== undefined && newParams.type !== board.type) {
            board.type = newParams.type;
            geoNeedsUpdate = true;
        }
        if (newParams.isWorktop !== undefined && newParams.isWorktop !== board.isWorktop) {
            board.isWorktop = newParams.isWorktop;
            geoNeedsUpdate = true;
        }
        if (newParams.edgeRadius !== undefined && newParams.edgeRadius !== board.edgeRadius) {
            board.edgeRadius = Math.max(0, Number(newParams.edgeRadius));
            geoNeedsUpdate = true;
        }
        if (newParams.name !== undefined) {
            board.name = newParams.name;
        }
        if (newParams.edgeBanding !== undefined) {
            board.edgeBanding = newParams.edgeBanding;
        }

        if (newParams.x !== undefined) {
            board.x = Number(newParams.x);
            board.mesh.position.x = board.x;
        }
        if (newParams.y !== undefined) {
            board.y = Number(newParams.y);
            board.mesh.position.y = board.y;
        }
        if (newParams.z !== undefined) {
            board.z = Number(newParams.z);
            board.mesh.position.z = board.z;
        }

        if (newParams.rotX !== undefined) {
            board.rotX = Number(newParams.rotX);
            board.mesh.rotation.x = THREE.MathUtils.degToRad(board.rotX);
        }
        if (newParams.rotY !== undefined) {
            board.rotY = Number(newParams.rotY);
            board.mesh.rotation.y = THREE.MathUtils.degToRad(board.rotY);
        }
        if (newParams.rotZ !== undefined) {
            board.rotZ = Number(newParams.rotZ);
            board.mesh.rotation.z = THREE.MathUtils.degToRad(board.rotZ);
        }

        if (geoNeedsUpdate) {
            board.mesh.geometry.dispose();
            board.mesh.geometry = createBoardGeometry(board);
            if (board.outlineMesh) {
                board.outlineMesh.geometry.dispose();
                board.outlineMesh.geometry = new THREE.EdgesGeometry(board.mesh.geometry, 20);
            }
            if (board.highlightMesh) {
                board.highlightMesh.geometry = board.mesh.geometry;
            }
        }

        if (newParams.textureKey !== undefined) {
            const isWorktop = board.isWorktop || board.type === 'worktop' || (board.name && board.name.includes('Munkalap'));
            const isSplashback = board.isSplashback || (board.name && board.name.includes('Hátfalpanel'));
            const isBackPanel = !isSplashback && (board.type === 'back' || (board.name && board.name.includes('Hátfal')));

            if (isBackPanel) {
                // A korpusz hátfal MINDIG fehér
                board.textureKey = 'white_matte';
                MaterialManager.applyTextureToMesh(board.mesh, 'white_matte');
            } else {
                board.textureKey = newParams.textureKey;
                MaterialManager.applyTextureToMesh(board.mesh, board.textureKey);
            }
        }

        this.scene3D.updateDimensionVisualizer();
        this.updateKitchenContinuity();
        return board;
    }

    applyTextureToAll(textureKey) {
        this.activeTextureKey = textureKey;
        const texInfo = MaterialManager.textures[textureKey] || MaterialManager.textures['front_k001'];
        const isWorktopTex = texInfo && texInfo.category === 'worktop';

        // 1. Frissítsük az összes különálló bútorlapot
        this.boards.forEach(board => {
            const isWorktop = board.isWorktop || board.type === 'worktop' || (board.name && board.name.includes('Munkalap'));
            const isSplashback = board.isSplashback || (board.name && board.name.includes('Hátfalpanel'));
            const isBackPanel = !isSplashback && (board.type === 'back' || (board.name && board.name.includes('Hátfal')));
            const isAppliance = board.isAppliance || board.type === 'appliance';
            const isHardware = board.isHardware || board.type === 'hardware' || board.isHinge || board.isHandle;

            if (isAppliance || isHardware) return;

            // A korpusz hátfal MINDIG fehér marad!
            if (isBackPanel) {
                board.textureKey = 'white_matte';
                if (board.mesh) MaterialManager.applyTextureToMesh(board.mesh, 'white_matte');
                return;
            }

            // Munkalap textúra csak munkalapra/hátfalpanelre, front textúra csak bútorlapra kerül
            if (isWorktop || isSplashback) {
                if (isWorktopTex) {
                    board.textureKey = textureKey;
                    if (board.mesh) MaterialManager.applyTextureToMesh(board.mesh, textureKey);
                }
            } else {
                if (!isWorktopTex) {
                    board.textureKey = textureKey;
                    if (board.mesh) MaterialManager.applyTextureToMesh(board.mesh, textureKey);
                }
            }
        });

        // 2. Frissítsük az összes korpusz konfigurációt
        this.corpora.forEach(corpusGroup => {
            if (corpusGroup.userData && corpusGroup.userData.config) {
                if (isWorktopTex) {
                    if (!corpusGroup.userData.config.worktop) corpusGroup.userData.config.worktop = {};
                    corpusGroup.userData.config.worktop.textureKey = textureKey;
                    if (corpusGroup.userData.config.worktop.splashback) {
                        corpusGroup.userData.config.worktop.splashback.textureKey = textureKey;
                    }
                } else {
                    corpusGroup.userData.config.textureKey = textureKey;
                    if (corpusGroup.userData.config.sides) corpusGroup.userData.config.sides.textureKey = textureKey;
                    if (corpusGroup.userData.config.plinth) corpusGroup.userData.config.plinth.textureKey = textureKey;
                }
            }
        });

        this.updateKitchenContinuity();
    }

    duplicateBoard(id) {
        const source = this.boards.find(b => b.id === id);
        if (!source || source.corpusId) return null;

        const cloneData = {
            name: `${source.name} (másolat)`,
            width: source.width,
            height: source.height,
            depth: source.depth,
            thickness: source.thickness,
            edgeRadius: source.edgeRadius !== undefined ? source.edgeRadius : 1,
            type: source.type,
            textureKey: source.textureKey,
            edgeBanding: source.edgeBanding,
            x: source.x + 30,
            y: source.y + 30,
            z: source.z + 30
        };

        const newBoard = this.createBoard(cloneData);
        this.scene3D.selectBoard(newBoard.mesh);
        return newBoard;
    }

    deleteBoard(id) {
        const index = this.boards.findIndex(b => b.id === id);
        if (index === -1) return;

        const board = this.boards[index];

        // Ha konyha korpusz tagja, az egész korpuszt töröljük
        if (board.corpusId) {
            this.deleteCorpus(board.corpusId);
            return;
        }

        // Ha egyedi csoport tagja, vegyük ki a csoportból
        if (board.groupId) {
            const groupId = board.groupId;
            const group = this.customGroups.find(g => g.userData.id === groupId);
            if (group) {
                group.remove(board.mesh);
                const remaining = this.boards.filter(b => b.groupId === groupId && b.id !== id);
                if (remaining.length === 0) {
                    const gIdx = this.customGroups.indexOf(group);
                    if (gIdx > -1) this.customGroups.splice(gIdx, 1);
                    this.scene3D.scene.remove(group);
                }
            }
        }

        if (this.scene3D.selectedTarget === board.mesh) {
            this.scene3D.selectBoard(null);
        }

        if (board.mesh) {
            this.scene3D.scene.remove(board.mesh);
            if (board.mesh.isGroup || (board.mesh.children && board.mesh.children.length > 0)) {
                board.mesh.traverse(child => {
                    if (child.isMesh) {
                        if (child.geometry) child.geometry.dispose();
                        if (child.material) {
                            if (Array.isArray(child.material)) {
                                child.material.forEach(m => {
                                    if (m.map) m.map.dispose();
                                    m.dispose();
                                });
                            } else {
                                if (child.material.map) child.material.map.dispose();
                                child.material.dispose();
                            }
                        }
                    }
                });
            } else {
                if (board.mesh.geometry) board.mesh.geometry.dispose();
                if (board.mesh.material) {
                    if (Array.isArray(board.mesh.material)) {
                        board.mesh.material.forEach(m => {
                            if (m.map) m.map.dispose();
                            m.dispose();
                        });
                    } else {
                        if (board.mesh.material.map) board.mesh.material.map.dispose();
                        board.mesh.material.dispose();
                    }
                }
            }
        }

        if (board.outlineMesh) {
            if (board.outlineMesh.geometry) board.outlineMesh.geometry.dispose();
            if (board.outlineMesh.material) board.outlineMesh.material.dispose();
        }

        const meshIdx = this.scene3D.boardMeshes.indexOf(board.mesh);
        if (meshIdx > -1) {
            this.scene3D.boardMeshes.splice(meshIdx, 1);
        }

        this.boards.splice(index, 1);
        this.scene3D.updateDimensionVisualizer();
    }

    setExplodedView(factor) {
        if (this.boards.length === 0) return;

        const center = this.scene3D.calculateFurnitureCenter();
        const maxExplodeDistance = 350;

        this.boards.forEach(b => {
            if (!b.mesh) return;

            const worldPos = new THREE.Vector3();
            b.mesh.getWorldPosition(worldPos);

            const origX = b.x;
            const origY = b.y;
            const origZ = b.z;

            const dirX = worldPos.x - center.x;
            const dirY = worldPos.y - center.y;
            const dirZ = worldPos.z - center.z;

            const len = Math.hypot(dirX, dirY, dirZ) || 1;
            const normX = dirX / len;
            const normY = dirY / len;
            const normZ = dirZ / len;

            b.mesh.position.x = origX + normX * maxExplodeDistance * factor;
            b.mesh.position.y = origY + normY * maxExplodeDistance * factor;
            b.mesh.position.z = origZ + normZ * maxExplodeDistance * factor;
        });

        this.scene3D.updateDimensionVisualizer();
    }

    getFurnitureBoundingBox() {
        if (this.boards.length === 0) {
            return { width: 0, height: 0, depth: 0, count: 0 };
        }

        const box = new THREE.Box3();
        this.boards.forEach(b => {
            if (b.mesh) box.expandByObject(b.mesh);
        });

        const size = new THREE.Vector3();
        box.getSize(size);

        return {
            width: Math.round(size.x),
            height: Math.round(size.y),
            depth: Math.round(size.z),
            count: this.boards.length,
            box: box
        };
    }

    clearAll() {
        while (this.corpora.length > 0) {
            this.deleteCorpus(this.corpora[0].userData.id);
        }
        while (this.customGroups.length > 0) {
            this.deleteGroup(this.customGroups[0].userData.id);
        }
        while (this.boards.length > 0) {
            this.deleteBoard(this.boards[0].id);
        }
        this.boardCounter = 1;
        this.corpusCounter = 1;
        this.groupCounter = 1;
    }

    getMultiTargetsBoundingBox(targets) {
        const box = new THREE.Box3();
        if (!targets || targets.length === 0) {
            return { width: 0, height: 0, depth: 0, box: box };
        }
        targets.forEach(t => {
            t.updateWorldMatrix(true, true);
            box.expandByObject(t);
        });
        const size = new THREE.Vector3();
        box.getSize(size);
        return {
            width: Math.round(size.x),
            height: Math.round(size.y),
            depth: Math.round(size.z),
            box: box
        };
    }

    getMultiTargetsBoardCount(targets) {
        if (!targets || targets.length === 0) return 0;
        let count = 0;
        const countedCorpusIds = new Set();
        const countedGroupIds = new Set();
        const countedBoardIds = new Set();

        targets.forEach(t => {
            if (t.userData && t.userData.isCorpus) {
                if (!countedCorpusIds.has(t.userData.id)) {
                    countedCorpusIds.add(t.userData.id);
                    count += this.boards.filter(b => b.corpusId === t.userData.id).length;
                }
            } else if (t.userData && t.userData.isCustomGroup) {
                if (!countedGroupIds.has(t.userData.id)) {
                    countedGroupIds.add(t.userData.id);
                    count += this.boards.filter(b => b.groupId === t.userData.id).length;
                }
            } else if (t.userData && t.userData.corpusId) {
                if (!countedCorpusIds.has(t.userData.corpusId)) {
                    countedCorpusIds.add(t.userData.corpusId);
                    count += this.boards.filter(b => b.corpusId === t.userData.corpusId).length;
                }
            } else if (t.userData && t.userData.groupId) {
                if (!countedGroupIds.has(t.userData.groupId)) {
                    countedGroupIds.add(t.userData.groupId);
                    count += this.boards.filter(b => b.groupId === t.userData.groupId).length;
                }
            } else if (t.userData && t.userData.id) {
                if (!countedBoardIds.has(t.userData.id)) {
                    countedBoardIds.add(t.userData.id);
                    count++;
                }
            }
        });
        return count;
    }

    getMultiTargetsJSON(targets) {
        if (!targets || targets.length === 0) return { corpora: [], customGroups: [], boards: [] };

        const bounds = this.getMultiTargetsBoundingBox(targets);
        const center = new THREE.Vector3();
        bounds.box.getCenter(center);
        const offsetX = center.x;
        const offsetY = bounds.box.min.y;
        const offsetZ = center.z;

        const corporaToSave = [];
        const groupsToSave = [];
        const boardsToSave = [];

        const savedCorpusIds = new Set();
        const savedGroupIds = new Set();
        const savedBoardIds = new Set();

        targets.forEach(t => {
            const isCorpus = t.userData && t.userData.isCorpus;
            const isGroup = t.userData && t.userData.isCustomGroup;
            const corpusId = t.userData ? (isCorpus ? t.userData.id : t.userData.corpusId) : null;
            const groupId = t.userData ? (isGroup ? t.userData.id : t.userData.groupId) : null;

            if (corpusId && !savedCorpusIds.has(corpusId)) {
                savedCorpusIds.add(corpusId);
                const corpus = this.corpora.find(c => c.userData.id === corpusId);
                if (corpus) {
                    corporaToSave.push({
                        id: corpus.userData.id,
                        name: corpus.userData.name,
                        config: JSON.parse(JSON.stringify(corpus.userData.config)),
                        x: corpus.position.x - offsetX,
                        y: corpus.position.y - offsetY,
                        z: corpus.position.z - offsetZ
                    });
                }
            } else if (groupId && !savedGroupIds.has(groupId)) {
                savedGroupIds.add(groupId);
                const group = this.customGroups.find(g => g.userData.id === groupId);
                if (group) {
                    groupsToSave.push({
                        id: group.userData.id,
                        name: group.userData.name,
                        x: group.position.x - offsetX,
                        y: group.position.y - offsetY,
                        z: group.position.z - offsetZ
                    });
                    const childBoards = this.boards.filter(b => b.groupId === groupId);
                    childBoards.forEach(b => {
                        if (!savedBoardIds.has(b.id)) {
                            savedBoardIds.add(b.id);
                            const worldPos = new THREE.Vector3();
                            const worldQuat = new THREE.Quaternion();
                            if (b.mesh) {
                                b.mesh.getWorldPosition(worldPos);
                                b.mesh.getWorldQuaternion(worldQuat);
                            }
                            const euler = new THREE.Euler().setFromQuaternion(worldQuat);
                            boardsToSave.push({
                                id: b.id,
                                groupId: b.groupId,
                                name: b.name,
                                width: b.width,
                                height: b.height,
                                depth: b.depth,
                                thickness: b.thickness,
                                edgeRadius: b.edgeRadius !== undefined ? b.edgeRadius : 1,
                                type: b.type,
                                textureKey: b.textureKey,
                                edgeBanding: b.edgeBanding,
                                x: worldPos.x - offsetX,
                                y: worldPos.y - offsetY,
                                z: worldPos.z - offsetZ,
                                rotX: Math.round(THREE.MathUtils.radToDeg(euler.x)),
                                rotY: Math.round(THREE.MathUtils.radToDeg(euler.y)),
                                rotZ: Math.round(THREE.MathUtils.radToDeg(euler.z))
                            });
                        }
                    });
                }
            } else if (!corpusId && !groupId && t.userData && t.userData.id) {
                const bId = t.userData.id;
                if (!savedBoardIds.has(bId)) {
                    savedBoardIds.add(bId);
                    const b = this.boards.find(item => item.id === bId || item.mesh === t);
                    if (b) {
                        const worldPos = new THREE.Vector3();
                        const worldQuat = new THREE.Quaternion();
                        if (b.mesh) {
                            b.mesh.getWorldPosition(worldPos);
                            b.mesh.getWorldQuaternion(worldQuat);
                        }
                        const euler = new THREE.Euler().setFromQuaternion(worldQuat);
                        boardsToSave.push({
                            id: b.id,
                            groupId: null,
                            name: b.name,
                            width: b.width,
                            height: b.height,
                            depth: b.depth,
                            thickness: b.thickness,
                            edgeRadius: b.edgeRadius !== undefined ? b.edgeRadius : 1,
                            type: b.type,
                            textureKey: b.textureKey,
                            edgeBanding: b.edgeBanding,
                            x: worldPos.x - offsetX,
                            y: worldPos.y - offsetY,
                            z: worldPos.z - offsetZ,
                            rotX: Math.round(THREE.MathUtils.radToDeg(euler.x)),
                            rotY: Math.round(THREE.MathUtils.radToDeg(euler.y)),
                            rotZ: Math.round(THREE.MathUtils.radToDeg(euler.z))
                        });
                    }
                }
            }
        });

        return {
            corpora: corporaToSave,
            customGroups: groupsToSave,
            boards: boardsToSave
        };
    }

    getCorpusJSON(corpusId) {
        const c = this.corpora.find(item => item.userData.id === corpusId);
        if (!c) return null;
        return {
            corpora: [{
                id: c.userData.id,
                name: c.userData.name,
                config: JSON.parse(JSON.stringify(c.userData.config)),
                x: 0,
                y: 0,
                z: 0
            }],
            boards: []
        };
    }

    getGroupJSON(groupId) {
        const group = this.customGroups.find(item => item.userData.id === groupId);
        if (!group) return null;
        const childBoards = this.boards.filter(b => b.groupId === groupId);
        return {
            corpora: [],
            customGroups: [{
                id: group.userData.id,
                name: group.userData.name,
                x: 0,
                y: 0,
                z: 0
            }],
            boards: childBoards.map(b => ({
                id: b.id,
                groupId: group.userData.id,
                name: b.name,
                width: b.width,
                height: b.height,
                depth: b.depth,
                thickness: b.thickness,
                edgeRadius: b.edgeRadius !== undefined ? b.edgeRadius : 1,
                type: b.type,
                textureKey: b.textureKey,
                edgeBanding: b.edgeBanding,
                x: b.mesh.position.x,
                y: b.mesh.position.y,
                z: b.mesh.position.z,
                rotX: Math.round(THREE.MathUtils.radToDeg(b.mesh.rotation.x)),
                rotY: Math.round(THREE.MathUtils.radToDeg(b.mesh.rotation.y)),
                rotZ: Math.round(THREE.MathUtils.radToDeg(b.mesh.rotation.z))
            }))
        };
    }

    getSingleBoardJSON(boardId) {
        const b = this.boards.find(item => item.id === boardId);
        if (!b) return null;
        return {
            corpora: [],
            boards: [{
                name: b.name,
                width: b.width,
                height: b.height,
                depth: b.depth,
                thickness: b.thickness,
                edgeRadius: b.edgeRadius !== undefined ? b.edgeRadius : 1,
                type: b.type,
                textureKey: b.textureKey,
                edgeBanding: b.edgeBanding,
                x: 0,
                y: b.height / 2,
                z: 0,
                rotX: b.rotX || 0,
                rotY: b.rotY || 0,
                rotZ: b.rotZ || 0
            }]
        };
    }

    toJSON() {
        return {
            corpora: this.corpora.map(c => ({
                id: c.userData.id,
                name: c.userData.name,
                config: c.userData.config,
                x: c.position.x,
                y: c.position.y,
                z: c.position.z
            })),
            customGroups: this.customGroups.map(g => ({
                id: g.userData.id,
                name: g.userData.name,
                x: g.position.x,
                y: g.position.y,
                z: g.position.z
            })),
            boards: this.boards.filter(b => !b.corpusId).map(b => {
                const worldPos = new THREE.Vector3();
                const worldQuat = new THREE.Quaternion();
                if (b.mesh) {
                    b.mesh.getWorldPosition(worldPos);
                    b.mesh.getWorldQuaternion(worldQuat);
                }
                const euler = new THREE.Euler().setFromQuaternion(worldQuat);
                return {
                    id: b.id,
                    groupId: b.groupId || null,
                    name: b.name,
                    width: b.width,
                    height: b.height,
                    depth: b.depth,
                    thickness: b.thickness,
                    edgeRadius: b.edgeRadius !== undefined ? b.edgeRadius : 1,
                    type: b.type,
                    textureKey: b.textureKey,
                    edgeBanding: b.edgeBanding,
                    x: b.mesh ? worldPos.x : b.x,
                    y: b.mesh ? worldPos.y : b.y,
                    z: b.mesh ? worldPos.z : b.z,
                    rotX: b.mesh ? Math.round(THREE.MathUtils.radToDeg(euler.x)) : b.rotX,
                    rotY: b.mesh ? Math.round(THREE.MathUtils.radToDeg(euler.y)) : b.rotY,
                    rotZ: b.mesh ? Math.round(THREE.MathUtils.radToDeg(euler.z)) : b.rotZ
                };
            })
        };
    }

    fromJSON(data, replace = true) {
        if (replace) {
            this.clearAll();
        }

        if (!data) return;

        // Ha a régi formátumú egyszerű boards tömb
        if (Array.isArray(data)) {
            data.forEach(item => {
                this.createBoard(item);
            });
            this.scene3D.setCameraView('iso');
            return;
        }

        // Új formátum: corpora + boards + customGroups
        if (data.corpora && Array.isArray(data.corpora)) {
            data.corpora.forEach(c => {
                this.createCorpus(c.config, c.x || 0, c.y || 0, c.z || 0);
            });
        }

        const createdBoardsMap = {};
        if (data.boards && Array.isArray(data.boards)) {
            data.boards.forEach(b => {
                const created = this.createBoard(b);
                if (b.id) createdBoardsMap[b.id] = created;
                if (b.groupId) created.groupId = b.groupId;
            });
        }

        // Csoportok újjáépítése
        if (data.customGroups && Array.isArray(data.customGroups)) {
            data.customGroups.forEach(g => {
                const groupBoards = this.boards.filter(b => b.groupId === g.id);
                if (groupBoards.length > 0) {
                    const group = new THREE.Group();
                    group.position.set(g.x || 0, g.y || 0, g.z || 0);
                    group.userData = {
                        id: g.id,
                        name: g.name || 'Bútor Csoport',
                        isCustomGroup: true,
                        isCorpus: false,
                        x: g.x || 0,
                        y: g.y || 0,
                        z: g.z || 0
                    };
                    this.scene3D.scene.add(group);
                    groupBoards.forEach(b => {
                        group.attach(b.mesh);
                        b.parentGroup = group;
                    });
                    this.customGroups.push(group);
                }
            });
        }

        this.scene3D.setCameraView('iso');
    }
}
