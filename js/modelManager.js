/**
 * 3D Hardver Modell Kezelő (modelManager.js)
 * Egyedi 3D fogantyúk (handle) és bútorlábak (leg) betöltése és elhelyezése Three.js-ben.
 */

import { MaterialManager } from './textures.js';

export const ModelManager = {
    models: {},
    isLoaded: false,
    gltfLoader: null,

    init() {
        if (typeof THREE === 'undefined' || typeof THREE.GLTFLoader === 'undefined') {
            console.warn('ModelManager: THREE vagy THREE.GLTFLoader nem elérhető!');
            return;
        }

        this.gltfLoader = new THREE.GLTFLoader();
        this.loadAllModels();
    },

    /**
     * Összes beépített és beágyazott 3D modell előtöltése és Blender transzformációk kinullázása
     */
    loadAllModels() {
        const modelSources = {
            'handle_01': '3d model/handle/fogo_01.glb',
            'handle_02': '3d model/handle/fogo_02.glb',
            'handle_03': '3d model/handle/fogo_03.glb',
            'handle_04': '3d model/handle/fogo_04.glb',
            'fogo_01': '3d model/handle/fogo_01.glb',
            'fogo_02': '3d model/handle/fogo_02.glb',
            'fogo_03': '3d model/handle/fogo_03.glb',
            'fogo_04': '3d model/handle/fogo_04.glb',
            'leg_01': '3d model/leg/lab_01.glb',
            'leg_02': '3d model/leg/lab_02.glb',
            'leg_03': '3d model/leg/lab_03.glb',
            'lab_01': '3d model/leg/lab_01.glb',
            'lab_02': '3d model/leg/lab_02.glb',
            'lab_03': '3d model/leg/lab_03.glb'
        };

        const keys = Object.keys(modelSources);
        keys.forEach(key => {
            const baseKey = key.replace('fogo_', 'handle_').replace('lab_', 'leg_');
            const dataUrl = (typeof EMBEDDED_MODELS !== 'undefined' && (EMBEDDED_MODELS[key] || EMBEDDED_MODELS[baseKey]))
                ? (EMBEDDED_MODELS[key] || EMBEDDED_MODELS[baseKey])
                : modelSources[key];

            this.gltfLoader.load(dataUrl, (gltf) => {
                // FONTOS: A Blenderből exportált eltolások (translation: [-0.23, 0.02, 2.71]) kinullázása,
                // hogy a geometriák a valós lokális (0,0,0) origóhoz igazodjanak!
                gltf.scene.position.set(0, 0, 0);
                gltf.scene.rotation.set(0, 0, 0);
                gltf.scene.scale.set(1, 1, 1);
                gltf.scene.traverse((node) => {
                    node.position.set(0, 0, 0);
                    node.rotation.set(0, 0, 0);
                    node.scale.set(1, 1, 1);
                });

                this.models[key] = gltf.scene;
                this.models[baseKey] = gltf.scene;
            }, undefined, (err) => {
                console.warn(`ModelManager: Nem sikerült betölteni a modellt: ${key}`, err);
            });
        });
    },

    hasModel(id) {
        if (!id) return false;
        const normalized = id.replace('fogo_', 'handle_').replace('lab_', 'leg_');
        return !!(this.models[id] || this.models[normalized]);
    },

    /**
     * 3D Fogantyú Mesh/Group létrehozása és pontos tájolása a fronton
     */
    createHandleMesh(boardData) {
        const rawModelId = boardData.modelId || 'fogo_01';
        const modelId = rawModelId.replace('handle_', 'fogo_');
        const normalizedKey = rawModelId.replace('fogo_', 'handle_');
        const sourceScene = this.models[rawModelId] || this.models[modelId] || this.models[normalizedKey];

        const orientation = boardData.handleOrientation || 'horizontal';
        const isVertical = orientation === 'vertical';

        if (!sourceScene) {
            // Tartalék procedurális fém rúdfogantyú
            const handleL = modelId === 'fogo_02' || modelId === 'fogo_03' ? 200 : 160;
            const w = isVertical ? 12 : handleL;
            const h = isVertical ? handleL : 12;
            const d = 25;
            const geo = new THREE.BoxGeometry(w, h, d);
            const mat = MaterialManager.createMaterial('metal_chrome');
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(boardData.x, boardData.y, boardData.z + d / 2);
            mesh.userData = boardData;
            return mesh;
        }

        const group = new THREE.Group();
        const clone = sourceScene.clone(true);

        clone.position.set(0, 0, 0);
        clone.rotation.set(0, 0, 0);
        clone.traverse((child) => {
            child.position.set(0, 0, 0);
            child.rotation.set(0, 0, 0);
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                    child.material = child.material.clone();
                }
            }
        });

        // Méretezés: A GLB méterben van -> milliméterre konvertálás (×1000)
        clone.scale.set(1000, 1000, 1000);

        // GLB nyers koordináták:
        // X = hosszúság (Length)
        // Y = kiállás előre / felfekvő talpak (Mounting surface at min Y)
        // Z = vastagság (Thickness)
        // Elforgatás X tengely körül +90°-kal, hogy a fogantyú a front felületére feküdjön és +Z irányba álljon ki:
        clone.rotation.x = Math.PI / 2;

        // Felfekvési mélységeltolás (hogy a fogantyú talpa pontosan a bútorlap frontjára érjen)
        let mountOffset = 8.87;
        if (modelId === 'fogo_02') mountOffset = 17.94;
        if (modelId === 'fogo_03') mountOffset = 19.66;
        if (modelId === 'fogo_04') mountOffset = 9.43;
        clone.position.z = mountOffset;

        if (isVertical) {
            // 90 fokos forgatás függőleges állásba
            clone.rotation.z = Math.PI / 2;
        }

        group.add(clone);
        group.position.set(boardData.x, boardData.y, boardData.z);
        group.userData = boardData;
        return group;
    },

    /**
     * 3D Bútorláb Mesh/Group létrehozása és skálázása a kívánt magasságra
     */
    createLegMesh(boardData) {
        const rawModelId = boardData.modelId || 'lab_01';
        const modelId = rawModelId.replace('leg_', 'lab_');
        const normalizedKey = rawModelId.replace('lab_', 'leg_');
        const sourceScene = this.models[rawModelId] || this.models[modelId] || this.models[normalizedKey];
        const targetH = Number(boardData.height) || 100;

        if (!sourceScene) {
            // Tartalék henger láb
            const geo = new THREE.CylinderGeometry(20, 22, targetH, 20);
            const mat = MaterialManager.createMaterial('metal_chrome');
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(boardData.x, targetH / 2, boardData.z);
            mesh.userData = boardData;
            return mesh;
        }

        const group = new THREE.Group();
        const clone = sourceScene.clone(true);

        clone.position.set(0, 0, 0);
        clone.rotation.set(0, 0, 0);
        clone.traverse((child) => {
            child.position.set(0, 0, 0);
            child.rotation.set(0, 0, 0);
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                    child.material = child.material.clone();
                }
            }
        });

        // Skálázás: X és Z ×1000, Y skála a célláb magasságához igazítva
        const scaleY = (targetH / 100) * 1000;
        clone.scale.set(1000, scaleY, 1000);

        // Függőleges pozicionálás: a láb talpa pontosan Y = 0 (talaj), teteje Y = targetH (korpusz fenéklap alsó síkja)
        let bottomOffset = 36.88;
        if (modelId === 'lab_02') bottomOffset = 20.32;
        if (modelId === 'lab_03') bottomOffset = 23.64;

        clone.position.y = bottomOffset * (targetH / 100);

        group.add(clone);
        // A láb a padlón áll (Y = 0)
        group.position.set(boardData.x, 0, boardData.z);
        group.userData = boardData;
        return group;
    },

    /**
     * 3D Modern Blum / Hettich Stílusú Kivetőpánt (Concealed Clip Hinge) generálása
     * Pántedény, hajlított csuklópánt kar burkolattal, kereszttalp rögzítőcsavarral
     */
    createHingeMesh(boardData) {
        const side = boardData.side || 'left';
        const isLeft = side === 'left';
        const group = new THREE.Group();

        // 1. Csillogó, valósághű PBR fém anyagok
        const chromeMat = new THREE.MeshStandardMaterial({
            color: 0xe2e8f0,
            metalness: 0.96,
            roughness: 0.20,
            envMapIntensity: 1.3
        });
        const satinArmMat = new THREE.MeshStandardMaterial({
            color: 0xc8d1dc,
            metalness: 0.92,
            roughness: 0.28
        });
        const darkMetalMat = new THREE.MeshStandardMaterial({
            color: 0x64748b,
            metalness: 0.88,
            roughness: 0.38
        });
        const screwMat = new THREE.MeshStandardMaterial({
            color: 0xf1f5f9,
            metalness: 0.98,
            roughness: 0.15
        });

        // 2. PÁNTEDÉNY EGYSÉG (A frontlap belső síkján ül)
        const cupGroup = new THREE.Group();
        cupGroup.name = 'hinge_cup_group';

        // Pántedény karima (56 × 26 × 2.5 mm, lekerekített fülekkel)
        const flangeW = 26;
        const flangeH = 54;
        const flangeTh = 2.5;
        const flangeGeo = new THREE.BoxGeometry(flangeW, flangeH, flangeTh);
        const flangeMesh = new THREE.Mesh(flangeGeo, chromeMat);
        flangeMesh.position.set(0, 0, flangeTh / 2);
        flangeMesh.castShadow = true;
        flangeMesh.receiveShadow = true;
        cupGroup.add(flangeMesh);

        // Ø35mm henger edénytest (a frontba süllyesztve előre +Z felé)
        const cupCylinderGeo = new THREE.CylinderGeometry(17.5, 17.5, 11.5, 24);
        cupCylinderGeo.rotateX(Math.PI / 2);
        const cupMesh = new THREE.Mesh(cupCylinderGeo, darkMetalMat);
        cupMesh.position.set(0, 0, 11.5 / 2 + flangeTh);
        cupGroup.add(cupMesh);

        // Pántedény 2 db süllyesztett rögzítőcsavar
        [-19, 19].forEach(offY => {
            const screwHeadGeo = new THREE.CylinderGeometry(3.5, 2.5, 1.2, 16);
            screwHeadGeo.rotateX(Math.PI / 2);
            const screwMesh = new THREE.Mesh(screwHeadGeo, screwMat);
            screwMesh.position.set(0, offY, 0.4);
            cupGroup.add(screwMesh);

            // Kereszthorony a csavarfejben
            const slotGeo = new THREE.BoxGeometry(4.5, 0.8, 0.5);
            const slotMesh = new THREE.Mesh(slotGeo, darkMetalMat);
            slotMesh.position.set(0, offY, 0.2);
            cupGroup.add(slotMesh);
        });

        // 3. CSUKLÓS PÁNTKAR EGYSÉG (A pántedény és a szerelőtalp között ível át)
        const armGroup = new THREE.Group();
        armGroup.name = 'hinge_arm_group';

        // Fő pántkar hajlított acél test (Z irányban hátrafelé nyúlik a korpusz belsejébe)
        const armW = 14;
        const armH = 18;
        const armD = 46;
        const armBodyGeo = new THREE.BoxGeometry(armW, armH, armD);
        const armBodyMesh = new THREE.Mesh(armBodyGeo, satinArmMat);
        armBodyMesh.position.set(0, 0, -armD / 2);
        armBodyMesh.castShadow = true;
        armGroup.add(armBodyMesh);

        // Felső takarósapka / csillapító borítás lekerekített dizájnnal (a fotón látható díszfedél)
        const capGeo = new THREE.BoxGeometry(15.5, 17, 30);
        const capMesh = new THREE.Mesh(capGeo, chromeMat);
        capMesh.position.set(0, 0, -22);
        capMesh.castShadow = true;
        armGroup.add(capMesh);

        // Oldalsó acél forgócsap szegecsek (a képen látható 3 db forgópont csap)
        const rivets = [
            { z: -5, y: 4.5 },
            { z: -13, y: -2.5 },
            { z: -27, y: -5 }
        ];
        rivets.forEach(r => {
            const rivetGeo = new THREE.CylinderGeometry(1.6, 1.6, 16.5, 14);
            rivetGeo.rotateZ(Math.PI / 2);
            const rivetMesh = new THREE.Mesh(rivetGeo, screwMat);
            rivetMesh.position.set(0, r.y, r.z);
            armGroup.add(rivetMesh);
        });

        // Hátsó rugós kioldó fül / gomb (a fotón látható bordázott kioldó gomb a kar végén)
        const clipButtonGeo = new THREE.BoxGeometry(12, 13, 8);
        const clipButtonMesh = new THREE.Mesh(clipButtonGeo, darkMetalMat);
        clipButtonMesh.position.set(0, -2, -armD - 3);
        armGroup.add(clipButtonMesh);

        // 4. KERESZTTALP / SZERELŐTALP EGYSÉG (A korpusz belső oldalára rögzítve)
        const plateGroup = new THREE.Group();
        plateGroup.name = 'hinge_plate_group';

        // Kereszttalp fém talplemez
        const plateW = 4.5;
        const plateH = 34;
        const plateD = 40;
        const plateGeo = new THREE.BoxGeometry(plateW, plateH, plateD);
        const plateMesh = new THREE.Mesh(plateGeo, chromeMat);
        plateMesh.position.set(isLeft ? plateW / 2 : -plateW / 2, 0, -24);
        plateMesh.castShadow = true;
        plateGroup.add(plateMesh);

        // Fő magasság- és mélységállító csavar (nagy kereszthornyos csavar a talpon)
        const plateScrewGeo = new THREE.CylinderGeometry(4.5, 3.5, 2.5, 16);
        plateScrewGeo.rotateZ(Math.PI / 2);
        const plateScrewMesh = new THREE.Mesh(plateScrewGeo, screwMat);
        plateScrewMesh.position.set(isLeft ? plateW + 0.8 : -plateW - 0.8, 0, -24);
        plateGroup.add(plateScrewMesh);

        // 5. POZICIONÁLÁS
        const cupX = boardData.cupX !== undefined ? Number(boardData.cupX) : (isLeft ? -278.5 : 278.5);
        const wallX = boardData.wallX !== undefined ? Number(boardData.wallX) : (isLeft ? -282 : 282);
        const hingeY = Number(boardData.y) || 0;
        const frontZ = boardData.z !== undefined ? Number(boardData.z) : 252.5;

        cupGroup.position.set(cupX, hingeY, frontZ);
        armGroup.position.set((cupX + wallX) / 2, hingeY, frontZ);
        plateGroup.position.set(wallX, hingeY, frontZ);

        group.add(cupGroup);
        group.add(armGroup);
        group.add(plateGroup);

        group.userData = boardData;
        return group;
    }
};
