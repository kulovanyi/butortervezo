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
        this.selectedTarget = null; // Mesh VAGY Group (Korpusz)
        this.snapDistance = 10; // mm
        this.magneticSnapDistance = 30; // Mágneses vonzás alapértelmezett értéke (mm)
        this.boardManager = null;

        this.init();
    }

    init() {
        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;

        // 1. Jelenet
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color('#1e222b');

        // 2. Kamera
        this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 20000);
        this.camera.position.set(1200, 900, 1600);

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

        if (intersects.length > 0) {
            const hitMesh = intersects[0].object;
            // Ha a lap egy Konyha Korpusz része, a teljes Korpusz egységet jelöljük ki!
            if (hitMesh.userData && hitMesh.userData.parentGroup) {
                this.selectBoard(hitMesh.userData.parentGroup);
            } else {
                this.selectBoard(hitMesh);
            }
        } else {
            if (!this.transformControls.dragging) {
                this.selectBoard(null);
            }
        }
    }

    selectBoard(target) {
        this.selectedTarget = target;

        // Előző körvonalak törlése
        this.boardMeshes.forEach(m => {
            if (m.userData.outlineMesh) {
                m.userData.outlineMesh.visible = false;
            }
        });

        if (target) {
            this.transformControls.attach(target);

            // Ha egyedi Mesh
            if (target.userData && target.userData.outlineMesh) {
                target.userData.outlineMesh.visible = true;
            }
        } else {
            this.transformControls.detach();
        }

        this.updateDimensionVisualizer();

        if (this.onBoardSelected) {
            this.onBoardSelected(target);
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
            const w1 = target.userData.width || 600;
            const h1 = target.userData.height || 720;
            const d1 = target.userData.depth || 560;

            const posX = target.position.x;
            const posY = target.position.y;
            const posZ = target.position.z;

            let closestSnap = null;
            let minDistance = this.magneticSnapDistance;

            this.boardManager.corpora.forEach(other => {
                if (other === target) return;

                const w2 = other.userData.width || 600;
                const h2 = other.userData.height || 720;
                const d2 = other.userData.depth || 560;

                const otherX = other.position.x;
                const otherY = other.position.y;
                const otherZ = other.position.z;

                // Oldalirányú (X) illeszkedések:
                // a) Cél bal oldala az egyéb jobb oldalához
                const snapX_LeftToRight = otherX + (w2 / 2) + (w1 / 2);
                const dist1 = Math.abs(posX - snapX_LeftToRight);

                // b) Cél jobb oldala az egyéb bal oldalához
                const snapX_RightToLeft = otherX - (w2 / 2) - (w1 / 2);
                const dist2 = Math.abs(posX - snapX_RightToLeft);

                if (dist1 < minDistance) {
                    minDistance = dist1;
                    closestSnap = {
                        x: snapX_LeftToRight,
                        y: otherY,
                        z: otherZ
                    };
                }

                if (dist2 < minDistance) {
                    minDistance = dist2;
                    closestSnap = {
                        x: snapX_RightToLeft,
                        y: otherY,
                        z: otherZ
                    };
                }
            });

            if (closestSnap) {
                target.position.x = closestSnap.x;
                // Ha a magasság (Y) és a mélység (Z) is közel van, simítsuk egy síkba
                if (Math.abs(posY - closestSnap.y) <= this.magneticSnapDistance * 2) {
                    target.position.y = closestSnap.y;
                }
                if (Math.abs(posZ - closestSnap.z) <= this.magneticSnapDistance * 2) {
                    target.position.z = closestSnap.z;
                }
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
        const center = this.calculateFurnitureCenter();
        const dist = 1600;

        switch (viewName) {
            case 'front':
                this.camera.position.set(center.x, center.y, center.z + dist);
                break;
            case 'back':
                this.camera.position.set(center.x, center.y, center.z - dist);
                break;
            case 'top':
                this.camera.position.set(center.x, center.y + dist, center.z + 0.01);
                break;
            case 'right':
                this.camera.position.set(center.x + dist, center.y, center.z);
                break;
            case 'left':
                this.camera.position.set(center.x - dist, center.y, center.z);
                break;
            case 'iso':
            default:
                this.camera.position.set(center.x + 1200, center.y + 800, center.z + 1400);
                break;
        }

        this.controls.target.copy(center);
        this.camera.lookAt(center);
        this.controls.update();
    }

    calculateFurnitureCenter() {
        if (this.boardMeshes.length === 0) {
            return new THREE.Vector3(0, 400, 0);
        }
        const box = new THREE.Box3();
        this.boardMeshes.forEach(mesh => box.expandByObject(mesh));
        const center = new THREE.Vector3();
        box.getCenter(center);
        return center;
    }

    updateDimensionVisualizer() {
        while (this.dimensionGroup.children.length > 0) {
            const obj = this.dimensionGroup.children[0];
            this.dimensionGroup.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
        }

        if (!this.selectedTarget) return;

        const box = new THREE.Box3().setFromObject(this.selectedTarget);
        const boxColor = (this.selectedTarget.userData && this.selectedTarget.userData.isCorpus) ? '#f59e0b' : '#38bdf8';
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
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    animate() {
        requestAnimationFrame(this.animate);
        const delta = Math.min(0.1, this.clock.getDelta());

        if (this.isRMBDown) {
            this.updateUnrealFly(delta);
        } else {
            this.controls.update();
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
