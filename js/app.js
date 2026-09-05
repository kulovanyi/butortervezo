/**
 * Fő Alkalmazás Vezérlő (app.js)
 * Összeköti a 3D grafikai motort, a lapkezelőt, az intelligens illesztőt, textúrákat és a bal oldali katalógust.
 */

import { MaterialManager } from './textures.js';
import { Scene3D } from './scene3d.js';
import { BoardManager, createRoundedBoxGeometry, createBoardGeometry } from './boardManager.js';
import { SnapEngine } from './snapEngine.js';
import { CatalogManager } from './catalogManager.js';
import { CutListManager } from './cutListManager.js';
import { PresetFurniture } from './presetFurniture.js';
import { KitchenCorpusGenerator } from './kitchenCorpusGenerator.js';

/**
 * 3D Élőkép és Előnézet kezelő a Konyha Korpusz Varázsló jobb oldalán
 */
export class KitchenPreview3D {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.previewGroup = null;
        this.showWireframe = true;
        this.animationId = null;
        this.currentConfig = null;

        if (this.container) {
            this.init();
        }
    }

    init() {
        const width = this.container.clientWidth || 400;
        const height = this.container.clientHeight || 420;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color('#161922');

        // Camera
        this.camera = new THREE.PerspectiveCamera(40, width / height, 1, 10000);
        this.camera.position.set(1100, 900, 1300);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.15;
        this.container.appendChild(this.renderer.domElement);

        // Controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.minDistance = 300;
        this.controls.maxDistance = 5000;
        this.controls.maxPolarAngle = Math.PI / 2 + 0.1;

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
        dirLight.position.set(1500, 2500, 1800);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        dirLight.shadow.camera.near = 500;
        dirLight.shadow.camera.far = 6000;
        dirLight.shadow.bias = -0.0005;
        this.scene.add(dirLight);

        const fillLight = new THREE.DirectionalLight(0x90b0d0, 0.45);
        fillLight.position.set(-1500, 1000, -1200);
        this.scene.add(fillLight);

        // Grid ground
        const gridHelper = new THREE.GridHelper(2000, 20, '#334155', '#1e293b');
        gridHelper.position.y = 0;
        this.scene.add(gridHelper);

        // Preview group
        this.previewGroup = new THREE.Group();
        this.scene.add(this.previewGroup);

        this.startLoop();
    }

    startLoop() {
        if (this.animationId) return;
        const animate = () => {
            this.animationId = requestAnimationFrame(animate);
            if (this.controls) this.controls.update();
            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
            }
        };
        animate();
    }

    stopLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    resize() {
        if (!this.container || !this.renderer || !this.camera) return;
        const width = this.container.clientWidth || 400;
        const height = this.container.clientHeight || 420;
        if (width <= 0 || height <= 0) return;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    update(config) {
        if (!config || !this.scene) return;
        this.currentConfig = config;

        // Clear existing preview meshes
        while (this.previewGroup.children.length > 0) {
            const child = this.previewGroup.children[0];
            this.previewGroup.remove(child);
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (child.material.map) child.material.map.dispose();
                child.material.dispose();
            }
        }

        const boards = KitchenCorpusGenerator.generateBoards(config);
        const corpusTexKey = config.textureKey || 'white_matte';

        boards.forEach(boardData => {
            const bRadius = boardData.edgeRadius !== undefined ? Number(boardData.edgeRadius) : (boardData.isWorktop ? 3 : (config.edgeRadius || 1));
            const geometry = createBoardGeometry({ ...boardData, edgeRadius: bRadius });
            const texKey = boardData.textureKey || corpusTexKey;
            const material = MaterialManager.createMaterial(texKey);

            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(boardData.x, boardData.y, boardData.z);
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            const edges = new THREE.EdgesGeometry(geometry, 20);
            const lineMat = new THREE.LineBasicMaterial({ color: '#38bdf8', linewidth: 1.5 });
            const outlineMesh = new THREE.LineSegments(edges, lineMat);
            outlineMesh.name = 'outline';
            outlineMesh.visible = this.showWireframe;
            mesh.add(outlineMesh);

            this.previewGroup.add(mesh);
        });

        // Update dimension badge
        const dimsBadge = document.getElementById('preview-dims-badge');
        if (dimsBadge) {
            const totalH = (config.legs?.enabled ? Number(config.legs.height) : 0) + Number(config.height) + (config.worktop?.enabled ? Number(config.worktop.thickness) : 0);
            const wtD = config.worktop?.enabled ? Number(config.worktop.depth) : Number(config.depth);
            dimsBadge.textContent = `${config.width} × ${totalH} × ${wtD} mm`;
        }
    }

    resetCamera() {
        if (!this.camera || !this.controls || !this.previewGroup) return;
        const box = new THREE.Box3().setFromObject(this.previewGroup);
        const center = new THREE.Vector3();
        box.getCenter(center);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z, 500);

        this.controls.target.copy(center);
        this.camera.position.set(center.x + maxDim * 1.3, center.y + maxDim * 0.9, center.z + maxDim * 1.6);
        this.controls.update();
    }

    toggleWireframe() {
        this.showWireframe = !this.showWireframe;
        this.previewGroup.traverse(child => {
            if (child.name === 'outline') {
                child.visible = this.showWireframe;
            }
        });
        const btn = document.getElementById('btn-preview-wireframe');
        if (btn) {
            btn.classList.toggle('active', this.showWireframe);
        }
    }
}

class FurnitureApp {
    constructor() {
        this.scene3D = null;
        this.boardManager = null;
        this.snapEngine = null;
        this.catalogManager = null;
        this.cutListManager = null;
        this.kitchenPreview = null;
        this.selectedBoard = null;
        this.selectedCorpus = null;
        this.editingCorpusId = null;
        this.previewCorpus = null;
        this.newCorpusOffsetX = 0;
        this.kitchenBackupConfig = null;
        this.kitchenBackupBoards = null;
        this.savingTarget = null;
        this.applyTextureTarget = 'selected'; // 'selected' vagy 'all'
        this.kitchenElements = [];
        this.expandedCategories = new Set(['cat_kitchen', 'cat_living']);

        this.init();
    }

    init() {
        // 1. Textúrák előkészítése
        MaterialManager.init();

        // 2. 3D Jelenet inicializálása
        const canvasContainer = document.getElementById('canvas-container');
        this.scene3D = new Scene3D(
            canvasContainer,
            (selectedTarget) => this.onBoardSelected(selectedTarget),
            (transformedTarget) => this.onBoardTransformed(transformedTarget),
            (bubbleData) => this.onFloatingBubbleUpdate(bubbleData)
        );

        // 3. Modulok példányosítása
        this.boardManager = new BoardManager(this.scene3D);
        this.scene3D.setBoardManager(this.boardManager);
        this.snapEngine = new SnapEngine(this.boardManager, this.scene3D);
        this.catalogManager = new CatalogManager(
            this.boardManager,
            this.scene3D,
            () => this.renderCatalogUI()
        );
        this.cutListManager = new CutListManager(this.boardManager);

        // 4. Konyha Varázsló Élőkép 3D inicializálása
        this.kitchenPreview = new KitchenPreview3D('kitchen-preview-3d-container');

        // 5. UI Események feliratkozása
        this.bindUIEvents();
        this.renderTextureGrid();
        this.renderCatalogUI();
        this.updateDimensionsBadge();

        // 6. Ha a katalógus üres, töltsük be a beépített mintákat
        this.initPresetCatalog();

        // Tiszta, üres 3D munkatérrel indulunk (nem töltünk be alapmodellt)
        this.renderHierarchyTree();
    }

    /**
     * Kezdő mintabútorok feltöltése a katalógusba, ha még nincs egy sem
     */
    initPresetCatalog() {
        if (this.catalogManager.items.length === 0) {
            PresetFurniture.forEach(preset => {
                this.catalogManager.items.push({
                    id: preset.id,
                    name: preset.name,
                    categoryId: preset.categoryId,
                    description: preset.description,
                    dimensions: preset.dimensions,
                    boardCount: preset.boards.length,
                    thumbnail: '', // rendereléskor vagy betöltéskor frissül
                    boards: preset.boards,
                    createdAt: new Date().toISOString()
                });
            });
            this.catalogManager.saveItemsToStorage();
            this.renderCatalogUI();
        }
    }

    loadInitialFurniture() {
        const defaultPreset = PresetFurniture[0];
        if (defaultPreset) {
            this.boardManager.fromJSON(defaultPreset.boards, true);
            this.updateDimensionsBadge();
            this.renderHierarchyTree();
            this.updateSnapTargetDropdown();
        }
    }

    // ==========================================
    // UI ÉS ESEMÉNYKEZELŐK KÖTÉSE (BINDINGS)
    // ==========================================

    bindUIEvents() {
        // --- Fejléc gombok ---
        document.getElementById('btn-new-project').addEventListener('click', () => {
            if (confirm('Biztosan új projektet kezdesz? A nem mentett bútorlapok törlődnek.')) {
                this.boardManager.clearAll();
                this.onBoardSelected(null);
                this.updateDimensionsBadge();
                this.renderHierarchyTree();
                this.updateSnapTargetDropdown();
            }
        });

        document.getElementById('preset-selector').addEventListener('change', (e) => {
            const presetId = e.target.value;
            if (!presetId) return;
            const preset = PresetFurniture.find(p => p.id === presetId);
            if (preset) {
                const currentBounds = this.boardManager.getFurnitureBoundingBox();
                const presetW = (preset.dimensions && preset.dimensions.w) || 600;
                const offsetX = currentBounds.width > 0 ? (currentBounds.width / 2 + presetW / 2 + 100) : 0;
                const shiftedBoards = preset.boards.map(b => ({
                    ...b,
                    x: (b.x || 0) + offsetX
                }));
                this.boardManager.fromJSON(shiftedBoards, false);
                this.updateDimensionsBadge();
                this.renderHierarchyTree();
                this.updateSnapTargetDropdown();
            }
            e.target.value = '';
        });

        document.getElementById('btn-save-to-catalog').addEventListener('click', () => {
            this.openSaveFurnitureModal();
        });

        document.getElementById('btn-open-cutlist').addEventListener('click', () => {
            this.openCutListModal();
        });

        document.getElementById('btn-take-screenshot').addEventListener('click', () => {
            const snap = this.scene3D.getSnapshot(1920, 1080);
            const a = document.createElement('a');
            a.href = snap;
            a.download = `butorterv_${Date.now()}.jpg`;
            a.click();
        });

        document.getElementById('btn-export-json').addEventListener('click', () => {
            const data = {
                name: '3D Bútor Terv',
                exportedAt: new Date().toISOString(),
                dimensions: this.boardManager.getFurnitureBoundingBox(),
                boards: this.boardManager.toJSON()
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `butor_terv_${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });

        document.getElementById('input-import-json').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    const boardsData = data.boards || data;
                    const currentBounds = this.boardManager.getFurnitureBoundingBox();
                    const offsetX = currentBounds.width > 0 ? (currentBounds.width / 2 + 300) : 0;
                    
                    if (offsetX > 0) {
                        if (Array.isArray(boardsData)) {
                            const shifted = boardsData.map(b => ({ ...b, x: (b.x || 0) + offsetX }));
                            this.boardManager.fromJSON(shifted, false);
                        } else if (typeof boardsData === 'object') {
                            const shifted = {
                                corpora: (boardsData.corpora || []).map(c => ({ ...c, x: (c.x || 0) + offsetX })),
                                boards: (boardsData.boards || []).map(b => ({ ...b, x: (b.x || 0) + offsetX }))
                            };
                            this.boardManager.fromJSON(shifted, false);
                        }
                    } else {
                        this.boardManager.fromJSON(boardsData, false);
                    }
                    this.updateDimensionsBadge();
                    this.renderHierarchyTree();
                    this.updateSnapTargetDropdown();
                    alert('Bútorterv sikeresen hozzáadva a jelenethez!');
                } catch (err) {
                    alert('Hiba a fájl betöltésekor: ' + err.message);
                }
            };
            reader.readAsText(file);
            e.target.value = '';
        });

        // --- Bal oldali Tabok váltása ---
        document.querySelectorAll('.sidebar-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.sidebar-tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.sidebar-content').forEach(c => c.style.display = 'none');

                btn.classList.add('active');
                const targetTabId = btn.getAttribute('data-tab');
                const targetContent = document.getElementById(targetTabId);
                if (targetContent) targetContent.style.display = 'flex';

                if (targetTabId === 'tree-tab') {
                    this.renderHierarchyTree();
                }
            });
        });

        // --- Új kategória gomb ---
        document.getElementById('btn-add-category-modal').addEventListener('click', () => {
            this.openModal('modal-add-category');
        });

        document.getElementById('btn-quick-new-category').addEventListener('click', () => {
            this.openModal('modal-add-category');
        });

        document.getElementById('btn-confirm-add-category').addEventListener('click', () => {
            const name = document.getElementById('new-category-name').value;
            const color = document.getElementById('new-category-color').value;
            if (!name || name.trim() === '') {
                alert('Kérlek add meg a kategória nevét!');
                return;
            }
            const newCat = this.catalogManager.addCategory(name, color);
            if (newCat) {
                this.expandedCategories.add(newCat.id);
            }
            document.getElementById('new-category-name').value = '';
            this.closeModal('modal-add-category');
            this.populateSaveCategoryDropdown();
        });

        document.getElementById('new-category-color').addEventListener('input', (e) => {
            document.getElementById('new-category-color-text').value = e.target.value;
        });

        // --- Keresőmező a katalógusban ---
        document.getElementById('catalog-search-input').addEventListener('input', (e) => {
            this.catalogManager.searchQuery = e.target.value;
            this.renderCatalogUI();
        });

        // --- Katalógus Export / Import ---
        document.getElementById('btn-export-catalog').addEventListener('click', () => {
            this.catalogManager.exportCatalogJSON();
        });

        document.getElementById('input-import-catalog').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.catalogManager.importCatalogJSON(file).then(() => {
                    alert('Katalógus sikeresen importálva!');
                }).catch(err => {
                    alert('Hiba az importálás során: ' + err.message);
                });
            }
            e.target.value = '';
        });

        // --- 3D Lebegő vezérlők (Gizmo & Nézőpontok) ---
        document.getElementById('gizmo-translate-btn').addEventListener('click', (e) => {
            document.getElementById('gizmo-translate-btn').classList.add('active');
            document.getElementById('gizmo-rotate-btn').classList.remove('active');
            this.scene3D.setGizmoMode('translate');
        });

        document.getElementById('gizmo-rotate-btn').addEventListener('click', (e) => {
            document.getElementById('gizmo-rotate-btn').classList.add('active');
            document.getElementById('gizmo-translate-btn').classList.remove('active');
            this.scene3D.setGizmoMode('rotate');
        });

        document.getElementById('gizmo-snap-select').addEventListener('change', (e) => {
            this.scene3D.setGizmoSnap(Number(e.target.value));
        });

        const magneticSnapSelect = document.getElementById('magnetic-snap-select');
        if (magneticSnapSelect) {
            magneticSnapSelect.addEventListener('change', (e) => {
                this.scene3D.setMagneticSnap(Number(e.target.value));
            });
        }

        document.querySelectorAll('.viewport-view-modes button').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.viewport-view-modes button').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.scene3D.setCameraView(btn.getAttribute('data-view'));
            });
        });

        // --- Robbantott nézet csúszka ---
        const explodeSlider = document.getElementById('exploded-slider');
        explodeSlider.addEventListener('input', (e) => {
            const val = Number(e.target.value);
            document.getElementById('exploded-val').textContent = `${val}%`;
            this.boardManager.setExplodedView(val / 100);
        });

        // --- Új bútorlap hozzáadása gombok ---
        document.querySelectorAll('.btn-add-preset').forEach(btn => {
            btn.addEventListener('click', () => {
                const presetType = btn.getAttribute('data-preset');
                const bounds = this.boardManager.getFurnitureBoundingBox();
                const mainDims = {
                    w: bounds.width > 0 ? bounds.width : 600,
                    h: bounds.height > 0 ? bounds.height : 800,
                    d: bounds.depth > 0 ? bounds.depth : 400,
                    th: 18
                };
                const newBoard = this.boardManager.createBoardFromPreset(presetType, mainDims);
                this.scene3D.selectBoard(newBoard.mesh);
                this.updateDimensionsBadge();
                this.renderHierarchyTree();
                this.updateSnapTargetDropdown();
            });
        });

        document.getElementById('btn-add-custom-board').addEventListener('click', () => {
            const newBoard = this.boardManager.createBoard({
                name: `Egyedi Lap ${this.boardManager.boardCounter}`,
                width: 500,
                height: 18,
                depth: 350,
                thickness: 18
            });
            this.scene3D.selectBoard(newBoard.mesh);
            this.updateDimensionsBadge();
            this.renderHierarchyTree();
            this.updateSnapTargetDropdown();
        });

        // --- Kijelölt lap tulajdonságainak módosítása (Form) ---
        const propInputs = ['prop-name', 'prop-width', 'prop-height', 'prop-depth', 'prop-pos-x', 'prop-pos-y', 'prop-pos-z', 'prop-rot-x', 'prop-rot-y', 'prop-rot-z', 'prop-edge-radius', 'prop-edgebanding'];
        propInputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', () => this.applyPropertiesFormToBoard());
            }
        });

        // Gyors vastagság gombok (18, 19, 28, 38, 3 mm)
        document.querySelectorAll('.btn-quick-th').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!this.selectedBoard) return;
                const th = Number(btn.getAttribute('data-th'));
                document.getElementById('prop-height').value = th;
                this.applyPropertiesFormToBoard();
            });
        });

        // Kijelölt lap duplikálása / törlése
        document.getElementById('btn-duplicate-board').addEventListener('click', () => {
            if (this.selectedBoard) {
                const copy = this.boardManager.duplicateBoard(this.selectedBoard.id);
                this.updateDimensionsBadge();
                this.renderHierarchyTree();
                this.updateSnapTargetDropdown();
            }
        });

        document.getElementById('btn-duplicate-selected-tree').addEventListener('click', () => {
            if (this.selectedBoard) {
                this.boardManager.duplicateBoard(this.selectedBoard.id);
                this.updateDimensionsBadge();
                this.renderHierarchyTree();
                this.updateSnapTargetDropdown();
            } else if (this.selectedCorpus) {
                this.boardManager.duplicateCorpus(this.selectedCorpus.userData.id);
                this.updateDimensionsBadge();
                this.renderHierarchyTree();
                this.updateSnapTargetDropdown();
            }
        });

        document.getElementById('btn-delete-board').addEventListener('click', () => {
            if (this.selectedBoard) {
                this.boardManager.deleteBoard(this.selectedBoard.id);
                this.updateDimensionsBadge();
                this.renderHierarchyTree();
                this.updateSnapTargetDropdown();
            }
        });

        // --- Kijelölt Korpusz Egység Kezelése (Buborék & Jobb sáv) ---
        const btnBubbleEdit = document.getElementById('btn-bubble-edit-corpus');
        if (btnBubbleEdit) {
            btnBubbleEdit.addEventListener('click', () => {
                const target = this.selectedCorpus || (this.scene3D.selectedTarget && this.scene3D.selectedTarget.userData && this.scene3D.selectedTarget.userData.isCorpus ? this.scene3D.selectedTarget : null);
                if (target) {
                    this.openKitchenWizardForCorpus(target);
                }
            });
        }

        const btnEditCorpus = document.getElementById('btn-edit-corpus-in-wizard');
        if (btnEditCorpus) {
            btnEditCorpus.addEventListener('click', () => {
                if (this.selectedCorpus) {
                    this.openKitchenWizardForCorpus(this.selectedCorpus);
                }
            });
        }

        const btnDupCorpus = document.getElementById('btn-duplicate-corpus');
        if (btnDupCorpus) {
            btnDupCorpus.addEventListener('click', () => {
                if (this.selectedCorpus) {
                    this.boardManager.duplicateCorpus(this.selectedCorpus.userData.id);
                    this.updateDimensionsBadge();
                    this.renderHierarchyTree();
                    this.updateSnapTargetDropdown();
                }
            });
        }

        const btnDelCorpus = document.getElementById('btn-delete-corpus');
        if (btnDelCorpus) {
            btnDelCorpus.addEventListener('click', () => {
                if (this.selectedCorpus) {
                    this.boardManager.deleteCorpus(this.selectedCorpus.userData.id);
                    this.onBoardSelected(null);
                    this.updateDimensionsBadge();
                    this.renderHierarchyTree();
                    this.updateSnapTargetDropdown();
                }
            });
        }

        // --- Intelligens Illesztés & Igazítás Gombok ---
        document.querySelectorAll('[data-snap]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!this.selectedBoard) {
                    alert('Először jelölj ki egy bútorlapot a 3D térben!');
                    return;
                }
                const targetId = document.getElementById('snap-target-select').value;
                if (!targetId) {
                    alert('Kérlek válassz ki egy referencia bútorlapot a listából!');
                    return;
                }
                const relation = btn.getAttribute('data-snap');
                const gap = Number(document.getElementById('snap-gap-input').value) || 0;
                this.snapEngine.snapToBoard(this.selectedBoard.id, targetId, relation, gap);
                this.updatePropertiesForm(this.selectedBoard);
                this.updateDimensionsBadge();
            });
        });

        document.querySelectorAll('[data-align]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!this.selectedBoard) {
                    alert('Először jelölj ki egy bútorlapot a 3D térben!');
                    return;
                }
                const targetId = document.getElementById('snap-target-select').value;
                if (!targetId) {
                    alert('Kérlek válassz ki egy referencia bútorlapot a listából!');
                    return;
                }
                const alignAxis = btn.getAttribute('data-align');
                this.snapEngine.alignBoards(this.selectedBoard.id, targetId, alignAxis);
                this.updatePropertiesForm(this.selectedBoard);
                this.updateDimensionsBadge();
            });
        });

        // Automatikus polc illesztés két oldalfal közé
        document.getElementById('btn-fit-shelf-between').addEventListener('click', () => {
            const verticalBoards = this.boardManager.boards.filter(b => b.height > b.width && b.height > b.depth);
            if (verticalBoards.length < 2) {
                alert('Legalább 2 függőleges oldalfalra van szükség az automatikus polchoz!');
                return;
            }
            const b1 = verticalBoards[0];
            const b2 = verticalBoards[1];
            const shelf = this.snapEngine.fitShelfBetween(b1.id, b2.id);
            if (shelf) {
                this.scene3D.selectBoard(shelf.mesh);
                this.updateDimensionsBadge();
                this.renderHierarchyTree();
                this.updateSnapTargetDropdown();
            }
        });

        // --- Textúra alkalmazás célpont gombok ---
        document.getElementById('btn-apply-tex-selected').addEventListener('click', () => {
            this.applyTextureTarget = 'selected';
            document.getElementById('btn-apply-tex-selected').classList.add('btn-primary');
            document.getElementById('btn-apply-tex-all').classList.remove('btn-primary');
        });

        document.getElementById('btn-apply-tex-all').addEventListener('click', () => {
            this.applyTextureTarget = 'all';
            document.getElementById('btn-apply-tex-all').classList.add('btn-primary');
            document.getElementById('btn-apply-tex-selected').classList.remove('btn-primary');
        });

        // Egyéni textúra fájl feltöltése
        document.getElementById('input-custom-texture').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            MaterialManager.loadCustomImage(file).then(customTex => {
                this.renderTextureGrid();
                this.applyTexture(customTex.id);
            }).catch(err => {
                alert('Hiba a kép betöltésekor: ' + err.message);
            });
            e.target.value = '';
        });

        // --- Mentés Katalógusba Modal Események ---
        document.getElementById('btn-confirm-save-furniture').addEventListener('click', () => {
            const name = document.getElementById('save-furniture-name').value;
            const categoryId = document.getElementById('save-furniture-category').value;
            const desc = document.getElementById('save-furniture-desc').value;

            if (!name || name.trim() === '') {
                alert('Kérlek add meg a bútor nevét!');
                return;
            }

            const item = this.savingTarget ? 
                this.catalogManager.saveSelectedToCatalog(this.savingTarget, name, categoryId, desc) :
                this.catalogManager.saveCurrentFurnitureToCatalog(name, categoryId, desc);

            if (item) {
                if (categoryId) {
                    this.expandedCategories.add(categoryId);
                }
                this.closeModal('modal-save-furniture');
                this.renderCatalogUI();
                alert(`"${item.name}" sikeresen elmentve a katalógusba!`);
            }
        });

        // --- Konyha Korpusz Varázsló Események (Élőkép & Dinamikus Munkalap kalkuláció) ---
        const openKitchenModal = () => {
            this.editingCorpusId = null;
            this.kitchenBackupConfig = null;
            this.kitchenElements = []; // Alapértelmezésben üres, front nélküli tiszta korpusz
            this.renderKitchenElementsUI();

            // Számítsuk ki a helyét a meglévő bútorok mellett X eltolással
            const currentBounds = this.boardManager.getFurnitureBoundingBox();
            const initialW = Number(document.getElementById('kc-width').value) || 600;
            this.newCorpusOffsetX = currentBounds.width > 0 ? (currentBounds.width / 2 + initialW / 2 + 80) : 0;

            const modalTitle = document.querySelector('#modal-kitchen-generator .modal-title');
            if (modalTitle) modalTitle.innerHTML = '🍳 Konyha Elem Tervező Varázsló';

            const btnConfirm = document.getElementById('btn-confirm-kitchen');
            if (btnConfirm) btnConfirm.innerHTML = '➕ Konyha Elem Hozzáadása';

            this.openModal('modal-kitchen-generator');
            this.syncKitchenWorktopMath();

            // Új előnézeti korpusz azonnali létrehozása a jelenetben
            const config = this.getKitchenConfigFromUI();
            this.previewCorpus = this.boardManager.createCorpus(config, this.newCorpusOffsetX, 0, 0);
            this.scene3D.selectBoard(this.previewCorpus);
            this.updateDimensionsBadge();
            this.renderHierarchyTree();

            setTimeout(() => {
                if (this.kitchenPreview) {
                    this.kitchenPreview.resize();
                    this.kitchenPreview.update(config);
                    this.kitchenPreview.resetCamera();
                }
            }, 60);
        };

        const btnKitchenTop = document.getElementById('btn-kitchen-wizard');
        if (btnKitchenTop) btnKitchenTop.addEventListener('click', openKitchenModal);

        const btnKitchenSide = document.getElementById('btn-sidebar-kitchen-wizard');
        if (btnKitchenSide) btnKitchenSide.addEventListener('click', openKitchenModal);

        // Dinamikus Front Elem Hozzáadás Gombok (Ajtó, Fiók, Sütő)
        const btnAddDoor = document.getElementById('btn-kc-add-door');
        if (btnAddDoor) {
            btnAddDoor.addEventListener('click', () => {
                this.addKitchenElement('door');
            });
        }

        const btnAddDrawer = document.getElementById('btn-kc-add-drawer');
        if (btnAddDrawer) {
            btnAddDrawer.addEventListener('click', () => {
                this.addKitchenElement('drawer');
            });
        }

        const btnAddOven = document.getElementById('btn-kc-add-oven');
        if (btnAddOven) {
            btnAddOven.addEventListener('click', () => {
                this.addKitchenElement('oven');
            });
        }

        // Varázsló Élőkép Kamera & Wireframe Gombok
        const btnResetPreviewCam = document.getElementById('btn-preview-reset-cam');
        if (btnResetPreviewCam) {
            btnResetPreviewCam.addEventListener('click', () => {
                if (this.kitchenPreview) this.kitchenPreview.resetCamera();
            });
        }

        const btnWireframePreview = document.getElementById('btn-preview-wireframe');
        if (btnWireframePreview) {
            btnWireframePreview.addEventListener('click', () => {
                if (this.kitchenPreview) this.kitchenPreview.toggleWireframe();
            });
        }
        // Konyha típus / preset gombok (Alsó, Felső, Magas)
        document.querySelectorAll('.kc-preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.kc-preset-btn').forEach(b => b.classList.remove('btn-primary'));
                btn.classList.add('btn-primary');
                const type = btn.getAttribute('data-type');
                this.applyKitchenTypePreset(type);
                this.syncKitchenWorktopMath();
                this.updateKitchenLivePreview();
            });
        });

        // Gyors méret gombok a konyha varázslóban
        document.querySelectorAll('.btn-kc-w').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('kc-width').value = btn.getAttribute('data-val');
                this.updateKitchenLivePreview();
            });
        });
        document.querySelectorAll('.btn-kc-h').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('kc-height').value = btn.getAttribute('data-val');
                this.updateKitchenLivePreview();
            });
        });
        document.querySelectorAll('.btn-kc-d').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('kc-depth').value = btn.getAttribute('data-val');
                this.syncKitchenWorktopMath();
                this.updateKitchenLivePreview();
            });
        });

        // Felső rész típus váltás (összekötő lécek vs teljes tető)
        document.getElementById('kc-top-type').addEventListener('change', (e) => {
            const isStretchers = e.target.value === 'stretchers';
            document.getElementById('kc-stretchers-settings').style.display = isStretchers ? 'block' : 'none';
            this.updateKitchenLivePreview();
        });

        // Hátfal típus váltás (rászegelt vs nútba süllyesztett)
        document.getElementById('kc-back-type').addEventListener('change', (e) => {
            const isSurface = e.target.value === 'surface';
            const insetContainer = document.getElementById('kc-back-inset-container');
            const surfaceNotice = document.getElementById('kc-back-surface-notice');
            if (insetContainer) insetContainer.style.display = isSurface ? 'none' : 'block';
            if (surfaceNotice) surfaceNotice.style.display = isSurface ? 'block' : 'none';
            this.updateKitchenLivePreview();
        });

        // Munkalap mélység & túllógás változások
        document.getElementById('kc-worktop-depth').addEventListener('input', () => {
            this.syncKitchenWorktopMath('depth');
            this.updateKitchenLivePreview();
        });

        document.getElementById('kc-worktop-overhang-front').addEventListener('input', () => {
            this.syncKitchenWorktopMath('front');
            this.updateKitchenLivePreview();
        });

        document.getElementById('kc-worktop-overhang-back').addEventListener('input', () => {
            this.syncKitchenWorktopMath('back');
            this.updateKitchenLivePreview();
        });

        // Minden egyéb űrlapmező változására azonnali 3D Élőkép frissítés
        const kitchenInputs = document.querySelectorAll('#modal-kitchen-generator input, #modal-kitchen-generator select');
        kitchenInputs.forEach(input => {
            input.addEventListener('input', () => {
                this.updateKitchenLivePreview();
            });
            input.addEventListener('change', () => {
                this.updateKitchenLivePreview();
            });
        });

        // Konyha generálás / Mentés jóváhagyása
        const btnConfirmKitchen = document.getElementById('btn-confirm-kitchen');
        if (btnConfirmKitchen) {
            btnConfirmKitchen.addEventListener('click', () => {
                this.generateKitchenCorpus();
            });
        }

        // --- Szabászat (CutList) Események ---
        const btnRecalcCutlist = document.getElementById('btn-recalc-cutlist');
        if (btnRecalcCutlist) {
            btnRecalcCutlist.addEventListener('click', () => {
                this.updateCutListUI();
            });
        }

        const btnExportCutlistCsv = document.getElementById('btn-export-cutlist-csv');
        if (btnExportCutlistCsv) {
            btnExportCutlistCsv.addEventListener('click', () => {
                this.cutListManager.exportCSV();
            });
        }

        const btnPrintCutlist = document.getElementById('btn-print-cutlist');
        if (btnPrintCutlist) {
            btnPrintCutlist.addEventListener('click', () => {
                this.cutListManager.printCutList();
            });
        }

        // Modal bezáró gombok (X és Mégse)
        document.querySelectorAll('.btn-close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                const modalId = btn.getAttribute('data-modal');
                if (modalId === 'modal-kitchen-generator') {
                    if (this.editingCorpusId && this.kitchenBackupConfig) {
                        this.boardManager.updateCorpus(this.editingCorpusId, this.kitchenBackupConfig);
                        this.editingCorpusId = null;
                        this.kitchenBackupConfig = null;
                    } else if (this.previewCorpus) {
                        this.boardManager.deleteCorpus(this.previewCorpus.userData.id);
                        this.previewCorpus = null;
                        this.onBoardSelected(null);
                    }
                    this.updateDimensionsBadge();
                    this.renderHierarchyTree();
                }
                this.closeModal(modalId);
            });
        });

        // Modal kattintás kívül
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.classList.remove('open');
                }
            });
        });

        // Billentyűparancsok (Delete = törlés, W = Translate, E = Rotate)
        window.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
                return; // Űrlapmezőkben ne váltson
            }
            // Ha a jobb egérgomb le van nyomva (Unreal fly navigáció), a WASD a kamerát mozgatja
            if (this.scene3D && this.scene3D.isRMBDown) {
                return;
            }
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (this.selectedBoard) {
                    this.boardManager.deleteBoard(this.selectedBoard.id);
                    this.updateDimensionsBadge();
                    this.renderHierarchyTree();
                    this.updateSnapTargetDropdown();
                }
            } else if (e.key === 'w' || e.key === 'W') {
                document.getElementById('gizmo-translate-btn').click();
            } else if (e.key === 'e' || e.key === 'E') {
                document.getElementById('gizmo-rotate-btn').click();
            } else if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                if (this.selectedBoard) {
                    this.boardManager.duplicateBoard(this.selectedBoard.id);
                    this.updateDimensionsBadge();
                    this.renderHierarchyTree();
                    this.updateSnapTargetDropdown();
                }
            }
        });
    }

    // ==========================================
    // SELECTION, LEBEGŐ BUBORÉK ÉS FORM SZINKRONIZÁCIÓ
    // ==========================================

    onFloatingBubbleUpdate(data) {
        const bubble = document.getElementById('floating-corpus-bubble');
        if (!bubble) return;

        if (data && data.visible && data.corpusData) {
            bubble.style.display = 'flex';
            bubble.style.left = `${Math.round(data.x)}px`;
            bubble.style.top = `${Math.round(data.y)}px`;

            const titleEl = document.getElementById('bubble-corpus-title');
            const dimsEl = document.getElementById('bubble-corpus-dims');
            if (titleEl) titleEl.textContent = data.corpusData.name || 'Konyha Korpusz';
            if (dimsEl) dimsEl.textContent = `${data.corpusData.width} × ${data.corpusData.height} × ${data.corpusData.depth} mm`;
        } else {
            bubble.style.display = 'none';
        }
    }

    onBoardSelected(target) {
        const corpusPanel = document.getElementById('corpus-properties-panel');
        const boardPanel = document.getElementById('board-properties-panel');
        const noBoardMsg = document.getElementById('no-board-selected-msg');
        const boardForm = document.getElementById('board-selected-form');

        if (!target) {
            this.selectedBoard = null;
            this.selectedCorpus = null;
            if (corpusPanel) corpusPanel.style.display = 'none';
            if (boardPanel) boardPanel.style.display = 'block';
            if (noBoardMsg) noBoardMsg.style.display = 'block';
            if (boardForm) boardForm.style.display = 'none';
            this.highlightHierarchyItem(null);
            return;
        }

        // Ha Konyha Korpusz egység (THREE.Group)
        if (target.userData && target.userData.isCorpus) {
            this.selectedBoard = null;
            this.selectedCorpus = target;

            if (corpusPanel) corpusPanel.style.display = 'block';
            if (boardPanel) boardPanel.style.display = 'none';

            const nameEl = document.getElementById('corpus-prop-name');
            const dimsEl = document.getElementById('corpus-prop-dims');
            if (nameEl) nameEl.textContent = target.userData.name || 'Konyha Korpusz';
            if (dimsEl) dimsEl.textContent = `${target.userData.width} × ${target.userData.height} × ${target.userData.depth} mm`;

            this.highlightHierarchyItem(target.userData.id);
            this.updateSnapTargetDropdown();
            return;
        }

        // Ha egyedi bútorlap (THREE.Mesh)
        const board = this.boardManager.boards.find(b => b.mesh === target);
        if (board) {
            this.selectedBoard = board;
            this.selectedCorpus = null;

            if (corpusPanel) corpusPanel.style.display = 'none';
            if (boardPanel) boardPanel.style.display = 'block';
            if (noBoardMsg) noBoardMsg.style.display = 'none';
            if (boardForm) boardForm.style.display = 'block';

            this.updatePropertiesForm(board);
            this.highlightHierarchyItem(board.id);
            this.updateSnapTargetDropdown();
        }
    }

    onBoardTransformed(target) {
        if (this.selectedBoard && this.selectedBoard.mesh === target) {
            this.updatePropertiesForm(this.selectedBoard);
            this.updateDimensionsBadge();
        } else if (this.selectedCorpus && this.selectedCorpus === target) {
            this.updateDimensionsBadge();
        }
    }

    openKitchenWizardForCorpus(corpusGroup) {
        if (!corpusGroup || !corpusGroup.userData) return;
        this.editingCorpusId = corpusGroup.userData.id;
        this.previewCorpus = null;
        this.kitchenBackupConfig = JSON.parse(JSON.stringify(corpusGroup.userData.config));

        this.populateKitchenWizardForm(corpusGroup.userData.config);

        const modalTitle = document.querySelector('#modal-kitchen-generator .modal-title');
        if (modalTitle) modalTitle.innerHTML = '✏️ Konyha Elem Módosítása';

        const btnConfirm = document.getElementById('btn-confirm-kitchen');
        if (btnConfirm) btnConfirm.innerHTML = '💾 Módosítás Mentése';

        this.openModal('modal-kitchen-generator');
        this.syncKitchenWorktopMath();

        setTimeout(() => {
            if (this.kitchenPreview) {
                this.kitchenPreview.resize();
                this.kitchenPreview.update(corpusGroup.userData.config);
                this.kitchenPreview.resetCamera();
            }
        }, 60);
    }

    populateKitchenWizardForm(config) {
        if (!config) return;

        if (config.width !== undefined) document.getElementById('kc-width').value = config.width;
        if (config.height !== undefined) document.getElementById('kc-height').value = config.height;
        if (config.depth !== undefined) document.getElementById('kc-depth').value = config.depth;
        if (config.thickness !== undefined) document.getElementById('kc-thickness').value = config.thickness;
        if (config.textureKey !== undefined) document.getElementById('kc-texture').value = config.textureKey;
        if (config.edgeRadius !== undefined) document.getElementById('kc-edge-radius').value = config.edgeRadius;

        if (config.topType !== undefined) {
            document.getElementById('kc-top-type').value = config.topType;
            const stretchersDiv = document.getElementById('kc-stretchers-settings');
            if (stretchersDiv) {
                stretchersDiv.style.display = config.topType === 'stretchers' ? 'block' : 'none';
            }
        }

        if (config.frontStretcher) {
            document.getElementById('kc-fs-enabled').checked = !!config.frontStretcher.enabled;
            if (config.frontStretcher.width !== undefined) document.getElementById('kc-fs-width').value = config.frontStretcher.width;
            if (config.frontStretcher.orientation !== undefined) document.getElementById('kc-fs-orient').value = config.frontStretcher.orientation;
            if (config.frontStretcher.insetFront !== undefined) document.getElementById('kc-fs-inset').value = config.frontStretcher.insetFront;
        }

        if (config.backStretcher) {
            document.getElementById('kc-bs-enabled').checked = !!config.backStretcher.enabled;
            if (config.backStretcher.width !== undefined) document.getElementById('kc-bs-width').value = config.backStretcher.width;
            if (config.backStretcher.orientation !== undefined) document.getElementById('kc-bs-orient').value = config.backStretcher.orientation;
            if (config.backStretcher.insetBack !== undefined) document.getElementById('kc-bs-inset').value = config.backStretcher.insetBack;
        }

        if (config.backPanel) {
            document.getElementById('kc-back-enabled').checked = !!config.backPanel.enabled;
            if (config.backPanel.type !== undefined) {
                document.getElementById('kc-back-type').value = config.backPanel.type;
                const isSurface = config.backPanel.type === 'surface';
                const insetContainer = document.getElementById('kc-back-inset-container');
                const surfaceNotice = document.getElementById('kc-back-surface-notice');
                if (insetContainer) insetContainer.style.display = isSurface ? 'none' : 'block';
                if (surfaceNotice) surfaceNotice.style.display = isSurface ? 'block' : 'none';
            }
            if (config.backPanel.thickness !== undefined) document.getElementById('kc-back-th').value = config.backPanel.thickness;
            if (config.backPanel.insetBack !== undefined) document.getElementById('kc-back-inset').value = config.backPanel.insetBack;
        }

        if (config.legs) {
            document.getElementById('kc-legs-enabled').checked = !!config.legs.enabled;
            if (config.legs.height !== undefined) document.getElementById('kc-legs-height').value = config.legs.height;
        }

        if (config.plinth) {
            document.getElementById('kc-plinth-enabled').checked = !!config.plinth.enabled;
            if (config.plinth.insetFront !== undefined) document.getElementById('kc-plinth-inset').value = config.plinth.insetFront;
        }

        if (config.worktop) {
            document.getElementById('kc-worktop-enabled').checked = !!config.worktop.enabled;
            if (config.worktop.depth !== undefined) document.getElementById('kc-worktop-depth').value = config.worktop.depth;
            if (config.worktop.thickness !== undefined) document.getElementById('kc-worktop-th').value = config.worktop.thickness;
            if (config.worktop.edgeRadius !== undefined) document.getElementById('kc-worktop-edge-radius').value = config.worktop.edgeRadius;
            if (config.worktop.overhangFront !== undefined) document.getElementById('kc-worktop-overhang-front').value = config.worktop.overhangFront;
            if (config.worktop.overhangBack !== undefined) document.getElementById('kc-worktop-overhang-back').value = config.worktop.overhangBack;
        }

        if (config.shelves) {
            if (config.shelves.count !== undefined) document.getElementById('kc-shelves-count').value = String(config.shelves.count);
        }

        // Dinamikus front elemek betöltése
        this.kitchenElements = JSON.parse(JSON.stringify(config.elements || []));
        this.renderKitchenElementsUI();
    }

    updatePropertiesForm(board) {
        if (!board) return;
        document.getElementById('prop-name').value = board.name;
        document.getElementById('prop-width').value = Math.round(board.width);
        document.getElementById('prop-height').value = Math.round(board.height);
        document.getElementById('prop-depth').value = Math.round(board.depth);
        document.getElementById('prop-pos-x').value = Math.round(board.mesh.position.x);
        document.getElementById('prop-pos-y').value = Math.round(board.mesh.position.y);
        document.getElementById('prop-pos-z').value = Math.round(board.mesh.position.z);
        document.getElementById('prop-rot-x').value = Math.round(board.rotX || 0);
        document.getElementById('prop-rot-y').value = Math.round(board.rotY || 0);
        document.getElementById('prop-rot-z').value = Math.round(board.rotZ || 0);
        document.getElementById('prop-edge-radius').value = board.edgeRadius !== undefined ? board.edgeRadius : (board.type === 'worktop' ? 3 : 1);
        document.getElementById('prop-edgebanding').value = board.edgeBanding || '0.4mm ABS';
    }

    applyPropertiesFormToBoard() {
        if (!this.selectedBoard) return;

        const updatedParams = {
            name: document.getElementById('prop-name').value,
            width: Number(document.getElementById('prop-width').value),
            height: Number(document.getElementById('prop-height').value),
            depth: Number(document.getElementById('prop-depth').value),
            edgeRadius: Number(document.getElementById('prop-edge-radius').value),
            x: Number(document.getElementById('prop-pos-x').value),
            y: Number(document.getElementById('prop-pos-y').value),
            z: Number(document.getElementById('prop-pos-z').value),
            rotX: Number(document.getElementById('prop-rot-x').value),
            rotY: Number(document.getElementById('prop-rot-y').value),
            rotZ: Number(document.getElementById('prop-rot-z').value),
            edgeBanding: document.getElementById('prop-edgebanding').value
        };

        this.boardManager.updateBoard(this.selectedBoard.id, updatedParams);
        this.updateDimensionsBadge();
        this.renderHierarchyTree();
    }

    updateDimensionsBadge() {
        const bounds = this.boardManager.getFurnitureBoundingBox();
        document.getElementById('badge-w').textContent = bounds.width;
        document.getElementById('badge-h').textContent = bounds.height;
        document.getElementById('badge-d').textContent = bounds.depth;
        document.getElementById('boards-count-tab').textContent = bounds.count;
    }

    updateSnapTargetDropdown() {
        const select = document.getElementById('snap-target-select');
        const currentVal = select.value;
        select.innerHTML = '<option value="">-- Válassz cél bútorlapot --</option>';

        this.boardManager.boards.forEach(b => {
            if (!this.selectedBoard || b.id !== this.selectedBoard.id) {
                const opt = document.createElement('option');
                opt.value = b.id;
                opt.textContent = `${b.name} (${Math.round(b.width)}×${Math.round(b.height)}×${Math.round(b.depth)})`;
                select.appendChild(opt);
            }
        });

        if (currentVal && select.querySelector(`option[value="${currentVal}"]`)) {
            select.value = currentVal;
        }
    }

    // ==========================================
    // TEXTÚRA ÉS ANYAG KEZELÉS
    // ==========================================

    renderTextureGrid() {
        const grid = document.getElementById('texture-picker-grid');
        grid.innerHTML = '';

        Object.keys(MaterialManager.textures).forEach(key => {
            const tex = MaterialManager.textures[key];
            const item = document.createElement('div');
            item.className = 'texture-item';
            if (this.selectedBoard && this.selectedBoard.textureKey === key) {
                item.classList.add('active');
            }

            item.innerHTML = `
                <img src="${tex.dataUrl}" class="texture-thumb" alt="${tex.name}">
                <div class="texture-name" title="${tex.name}">${tex.name}</div>
            `;

            item.addEventListener('click', () => {
                document.querySelectorAll('.texture-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                this.applyTexture(key);
            });

            grid.appendChild(item);
        });
    }

    applyTexture(textureKey) {
        if (this.applyTextureTarget === 'all') {
            this.boardManager.applyTextureToAll(textureKey);
        } else {
            if (this.selectedBoard) {
                this.boardManager.updateBoard(this.selectedBoard.id, { textureKey: textureKey });
            } else {
                this.boardManager.activeTextureKey = textureKey;
            }
        }
    }

    // ==========================================
    // BAL OLDALI KATALÓGUS ÉS KATEGÓRIA RENDERING
    // ==========================================

    // ==========================================
    // BAL OLDALI KATALÓGUS ÉS KATEGÓRIA RENDERING (ACCORDION / LENYÍLÓ MENÜ)
    // ==========================================

    renderCatalogUI() {
        const container = document.getElementById('category-accordion-container');
        if (!container) return;
        container.innerHTML = '';

        const searchQuery = (this.catalogManager.searchQuery || '').toLowerCase().trim();

        // 1. Kategóriák összegyűjtése (a beépítettek + ha van kategória nélküli bútor)
        const allCategories = [...this.catalogManager.categories];
        const uncategorizedItems = this.catalogManager.items.filter(item => 
            item.categoryId === 'uncategorized' || !this.catalogManager.categories.some(c => c.id === item.categoryId)
        );
        if (uncategorizedItems.length > 0) {
            allCategories.push({
                id: 'uncategorized',
                name: 'Egyéb / Nincs kategória',
                color: '#94a3b8',
                icon: 'folder'
            });
        }

        // 2. Kategória panelek renderelése egymás alá sorban (Accordion)
        allCategories.forEach(cat => {
            const isUncategorized = (cat.id === 'uncategorized');
            const catItems = this.catalogManager.items.filter(item => {
                const matchesCat = isUncategorized 
                    ? (item.categoryId === 'uncategorized' || !this.catalogManager.categories.some(c => c.id === item.categoryId))
                    : (item.categoryId === cat.id);
                if (!matchesCat) return false;
                if (!searchQuery) return true;
                return item.name.toLowerCase().includes(searchQuery) ||
                       (item.description && item.description.toLowerCase().includes(searchQuery));
            });

            // Ha keresünk és ebben a kategóriában van találat, automatikusan nyissuk le
            if (searchQuery && catItems.length > 0) {
                this.expandedCategories.add(cat.id);
            }

            const isOpen = this.expandedCategories.has(cat.id);

            const accordionItem = document.createElement('div');
            accordionItem.className = `category-accordion-item ${isOpen ? 'is-open' : ''}`;

            // Fejléc (Kattintásra nyílik / csukódik)
            const header = document.createElement('div');
            header.className = 'category-accordion-header';
            header.title = `${cat.name} kategória ${isOpen ? 'becsukása' : 'lenyitása'}`;
            header.innerHTML = `
                <div class="category-accordion-title-wrap">
                    <span class="category-dot" style="background:${cat.color || '#3b82f6'};"></span>
                    <span>${cat.name}</span>
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                    <span class="category-accordion-badge">${catItems.length} db</span>
                    <span class="category-accordion-arrow">▶</span>
                </div>
            `;

            // Lenyitás / Becsukás esemény
            header.addEventListener('click', () => {
                if (this.expandedCategories.has(cat.id)) {
                    this.expandedCategories.delete(cat.id);
                } else {
                    this.expandedCategories.add(cat.id);
                }
                this.renderCatalogUI();
            });

            accordionItem.appendChild(header);

            // Törzs (Lenyíló bútorkártyák listája)
            if (isOpen) {
                const body = document.createElement('div');
                body.className = 'category-accordion-body';

                if (catItems.length === 0) {
                    const empty = document.createElement('div');
                    empty.className = 'category-empty-text';
                    empty.textContent = searchQuery ? 'Nincs találat ebben a kategóriában.' : 'Még nincs mentett bútor ebben a kategóriában.';
                    body.appendChild(empty);
                } else {
                    catItems.forEach(item => {
                        const card = document.createElement('div');
                        card.className = 'catalog-card';

                        const thumbSrc = item.thumbnail || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect width="200" height="150" fill="%231e293b"/><text x="100" y="80" fill="%2364748b" font-family="sans-serif" font-size="28" text-anchor="middle">🛋️</text></svg>';

                        const dimW = (item.dimensions && item.dimensions.w) || 0;
                        const dimH = (item.dimensions && item.dimensions.h) || 0;
                        const dimD = (item.dimensions && item.dimensions.d) || 0;
                        const boardCount = item.boardCount || (item.boards && item.boards.length) || 1;

                        card.innerHTML = `
                            <div class="card-img-container">
                                <img src="${thumbSrc}" class="card-img" alt="${item.name}">
                            </div>
                            <div class="card-body">
                                <div class="card-title">${item.name}</div>
                                ${item.description ? `<div class="card-desc">${item.description}</div>` : ''}
                                <div class="card-meta">
                                    <span>📏 ${dimW}×${dimH}×${dimD} mm</span>
                                    <span>🧩 ${boardCount} lap</span>
                                </div>
                                <div class="card-actions">
                                    <button class="btn btn-sm btn-primary btn-add-scene" style="flex:1;" title="Hozzáadás a 3D munkatérhez">
                                        ➕ Hozzáadás a Térhez
                                    </button>
                                    <button class="btn btn-sm btn-danger btn-delete-item" style="padding:4px 8px; background:rgba(239, 68, 68, 0.2); color:#ef4444; border-color:#ef4444;" title="Törlés a katalógusból">
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        `;

                        // Hozzáadás a jelenethez
                        card.querySelector('.btn-add-scene').addEventListener('click', (e) => {
                            e.stopPropagation();
                            this.catalogManager.loadFurnitureToScene(item.id, false);
                            this.updateDimensionsBadge();
                            this.renderHierarchyTree();
                            this.updateSnapTargetDropdown();
                        });

                        // Törlés a katalógusból
                        card.querySelector('.btn-delete-item').addEventListener('click', (e) => {
                            e.stopPropagation();
                            if (confirm(`Biztosan törölni szeretnéd a(z) "${item.name}" bútort a katalógusból?`)) {
                                this.catalogManager.deleteItem(item.id);
                            }
                        });

                        body.appendChild(card);
                    });
                }

                accordionItem.appendChild(body);
            }

            container.appendChild(accordionItem);
        });
    }

    renderHierarchyTree() {
        const container = document.getElementById('boards-tree-list');
        if (!container) return;

        const totalItems = this.boardManager.corpora.length + this.boardManager.boards.filter(b => !b.corpusId).length;

        if (totalItems === 0) {
            container.innerHTML = '<div class="empty-state"><small>Nincsenek még bútor elemek a térben.</small></div>';
            return;
        }

        container.innerHTML = '';

        // 1. Konyha Korpusz egységek (egyben kezelve)
        this.boardManager.corpora.forEach(c => {
            const item = document.createElement('div');
            item.className = 'hierarchy-item';
            item.style.borderLeft = '3px solid #f59e0b';
            if (this.selectedCorpus && this.selectedCorpus.userData.id === c.userData.id) {
                item.classList.add('active');
            }

            item.innerHTML = `
                <div>
                    <div class="hierarchy-title" style="color:#f59e0b; font-weight:700;">🍳 ${c.userData.name}</div>
                    <div class="hierarchy-sub">${c.userData.width} × ${c.userData.height} × ${c.userData.depth} mm (Korpusz)</div>
                </div>
                <div style="display:flex; gap:4px;">
                    <button class="btn btn-sm btn-icon btn-tree-edit" title="Módosítás a Varázslóban" style="color:#f59e0b;">✏️</button>
                    <button class="btn btn-sm btn-icon btn-tree-delete" title="Törlés" style="color:#ef4444;">✕</button>
                </div>
            `;

            item.addEventListener('click', (e) => {
                if (e.target.closest('.btn-tree-delete')) {
                    this.boardManager.deleteCorpus(c.userData.id);
                    this.onBoardSelected(null);
                    this.updateDimensionsBadge();
                    this.renderHierarchyTree();
                    this.updateSnapTargetDropdown();
                    return;
                }
                if (e.target.closest('.btn-tree-edit')) {
                    this.openKitchenWizardForCorpus(c);
                    return;
                }
                this.scene3D.selectBoard(c);
            });

            container.appendChild(item);
        });

        // 2. Önálló bútorlapok
        const standaloneBoards = this.boardManager.boards.filter(b => !b.corpusId);
        standaloneBoards.forEach((b, index) => {
            const item = document.createElement('div');
            item.className = 'hierarchy-item';
            if (this.selectedBoard && this.selectedBoard.id === b.id) {
                item.classList.add('active');
            }

            item.innerHTML = `
                <div>
                    <div class="hierarchy-title">📄 ${b.name}</div>
                    <div class="hierarchy-sub">${Math.round(b.width)} × ${Math.round(b.height)} × ${Math.round(b.depth)} mm</div>
                </div>
                <div style="display:flex; gap:4px;">
                    <button class="btn btn-sm btn-icon btn-tree-select" title="Kijelölés">🎯</button>
                    <button class="btn btn-sm btn-icon btn-tree-delete" title="Törlés" style="color:#ef4444;">✕</button>
                </div>
            `;

            item.addEventListener('click', (e) => {
                if (e.target.closest('.btn-tree-delete')) {
                    this.boardManager.deleteBoard(b.id);
                    this.updateDimensionsBadge();
                    this.renderHierarchyTree();
                    this.updateSnapTargetDropdown();
                    return;
                }
                this.scene3D.selectBoard(b.mesh);
            });

            container.appendChild(item);
        });
    }

    highlightHierarchyItem(boardId) {
        document.querySelectorAll('.hierarchy-item').forEach(item => item.classList.remove('active'));
        if (boardId) {
            this.renderHierarchyTree();
        }
    }

    // ==========================================
    // MODAL KEZELŐK
    // ==========================================

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('open');
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('open');
    }

    openSaveFurnitureModal() {
        if (this.boardManager.boards.length === 0 && this.boardManager.corpora.length === 0) {
            alert('A 3D munkatér üres! Hozz létre legalább egy bútorlapot vagy konyha korpuszt a mentéshez.');
            return;
        }

        // Kijelölt elem vagy korpusz meghatározása
        let target = this.selectedCorpus || (this.selectedBoard ? this.selectedBoard.mesh : null);
        if (!target && this.scene3D.selectedTarget) {
            target = this.scene3D.selectedTarget;
        }

        // Ha egy korpusz valamelyik belső bútorlapja volt kiválasztva, válasszuk ki az egész korpuszt
        if (target && target.userData && target.userData.corpusId) {
            const parentCorpus = this.boardManager.corpora.find(c => c.userData.id === target.userData.corpusId);
            if (parentCorpus) {
                target = parentCorpus;
            }
        }

        // Ha nincs semmi kijelölve: automatikusan kiválasztjuk az egyetlent, ha csak 1 van a térben, különben figyelmeztetünk
        if (!target) {
            if (this.boardManager.corpora.length === 1 && this.boardManager.boards.filter(b => !b.corpusId).length === 0) {
                target = this.boardManager.corpora[0];
                this.scene3D.selectBoard(target);
            } else if (this.boardManager.corpora.length === 0 && this.boardManager.boards.length === 1) {
                target = this.boardManager.boards[0].mesh;
                this.scene3D.selectBoard(target);
            } else {
                alert('Kérlek kattints rá a 3D térben arra a korpuszra vagy bútorlapra, amelyet el szeretnél menteni a katalógusba!');
                return;
            }
        }

        const isCorpus = target.userData && target.userData.isCorpus;
        const targetId = target.userData.id;
        let defaultName = '';
        let targetInfoText = '';
        let defaultCat = 'cat_kitchen';

        if (isCorpus) {
            this.savingTarget = { type: 'corpus', id: targetId, target: target, name: target.userData.name };
            defaultName = target.userData.name || 'Konyha Korpusz';
            targetInfoText = `🍳 Kijelölt korpusz: ${target.userData.name} (${target.userData.width}×${target.userData.height}×${target.userData.depth} mm)`;
            defaultCat = 'cat_kitchen';
        } else {
            const board = this.boardManager.boards.find(b => b.id === targetId || b.mesh === target);
            const bId = board ? board.id : targetId;
            const bName = board ? board.name : (target.userData.name || 'Egyedi Lap');
            this.savingTarget = { type: 'board', id: bId, target: target, name: bName };
            defaultName = bName;
            targetInfoText = `📐 Kijelölt lap: ${bName} (${board ? `${board.width}×${board.height}×${board.depth} mm` : ''})`;
            defaultCat = 'cat_living';
        }

        // 3D Fotó készítése CSAK a kijelölt elemről/korpuszról
        const snapshot = this.scene3D.getSnapshot(target, 400, 300);
        const imgEl = document.getElementById('save-modal-thumbnail');
        if (imgEl) imgEl.src = snapshot;

        // Kategória dropdown feltöltése és alapértelmezett kategória kijelölése
        this.populateSaveCategoryDropdown(defaultCat);

        // Név és leírás mezők beállítása
        const nameInput = document.getElementById('save-furniture-name');
        if (nameInput) nameInput.value = defaultName;
        const descInput = document.getElementById('save-furniture-desc');
        if (descInput) descInput.value = '';

        const infoEl = document.getElementById('save-modal-target-info');
        if (infoEl) infoEl.textContent = targetInfoText;

        this.openModal('modal-save-furniture');
    }

    populateSaveCategoryDropdown(selectedCatId = null) {
        const select = document.getElementById('save-furniture-category');
        select.innerHTML = '';
        this.catalogManager.categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.textContent = cat.name;
            if (selectedCatId && cat.id === selectedCatId) {
                opt.selected = true;
            }
            select.appendChild(opt);
        });
    }

    openCutListModal() {
        this.updateCutListUI();
        this.openModal('modal-cutlist');
    }

    updateCutListUI(options = {}) {
        const sheetW = options.sheetWidth || Number(document.getElementById('cutlist-sheet-w')?.value) || 2800;
        const sheetH = options.sheetHeight || Number(document.getElementById('cutlist-sheet-h')?.value) || 2070;
        const kerf = options.kerf !== undefined ? options.kerf : (Number(document.getElementById('cutlist-kerf')?.value) || 4);
        const trim = options.trim !== undefined ? options.trim : (Number(document.getElementById('cutlist-trim')?.value) || 10);

        const data = this.cutListManager.generateCutList({
            sheetWidth: sheetW,
            sheetHeight: sheetH,
            kerf: kerf,
            trim: trim
        });

        const tableContainer = document.getElementById('cutlist-table-container');
        const summaryContainer = document.getElementById('cutlist-summary-container');
        const tabsContainer = document.getElementById('cutlist-sheet-tabs');
        const statsContainer = document.getElementById('cutlist-sheet-stats');
        const canvas = document.getElementById('cutlist-sheet-canvas');
        const countBadge = document.getElementById('cutlist-parts-count-badge');

        if (countBadge) countBadge.textContent = `${data.totalPieces} db bútorlap`;

        if (data.parts.length === 0) {
            if (tableContainer) tableContainer.innerHTML = '<div class="empty-state" style="padding:24px; text-align:center; color:var(--text-muted);"><p>Nincs szabászatra küldhető bútorlap a 3D térben.</p></div>';
            if (summaryContainer) summaryContainer.innerHTML = '<div style="color:var(--text-muted);">Nincs szabható elem.</div>';
            if (tabsContainer) tabsContainer.innerHTML = '';
            if (statsContainer) statsContainer.innerHTML = '';
            if (canvas) this.cutListManager.renderSheetToCanvas(canvas, 0);
            return;
        }

        // Tábla fülek generálása (1. Tábla, 2. Tábla, ...)
        if (tabsContainer) {
            tabsContainer.innerHTML = '';
            data.sheets.forEach((sheet, idx) => {
                const tabBtn = document.createElement('button');
                const isActive = idx === this.cutListManager.activeSheetIndex;
                tabBtn.className = `btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`;
                tabBtn.style.padding = '4px 10px';
                tabBtn.style.fontSize = '11px';
                tabBtn.innerHTML = `📄 <strong>${idx + 1}. Tábla</strong> (${sheet.placedParts.length} db, ${sheet.efficiency}%)`;
                tabBtn.addEventListener('click', () => {
                    this.cutListManager.activeSheetIndex = idx;
                    tabsContainer.querySelectorAll('button').forEach((b, i) => {
                        b.className = `btn btn-sm ${i === idx ? 'btn-primary' : 'btn-secondary'}`;
                    });
                    if (canvas) this.cutListManager.renderSheetToCanvas(canvas, idx);
                    this.updateCutListStats(data, idx);
                });
                tabsContainer.appendChild(tabBtn);
            });
        }

        // Statisztikai sáv frissítése
        this.updateCutListStats(data, this.cutListManager.activeSheetIndex);

        // 2D Canvas kirajzolása
        if (canvas) {
            setTimeout(() => {
                this.cutListManager.renderSheetToCanvas(canvas, this.cutListManager.activeSheetIndex);
            }, 60);
        }

        // Részletes bútorlap alkatrésztáblázat felépítése
        if (tableContainer) {
            const typeLabels = {
                corpus: { label: 'Korpusz', color: '#3b82f6' },
                door: { label: 'Ajtó', color: '#eab308' },
                drawer: { label: 'Fiók', color: '#10b981' },
                shelf: { label: 'Polc', color: '#8b5cf6' },
                worktop: { label: 'Munkalap', color: '#ec4899' },
                back: { label: 'Hátfal', color: '#64748b' }
            };

            let tableHtml = `
                <table style="width:100%; border-collapse:collapse; font-size:12px; text-align:left;">
                    <thead>
                        <tr style="background:var(--bg-card); border-bottom:1px solid var(--border-color); color:var(--text-secondary);">
                            <th style="padding:8px 10px;">#</th>
                            <th style="padding:8px 10px;">Megnevezés</th>
                            <th style="padding:8px 10px;">Típus</th>
                            <th style="padding:8px 10px; text-align:right;">Hossz</th>
                            <th style="padding:8px 10px; text-align:right;">Szélesség</th>
                            <th style="padding:8px 10px; text-align:right;">Vastagság</th>
                            <th style="padding:8px 10px;">Dekor / Anyag</th>
                            <th style="padding:8px 10px;">Élzárás</th>
                            <th style="padding:8px 10px; text-align:right;">Felület</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            data.parts.forEach(p => {
                const isBack = p.type === 'back' || p.isBack;
                const typeInfo = isBack ? 
                    { label: '3mm HDF Hátfal', color: '#94a3b8' } : 
                    (typeLabels[p.type] || typeLabels.corpus);

                tableHtml += `
                    <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                        <td style="padding:6px 10px; color:var(--text-muted);">${p.sno}</td>
                        <td style="padding:6px 10px; font-weight:600;">${p.name}</td>
                        <td style="padding:6px 10px;">
                            <span style="font-size:10px; padding:2px 6px; border-radius:3px; background:${typeInfo.color}22; color:${typeInfo.color}; border:1px solid ${typeInfo.color}44;">${typeInfo.label}</span>
                            ${isBack ? '<span style="font-size:9px; color:var(--text-muted); margin-left:4px;">(Külön HDF lemez)</span>' : ''}
                        </td>
                        <td style="padding:6px 10px; text-align:right; font-weight:600;">${p.length} mm</td>
                        <td style="padding:6px 10px; text-align:right; font-weight:600;">${p.width} mm</td>
                        <td style="padding:6px 10px; text-align:right; color:var(--text-muted);">${p.thickness} mm</td>
                        <td style="padding:6px 10px;">${p.textureName}</td>
                        <td style="padding:6px 10px; color:var(--text-secondary);">${p.edgeBanding}</td>
                        <td style="padding:6px 10px; text-align:right; color:var(--accent); font-weight:600;">${p.areaSqm} m²</td>
                    </tr>
                `;
            });

            tableHtml += '</tbody></table>';
            tableContainer.innerHTML = tableHtml;
        }

        // Összesítő sáv frissítése
        if (summaryContainer) {
            const hasBack = data.backPieces > 0;
            summaryContainer.innerHTML = `
                <div>
                    <div><strong>Bútorlapok a táblán:</strong> <span style="color:var(--accent); font-weight:700;">${data.boardPieces} db</span> (${data.totalSheetsCount} db ${data.sheetWidth}×${data.sheetHeight} mm tábla)${hasBack ? ` + <span style="color:#94a3b8;">${data.backPieces} db 3mm HDF hátfal</span>` : ''}</div>
                    <div><strong>Bútorlap felület (18mm):</strong> ${data.boardAreaSqm} m²${hasBack ? ` | <strong>Hátfal felület (3mm):</strong> ${data.backAreaSqm} m²` : ''}</div>
                </div>
                <div>
                    <div><strong>Szükséges élzárás:</strong> ~${data.totalEdgeMeters} fm</div>
                    <div style="color:var(--success); font-weight:700;"><strong>Becsült anyagköltség:</strong> ~${data.estimatedTotal.toLocaleString('hu-HU')} Ft</div>
                </div>
            `;
        }
    }

    updateCutListStats(data, activeIdx) {
        const statsContainer = document.getElementById('cutlist-sheet-stats');
        if (!statsContainer || !data || !data.sheets || !data.sheets[activeIdx]) return;
        const currentSheet = data.sheets[activeIdx];
        statsContainer.innerHTML = `
            <span>Táblák: <strong>${data.totalSheetsCount} db</strong></span>
            <span>Jelenlegi tábla kihasználtság: <strong style="color:var(--success);">${currentSheet.efficiency}%</strong></span>
            <span>Hulladék: <strong>${(100 - currentSheet.efficiency).toFixed(1)}%</strong></span>
            <span>Összesített kihozatal: <strong style="color:var(--accent);">${data.overallEfficiency}%</strong></span>
        `;
    }

    // ==========================================
    // KONYHA KORPUSZ GENERÁLÓ METÓDUSOK
    // ==========================================

    applyKitchenTypePreset(type) {
        if (type === 'base') {
            document.getElementById('kc-width').value = 600;
            document.getElementById('kc-height').value = 720;
            document.getElementById('kc-depth').value = 560;
            if (document.getElementById('kc-edge-radius')) document.getElementById('kc-edge-radius').value = 1;
            document.getElementById('kc-top-type').value = 'stretchers';
            document.getElementById('kc-stretchers-settings').style.display = 'block';
            document.getElementById('kc-fs-enabled').checked = true;
            document.getElementById('kc-fs-inset').value = 15;
            document.getElementById('kc-bs-enabled').checked = true;
            document.getElementById('kc-bs-inset').value = 10;
            document.getElementById('kc-legs-enabled').checked = true;
            document.getElementById('kc-legs-height').value = 100;
            document.getElementById('kc-plinth-enabled').checked = true;
            document.getElementById('kc-plinth-inset').value = 20;
            document.getElementById('kc-worktop-enabled').checked = true;
            document.getElementById('kc-worktop-depth').value = 600;
            if (document.getElementById('kc-worktop-edge-radius')) document.getElementById('kc-worktop-edge-radius').value = 3;
            document.getElementById('kc-worktop-overhang-front').value = 25;
            document.getElementById('kc-worktop-overhang-back').value = 15;
            document.getElementById('kc-shelves-count').value = '1';
        } else if (type === 'wall') {
            document.getElementById('kc-width').value = 600;
            document.getElementById('kc-height').value = 720;
            document.getElementById('kc-depth').value = 320;
            if (document.getElementById('kc-edge-radius')) document.getElementById('kc-edge-radius').value = 1;
            document.getElementById('kc-top-type').value = 'full_top';
            document.getElementById('kc-stretchers-settings').style.display = 'none';
            document.getElementById('kc-legs-enabled').checked = false;
            document.getElementById('kc-plinth-enabled').checked = false;
            document.getElementById('kc-worktop-enabled').checked = false;
            document.getElementById('kc-shelves-count').value = '2';
            document.getElementById('kc-back-inset').value = 15;
        } else if (type === 'tall') {
            document.getElementById('kc-width').value = 600;
            document.getElementById('kc-height').value = 2000;
            document.getElementById('kc-depth').value = 560;
            if (document.getElementById('kc-edge-radius')) document.getElementById('kc-edge-radius').value = 1;
            document.getElementById('kc-top-type').value = 'full_top';
            document.getElementById('kc-stretchers-settings').style.display = 'none';
            document.getElementById('kc-legs-enabled').checked = true;
            document.getElementById('kc-legs-height').value = 100;
            document.getElementById('kc-plinth-enabled').checked = true;
            document.getElementById('kc-plinth-inset').value = 20;
            document.getElementById('kc-worktop-enabled').checked = false;
            document.getElementById('kc-shelves-count').value = '3';
        }
    }

    syncKitchenWorktopMath(trigger = 'front') {
        const corpusDepth = Number(document.getElementById('kc-depth').value) || 560;
        let worktopDepth = Number(document.getElementById('kc-worktop-depth').value) || 600;
        let frontOverhang = Number(document.getElementById('kc-worktop-overhang-front').value) || 0;
        let backOverhang = Number(document.getElementById('kc-worktop-overhang-back').value) || 0;

        // A munkalapnak legalább akkorának kell lennie, mint a korpusz
        if (worktopDepth < corpusDepth) {
            worktopDepth = corpusDepth;
            document.getElementById('kc-worktop-depth').value = worktopDepth;
        }

        const totalOverhangAvailable = Math.max(0, worktopDepth - corpusDepth);

        if (trigger === 'depth') {
            if (frontOverhang > totalOverhangAvailable) {
                frontOverhang = totalOverhangAvailable;
            }
            backOverhang = totalOverhangAvailable - frontOverhang;
        } else if (trigger === 'front') {
            if (frontOverhang > totalOverhangAvailable) {
                frontOverhang = totalOverhangAvailable;
            }
            backOverhang = totalOverhangAvailable - frontOverhang;
        } else if (trigger === 'back') {
            if (backOverhang > totalOverhangAvailable) {
                backOverhang = totalOverhangAvailable;
            }
            frontOverhang = totalOverhangAvailable - backOverhang;
        }

        document.getElementById('kc-worktop-overhang-front').value = frontOverhang;
        document.getElementById('kc-worktop-overhang-back').value = backOverhang;
        document.getElementById('kc-worktop-overhang-front').max = totalOverhangAvailable;
        document.getElementById('kc-worktop-overhang-back').max = totalOverhangAvailable;

        const infoEl = document.getElementById('kc-worktop-math-info');
        if (infoEl) {
            infoEl.textContent = `📏 Korpusz: ${corpusDepth} mm + Elöl: ${frontOverhang} mm + Hátul: ${backOverhang} mm = ${worktopDepth} mm munkalap`;
        }
    }

    getKitchenConfigFromUI() {
        const texKey = document.getElementById('kc-texture').value || 'white_matte';
        return {
            width: Number(document.getElementById('kc-width').value) || 600,
            height: Number(document.getElementById('kc-height').value) || 720,
            depth: Number(document.getElementById('kc-depth').value) || 560,
            thickness: Number(document.getElementById('kc-thickness').value) || 18,
            textureKey: texKey,
            edgeRadius: Number(document.getElementById('kc-edge-radius')?.value) !== undefined ? Number(document.getElementById('kc-edge-radius').value) : 1,

            sides: {
                enabled: true,
                textureKey: texKey
            },

            bottom: {
                enabled: true,
                placement: 'between',
                offsetFromGround: 0,
                textureKey: texKey
            },

            topType: document.getElementById('kc-top-type').value || 'stretchers',

            frontStretcher: {
                enabled: document.getElementById('kc-fs-enabled').checked,
                width: Number(document.getElementById('kc-fs-width').value) || 80,
                orientation: document.getElementById('kc-fs-orient').value || 'flat',
                insetFront: Number(document.getElementById('kc-fs-inset').value) || 0,
                textureKey: texKey
            },

            backStretcher: {
                enabled: document.getElementById('kc-bs-enabled').checked,
                width: Number(document.getElementById('kc-bs-width').value) || 80,
                orientation: document.getElementById('kc-bs-orient').value || 'flat',
                insetBack: Number(document.getElementById('kc-bs-inset').value) || 0,
                textureKey: texKey
            },

            backPanel: {
                enabled: document.getElementById('kc-back-enabled').checked,
                type: document.getElementById('kc-back-type').value || 'groove',
                thickness: Number(document.getElementById('kc-back-th').value) || 3,
                insetBack: Number(document.getElementById('kc-back-inset').value) || 20,
                textureKey: Number(document.getElementById('kc-back-th').value) === 18 ? texKey : 'white_matte'
            },

            legs: {
                enabled: document.getElementById('kc-legs-enabled').checked,
                height: Number(document.getElementById('kc-legs-height').value) || 100,
                diameter: 45,
                insetX: 50,
                insetZ: 50
            },

            plinth: {
                enabled: document.getElementById('kc-plinth-enabled').checked,
                height: Number(document.getElementById('kc-legs-height').value) || 100,
                thickness: 18,
                insetFront: Number(document.getElementById('kc-plinth-inset')?.value) !== undefined ? Number(document.getElementById('kc-plinth-inset').value) : 20,
                textureKey: 'anthracite'
            },

            worktop: {
                enabled: document.getElementById('kc-worktop-enabled').checked,
                thickness: Number(document.getElementById('kc-worktop-th').value) || 38,
                depth: Number(document.getElementById('kc-worktop-depth').value) || 600,
                edgeRadius: Number(document.getElementById('kc-worktop-edge-radius')?.value) !== undefined ? Number(document.getElementById('kc-worktop-edge-radius').value) : 3,
                overhangFront: Number(document.getElementById('kc-worktop-overhang-front').value) || 25,
                overhangBack: Number(document.getElementById('kc-worktop-overhang-back').value) || 15,
                textureKey: 'concrete'
            },

            shelves: {
                count: Number(document.getElementById('kc-shelves-count').value) || 0,
                thickness: Number(document.getElementById('kc-thickness').value) || 18,
                insetFront: 15,
                textureKey: texKey
            },

            elements: JSON.parse(JSON.stringify(this.kitchenElements || []))
        };
    }

    addKitchenElement(type) {
        const corpusHeight = Number(document.getElementById('kc-height').value) || 720;
        let currentTotalH = 0;
        this.kitchenElements.forEach(el => {
            currentTotalH += Number(el.height) || 0;
        });

        const remainingH = Math.max(100, corpusHeight - currentTotalH);
        const id = 'elem_' + Date.now() + '_' + Math.floor(Math.random() * 1000);

        if (type === 'door') {
            const doorH = (this.kitchenElements.length === 0) ? corpusHeight : remainingH;
            this.kitchenElements.push({
                id: id,
                type: 'door',
                name: 'Ajtó Front',
                height: doorH,
                gap: 3,
                doorType: (Number(document.getElementById('kc-width').value) >= 800) ? 'double' : 'single_left',
                thickness: 18,
                textureKey: document.getElementById('kc-texture').value || 'white_matte',
                hasHandle: true
            });
        } else if (type === 'drawer') {
            const drawerH = Math.min(280, remainingH > 150 ? (remainingH > 300 ? 140 : remainingH) : 140);
            this.kitchenElements.push({
                id: id,
                type: 'drawer',
                name: `Fiók ${this.kitchenElements.filter(e => e.type === 'drawer').length + 1}`,
                height: drawerH,
                gap: 3,
                thickness: 18,
                textureKey: document.getElementById('kc-texture').value || 'white_matte',
                hasHandle: true
            });
        } else if (type === 'oven') {
            this.kitchenElements.push({
                id: id,
                type: 'oven',
                name: 'Beépíthető Sütő & Főzőlap',
                height: 595,
                gap: 3,
                includeCooktop: true
            });
        }

        this.renderKitchenElementsUI();
        this.updateKitchenLivePreview();
    }

    removeKitchenElement(id) {
        this.kitchenElements = this.kitchenElements.filter(e => e.id !== id);
        this.renderKitchenElementsUI();
        this.updateKitchenLivePreview();
    }

    renderKitchenElementsUI() {
        const container = document.getElementById('kc-elements-container');
        const badge = document.getElementById('kc-elements-badge');
        const heightInfo = document.getElementById('kc-elements-height-info');
        const corpusHeight = Number(document.getElementById('kc-height')?.value) || 720;

        if (!container) return;

        if (badge) {
            badge.textContent = `${this.kitchenElements.length} elem hozzáadva`;
        }

        let totalAllocatedH = 0;
        this.kitchenElements.forEach(e => totalAllocatedH += Number(e.height) || 0);

        if (heightInfo) {
            heightInfo.textContent = `Összes front magasság: ${totalAllocatedH} / ${corpusHeight} mm`;
            heightInfo.style.color = (totalAllocatedH > corpusHeight) ? '#ef4444' : (totalAllocatedH === corpusHeight ? '#10b981' : 'var(--text-muted)');
        }

        if (this.kitchenElements.length === 0) {
            container.innerHTML = `
                <div id="kc-no-elements-msg" style="font-size:11px; color:var(--text-muted); font-style:italic; padding:10px; background:rgba(0,0,0,0.2); border-radius:4px; text-align:center;">
                    Alapból nincs front hozzáadva (nyitott korpusz). Az alábbi gombokkal adhatsz hozzá tetszőlegesen ajtót, fiókot vagy beépíthető sütőt/főzőlapot!
                </div>
            `;
            return;
        }

        container.innerHTML = '';

        this.kitchenElements.forEach((elem, index) => {
            const card = document.createElement('div');
            card.className = 'kc-element-card';
            card.style.cssText = 'background:var(--bg-card); border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:10px; position:relative;';

            let typeIcon = '🚪';
            let typeTitle = 'Ajtó';
            let specificControls = '';

            if (elem.type === 'door') {
                typeIcon = '🚪';
                typeTitle = `Ajtó ${index + 1}`;
                specificControls = `
                    <div>
                        <label class="form-label" style="font-size:10px;">Nyitás / Típus</label>
                        <select class="form-control elem-prop-doortype" data-id="${elem.id}" style="font-size:11px; padding:3px 6px;">
                            <option value="single_left" ${elem.doorType === 'single_left' ? 'selected' : ''}>Balos nyíló</option>
                            <option value="single_right" ${elem.doorType === 'single_right' ? 'selected' : ''}>Jobbos nyíló</option>
                            <option value="double" ${elem.doorType === 'double' ? 'selected' : ''}>Kétszárnyú ajtó</option>
                        </select>
                    </div>
                    <div style="display:flex; align-items:center; gap:6px; margin-top:16px;">
                        <label style="font-size:11px; display:flex; align-items:center; gap:4px; cursor:pointer;">
                            <input type="checkbox" class="elem-prop-handle" data-id="${elem.id}" ${elem.hasHandle !== false ? 'checked' : ''}> Fém Fogantyú
                        </label>
                    </div>
                `;
            } else if (elem.type === 'drawer') {
                typeIcon = '🗄️';
                typeTitle = `Fiók ${index + 1}`;
                specificControls = `
                    <div style="grid-column: span 2; display:flex; align-items:center; justify-content:space-between;">
                        <label style="font-size:11px; display:flex; align-items:center; gap:4px; cursor:pointer;">
                            <input type="checkbox" class="elem-prop-handle" data-id="${elem.id}" ${elem.hasHandle !== false ? 'checked' : ''}> Fém Fogantyú
                        </label>
                        <div style="display:flex; gap:3px;">
                            <button type="button" class="quick-dim-btn btn-quick-drawer-h" data-id="${elem.id}" data-val="140">140</button>
                            <button type="button" class="quick-dim-btn btn-quick-drawer-h" data-id="${elem.id}" data-val="280">280</button>
                            <button type="button" class="quick-dim-btn btn-quick-drawer-h" data-id="${elem.id}" data-val="355">355</button>
                        </div>
                    </div>
                `;
            } else if (elem.type === 'oven') {
                typeIcon = '🍳';
                typeTitle = 'Beépíthető Sütő & Főzőlap';
                specificControls = `
                    <div style="grid-column: span 2;">
                        <label style="font-size:11px; display:flex; align-items:center; gap:4px; cursor:pointer;">
                            <input type="checkbox" class="elem-prop-cooktop" data-id="${elem.id}" ${elem.includeCooktop !== false ? 'checked' : ''}> Indukciós Főzőlap a munkalapon
                        </label>
                    </div>
                `;
            }

            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                    <div style="font-size:12px; font-weight:700; color:var(--text-primary); display:flex; align-items:center; gap:6px;">
                        <span>${typeIcon} ${typeTitle}</span>
                    </div>
                    <button type="button" class="btn btn-sm btn-danger btn-remove-elem" data-id="${elem.id}" style="padding:2px 6px; font-size:10px; background:rgba(239,68,68,0.2); color:#ef4444; border-color:#ef4444;" title="Elem Eltávolítása">
                        ✕ Törlés
                    </button>
                </div>

                <div class="grid-2-col" style="gap:8px;">
                    <div>
                        <label class="form-label" style="font-size:10px; color:#f59e0b; font-weight:600;">Névleges Magasság</label>
                        <div class="input-with-unit">
                            <input type="number" class="form-control elem-prop-height" data-id="${elem.id}" value="${elem.height || 140}" step="5" style="font-size:11px; padding:3px 6px;">
                            <span class="input-unit" style="font-size:10px;">mm</span>
                        </div>
                    </div>
                    <div>
                        <label class="form-label" style="font-size:10px; color:#f59e0b; font-weight:600;">⚡ Réshézag körben</label>
                        <div class="input-with-unit">
                            <input type="number" class="form-control elem-prop-gap" data-id="${elem.id}" value="${elem.gap !== undefined ? elem.gap : 3}" min="0" max="10" step="0.5" style="font-size:11px; padding:3px 6px;" title="Mennyivel legyen kisebb a front körben (pl. 3 mm)">
                            <span class="input-unit" style="font-size:10px;">mm</span>
                        </div>
                    </div>
                    ${specificControls}
                </div>
            `;

            // Eseménykezelők
            card.querySelector('.btn-remove-elem').addEventListener('click', () => {
                this.removeKitchenElement(elem.id);
            });

            card.querySelector('.elem-prop-height').addEventListener('input', (e) => {
                elem.height = Number(e.target.value) || 0;
                this.renderKitchenElementsSummary();
                this.updateKitchenLivePreview();
            });

            card.querySelector('.elem-prop-gap').addEventListener('input', (e) => {
                elem.gap = Number(e.target.value) || 0;
                this.updateKitchenLivePreview();
            });

            const doorTypeSelect = card.querySelector('.elem-prop-doortype');
            if (doorTypeSelect) {
                doorTypeSelect.addEventListener('change', (e) => {
                    elem.doorType = e.target.value;
                    this.updateKitchenLivePreview();
                });
            }

            const handleCheck = card.querySelector('.elem-prop-handle');
            if (handleCheck) {
                handleCheck.addEventListener('change', (e) => {
                    elem.hasHandle = e.target.checked;
                    this.updateKitchenLivePreview();
                });
            }

            const cooktopCheck = card.querySelector('.elem-prop-cooktop');
            if (cooktopCheck) {
                cooktopCheck.addEventListener('change', (e) => {
                    elem.includeCooktop = e.target.checked;
                    this.updateKitchenLivePreview();
                });
            }

            card.querySelectorAll('.btn-quick-drawer-h').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const val = Number(e.target.dataset.val);
                    elem.height = val;
                    const hInput = card.querySelector('.elem-prop-height');
                    if (hInput) hInput.value = val;
                    this.renderKitchenElementsSummary();
                    this.updateKitchenLivePreview();
                });
            });

            container.appendChild(card);
        });
    }

    renderKitchenElementsSummary() {
        const heightInfo = document.getElementById('kc-elements-height-info');
        const corpusHeight = Number(document.getElementById('kc-height')?.value) || 720;
        let totalAllocatedH = 0;
        this.kitchenElements.forEach(e => totalAllocatedH += Number(e.height) || 0);

        if (heightInfo) {
            heightInfo.textContent = `Összes front magasság: ${totalAllocatedH} / ${corpusHeight} mm`;
            heightInfo.style.color = (totalAllocatedH > corpusHeight) ? '#ef4444' : (totalAllocatedH === corpusHeight ? '#10b981' : 'var(--text-muted)');
        }
    }

    updateKitchenLivePreview() {
        if (!document.getElementById('modal-kitchen-generator').classList.contains('open')) return;

        const config = this.getKitchenConfigFromUI();

        // 1. Frissítsük a Varázsló jobb oldali 3D élőképet
        if (this.kitchenPreview) {
            this.kitchenPreview.update(config);
        }

        // 2. Frissítsük a jelenetet valós időben
        if (this.editingCorpusId) {
            this.boardManager.updateCorpus(this.editingCorpusId, config);
            this.updateDimensionsBadge();
        } else {
            if (this.previewCorpus) {
                this.boardManager.updateCorpus(this.previewCorpus.userData.id, config);
                this.updateDimensionsBadge();
            } else {
                this.previewCorpus = this.boardManager.createCorpus(config, this.newCorpusOffsetX || 0, 0, 0);
                this.scene3D.selectBoard(this.previewCorpus);
                this.updateDimensionsBadge();
                this.renderHierarchyTree();
            }
        }
    }

    generateKitchenCorpus() {
        const config = this.getKitchenConfigFromUI();

        if (this.editingCorpusId) {
            const updated = this.boardManager.updateCorpus(this.editingCorpusId, config);
            this.editingCorpusId = null;
            this.kitchenBackupConfig = null;
            this.closeModal('modal-kitchen-generator');
            this.updateDimensionsBadge();
            this.renderHierarchyTree();
            this.updateSnapTargetDropdown();
            if (updated) {
                this.scene3D.selectBoard(updated);
            }
            return;
        }

        // Új korpusz hozzáadása a jelenethez
        if (this.previewCorpus) {
            this.boardManager.updateCorpus(this.previewCorpus.userData.id, config);
            const finalCorpus = this.previewCorpus;
            this.previewCorpus = null;
            this.closeModal('modal-kitchen-generator');
            this.updateDimensionsBadge();
            this.renderHierarchyTree();
            this.updateSnapTargetDropdown();
            if (finalCorpus) {
                this.scene3D.selectBoard(finalCorpus);
            }
        } else {
            const currentBounds = this.boardManager.getFurnitureBoundingBox();
            const offsetX = currentBounds.width > 0 ? (currentBounds.width / 2 + config.width / 2 + 80) : 0;
            const newCorpus = this.boardManager.createCorpus(config, offsetX, 0, 0);
            this.closeModal('modal-kitchen-generator');
            this.updateDimensionsBadge();
            this.renderHierarchyTree();
            this.updateSnapTargetDropdown();
            this.scene3D.selectBoard(newCorpus);
        }
    }
}

// Alkalmazás indítása a DOM betöltődése után
function startFurnitureApp() {
    if (!window.app) {
        try {
            window.app = new FurnitureApp();
        } catch (e) {
            console.error('Hiba az alkalmazás indításakor:', e);
        }
    }
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', startFurnitureApp);
} else {
    startFurnitureApp();
}
