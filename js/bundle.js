// ==========================================================================
// 3D Bútortervező - STANDALONE BUNDLE (Működik file:/// és http:// alatt is)
// ==========================================================================
(function() {
'use strict';

// --- FILE: textures.js ---
/**
 * Textúra és Anyagkezelő modul (textures.js)
 * Magas minőségű procedurális faerezetek, uni színek, beton és egyedi textúra generátor
 */

const MaterialManager = {
    textures: {},
    customTextures: {},

    init() {
        this.generateDefaultTextures();
    },

    /**
     * Procedurális textúrák létrehozása HTML5 Canvas segítségével
     */
    generateDefaultTextures() {
        // --- 1. FRONT / BÚTORLAP TEXTÚRÁK (textures/front/) ---
        const frontFiles = [
            { id: 'front_3025', name: 'Front 3025', file: '3025.jpg' },
            { id: 'front_a865', name: 'Front A865', file: 'A865.jpg' },
            { id: 'front_k001', name: 'Front K001', file: 'K001.jpg' },
            { id: 'front_k002', name: 'Front K002', file: 'K002.jpg' },
            { id: 'front_k003', name: 'Front K003', file: 'K003.jpg' },
            { id: 'front_k004', name: 'Front K004', file: 'K004.jpg' },
            { id: 'front_k536', name: 'Front K536', file: 'K536.jpg' }
        ];

        frontFiles.forEach(f => {
            this.textures[f.id] = this.createFileTexture({
                id: f.id,
                name: f.name,
                path: `textures/front/${f.file}`,
                category: 'front',
                type: 'wood',
                roughness: 0.65,
                metalness: 0.05
            });
        });

        // --- 2. MUNKALAP TEXTÚRÁK (textures/worktop/) ---
        const worktopFiles = [
            { id: 'wt_3025', name: 'Munkalap 3025', file: '3025.jpg' },
            { id: 'wt_4299', name: 'Munkalap 4299', file: '4299.jpg' },
            { id: 'wt_k002', name: 'Munkalap K002', file: 'K002.jpg' },
            { id: 'wt_k003', name: 'Munkalap K003', file: 'K003.jpg' },
            { id: 'wt_k092', name: 'Munkalap K092', file: 'K092.jpg' },
            { id: 'wt_k2738', name: 'Munkalap K2738', file: 'K2738.jpg' },
            { id: 'wt_k367', name: 'Munkalap K367', file: 'K367.jpg' },
            { id: 'wt_k536', name: 'Munkalap K536', file: 'K536.jpg' },
            { id: 'wt_k551', name: 'Munkalap K551', file: 'K551.jpg' },
            { id: 'wt_k552', name: 'Munkalap K552', file: 'K552.jpg' },
            { id: 'wt_k553', name: 'Munkalap K553', file: 'K553.jpg' },
            { id: 'wt_k756', name: 'Munkalap K756', file: 'K756.jpg' },
            { id: 'wt_k758', name: 'Munkalap K758', file: 'K758.jpg' },
            { id: 'wt_k820', name: 'Munkalap K820', file: 'K820.jpg' }
        ];

        worktopFiles.forEach(w => {
            this.textures[w.id] = this.createFileTexture({
                id: w.id,
                name: w.name,
                path: `textures/worktop/${w.file}`,
                category: 'worktop',
                type: 'stone',
                roughness: 0.6,
                metalness: 0.05
            });
        });

        // Fehér Hátfal Textúra (White Matte) - MINDIG ALAPÉRTELMEZETT A HÁTFALHOZ
        this.textures['white_matte'] = this.createSolidTexture({
            id: 'white_matte',
            color: '#f8f9fa',
            noiseAmount: 2,
            name: 'Prémium Fehér',
            type: 'solid',
            category: 'front'
        });

        // Rozsdamentes Acél (Készülékekhez)
        this.textures['stainless_steel'] = this.createSolidTexture({
            id: 'stainless_steel',
            color: '#a8b0b8',
            noiseAmount: 3,
            name: 'Rozsdamentes Acél',
            type: 'metal',
            metalness: 0.85,
            roughness: 0.25,
            category: 'appliance'
        });

        // Fekete Sütő Üveg (Készülékekhez)
        this.textures['oven_black_glass'] = this.createSolidTexture({
            id: 'oven_black_glass',
            color: '#111317',
            noiseAmount: 1,
            name: 'Fekete Üveg Sütőfront',
            type: 'glass',
            metalness: 0.1,
            roughness: 0.1,
            category: 'appliance'
        });

        // Indukciós Főzőlap Üveg (Készülékekhez)
        this.textures['cooktop_glass'] = this.createSolidTexture({
            id: 'cooktop_glass',
            color: '#0a0d12',
            noiseAmount: 1,
            name: 'Indukciós Főzőlap',
            type: 'glass',
            metalness: 0.2,
            roughness: 0.1,
            category: 'appliance'
        });

        // Króm Fém Fogantyú (Készülékekhez)
        this.textures['metal_chrome'] = this.createSolidTexture({
            id: 'metal_chrome',
            color: '#d1d5db',
            noiseAmount: 2,
            name: 'Króm Fém',
            type: 'metal',
            metalness: 0.95,
            roughness: 0.15,
            category: 'appliance'
        });
    },

    /**
     * Képfájl (JPG/PNG/WEBP) textúra létrehozása Three.js-hez
     */
    createFileTexture(options) {
        const loader = new THREE.TextureLoader();
        const texture = loader.load(options.path, (tex) => {
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            tex.generateMipmaps = true;
            tex.minFilter = THREE.LinearMipmapLinearFilter;
            tex.magFilter = THREE.LinearFilter;
            tex.needsUpdate = true;
        });
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;

        return {
            id: options.id,
            name: options.name,
            texture: texture,
            dataUrl: options.path,
            roughness: options.roughness !== undefined ? options.roughness : 0.65,
            metalness: options.metalness !== undefined ? options.metalness : 0.05,
            category: options.category || 'front',
            type: options.type || 'wood'
        };
    },

    /**
     * Textúrák szűrése kategória alapján ('front' vagy 'worktop')
     */
    getTexturesByCategory(category = 'front') {
        const result = {};
        Object.keys(this.textures).forEach(k => {
            const t = this.textures[k];
            if (category === 'all' || t.category === category) {
                result[k] = t;
            }
        });
        return result;
    },

    /**
     * Valósághű fa erezet generálása Canvas-on
     */
    createWoodTexture(options) {
        const width = 1024;
        const height = 1024;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // 1. Alapszín és finom függőleges szálirányú színátmenetek (deszka hatás)
        ctx.fillStyle = options.baseColor;
        ctx.fillRect(0, 0, width, height);

        // Deszkasávok és tónusváltakozás
        const plankCount = 4;
        const plankW = width / plankCount;
        for (let p = 0; p < plankCount; p++) {
            ctx.fillStyle = (p % 2 === 0) ? options.grainColor : options.ringColor;
            ctx.globalAlpha = 0.06 + Math.random() * 0.05;
            ctx.fillRect(p * plankW, 0, plankW, height);
        }

        // 2. Széles évgyűrű-sávok és hullámok (Growth rings)
        const ringBands = 30;
        for (let r = 0; r < ringBands; r++) {
            const y = (height / ringBands) * r + (Math.random() - 0.5) * 20;
            ctx.fillStyle = (r % 2 === 0) ? options.grainColor : options.ringColor;
            ctx.globalAlpha = 0.12 + Math.random() * 0.14;

            ctx.beginPath();
            ctx.moveTo(0, y);
            const freq = 0.002 + Math.random() * 0.003;
            const amp = 15 + Math.random() * 35;
            for (let x = 0; x <= width; x += 15) {
                const curY = y + Math.sin(x * freq) * amp;
                ctx.lineTo(x, curY);
            }
            ctx.lineTo(width, y + 25);
            ctx.lineTo(0, y + 25);
            ctx.closePath();
            ctx.fill();
        }

        // 3. Finom, éles faerezet szálak (Wood Grain Fibers)
        const numLines = 800;
        for (let i = 0; i < numLines; i++) {
            const y = Math.random() * height;
            const alpha = 0.12 + Math.random() * 0.28;
            ctx.strokeStyle = Math.random() > 0.4 ? options.grainColor : options.ringColor;
            ctx.globalAlpha = alpha;
            ctx.lineWidth = 0.8 + Math.random() * 2.8;

            ctx.beginPath();
            ctx.moveTo(0, y);

            let currentY = y;
            const waveFreq = 0.003 + Math.random() * 0.005;
            const waveAmp = 6 + Math.random() * 20;

            for (let x = 0; x <= width; x += 8) {
                currentY = y + Math.sin(x * waveFreq) * waveAmp + (Math.random() - 0.5) * 1.5;
                ctx.lineTo(x, currentY);
            }
            ctx.stroke();
        }

        // 4. Finom hosszirányú fa pórusok és ray flecks
        ctx.globalAlpha = 0.18;
        for (let x = 0; x < width; x += 2) {
            if (Math.random() > 0.45) {
                ctx.fillStyle = options.ringColor;
                ctx.fillRect(x, Math.random() * 20, 1, height);
            }
        }

        // 5. Természetes görcsök és évgyűrű kavargások (Wood Knots)
        const knots = 2 + Math.floor(Math.random() * 2);
        for (let k = 0; k < knots; k++) {
            const kx = 180 + Math.random() * (width - 360);
            const ky = 180 + Math.random() * (height - 360);
            const radiusX = 20 + Math.random() * 30;
            const radiusY = 50 + Math.random() * 70;

            // Külső szálkavargás a görcs körül
            for (let ring = radiusY + 30; ring >= 10; ring -= 8) {
                ctx.strokeStyle = (ring % 16 === 0) ? options.ringColor : options.grainColor;
                ctx.globalAlpha = 0.25;
                ctx.lineWidth = 2.0;
                ctx.beginPath();
                ctx.ellipse(kx, ky, (radiusX / radiusY) * ring, ring, Math.PI / 16, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Belső sötét görcsmag
            const grad = ctx.createRadialGradient(kx, ky, 2, kx, ky, radiusY * 0.7);
            grad.addColorStop(0, options.ringColor);
            grad.addColorStop(0.6, options.grainColor);
            grad.addColorStop(1, 'transparent');

            ctx.fillStyle = grad;
            ctx.globalAlpha = 0.45;
            ctx.beginPath();
            ctx.ellipse(kx, ky, radiusX * 0.7, radiusY * 0.7, Math.PI / 16, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1.0;

        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.needsUpdate = true;

        return {
            id: options.id || options.name.toLowerCase().replace(/\s+/g, '_'),
            name: options.name,
            texture: texture,
            dataUrl: dataUrl,
            roughness: 0.6,
            metalness: 0.05,
            color: options.baseColor
        };
    },

    /**
     * Egyszínű laminált bútorlap textúra
     */
    createSolidTexture(options) {
        const width = 512;
        const height = 512;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = options.color;
        ctx.fillRect(0, 0, width, height);

        // Finom zaj az élethű matt hatásért
        const imgData = ctx.getImageData(0, 0, width, height);
        const d = imgData.data;
        const noise = options.noiseAmount || 4;
        for (let i = 0; i < d.length; i += 4) {
            const n = (Math.random() - 0.5) * noise;
            d[i] = Math.min(255, Math.max(0, d[i] + n));
            d[i+1] = Math.min(255, Math.max(0, d[i+1] + n));
            d[i+2] = Math.min(255, Math.max(0, d[i+2] + n));
        }
        ctx.putImageData(imgData, 0, 0);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;

        return {
            id: options.id || options.name.toLowerCase().replace(/\s+/g, '_'),
            name: options.name,
            texture: texture,
            dataUrl: dataUrl,
            roughness: 0.85,
            metalness: 0.02,
            color: options.color
        };
    },

    /**
     * Beton hatású textúra
     */
    createConcreteTexture(options) {
        const width = 512;
        const height = 512;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = options.baseColor;
        ctx.fillRect(0, 0, width, height);

        for (let i = 0; i < 40; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#4a4d52';
            ctx.globalAlpha = 0.05 + Math.random() * 0.08;
            ctx.beginPath();
            ctx.arc(Math.random() * width, Math.random() * height, 20 + Math.random() * 80, 0, Math.PI * 2);
            ctx.fill();
        }

        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;

        return {
            id: 'concrete',
            name: options.name,
            texture: texture,
            dataUrl: dataUrl,
            roughness: 0.9,
            metalness: 0.1,
            color: options.baseColor
        };
    },

    /**
     * Egyedi képfájl betöltése és Three.js textúrává alakítása
     */
    loadCustomImage(file, name) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const texture = new THREE.Texture(img);
                    texture.wrapS = THREE.RepeatWrapping;
                    texture.wrapT = THREE.RepeatWrapping;
                    texture.needsUpdate = true;

                    const id = 'custom_' + Date.now();
                    const customTex = {
                        id: id,
                        name: name || file.name.replace(/\.[^/.]+$/, ''),
                        texture: texture,
                        dataUrl: e.target.result,
                        roughness: 0.6,
                        metalness: 0.05,
                        color: '#ffffff',
                        isCustom: true
                    };

                    this.textures[id] = customTex;
                    this.customTextures[id] = customTex;
                    resolve(customTex);
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    /**
     * Three.js MeshStandardMaterial létrehozása
     */
    createMaterial(textureKey = 'front_k001') {
        const texInfo = this.textures[textureKey] || this.textures['front_k001'] || this.textures['white_matte'];
        
        const mat = new THREE.MeshStandardMaterial({
            map: texInfo ? texInfo.texture : null,
            roughness: texInfo && texInfo.roughness !== undefined ? texInfo.roughness : 0.65,
            metalness: texInfo && texInfo.metalness !== undefined ? texInfo.metalness : 0.05
        });

        mat.userData = {
            textureKey: textureKey,
            textureName: texInfo ? texInfo.name : 'Alapértelmezett'
        };

        return mat;
    },

    /**
     * Kijelölt lap textúrájának frissítése
     */
    applyTextureToMesh(mesh, textureKey, repeatX = 1, repeatY = 1) {
        if (!mesh) return;
        const texInfo = this.textures[textureKey] || this.textures['front_k001'] || this.textures['white_matte'];
        if (!texInfo) return;
        
        const clonedTexture = texInfo.texture ? texInfo.texture.clone() : null;
        if (clonedTexture) {
            clonedTexture.wrapS = THREE.RepeatWrapping;
            clonedTexture.wrapT = THREE.RepeatWrapping;
            clonedTexture.repeat.set(repeatX, repeatY);
            clonedTexture.needsUpdate = true;
        }

        mesh.material = new THREE.MeshStandardMaterial({
            map: clonedTexture,
            roughness: texInfo.roughness,
            metalness: texInfo.metalness
        });

        mesh.userData.textureKey = textureKey;
        mesh.userData.textureName = texInfo.name;
        mesh.userData.repeatX = repeatX;
        mesh.userData.repeatY = repeatY;
    }
};


// --- FILE: presetFurniture.js ---
/**
 * Mintabútorok és Beépített Sablonok (presetFurniture.js)
 * Előre összeállított, valós méretű bútorok a gyors teszteléshez és bemutatáshoz
 */

const PresetFurniture = [
    {
        id: 'preset_nightstand',
        name: 'Modern Éjjeliszekrény Fiókkal',
        categoryId: 'cat_living',
        description: 'Kompakt 450x500x400 mm-es éjjeliszekrény belső polccal és tetőlappal.',
        dimensions: { w: 450, h: 500, d: 400 },
        boards: [
            // Bal oldal
            { name: 'Bal Oldallap', width: 18, height: 482, depth: 380, thickness: 18, type: 'vertical_side', textureKey: 'front_k001', x: -216, y: 241, z: 0 },
            // Jobb oldal
            { name: 'Jobb Oldallap', width: 18, height: 482, depth: 380, thickness: 18, type: 'vertical_side', textureKey: 'front_k001', x: 216, y: 241, z: 0 },
            // Fenéklap
            { name: 'Fenéklap', width: 414, height: 18, depth: 380, thickness: 18, type: 'horizontal', textureKey: 'front_k001', x: 0, y: 9, z: 0 },
            // Tetőlap (kicsit szélesebb)
            { name: 'Tetőlap', width: 450, height: 18, depth: 400, thickness: 18, type: 'horizontal', textureKey: 'front_k002', x: 0, y: 491, z: 0 },
            // Középső polc
            { name: 'Középső Polc', width: 414, height: 18, depth: 360, thickness: 18, type: 'shelf', textureKey: 'front_k001', x: 0, y: 250, z: -10 },
            // Hátfal (HDF)
            { name: 'Hátfal (HDF)', width: 430, height: 480, depth: 3, thickness: 3, type: 'back', textureKey: 'white_matte', x: 0, y: 245, z: -188.5 },
            // Alsó fiókelő / front
            { name: 'Fiók Front', width: 410, height: 220, depth: 18, thickness: 18, type: 'door', textureKey: 'front_k002', x: 0, y: 120, z: 199 }
        ]
    },
    {
        id: 'preset_bookshelf',
        name: 'Skandináv Könyvespolc (4 szintes)',
        categoryId: 'cat_living',
        description: 'Magas 800x1600x300 mm-es könyvespolc 3 állítható polccal.',
        dimensions: { w: 800, h: 1600, d: 300 },
        boards: [
            // Bal oldal
            { name: 'Bal Oldallap', width: 18, height: 1600, depth: 300, thickness: 18, type: 'vertical_side', textureKey: 'front_k003', x: -391, y: 800, z: 0 },
            // Jobb oldal
            { name: 'Jobb Oldallap', width: 18, height: 1600, depth: 300, thickness: 18, type: 'vertical_side', textureKey: 'front_k003', x: 391, y: 800, z: 0 },
            // Fenéklap
            { name: 'Fenéklap', width: 764, height: 18, depth: 300, thickness: 18, type: 'horizontal', textureKey: 'front_k003', x: 0, y: 70, z: 0 },
            // Lábazati takaró
            { name: 'Lábazat Front', width: 764, height: 60, depth: 18, thickness: 18, type: 'horizontal', textureKey: 'front_k003', x: 0, y: 30, z: 130 },
            // Tetőlap
            { name: 'Tetőlap', width: 800, height: 18, depth: 300, thickness: 18, type: 'horizontal', textureKey: 'front_k003', x: 0, y: 1591, z: 0 },
            // 1. Polc
            { name: 'Alsó Polc', width: 764, height: 18, depth: 290, thickness: 18, type: 'shelf', textureKey: 'front_k003', x: 0, y: 450, z: -5 },
            // 2. Polc
            { name: 'Középső Polc', width: 764, height: 18, depth: 290, thickness: 18, type: 'shelf', textureKey: 'front_k003', x: 0, y: 830, z: -5 },
            // 3. Polc
            { name: 'Felső Polc', width: 764, height: 18, depth: 290, thickness: 18, type: 'shelf', textureKey: 'front_k003', x: 0, y: 1210, z: -5 },
            // Hátfal
            { name: 'Hátfal', width: 780, height: 1530, depth: 3, thickness: 3, type: 'back', textureKey: 'white_matte', x: 0, y: 830, z: -148.5 }
        ]
    },
    {
        id: 'preset_kitchen_base',
        name: 'Konyhai Alsószekrény 60cm',
        categoryId: 'cat_kitchen',
        description: 'Standard 600x820x560 mm konyhabútor korpusz munkalappal és ajtóval.',
        dimensions: { w: 600, h: 860, d: 600 },
        boards: [
            // Bal oldal
            { name: 'Bal Korpusz Oldal', width: 18, height: 720, depth: 540, thickness: 18, type: 'vertical_side', textureKey: 'front_k001', x: -291, y: 460, z: 0 },
            // Jobb oldal
            { name: 'Jobb Korpusz Oldal', width: 18, height: 720, depth: 540, thickness: 18, type: 'vertical_side', textureKey: 'front_k001', x: 291, y: 460, z: 0 },
            // Fenéklap
            { name: 'Fenéklap', width: 564, height: 18, depth: 540, thickness: 18, type: 'horizontal', textureKey: 'front_k001', x: 0, y: 109, z: 0 },
            // Felső merevítő léc 1 (első)
            { name: 'Felső Merevítő Első', width: 564, height: 18, depth: 80, thickness: 18, type: 'horizontal', textureKey: 'front_k001', x: 0, y: 811, z: 220 },
            // Felső merevítő léc 2 (hátsó)
            { name: 'Felső Merevítő Hátsó', width: 564, height: 18, depth: 80, thickness: 18, type: 'horizontal', textureKey: 'front_k001', x: 0, y: 811, z: -220 },
            // Belső polc
            { name: 'Belső Állítható Polc', width: 562, height: 18, depth: 500, thickness: 18, type: 'shelf', textureKey: 'front_k001', x: 0, y: 460, z: -15 },
            // Konyhai Munkalap (38mm)
            { name: 'Munkalap (38mm)', width: 600, height: 38, depth: 600, thickness: 38, type: 'horizontal', textureKey: 'wt_3025', x: 0, y: 839, z: 20 },
            // Hátfal (Mindig fehér!)
            { name: 'Hátfal (3mm fehér)', width: 580, height: 700, depth: 3, thickness: 3, type: 'back', textureKey: 'white_matte', x: 0, y: 460, z: -268.5 },
            // Ajtólap
            { name: 'Konyha Ajtó Front', width: 596, height: 716, depth: 18, thickness: 18, type: 'door', textureKey: 'front_k001', x: 0, y: 460, z: 279 }
        ]
    }
];


// --- FILE: kitchenCorpusGenerator.js ---
/**
 * Paraméteres Konyha Korpusz Generátor (kitchenCorpusGenerator.js)
 * Precíz mm-es konyhabútor korpuszok generálása egyedi összekötő-, hátfal-, lábazat-, szokli- és munkalap eltolásokkal.
 */

class KitchenCorpusGenerator {
    /**
     * Standard alapértelmezett konyhai korpusz konfiguráció
     */
    static getDefaultConfig() {
        return {
            type: 'base', // 'base', 'wall', 'tall'

            // Korpusz fő befoglaló méretek (az oldallapok és fenéklap adják a fő méretet)
            width: 600,
            height: 720,      // Korpusz magassága lábak nélkül
            depth: 560,       // Korpusz mélysége (oldallapok mélysége)
            thickness: 18,    // Lapvastagság (korpusz)
            textureKey: 'front_k001',

            // Korpusz lekerekítés (mm)
            edgeRadius: 1,

            // 1. Oldallapok
            sides: {
                enabled: true
            },

            // 2. Alsó lap (Fenéklap)
            bottom: {
                enabled: true,
                placement: 'between', // 'between' (oldalak közé) vagy 'under' (oldalak alá)
                offsetFromGround: 0
            },

            // 3. Felső rész
            topType: 'stretchers', // 'stretchers' (összekötő lécek) vagy 'full_top' (teljes tetőlap)

            // Első összekötő léc
            frontStretcher: {
                enabled: true,
                width: 80,          // Léc szélessége
                orientation: 'flat', // 'flat' (fekvő) vagy 'vertical' (élre állított)
                insetFront: 0        // Mennyivel van beljebb a korpusz első síkjától (mm) - alapértelmezett: 0
            },

            // Hátsó összekötő léc
            backStretcher: {
                enabled: true,
                width: 80,
                orientation: 'flat', // 'flat' vagy 'vertical'
                insetBack: 0         // Mennyivel van beljebb a korpusz hátsó síkjától (mm) - alapértelmezett: 0
            },

            // Teljes tetőlap
            fullTop: {
                placement: 'between' // 'between' vagy 'on_top'
            },

            // 4. Hátfal
            backPanel: {
                enabled: true,
                thickness: 3,         // 3mm HDF vagy 18mm bútorlap
                type: 'surface',      // 'surface' (rászegelt kívülről), 'groove' (nútba ültetett), 'rabbet' (falcolt)
                gap: 2.5,             // 2.5 mm réshézag / peremvisszaállás
                height: null,         // Opcionális egyedi magasság (ha null, akkor H - 2*gap)
                offsetY: 0,           // Függőleges eltolás (mm)
                insetBack: 20,        // Hátfal bemélyesztése (nútosnál), felületi rászegelésnél a korpusz mögé kerül (-3mm)
                textureKey: 'white_matte'
            },

            // 5. Lábak
            legs: {
                enabled: true,
                height: 100,          // Láb magassága mm-ben
                diameter: 45,
                insetX: 50,
                insetZ: 50,
                count: 4
            },

            // 6. Szokli / Lábazati takaróléc
            plinth: {
                enabled: true,
                height: 100,
                thickness: 18,
                insetFront: 20,       // Mennyivel van beljebb a korpusz frontjától (lábtér - 20mm alapértelmezett)
                textureKey: 'front_k001'
            },

            // 7. Konyhai Munkalap
            worktop: {
                enabled: true,
                thickness: 38,        // 28mm vagy 38mm
                depth: 600,           // Munkalap teljes mélysége (mm)
                overhangFront: 25,    // Elülső túllógás a korpusz frontján túl (mm)
                overhangBack: 15,     // Hátsó túllógás a korpusz hátulján túl (mm)
                overhangLeft: 0,
                overhangRight: 0,
                edgeRadius: 3,        // 38mm-es munkalap 3mm lekerekítéssel
                textureKey: 'wt_3025',
                // Munkalap hátfal (fali panel / csempepótló)
                splashback: {
                    enabled: false,   // Bekapcsolható a varázslóban
                    height: 600,      // 60 cm (600 mm)
                    thickness: 5,     // 0.5 cm (5 mm mélység/vastagság)
                    textureKey: 'wt_3025'
                }
            },

            // 8. Belső Polcok
            shelves: {
                count: 1,
                thickness: 18,
                insetFront: 15
            },

            // 9. Dinamikusan hozzáadott Front Elemek & Készülékek (Ajtók, Fiókok, Beépíthető Sütő / Főzőlap)
            elements: []
        };
    }

    /**
     * Bútorlapok pontos geometriai generálása
     */
    static generateBoards(config) {
        const boards = [];
        const cfg = { ...this.getDefaultConfig(), ...config };

        const W = Number(cfg.width);
        const H = Number(cfg.height);
        const D = Number(cfg.depth);
        const Th = Number(cfg.thickness);
        const tex = cfg.textureKey || 'white_matte';
        const defaultRadius = cfg.edgeRadius !== undefined ? Number(cfg.edgeRadius) : 1;

        // Alap Y magasság (ha van láb, a korpusz a láb magasságától indul)
        const legH = (cfg.legs && cfg.legs.enabled) ? Number(cfg.legs.height) : 0;
        const corpusBaseY = legH;

        // ----------------------------------------------------
        // 1. OLDALFALAK (Bal és Jobb) - Fő mélységet adják (-D/2 .. +D/2)
        // ----------------------------------------------------
        if (cfg.sides && cfg.sides.enabled) {
            const sideH = (cfg.bottom.placement === 'under') ? (H - Th) : H;
            const sideY = (cfg.bottom.placement === 'under') ? (corpusBaseY + Th + sideH / 2) : (corpusBaseY + sideH / 2);

            // Bal oldalfal
            boards.push({
                name: 'Bal Korpusz Oldalfal',
                width: Th,
                height: sideH,
                depth: D,
                thickness: Th,
                type: 'vertical_side',
                textureKey: cfg.sides.textureKey || tex,
                x: -W / 2 + Th / 2,
                y: sideY,
                z: 0,
                edgeBanding: '0.4mm ABS'
            });

            // Jobb oldalfal
            boards.push({
                name: 'Jobb Korpusz Oldalfal',
                width: Th,
                height: sideH,
                depth: D,
                thickness: Th,
                type: 'vertical_side',
                textureKey: cfg.sides.textureKey || tex,
                x: W / 2 - Th / 2,
                y: sideY,
                z: 0,
                edgeBanding: '0.4mm ABS'
            });
        }

        // ----------------------------------------------------
        // 2. ALSÓ LAP (Fenéklap)
        // ----------------------------------------------------
        if (cfg.bottom && cfg.bottom.enabled) {
            const isBetween = cfg.bottom.placement === 'between';
            const bottomW = isBetween ? (W - 2 * Th) : W;
            const bottomY = corpusBaseY + Th / 2;

            boards.push({
                name: 'Fenéklap',
                width: bottomW,
                height: Th,
                depth: D,
                thickness: Th,
                type: 'horizontal',
                textureKey: tex,
                x: 0,
                y: bottomY,
                z: 0,
                edgeBanding: '0.4mm ABS'
            });
        }

        // ----------------------------------------------------
        // 3. FELSŐ RÉSZ: ÖSSZEKÖTŐK VAGY TELJES TETŐLAP
        // ----------------------------------------------------
        const innerW = W - 2 * Th;
        const topY_between = corpusBaseY + H - Th / 2;
        const topY_onTop = corpusBaseY + H + Th / 2;

        if (cfg.topType === 'full_top') {
            const isBetween = cfg.fullTop?.placement === 'between';
            const topW = isBetween ? innerW : W;
            const topY = isBetween ? topY_between : topY_onTop;

            boards.push({
                name: 'Tetőlap',
                width: topW,
                height: Th,
                depth: D,
                thickness: Th,
                type: 'horizontal',
                textureKey: tex,
                x: 0,
                y: topY,
                z: 0,
                edgeBanding: '0.4mm ABS'
            });
        } else {
            // ÖSSZEKÖTŐ LÉCEK (Alsószekrény)

            // Első összekötő léc
            if (cfg.frontStretcher && cfg.frontStretcher.enabled) {
                const fsW = Number(cfg.frontStretcher.width) || 80;
                const isFlat = cfg.frontStretcher.orientation !== 'vertical';
                const insetF = Number(cfg.frontStretcher.insetFront) || 0;

                const lHeight = isFlat ? Th : fsW;
                const lDepth = isFlat ? fsW : Th;
                const lY = isFlat ? topY_between : (corpusBaseY + H - fsW / 2);
                const lZ = (D / 2) - insetF - (lDepth / 2);

                boards.push({
                    name: 'Első Összekötő Léc',
                    width: innerW,
                    height: lHeight,
                    depth: lDepth,
                    thickness: Th,
                    type: 'horizontal',
                    textureKey: tex,
                    x: 0,
                    y: lY,
                    z: lZ,
                    edgeBanding: '0.4mm ABS'
                });
            }

            // Hátsó összekötő léc
            if (cfg.backStretcher && cfg.backStretcher.enabled) {
                const bsW = Number(cfg.backStretcher.width) || 80;
                const isFlat = cfg.backStretcher.orientation !== 'vertical';
                const insetB = Number(cfg.backStretcher.insetBack) || 0;

                const lHeight = isFlat ? Th : bsW;
                const lDepth = isFlat ? bsW : Th;
                const lY = isFlat ? topY_between : (corpusBaseY + H - bsW / 2);
                const lZ = (-D / 2) + insetB + (lDepth / 2);

                boards.push({
                    name: 'Hátsó Összekötő Léc',
                    width: innerW,
                    height: lHeight,
                    depth: lDepth,
                    thickness: Th,
                    type: 'horizontal',
                    textureKey: tex,
                    x: 0,
                    y: lY,
                    z: lZ,
                    edgeBanding: '0.4mm ABS'
                });
            }
        }

        // ----------------------------------------------------
        // 4. HÁTFAL (HDF / Bútorlap)
        // ----------------------------------------------------
        if (cfg.backPanel && cfg.backPanel.enabled) {
            const backTh = Number(cfg.backPanel.thickness) || 3;
            const backType = cfg.backPanel.type || 'surface';
            const insetBack = Number(cfg.backPanel.insetBack) || 20;
            const gap = cfg.backPanel.gap !== undefined && cfg.backPanel.gap !== null ? Number(cfg.backPanel.gap) : 2.5;
            const customH = (cfg.backPanel.height !== undefined && cfg.backPanel.height !== null && cfg.backPanel.height !== '') ? Number(cfg.backPanel.height) : null;
            const offsetY = Number(cfg.backPanel.offsetY) || 0;

            let backW = innerW;
            let backH = (customH && customH > 0) ? customH : H;
            let backZ = 0;

            if (backType === 'surface') {
                // RÁSZÖGELT / RÁSZÉGELT: A korpusz hátfalára fekszik fel 2.5mm peremhézaggal
                backW = W - (2 * gap);
                backH = (customH && customH > 0) ? customH : (H - (2 * gap));
                backZ = (-D / 2) - (backTh / 2);
            } else if (backType === 'groove') {
                // NÚTBA ÜLTETETT: A korpusz belsejében fut, insetBack mm-re a hátuljától
                backW = innerW + 16; // 8mm nút mindkét oldalon
                backH = (customH && customH > 0) ? customH : (H - (2 * Th) + 16);
                backZ = (-D / 2) + insetBack + (backTh / 2);
            } else if (backType === 'rabbet') {
                // FALCOLT: Szintben a hátfal élével
                backW = innerW + 16;
                backH = (customH && customH > 0) ? customH : (H - (2 * Th) + 16);
                backZ = (-D / 2) + (backTh / 2);
            }

            const backY = corpusBaseY + H / 2 + offsetY;

            boards.push({
                name: `Hátfal (${backTh}mm ${backType === 'surface' ? 'rászegelt' : (backType === 'rabbet' ? 'falcolt' : 'nútos')})`,
                width: Math.round(backW),
                height: Math.round(backH),
                depth: backTh,
                thickness: backTh,
                type: 'back',
                textureKey: cfg.backPanel.textureKey || 'white_matte',
                x: 0,
                y: Math.round(backY),
                z: backZ,
                edgeBanding: 'Nincs élzárás'
            });
        }

        // ----------------------------------------------------
        // 5. BELSŐ POLCOK
        // ----------------------------------------------------
        if (cfg.shelves && Number(cfg.shelves.count) > 0) {
            const shelfCount = Number(cfg.shelves.count);
            const shelfTh = Number(cfg.shelves.thickness) || Th;
            const insetF = Number(cfg.shelves.insetFront) || 15;
            
            // Hátfal helye a polc mélységéhez
            let backInset = 0;
            if (cfg.backPanel && cfg.backPanel.enabled) {
                if (cfg.backPanel.type === 'groove') {
                    backInset = Number(cfg.backPanel.insetBack) + Number(cfg.backPanel.thickness);
                }
            }

            const shelfW = innerW - 2; // 2mm szerelési hézag
            const shelfD = D - insetF - backInset;
            const shelfZ = (D / 2) - insetF - (shelfD / 2);

            const internalH = H - 2 * Th;
            const stepY = internalH / (shelfCount + 1);

            for (let i = 1; i <= shelfCount; i++) {
                const shelfY = corpusBaseY + Th + (i * stepY);
                boards.push({
                    name: `Belső Polc ${i}`,
                    width: Math.round(shelfW),
                    height: shelfTh,
                    depth: Math.round(shelfD),
                    thickness: shelfTh,
                    type: 'shelf',
                    textureKey: cfg.shelves.textureKey || tex,
                    x: 0,
                    y: Math.round(shelfY),
                    z: Math.round(shelfZ),
                    edgeBanding: '0.4mm ABS'
                });
            }
        }

        // ----------------------------------------------------
        // 6. LÁBAZAT / LÁBAK
        // ----------------------------------------------------
        if (cfg.legs && cfg.legs.enabled && legH > 0) {
            const insetX = Number(cfg.legs.insetX) || 50;
            const insetZ = Number(cfg.legs.insetZ) || 50;
            const legSize = Number(cfg.legs.diameter) || 45;

            const legPositions = [
                { name: 'Bal Első Láb', x: -W / 2 + insetX, z: D / 2 - insetZ },
                { name: 'Jobb Első Láb', x: W / 2 - insetX, z: D / 2 - insetZ },
                { name: 'Bal Hátsó Láb', x: -W / 2 + insetX, z: -D / 2 + insetZ },
                { name: 'Jobb Hátsó Láb', x: W / 2 - insetX, z: -D / 2 + insetZ }
            ];

            legPositions.forEach(pos => {
                boards.push({
                    name: pos.name,
                    width: legSize,
                    height: legH,
                    depth: legSize,
                    thickness: legSize,
                    type: 'horizontal',
                    textureKey: 'metal_chrome',
                    x: pos.x,
                    y: legH / 2,
                    z: pos.z,
                    edgeBanding: 'Nincs élzárás'
                });
            });
        }

        // ----------------------------------------------------
        // 7. SZOKLI / LÁBAZATI TAKARÓLÉC
        // ----------------------------------------------------
        if (cfg.plinth && cfg.plinth.enabled && legH > 0) {
            const plinthH = Number(cfg.plinth.height) || legH;
            const plinthTh = Number(cfg.plinth.thickness) || 18;
            const insetFront = cfg.plinth.insetFront !== undefined ? Number(cfg.plinth.insetFront) : 20;
            const plinthZ = (D / 2) - insetFront - (plinthTh / 2);

            boards.push({
                name: 'Szokli Előlap',
                isPlinth: true,
                width: W,
                height: plinthH,
                depth: plinthTh,
                thickness: plinthTh,
                type: 'plinth',
                textureKey: cfg.plinth.textureKey || tex,
                x: 0,
                y: plinthH / 2,
                z: plinthZ,
                edgeBanding: '0.4mm ABS'
            });
        }

        // ----------------------------------------------------
        // 8. KONYHAI MUNKALAP & MUNKALAP HÁTFAL
        // ----------------------------------------------------
        if (cfg.worktop && cfg.worktop.enabled) {
            const wtTh = Number(cfg.worktop.thickness) || 38;
            const overhangF = Number(cfg.worktop.overhangFront) || 25;
            const overhangB = Number(cfg.worktop.overhangBack) || 15;
            const overhangL = Number(cfg.worktop.overhangLeft) || 0;
            const overhangR = Number(cfg.worktop.overhangRight) || 0;
            const wtRadius = cfg.worktop?.edgeRadius !== undefined ? Number(cfg.worktop.edgeRadius) : 3;

            // A munkalap tényleges mélysége a korpusz mélysége + első és hátsó túllógások
            const wtD = Number(cfg.worktop.depth) || (D + overhangF + overhangB);
            const wtW = W + overhangL + overhangR;
            const wtY = corpusBaseY + H + (wtTh / 2);
            
            // Z pozíció: a korpusz elöl +D/2, hátul -D/2.
            const wtZ = (overhangF - overhangB) / 2;
            const wtTex = cfg.worktop.textureKey || 'wt_3025';

            boards.push({
                name: `Munkalap (${wtTh}mm, ${wtW}×${wtD})`,
                isWorktop: true,
                width: wtW,
                height: wtTh,
                depth: wtD,
                thickness: wtTh,
                edgeRadius: wtRadius,
                type: 'worktop',
                textureKey: wtTex,
                x: (overhangR - overhangL) / 2,
                y: wtY,
                z: wtZ,
                edgeBanding: '2.0mm ABS'
            });

            // Munkalap Hátfal (Fali panel / Csempepótló)
            if (cfg.worktop.splashback && cfg.worktop.splashback.enabled) {
                const sbH = Number(cfg.worktop.splashback.height) || 600; // 60cm
                const sbTh = Number(cfg.worktop.splashback.thickness !== undefined ? cfg.worktop.splashback.thickness : 5); // 0.5cm (5mm)
                // A munkalap tetejére ül fel, a munkalap hátuljának síkjában (egész szélességben végigér a munkalap hátulján)
                const sbY = corpusBaseY + H + wtTh + (sbH / 2);
                const sbZ = (-D / 2 - overhangB) + (sbTh / 2);
                const sbTex = cfg.worktop.splashback.textureKey || wtTex;

                boards.push({
                    name: `Munkalap Hátfalpanel (${sbH}×${wtW}×${sbTh}mm)`,
                    isSplashback: true,
                    width: wtW,
                    height: sbH,
                    depth: sbTh,
                    thickness: sbTh,
                    type: 'back',
                    textureKey: sbTex,
                    x: (overhangR - overhangL) / 2,
                    y: sbY,
                    z: sbZ,
                    edgeBanding: '0.4mm ABS'
                });
            }
        }

    /**
     * 3D Kivetőpántok generálása ajtóhoz (Blum/Hettich szabvány szerint)
     */
    static addConcealedHinges(boards, p) {
        const { doorX, doorY, doorW, doorH, frontTh, D, W, Th, side } = p;
        
        // Pántok száma az ajtó magassága (doorH) alapján
        let hingeOffsets = [];
        if (doorH < 900) {
            hingeOffsets = [100, doorH - 100];
        } else if (doorH < 1600) {
            hingeOffsets = [100, doorH / 2, doorH - 100];
        } else if (doorH < 2000) {
            hingeOffsets = [100, doorH * 0.35, doorH * 0.65, doorH - 100];
        } else {
            hingeOffsets = [100, doorH * 0.28, doorH * 0.50, doorH * 0.72, doorH - 100];
        }

        hingeOffsets.forEach((offY, hIdx) => {
            const hY = (doorY - doorH / 2) + offY;

            if (side === 'left' || side === 'right') {
                const isLeft = side === 'left';
                // Pántedény középpont X: ajtó élétől 21.5 mm (Ø35mm edény)
                const cupX = isLeft ? (doorX - doorW / 2 + 21.5) : (doorX + doorW / 2 - 21.5);
                // Szerelőtalp X: korpusz belső oldalán
                const plateX = isLeft ? (-W / 2 + Th + 2) : (W / 2 - Th - 2);
                const armX = (cupX + plateX) / 2;

                // 1. Pántedény (Ø35mm csésze az ajtó belső felületén)
                boards.push({
                    name: `Pántedény Ø35mm ${isLeft ? 'Bal' : 'Jobb'} ${hIdx + 1}`,
                    width: 35,
                    height: 35,
                    depth: 6,
                    thickness: 6,
                    type: 'hardware',
                    isHardware: true,
                    isHinge: true,
                    textureKey: 'metal_chrome',
                    x: cupX,
                    y: hY,
                    z: (D / 2) - 1,
                    edgeBanding: 'Nincs'
                });

                // 2. Csuklós Pántkar (fém kar állítócsavarral)
                boards.push({
                    name: `Pántkar ${isLeft ? 'Bal' : 'Jobb'} ${hIdx + 1}`,
                    width: Math.max(12, Math.abs(cupX - plateX)),
                    height: 18,
                    depth: 28,
                    thickness: 18,
                    type: 'hardware',
                    isHardware: true,
                    isHinge: true,
                    textureKey: 'metal_chrome',
                    x: armX,
                    y: hY,
                    z: (D / 2) - 14,
                    edgeBanding: 'Nincs'
                });

                // 3. Szerelőtalp (a korpusz belső oldalán, 37mm-re elölről)
                boards.push({
                    name: `Pánt Szerelőtalp ${isLeft ? 'Bal' : 'Jobb'} ${hIdx + 1}`,
                    width: 4,
                    height: 32,
                    depth: 37,
                    thickness: 4,
                    type: 'hardware',
                    isHardware: true,
                    isHinge: true,
                    textureKey: 'metal_chrome',
                    x: plateX,
                    y: hY,
                    z: (D / 2) - 18.5,
                    edgeBanding: 'Nincs'
                });
            }
        });
    }

    /**
     * Felnyíló ajtó vasalatok: 2 db felső pánt + 2 db gázteleszkóp
     */
    static addLiftUpHardware(boards, p) {
        const { doorX, doorY, doorW, doorH, frontTh, D, W, Th } = p;
        
        // 1. Felső 2 db pánt (bal és jobb oldalt 100mm-re a szélektől)
        const topHingesX = [-doorW / 2 + 100, doorW / 2 - 100];
        const topHingeY = doorY + doorH / 2 - 20;

        topHingesX.forEach((hx, idx) => {
            // Pántedény
            boards.push({
                name: `Felnyíló Pántedény ${idx + 1}`,
                width: 35,
                height: 35,
                depth: 6,
                thickness: 6,
                type: 'hardware',
                isHardware: true,
                isHinge: true,
                textureKey: 'metal_chrome',
                x: hx,
                y: topHingeY,
                z: (D / 2) - 1,
                edgeBanding: 'Nincs'
            });
            // Felső pántkar
            boards.push({
                name: `Felnyíló Pántkar ${idx + 1}`,
                width: 18,
                height: 18,
                depth: 30,
                thickness: 18,
                type: 'hardware',
                isHardware: true,
                isHinge: true,
                textureKey: 'metal_chrome',
                x: hx,
                y: topHingeY + 8,
                z: (D / 2) - 15,
                edgeBanding: 'Nincs'
            });
        });

        // 2. Gázteleszkópok a bal és jobb oldalon
        const strutSides = [
            { name: 'Bal Gázteleszkóp', x: -W / 2 + Th + 12 },
            { name: 'Jobb Gázteleszkóp', x: W / 2 - Th - 12 }
        ];

        strutSides.forEach(st => {
            // Gázkamra henger
            boards.push({
                name: `${st.name} Ház`,
                width: 14,
                height: 14,
                depth: 120,
                thickness: 14,
                type: 'hardware',
                isHardware: true,
                textureKey: 'metal_chrome',
                x: st.x,
                y: doorY - 30,
                z: (D / 2) - 110,
                edgeBanding: 'Nincs'
            });

            // Króm dugattyúrúd
            boards.push({
                name: `${st.name} Dugattyúrúd`,
                width: 7,
                height: 7,
                depth: 70,
                thickness: 7,
                type: 'hardware',
                isHardware: true,
                textureKey: 'metal_chrome',
                x: st.x,
                y: doorY + 10,
                z: (D / 2) - 35,
                edgeBanding: 'Nincs'
            });

            // Front rögzítőtalp
            boards.push({
                name: `${st.name} Front Talp`,
                width: 20,
                height: 20,
                depth: 4,
                thickness: 4,
                type: 'hardware',
                isHardware: true,
                textureKey: 'metal_chrome',
                x: st.x,
                y: doorY + 25,
                z: (D / 2) - 2,
                edgeBanding: 'Nincs'
            });
        });
    }
        if (cfg.elements && Array.isArray(cfg.elements) && cfg.elements.length > 0) {
            let currentAllocatedY = 0;

            cfg.elements.forEach((elem, elemIdx) => {
                const elemType = elem.type || 'door';
                const gap = elem.gap !== undefined ? Number(elem.gap) : 3;
                const frontTh = Number(elem.thickness) || 18;
                const frontTex = elem.textureKey || tex;
                const elemH = Number(elem.height) || (H - currentAllocatedY);
                const actualH = Math.max(10, elemH - 2 * gap);
                const actualW = Math.max(10, W - 2 * gap);
                const centerY = corpusBaseY + currentAllocatedY + elemH / 2;
                const frontZ = (D / 2) + (frontTh / 2);

                currentAllocatedY += elemH;

                if (elemType === 'door') {
                    const doorType = elem.doorType || 'single_left'; // 'single_left', 'single_right', 'double', 'lift_up'
                    const hasHandle = elem.hasHandle !== false;

                    if (doorType === 'lift_up') {
                        // 1. FELNYÍLÓ AJTÓ (Lift-Up Flap Door)
                        boards.push({
                            name: `Felnyíló Ajtó Front (${Math.round(actualW)}×${Math.round(actualH)})`,
                            width: Math.round(actualW),
                            height: Math.round(actualH),
                            depth: frontTh,
                            thickness: frontTh,
                            type: 'door',
                            isDoor: true,
                            doorType: 'lift_up',
                            textureKey: frontTex,
                            x: 0,
                            y: centerY,
                            z: frontZ,
                            edgeBanding: '2.0mm ABS'
                        });

                        // 3D Felső kivetőpántok és gázteleszkópok
                        KitchenCorpusGenerator.addLiftUpHardware(boards, {
                            doorX: 0,
                            doorY: centerY,
                            doorW: actualW,
                            doorH: actualH,
                            frontTh,
                            D,
                            W,
                            Th
                        });

                        // Fogantyú: alul középen vízszintesen
                        if (hasHandle) {
                            const handleW = Math.min(160, Math.max(80, actualW - 120));
                            boards.push({
                                name: 'Felnyíló Ajtó Fogantyú',
                                width: handleW,
                                height: 12,
                                depth: 25,
                                thickness: 12,
                                type: 'hardware',
                                isHardware: true,
                                isHandle: true,
                                textureKey: 'metal_chrome',
                                x: 0,
                                y: centerY - (actualH / 2) + 35,
                                z: frontZ + frontTh / 2 + 12.5,
                                edgeBanding: 'Nincs'
                            });
                        }
                    } else if (doorType === 'double') {
                        // 2. KÉTSZÁRNYÚ AJTÓ (Double Door)
                        const doubleDoorW = Math.max(10, (actualW - 3) / 2); // 3mm hézag a két szárny között
                        const leftDoorX = -(doubleDoorW / 2 + 1.5);
                        const rightDoorX = (doubleDoorW / 2 + 1.5);

                        // Bal szárny
                        boards.push({
                            name: `Ajtó Bal Szárny (${Math.round(doubleDoorW)}×${Math.round(actualH)})`,
                            width: Math.round(doubleDoorW),
                            height: Math.round(actualH),
                            depth: frontTh,
                            thickness: frontTh,
                            type: 'door',
                            isDoor: true,
                            doorType: 'single_left',
                            textureKey: frontTex,
                            x: leftDoorX,
                            y: centerY,
                            z: frontZ,
                            edgeBanding: '2.0mm ABS'
                        });

                        // Jobb szárny
                        boards.push({
                            name: `Ajtó Jobb Szárny (${Math.round(doubleDoorW)}×${Math.round(actualH)})`,
                            width: Math.round(doubleDoorW),
                            height: Math.round(actualH),
                            depth: frontTh,
                            thickness: frontTh,
                            type: 'door',
                            isDoor: true,
                            doorType: 'single_right',
                            textureKey: frontTex,
                            x: rightDoorX,
                            y: centerY,
                            z: frontZ,
                            edgeBanding: '2.0mm ABS'
                        });

                        // Kivetőpántok a bal és jobb szárnyhoz
                        KitchenCorpusGenerator.addConcealedHinges(boards, {
                            doorX: leftDoorX,
                            doorY: centerY,
                            doorW: doubleDoorW,
                            doorH: actualH,
                            frontTh,
                            D,
                            W,
                            Th,
                            side: 'left'
                        });
                        KitchenCorpusGenerator.addConcealedHinges(boards, {
                            doorX: rightDoorX,
                            doorY: centerY,
                            doorW: doubleDoorW,
                            doorH: actualH,
                            frontTh,
                            D,
                            W,
                            Th,
                            side: 'right'
                        });

                        // Fogantyúk
                        if (hasHandle) {
                            boards.push({
                                name: 'Bal Ajtó Fogantyú',
                                width: 12,
                                height: 140,
                                depth: 25,
                                thickness: 12,
                                type: 'hardware',
                                isHardware: true,
                                isHandle: true,
                                textureKey: 'metal_chrome',
                                x: -20,
                                y: centerY,
                                z: frontZ + frontTh / 2 + 12.5,
                                edgeBanding: 'Nincs'
                            });
                            boards.push({
                                name: 'Jobb Ajtó Fogantyú',
                                width: 12,
                                height: 140,
                                depth: 25,
                                thickness: 12,
                                type: 'hardware',
                                isHardware: true,
                                isHandle: true,
                                textureKey: 'metal_chrome',
                                x: 20,
                                y: centerY,
                                z: frontZ + frontTh / 2 + 12.5,
                                edgeBanding: 'Nincs'
                            });
                        }
                    } else {
                        // 3. EGYSZÁRNYÚ AJTÓ (Single Door: Balos vagy Jobbos)
                        boards.push({
                            name: `Ajtó Front (${Math.round(actualW)}×${Math.round(actualH)})`,
                            width: Math.round(actualW),
                            height: Math.round(actualH),
                            depth: frontTh,
                            thickness: frontTh,
                            type: 'door',
                            isDoor: true,
                            doorType: doorType,
                            textureKey: frontTex,
                            x: 0,
                            y: centerY,
                            z: frontZ,
                            edgeBanding: '2.0mm ABS'
                        });

                        // 3D Kivetőpántok
                        const isLeft = doorType !== 'single_right';
                        KitchenCorpusGenerator.addConcealedHinges(boards, {
                            doorX: 0,
                            doorY: centerY,
                            doorW: actualW,
                            doorH: actualH,
                            frontTh,
                            D,
                            W,
                            Th,
                            side: isLeft ? 'left' : 'right'
                        });

                        if (hasHandle) {
                            const handleX = (doorType === 'single_right') ? (-actualW / 2 + 35) : (actualW / 2 - 35);
                            boards.push({
                                name: 'Ajtó Rúdfogantyú',
                                width: 12,
                                height: 140,
                                depth: 25,
                                thickness: 12,
                                type: 'hardware',
                                isHardware: true,
                                isHandle: true,
                                textureKey: 'metal_chrome',
                                x: handleX,
                                y: centerY,
                                z: frontZ + frontTh / 2 + 12.5,
                                edgeBanding: 'Nincs'
                            });
                        }
                    }
                } else if (elemType === 'drawer') {
                    // FIÓK ELŐLAP
                    const hasHandle = elem.hasHandle !== false;

                    boards.push({
                        name: `Fiók Előlap ${elemIdx + 1} (${Math.round(actualW)}×${Math.round(actualH)})`,
                        width: Math.round(actualW),
                        height: Math.round(actualH),
                        depth: frontTh,
                        thickness: frontTh,
                        type: 'drawer',
                        isDrawer: true,
                        textureKey: frontTex,
                        x: 0,
                        y: centerY,
                        z: frontZ,
                        edgeBanding: '2.0mm ABS'
                    });

                    if (hasHandle) {
                        const handleW = Math.min(160, Math.max(80, actualW - 80));
                        boards.push({
                            name: `Fiók Fogantyú ${elemIdx + 1}`,
                            width: handleW,
                            height: 12,
                            depth: 25,
                            thickness: 12,
                            type: 'hardware',
                            isHardware: true,
                            isHandle: true,
                            textureKey: 'metal_chrome',
                            x: 0,
                            y: centerY,
                            z: frontZ + frontTh / 2 + 12.5,
                            edgeBanding: 'Nincs'
                        });
                    }
                } else if (elemType === 'oven') {
                    // BEÉPÍTHETŐ SÜTŐ ÉS FŐZŐLAP
                    // 1. Sütő Fekete Üveg Alap Front
                    boards.push({
                        name: `Beépíthető Sütő Test (${Math.round(actualW)}×${Math.round(actualH)})`,
                        width: Math.round(actualW),
                        height: Math.round(actualH),
                        depth: 20,
                        thickness: 20,
                        type: 'appliance',
                        isAppliance: true,
                        textureKey: 'oven_black_glass',
                        x: 0,
                        y: centerY,
                        z: (D / 2) + 10,
                        edgeBanding: 'Nincs'
                    });

                    // 2. Sütő Kezelőpanel felül (Rozsdamentes acél)
                    const panelH = Math.min(110, actualH * 0.22);
                    boards.push({
                        name: 'Sütő Kezelőpanel (Inox)',
                        width: Math.round(actualW - 4),
                        height: Math.round(panelH),
                        depth: 4,
                        thickness: 4,
                        type: 'appliance',
                        isAppliance: true,
                        textureKey: 'stainless_steel',
                        x: 0,
                        y: centerY + (actualH / 2) - (panelH / 2),
                        z: (D / 2) + 21,
                        edgeBanding: 'Nincs'
                    });

                    // 3. Sütő Fogantyú (Kényelmes vízszintes acél rúd)
                    const ovenHandleW = Math.min(460, actualW - 80);
                    boards.push({
                        name: 'Sütő Ajtó Fogantyú',
                        width: ovenHandleW,
                        height: 16,
                        depth: 28,
                        thickness: 16,
                        type: 'hardware',
                        isHardware: true,
                        isHandle: true,
                        textureKey: 'stainless_steel',
                        x: 0,
                        y: centerY + (actualH / 2) - panelH - 25,
                        z: (D / 2) + 34,
                        edgeBanding: 'Nincs'
                    });

                    // 4. Sütő Betekintő Ablak (Belső sötétített üveg mező)
                    const windowW = Math.max(100, actualW - 120);
                    const windowH = Math.max(100, actualH - panelH - 80);
                    boards.push({
                        name: 'Sütő Üvegablak',
                        width: Math.round(windowW),
                        height: Math.round(windowH),
                        depth: 3,
                        thickness: 3,
                        type: 'appliance',
                        isAppliance: true,
                        textureKey: 'oven_black_glass',
                        x: 0,
                        y: centerY - (panelH / 2) - 15,
                        z: (D / 2) + 21,
                        edgeBanding: 'Nincs'
                    });

                    // 5. Beépíthető Indukciós Főzőlap (ha a munkalap be van kapcsolva)
                    if (elem.includeCooktop !== false && cfg.worktop && cfg.worktop.enabled) {
                        const wtTh = Number(cfg.worktop.thickness) || 38;
                        const cookW = Math.min(590, Math.max(280, W - 10));
                        const cookD = Math.min(520, Math.max(280, (Number(cfg.worktop.depth) || 600) - 50));
                        const wtZ = (Number(cfg.worktop.overhangFront || 25) - Number(cfg.worktop.overhangBack || 15)) / 2;

                        boards.push({
                            name: `Indukciós Főzőlap (${cookW}×${cookD} mm)`,
                            width: cookW,
                            height: 4,
                            depth: cookD,
                            thickness: 4,
                            type: 'appliance',
                            isAppliance: true,
                            textureKey: 'cooktop_glass',
                            x: 0,
                            y: corpusBaseY + H + wtTh + 2,
                            z: wtZ,
                            edgeBanding: 'Nincs'
                        });
                    }
                }
            });
        }

        // Attach default edgeRadius to any board that doesn't have it set
        boards.forEach(b => {
            if (b.edgeRadius === undefined) {
                b.edgeRadius = defaultRadius;
            }
        });

        return boards;
    }
}


// --- FILE: scene3d.js ---
/**
 * 3D Jelenet Menedzser (scene3d.js)
 * Three.js jelenet, kamera, OrbitControls, TransformControls, fények, raszter, árnyékok
 * Támogatja az egyedi bútorlapokat és az Egybefüggő Konyha Korpusz egységeket lebegő 3D buborékkal.
 */

class Scene3D {
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


// --- FILE: boardManager.js ---
/**
 * Bútorlap és Korpusz Egység Menedzser (boardManager.js)
 * Bútorlapok és egybefüggő Konyha Korpusz egységek kezelése
 */

/**
 * Box / Triplanar UV leképezés generátor
 * Biztosítja, hogy a Three.js Extrude és Box geometriákon a faerezet és egyéb textúrák
 * valósághű méretben (nem összenyomva/eltorzítva) jelenjenek meg minden oldalon és élen.
 */
function applyBoxUVs(geometry, w, h, d, tileSize = 800) {
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
function createRoundedBoxGeometry(w, h, d, radius = 1, bevelSegments = 2) {
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
function createWorktopGeometry(w, h, d, radius = 3) {
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
function createPlinthGeometry(w, h, d) {
    const geo = new THREE.BoxGeometry(w, h, d);
    applyBoxUVs(geo, w, h, d, 800);
    geo.parameters = { width: w, height: h, depth: d, isPlinth: true };
    return geo;
}

/**
 * Megfelelő geometriát választ a bútorlap típusa alapján
 */
function createBoardGeometry(boardData) {
    const width = Number(boardData.width) || 600;
    const height = Number(boardData.height) || 18;
    const depth = Number(boardData.depth) || 400;
    const isSplashback = boardData.isSplashback || (boardData.name && boardData.name.includes('Hátfalpanel'));
    const isWorktop = !isSplashback && (boardData.isWorktop || boardData.type === 'worktop' || (boardData.name && boardData.name.includes('Munkalap')));
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
    if (isPlinth || isSplashback) {
        const geo = new THREE.BoxGeometry(width, height, depth);
        applyBoxUVs(geo, width, height, depth, 800);
        geo.parameters = { width, height, depth, isPlinth: !!isPlinth, isSplashback: !!isSplashback };
        return geo;
    }
    const rad = boardData.edgeRadius !== undefined ? Number(boardData.edgeRadius) : 1;
    return createRoundedBoxGeometry(width, height, depth, rad);
}

class BoardManager {
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
        outlineMesh.visible = false;
        mesh.add(outlineMesh);

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
            outlineMesh: outlineMesh
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
            const geometry = createBoardGeometry(boardData);
            const material = MaterialManager.createMaterial(boardData.textureKey || config.textureKey || 'white_matte');

            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(boardData.x, boardData.y, boardData.z);
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

        this.scene3D.scene.add(corpusGroup);
        this.corpora.push(corpusGroup);

        this.updateKitchenContinuity();
        return corpusGroup;
    }

    /**
     * KONYHA ELEM MÓDOSÍTÁSA A VARÁZSLÓBÓL (In-place frissítés)
     */
    updateCorpus(corpusId, newConfig) {
        const corpusGroup = this.corpora.find(c => c.userData.id === corpusId);
        if (!corpusGroup) return null;

        // 1. Régi alkatrészek törlése
        const oldChildren = [...corpusGroup.children];
        oldChildren.forEach(mesh => {
            corpusGroup.remove(mesh);
            mesh.geometry.dispose();
            if (mesh.material.map) mesh.material.map.dispose();
            mesh.material.dispose();

            const meshIdx = this.scene3D.boardMeshes.indexOf(mesh);
            if (meshIdx > -1) this.scene3D.boardMeshes.splice(meshIdx, 1);
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
            const geometry = createBoardGeometry(boardData);
            const material = MaterialManager.createMaterial(boardData.textureKey || newConfig.textureKey || 'white_matte');

            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(boardData.x, boardData.y, boardData.z);
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
            mesh.geometry.dispose();
            if (mesh.material.map) mesh.material.map.dispose();
            mesh.material.dispose();

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

        this.scene3D.scene.remove(board.mesh);
        board.mesh.geometry.dispose();
        if (board.mesh.material.map) board.mesh.material.map.dispose();
        board.mesh.material.dispose();

        if (board.outlineMesh) {
            board.outlineMesh.geometry.dispose();
            board.outlineMesh.material.dispose();
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


// --- FILE: snapEngine.js ---
/**
 * Intelligens Illesztő és Igazító Motor (snapEngine.js)
 * Bútorlapok felületeinek, éleinek egymáshoz tapasztása, mágneses illesztés és polc-kalkuláció
 */

class SnapEngine {
    constructor(boardManager, scene3D) {
        this.boardManager = boardManager;
        this.scene3D = scene3D;
    }

    /**
     * Bútorlap határoló dobozának (Bounding Box) lekérése mm-ben
     */
    getBounds(board) {
        const halfW = board.width / 2;
        const halfH = board.height / 2;
        const halfD = board.depth / 2;

        return {
            minX: board.x - halfW,
            maxX: board.x + halfW,
            minY: board.y - halfH,
            maxY: board.y + halfH,
            minZ: board.z - halfD,
            maxZ: board.z + halfD,
            centerX: board.x,
            centerY: board.y,
            centerZ: board.z,
            width: board.width,
            height: board.height,
            depth: board.depth
        };
    }

    /**
     * Kijelölt lap illesztése egy referencia laphoz adott reláció szerint
     * @param {string} sourceId - A mozgatandó lap ID-je
     * @param {string} targetId - A referencia lap ID-je
     * @param {string} relation - 'top_outer', 'bottom_outer', 'left_outer', 'left_inner', 'right_outer', 'right_inner', 'front', 'back'
     * @param {number} gap - Opcionális távolság / hézag mm-ben
     */
    snapToBoard(sourceId, targetId, relation, gap = 0) {
        const source = this.boardManager.boards.find(b => b.id === sourceId);
        const target = this.boardManager.boards.find(b => b.id === targetId);
        if (!source || !target) return null;

        const sBounds = this.getBounds(source);
        const tBounds = this.getBounds(target);

        const newPos = { x: source.x, y: source.y, z: source.z };

        switch (relation) {
            case 'top_outer': // Cél felületére helyezés (felülre tapasztás)
                newPos.y = tBounds.maxY + (source.height / 2) + gap;
                break;
            case 'bottom_outer': // Cél lap alá függesztés
                newPos.y = tBounds.minY - (source.height / 2) - gap;
                break;
            case 'left_outer': // Bal oldalára kívülről
                newPos.x = tBounds.minX - (source.width / 2) - gap;
                break;
            case 'left_inner': // Bal belső falához belülről
                newPos.x = tBounds.minX + (source.width / 2) + gap;
                break;
            case 'right_outer': // Jobb oldalára kívülről
                newPos.x = tBounds.maxX + (source.width / 2) + gap;
                break;
            case 'right_inner': // Jobb belső falához belülről
                newPos.x = tBounds.maxX - (source.width / 2) - gap;
                break;
            case 'front_outer': // Elé tapasztás (pl. ajtó vagy fiókelő)
                newPos.z = tBounds.maxZ + (source.depth / 2) + gap;
                break;
            case 'back_outer': // Mögé tapasztás (pl. hátfal)
                newPos.z = tBounds.minZ - (source.depth / 2) - gap;
                break;
        }

        this.boardManager.updateBoard(sourceId, newPos);
        return newPos;
    }

    /**
     * Két lap éleinek egy vonalba igazítása (Alignment)
     * @param {string} sourceId 
     * @param {string} targetId 
     * @param {string} alignAxis - 'align_left', 'align_right', 'align_top', 'align_bottom', 'align_front', 'align_back', 'center_x', 'center_y', 'center_z'
     */
    alignBoards(sourceId, targetId, alignAxis) {
        const source = this.boardManager.boards.find(b => b.id === sourceId);
        const target = this.boardManager.boards.find(b => b.id === targetId);
        if (!source || !target) return null;

        const sBounds = this.getBounds(source);
        const tBounds = this.getBounds(target);

        const newPos = { x: source.x, y: source.y, z: source.z };

        switch (alignAxis) {
            case 'align_left':
                newPos.x = tBounds.minX + (source.width / 2);
                break;
            case 'align_right':
                newPos.x = tBounds.maxX - (source.width / 2);
                break;
            case 'align_top':
                newPos.y = tBounds.maxY - (source.height / 2);
                break;
            case 'align_bottom':
                newPos.y = tBounds.minY + (source.height / 2);
                break;
            case 'align_front':
                newPos.z = tBounds.maxZ - (source.depth / 2);
                break;
            case 'align_back':
                newPos.z = tBounds.minZ + (source.depth / 2);
                break;
            case 'center_x':
                newPos.x = tBounds.centerX;
                break;
            case 'center_y':
                newPos.y = tBounds.centerY;
                break;
            case 'center_z':
                newPos.z = tBounds.centerZ;
                break;
        }

        this.boardManager.updateBoard(sourceId, newPos);
        return newPos;
    }

    /**
     * Intelligens polc beillesztése két oldalfal közé
     * Automatikusan leméri a két lap közötti távolságot és beállítja a polc szélességét!
     */
    fitShelfBetween(leftBoardId, rightBoardId, shelfY = null, thickness = 18) {
        const leftBoard = this.boardManager.boards.find(b => b.id === leftBoardId);
        const rightBoard = this.boardManager.boards.find(b => b.id === rightBoardId);
        if (!leftBoard || !rightBoard) return null;

        const leftBounds = this.getBounds(leftBoard);
        const rightBounds = this.getBounds(rightBoard);

        // Kiszámítjuk a belső távolságot
        const innerDistance = Math.abs(rightBounds.minX - leftBounds.maxX);
        if (innerDistance <= 0) return null;

        const centerX = (leftBounds.maxX + rightBounds.minX) / 2;
        const targetY = shelfY !== null ? shelfY : ((leftBounds.centerY + rightBounds.centerY) / 2);
        const depth = Math.min(leftBoard.depth, rightBoard.depth) - 10; // 10mm front visszaugrás

        const shelf = this.boardManager.createBoard({
            name: `Belső polc (${Math.round(innerDistance)}x${Math.round(depth)})`,
            type: 'shelf',
            width: innerDistance,
            height: thickness,
            depth: depth,
            thickness: thickness,
            x: centerX,
            y: targetY,
            z: (leftBounds.centerZ + rightBounds.centerZ) / 2 - 5,
            textureKey: leftBoard.textureKey
        });

        return shelf;
    }

    /**
     * Mágneses keresés a legközelebbi lapfelületekhez
     */
    findNearestSnapTarget(sourceId, threshold = 40) {
        const source = this.boardManager.boards.find(b => b.id === sourceId);
        if (!source) return null;

        const sBounds = this.getBounds(source);
        let bestCandidate = null;
        let minDistance = Infinity;

        for (const target of this.boardManager.boards) {
            if (target.id === sourceId) continue;
            const tBounds = this.getBounds(target);

            // Távolságok a határoló dobozok között
            const dx = Math.max(0, sBounds.minX - tBounds.maxX, tBounds.minX - sBounds.maxX);
            const dy = Math.max(0, sBounds.minY - tBounds.maxY, tBounds.minY - sBounds.maxY);
            const dz = Math.max(0, sBounds.minZ - tBounds.maxZ, tBounds.minZ - sBounds.maxZ);

            const dist = Math.hypot(dx, dy, dz);
            if (dist < minDistance && dist <= threshold) {
                minDistance = dist;
                bestCandidate = { target, distance: dist, tBounds, sBounds };
            }
        }

        return bestCandidate;
    }
}


// --- FILE: catalogManager.js ---
/**
 * Bal Oldali Katalógus és Kategóriakezelő Menedzser (catalogManager.js)
 * Kategóriák kezelése, bútorok mentése automatikus 3D előnézettel, visszatöltés, export/import
 */

class CatalogManager {
    constructor(boardManager, scene3D, onCatalogChange) {
        this.boardManager = boardManager;
        this.scene3D = scene3D;
        this.onCatalogChange = onCatalogChange;

        this.categories = [];
        this.items = [];
        this.activeCategoryId = 'all'; // 'all' vagy konkrét category id
        this.searchQuery = '';

        this.storageKeyCategories = 'butortervezo_categories_v1';
        this.storageKeyItems = 'butortervezo_items_v1';

        this.loadFromStorage();
    }

    /**
     * Adatok betöltése LocalStorage-ből (vagy alapértelmezett kategóriák inicializálása)
     */
    loadFromStorage() {
        try {
            const catJson = localStorage.getItem(this.storageKeyCategories);
            const itemJson = localStorage.getItem(this.storageKeyItems);

            if (catJson) {
                this.categories = JSON.parse(catJson);
            } else {
                this.categories = [
                    { id: 'cat_kitchen', name: 'Konyhabútor', icon: 'utensils', color: '#f59e0b' },
                    { id: 'cat_living', name: 'Nappali & Polcok', icon: 'tv', color: '#3b82f6' },
                    { id: 'cat_wardrobe', name: 'Gardrób & Szekrény', icon: 'archive', color: '#10b981' },
                    { id: 'cat_office', name: 'Irodabútor & Asztal', icon: 'briefcase', color: '#8b5cf6' },
                    { id: 'cat_bathroom', name: 'Fürdőszoba bútor', icon: 'droplet', color: '#06b6d4' }
                ];
                this.saveCategoriesToStorage();
            }

            if (itemJson) {
                this.items = JSON.parse(itemJson).filter(item => !item.id.startsWith('preset_'));
            } else {
                this.items = [];
            }
        } catch (e) {
            console.error('Hiba a katalógus betöltésekor:', e);
            this.categories = [];
            this.items = [];
        }
    }

    saveCategoriesToStorage() {
        try {
            localStorage.setItem(this.storageKeyCategories, JSON.stringify(this.categories));
        } catch (e) {
            console.error('Hiba a kategóriák mentésekor:', e);
        }
    }

    saveItemsToStorage() {
        try {
            localStorage.setItem(this.storageKeyItems, JSON.stringify(this.items));
        } catch (e) {
            console.error('Hiba a bútorok mentésekor:', e);
        }
    }

    notifyChange() {
        if (this.onCatalogChange) {
            this.onCatalogChange();
        }
    }

    // --- KATEGÓRIA MŰVELETEK ---

    addCategory(name, color = '#3b82f6', icon = 'folder') {
        if (!name || name.trim() === '') return null;
        const newCat = {
            id: 'cat_' + Date.now(),
            name: name.trim(),
            color: color,
            icon: icon
        };
        this.categories.push(newCat);
        this.saveCategoriesToStorage();
        this.notifyChange();
        return newCat;
    }

    updateCategory(id, newName, newColor) {
        const cat = this.categories.find(c => c.id === id);
        if (!cat) return null;
        if (newName) cat.name = newName.trim();
        if (newColor) cat.color = newColor;
        this.saveCategoriesToStorage();
        this.notifyChange();
        return cat;
    }

    deleteCategory(id) {
        this.categories = this.categories.filter(c => c.id !== id);
        // Az adott kategóriában lévő bútorokat áttesszük 'uncategorized'-be vagy töröljük
        this.items.forEach(item => {
            if (item.categoryId === id) {
                item.categoryId = 'uncategorized';
            }
        });
        if (this.activeCategoryId === id) {
            this.activeCategoryId = 'all';
        }
        this.saveCategoriesToStorage();
        this.saveItemsToStorage();
        this.notifyChange();
    }

    getCategoryById(id) {
        if (id === 'all') return { id: 'all', name: 'Összes bútor', color: '#6366f1' };
        if (id === 'uncategorized') return { id: 'uncategorized', name: 'Egyéb / Nincs kategória', color: '#94a3b8' };
        return this.categories.find(c => c.id === id) || { id: id, name: 'Ismeretlen', color: '#94a3b8' };
    }

    /**
     * Kijelölt korpusz vagy egyedi bútorlap mentése a katalógusba izolált 3D fotóval
     */
    saveSelectedToCatalog(savingTarget, name, categoryId, description = '') {
        if (!savingTarget || !savingTarget.target) {
            alert('Nincs kijelölt elem a mentéshez!');
            return null;
        }

        let boardsData = null;
        let dimensions = { w: 600, h: 720, d: 560 };
        let boardCount = 1;

        if (savingTarget.type === 'corpus') {
            boardsData = this.boardManager.getCorpusJSON(savingTarget.id);
            const corpus = this.boardManager.corpora.find(c => c.userData.id === savingTarget.id);
            if (corpus) {
                dimensions = {
                    w: corpus.userData.width || 600,
                    h: corpus.userData.height || 720,
                    d: corpus.userData.depth || 560
                };
                boardCount = corpus.children.length;
            }
        } else if (savingTarget.type === 'group') {
            boardsData = this.boardManager.getGroupJSON(savingTarget.id);
            const grp = this.boardManager.customGroups.find(g => g.userData.id === savingTarget.id);
            const childBoards = this.boardManager.boards.filter(b => b.groupId === savingTarget.id);
            if (grp) {
                dimensions = {
                    w: grp.userData.width || 600,
                    h: grp.userData.height || 800,
                    d: grp.userData.depth || 400
                };
                boardCount = childBoards.length;
            }
        } else {
            boardsData = this.boardManager.getSingleBoardJSON(savingTarget.id);
            const board = this.boardManager.boards.find(b => b.id === savingTarget.id);
            if (board) {
                dimensions = {
                    w: board.width,
                    h: board.height,
                    d: board.depth
                };
                boardCount = 1;
            }
        }

        if (!boardsData) {
            alert('Nem sikerült kinyerni a kijelölt elem adatait.');
            return null;
        }

        // Csak a kijelölt elem látszódik a kisképben!
        const thumbnail = this.scene3D.getSnapshot(savingTarget.target, 400, 300);

        const newItem = {
            id: 'item_' + Date.now(),
            name: name && name.trim() !== '' ? name.trim() : (savingTarget.name || `Bútor ${this.items.length + 1}`),
            categoryId: categoryId || (this.categories[0] ? this.categories[0].id : 'uncategorized'),
            description: (description || '').trim(),
            dimensions: dimensions,
            boardCount: boardCount,
            thumbnail: thumbnail,
            boards: boardsData,
            createdAt: new Date().toISOString()
        };

        this.items.unshift(newItem);
        this.saveItemsToStorage();
        this.notifyChange();
        return newItem;
    }

    /**
     * Jelenlegi bútor mentése a bal oldali katalógusba automatikus 3D fotóval
     */
    saveCurrentFurnitureToCatalog(name, categoryId, description = '') {
        const boardsData = this.boardManager.toJSON();
        if (boardsData.corpora.length === 0 && boardsData.boards.length === 0) {
            alert('A 3D tér üres! Hozz létre legalább egy bútorlapot a mentéshez.');
            return null;
        }

        const bounds = this.boardManager.getFurnitureBoundingBox();
        const thumbnail = this.scene3D.getSnapshot(null, 400, 300);

        const newItem = {
            id: 'item_' + Date.now(),
            name: name && name.trim() !== '' ? name.trim() : `Bútor ${this.items.length + 1}`,
            categoryId: categoryId || (this.categories[0] ? this.categories[0].id : 'uncategorized'),
            description: description.trim(),
            dimensions: {
                w: bounds.width,
                h: bounds.height,
                d: bounds.depth
            },
            boardCount: this.boardManager.boards.length,
            thumbnail: thumbnail,
            boards: boardsData,
            createdAt: new Date().toISOString()
        };

        this.items.unshift(newItem); // Elejére szúrjuk be
        this.saveItemsToStorage();
        this.notifyChange();
        return newItem;
    }

    /**
     * Katalógus bútor betöltése a 3D munkatérbe
     * @param {string} itemId 
     * @param {boolean} replaceCurrent - true: lecseréli a meglévő bútorokat, false: melléilleszti
     */
    loadFurnitureToScene(itemId, replaceCurrent = false) {
        const item = this.items.find(i => i.id === itemId);
        if (!item || !item.boards) return null;

        if (replaceCurrent) {
            this.boardManager.fromJSON(item.boards, true);
        } else {
            // Meglévő bútorok mellé helyezés X eltolással
            const currentBounds = this.boardManager.getFurnitureBoundingBox();
            const itemW = (item.dimensions && item.dimensions.w) || 600;
            const offsetX = currentBounds.width > 0 ? (currentBounds.width / 2 + itemW / 2 + 100) : 0;

            if (Array.isArray(item.boards)) {
                const shiftedBoards = item.boards.map(b => ({
                    ...b,
                    x: (b.x || 0) + offsetX
                }));
                this.boardManager.fromJSON(shiftedBoards, false);
            } else if (typeof item.boards === 'object') {
                const shiftedData = {
                    corpora: (item.boards.corpora || []).map(c => ({
                        ...c,
                        x: (c.x || 0) + offsetX
                    })),
                    boards: (item.boards.boards || []).map(b => ({
                        ...b,
                        x: (b.x || 0) + offsetX
                    }))
                };
                this.boardManager.fromJSON(shiftedData, false);
            }
        }

        return item;
    }

    deleteItem(itemId) {
        this.items = this.items.filter(i => i.id !== itemId);
        this.saveItemsToStorage();
        this.notifyChange();
    }

    /**
     * Szűrt katalógus elemek lekérése (kategória és keresés alapján)
     */
    getFilteredItems() {
        return this.items.filter(item => {
            const matchesCategory = (this.activeCategoryId === 'all') || (item.categoryId === this.activeCategoryId);
            const matchesSearch = !this.searchQuery || 
                item.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                (item.description && item.description.toLowerCase().includes(this.searchQuery.toLowerCase()));
            return matchesCategory && matchesSearch;
        });
    }

    /**
     * Teljes katalógus exportálása letölthető JSON fájlba
     */
    exportCatalogJSON() {
        const data = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            categories: this.categories,
            items: this.items
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `butor_katalogus_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Katalógus importálása JSON fájlból
     */
    importCatalogJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (data.categories && Array.isArray(data.categories)) {
                        // Összefésüljük a meglévő kategóriákkal
                        data.categories.forEach(cat => {
                            if (!this.categories.some(c => c.id === cat.id)) {
                                this.categories.push(cat);
                            }
                        });
                    }
                    if (data.items && Array.isArray(data.items)) {
                        // Összefésüljük a bútorokkal
                        data.items.forEach(item => {
                            if (!this.items.some(i => i.id === item.id)) {
                                this.items.push(item);
                            }
                        });
                    }
                    this.saveCategoriesToStorage();
                    this.saveItemsToStorage();
                    this.notifyChange();
                    resolve(true);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }
}


// --- FILE: cutListManager.js ---
/**
 * Szabászati és 2D Tábla Kiosztási Menedzser (cutListManager.js)
 * Kizárólag valódi bútorlapok kezelése, 2800×2070 mm-es táblákra történő
 * intelligens 2D vágásoptimalizálás (nesting), fűrészlap térköz (kerf) kezelés,
 * interaktív 2D Canvas vizualizáció, CSV export és nyomtatás.
 */

class CutListManager {
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


// --- FILE: app.js ---
/**
 * Fő Alkalmazás Vezérlő (app.js)
 * Összeköti a 3D grafikai motort, a lapkezelőt, az intelligens illesztőt, textúrákat és a bal oldali katalógust.
 */

/**
 * 3D Élőkép és Előnézet kezelő a Konyha Korpusz Varázsló jobb oldalán
 */
class KitchenPreview3D {
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
        this.selectedCustomGroup = null;
        this.editingCorpusId = null;
        this.previewCorpus = null;
        this.newCorpusOffsetX = 0;
        this.newCorpusOffsetY = 0;
        this.newCorpusOffsetZ = 0;
        this.kitchenBackupConfig = null;
        this.kitchenBackupBoards = null;
        this.savingTarget = null;
        this.applyTextureTarget = 'selected'; // 'selected' vagy 'all'
        this.activeTextureCategory = 'front'; // 'front', 'worktop' vagy 'all'
        this.kitchenElements = [];
        this.expandedCategories = new Set();
        this.lastSelectedBaseCorpus = null;

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

        // 6. Alaphelyzet: nincs kijelölt elem (kontextus menü rejtve)
        this.onBoardSelected(null);

        // Tiszta, üres 3D munkatérrel indulunk (nem töltünk be alapmodellt)
        this.renderHierarchyTree();
    }

    /**
     * Kezdő mintabútorok - kategóriák üresen indulnak, felhasználó töltheti fel
     */
    initPresetCatalog() {
        // Üresen hagyva: a felhasználó hozza létre és menti el a bútorokat
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

        // --- Jobb oldali Kontextus Fülek váltása ---
        document.querySelectorAll('.context-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.getAttribute('data-context-tab');
                if (!tabId) return;

                document.querySelectorAll('.context-tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.context-tab-pane').forEach(p => p.classList.remove('active'));

                btn.classList.add('active');
                const targetPane = document.getElementById(tabId);
                if (targetPane) targetPane.classList.add('active');
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

        // --- Jobb felső Nézet & Megjelenítés Legördülő Menü Események ---
        const btnViewMenuTrigger = document.getElementById('btn-view-menu-trigger');
        const viewMenuDropdown = document.getElementById('view-menu-dropdown');
        const currentViewLabel = document.getElementById('current-view-mode-label');

        if (btnViewMenuTrigger && viewMenuDropdown) {
            btnViewMenuTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = viewMenuDropdown.classList.toggle('open');
                btnViewMenuTrigger.classList.toggle('open', isOpen);
            });

            // Kattintás kívülre bezárja a legördülő nézetmenüt
            window.addEventListener('click', (e) => {
                if (!viewMenuDropdown.contains(e.target) && e.target !== btnViewMenuTrigger) {
                    viewMenuDropdown.classList.remove('open');
                    btnViewMenuTrigger.classList.remove('open');
                }
            });
        }

        const viewTitles = {
            'iso': '👁️ Nézet: 📐 3D Tér',
            'front': '👁️ Nézet: ⬛ Elöl (Ortho)',
            'top': '👁️ Nézet: ⬜ Felül (Ortho)',
            'right': '👁️ Nézet: 🔲 Oldal (Ortho)'
        };

        document.querySelectorAll('.view-menu-item[data-view]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.view-menu-item[data-view]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const viewKey = btn.getAttribute('data-view');
                this.scene3D.setCameraView(viewKey);

                if (currentViewLabel && viewTitles[viewKey]) {
                    currentViewLabel.textContent = viewTitles[viewKey];
                }

                if (viewMenuDropdown) viewMenuDropdown.classList.remove('open');
                if (btnViewMenuTrigger) btnViewMenuTrigger.classList.remove('open');
            });
        });

        // Vonalváz kapcsoló
        const checkWireframe = document.getElementById('check-wireframe-mode');
        const rowWireframe = document.getElementById('toggle-row-wireframe');
        if (checkWireframe && rowWireframe) {
            rowWireframe.addEventListener('click', (e) => {
                if (e.target !== checkWireframe) {
                    checkWireframe.checked = !checkWireframe.checked;
                }
                const isWireframe = this.scene3D.setWireframeMode(checkWireframe.checked);
            });
            checkWireframe.addEventListener('change', () => {
                this.scene3D.setWireframeMode(checkWireframe.checked);
            });
        }

        // Stúdió Raytrace Render kapcsoló
        const checkStudio = document.getElementById('check-studio-render');
        const rowStudio = document.getElementById('toggle-row-studio');
        if (checkStudio && rowStudio) {
            rowStudio.addEventListener('click', (e) => {
                if (e.target !== checkStudio) {
                    checkStudio.checked = !checkStudio.checked;
                }
                this.scene3D.setStudioMode(checkStudio.checked);
            });
            checkStudio.addEventListener('change', () => {
                this.scene3D.setStudioMode(checkStudio.checked);
            });
        }

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
        const propInputs = ['prop-name', 'prop-width', 'prop-depth', 'prop-thickness', 'prop-pos-x', 'prop-pos-y', 'prop-pos-z', 'prop-rot-x', 'prop-rot-y', 'prop-rot-z', 'prop-edge-radius', 'prop-edgebanding'];
        propInputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', () => this.applyPropertiesFormToBoard());
                el.addEventListener('change', () => this.applyPropertiesFormToBoard());
            }
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
                    const deletedId = this.selectedCorpus.userData.id;
                    if (this.lastSelectedBaseCorpus && this.lastSelectedBaseCorpus.userData.id === deletedId) {
                        this.lastSelectedBaseCorpus = null;
                    }
                    this.boardManager.deleteCorpus(deletedId);
                    this.onBoardSelected(null);
                    this.updateDimensionsBadge();
                    this.renderHierarchyTree();
                    this.updateSnapTargetDropdown();
                }
            });
        }

        // --- Többes Kijelölés & Csoportosítás Gombok ---
        const btnGroupSelected = document.getElementById('btn-group-selected');
        if (btnGroupSelected) {
            btnGroupSelected.addEventListener('click', () => {
                const targets = this.scene3D.selectedTargets;
                if (!targets || targets.length < 1) return;

                const boardIds = [];
                targets.forEach(t => {
                    if (t.userData && t.userData.isCustomGroup) {
                        const children = this.boardManager.boards.filter(b => b.groupId === t.userData.id);
                        children.forEach(c => {
                            if (!boardIds.includes(c.id)) boardIds.push(c.id);
                        });
                    } else {
                        const b = this.boardManager.boards.find(x => x.mesh === t);
                        if (b && !b.corpusId && !boardIds.includes(b.id)) {
                            boardIds.push(b.id);
                        }
                    }
                });

                if (boardIds.length === 0) {
                    alert('Nincs érvényes egyedi bútorlap kijelölve a csoportosításhoz.');
                    return;
                }

                const group = this.boardManager.createGroup(boardIds);
                if (group) {
                    this.scene3D.selectBoard(group);
                    this.updateDimensionsBadge();
                    this.renderHierarchyTree();
                    this.updateSnapTargetDropdown();
                }
            });
        }

        const btnDupMulti = document.getElementById('btn-duplicate-multi');
        if (btnDupMulti) {
            btnDupMulti.addEventListener('click', () => {
                const targets = [...this.scene3D.selectedTargets];
                const newTargets = [];
                targets.forEach(t => {
                    if (t.userData && t.userData.isCustomGroup) {
                        const dupG = this.boardManager.duplicateGroup(t.userData.id);
                        if (dupG) newTargets.push(dupG);
                    } else if (t.userData && t.userData.isCorpus) {
                        const dupC = this.boardManager.duplicateCorpus(t.userData.id);
                        if (dupC) newTargets.push(dupC);
                    } else {
                        const b = this.boardManager.boards.find(x => x.mesh === t);
                        if (b) {
                            const dupB = this.boardManager.duplicateBoard(b.id);
                            if (dupB) newTargets.push(dupB.mesh);
                        }
                    }
                });
                if (newTargets.length > 0) {
                    this.scene3D.setMultiSelection(newTargets);
                }
                this.updateDimensionsBadge();
                this.renderHierarchyTree();
                this.updateSnapTargetDropdown();
            });
        }

        const btnDelMulti = document.getElementById('btn-delete-multi');
        if (btnDelMulti) {
            btnDelMulti.addEventListener('click', () => {
                const targets = [...this.scene3D.selectedTargets];
                targets.forEach(t => {
                    if (t.userData && t.userData.isCustomGroup) {
                        this.boardManager.deleteGroup(t.userData.id);
                    } else if (t.userData && t.userData.isCorpus) {
                        this.boardManager.deleteCorpus(t.userData.id);
                    } else {
                        const b = this.boardManager.boards.find(x => x.mesh === t);
                        if (b) {
                            this.boardManager.deleteBoard(b.id);
                        }
                    }
                });
                this.scene3D.selectBoard(null);
                this.updateDimensionsBadge();
                this.renderHierarchyTree();
                this.updateSnapTargetDropdown();
            });
        }

        // --- Bútor Csoport Műveletek (Ungroup, Duplicate, Delete, Rename) ---
        const btnUngroup = document.getElementById('btn-ungroup');
        if (btnUngroup) {
            btnUngroup.addEventListener('click', () => {
                if (this.selectedCustomGroup) {
                    const unpacked = this.boardManager.ungroup(this.selectedCustomGroup.userData.id);
                    if (unpacked && unpacked.length > 0) {
                        this.scene3D.setMultiSelection(unpacked);
                    }
                    this.updateDimensionsBadge();
                    this.renderHierarchyTree();
                    this.updateSnapTargetDropdown();
                }
            });
        }

        const btnDupGroup = document.getElementById('btn-duplicate-group');
        if (btnDupGroup) {
            btnDupGroup.addEventListener('click', () => {
                if (this.selectedCustomGroup) {
                    this.boardManager.duplicateGroup(this.selectedCustomGroup.userData.id);
                    this.updateDimensionsBadge();
                    this.renderHierarchyTree();
                    this.updateSnapTargetDropdown();
                }
            });
        }

        const btnDelGroup = document.getElementById('btn-delete-group');
        if (btnDelGroup) {
            btnDelGroup.addEventListener('click', () => {
                if (this.selectedCustomGroup) {
                    this.boardManager.deleteGroup(this.selectedCustomGroup.userData.id);
                    this.onBoardSelected(null);
                    this.updateDimensionsBadge();
                    this.renderHierarchyTree();
                    this.updateSnapTargetDropdown();
                }
            });
        }

        const propGroupName = document.getElementById('prop-group-name');
        if (propGroupName) {
            propGroupName.addEventListener('input', (e) => {
                if (this.selectedCustomGroup) {
                    this.boardManager.updateGroup(this.selectedCustomGroup.userData.id, { name: e.target.value });
                    this.renderHierarchyTree();
                }
            });
        }

        const btnExtractSelected = document.getElementById('btn-extract-selected-board');
        if (btnExtractSelected) {
            btnExtractSelected.addEventListener('click', () => {
                if (this.selectedBoard && this.selectedBoard.groupId) {
                    this.boardManager.removeBoardFromGroup(this.selectedBoard.id);
                    this.onBoardSelected(this.selectedBoard.mesh);
                    this.renderHierarchyTree();
                    this.updateSnapTargetDropdown();
                }
            });
        }

        const btnCreateGroupFromSingle = document.getElementById('btn-create-group-from-single');
        if (btnCreateGroupFromSingle) {
            btnCreateGroupFromSingle.addEventListener('click', () => {
                if (this.selectedBoard) {
                    const group = this.boardManager.createGroup([this.selectedBoard.id]);
                    if (group) {
                        this.scene3D.selectBoard(group);
                        this.updateDimensionsBadge();
                        this.renderHierarchyTree();
                        this.updateSnapTargetDropdown();
                        this.switchContextTab('ctx-tab-group');
                    }
                }
            });
        }

        const btnSelectParentGroup = document.getElementById('btn-select-parent-group');
        if (btnSelectParentGroup) {
            btnSelectParentGroup.addEventListener('click', () => {
                if (this.selectedBoard && this.selectedBoard.groupId) {
                    const grp = this.boardManager.customGroups.find(g => g.userData.id === this.selectedBoard.groupId);
                    if (grp) {
                        this.scene3D.selectBoard(grp);
                        this.switchContextTab('ctx-tab-group');
                    }
                }
            });
        }

        const btnExtractSingleBoard = document.getElementById('btn-extract-single-board');
        if (btnExtractSingleBoard) {
            btnExtractSingleBoard.addEventListener('click', () => {
                if (this.selectedBoard && this.selectedBoard.groupId) {
                    this.boardManager.removeBoardFromGroup(this.selectedBoard.id);
                    this.onBoardSelected(this.selectedBoard.mesh);
                    this.renderHierarchyTree();
                    this.updateSnapTargetDropdown();
                    this.switchContextTab('ctx-tab-group');
                }
            });
        }

        const btnSelectAllGroupable = document.getElementById('btn-select-all-groupable');
        if (btnSelectAllGroupable) {
            btnSelectAllGroupable.addEventListener('click', () => {
                const checkboxes = document.querySelectorAll('.group-check-item');
                const allChecked = Array.from(checkboxes).every(cb => cb.checked);
                checkboxes.forEach(cb => { cb.checked = !allChecked; });

                const checkedIds = Array.from(document.querySelectorAll('.group-check-item:checked')).map(cb => cb.getAttribute('data-id'));
                const checkedMeshes = this.boardManager.boards.filter(b => checkedIds.includes(b.id)).map(b => b.mesh).filter(Boolean);
                if (checkedMeshes.length > 1) {
                    this.scene3D.setMultiSelection(checkedMeshes);
                } else if (checkedMeshes.length === 1) {
                    this.scene3D.selectBoard(checkedMeshes[0]);
                }
            });
        }

        const btnCreateGroupFromChecklist = document.getElementById('btn-create-group-from-checklist');
        if (btnCreateGroupFromChecklist) {
            btnCreateGroupFromChecklist.addEventListener('click', () => {
                const checkboxes = document.querySelectorAll('.group-check-item:checked');
                const checkedIds = Array.from(checkboxes).map(cb => cb.getAttribute('data-id'));
                if (checkedIds.length === 0) {
                    alert('Kérlek jelölj be legalább egy bútorlapot a csoportosításhoz!');
                    return;
                }
                const group = this.boardManager.createGroup(checkedIds);
                if (group) {
                    this.scene3D.selectBoard(group);
                    this.updateDimensionsBadge();
                    this.renderHierarchyTree();
                    this.updateSnapTargetDropdown();
                    this.switchContextTab('ctx-tab-group');
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

        // --- Textúra Kategória Szűrő Gombok (Front vs Munkalap) ---
        document.querySelectorAll('.btn-tex-cat').forEach(btn => {
            btn.addEventListener('click', () => {
                const cat = btn.getAttribute('data-cat') || 'front';
                this.renderTextureGrid(cat);
            });
        });

        // Konyha varázsló munkalap textúra módosítás
        const kcWtTex = document.getElementById('kc-worktop-texture');
        if (kcWtTex) {
            kcWtTex.addEventListener('change', () => {
                this.updateKitchenLivePreview();
            });
        }

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
            this.newCorpusOffsetY = 0;
            this.newCorpusOffsetZ = 0;

            const modalTitle = document.querySelector('#modal-kitchen-generator .modal-title');
            if (modalTitle) modalTitle.innerHTML = '🍳 Konyha Elem Tervező Varázsló';

            const btnConfirm = document.getElementById('btn-confirm-kitchen');
            if (btnConfirm) btnConfirm.innerHTML = '➕ Konyha Elem Hozzáadása';

            this.openModal('modal-kitchen-generator');
            this.syncKitchenWorktopMath();

            // Új előnézeti korpusz azonnali létrehozása a jelenetben
            const config = this.getKitchenConfigFromUI();
            if (config.type === 'wall') {
                const placement = this.getWallCabinetPlacement(config);
                this.newCorpusOffsetX = placement.x;
                this.newCorpusOffsetY = placement.y;
                this.newCorpusOffsetZ = placement.z;
            }
            this.previewCorpus = this.boardManager.createCorpus(config, this.newCorpusOffsetX, this.newCorpusOffsetY || 0, this.newCorpusOffsetZ || 0);
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

        // Dinamikus Front Elem Hozzáadás Gombok (Nyíló Ajtó, Felnyíló Ajtó, Fiók, Sütő)
        const btnAddDoor = document.getElementById('btn-kc-add-door');
        if (btnAddDoor) {
            btnAddDoor.addEventListener('click', () => {
                this.addKitchenElement('door');
            });
        }

        const btnAddLiftUp = document.getElementById('btn-kc-add-liftup');
        if (btnAddLiftUp) {
            btnAddLiftUp.addEventListener('click', () => {
                this.addKitchenElement('lift_up');
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
        const updateBackPanelVisibility = () => {
            const backType = document.getElementById('kc-back-type').value;
            const isSurface = backType === 'surface';
            const gapContainer = document.getElementById('kc-back-gap-container');
            const insetContainer = document.getElementById('kc-back-inset-container');
            const surfaceNotice = document.getElementById('kc-back-surface-notice');
            if (gapContainer) gapContainer.style.display = isSurface ? 'block' : 'none';
            if (insetContainer) insetContainer.style.display = isSurface ? 'none' : 'block';
            if (surfaceNotice) surfaceNotice.style.display = isSurface ? 'block' : 'none';
        };

        document.getElementById('kc-back-type').addEventListener('change', () => {
            updateBackPanelVisibility();
            this.updateKitchenLivePreview();
        });

        // Hátfal magasság auto-szinkronizálás korpusz magasság változásakor
        document.getElementById('kc-height').addEventListener('input', () => {
            const corpusH = Number(document.getElementById('kc-height').value) || 720;
            const gap = Number(document.getElementById('kc-back-gap')?.value) || 2.5;
            const backHInput = document.getElementById('kc-back-height');
            if (backHInput) {
                backHInput.value = Math.max(10, corpusH - (2 * gap));
            }
        });

        // Munkalap hátfal bekapcsolása / kikapcsolása
        const splashbackCheckbox = document.getElementById('kc-worktop-splashback-enabled');
        if (splashbackCheckbox) {
            splashbackCheckbox.addEventListener('change', (e) => {
                const settingsDiv = document.getElementById('kc-worktop-splashback-settings');
                if (settingsDiv) settingsDiv.style.display = e.target.checked ? 'grid' : 'none';
                this.updateKitchenLivePreview();
            });
        }

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

    switchContextTab(tabId) {
        document.querySelectorAll('.context-tab-btn').forEach(b => {
            b.classList.toggle('active', b.getAttribute('data-context-tab') === tabId);
        });
        document.querySelectorAll('.context-tab-pane').forEach(p => {
            p.classList.toggle('active', p.id === tabId);
        });
    }

    onBoardSelected(target, selectedTargets = []) {
        const contextTabsBar = document.getElementById('context-tabs-bar');
        const contextTabContainer = document.getElementById('context-tab-content-container');
        const btnTabSnap = document.getElementById('btn-tab-snap');
        const btnTabGroup = document.getElementById('btn-tab-group');
        const btnTabDims = document.querySelector('.context-tab-btn[data-context-tab="ctx-tab-dims"]');

        const corpusPanel = document.getElementById('corpus-properties-panel');
        const boardPanel = document.getElementById('board-properties-panel');
        const groupPanel = document.getElementById('group-properties-panel');
        const multiPanel = document.getElementById('multi-selection-panel');
        const singleBoardGroupPanel = document.getElementById('single-board-group-panel');
        const singleBoardInGroupView = document.getElementById('single-board-in-group-view');
        const singleBoardNoGroupView = document.getElementById('single-board-no-group-view');
        const singleBoardGroupTitle = document.getElementById('single-board-group-title');

        const noBoardMsg = document.getElementById('no-board-selected-msg');
        const boardForm = document.getElementById('board-selected-form');
        const snappingPanel = document.getElementById('snapping-panel');
        const texturesPanel = document.getElementById('textures-panel');

        // 1. TÖBBES KIJELÖLÉS ESETE (Multi-select: 2 vagy több elem kijelölve)
        if (selectedTargets && selectedTargets.length > 1) {
            this.selectedBoard = null;
            this.selectedCorpus = null;
            this.selectedCustomGroup = null;

            // Kijelölt alsó korpusz keresése
            for (const t of selectedTargets) {
                if (t.userData && t.userData.isCorpus) {
                    const cfg = t.userData.config;
                    const tp = cfg?.type;
                    const isBase = tp === 'base' || (!tp && (Number(t.userData.height) || 720) < 1000 && t.position.y < 500);
                    if (isBase) {
                        this.lastSelectedBaseCorpus = t;
                        break;
                    }
                }
            }

            if (contextTabsBar) contextTabsBar.style.display = 'flex';
            if (contextTabContainer) contextTabContainer.style.display = 'flex';

            if (btnTabDims) btnTabDims.style.display = 'none';
            if (btnTabSnap) btnTabSnap.style.display = 'none';
            if (btnTabGroup) btnTabGroup.style.display = 'flex';

            if (corpusPanel) corpusPanel.style.display = 'none';
            if (boardPanel) boardPanel.style.display = 'none';
            if (groupPanel) groupPanel.style.display = 'none';
            if (singleBoardGroupPanel) singleBoardGroupPanel.style.display = 'none';
            if (snappingPanel) snappingPanel.style.display = 'none';
            if (multiPanel) {
                multiPanel.style.display = 'block';
                const countBadge = document.getElementById('multi-selection-count-badge');
                if (countBadge) countBadge.textContent = `${selectedTargets.length} db`;
            }
            if (texturesPanel) texturesPanel.style.display = 'block';

            const activeBtn = document.querySelector('.context-tab-btn.active');
            if (!activeBtn || activeBtn === btnTabDims || activeBtn === btnTabSnap) {
                this.switchContextTab('ctx-tab-group');
            }

            this.highlightHierarchyItem(null);
            return;
        }

        // 2. HA NINCS KIJELÖLÉS
        if (!target) {
            this.selectedBoard = null;
            this.selectedCorpus = null;
            this.selectedCustomGroup = null;

            if (contextTabsBar) contextTabsBar.style.display = 'none';
            if (contextTabContainer) contextTabContainer.style.display = 'none';

            if (corpusPanel) corpusPanel.style.display = 'none';
            if (boardPanel) boardPanel.style.display = 'none';
            if (groupPanel) groupPanel.style.display = 'none';
            if (multiPanel) multiPanel.style.display = 'none';
            if (singleBoardGroupPanel) singleBoardGroupPanel.style.display = 'none';
            if (noBoardMsg) noBoardMsg.style.display = 'none';
            if (boardForm) boardForm.style.display = 'none';
            if (snappingPanel) snappingPanel.style.display = 'none';
            if (texturesPanel) texturesPanel.style.display = 'none';
            this.highlightHierarchyItem(null);
            return;
        }

        if (contextTabsBar) contextTabsBar.style.display = 'flex';
        if (contextTabContainer) contextTabContainer.style.display = 'flex';
        if (multiPanel) multiPanel.style.display = 'none';

        // 3. HA EGYEDI BÚTOR CSOPORT (THREE.Group isCustomGroup)
        if (target.userData && target.userData.isCustomGroup) {
            this.selectedBoard = null;
            this.selectedCorpus = null;
            this.selectedCustomGroup = target;

            if (btnTabDims) btnTabDims.style.display = 'none';
            if (btnTabSnap) btnTabSnap.style.display = 'none';
            if (btnTabGroup) btnTabGroup.style.display = 'flex';

            if (corpusPanel) corpusPanel.style.display = 'none';
            if (boardPanel) boardPanel.style.display = 'none';
            if (singleBoardGroupPanel) singleBoardGroupPanel.style.display = 'none';
            if (groupPanel) groupPanel.style.display = 'block';
            if (snappingPanel) snappingPanel.style.display = 'none';
            if (texturesPanel) texturesPanel.style.display = 'block';

            const nameInput = document.getElementById('prop-group-name');
            const dimsEl = document.getElementById('group-prop-dims');
            const countEl = document.getElementById('group-prop-count');
            const childrenListEl = document.getElementById('group-children-list');

            if (nameInput) nameInput.value = target.userData.name || 'Bútor Csoport';
            if (dimsEl) dimsEl.textContent = `${target.userData.width || 0} × ${target.userData.height || 0} × ${target.userData.depth || 0} mm`;

            const childBoards = this.boardManager.boards.filter(b => b.groupId === target.userData.id);
            if (countEl) countEl.textContent = `${childBoards.length} db bútorlap a csoportban`;

            if (childrenListEl) {
                childrenListEl.innerHTML = '';
                childBoards.forEach(b => {
                    const row = document.createElement('div');
                    row.style.cssText = 'display:flex; justify-content:space-between; align-items:center; background:var(--bg-card); padding:5px 8px; border-radius:var(--radius-sm); border:1px solid var(--border-color); font-size:11px;';
                    row.innerHTML = `
                        <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:170px;">
                            <span style="font-weight:600; color:#fff;">${b.name}</span>
                            <span style="color:var(--text-muted); font-size:10px;"> (${Math.round(b.width)}×${Math.round(b.height)})</span>
                        </div>
                        <button class="btn btn-sm btn-extract-child" data-id="${b.id}" style="padding:1px 6px; font-size:10px; background:#10b981; color:#fff; border:none; cursor:pointer;" title="Lap leválasztása a csoportról">⏏️ Kivétel</button>
                    `;
                    row.querySelector('.btn-extract-child').addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.boardManager.removeBoardFromGroup(b.id);
                        this.scene3D.selectBoard(b.mesh);
                        this.renderHierarchyTree();
                    });
                    childrenListEl.appendChild(row);
                });
            }

            const activeBtn = document.querySelector('.context-tab-btn.active');
            if (!activeBtn || activeBtn === btnTabDims || activeBtn === btnTabSnap) {
                this.switchContextTab('ctx-tab-group');
            }

            this.highlightHierarchyItem(target.userData.id);
            this.updateSnapTargetDropdown();
            return;
        }

        // 4. HA KONYHA KORPUSZ EGYSÉG (THREE.Group isCorpus)
        if (target.userData && target.userData.isCorpus) {
            this.selectedBoard = null;
            this.selectedCorpus = target;
            this.selectedCustomGroup = null;

            // Alsó elem megjegyzése felső elemek igazításához
            const cfg = target.userData.config;
            const t = cfg?.type;
            const isBase = t === 'base' || (!t && (Number(target.userData.height) || 720) < 1000 && target.position.y < 500);
            if (isBase) {
                this.lastSelectedBaseCorpus = target;
            }

            if (btnTabDims) btnTabDims.style.display = 'flex';
            if (btnTabSnap) btnTabSnap.style.display = 'none';
            if (btnTabGroup) btnTabGroup.style.display = 'none';

            if (corpusPanel) corpusPanel.style.display = 'block';
            if (boardPanel) boardPanel.style.display = 'none';
            if (groupPanel) groupPanel.style.display = 'none';
            if (singleBoardGroupPanel) singleBoardGroupPanel.style.display = 'none';
            if (snappingPanel) snappingPanel.style.display = 'none';
            if (texturesPanel) texturesPanel.style.display = 'block';

            const nameEl = document.getElementById('corpus-prop-name');
            const dimsEl = document.getElementById('corpus-prop-dims');
            if (nameEl) nameEl.textContent = target.userData.name || 'Konyha Korpusz';
            if (dimsEl) dimsEl.textContent = `${target.userData.width} × ${target.userData.height} × ${target.userData.depth} mm`;

            const activeBtn = document.querySelector('.context-tab-btn.active');
            if (!activeBtn || activeBtn === btnTabSnap || activeBtn === btnTabGroup) {
                this.switchContextTab('ctx-tab-dims');
            }

            this.highlightHierarchyItem(target.userData.id);
            this.updateSnapTargetDropdown();
            return;
        }

        // 5. HA EGYEDI BÚTORLAP (THREE.Mesh)
        const board = this.boardManager.boards.find(b => b.mesh === target);
        if (board) {
            this.selectedBoard = board;
            this.selectedCorpus = null;
            this.selectedCustomGroup = null;

            if (board.corpusId) {
                const parentCorpus = this.boardManager.corpora.find(c => c.userData.id === board.corpusId);
                if (parentCorpus) {
                    const cfg = parentCorpus.userData.config;
                    const t = cfg?.type;
                    const isBase = t === 'base' || (!t && (Number(parentCorpus.userData.height) || 720) < 1000 && parentCorpus.position.y < 500);
                    if (isBase) {
                        this.lastSelectedBaseCorpus = parentCorpus;
                    }
                }
            }

            if (btnTabDims) btnTabDims.style.display = 'flex';
            if (btnTabSnap) btnTabSnap.style.display = 'flex';
            if (btnTabGroup) btnTabGroup.style.display = 'flex';

            if (corpusPanel) corpusPanel.style.display = 'none';
            if (boardPanel) boardPanel.style.display = 'block';
            if (groupPanel) groupPanel.style.display = 'none';
            if (noBoardMsg) noBoardMsg.style.display = 'none';
            if (boardForm) boardForm.style.display = 'block';
            if (snappingPanel) snappingPanel.style.display = 'block';
            if (texturesPanel) texturesPanel.style.display = 'block';

            // Csoport tagság és Csoport fül nézet beállítása
            if (singleBoardGroupPanel) singleBoardGroupPanel.style.display = 'block';
            const groupNotice = document.getElementById('board-in-group-notice');
            const groupNameLabel = document.getElementById('board-group-name-label');

            if (board.groupId) {
                const grp = this.boardManager.customGroups.find(g => g.userData.id === board.groupId);
                const gName = grp ? grp.userData.name : 'Csoport';
                if (groupNotice) groupNotice.style.display = 'flex';
                if (groupNameLabel) groupNameLabel.textContent = gName;
                if (singleBoardInGroupView) singleBoardInGroupView.style.display = 'block';
                if (singleBoardNoGroupView) singleBoardNoGroupView.style.display = 'none';
                if (singleBoardGroupTitle) singleBoardGroupTitle.textContent = gName;
            } else {
                if (groupNotice) groupNotice.style.display = 'none';
                if (singleBoardInGroupView) singleBoardInGroupView.style.display = 'none';
                if (singleBoardNoGroupView) singleBoardNoGroupView.style.display = 'block';
                this.renderGroupBoardChecklist();
            }

            this.updatePropertiesForm(board);
            this.highlightHierarchyItem(board.id);
            this.updateSnapTargetDropdown();
        }
    }

    renderGroupBoardChecklist() {
        const checklist = document.getElementById('group-board-checklist');
        if (!checklist) return;
        checklist.innerHTML = '';

        const standaloneBoards = this.boardManager.boards.filter(b => !b.corpusId && !b.groupId);
        if (standaloneBoards.length === 0) {
            checklist.innerHTML = '<div style="font-size:11px; color:var(--text-muted); padding:4px;">Nincs elérhető önálló bútorlap.</div>';
            return;
        }

        standaloneBoards.forEach(b => {
            const isCurrentlySelected = (this.selectedBoard && this.selectedBoard.id === b.id) ||
                (this.scene3D.selectedTargets && this.scene3D.selectedTargets.some(t => t === b.mesh || (t.userData && t.userData.id === b.id)));

            const row = document.createElement('label');
            row.style.cssText = 'display:flex; align-items:center; gap:8px; padding:4px 6px; background:var(--bg-panel); border-radius:4px; font-size:11px; cursor:pointer; user-select:none;';

            row.innerHTML = `
                <input type="checkbox" class="group-check-item" data-id="${b.id}" ${isCurrentlySelected ? 'checked' : ''} style="cursor:pointer; accent-color:#f59e0b;">
                <div style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                    <span style="font-weight:600; color:#fff;">${b.name}</span>
                    <span style="color:var(--text-muted); font-size:10px;"> (${Math.round(b.width)}×${Math.round(b.height)})</span>
                </div>
            `;

            row.querySelector('.group-check-item').addEventListener('change', () => {
                const checkedBoxes = document.querySelectorAll('.group-check-item:checked');
                const checkedIds = Array.from(checkedBoxes).map(cb => cb.getAttribute('data-id'));
                const checkedMeshes = this.boardManager.boards.filter(b => checkedIds.includes(b.id)).map(b => b.mesh).filter(Boolean);

                if (checkedMeshes.length > 1) {
                    this.scene3D.setMultiSelection(checkedMeshes);
                } else if (checkedMeshes.length === 1) {
                    this.scene3D.selectBoard(checkedMeshes[0]);
                }
            });

            checklist.appendChild(row);
        });
    }

    onBoardTransformed(target) {
        if (this.selectedBoard && this.selectedBoard.mesh === target) {
            this.updatePropertiesForm(this.selectedBoard);
            this.updateDimensionsBadge();
        } else if (this.selectedCorpus && this.selectedCorpus === target) {
            this.updateDimensionsBadge();
        }
        if (this.boardManager && this.boardManager.updateKitchenContinuity) {
            this.boardManager.updateKitchenContinuity();
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
            const bType = config.backPanel.type || 'surface';
            document.getElementById('kc-back-type').value = bType;
            const isSurface = bType === 'surface';
            const gapContainer = document.getElementById('kc-back-gap-container');
            const insetContainer = document.getElementById('kc-back-inset-container');
            const surfaceNotice = document.getElementById('kc-back-surface-notice');
            if (gapContainer) gapContainer.style.display = isSurface ? 'block' : 'none';
            if (insetContainer) insetContainer.style.display = isSurface ? 'none' : 'block';
            if (surfaceNotice) surfaceNotice.style.display = isSurface ? 'block' : 'none';

            if (config.backPanel.gap !== undefined) document.getElementById('kc-back-gap').value = config.backPanel.gap;
            if (config.backPanel.height !== undefined && config.backPanel.height !== null && config.backPanel.height > 0) {
                document.getElementById('kc-back-height').value = config.backPanel.height;
            } else {
                const corpusH = config.height || 720;
                const gap = config.backPanel.gap !== undefined ? Number(config.backPanel.gap) : 2.5;
                document.getElementById('kc-back-height').value = Math.max(10, corpusH - (2 * gap));
            }
            if (config.backPanel.offsetY !== undefined) document.getElementById('kc-back-offset-y').value = config.backPanel.offsetY;
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
            if (config.worktop.textureKey && document.getElementById('kc-worktop-texture')) {
                document.getElementById('kc-worktop-texture').value = config.worktop.textureKey;
            }

            // Munkalap hátfal (splashback)
            const hasSplashback = !!(config.worktop.splashback && config.worktop.splashback.enabled);
            const sbCheck = document.getElementById('kc-worktop-splashback-enabled');
            if (sbCheck) sbCheck.checked = hasSplashback;
            const sbSettings = document.getElementById('kc-worktop-splashback-settings');
            if (sbSettings) sbSettings.style.display = hasSplashback ? 'grid' : 'none';
            if (config.worktop.splashback?.height !== undefined) {
                document.getElementById('kc-worktop-splashback-height').value = config.worktop.splashback.height;
            }
            if (config.worktop.splashback?.thickness !== undefined) {
                document.getElementById('kc-worktop-splashback-depth').value = config.worktop.splashback.thickness;
            }
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
        document.getElementById('prop-depth').value = Math.round(board.depth);

        const thSelect = document.getElementById('prop-thickness');
        if (thSelect) {
            const thVal = String(board.thickness || (board.height > 0 && board.height < 50 ? board.height : 18));
            if (thSelect.querySelector(`option[value="${thVal}"]`)) {
                thSelect.value = thVal;
            } else {
                thSelect.value = '18';
            }
        }

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

        const th = Number(document.getElementById('prop-thickness').value) || 18;
        const isBack = (th === 3);
        const isWorktop = (th === 28 || th === 38);

        const updatedParams = {
            name: document.getElementById('prop-name').value,
            width: Math.max(1, Number(document.getElementById('prop-width').value)),
            depth: Math.max(1, Number(document.getElementById('prop-depth').value)),
            thickness: th,
            height: th,
            type: isBack ? 'back' : (isWorktop ? 'worktop' : (this.selectedBoard.type || 'horizontal')),
            isWorktop: isWorktop,
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

    renderTextureGrid(categoryFilter = null) {
        const grid = document.getElementById('texture-picker-grid');
        if (!grid) return;
        grid.innerHTML = '';

        if (categoryFilter) {
            this.activeTextureCategory = categoryFilter;
        } else if (!this.activeTextureCategory) {
            this.activeTextureCategory = 'front';
        }

        const cat = this.activeTextureCategory;

        // Kategória fül gombok aktív állapotának frissítése
        document.querySelectorAll('.btn-tex-cat').forEach(btn => {
            const btnCat = btn.getAttribute('data-cat') || 'front';
            btn.classList.toggle('active', btnCat === cat);
            btn.classList.toggle('btn-primary', btnCat === cat);
        });

        // Csak a feltöltött front és worktop textúrák megjelenítése (készülékeket és a belső fehér hátfalat nem jelenítjük meg a palettán)
        Object.keys(MaterialManager.textures).forEach(key => {
            const tex = MaterialManager.textures[key];
            if (!tex || tex.category === 'appliance' || key === 'white_matte') {
                return;
            }

            if (cat !== 'all' && tex.category && tex.category !== cat) {
                return;
            }

            const item = document.createElement('div');
            item.className = 'texture-item';
            item.style.position = 'relative';
            
            const isCurrentActive = (this.selectedBoard && this.selectedBoard.textureKey === key) ||
                (this.selectedCorpus && this.selectedCorpus.userData?.config?.textureKey === key) ||
                (this.selectedCorpus && this.selectedCorpus.userData?.config?.worktop?.textureKey === key);

            if (isCurrentActive) {
                item.classList.add('active');
            }

            const catBadge = tex.category === 'worktop' 
                ? `<span style="position:absolute; top:2px; right:2px; font-size:8px; background:rgba(2,132,199,0.9); color:#fff; padding:1px 4px; border-radius:3px; font-weight:600;">Munkalap</span>`
                : (tex.category === 'front' ? `<span style="position:absolute; top:2px; right:2px; font-size:8px; background:rgba(16,185,129,0.9); color:#fff; padding:1px 4px; border-radius:3px; font-weight:600;">Front</span>` : '');

            item.innerHTML = `
                ${catBadge}
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
        const texInfo = MaterialManager.textures[textureKey] || MaterialManager.textures['front_k001'];
        const isWorktopTex = texInfo && texInfo.category === 'worktop';

        if (this.applyTextureTarget === 'all') {
            this.boardManager.applyTextureToAll(textureKey);
            this.updateDimensionsBadge();
            return;
        }

        // 1. TÖBBES KIJELÖLÉS (2 vagy több elem / korpusz egyszerre van kijelölve)
        if (this.scene3D.selectedTargets && this.scene3D.selectedTargets.length > 1) {
            this.scene3D.selectedTargets.forEach(t => {
                if (t.userData && t.userData.isCorpus) {
                    this.boardManager.applyTextureToCorpus(t, textureKey);
                } else if (t.userData && t.userData.isCustomGroup) {
                    if (!isWorktopTex) this.boardManager.updateGroup(t.userData.id, { textureKey: textureKey });
                } else {
                    const b = this.boardManager.boards.find(x => x.mesh === t);
                    if (b) {
                        const isWorktop = b.isWorktop || b.type === 'worktop' || b.isSplashback;
                        const isBack = !b.isSplashback && (b.type === 'back' || (b.name && b.name.includes('Hátfal')));
                        if (isBack) return; // Hátfal mindig fehér marad!
                        if (isWorktop && isWorktopTex) {
                            this.boardManager.updateBoard(b.id, { textureKey: textureKey });
                        } else if (!isWorktop && !isWorktopTex) {
                            this.boardManager.updateBoard(b.id, { textureKey: textureKey });
                        }
                    }
                }
            });
            this.boardManager.updateKitchenContinuity();
            this.updateDimensionsBadge();
            return;
        }

        // 2. EGYEDI KORPUSZ KIJELÖLÉS
        if (this.selectedCorpus) {
            this.boardManager.applyTextureToCorpus(this.selectedCorpus, textureKey);
            this.updateDimensionsBadge();
            return;
        }

        // 3. EGYEDI BÚTOR CSOPORT KIJELÖLÉS
        if (this.selectedCustomGroup) {
            if (!isWorktopTex) {
                this.boardManager.updateGroup(this.selectedCustomGroup.userData.id, { textureKey: textureKey });
            } else {
                alert('A munkalap textúrák csak konyhai munkalapokra alkalmazhatók!');
            }
            return;
        }

        // 4. EGYEDI BÚTORLAP KIJELÖLÉS
        if (this.selectedBoard) {
            const isWorktop = this.selectedBoard.isWorktop || this.selectedBoard.type === 'worktop' || this.selectedBoard.isSplashback;
            const isBack = !this.selectedBoard.isSplashback && (this.selectedBoard.type === 'back' || (this.selectedBoard.name && this.selectedBoard.name.includes('Hátfal')));

            if (isBack) {
                alert('A korpusz hátfal rögzítetten fehér anyagú.');
                return;
            }

            if (isWorktop && !isWorktopTex) {
                alert('Munkalapra csak munkalap textúra választható ki!');
                return;
            }

            if (!isWorktop && isWorktopTex) {
                alert('A munkalap textúrák csak konyhai munkalapokra alkalmazhatók! Bútorlapokhoz és frontokhoz válassz a Front textúrák közül.');
                return;
            }

            this.boardManager.updateBoard(this.selectedBoard.id, { textureKey: textureKey });
        } else {
            if (!isWorktopTex) {
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
                    if (this.lastSelectedBaseCorpus && this.lastSelectedBaseCorpus.userData.id === c.userData.id) {
                        this.lastSelectedBaseCorpus = null;
                    }
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

        // 2. Egyedi Bútor Csoportok
        this.boardManager.customGroups.forEach((g) => {
            const isGroupActive = (this.selectedCustomGroup && this.selectedCustomGroup.userData.id === g.userData.id);
            const childBoards = this.boardManager.boards.filter(b => b.groupId === g.userData.id);

            const groupContainer = document.createElement('div');
            groupContainer.style.cssText = 'background:rgba(16,185,129,0.06); border:1px solid rgba(16,185,129,0.25); border-radius:var(--radius-sm); margin-bottom:8px; overflow:hidden;';

            const groupHeader = document.createElement('div');
            groupHeader.className = `hierarchy-item ${isGroupActive ? 'active' : ''}`;
            groupHeader.style.cssText = 'border:none; border-bottom:1px solid rgba(16,185,129,0.2); background:transparent; margin:0;';

            groupHeader.innerHTML = `
                <div>
                    <div class="hierarchy-title" style="color:#10b981; font-weight:700;">📦 ${g.userData.name}</div>
                    <div class="hierarchy-sub" style="color:#6ee7b7;">${g.userData.width || 0} × ${g.userData.height || 0} × ${g.userData.depth || 0} mm (${childBoards.length} lap)</div>
                </div>
                <div style="display:flex; gap:4px;">
                    <button class="btn btn-sm btn-icon btn-group-ungroup" title="Csoport Szétbontása" style="color:#10b981;">🔓</button>
                    <button class="btn btn-sm btn-icon btn-group-delete" title="Csoport Törlése" style="color:#ef4444;">✕</button>
                </div>
            `;

            groupHeader.addEventListener('click', (e) => {
                if (e.target.closest('.btn-group-ungroup')) {
                    this.boardManager.ungroup(g.userData.id);
                    this.updateDimensionsBadge();
                    this.renderHierarchyTree();
                    this.updateSnapTargetDropdown();
                    return;
                }
                if (e.target.closest('.btn-group-delete')) {
                    this.boardManager.deleteGroup(g.userData.id);
                    this.onBoardSelected(null);
                    this.updateDimensionsBadge();
                    this.renderHierarchyTree();
                    this.updateSnapTargetDropdown();
                    return;
                }
                if (e.shiftKey || e.ctrlKey || e.metaKey) {
                    this.scene3D.toggleMultiSelectTarget(g);
                } else {
                    this.scene3D.selectBoard(g);
                }
            });

            groupContainer.appendChild(groupHeader);

            // Belső lapok listája
            const childrenWrapper = document.createElement('div');
            childrenWrapper.style.cssText = 'padding:4px 6px 6px 14px; display:flex; flex-direction:column; gap:4px;';

            childBoards.forEach(b => {
                const isChildActive = (this.selectedBoard && this.selectedBoard.id === b.id);
                const childItem = document.createElement('div');
                childItem.className = `hierarchy-item ${isChildActive ? 'active' : ''}`;
                childItem.style.cssText = 'padding:4px 8px; margin:0; background:var(--bg-card); font-size:11px;';

                childItem.innerHTML = `
                    <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1;">
                        <span style="font-weight:600; color:#fff;">📄 ${b.name}</span>
                        <span style="color:var(--text-muted); font-size:10px;"> (${Math.round(b.width)}×${Math.round(b.height)})</span>
                    </div>
                    <div style="display:flex; gap:4px;">
                        <button class="btn btn-sm btn-child-extract" title="Lap leválasztása a csoportról" style="padding:1px 5px; font-size:10px; background:#10b981; color:#fff; border:none; cursor:pointer;">⏏️</button>
                    </div>
                `;

                childItem.addEventListener('click', (e) => {
                    if (e.target.closest('.btn-child-extract')) {
                        this.boardManager.removeBoardFromGroup(b.id);
                        this.scene3D.selectBoard(b.mesh);
                        this.renderHierarchyTree();
                        this.updateSnapTargetDropdown();
                        return;
                    }
                    if (e.shiftKey || e.ctrlKey || e.metaKey) {
                        this.scene3D.toggleMultiSelectTarget(b.mesh);
                    } else {
                        this.scene3D.selectBoard(b.mesh);
                    }
                });

                childrenWrapper.appendChild(childItem);
            });

            groupContainer.appendChild(childrenWrapper);
            container.appendChild(groupContainer);
        });

        // 3. Önálló (nem csoportosított) bútorlapok
        const standaloneBoards = this.boardManager.boards.filter(b => !b.corpusId && !b.groupId);
        standaloneBoards.forEach((b, index) => {
            const isCurrentlySelected = (this.selectedBoard && this.selectedBoard.id === b.id) ||
                (this.scene3D.selectedTargets && this.scene3D.selectedTargets.some(t => t === b.mesh || (t.userData && t.userData.id === b.id)));
            const item = document.createElement('div');
            item.className = `hierarchy-item ${isCurrentlySelected ? 'active' : ''}`;

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
                if (e.shiftKey || e.ctrlKey || e.metaKey) {
                    this.scene3D.toggleMultiSelectTarget(b.mesh);
                } else {
                    this.scene3D.selectBoard(b.mesh);
                }
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

        // Kijelölt elem vagy korpusz vagy csoport meghatározása
        let target = this.selectedCustomGroup || this.selectedCorpus || (this.selectedBoard ? this.selectedBoard.mesh : null);
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
            } else if (this.boardManager.customGroups.length === 1 && this.boardManager.boards.filter(b => !b.groupId).length === 0) {
                target = this.boardManager.customGroups[0];
                this.scene3D.selectBoard(target);
            } else if (this.boardManager.corpora.length === 0 && this.boardManager.customGroups.length === 0 && this.boardManager.boards.length === 1) {
                target = this.boardManager.boards[0].mesh;
                this.scene3D.selectBoard(target);
            } else {
                alert('Kérlek kattints rá a 3D térben arra a csoportra, korpuszra vagy bútorlapra, amelyet el szeretnél menteni a katalógusba!');
                return;
            }
        }

        const isCorpus = target.userData && target.userData.isCorpus;
        const isCustomGroup = target.userData && target.userData.isCustomGroup;
        const targetId = target.userData ? target.userData.id : null;
        let defaultName = '';
        let targetInfoText = '';
        let defaultCat = 'cat_kitchen';

        if (isCorpus) {
            this.savingTarget = { type: 'corpus', id: targetId, target: target, name: target.userData.name };
            defaultName = target.userData.name || 'Konyha Korpusz';
            targetInfoText = `🍳 Kijelölt korpusz: ${target.userData.name} (${target.userData.width}×${target.userData.height}×${target.userData.depth} mm)`;
            defaultCat = 'cat_kitchen';
        } else if (isCustomGroup) {
            this.savingTarget = { type: 'group', id: targetId, target: target, name: target.userData.name };
            defaultName = target.userData.name || 'Bútor Csoport';
            targetInfoText = `📦 Kijelölt csoport: ${target.userData.name} (${target.userData.width}×${target.userData.height}×${target.userData.depth} mm)`;
            defaultCat = 'cat_living';
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
            document.getElementById('kc-fs-inset').value = 0;
            document.getElementById('kc-bs-enabled').checked = true;
            document.getElementById('kc-bs-inset').value = 0;
            document.getElementById('kc-back-type').value = 'surface';
            if (document.getElementById('kc-back-gap')) document.getElementById('kc-back-gap').value = 2.5;
            if (document.getElementById('kc-back-height')) document.getElementById('kc-back-height').value = 715;
            if (document.getElementById('kc-back-offset-y')) document.getElementById('kc-back-offset-y').value = 0;
            const gapContainer = document.getElementById('kc-back-gap-container');
            const insetContainer = document.getElementById('kc-back-inset-container');
            const surfaceNotice = document.getElementById('kc-back-surface-notice');
            if (gapContainer) gapContainer.style.display = 'block';
            if (insetContainer) insetContainer.style.display = 'none';
            if (surfaceNotice) surfaceNotice.style.display = 'block';
            document.getElementById('kc-legs-enabled').checked = true;
            document.getElementById('kc-legs-height').value = 100;
            document.getElementById('kc-plinth-enabled').checked = true;
            document.getElementById('kc-plinth-inset').value = 20;
            document.getElementById('kc-worktop-enabled').checked = true;
            document.getElementById('kc-worktop-depth').value = 600;
            if (document.getElementById('kc-worktop-edge-radius')) document.getElementById('kc-worktop-edge-radius').value = 3;
            document.getElementById('kc-worktop-overhang-front').value = 25;
            document.getElementById('kc-worktop-overhang-back').value = 15;
            if (document.getElementById('kc-worktop-splashback-enabled')) {
                document.getElementById('kc-worktop-splashback-enabled').checked = false;
                const sbSettings = document.getElementById('kc-worktop-splashback-settings');
                if (sbSettings) sbSettings.style.display = 'none';
                document.getElementById('kc-worktop-splashback-height').value = 600;
                document.getElementById('kc-worktop-splashback-depth').value = 5;
            }
            document.getElementById('kc-shelves-count').value = '1';

            if (!this.editingCorpusId) {
                const currentBounds = this.boardManager.getFurnitureBoundingBox();
                const initialW = Number(document.getElementById('kc-width').value) || 600;
                this.newCorpusOffsetX = currentBounds.width > 0 ? (currentBounds.width / 2 + initialW / 2 + 80) : 0;
                this.newCorpusOffsetY = 0;
                this.newCorpusOffsetZ = 0;
                if (this.previewCorpus) {
                    this.previewCorpus.position.set(this.newCorpusOffsetX, 0, 0);
                    this.previewCorpus.userData.x = this.newCorpusOffsetX;
                    this.previewCorpus.userData.y = 0;
                    this.previewCorpus.userData.z = 0;
                }
            }
        } else if (type === 'wall') {
            document.getElementById('kc-width').value = 600;
            document.getElementById('kc-height').value = 720;
            document.getElementById('kc-depth').value = 320;
            if (document.getElementById('kc-edge-radius')) document.getElementById('kc-edge-radius').value = 1;
            document.getElementById('kc-top-type').value = 'full_top';
            document.getElementById('kc-stretchers-settings').style.display = 'none';
            document.getElementById('kc-back-type').value = 'surface';
            if (document.getElementById('kc-back-gap')) document.getElementById('kc-back-gap').value = 2.5;
            if (document.getElementById('kc-back-height')) document.getElementById('kc-back-height').value = 715;
            if (document.getElementById('kc-back-offset-y')) document.getElementById('kc-back-offset-y').value = 0;
            document.getElementById('kc-legs-enabled').checked = false;
            document.getElementById('kc-plinth-enabled').checked = false;
            document.getElementById('kc-worktop-enabled').checked = false;
            document.getElementById('kc-shelves-count').value = '2';
            document.getElementById('kc-back-inset').value = 15;

            // Felső elem elhelyezése: mindig egy alsó elem tetejére rakja és a hátuljához igazítsa
            if (!this.editingCorpusId) {
                const wallCfg = {
                    width: 600,
                    height: 720,
                    depth: 320
                };
                const placement = this.getWallCabinetPlacement(wallCfg);
                this.newCorpusOffsetX = placement.x;
                this.newCorpusOffsetY = placement.y;
                this.newCorpusOffsetZ = placement.z;
                if (this.previewCorpus) {
                    this.previewCorpus.position.set(placement.x, placement.y, placement.z);
                    this.previewCorpus.userData.x = placement.x;
                    this.previewCorpus.userData.y = placement.y;
                    this.previewCorpus.userData.z = placement.z;
                }
            }
        } else if (type === 'tall') {
            document.getElementById('kc-width').value = 600;
            document.getElementById('kc-height').value = 2000;
            document.getElementById('kc-depth').value = 560;
            if (document.getElementById('kc-edge-radius')) document.getElementById('kc-edge-radius').value = 1;
            document.getElementById('kc-top-type').value = 'full_top';
            document.getElementById('kc-stretchers-settings').style.display = 'none';
            document.getElementById('kc-back-type').value = 'surface';
            if (document.getElementById('kc-back-gap')) document.getElementById('kc-back-gap').value = 2.5;
            if (document.getElementById('kc-back-height')) document.getElementById('kc-back-height').value = 1995;
            if (document.getElementById('kc-back-offset-y')) document.getElementById('kc-back-offset-y').value = 0;
            document.getElementById('kc-legs-enabled').checked = true;
            document.getElementById('kc-legs-height').value = 100;
            document.getElementById('kc-plinth-enabled').checked = true;
            document.getElementById('kc-plinth-inset').value = 20;
            document.getElementById('kc-worktop-enabled').checked = false;
            document.getElementById('kc-shelves-count').value = '3';

            if (!this.editingCorpusId) {
                const currentBounds = this.boardManager.getFurnitureBoundingBox();
                const initialW = Number(document.getElementById('kc-width').value) || 600;
                this.newCorpusOffsetX = currentBounds.width > 0 ? (currentBounds.width / 2 + initialW / 2 + 80) : 0;
                this.newCorpusOffsetY = 0;
                this.newCorpusOffsetZ = 0;
                if (this.previewCorpus) {
                    this.previewCorpus.position.set(this.newCorpusOffsetX, 0, 0);
                    this.previewCorpus.userData.x = this.newCorpusOffsetX;
                    this.previewCorpus.userData.y = 0;
                    this.previewCorpus.userData.z = 0;
                }
            }
        }
    }

    /**
     * Felsőszekrény (wall cabinet) automatikus pozicionálása alsószekrény tetejére, hátfalhoz igazítva
     */
    getWallCabinetPlacement(wallConfig) {
        const wallD = Number(wallConfig.depth) || 320;
        const wallW = Number(wallConfig.width) || 600;

        const corpora = (this.boardManager.corpora || []).filter(c => c !== this.previewCorpus);
        const baseCorpora = corpora.filter(c => {
            const t = c.userData.config?.type;
            return t === 'base' || (!t && (Number(c.userData.height) || 720) < 1000 && c.position.y < 500);
        });

        if (baseCorpora.length > 0) {
            const wallCorpora = corpora.filter(c => {
                const t = c.userData.config?.type;
                return t === 'wall' || (!t && c.position.y >= 1000);
            });

            let targetBase = null;

            // 1. Mindig az utoljára kijelölt alsó elemhez pattanjon, ha az érvényes
            if (this.lastSelectedBaseCorpus && baseCorpora.includes(this.lastSelectedBaseCorpus)) {
                targetBase = this.lastSelectedBaseCorpus;
            } else {
                const selected = this.selectedCorpus || (this.scene3D && this.scene3D.selectedTarget);
                if (selected && baseCorpora.includes(selected)) {
                    targetBase = selected;
                }
            }

            // 2. Ha nincs kifejezetten kijelölt alsó elem, keresünk olyat, ami felett még nincs felsőszekrény
            if (!targetBase) {
                for (const base of baseCorpora) {
                    const hasWallAbove = wallCorpora.some(w => Math.abs(w.position.x - base.position.x) < 50);
                    if (!hasWallAbove) {
                        targetBase = base;
                        break;
                    }
                }
            }

            // 3. Fallback: legutoljára létrehozott alsószekrény
            if (!targetBase) {
                targetBase = baseCorpora[baseCorpora.length - 1];
            }

            const baseConfig = targetBase.userData.config || {};
            const baseLegH = baseConfig.legs?.enabled ? Number(baseConfig.legs.height) : 0;
            const baseCorpusH = Number(baseConfig.height) || 720;
            const baseWtTh = baseConfig.worktop?.enabled ? Number(baseConfig.worktop.thickness) : 0;
            const splashbackH = (baseConfig.worktop?.enabled && baseConfig.worktop?.splashback?.enabled)
                ? Number(baseConfig.worktop.splashback.height)
                : 600;

            const baseTopY = targetBase.position.y + baseLegH + baseCorpusH + baseWtTh + splashbackH;
            const baseDepth = Number(baseConfig.depth) || 560;

            // Igazítás a munkalap és a hátfal hátsó síkjához (figyelembe véve az esetleges munkalap hátsó túlnyúlást is)
            const overhangBack = (baseConfig.worktop?.enabled && Number(baseConfig.worktop.overhangBack) > 0)
                ? Number(baseConfig.worktop.overhangBack)
                : 0;
            const baseBackPlane = (targetBase.position.z - (baseDepth / 2)) - overhangBack;

            const targetX = targetBase.position.x;
            const targetY = baseTopY;
            const targetZ = baseBackPlane + (wallD / 2);

            return { x: targetX, y: targetY, z: targetZ };
        }

        // Alapértelmezett, ha még nincs alsószekrény a térben
        const currentBounds = this.boardManager.getFurnitureBoundingBox();
        const targetX = currentBounds.width > 0 ? (currentBounds.width / 2 + wallW / 2 + 80) : 0;
        const targetY = 100 + 720 + 38 + 600; // 1458 mm standard konyhai magasság
        const targetZ = -280 + (wallD / 2);   // -120 mm (hátfal Z=-280)

        return { x: targetX, y: targetY, z: targetZ };
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
        const backHInput = document.getElementById('kc-back-height')?.value;
        const customBackH = (backHInput !== undefined && backHInput !== null && backHInput !== '') ? Number(backHInput) : null;

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
                insetFront: Number(document.getElementById('kc-fs-inset')?.value !== undefined ? document.getElementById('kc-fs-inset').value : 0),
                textureKey: texKey
            },

            backStretcher: {
                enabled: document.getElementById('kc-bs-enabled').checked,
                width: Number(document.getElementById('kc-bs-width').value) || 80,
                orientation: document.getElementById('kc-bs-orient').value || 'flat',
                insetBack: Number(document.getElementById('kc-bs-inset')?.value !== undefined ? document.getElementById('kc-bs-inset').value : 0),
                textureKey: texKey
            },

            backPanel: {
                enabled: document.getElementById('kc-back-enabled').checked,
                type: document.getElementById('kc-back-type').value || 'surface',
                thickness: Number(document.getElementById('kc-back-th').value) || 3,
                gap: Number(document.getElementById('kc-back-gap')?.value !== undefined ? document.getElementById('kc-back-gap').value : 2.5),
                height: customBackH,
                offsetY: Number(document.getElementById('kc-back-offset-y')?.value || 0),
                insetBack: Number(document.getElementById('kc-back-inset')?.value || 20),
                textureKey: 'white_matte' // A hátfal MINDIG fehér!
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
                textureKey: texKey
            },

            worktop: {
                enabled: document.getElementById('kc-worktop-enabled').checked,
                thickness: Number(document.getElementById('kc-worktop-th').value) || 38,
                depth: Number(document.getElementById('kc-worktop-depth').value) || 600,
                edgeRadius: Number(document.getElementById('kc-worktop-edge-radius')?.value) !== undefined ? Number(document.getElementById('kc-worktop-edge-radius').value) : 3,
                overhangFront: Number(document.getElementById('kc-worktop-overhang-front').value) || 25,
                overhangBack: Number(document.getElementById('kc-worktop-overhang-back').value) || 15,
                textureKey: document.getElementById('kc-worktop-texture')?.value || 'wt_k002',
                splashback: {
                    enabled: document.getElementById('kc-worktop-splashback-enabled') ? document.getElementById('kc-worktop-splashback-enabled').checked : false,
                    height: Number(document.getElementById('kc-worktop-splashback-height')?.value) || 600,
                    thickness: Number(document.getElementById('kc-worktop-splashback-depth')?.value !== undefined ? document.getElementById('kc-worktop-splashback-depth').value : 5),
                    textureKey: document.getElementById('kc-worktop-texture')?.value || 'wt_k002'
                }
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

    addKitchenElement(type, options = {}) {
        const corpusHeight = Number(document.getElementById('kc-height').value) || 720;
        let currentTotalH = 0;
        this.kitchenElements.forEach(el => {
            currentTotalH += Number(el.height) || 0;
        });

        const remainingH = Math.max(100, corpusHeight - currentTotalH);
        const id = 'elem_' + Date.now() + '_' + Math.floor(Math.random() * 1000);

        if (type === 'lift_up' || (type === 'door' && options.doorType === 'lift_up')) {
            const doorH = (this.kitchenElements.length === 0) ? corpusHeight : remainingH;
            this.kitchenElements.push({
                id: id,
                type: 'door',
                name: 'Felnyíló Ajtó',
                height: doorH,
                gap: 3,
                doorType: 'lift_up',
                thickness: 18,
                textureKey: document.getElementById('kc-texture').value || 'front_k001',
                hasHandle: true
            });
        } else if (type === 'door') {
            const doorH = (this.kitchenElements.length === 0) ? corpusHeight : remainingH;
            this.kitchenElements.push({
                id: id,
                type: 'door',
                name: 'Ajtó Front',
                height: doorH,
                gap: 3,
                doorType: (Number(document.getElementById('kc-width').value) >= 800) ? 'double' : 'single_left',
                thickness: 18,
                textureKey: document.getElementById('kc-texture').value || 'front_k001',
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
                textureKey: document.getElementById('kc-texture').value || 'front_k001',
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
                    Alapból nincs front hozzáadva (nyitott korpusz). Az alábbi gombokkal adhatsz hozzá tetszőlegesen nyíló vagy felnyíló ajtót, fiókot vagy beépíthető sütőt/főzőlapot!
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
                const isLiftUp = elem.doorType === 'lift_up';
                typeIcon = isLiftUp ? '⬆️' : '🚪';
                typeTitle = isLiftUp ? `Felnyíló Ajtó ${index + 1}` : `Ajtó ${index + 1}`;
                specificControls = `
                    <div>
                        <label class="form-label" style="font-size:10px;">Nyitás / Típus</label>
                        <select class="form-control elem-prop-doortype" data-id="${elem.id}" style="font-size:11px; padding:3px 6px;">
                            <option value="single_left" ${elem.doorType === 'single_left' || !elem.doorType ? 'selected' : ''}>Balos nyíló</option>
                            <option value="single_right" ${elem.doorType === 'single_right' ? 'selected' : ''}>Jobbos nyíló</option>
                            <option value="double" ${elem.doorType === 'double' ? 'selected' : ''}>Kétszárnyú ajtó</option>
                            <option value="lift_up" ${elem.doorType === 'lift_up' ? 'selected' : ''}>⬆️ Felnyíló ajtó (Gázteleszkópos)</option>
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
            if (config.type === 'wall') {
                const placement = this.getWallCabinetPlacement(config);
                this.newCorpusOffsetX = placement.x;
                this.newCorpusOffsetY = placement.y;
                this.newCorpusOffsetZ = placement.z;
                if (this.previewCorpus) {
                    this.previewCorpus.position.set(placement.x, placement.y, placement.z);
                    this.previewCorpus.userData.x = placement.x;
                    this.previewCorpus.userData.y = placement.y;
                    this.previewCorpus.userData.z = placement.z;
                }
            }
            if (this.previewCorpus) {
                this.boardManager.updateCorpus(this.previewCorpus.userData.id, config);
                this.updateDimensionsBadge();
            } else {
                this.previewCorpus = this.boardManager.createCorpus(config, this.newCorpusOffsetX || 0, this.newCorpusOffsetY || 0, this.newCorpusOffsetZ || 0);
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
            const newCorpus = this.boardManager.createCorpus(config, this.newCorpusOffsetX ?? offsetX, this.newCorpusOffsetY ?? 0, this.newCorpusOffsetZ ?? 0);
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


})();
