/**
 * RoomManager - Sokszög alapú L-alakú és téglalap Szobatervező
 * 
 * Jellemzők:
 * 1. Tetszőleges 2D sokszög (téglalap, L-alak, fülkés, sokszög) csúcspontok alapján.
 * 2. Padló alsó síkja pontosan Y = 0 (egy síkban a rács síkjával).
 * 3. Falakon elhelyezett ➕ gombokkal új merőleges fal húzható ki (L-alakú szobák készítése).
 * 4. Sarokpontok és falak egérrel szabadon megfoghatók és húzhatók (50 mm-es raszterhez ugrással).
 * 5. Valós idejű műszaki méretvonalak minden falszakaszon és közvetlen numerikus méretmegadás.
 * 6. 3D-ben dinamikus kamera-követő fal-átlátszóság: a belső teret kitakaró falak áttetszők.
 * 7. Fali mágneses snappelés a bútorokhoz.
 */

class RoomManager {
    constructor() {
        this.enabled = false;
        this.is2DMode = false;
        this.height = 2700;
        this.wallThickness = 100;
        this.floorThickness = 20; // Alja Y = 0, teteje Y = 20 mm

        // Szoba csúcspontjai az X-Z síkban (alapértelmezetten 4000 x 3000 mm téglalap)
        this.vertices = [
            { x: -2000, z: -1500 }, // P0: Bal-hátul
            { x: 2000, z: -1500 },  // P1: Jobb-hátul
            { x: 2000, z: 1500 },   // P2: Jobb-elöl
            { x: -2000, z: 1500 }   // P3: Bal-elöl
        ];

        // 3D elemek csoportjai
        this.roomGroup = new THREE.Group();
        this.roomGroup.name = 'room_group';

        this.wallsGroup = new THREE.Group();
        this.wallsGroup.name = 'room_walls';
        this.roomGroup.add(this.wallsGroup);

        this.floorMesh = null;
        this.wallMeshes = [];

        // 2D szerkesztő gizmók és méretvonalak
        this.handlesGroup = new THREE.Group();
        this.handlesGroup.name = 'room_handles';
        this.roomGroup.add(this.handlesGroup);

        // Interakció állapota
        this.isDragging = false;
        this.dragTarget = null; // { type: 'vertex'|'wall'|'add_wall', index: 0, ... }
        this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        this.raycaster = new THREE.Raycaster();
        this.mousePos = new THREE.Vector2();

        // Anyagok
        this.initMaterials();
        this.setupPointerInteractions();
    }

    getActiveCamera() {
        if (window.scene3D && window.scene3D.camera) {
            return window.scene3D.camera;
        }
        return this.camera || null;
    }

    getActiveRenderer() {
        if (window.scene3D && window.scene3D.renderer) {
            return window.scene3D.renderer;
        }
        return this.renderer || null;
    }

    init(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        if (this.scene) {
            this.scene.add(this.roomGroup);
        }

        this.buildRoom();
        this.roomGroup.visible = this.enabled;
    }

    initMaterials() {
        // Fal anyaga 3D-ben
        this.wallMaterial = new THREE.MeshStandardMaterial({
            color: 0xf3f4f6,
            roughness: 0.88,
            metalness: 0.05,
            transparent: true,
            opacity: 1.0,
            depthWrite: true,
            side: THREE.DoubleSide
        });

        // 2D CAD fal stílus (felülnézeti tervezőhöz)
        this.wall2DMaterial = new THREE.MeshBasicMaterial({
            color: 0x334155,
            side: THREE.DoubleSide
        });

        // Padló anyaga
        const floorCanvas = document.createElement('canvas');
        floorCanvas.width = 512;
        floorCanvas.height = 512;
        const ctx = floorCanvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = '#c5a073';
            ctx.fillRect(0, 0, 512, 512);

            ctx.strokeStyle = '#ae8757';
            ctx.lineWidth = 2;
            const plankH = 32;
            const plankW = 128;
            for (let y = 0; y < 512; y += plankH) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(512, y);
                ctx.stroke();

                const xOff = (y / plankH) % 2 === 0 ? 0 : plankW / 2;
                for (let x = xOff; x < 512; x += plankW) {
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x, y + plankH);
                    ctx.stroke();
                }
            }
        }

        const floorTexture = new THREE.CanvasTexture(floorCanvas);
        floorTexture.wrapS = THREE.RepeatWrapping;
        floorTexture.wrapT = THREE.RepeatWrapping;
        floorTexture.repeat.set(4, 3);

        this.floorMaterial = new THREE.MeshStandardMaterial({
            map: floorTexture,
            roughness: 0.65,
            metalness: 0.08
        });

        this.floor2DMaterial = new THREE.MeshBasicMaterial({
            color: 0x1e293b,
            side: THREE.DoubleSide
        });
    }

    setEnabled(enabled) {
        this.enabled = !!enabled;
        this.roomGroup.visible = this.enabled;
        if (this.enabled) {
            this.buildRoom();
        }
        return this.enabled;
    }

    isEnabled() {
        return this.enabled;
    }

    /**
     * Váltás 2D Szobatervező módba (nincs árnyék, tiszta 2D CAD, szabadon méretezhető falak)
     */
    enter2DDesignMode() {
        this.enabled = true;
        this.is2DMode = true;
        this.roomGroup.visible = true;

        this.buildRoom();

        if (window.scene3D) {
            // Árnyékok és árnyéksík kikapcsolása a tiszta 2D tervezőhöz
            if (window.scene3D.dirLight) window.scene3D.dirLight.castShadow = false;
            if (window.scene3D.shadowPlane) window.scene3D.shadowPlane.visible = false;
            if (window.scene3D.gridHelper) window.scene3D.gridHelper.visible = true;

            // Felülnézet beállítása és pontos szobára fókuszálás
            window.scene3D.setCameraView('top');
        }

        this.handlesGroup.visible = true;
        this.updateUIState();
    }

    /**
     * Visszatérés a 3D perspektivikus nézetbe
     */
    returnTo3D() {
        this.is2DMode = false;

        if (window.scene3D) {
            // Árnyékok visszakapcsolása a gyönyörű 3D térhez
            if (window.scene3D.dirLight) window.scene3D.dirLight.castShadow = true;
            if (window.scene3D.shadowPlane) window.scene3D.shadowPlane.visible = true;

            // 3D Szabad Perspektivikus nézet visszaállítása
            window.scene3D.setCameraView('iso');
        }

        this.buildRoom();
        this.updateUIState();
    }

    /**
     * Szoba visszaállítása alapértelmezett téglalapra (4000 x 3000 mm)
     */
    resetToRectangle(w = 4000, d = 3000) {
        const hw = w / 2;
        const hd = d / 2;
        this.vertices = [
            { x: -hw, z: -hd },
            { x: hw, z: -hd },
            { x: hw, z: hd },
            { x: -hw, z: hd }
        ];
        this.buildRoom();
        if (window.scene3D && this.is2DMode) {
            window.scene3D.setCameraView('top');
        }
    }

    /**
     * Gyors L-Alakú Szoba sablon generálása
     */
    createLShapeRoom(mainW = 4500, mainD = 3500, wingW = 2000, wingD = 1800) {
        // Bal felső sarokpontok L-alakban
        // P0(-2250, -1750) -> P1(2250, -1750) -> P2(2250, 0) -> P3(250, 0) -> P4(250, 1750) -> P5(-2250, 1750)
        const hw = mainW / 2;
        const hd = mainD / 2;
        const cutX = hw - wingW;
        const cutZ = hd - wingD;

        this.vertices = [
            { x: -hw, z: -hd },
            { x: hw, z: -hd },
            { x: hw, z: cutZ },
            { x: cutX, z: cutZ },
            { x: cutX, z: hd },
            { x: -hw, z: hd }
        ];

        this.buildRoom();
        if (window.scene3D && this.is2DMode) {
            window.scene3D.setCameraView('top');
        }
    }

    /**
     * Pont sokszög belsejében van-e (2D X-Z sík)
     */
    isPointInsidePolygon(px, pz, vertices = this.vertices) {
        if (!vertices || vertices.length < 3) return false;
        let inside = false;
        const n = vertices.length;
        for (let i = 0, j = n - 1; i < n; j = i++) {
            const xi = vertices[i].x, zi = vertices[i].z;
            const xj = vertices[j].x, zj = vertices[j].z;
            const intersect = ((zi > pz) !== (zj > pz))
                && (px < (xj - xi) * (pz - zi) / (zj - zi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    /**
     * Kifelé mutató egység-normálvektor számítása egy falszakaszhoz
     */
    getOutwardNormalForSegment(p1, p2) {
        const dx = p2.x - p1.x;
        const dz = p2.z - p1.z;
        const len = Math.hypot(dx, dz);
        if (len < 0.001) return new THREE.Vector3(0, 0, 1);

        const nx1 = -dz / len;
        const nz1 = dx / len;
        const nx2 = dz / len;
        const nz2 = -dx / len;

        const midX = (p1.x + p2.x) / 2;
        const midZ = (p1.z + p2.z) / 2;

        const testX1 = midX + nx1 * 20;
        const testZ1 = midZ + nz1 * 20;

        if (!this.isPointInsidePolygon(testX1, testZ1)) {
            return new THREE.Vector3(nx1, 0, nz1);
        } else {
            return new THREE.Vector3(nx2, 0, nz2);
        }
    }

    /**
     * Új fal kihúzása (Extrude) egy adott falszakaszból
     * A falszakaszt megtöri és 800 mm-es merőleges kiugrást (L-alakot) hoz létre!
     */
    extrudeWallSegment(segmentIndex) {
        const n = this.vertices.length;
        if (segmentIndex < 0 || segmentIndex >= n) return;

        const p1 = this.vertices[segmentIndex];
        const p2 = this.vertices[(segmentIndex + 1) % n];

        const dx = p2.x - p1.x;
        const dz = p2.z - p1.z;
        const len = Math.hypot(dx, dz);
        if (len < 600) return; // Túl rövid szakasz

        // Pontos merőleges normálvektor kifelé
        const outNorm = this.getOutwardNormalForSegment(p1, p2);
        const nx = outNorm.x;
        const nz = outNorm.z;
        const extrudeDist = 800; // 800 mm-es kiugrás

        // A szakasz 1/3-ánál és 2/3-ánál illesztünk be 2 új pontot
        const v1_3 = {
            x: Math.round(p1.x + dx * 0.3),
            z: Math.round(p1.z + dz * 0.3)
        };
        const v2_3 = {
            x: Math.round(p1.x + dx * 0.7),
            z: Math.round(p1.z + dz * 0.7)
        };

        const v_ext1 = {
            x: Math.round(v1_3.x + nx * extrudeDist),
            z: Math.round(v1_3.z + nz * extrudeDist)
        };
        const v_ext2 = {
            x: Math.round(v2_3.x + nx * extrudeDist),
            z: Math.round(v2_3.z + nz * extrudeDist)
        };

        // Beszúrás a sokszögbe
        this.vertices.splice(segmentIndex + 1, 0, v1_3, v_ext1, v_ext2, v2_3);

        this.buildRoom();
        this.updateUIState();
        if (window.scene3D && this.is2DMode) {
            window.scene3D.setCameraView('top');
        }
    }

    /**
     * Szoba geometriájának teljes újraépítése a csúcspontokból
     */
    buildRoom() {
        // Töröljük a meglévő hálókat
        while (this.wallsGroup.children.length > 0) {
            const obj = this.wallsGroup.children[0];
            if (obj.geometry) obj.geometry.dispose();
            this.wallsGroup.remove(obj);
        }
        this.wallMeshes = [];

        const n = this.vertices.length;
        if (n < 3) return;

        const H = this.height;
        const T = this.wallThickness;
        const FT = this.floorThickness;

        // 1. PADLÓ: THREE.ShapeGeometry a sokszög pontjaiból (alja Y = 0)
        const shape = new THREE.Shape();
        shape.moveTo(this.vertices[0].x, this.vertices[0].z);
        for (let i = 1; i < n; i++) {
            shape.lineTo(this.vertices[i].x, this.vertices[i].z);
        }
        shape.closePath();

        // Extrude a padló vastagságára (Y = 0-tól Y = FT-ig)
        const extrudeSettings = {
            depth: FT,
            bevelEnabled: false
        };
        const floorGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        floorGeo.rotateX(Math.PI / 2); // X-Z síkra fordítás
        floorGeo.translate(0, FT, 0);  // Alja pontosan Y = 0

        this.floorMesh = new THREE.Mesh(floorGeo, this.is2DMode ? this.floor2DMaterial : this.floorMaterial);
        this.floorMesh.receiveShadow = !this.is2DMode;
        this.floorMesh.userData.isRoomFloor = true;
        this.wallsGroup.add(this.floorMesh);

        // 2. FALAK: Minden szomszédos pontpár között önálló 3D fal mesh
        for (let i = 0; i < n; i++) {
            const p1 = this.vertices[i];
            const p2 = this.vertices[(i + 1) % n];

            const dx = p2.x - p1.x;
            const dz = p2.z - p1.z;
            const wallLen = Math.hypot(dx, dz);
            if (wallLen < 1) continue;

            const angle = Math.atan2(dz, dx);
            const midX = (p1.x + p2.x) / 2;
            const midZ = (p1.z + p2.z) / 2;

            // KIFELÉ mutató normálvektor
            const outNorm = this.getOutwardNormalForSegment(p1, p2);

            // Fal doboz geometria
            const wallGeo = new THREE.BoxGeometry(wallLen, H, T);
            const wallMat = this.is2DMode ? this.wall2DMaterial.clone() : this.wallMaterial.clone();
            const wallMesh = new THREE.Mesh(wallGeo, wallMat);

            // Pozíció: a fal belső síkja a sokszög belső vonalán van, kifelé terjed T vastagságban
            wallMesh.position.set(
                midX + outNorm.x * (T / 2),
                FT + H / 2,
                midZ + outNorm.z * (T / 2)
            );
            wallMesh.rotation.y = -angle;

            wallMesh.receiveShadow = !this.is2DMode;
            wallMesh.castShadow = !this.is2DMode;
            wallMesh.userData = {
                isWall: true,
                wallIndex: i,
                p1: p1,
                p2: p2,
                wallLength: wallLen,
                outwardNormal: outNorm,
                midPoint: new THREE.Vector3(midX, FT + H / 2, midZ)
            };

            this.wallsGroup.add(wallMesh);
            this.wallMeshes.push(wallMesh);
        }

        // 3. SZERKESZTŐ GIZMÓK ÉS MÉRETVONALAK
        this.buildEditorHandles();
    }

    /**
     * 2D / Felülnézeti sarok- és falgizmók, ➕ gombok és méretvonalak felépítése
     */
    buildEditorHandles() {
        while (this.handlesGroup.children.length > 0) {
            const obj = this.handlesGroup.children[0];
            if (obj.geometry) obj.geometry.dispose();
            this.handlesGroup.remove(obj);
        }

        const n = this.vertices.length;
        const gizmoY = this.height + 40;

        // 1. SAROK GIZMÓK (Minden csúcsponton egy kék fogantyú)
        const cornerMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, depthTest: false });
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x0284c7, depthTest: false });

        this.vertices.forEach((v, idx) => {
            const group = new THREE.Group();
            group.position.set(v.x, gizmoY, v.z);

            // Belső korong
            const diskGeo = new THREE.CylinderGeometry(90, 90, 20, 24);
            const disk = new THREE.Mesh(diskGeo, cornerMat.clone());
            disk.renderOrder = 999;
            group.add(disk);

            // Külső gyűrű
            const ringGeo = new THREE.RingGeometry(95, 115, 24);
            ringGeo.rotateX(-Math.PI / 2);
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.position.y = 11;
            ring.renderOrder = 1000;
            group.add(ring);

            group.userData = {
                isRoomHandle: true,
                handleType: 'vertex',
                vertexIndex: idx,
                cursor: 'move'
            };

            this.handlesGroup.add(group);
        });

        // 2. FAL-KÖZÉPPONT GIZMÓK ÉS ➕ GOMBOK
        const wallMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, depthTest: false });

        for (let i = 0; i < n; i++) {
            const p1 = this.vertices[i];
            const p2 = this.vertices[(i + 1) % n];
            const midX = (p1.x + p2.x) / 2;
            const midZ = (p1.z + p2.z) / 2;
            const dx = p2.x - p1.x;
            const dz = p2.z - p1.z;
            const wallLen = Math.hypot(dx, dz);
            const angle = Math.atan2(dz, dx);

            // Falmozgató narancs sáv
            const barGeo = new THREE.BoxGeometry(Math.min(180, wallLen * 0.4), 20, 40);
            const barMesh = new THREE.Mesh(barGeo, wallMat.clone());
            barMesh.position.set(midX, gizmoY, midZ);
            barMesh.rotation.y = -angle;
            barMesh.renderOrder = 999;
            barMesh.userData = {
                isRoomHandle: true,
                handleType: 'wall',
                wallIndex: i,
                cursor: 'grab'
            };
            this.handlesGroup.add(barMesh);

            // ➕ ZÖLD GOMB: ÚJ FAL KIHÚZÁSA / L-ALAKÍTÁS
            const plusSprite = this.createPlusButtonSprite(i);
            // Kicsivel a fal mellett pontosan KÍVÜLRE pozicionálva
            const outNorm = this.getOutwardNormalForSegment(p1, p2);
            plusSprite.position.set(midX + outNorm.x * 120, gizmoY + 15, midZ + outNorm.z * 120);
            plusSprite.renderOrder = 2000;
            this.handlesGroup.add(plusSprite);

            // MÉRETVONALAK (KÓTÁZÁS KÍVÜL - távolabb, hogy ne fedje a plusz gombot)
            this.addWallDimensionLine(p1, p2, wallLen, angle, outNorm.x, outNorm.z, gizmoY, i);
        }

        // Csak felső nézetben és 2D módban láthatóak a gizmók
        const cam = this.getActiveCamera();
        const isTop = (cam && cam.isOrthographicCamera && Math.abs(cam.up.z) > 0.8) || this.is2DMode;
        this.handlesGroup.visible = isTop;
    }

    createPlusButtonSprite(wallIndex) {
        const canvas = document.createElement('canvas');
        canvas.width = 96;
        canvas.height = 96;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            // Zöld kör
            ctx.fillStyle = '#10b981';
            ctx.beginPath();
            ctx.arc(48, 48, 44, 0, Math.PI * 2);
            ctx.fill();

            // Fehér szegély
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 6;
            ctx.stroke();

            // Fehér plusz jel
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(43, 22, 10, 52);
            ctx.fillRect(22, 43, 52, 10);
        }

        const texture = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(130, 130, 1);
        sprite.userData = {
            isRoomHandle: true,
            handleType: 'add_wall',
            wallIndex: wallIndex,
            cursor: 'pointer',
            desc: '➕ Új falrész kihúzása'
        };
        return sprite;
    }

    addWallDimensionLine(p1, p2, len, angle, normX, normZ, gizmoY, wallIndex) {
        const offset = 340; // 340 mm-re a faltól kívül, hogy elkerülje a plusz gombot
        const start = new THREE.Vector3(p1.x + normX * offset, gizmoY, p1.z + normZ * offset);
        const end = new THREE.Vector3(p2.x + normX * offset, gizmoY, p2.z + normZ * offset);

        const lineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2, depthTest: false });
        const lineGeo = new THREE.BufferGeometry().setFromPoints([start, end]);
        const line = new THREE.Line(lineGeo, lineMat);
        line.renderOrder = 998;
        this.handlesGroup.add(line);

        // Kótajelek a végeken
        const tickLen = 60;
        const t1a = new THREE.Vector3(start.x - normX * tickLen / 2, start.y, start.z - normZ * tickLen / 2);
        const t1b = new THREE.Vector3(start.x + normX * tickLen / 2, start.y, start.z + normZ * tickLen / 2);
        const t2a = new THREE.Vector3(end.x - normX * tickLen / 2, end.y, end.z - normZ * tickLen / 2);
        const t2b = new THREE.Vector3(end.x + normX * tickLen / 2, end.y, end.z + normZ * tickLen / 2);

        this.handlesGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([t1a, t1b]), lineMat));
        this.handlesGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([t2a, t2b]), lineMat));

        // Méretcímke Sprite
        const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        const text = `${Math.round(len)} mm`;
        const sprite = this.createDimensionSprite(text, wallIndex);
        sprite.position.copy(midPoint);
        sprite.position.y += 10;
        sprite.renderOrder = 999;
        this.handlesGroup.add(sprite);
    }

    createDimensionSprite(text, wallIndex) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 72;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.roundRect(4, 4, 248, 64, 12);
            ctx.fill();
            ctx.stroke();

            ctx.font = 'bold 30px "Segoe UI", Roboto, sans-serif';
            ctx.fillStyle = '#f8fafc';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, 128, 36);
        }

        const texture = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(300, 84, 1);
        sprite.userData = {
            isRoomDimensionBadge: false, // Csak tájékoztató jellegű felirat, nem nyit promptot
            cursor: 'default'
        };
        return sprite;
    }

    /**
     * DINAMIKUS KAMERA-KÖVETŐ FAL-ELTŰNÉS
     * 3D nézetben a szobába való belátást akadályozó (kamera felé eső) falak
     * automatikusan eltűnnek, hogy a felhasználó mindig tökéletesen belásson a szobába!
     */
    updateWallVisibilities(camera) {
        if (!this.enabled || !camera) return;

        const isTop = (camera.isOrthographicCamera && Math.abs(camera.up.z) > 0.8) || this.is2DMode;
        this.handlesGroup.visible = isTop;

        if (this.is2DMode) {
            // 2D felülnézeti CAD módban minden fal tömör és látható
            this.wallMeshes.forEach(mesh => {
                mesh.visible = true;
                mesh.material.opacity = 1.0;
                mesh.material.transparent = false;
                mesh.material.depthWrite = true;
            });
            return;
        }

        // 3D Perspektivikus / Izometrikus nézetben:
        // A kamera felé néző, szobabelsőt kitakaró elülső falak TELJESEN ELTŰNNEK,
        // így a felhasználó bármilyen szögből szabadon belát a szobába!
        const camPos = camera.position;

        // Ellenőrizzük, hogy a kamera a szoba belsejében tartózkodik-e
        const isCamInside = this.isPointInsidePolygon(camPos.x, camPos.z) && camPos.y >= 0 && camPos.y <= this.height;

        this.wallMeshes.forEach(mesh => {
            if (!mesh || !mesh.userData) return;
            const norm = mesh.userData.outwardNormal;
            if (!norm) return;

            if (isCamInside) {
                // Ha a kamera a szobán belül van, minden fal látható körben
                mesh.visible = true;
                mesh.material.opacity = 1.0;
                mesh.material.transparent = false;
                mesh.material.depthWrite = true;
                return;
            }

            // Távolság a fal külső síkjától a kamera felé a normálvektor mentén
            const toCamX = camPos.x - mesh.position.x;
            const toCamZ = camPos.z - mesh.position.z;
            const distFromPlane = toCamX * norm.x + toCamZ * norm.z;

            // Ha a kamera a fal külső oldalán van (> 10mm), akkor a fal a szoba belseje
            // és a kamera között áll, kitakarva a látványt -> TELJESEN ELTŰNIK!
            // Ha a kamera mögötte / belső oldalán van, akkor háttérfal -> LÁTHATÓ MARAD!
            const shouldHide = distFromPlane > 10;

            mesh.visible = !shouldHide;
            if (!shouldHide) {
                mesh.material.opacity = 1.0;
                mesh.material.transparent = false;
                mesh.material.depthWrite = true;
            }
        });
    }

    getCenter() {
        let sx = 0, sz = 0;
        this.vertices.forEach(v => { sx += v.x; sz += v.z; });
        return new THREE.Vector3(sx / this.vertices.length, this.height / 2, sz / this.vertices.length);
    }

    getBoundingBox() {
        let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
        this.vertices.forEach(v => {
            if (v.x < minX) minX = v.x;
            if (v.x > maxX) maxX = v.x;
            if (v.z < minZ) minZ = v.z;
            if (v.z > maxZ) maxZ = v.z;
        });
        return { minX, maxX, minZ, maxZ, width: maxX - minX, depth: maxZ - minZ };
    }

    getInnerBounds() {
        const bb = this.getBoundingBox();
        return {
            leftX: bb.minX,
            rightX: bb.maxX,
            backZ: bb.minZ,
            frontZ: bb.maxZ,
            floorY: this.floorThickness, // 20 mm
            width: bb.width,
            depth: bb.depth,
            height: this.height
        };
    }

    updateUIState() {
        const hud = document.getElementById('room-editor-hud');
        if (hud) hud.style.display = this.enabled ? 'block' : 'none';

        const btnReturn3D = document.getElementById('btn-return-3d');
        if (btnReturn3D) btnReturn3D.style.display = this.is2DMode ? 'flex' : 'none';

        const btnToggleRoom = document.getElementById('btn-toggle-room');
        if (btnToggleRoom) {
            btnToggleRoom.classList.toggle('active', this.enabled);
            btnToggleRoom.classList.toggle('btn-primary', this.enabled);
        }

        const btnToolbar2D = document.getElementById('btn-toolbar-2d-floorplan');
        if (btnToolbar2D) {
            btnToolbar2D.classList.toggle('active', this.is2DMode);
            btnToolbar2D.classList.toggle('btn-primary', this.is2DMode);
        }

        const label = document.getElementById('current-view-mode-label');
        if (label) {
            label.textContent = this.is2DMode ? '👁️ Nézet: 📐 2D Alaprajz' : '👁️ Nézet: 📐 3D Perspektíva';
        }

        const bb = this.getBoundingBox();
        const inpW = document.getElementById('room-input-width');
        const inpD = document.getElementById('room-input-depth');
        const inpH = document.getElementById('room-input-height');
        if (inpW) inpW.value = Math.round(bb.width);
        if (inpD) inpD.value = Math.round(bb.depth);
        if (inpH) inpH.value = Math.round(this.height);
    }

    /**
     * Egér eseménykezelők a szabad sarok- és falmozgatáshoz felülnézetben
     */
    setupPointerInteractions() {
        const getDom = () => (this.getActiveRenderer() ? this.getActiveRenderer().domElement : null);

        const getHandleAtEvent = (e) => {
            const dom = getDom();
            const cam = this.getActiveCamera();
            if (!this.enabled || !this.handlesGroup.visible || !dom || !cam) return null;

            const rect = dom.getBoundingClientRect();
            this.mousePos.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            this.mousePos.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            this.raycaster.setFromCamera(this.mousePos, cam);
            const hits = this.raycaster.intersectObjects(this.handlesGroup.children, true);
            // 1. Először a zöld ➕ gombot keressük, hogy semmi se takarhassa ki!
            for (const hit of hits) {
                let cur = hit.object;
                while (cur && cur !== this.handlesGroup) {
                    if (cur.userData && cur.userData.handleType === 'add_wall') {
                        return cur;
                    }
                    cur = cur.parent;
                }
            }
            // 2. Másodszor a sarokpontokat és falgizmókat
            for (const hit of hits) {
                let cur = hit.object;
                while (cur && cur !== this.handlesGroup) {
                    if (cur.userData && cur.userData.isRoomHandle && cur.userData.handleType) {
                        return cur;
                    }
                    cur = cur.parent;
                }
            }
            return null;
        };

        window.addEventListener('pointermove', (e) => {
            const dom = getDom();
            if (!dom) return;

            if (this.isDragging && this.dragTarget) {
                this.handleDragMove(e);
                return;
            }

            const handle = getHandleAtEvent(e);
            if (handle && handle.userData) {
                dom.style.cursor = handle.userData.cursor || 'pointer';
            } else if (dom.style.cursor === 'move' || dom.style.cursor === 'grab' || dom.style.cursor === 'pointer') {
                dom.style.cursor = 'default';
            }
        });

        window.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return; // Csak bal klikk
            const handle = getHandleAtEvent(e);
            if (!handle) return;

            const uData = handle.userData;

            // 1. Kattintás a ➕ GOMBRA: új falrész azonnali kihúzása (MÉRETMEGADÁS NÉLKÜL!)
            if (uData.handleType === 'add_wall') {
                e.stopPropagation();
                e.preventDefault();
                this.extrudeWallSegment(uData.wallIndex);
                if (window.app && window.app.showToast) {
                    window.app.showToast('➕ Új falrész sikeresen kihúzva! A sarkok szabadon mozgathatók.', 'success');
                }
                return;
            }

            // 2. SAROKPONT VAGY FAL MEGFOGÁSA ÉS HÚZÁSA
            if (uData.isRoomHandle) {
                e.stopPropagation();
                e.preventDefault();

                this.isDragging = true;
                this.dragTarget = {
                    type: uData.handleType,
                    vertexIndex: uData.vertexIndex,
                    wallIndex: uData.wallIndex,
                    startPos: { clientX: e.clientX, clientY: e.clientY },
                    origVertices: JSON.parse(JSON.stringify(this.vertices))
                };

                // Kamera vezérlők ideiglenes tiltása húzás közben
                if (window.scene3D && window.scene3D.controls) {
                    window.scene3D.controls.enabled = false;
                }
                const dom = getDom();
                if (dom) dom.style.cursor = 'grabbing';
            }
        }, { capture: true });

        const endDrag = () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.dragTarget = null;
                if (window.scene3D && window.scene3D.controls) {
                    window.scene3D.controls.enabled = true;
                }
                const dom = getDom();
                if (dom) dom.style.cursor = 'default';
                this.updateUIState();
            }
        };

        window.addEventListener('pointerup', endDrag);
        window.addEventListener('pointercancel', endDrag);
    }

    /**
     * Egér mozgatása húzás közben
     */
    handleDragMove(e) {
        const dom = this.getActiveRenderer()?.domElement;
        const cam = this.getActiveCamera();
        if (!dom || !cam || !this.dragTarget) return;

        const rect = dom.getBoundingClientRect();
        this.mousePos.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mousePos.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mousePos, cam);
        const hitPoint = new THREE.Vector3();
        if (!this.raycaster.ray.intersectPlane(this.dragPlane, hitPoint)) return;

        const snapStep = e.shiftKey ? 10 : 50; // 50 mm-es raszterhez ugrás
        const snapX = Math.round(hitPoint.x / snapStep) * snapStep;
        const snapZ = Math.round(hitPoint.z / snapStep) * snapStep;

        if (this.dragTarget.type === 'vertex') {
            // Egyetlen sarokpont szabad mozgatása
            const idx = this.dragTarget.vertexIndex;
            if (this.vertices[idx]) {
                this.vertices[idx].x = snapX;
                this.vertices[idx].z = snapZ;
                this.buildRoom();
            }
        } else if (this.dragTarget.type === 'wall') {
            // Teljes fal mozgatása párhuzamosan
            const idx = this.dragTarget.wallIndex;
            const n = this.vertices.length;
            const orig1 = this.dragTarget.origVertices[idx];
            const orig2 = this.dragTarget.origVertices[(idx + 1) % n];

            const dx = orig2.x - orig1.x;
            const dz = orig2.z - orig1.z;
            const len = Math.hypot(dx, dz);
            if (len < 1) return;

            const normX = -dz / len;
            const normZ = dx / len;

            // Merőleges vetület számítása
            const midOrigX = (orig1.x + orig2.x) / 2;
            const midOrigZ = (orig1.z + orig2.z) / 2;
            const vX = snapX - midOrigX;
            const vZ = snapZ - midOrigZ;
            const proj = Math.round((vX * normX + vZ * normZ) / snapStep) * snapStep;

            this.vertices[idx].x = orig1.x + normX * proj;
            this.vertices[idx].z = orig1.z + normZ * proj;
            this.vertices[(idx + 1) % n].x = orig2.x + normX * proj;
            this.vertices[(idx + 1) % n].z = orig2.z + normZ * proj;

            this.buildRoom();
        }
    }

    /**
     * Egy konkrét falszakasz pontos hosszának beállítása
     */
    setWallLength(wallIdx, newLength) {
        const n = this.vertices.length;
        const p1 = this.vertices[wallIdx];
        const p2 = this.vertices[(wallIdx + 1) % n];
        const dx = p2.x - p1.x;
        const dz = p2.z - p1.z;
        const curLen = Math.hypot(dx, dz);
        if (curLen < 1) return;

        const ratio = newLength / curLen;
        p2.x = Math.round(p1.x + dx * ratio);
        p2.z = Math.round(p1.z + dz * ratio);

        this.buildRoom();
    }

    /**
     * Szoba befoglaló méreteinek beállítása (arányos átméretezés)
     */
    setDimensions(width, depth, height) {
        if (Number.isFinite(height) && height >= 1500 && height <= 5000) {
            this.height = Math.round(height);
        }
        const bb = this.getBoundingBox();
        const curW = bb.width || 4000;
        const curD = bb.depth || 3000;

        const targetW = (Number.isFinite(width) && width >= 1000) ? Math.round(width) : curW;
        const targetD = (Number.isFinite(depth) && depth >= 1000) ? Math.round(depth) : curD;

        const scaleX = targetW / curW;
        const scaleZ = targetD / curD;

        const midX = (bb.minX + bb.maxX) / 2;
        const midZ = (bb.minZ + bb.maxZ) / 2;

        this.vertices.forEach(v => {
            v.x = Math.round(midX + (v.x - midX) * scaleX);
            v.z = Math.round(midZ + (v.z - midZ) * scaleZ);
        });

        this.buildRoom();
        this.updateUIState();
    }
}

// Globális példány
window.roomManager = new RoomManager();
