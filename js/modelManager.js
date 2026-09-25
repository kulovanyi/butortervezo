/**
 * 3D Hardver Modell Kezelő (modelManager.js)
 * Egyedi 3D fogantyúk (handle) és bútorlábak (leg) betöltése és elhelyezése Three.js-ben.
 */

import { MaterialManager } from './textures.js';

export const ModelManager = {
    models: {},
    elementModels: [
        {
                "id": "elem_ef_50",
                "fileName": "ef_50.glb",
                "name": "ef_50",
                "path": "3d model/element/ef_50.glb",
                "size": 309624,
                "category": "base_cabinet"
        },
        {
                "id": "elem_ef_60",
                "fileName": "ef_60.glb",
                "name": "ef_60",
                "path": "3d model/element/ef_60.glb",
                "size": 309636,
                "category": "base_cabinet"
        },
        {
                "id": "elem_pec_50_60",
                "fileName": "pec_50_60.glb",
                "name": "pec_50_60",
                "path": "3d model/element/pec_50_60.glb",
                "size": 813752,
                "category": "tall_cabinet"
        },
        {
                "id": "elem_s_a1a1f_40",
                "fileName": "s_a1a1f_40.glb",
                "name": "s_a1a1f_40",
                "path": "3d model/element/s_a1a1f_40.glb",
                "size": 556556,
                "category": "base_cabinet"
        },
        {
                "id": "elem_s_a1a1fs_100",
                "fileName": "s_a1a1fs_100.glb",
                "name": "s_a1a1fs_100",
                "path": "3d model/element/s_a1a1fs_100.glb",
                "size": 559100,
                "category": "base_cabinet"
        },
        {
                "id": "elem_s_a1a1vfs_100",
                "fileName": "s_a1a1vfs_100.glb",
                "name": "s_a1a1vfs_100",
                "path": "3d model/element/s_a1a1vfs_100.glb",
                "size": 532916,
                "category": "base_cabinet"
        },
        {
                "id": "elem_s_a2a1f_60",
                "fileName": "s_a2a1f_60.glb",
                "name": "s_a2a1f_60",
                "path": "3d model/element/s_a2a1f_60.glb",
                "size": 784032,
                "category": "base_cabinet"
        },
        {
                "id": "elem_s_a2a1vf_60",
                "fileName": "s_a2a1vf_60.glb",
                "name": "s_a2a1vf_60",
                "path": "3d model/element/s_a2a1vf_60.glb",
                "size": 758544,
                "category": "base_cabinet"
        },
        {
                "id": "elem_s_a2a2f_80",
                "fileName": "s_a2a2f_80.glb",
                "name": "s_a2a2f_80",
                "path": "3d model/element/s_a2a2f_80.glb",
                "size": 607548,
                "category": "base_cabinet"
        },
        {
                "id": "elem_s_a2a2vfmo_80",
                "fileName": "s_a2a2vfmo_80.glb",
                "name": "s_a2a2vfmo_80",
                "path": "3d model/element/s_a2a2vfmo_80.glb",
                "size": 556352,
                "category": "base_cabinet"
        },
        {
                "id": "elem_s_a3f_40",
                "fileName": "s_a3f_40.glb",
                "name": "s_a3f_40",
                "path": "3d model/element/s_a3f_40.glb",
                "size": 611956,
                "category": "base_cabinet"
        },
        {
                "id": "elem_s_a3f_60",
                "fileName": "s_a3f_60.glb",
                "name": "s_a3f_60",
                "path": "3d model/element/s_a3f_60.glb",
                "size": 801072,
                "category": "base_cabinet"
        },
        {
                "id": "elem_s_akm_15",
                "fileName": "s_akm_15.glb",
                "name": "s_akm_15",
                "path": "3d model/element/s_akm_15.glb",
                "size": 802752,
                "category": "base_cabinet"
        },
        {
                "id": "elem_s_any_15",
                "fileName": "s_any_15.glb",
                "name": "s_any_15",
                "path": "3d model/element/s_any_15.glb",
                "size": 401736,
                "category": "base_cabinet"
        },
        {
                "id": "elem_s_any_20",
                "fileName": "s_any_20.glb",
                "name": "s_any_20",
                "path": "3d model/element/s_any_20.glb",
                "size": 401740,
                "category": "base_cabinet"
        },
        {
                "id": "elem_s_any_25",
                "fileName": "s_any_25.glb",
                "name": "s_any_25",
                "path": "3d model/element/s_any_25.glb",
                "size": 716728,
                "category": "base_cabinet"
        },
        {
                "id": "elem_s_any_30",
                "fileName": "s_any_30.glb",
                "name": "s_any_30",
                "path": "3d model/element/s_any_30.glb",
                "size": 716760,
                "category": "base_cabinet"
        },
        {
                "id": "elem_s_any_35",
                "fileName": "s_any_35.glb",
                "name": "s_any_35",
                "path": "3d model/element/s_any_35.glb",
                "size": 716024,
                "category": "base_cabinet"
        },
        {
                "id": "elem_s_any_40",
                "fileName": "s_any_40.glb",
                "name": "s_any_40",
                "path": "3d model/element/s_any_40.glb",
                "size": 527440,
                "category": "base_cabinet"
        },
        {
                "id": "elem_s_asz3a1f_40",
                "fileName": "s_asz3a1f_40.glb",
                "name": "s_asz3a1f_40",
                "path": "3d model/element/s_asz3a1f_40.glb",
                "size": 604892,
                "category": "base_cabinet"
        },
        {
                "id": "elem_s_asz4a1f_60_60",
                "fileName": "s_asz4a1f_60_60.glb",
                "name": "s_asz4a1f_60_60",
                "path": "3d model/element/s_asz4a1f_60_60.glb",
                "size": 832956,
                "category": "base_cabinet"
        },
        {
                "id": "elem_s_asztm_60",
                "fileName": "s_asztm_60.glb",
                "name": "s_asztm_60",
                "path": "3d model/element/s_asztm_60.glb",
                "size": 22858844,
                "category": "base_cabinet"
        },
        {
                "id": "elem_s_at_60",
                "fileName": "s_at_60.glb",
                "name": "s_at_60",
                "path": "3d model/element/s_at_60.glb",
                "size": 16413840,
                "category": "base_cabinet"
        },
        {
                "id": "elem_s_avz_15",
                "fileName": "s_avz_15.glb",
                "name": "s_avz_15",
                "path": "3d model/element/s_avz_15.glb",
                "size": 430596,
                "category": "base_cabinet"
        },
        {
                "id": "elem_s_avz_30",
                "fileName": "s_avz_30.glb",
                "name": "s_avz_30",
                "path": "3d model/element/s_avz_30.glb",
                "size": 715376,
                "category": "base_cabinet"
        },
        {
                "id": "elem_s_ef_60",
                "fileName": "s_ef_60.glb",
                "name": "s_ef_60",
                "path": "3d model/element/s_ef_60.glb",
                "size": 300204,
                "category": "other"
        },
        {
                "id": "elem_s_f1a_60_40",
                "fileName": "s_f1a_60_40.glb",
                "name": "s_f1a_60_40",
                "path": "3d model/element/s_f1a_60_40.glb",
                "size": 301064,
                "category": "wall_cabinet"
        },
        {
                "id": "elem_s_f1a_72_30",
                "fileName": "s_f1a_72_30.glb",
                "name": "s_f1a_72_30",
                "path": "3d model/element/s_f1a_72_30.glb",
                "size": 301924,
                "category": "wall_cabinet"
        },
        {
                "id": "elem_s_f1a_72_40",
                "fileName": "s_f1a_72_40.glb",
                "name": "s_f1a_72_40",
                "path": "3d model/element/s_f1a_72_40.glb",
                "size": 301904,
                "category": "wall_cabinet"
        },
        {
                "id": "elem_s_f2a60_80",
                "fileName": "s_f2a60_80.glb",
                "name": "s_f2a60_80",
                "path": "3d model/element/s_f2a60_80.glb",
                "size": 325492,
                "category": "wall_cabinet"
        },
        {
                "id": "elem_s_f2a_60_60",
                "fileName": "s_f2a_60_60.glb",
                "name": "s_f2a_60_60",
                "path": "3d model/element/s_f2a_60_60.glb",
                "size": 325536,
                "category": "wall_cabinet"
        },
        {
                "id": "elem_s_f2a_72_60",
                "fileName": "s_f2a_72_60.glb",
                "name": "s_f2a_72_60",
                "path": "3d model/element/s_f2a_72_60.glb",
                "size": 326380,
                "category": "wall_cabinet"
        },
        {
                "id": "elem_s_f2a_72_80",
                "fileName": "s_f2a_72_80.glb",
                "name": "s_f2a_72_80",
                "path": "3d model/element/s_f2a_72_80.glb",
                "size": 326340,
                "category": "wall_cabinet"
        },
        {
                "id": "elem_s_f2f_60_60",
                "fileName": "s_f2f_60_60.glb",
                "name": "s_f2f_60_60",
                "path": "3d model/element/s_f2f_60_60.glb",
                "size": 325880,
                "category": "wall_cabinet"
        },
        {
                "id": "elem_s_f2f_72_60",
                "fileName": "s_f2f_72_60.glb",
                "name": "s_f2f_72_60",
                "path": "3d model/element/s_f2f_72_60.glb",
                "size": 339164,
                "category": "wall_cabinet"
        },
        {
                "id": "elem_s_f2f_72_80",
                "fileName": "s_f2f_72_80.glb",
                "name": "s_f2f_72_80",
                "path": "3d model/element/s_f2f_72_80.glb",
                "size": 339128,
                "category": "wall_cabinet"
        },
        {
                "id": "elem_s_f2fau60_80",
                "fileName": "s_f2fau60_80.glb",
                "name": "s_f2fau60_80",
                "path": "3d model/element/s_f2fau60_80.glb",
                "size": 330328,
                "category": "wall_cabinet"
        },
        {
                "id": "elem_s_f2fau_72_60",
                "fileName": "s_f2fau_72_60.glb",
                "name": "s_f2fau_72_60",
                "path": "3d model/element/s_f2fau_72_60.glb",
                "size": 343540,
                "category": "wall_cabinet"
        },
        {
                "id": "elem_s_f2fau_72_80",
                "fileName": "s_f2fau_72_80.glb",
                "name": "s_f2fau_72_80",
                "path": "3d model/element/s_f2fau_72_80.glb",
                "size": 343492,
                "category": "wall_cabinet"
        },
        {
                "id": "elem_s_fny_15",
                "fileName": "s_fny_15.glb",
                "name": "s_fny_15",
                "path": "3d model/element/s_fny_15.glb",
                "size": 271812,
                "category": "wall_cabinet"
        },
        {
                "id": "elem_s_fny_20",
                "fileName": "s_fny_20.glb",
                "name": "s_fny_20",
                "path": "3d model/element/s_fny_20.glb",
                "size": 271812,
                "category": "wall_cabinet"
        },
        {
                "id": "elem_s_fny_25",
                "fileName": "s_fny_25.glb",
                "name": "s_fny_25",
                "path": "3d model/element/s_fny_25.glb",
                "size": 271816,
                "category": "wall_cabinet"
        },
        {
                "id": "elem_s_fny_30",
                "fileName": "s_fny_30.glb",
                "name": "s_fny_30",
                "path": "3d model/element/s_fny_30.glb",
                "size": 271812,
                "category": "wall_cabinet"
        },
        {
                "id": "elem_s_fny_35",
                "fileName": "s_fny_35.glb",
                "name": "s_fny_35",
                "path": "3d model/element/s_fny_35.glb",
                "size": 271816,
                "category": "wall_cabinet"
        },
        {
                "id": "elem_s_fny_40",
                "fileName": "s_fny_40.glb",
                "name": "s_fny_40",
                "path": "3d model/element/s_fny_40.glb",
                "size": 271816,
                "category": "wall_cabinet"
        },
        {
                "id": "elem_s_fs2a_60_60",
                "fileName": "s_fs2a_60_60.glb",
                "name": "s_fs2a_60_60",
                "path": "3d model/element/s_fs2a_60_60.glb",
                "size": 328648,
                "category": "wall_cabinet"
        },
        {
                "id": "elem_s_fs_60_60",
                "fileName": "s_fs_60_60.glb",
                "name": "s_fs_60_60",
                "path": "3d model/element/s_fs_60_60.glb",
                "size": 304092,
                "category": "wall_cabinet"
        },
        {
                "id": "elem_s_fs_72_60",
                "fileName": "s_fs_72_60.glb",
                "name": "s_fs_72_60",
                "path": "3d model/element/s_fs_72_60.glb",
                "size": 305364,
                "category": "wall_cabinet"
        },
        {
                "id": "elem_s_fvz_15",
                "fileName": "s_fvz_15.glb",
                "name": "s_fvz_15",
                "path": "3d model/element/s_fvz_15.glb",
                "size": 270688,
                "category": "wall_cabinet"
        },
        {
                "id": "elem_s_fvz_30",
                "fileName": "s_fvz_30.glb",
                "name": "s_fvz_30",
                "path": "3d model/element/s_fvz_30.glb",
                "size": 270688,
                "category": "wall_cabinet"
        },
        {
                "id": "elem_s_pec_36_60",
                "fileName": "s_pec_36_60.glb",
                "name": "s_pec_36_60",
                "path": "3d model/element/s_pec_36_60.glb",
                "size": 788460,
                "category": "tall_cabinet"
        }
],
    isLoaded: false,
    gltfLoader: null,

    init() {
        if (typeof THREE === 'undefined' || typeof THREE.GLTFLoader === 'undefined') {
            console.warn('ModelManager: THREE vagy THREE.GLTFLoader nem elérhető!');
            return;
        }

        this.gltfLoader = new THREE.GLTFLoader();
        this.loadAllModels();
        this.fetchElementModels();
    },

    /**
     * A 3d model/element mappában található GLB modellek lekérése a szervertől
     */
    async fetchElementModels() {
        if (typeof window !== 'undefined' && window.location.protocol !== 'http:' && window.location.protocol !== 'https:') {
            return this.elementModels;
        }
        try {
            const res = await fetch('/api/elements');
            if (res && res.ok) {
                const data = await res.json();
                if (data && data.success && Array.isArray(data.elements)) {
                    this.elementModels = data.elements;
                    return this.elementModels;
                }
            }
        } catch (e) {
            console.warn('ModelManager: Nem sikerült lekérni a 3d model/element listát a szervertől (offline mód).');
        }

        // Fallback: Ha van beépített vagy ismert modell
        if (!this.elementModels || this.elementModels.length === 0) {
            this.elementModels = [
                {
                    id: 'elem_s_asz3a1f_40',
                    fileName: 's_asz3a1f_40.glb',
                    name: 's_asz3a1f_40',
                    path: '3d model/element/s_asz3a1f_40.glb',
                    size: 604892
                }
            ];
        }
        return this.elementModels;
    },

    /**
     * Kategória automatikus megbecslése a modell nevéből
     */
    guessCategory(name) {
        const n = (name || '').toLowerCase();
        if (n.startsWith('s_asz') || n.includes('also') || n.includes('base') || n.includes('pult') || n.includes('counter') || n.includes('sink')) return 'base_cabinet';
        if (n.startsWith('f_') || n.startsWith('fsz') || n.includes('felso') || n.includes('wall')) return 'wall_cabinet';
        if (n.startsWith('m_') || n.startsWith('msz') || n.includes('magas') || n.includes('tall') || n.includes('kamra')) return 'tall_cabinet';
        if (n.includes('asztal') || n.includes('table') || n.includes('desk')) return 'table';
        if (n.includes('szek') || n.includes('chair') || n.includes('fotel') || n.includes('stool')) return 'chair';
        if (n.includes('fogo') || n.includes('lab') || n.includes('handle') || n.includes('leg') || n.includes('pant') || n.includes('hinge') || n.includes('kiegeszito')) return 'accessory';
        return 'other';
    },

    getCategoryLabel(cat) {
        const labels = {
            'all': 'Összes',
            'base_cabinet': 'Alsó szekrény',
            'wall_cabinet': 'Felső szekrény',
            'tall_cabinet': 'Magas szekrény',
            'table': 'Asztal',
            'chair': 'Szék / Ülőbútor',
            'accessory': 'Kiegészítő',
            'other': 'Egyéb'
        };
        return labels[cat] || 'Egyéb';
    },

    /**
     * Egyedi GLB/GLTF fájl hozzáadása (Fájlfeltöltés vagy tallózás a gépről)
     */
    async uploadElementModel(file) {
        return new Promise((resolve, reject) => {
            if (!file) return reject(new Error('Nincs fájl kiválasztva'));

            const reader = new FileReader();
            reader.onload = async (e) => {
                const dataUrl = e.target.result;
                const blobUrl = URL.createObjectURL(file);
                const safeName = file.name;
                const nameWithoutExt = safeName.replace(/\.(glb|gltf)$/i, '');

                const newElem = {
                    id: 'elem_' + Date.now(),
                    fileName: safeName,
                    name: nameWithoutExt,
                    path: blobUrl,
                    size: file.size,
                    isLocal: true,
                    category: this.guessCategory(nameWithoutExt)
                };

                // Hozzáadás a helyi listához
                this.elementModels = this.elementModels.filter(m => m.fileName !== safeName);
                this.elementModels.unshift(newElem);

                // Megkíséreljük a szerverre is feltölteni ha van aktív backend
                try {
                    const res = await fetch('/api/elements/upload', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            fileName: safeName,
                            data: dataUrl
                        })
                    });
                    if (res && res.ok) {
                        const json = await res.json();
                        if (json && json.success && json.element) {
                            newElem.path = json.element.path;
                            newElem.id = json.element.id;
                        }
                    }
                } catch (err) {
                    console.log('ModelManager: Offline mód, a modell helyi Blob URL-ként használva.');
                }

                resolve(newElem);
            };
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(file);
        });
    },

    /**
     * GLB Modell Elem betöltése a 3D térbe (jelenetbe)
     */
    loadElementToScene(element, boardManager, scene3D, onComplete, onError) {
        if (!this.gltfLoader) {
            this.gltfLoader = new THREE.GLTFLoader();
        }

        let modelUrl = element.path || `3d model/element/${element.fileName}`;

        // Ha van beágyazott Base64 adat (különösen file:/// protokoll esetén a CORS blokkolás kivédésére)
        if (typeof EMBEDDED_MODELS !== 'undefined') {
            const fileName = element.fileName || '';
            const keyWithoutExt = fileName.replace(/\.(glb|gltf)$/i, '');
            if (EMBEDDED_MODELS[fileName]) {
                modelUrl = EMBEDDED_MODELS[fileName];
            } else if (EMBEDDED_MODELS[keyWithoutExt]) {
                modelUrl = EMBEDDED_MODELS[keyWithoutExt];
            } else if (element.id && EMBEDDED_MODELS[element.id]) {
                modelUrl = EMBEDDED_MODELS[element.id];
            }
        }

        this.gltfLoader.load(modelUrl, (gltf) => {
            const rawScene = gltf.scene;

            // 1. Bounding box mérés
            const initialBox = new THREE.Box3().setFromObject(rawScene);
            const initialSize = new THREE.Vector3();
            initialBox.getSize(initialSize);

            // 2. Automatikus skálázás: ha méterben van (< 15 egység), átváltás mm-re (×1000)
            let scaleFactor = 1;
            if (Math.max(initialSize.x, initialSize.y, initialSize.z) < 15) {
                scaleFactor = 1000;
            }
            rawScene.scale.set(scaleFactor, scaleFactor, scaleFactor);

            // Újramérés a skálázott méretekkel
            const scaledBox = new THREE.Box3().setFromObject(rawScene);
            const scaledSize = new THREE.Vector3();
            scaledBox.getSize(scaledSize);

            // 3. Lokális eltolás: talaj Y = 0 síkhoz, és X, Z középponthoz igazítás
            const offX = -(scaledBox.min.x + scaledBox.max.x) / 2;
            const offY = -scaledBox.min.y;
            const offZ = -(scaledBox.min.z + scaledBox.max.z) / 2;
            rawScene.position.set(offX, offY, offZ);

            // 4. Szülő THREE.Group létrehozása
            const modelGroup = new THREE.Group();
            modelGroup.add(rawScene);

            // 5. Melléhelyezés (X pozíció kiszámítása az eddigi bútorok alapján)
            const currentBounds = boardManager.getFurnitureBoundingBox();
            const itemW = Math.round(scaledSize.x) || 600;
            const posX = currentBounds.width > 0 ? (currentBounds.width / 2 + itemW / 2 + 50) : 0;
            modelGroup.position.set(posX, 0, 0);

            // 6. Azonosító és gyermek mesh-ek beállítása
            const elementId = 'model_elem_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
            const elName = element.name || (element.fileName ? element.fileName.replace(/\.glb$/i, '') : '3D Modell Elem');

            rawScene.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.userData = child.userData || {};
                    child.userData.parentGroup = modelGroup;
                    child.userData.corpusId = elementId;
                    if (scene3D.boardMeshes && !scene3D.boardMeshes.includes(child)) {
                        scene3D.boardMeshes.push(child);
                    }
                }
            });

            // 7. Kijelölési kiemelés és körvonal csatolása
            attachHardwareHighlights(modelGroup);

            // 8. userData metaadatok
            modelGroup.userData = {
                id: elementId,
                name: elName,
                isModelElement: true,
                isCorpus: true,
                width: Math.round(scaledSize.x),
                height: Math.round(scaledSize.y),
                depth: Math.round(scaledSize.z),
                x: posX,
                y: 0,
                z: 0,
                rotX: 0,
                rotY: 0,
                rotZ: 0,
                glbFile: element.fileName,
                glbPath: modelUrl
            };

            // 9. Hozzáadás a 3D színtérhez és a korpuszokhoz
            scene3D.scene.add(modelGroup);
            boardManager.corpora.push(modelGroup);

            // 10. Automatikus kijelölés
            scene3D.selectBoard(modelGroup);

            if (onComplete) onComplete(modelGroup);
        }, undefined, (err) => {
            console.error('ModelManager: Hiba a GLB modell betöltésekor:', modelUrl, err);
            const isFileProto = typeof window !== 'undefined' && window.location.protocol === 'file:';
            let errMsg = `Hiba a 3D modell betöltésekor: ${element.fileName || ''}`;
            if (isFileProto && !modelUrl.startsWith('data:') && !modelUrl.startsWith('blob:')) {
                errMsg = `A böngésző CORS védelme miatt file:/// módban nem tölthető be közvetlenül a(z) ${element.fileName || ''}. Indítsd el a python szervert (python server.py), vagy használd a '➕ Fájl' tallózás gombot!`;
            }
            if (onError) onError(new Error(errMsg));
        });
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
        attachHardwareHighlights(group);
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
        attachHardwareHighlights(group);
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

        const linkGeo = new THREE.BoxGeometry(6, 12, 16);
        const linkMesh = new THREE.Mesh(linkGeo, satinArmMat);
        linkMesh.position.set(isLeft ? 4 : -4, 0, -4);
        armGroup.add(linkMesh);

        const adjScrewGeo = new THREE.CylinderGeometry(3.5, 3.5, 2.5, 16);
        const adjScrew = new THREE.Mesh(adjScrewGeo, screwMat);
        adjScrew.position.set(0, 9.2, -26);
        armGroup.add(adjScrew);

        // 4. KORPUSZ OLDALRA SZERELT TALP (Mounting Cross-Plate)
        const plateGroup = new THREE.Group();
        plateGroup.name = 'hinge_plate_group';

        const plateW = 18;
        const plateBaseGeo = new THREE.BoxGeometry(plateW, 37, 2.5);
        const plateBaseMesh = new THREE.Mesh(plateBaseGeo, chromeMat);
        plateBaseMesh.rotation.y = Math.PI / 2;
        plateBaseMesh.position.set(isLeft ? plateW / 2 : -plateW / 2, 0, -24);
        plateGroup.add(plateBaseMesh);

        const plateScrewGeo = new THREE.CylinderGeometry(2.8, 2.8, 2.0, 16);
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
        attachHardwareHighlights(group);
        return group;
    }
};

function attachHardwareHighlights(group) {
    if (!group) return;
    group.traverse(child => {
        if (child.isMesh && child.geometry && child.name !== '__selection_outline__' && child.name !== '__selection_highlight__') {
            const edges = new THREE.EdgesGeometry(child.geometry, 25);
            const lineMat = new THREE.LineBasicMaterial({ color: '#38bdf8', linewidth: 2 });
            const outlineMesh = new THREE.LineSegments(edges, lineMat);
            outlineMesh.name = '__selection_outline__';
            outlineMesh.visible = false;
            outlineMesh.renderOrder = 9998;
            child.add(outlineMesh);
            child.userData.outlineMesh = outlineMesh;

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
            const highlightMesh = new THREE.Mesh(child.geometry, highlightMat);
            highlightMesh.name = '__selection_highlight__';
            highlightMesh.visible = false;
            highlightMesh.renderOrder = 9999;
            child.add(highlightMesh);
            child.userData.highlightMesh = highlightMesh;
        }
    });
}
