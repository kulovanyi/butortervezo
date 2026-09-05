/**
 * 3D Jelenet Menedzser (scene3d.js)
 * Three.js jelenet, kamera, OrbitControls, TransformControls, fények, raszter, árnyékok
 * Támogatja az egyedi bútorlapokat és az Egybefüggő Konyha Korpusz egységeket lebegő 3D buborékkal.
 */

export class Scene3D {
    constructor(containerElement, onBoardSelected, onBoardTransformChanged, onFloatingBubbleUpdate) {
        this.container = containerElement;
        this.onBoardSelected = onBoardSelected;
        this.onBoardTransformChanged = onBoardTransformChanged;
        this.onFloatingBubbleUpdate = onFloatingBubbleUpdate;

        this.scene = null;
        this.camera = null;
        this.perspCamera = null;
        this.orthoCamera = null;
        this.currentViewMode = 'iso';
        this.isWireframeMode = false;
        this.isStudioMode = false;
        this.studioEnvMap = null;
        this.defaultEnvMap = null;
        this.studioLights = [];
        this.defaultLights = [];
        this.renderer = null;
        this.controls = null;
        this.transformControls = null;
        this.gridHelper = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.isPointerDown = false;
        this.pointerDownPos = { x: 0, y: 0 };
        this.pointerDownButton = 0;

        // Unreal Fly / Look navigáció
        this.isRMBDown = false;
        this.lastMousePos = { x: 0, y: 0 };
        this.yaw = 0;
        this.pitch = 0;
        this.flyKeys = { w: false, a: false, s: false, d: false, q: false, e: false, space: false, shift: false };
        this.flySpeed = 1200; // mm / sec
        this.flyBoost = 2.5;  // Shift szorzó
        this.clock = new THREE.Clock();

        this.dimensionGroup = null;
        this.boardMeshes = [];
        this.selectedTarget = null; // Mesh VAGY Group (Korpusz / Bútor Csoport)
        this.selectedTargets = []; // Többes kijelölés listája
        this.snapDistance = 10; // mm
        this.magneticSnapDistance = 30; // Mágneses vonzás alapértelmezett értéke (mm)
        this.boardManager = null;

        // Ajtók és fiókok nyitási állapota & animációja
        this.doorAnimationProgress = 0; // 0 = Zárva, 1 = Teljesen nyitva
        this.targetDoorAnimationProgress = 0;

        this.init();
    }

    init() {
        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;
        const aspect = width / height;

        // 1. Jelenet
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color('#1e222b');

        // 2. Dual Kamerarendszer: Perspektivikus (3D) + Ortografikus (2D Műszaki rajz torzításmentes)
        this.perspCamera = new THREE.PerspectiveCamera(45, aspect, 1, 30000);
        this.perspCamera.position.set(1200, 900, 1600);

        const orthoSize = 1000;
        this.orthoCamera = new THREE.OrthographicCamera(
            -orthoSize * aspect, orthoSize * aspect,
            orthoSize, -orthoSize,
            -20000, 30000
        );
        this.orthoCamera.position.set(0, 400, 2000);

        this.camera = this.perspCamera;

        // 3. Renderelő
        this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;
        this.container.appendChild(this.renderer.domElement);

        // 4. OrbitControls beállítása
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.target.set(0, 400, 0);
        this.controls.maxPolarAngle = Math.PI / 2 + 0.05;
        this.controls.minDistance = 50;
        this.controls.maxDistance = 10000;

        // Gombkiosztás: Bal klikk = Forgatás, Középső gomb (Görgő) = PAN, Jobb gomb = Kikapcsolva az Orbitban (Unreal fly)
        this.controls.mouseButtons = {
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.PAN,
            RIGHT: null
        };

        // 5. Fények
        this.setupLights();

        // 6. Padlórács és segédvonalak
        this.setupGround();

        // 7. TransformControls (Gizmo)
        this.setupTransformControls();

        // 8. Méretvonalak csoportja
        this.dimensionGroup = new THREE.Group();
        this.scene.add(this.dimensionGroup);

        // 9. Eseménykezelők
        this.setupEvents();

        // 10. Render loop
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    setupLights() {
        const hemiLight = new THREE.HemisphereLight('#ffffff', '#333945', 0.65);
        hemiLight.position.set(0, 3000, 0);
        this.scene.add(hemiLight);

        const dirLight = new THREE.DirectionalLight('#ffffff', 0.85);
        dirLight.position.set(1500, 2500, 1800);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.near = 500;
        dirLight.shadow.camera.far = 7000;
        const d = 1500;
        dirLight.shadow.camera.left = -d;
        dirLight.shadow.camera.right = d;
        dirLight.shadow.camera.top = d;
        dirLight.shadow.camera.bottom = -d;
        dirLight.shadow.bias = -0.0005;
        this.scene.add(dirLight);

        const fillLight = new THREE.DirectionalLight('#a6c8ff', 0.35);
        fillLight.position.set(-1500, 1500, -1200);
        this.scene.add(fillLight);

        const backLight = new THREE.DirectionalLight('#ffffff', 0.25);
        backLight.position.set(0, 1000, -2000);
        this.scene.add(backLight);
    }

    setupGround() {
        const size = 6000;
        const divisions = 60;
        this.gridHelper = new THREE.GridHelper(size, divisions, '#4a5568', '#2d3748');
        this.gridHelper.position.y = 0;
        this.scene.add(this.gridHelper);

        const shadowPlaneGeo = new THREE.PlaneGeometry(size, size);
        const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.28 });
        const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
        shadowPlane.rotation.x = -Math.PI / 2;
        shadowPlane.position.y = -0.1;
        shadowPlane.receiveShadow = true;
        this.scene.add(shadowPlane);
    }

    setupTransformControls() {
        this.transformControls = new THREE.TransformControls(this.camera, this.renderer.domElement);
        this.transformControls.size = 0.85;
        this.transformControls.setTranslationSnap(18);
        this.transformControls.setRotationSnap(THREE.MathUtils.degToRad(5));

        this.transformControls.addEventListener('dragging-changed', (event) => {
            this.controls.enabled = !event.value && !this.isRMBDown;
            if (!event.value && this.selectedTarget) {
                this.applyMagneticSnapping(this.selectedTarget);
                if (this.boardManager && this.boardManager.updateKitchenContinuity) {
                    this.boardManager.updateKitchenContinuity();
                }
            }
        });

        this.transformControls.addEventListener('objectChange', () => {
            if (this.selectedTarget) {
                this.applyMagneticSnapping(this.selectedTarget);
                this.selectedTarget.userData.x = Math.round(this.selectedTarget.position.x);
                this.selectedTarget.userData.y = Math.round(this.selectedTarget.position.y);
                this.selectedTarget.userData.z = Math.round(this.selectedTarget.position.z);

                // 5 fokos lépésekben tárolt forgatási szögek
                const degX = Math.round(THREE.MathUtils.radToDeg(this.selectedTarget.rotation.x) / 5) * 5;
                const degY = Math.round(THREE.MathUtils.radToDeg(this.selectedTarget.rotation.y) / 5) * 5;
                const degZ = Math.round(THREE.MathUtils.radToDeg(this.selectedTarget.rotation.z) / 5) * 5;
                this.selectedTarget.userData.rotX = degX;
                this.selectedTarget.userData.rotY = degY;
                this.selectedTarget.userData.rotZ = degZ;

                if (this.onBoardTransformChanged) {
                    this.onBoardTransformChanged(this.selectedTarget);
                }
                this.updateDimensionVisualizer();
                if (this.boardManager && this.boardManager.updateKitchenContinuity) {
                    this.boardManager.updateKitchenContinuity();
                }
            }
        });

        this.scene.add(this.transformControls);
    }

    setupEvents() {
        window.addEventListener('resize', () => this.onWindowResize());

        const dom = this.renderer.domElement;

        dom.addEventListener('contextmenu', (e) => e.preventDefault());

        dom.addEventListener('pointerdown', (e) => {
            this.isPointerDown = true;
            this.pointerDownButton = e.button;
            this.pointerDownPos = { x: e.clientX, y: e.clientY };
            this.lastMousePos = { x: e.clientX, y: e.clientY };

            if (e.button === 2) {
                this.startUnrealFlyMode();
            }
        });

        window.addEventListener('pointermove', (e) => {
            if (this.isRMBDown) {
                const deltaX = e.clientX - this.lastMousePos.x;
                const deltaY = e.clientY - this.lastMousePos.y;
                this.lastMousePos = { x: e.clientX, y: e.clientY };

                const sensitivity = 0.0025;
                this.yaw -= deltaX * sensitivity;
                this.pitch -= deltaY * sensitivity;

                const maxPitch = Math.PI / 2 - 0.02;
                this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));

                const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
                this.camera.quaternion.setFromEuler(euler);
            }
        });

        window.addEventListener('pointerup', (e) => {
            if (this.isRMBDown && e.button === 2) {
                this.stopUnrealFlyMode();
            }

            if (this.isPointerDown && e.button === 0) {
                this.isPointerDown = false;
                const dist = Math.hypot(e.clientX - this.pointerDownPos.x, e.clientY - this.pointerDownPos.y);
                if (dist < 5) {
                    this.handleRaycastSelect(e);
                }
            } else {
                this.isPointerDown = false;
            }
        });

        window.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
                return;
            }

            const code = e.code;
            if (code === 'KeyW') this.flyKeys.w = true;
            if (code === 'KeyS') this.flyKeys.s = true;
            if (code === 'KeyA') this.flyKeys.a = true;
            if (code === 'KeyD') this.flyKeys.d = true;
            if (code === 'KeyQ') this.flyKeys.q = true;
            if (code === 'KeyE') this.flyKeys.e = true;
            if (code === 'Space') this.flyKeys.space = true;
            if (code === 'ShiftLeft' || code === 'ShiftRight') this.flyKeys.shift = true;
        });

        window.addEventListener('keyup', (e) => {
            const code = e.code;
            if (code === 'KeyW') this.flyKeys.w = false;
            if (code === 'KeyS') this.flyKeys.s = false;
            if (code === 'KeyA') this.flyKeys.a = false;
            if (code === 'KeyD') this.flyKeys.d = false;
            if (code === 'KeyQ') this.flyKeys.q = false;
            if (code === 'KeyE') this.flyKeys.e = false;
            if (code === 'Space') this.flyKeys.space = false;
            if (code === 'ShiftLeft' || code === 'ShiftRight') this.flyKeys.shift = false;
        });

        dom.addEventListener('wheel', (e) => {
            if (this.isRMBDown) {
                if (e.deltaY < 0) {
                    this.flySpeed = Math.min(6000, this.flySpeed * 1.2);
                } else {
                    this.flySpeed = Math.max(300, this.flySpeed / 1.2);
                }
                e.preventDefault();
            }
        }, { passive: false });
    }

    startUnrealFlyMode() {
        this.isRMBDown = true;
        this.controls.enabled = false;

        const euler = new THREE.Euler(0, 0, 0, 'YXZ');
        euler.setFromQuaternion(this.camera.quaternion);
        this.yaw = euler.y;
        this.pitch = euler.x;

        this.renderer.domElement.style.cursor = 'crosshair';
    }

    stopUnrealFlyMode() {
        this.isRMBDown = false;
        this.flyKeys = { w: false, a: false, s: false, d: false, q: false, e: false, space: false, shift: false };

        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        const focusDistance = 900;
        this.controls.target.copy(this.camera.position).addScaledVector(forward, focusDistance);
        
        this.controls.enabled = true;
        this.controls.update();

        this.renderer.domElement.style.cursor = 'default';
    }

    updateUnrealFly(delta) {
        if (!this.isRMBDown) return;

        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
        const up = new THREE.Vector3(0, 1, 0);

        const moveDir = new THREE.Vector3(0, 0, 0);

        if (this.flyKeys.w) moveDir.add(forward);
        if (this.flyKeys.s) moveDir.sub(forward);
        if (this.flyKeys.d) moveDir.add(right);
        if (this.flyKeys.a) moveDir.sub(right);
        if (this.flyKeys.e || this.flyKeys.space) moveDir.add(up);
        if (this.flyKeys.q) moveDir.sub(up);

        if (moveDir.lengthSq() > 0) {
            moveDir.normalize();
            let currentSpeed = this.flySpeed;
            if (this.flyKeys.shift) currentSpeed *= this.flyBoost;

            this.camera.position.addScaledVector(moveDir, currentSpeed * delta);
        }
    }

    handleRaycastSelect(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.boardMeshes, false);

        const isMultiModifier = event.shiftKey || event.ctrlKey || event.metaKey;

        if (intersects.length > 0) {
            const hitMesh = intersects[0].object;
            // Ha a lap egy Konyha Korpusz vagy Csoport része, alapértelmezetten a szülő csoportot célozzuk
            const target = (hitMesh.userData && hitMesh.userData.parentGroup) ? hitMesh.userData.parentGroup : hitMesh;

            if (isMultiModifier) {
                this.toggleMultiSelectTarget(target);
            } else {
                this.selectBoard(target);
            }
        } else {
            if (!this.transformControls.dragging) {
                this.selectBoard(null);
            }
        }
    }

    toggleMultiSelectTarget(target) {
        if (!target) return;
        const idx = this.selectedTargets.indexOf(target);
        if (idx > -1) {
            this.selectedTargets.splice(idx, 1);
        } else {
            this.selectedTargets.push(target);
        }
        this.updateMultiSelection();
    }

    setMultiSelection(targets) {
        this.selectedTargets = targets ? [...targets] : [];
        this.updateMultiSelection();
    }

    updateMultiSelection() {
        // Körvonalak törlése
        this.boardMeshes.forEach(m => {
            if (m.userData.outlineMesh) {
                m.userData.outlineMesh.visible = false;
            }
        });

        // Kijelölt elemek körvonalainak bekapcsolása
        const lineColor = (this.selectedTargets.length > 1) ? '#f59e0b' : '#38bdf8';
        this.selectedTargets.forEach(target => {
            if (target.isGroup) {
                target.children.forEach(child => {
                    if (child.userData && child.userData.outlineMesh) {
                        child.userData.outlineMesh.visible = true;
                        if (child.userData.outlineMesh.material) {
                            child.userData.outlineMesh.material.color.set('#f59e0b');
                        }
                    }
                });
            } else if (target.userData && target.userData.outlineMesh) {
                target.userData.outlineMesh.visible = true;
                if (target.userData.outlineMesh.material) {
                    target.userData.outlineMesh.material.color.set(lineColor);
                }
            }
        });

        if (this.selectedTargets.length === 1) {
            this.selectedTarget = this.selectedTargets[0];
            this.transformControls.attach(this.selectedTarget);
        } else if (this.selectedTargets.length > 1) {
            this.selectedTarget = this.selectedTargets[this.selectedTargets.length - 1];
            this.transformControls.attach(this.selectedTarget);
        } else {
            this.selectedTarget = null;
            this.transformControls.detach();
        }

        this.updateDimensionVisualizer();

        if (this.onBoardSelected) {
            this.onBoardSelected(this.selectedTarget, this.selectedTargets);
        }
    }

    selectBoard(target) {
        this.selectedTarget = target;
        this.selectedTargets = target ? [target] : [];

        // Előző körvonalak törlése
        this.boardMeshes.forEach(m => {
            if (m.userData.outlineMesh) {
                m.userData.outlineMesh.visible = false;
            }
        });

        if (target) {
            this.transformControls.attach(target);

            const isGroupTarget = target.isGroup && target.userData && (target.userData.isCorpus || target.userData.isCustomGroup);
            const lineColor = isGroupTarget ? '#f59e0b' : '#38bdf8';

            // Ha Group (Korpusz vagy Csoport)
            if (target.isGroup) {
                target.children.forEach(child => {
                    if (child.userData && child.userData.outlineMesh) {
                        child.userData.outlineMesh.visible = true;
                        if (child.userData.outlineMesh.material) {
                            child.userData.outlineMesh.material.color.set('#f59e0b');
                        }
                    }
                });
            } else if (target.userData && target.userData.outlineMesh) {
                target.userData.outlineMesh.visible = true;
                if (target.userData.outlineMesh.material) {
                    target.userData.outlineMesh.material.color.set(lineColor);
                }
            }
        } else {
            this.transformControls.detach();
        }

        this.updateDimensionVisualizer();

        if (this.onBoardSelected) {
            this.onBoardSelected(target, this.selectedTargets);
        }
    }

    setGizmoMode(mode) {
        if (this.transformControls) {
            this.transformControls.setMode(mode);
        }
    }

    setGizmoSnap(snapMm) {
        if (this.transformControls) {
            this.transformControls.setTranslationSnap(snapMm > 0 ? snapMm : null);
            this.transformControls.setRotationSnap(THREE.MathUtils.degToRad(5));
        }
    }

    setMagneticSnap(snapMm) {
        this.magneticSnapDistance = Number(snapMm) || 0;
    }

    setBoardManager(boardManager) {
        this.boardManager = boardManager;
    }

    /**
     * Mágneses vonzás és egymáshoz pattintás (Snapping)
     */
    applyMagneticSnapping(target) {
        if (!target || this.magneticSnapDistance <= 0 || !this.boardManager) return;

        // 1. KORPUSZOK MÁGNESES ILLESZTÉSE
        if (target.userData && target.userData.isCorpus) {
            const posX = target.position.x;
            const posY = target.position.y;
            const posZ = target.position.z;

            const w1 = target.userData.width || 600;
            const h1 = target.userData.height || 720;
            const d1 = target.userData.depth || 560;
            const type1 = target.userData.config?.type || (posY >= 1000 ? 'wall' : 'base');

            let closestSnap = null;
            let minDistance = this.magneticSnapDistance;

            this.boardManager.corpora.forEach(other => {
                if (other === target) return;

                const w2 = other.userData.width || 600;
                const h2 = other.userData.height || 720;
                const d2 = other.userData.depth || 560;
                const type2 = other.userData.config?.type || (other.position.y >= 1000 ? 'wall' : 'base');

                const otherX = other.position.x;
                const otherY = other.position.y;
                const otherZ = other.position.z;
                const otherBackZ = otherZ - (d2 / 2);

                // A) FELSŐ ÉS ALSÓ SZEKRÉNY EGYMÁS FÖLÉ ILLESZTÉSE (Wall on Base)
                if (type1 === 'wall' && type2 === 'base') {
                    const baseConfig = other.userData.config || {};
                    const baseLegH = baseConfig.legs?.enabled ? Number(baseConfig.legs.height) : 0;
                    const baseCorpusH = Number(baseConfig.height) || h2;
                    const baseWtTh = baseConfig.worktop?.enabled ? Number(baseConfig.worktop.thickness) : 0;
                    const splashbackH = (baseConfig.worktop?.enabled && baseConfig.worktop?.splashback?.enabled)
                        ? Number(baseConfig.worktop.splashback.height)
                        : (baseConfig.worktop?.enabled ? 600 : 600);
                    const baseTopY = otherY + baseLegH + baseCorpusH + baseWtTh + splashbackH;
                    const overhangBack = (baseConfig.worktop?.enabled && Number(baseConfig.worktop.overhangBack) > 0)
                        ? Number(baseConfig.worktop.overhangBack)
                        : 0;
                    const snapZ = (otherBackZ - overhangBack) + (d1 / 2);

                    // X-irányú közvetlen fölé-illesztés
                    const distCenterX = Math.abs(posX - otherX);
                    if (distCenterX < minDistance * 1.5 && Math.abs(posY - baseTopY) < minDistance * 3) {
                        minDistance = distCenterX;
                        closestSnap = {
                            x: otherX,
                            y: baseTopY,
                            z: snapZ
                        };
                    }
                }

                // B) OLDALIRÁNYÚ (X) EGYMÁS MELLÉ ILLESZTÉS (Side by side)
                const isSameLevel = (type1 === type2) || Math.abs(posY - otherY) < this.magneticSnapDistance * 2;
                if (isSameLevel) {
                    const snapX_LeftToRight = otherX + (w2 / 2) + (w1 / 2);
                    const dist1 = Math.abs(posX - snapX_LeftToRight);

                    const snapX_RightToLeft = otherX - (w2 / 2) - (w1 / 2);
                    const dist2 = Math.abs(posX - snapX_RightToLeft);
                    const snapZ = otherBackZ + (d1 / 2); // Mindkettő hátfala egy síkba kerül

                    if (dist1 < minDistance) {
                        minDistance = dist1;
                        closestSnap = {
                            x: snapX_LeftToRight,
                            y: otherY,
                            z: snapZ
                        };
                    }

                    if (dist2 < minDistance) {
                        minDistance = dist2;
                        closestSnap = {
                            x: snapX_RightToLeft,
                            y: otherY,
                            z: snapZ
                        };
                    }
                }
            });

            if (closestSnap) {
                target.position.x = closestSnap.x;
                target.position.y = closestSnap.y;
                target.position.z = closestSnap.z;
            }
            return;
        }

        // 2. EGYEDI BÚTORLAPOK MÁGNESES ILLESZTÉSE
        if (target.userData && !target.userData.isCorpus) {
            const board = this.boardManager.boards.find(b => b.mesh === target);
            if (!board) return;

            const tBox = new THREE.Box3().setFromObject(target);
            const tSize = new THREE.Vector3();
            tBox.getSize(tSize);

            let bestOffset = null;
            let minDist = this.magneticSnapDistance;

            this.boardManager.boards.forEach(other => {
                if (other.id === board.id || !other.mesh) return;
                const oBox = new THREE.Box3().setFromObject(other.mesh);

                const distLeftToRight = Math.abs(tBox.min.x - oBox.max.x);
                const distRightToLeft = Math.abs(tBox.max.x - oBox.min.x);
                if (distLeftToRight < minDist) {
                    minDist = distLeftToRight;
                    bestOffset = { axis: 'x', val: oBox.max.x + tSize.x / 2 };
                }
                if (distRightToLeft < minDist) {
                    minDist = distRightToLeft;
                    bestOffset = { axis: 'x', val: oBox.min.x - tSize.x / 2 };
                }
            });

            if (bestOffset) {
                if (bestOffset.axis === 'x') target.position.x = bestOffset.val;
            }
        }
    }

    setCameraView(viewName) {
        this.currentViewMode = viewName;
        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;
        const aspect = width / height;

        const bounds = this.calculateFurnitureBounds();
        const center = bounds.center;
        const size = bounds.size;

        if (viewName === 'front' || viewName === 'top' || viewName === 'right' || viewName === 'back' || viewName === 'left') {
            // ORTOGRAFIKUS 2D MŰSZAKI NÉZET
            this.camera = this.orthoCamera;
            this.controls.object = this.orthoCamera;
            this.transformControls.camera = this.orthoCamera;
            this.controls.enableRotate = false; // 2D nézetben nincs véletlen forgatás, csak pan és zoom

            let maxDimH = 600;
            let maxDimV = 600;

            if (viewName === 'front' || viewName === 'back') {
                maxDimH = Math.max(size.x, 500);
                maxDimV = Math.max(size.y, 500);
                this.orthoCamera.up.set(0, 1, 0);
            } else if (viewName === 'top') {
                maxDimH = Math.max(size.x, 500);
                maxDimV = Math.max(size.z, 500);
                // Felülnézetben a képernyő teteje a bútor hátulja felé mutat (-Z)
                this.orthoCamera.up.set(0, 0, -1);
            } else if (viewName === 'right' || viewName === 'left') {
                maxDimH = Math.max(size.z, 500);
                maxDimV = Math.max(size.y, 500);
                this.orthoCamera.up.set(0, 1, 0);
            }

            // Keretezés ráhagyással (1.2x margó)
            const margin = 1.25;
            let orthoHalfH = (maxDimV * margin) / 2;
            let orthoHalfW = (maxDimH * margin) / 2;

            if (orthoHalfW / aspect > orthoHalfH) {
                orthoHalfH = orthoHalfW / aspect;
            } else {
                orthoHalfW = orthoHalfH * aspect;
            }

            this.orthoCamera.left = -orthoHalfW;
            this.orthoCamera.right = orthoHalfW;
            this.orthoCamera.top = orthoHalfH;
            this.orthoCamera.bottom = -orthoHalfH;
            this.orthoCamera.updateProjectionMatrix();

            const dist = 3000;
            switch (viewName) {
                case 'front':
                    this.orthoCamera.position.set(center.x, center.y, center.z + dist);
                    break;
                case 'back':
                    this.orthoCamera.position.set(center.x, center.y, center.z - dist);
                    break;
                case 'top':
                    this.orthoCamera.position.set(center.x, center.y + dist, center.z);
                    break;
                case 'right':
                    this.orthoCamera.position.set(center.x + dist, center.y, center.z);
                    break;
                case 'left':
                    this.orthoCamera.position.set(center.x - dist, center.y, center.z);
                    break;
            }

            this.controls.target.copy(center);
            this.orthoCamera.lookAt(center);
            this.controls.update();

        } else {
            // SZABAD 3D PERSPEKTIVIKUS NÉZET
            this.camera = this.perspCamera;
            this.controls.object = this.perspCamera;
            this.transformControls.camera = this.perspCamera;
            this.controls.enableRotate = true;
            this.perspCamera.up.set(0, 1, 0);

            const maxDim = Math.max(size.x, size.y, size.z, 600);
            this.perspCamera.position.set(
                center.x + maxDim * 1.3,
                center.y + maxDim * 0.9,
                center.z + maxDim * 1.6
            );
            this.controls.target.copy(center);
            this.perspCamera.lookAt(center);
            this.controls.update();
        }
    }

    calculateFurnitureBounds() {
        if (this.boardMeshes.length === 0) {
            return {
                center: new THREE.Vector3(0, 400, 0),
                size: new THREE.Vector3(800, 800, 600)
            };
        }
        const box = new THREE.Box3();
        this.boardMeshes.forEach(mesh => box.expandByObject(mesh));
        const center = new THREE.Vector3();
        box.getCenter(center);
        const size = new THREE.Vector3();
        box.getSize(size);
        return { center, size };
    }

    calculateFurnitureCenter() {
        return this.calculateFurnitureBounds().center;
    }

    // ==========================================
    // VONALVÁZ (WIREFRAME) ÉS STÚDIÓ RENDER MÓD
    // ==========================================

    toggleWireframeMode() {
        this.setWireframeMode(!this.isWireframeMode);
        return this.isWireframeMode;
    }

    setWireframeMode(enabled) {
        this.isWireframeMode = enabled;
        this.applyRenderMode();
    }

    toggleStudioMode() {
        this.setStudioMode(!this.isStudioMode);
        return this.isStudioMode;
    }

    setStudioMode(enabled) {
        this.isStudioMode = enabled;
        this.applyRenderMode();
    }

    getOrCreateStudioEnvMap() {
        if (this.studioEnvMap) return this.studioEnvMap;

        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Stúdió sötét szürke gradiens háttér (Neutral Studio Gradient)
        const bgGrad = ctx.createLinearGradient(0, 0, 0, 512);
        bgGrad.addColorStop(0, '#30343f');
        bgGrad.addColorStop(0.5, '#1e2129');
        bgGrad.addColorStop(1, '#0f1115');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 1024, 512);

        // 1. Fő lágy fényláda (Main Key Softbox - Warm Studio Light)
        const keyGrad = ctx.createRadialGradient(250, 180, 10, 250, 180, 220);
        keyGrad.addColorStop(0, 'rgba(255, 250, 240, 1.0)');
        keyGrad.addColorStop(0.4, 'rgba(255, 240, 220, 0.75)');
        keyGrad.addColorStop(0.8, 'rgba(255, 230, 200, 0.2)');
        keyGrad.addColorStop(1, 'rgba(255, 230, 200, 0)');
        ctx.fillStyle = keyGrad;
        ctx.beginPath();
        ctx.ellipse(250, 180, 200, 140, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Derítő fényláda (Fill Softbox - Cool Sky Rim)
        const fillGrad = ctx.createRadialGradient(800, 220, 10, 800, 220, 180);
        fillGrad.addColorStop(0, 'rgba(220, 240, 255, 0.9)');
        fillGrad.addColorStop(0.5, 'rgba(180, 215, 255, 0.45)');
        fillGrad.addColorStop(1, 'rgba(180, 215, 255, 0)');
        ctx.fillStyle = fillGrad;
        ctx.beginPath();
        ctx.ellipse(800, 220, 170, 120, 0, 0, Math.PI * 2);
        ctx.fill();

        // 3. Felső diffúz mennyezeti fénysáv (Top Strip Diffuser)
        const topGrad = ctx.createLinearGradient(0, 0, 0, 120);
        topGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
        topGrad.addColorStop(0.6, 'rgba(255, 255, 255, 0.3)');
        topGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = topGrad;
        ctx.fillRect(200, 0, 624, 120);

        const canvasTexture = new THREE.CanvasTexture(canvas);
        canvasTexture.mapping = THREE.EquirectangularReflectionMapping;

        const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        pmremGenerator.compileEquirectangularShader();
        this.studioEnvMap = pmremGenerator.fromEquirectangular(canvasTexture).texture;
        pmremGenerator.dispose();
        canvasTexture.dispose();

        return this.studioEnvMap;
    }

    applyRenderMode() {
        // 1. Környezeti térkép és jelenet háttér
        if (this.isStudioMode) {
            const env = this.getOrCreateStudioEnvMap();
            this.scene.environment = env;
            this.scene.background = new THREE.Color('#14171e');
            this.renderer.toneMappingExposure = 1.35;
        } else {
            this.scene.environment = null;
            this.scene.background = new THREE.Color('#1e222b');
            this.renderer.toneMappingExposure = 1.1;
        }

        // 2. Bútorlapok anyagainak és éleinek frissítése
        const wireframeMat = new THREE.MeshBasicMaterial({
            color: '#0f172a',
            wireframe: true
        });

        this.scene.traverse(obj => {
            if (obj.isMesh && obj.userData && (obj.userData.id || obj.userData.isCorpusPart)) {
                // Élkiemelés megjelenítése vonalváz módban
                obj.traverse(child => {
                    if (child.isLineSegments) {
                        child.visible = this.isWireframeMode;
                        if (child.material) {
                            child.material.color.set(this.isWireframeMode ? '#38bdf8' : '#38bdf8');
                        }
                    }
                });

                // Vonalváz vagy normál anyag
                if (this.isWireframeMode) {
                    if (!obj.userData.originalMaterial) {
                        obj.userData.originalMaterial = obj.material;
                    }
                    obj.material = wireframeMat;
                } else if (obj.userData.originalMaterial) {
                    obj.material = obj.userData.originalMaterial;
                    obj.material.needsUpdate = true;
                }
            }
        });
    }

    updateDimensionVisualizer() {
        while (this.dimensionGroup.children.length > 0) {
            const obj = this.dimensionGroup.children[0];
            this.dimensionGroup.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
        }

        if (!this.selectedTarget && (!this.selectedTargets || this.selectedTargets.length === 0)) return;

        const box = new THREE.Box3();
        if (this.selectedTargets && this.selectedTargets.length > 1) {
            this.selectedTargets.forEach(t => {
                if (t) box.expandByObject(t);
            });
        } else if (this.selectedTarget) {
            box.setFromObject(this.selectedTarget);
        } else {
            return;
        }

        const isCorpusOrGroup = (this.selectedTarget && this.selectedTarget.userData && 
            (this.selectedTarget.userData.isCorpus || this.selectedTarget.userData.isCustomGroup)) ||
            (this.selectedTargets && this.selectedTargets.length > 1);

        const boxColor = isCorpusOrGroup ? '#f59e0b' : '#38bdf8';
        const boxHelper = new THREE.Box3Helper(box, new THREE.Color(boxColor));
        this.dimensionGroup.add(boxHelper);
    }

    /**
     * 3D világkoordináta átszámítása 2D képernyő pixel pozícióvá
     */
    toScreenPosition(worldVector) {
        const vector = worldVector.clone();
        vector.project(this.camera);

        const isBehind = vector.z > 1;
        const widthHalf = 0.5 * this.container.clientWidth;
        const heightHalf = 0.5 * this.container.clientHeight;

        return {
            visible: !isBehind,
            x: (vector.x * widthHalf) + widthHalf,
            y: -(vector.y * heightHalf) + heightHalf
        };
    }

    getSnapshot(target = null, width = 400, height = 300) {
        const prevTransformVisible = this.transformControls.visible;
        const prevGridVisible = this.gridHelper.visible;
        const prevDimVisible = this.dimensionGroup.visible;

        this.transformControls.visible = false;
        this.gridHelper.visible = false;
        this.dimensionGroup.visible = false;

        // Ha van target (kijelölt elem/korpusz), elrejtünk minden egyéb bútort a fotó idejére
        const hiddenObjects = [];
        if (target) {
            this.scene.traverse((obj) => {
                if (obj.isMesh && obj !== this.gridHelper) {
                    let isPartOfTarget = false;
                    let cur = obj;
                    while (cur) {
                        if (cur === target) {
                            isPartOfTarget = true;
                            break;
                        }
                        cur = cur.parent;
                    }
                    if (!isPartOfTarget && obj.visible) {
                        obj.visible = false;
                        hiddenObjects.push(obj);
                    }
                }
            });
        }

        const box = new THREE.Box3();
        if (target) {
            box.setFromObject(target);
        } else if (this.boardMeshes.length > 0) {
            this.boardMeshes.forEach(mesh => box.expandByObject(mesh));
        } else {
            box.min.set(-300, 0, -300);
            box.max.set(300, 600, 300);
        }

        const center = new THREE.Vector3();
        box.getCenter(center);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z, 300);

        const prevTarget = this.controls.target.clone();
        const prevPos = this.camera.position.clone();

        // Szépen a cél elemre optimalizáljuk a kameraszöget
        this.camera.position.set(
            center.x + maxDim * 1.3,
            center.y + maxDim * 0.9,
            center.z + maxDim * 1.6
        );
        this.controls.target.copy(center);
        this.camera.lookAt(center);

        this.renderer.render(this.scene, this.camera);
        const dataUrl = this.renderer.domElement.toDataURL('image/jpeg', 0.92);

        // Visszaállítjuk az elrejtett elemeket
        hiddenObjects.forEach(obj => {
            obj.visible = true;
        });

        this.transformControls.visible = prevTransformVisible;
        this.gridHelper.visible = prevGridVisible;
        this.dimensionGroup.visible = prevDimVisible;
        this.camera.position.copy(prevPos);
        this.controls.target.copy(prevTarget);
        this.controls.update();

        return dataUrl;
    }

    onWindowResize() {
        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;
        const aspect = width / height;

        if (this.perspCamera) {
            this.perspCamera.aspect = aspect;
            this.perspCamera.updateProjectionMatrix();
        }

        if (this.orthoCamera) {
            const bounds = this.calculateFurnitureBounds();
            const size = bounds.size;
            let maxDimH = Math.max(size.x, size.z, 500);
            let maxDimV = Math.max(size.y, size.z, 500);
            const margin = 1.25;
            let orthoHalfH = (maxDimV * margin) / 2;
            let orthoHalfW = (maxDimH * margin) / 2;

            if (orthoHalfW / aspect > orthoHalfH) {
                orthoHalfH = orthoHalfW / aspect;
            } else {
                orthoHalfW = orthoHalfH * aspect;
            }

            this.orthoCamera.left = -orthoHalfW;
            this.orthoCamera.right = orthoHalfW;
            this.orthoCamera.top = orthoHalfH;
            this.orthoCamera.bottom = -orthoHalfH;
            this.orthoCamera.updateProjectionMatrix();
        }

        this.renderer.setSize(width, height);
    }

    /**
     * Ajtók és fiókok kinyitása / becsukása kapcsoló
     */
    toggleDoors(forceState) {
        if (typeof forceState === 'boolean') {
            this.targetDoorAnimationProgress = forceState ? 1 : 0;
        } else {
            this.targetDoorAnimationProgress = this.targetDoorAnimationProgress > 0.5 ? 0 : 1;
        }
        return this.targetDoorAnimationProgress > 0.5;
    }

    /**
     * Ajtók azonnali visszaállítása zárt állapotba
     */
    resetDoors() {
        this.targetDoorAnimationProgress = 0;
        this.doorAnimationProgress = 0;
        this.updateDoorTransforms(0);
    }

    areDoorsOpen() {
        return this.targetDoorAnimationProgress > 0.5;
    }

    /**
     * Ajtók, felnyíló frontok, fiókok és hozzájuk tartozó fogantyúk 3D transzformációja
     */
    updateDoorTransforms(progress) {
        // Easing: Smoothstep (sima gyorsulás és finom megállás)
        const ease = progress * progress * (3 - 2 * progress);

        if (!this.boardManager) return;

        // 1. Konyha Korpusz csoportok ajtói és fiókjai
        if (this.boardManager.corpora && Array.isArray(this.boardManager.corpora)) {
            this.boardManager.corpora.forEach(corpusGroup => {
                if (!corpusGroup || !corpusGroup.children) return;

                // Csoportosítjuk a front elemeket és fogantyúkat frontId szerint
                const frontGroups = new Map();
                const ungroupedMovable = [];

                corpusGroup.children.forEach(child => {
                    const uData = child.userData;
                    if (!uData) return;

                    // Eredeti helyi pozíció és rotáció rögzítése
                    if (!uData.origPosition) {
                        uData.origPosition = child.position.clone();
                        uData.origRotation = child.rotation.clone();
                    }

                    if (uData.frontId) {
                        if (!frontGroups.has(uData.frontId)) {
                            frontGroups.set(uData.frontId, []);
                        }
                        frontGroups.get(uData.frontId).push(child);
                    } else if (uData.isDoor || uData.isDrawer || uData.type === 'door' || uData.type === 'drawer') {
                        ungroupedMovable.push(child);
                    }
                });

                // FrontId-vel rendelkező elemek animálása (ajtó/fiók + hozzá tartozó fogantyú együtt mozog)
                frontGroups.forEach((members) => {
                    const driver = members.find(m => m.userData && (m.userData.isDoor || m.userData.isDrawer || m.userData.type === 'door' || m.userData.type === 'drawer'));
                    if (!driver) return;

                    const dData = driver.userData;
                    if (dData.isDoor || dData.type === 'door') {
                        const doorType = dData.doorType || 'single_left';
                        const isLiftUp = doorType === 'lift_up';
                        const isRight = doorType === 'single_right';

                        // Forgáspont kiszámítása
                        const th = Number(dData.depth) || Number(dData.thickness) || 18;
                        let pivotX = 0;
                        let pivotY = dData.origPosition.y;
                        let pivotZ = dData.origPosition.z - (th / 2); // a frontlap belső/hátsó felülete

                        if (dData.hingePivot) {
                            pivotX = Number(dData.hingePivot.x);
                            pivotY = Number(dData.hingePivot.y);
                            pivotZ = Number(dData.hingePivot.z);
                        } else if (isLiftUp) {
                            pivotX = dData.origPosition.x;
                            pivotY = dData.origPosition.y + (Number(dData.height) || 720) / 2;
                        } else if (isRight) {
                            pivotX = dData.origPosition.x + (Number(dData.width) || 600) / 2;
                        } else {
                            // single_left
                            pivotX = dData.origPosition.x - (Number(dData.width) || 600) / 2;
                        }

                        if (isLiftUp) {
                            // Felnyíló ajtó: -85 fok (-1.48 rad) X tengely körül -> felfelé és a térbe nyílik
                            const angle = -1.48 * ease;
                            const cosA = Math.cos(angle);
                            const sinA = Math.sin(angle);

                            members.forEach(m => {
                                const p0 = m.userData.origPosition;
                                const r0 = m.userData.origRotation;
                                const dy0 = p0.y - pivotY;
                                const dz0 = p0.z - pivotZ;

                                const newY = pivotY + dy0 * cosA - dz0 * sinA;
                                const newZ = pivotZ + dy0 * sinA + dz0 * cosA;

                                m.position.set(p0.x, newY, newZ);
                                m.rotation.set(r0.x + angle, r0.y, r0.z);
                            });
                        } else {
                            // Oldalra nyíló ajtó (Balos vagy Jobbos) Y tengely körül
                            // Balos nyitás: -85 fok (-1.48 rad, bal oldal fixen marad a pántnál, jobb oldal előre lendül a térbe, külső felület és fogantyú balra/előre néz)
                            // Jobbos nyitás: +85 fok (+1.48 rad, jobb oldal fixen marad a pántnál, bal oldal előre lendül a térbe, külső felület és fogantyú jobbra/előre néz)
                            const angle = (isRight ? 1.48 : -1.48) * ease;
                            const cosA = Math.cos(angle);
                            const sinA = Math.sin(angle);

                            members.forEach(m => {
                                if (m.userData && m.userData.isHinge) {
                                    // Kivetőpánt: A pántedény együtt fordul az ajtóval, a szerelőtalp a korpusz falán marad
                                    const cupGroup = m.getObjectByName('hinge_cup_group');
                                    const armGroup = m.getObjectByName('hinge_arm_group');
                                    const plateGroup = m.getObjectByName('hinge_plate_group');

                                    if (cupGroup && armGroup && plateGroup) {
                                        if (!m.userData.origCupPos) {
                                             m.userData.origCupPos = cupGroup.position.clone();
                                             m.userData.origArmPos = armGroup.position.clone();
                                             m.userData.origPlatePos = plateGroup.position.clone();
                                        }

                                        const c0 = m.userData.origCupPos;
                                        const cdx = c0.x - pivotX;
                                        const cdz = c0.z - pivotZ;

                                        const newCupX = pivotX + cdx * cosA + cdz * sinA;
                                        const newCupZ = pivotZ - cdx * sinA + cdz * cosA;

                                        cupGroup.position.set(newCupX, c0.y, newCupZ);
                                        cupGroup.rotation.y = angle;

                                        const wallX = m.userData.wallX !== undefined ? Number(m.userData.wallX) : (isRight ? pivotX - 18 : pivotX + 18);
                                        armGroup.position.set((newCupX + wallX) / 2, c0.y, (newCupZ + pivotZ) / 2);
                                        armGroup.rotation.y = angle * 0.45;

                                        plateGroup.position.copy(m.userData.origPlatePos);
                                        plateGroup.rotation.set(0, 0, 0);
                                        return;
                                    }
                                }

                                const p0 = m.userData.origPosition;
                                const r0 = m.userData.origRotation;
                                const dx0 = p0.x - pivotX;
                                const dz0 = p0.z - pivotZ;

                                const newX = pivotX + dx0 * cosA + dz0 * sinA;
                                const newZ = pivotZ - dx0 * sinA + dz0 * cosA;

                                m.position.set(newX, p0.y, newZ);
                                m.rotation.set(r0.x, r0.y + angle, r0.z);
                            });
                        }
                    } else if (dData.isDrawer || dData.type === 'drawer') {
                        // Fiók kihúzása előre (+Z irányba)
                        const slideDist = Number(dData.slideDist) || 350;
                        const deltaZ = slideDist * ease;

                        members.forEach(m => {
                            const p0 = m.userData.origPosition;
                            const r0 = m.userData.origRotation;
                            m.position.set(p0.x, p0.y, p0.z + deltaZ);
                            m.rotation.set(r0.x, r0.y, r0.z);
                        });
                    }
                });

                // Egyedi/nem csoportosított ajtók a korpuszon belül
                ungroupedMovable.forEach(m => {
                    const uData = m.userData;
                    const isDoor = uData.isDoor || uData.type === 'door';
                    const isDrawer = uData.isDrawer || uData.type === 'drawer';

                    if (isDoor) {
                        const th = Number(uData.depth) || Number(uData.thickness) || 18;
                        const isRight = uData.doorType === 'single_right';
                        const pivotX = isRight ? (uData.origPosition.x + (Number(uData.width) || 600) / 2) : (uData.origPosition.x - (Number(uData.width) || 600) / 2);
                        const pivotZ = uData.origPosition.z - (th / 2);
                        const angle = (isRight ? 1.48 : -1.48) * ease;
                        const cosA = Math.cos(angle);
                        const sinA = Math.sin(angle);

                        const p0 = uData.origPosition;
                        const r0 = uData.origRotation;
                        const dx0 = p0.x - pivotX;
                        const dz0 = p0.z - pivotZ;

                        m.position.set(pivotX + dx0 * cosA + dz0 * sinA, p0.y, pivotZ - dx0 * sinA + dz0 * cosA);
                        m.rotation.set(r0.x, r0.y + angle, r0.z);
                    } else if (isDrawer) {
                        const deltaZ = 300 * ease;
                        m.position.set(uData.origPosition.x, uData.origPosition.y, uData.origPosition.z + deltaZ);
                    }
                });
            });
        }

        // 2. Önálló (nem korpusz) ajtólapok és fiókok
        if (this.boardMeshes && Array.isArray(this.boardMeshes)) {
            this.boardMeshes.forEach(mesh => {
                const uData = mesh.userData;
                if (!uData || uData.corpusId || uData.parentGroup) return; // Már korpuszként kezeltük

                const isDoor = uData.isDoor || uData.type === 'door';
                const isDrawer = uData.isDrawer || uData.type === 'drawer';
                if (!isDoor && !isDrawer) return;

                if (!uData.origPosition) {
                    uData.origPosition = mesh.position.clone();
                    uData.origRotation = mesh.rotation.clone();
                }

                if (isDoor) {
                    const th = Number(uData.depth) || Number(uData.thickness) || 18;
                    const isRight = uData.doorType === 'single_right';
                    const pivotX = isRight ? (uData.origPosition.x + (Number(uData.width) || 600) / 2) : (uData.origPosition.x - (Number(uData.width) || 600) / 2);
                    const pivotZ = uData.origPosition.z - (th / 2);
                    const angle = (isRight ? 1.48 : -1.48) * ease;
                    const cosA = Math.cos(angle);
                    const sinA = Math.sin(angle);

                    const p0 = uData.origPosition;
                    const r0 = uData.origRotation;
                    const dx0 = p0.x - pivotX;
                    const dz0 = p0.z - pivotZ;

                    mesh.position.set(pivotX + dx0 * cosA + dz0 * sinA, p0.y, pivotZ - dx0 * sinA + dz0 * cosA);
                    mesh.rotation.set(r0.x, r0.y + angle, r0.z);
                } else if (isDrawer) {
                    const deltaZ = 300 * ease;
                    mesh.position.set(uData.origPosition.x, uData.origPosition.y, uData.origPosition.z + deltaZ);
                }
            });
        }
    }

    animate() {
        requestAnimationFrame(this.animate);
        const delta = Math.min(0.1, this.clock.getDelta());

        if (this.isRMBDown) {
            this.updateUnrealFly(delta);
        } else {
            this.controls.update();
        }

        // Ajtók nyitás / csukás animáció sima átmenete
        if (this.doorAnimationProgress !== this.targetDoorAnimationProgress) {
            const speed = 2.5; // teljes nyitás kb. 0.4 mp alatt
            if (this.doorAnimationProgress < this.targetDoorAnimationProgress) {
                this.doorAnimationProgress = Math.min(this.targetDoorAnimationProgress, this.doorAnimationProgress + speed * delta);
            } else {
                this.doorAnimationProgress = Math.max(this.targetDoorAnimationProgress, this.doorAnimationProgress - speed * delta);
            }
            this.updateDoorTransforms(this.doorAnimationProgress);
        }

        // 3D Lebegő buborék pozíciójának frissítése
        if (this.selectedTarget && this.selectedTarget.userData && this.selectedTarget.userData.isCorpus) {
            const box = new THREE.Box3().setFromObject(this.selectedTarget);
            const topCenter = new THREE.Vector3(
                (box.min.x + box.max.x) / 2,
                box.max.y + 25,
                (box.min.z + box.max.z) / 2
            );
            const screenPos = this.toScreenPosition(topCenter);
            if (this.onFloatingBubbleUpdate) {
                this.onFloatingBubbleUpdate({
                    visible: screenPos.visible,
                    x: screenPos.x,
                    y: screenPos.y,
                    corpusData: this.selectedTarget.userData
                });
            }
        } else {
            if (this.onFloatingBubbleUpdate) {
                this.onFloatingBubbleUpdate({ visible: false });
            }
        }

        this.renderer.render(this.scene, this.camera);
    }
}
