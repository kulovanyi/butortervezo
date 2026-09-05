/**
 * Textúra és Anyagkezelő modul (textures.js)
 * Magas minőségű procedurális faerezetek, uni színek, beton és egyedi textúra generátor
 */

export const MaterialManager = {
    textures: {},
    customTextures: {},

    init() {
        this.generateDefaultTextures();
    },

    /**
     * Procedurális textúrák létrehozása HTML5 Canvas segítségével
     */
    generateDefaultTextures() {
        // 1. Natúr Tölgy (Natural Oak)
        this.textures['oak_natural'] = this.createWoodTexture({
            baseColor: '#c8a165',
            grainColor: '#8a6234',
            ringColor: '#6e4c23',
            name: 'Natúr Tölgy',
            type: 'wood'
        });

        // 2. Sonoma Tölgy (Sonoma Oak)
        this.textures['oak_sonoma'] = this.createWoodTexture({
            baseColor: '#d6c4a8',
            grainColor: '#a89476',
            ringColor: '#806e53',
            name: 'Sonoma Tölgy',
            type: 'wood'
        });

        // 3. Sötét Dió (Dark Walnut)
        this.textures['walnut_dark'] = this.createWoodTexture({
            baseColor: '#533827',
            grainColor: '#342114',
            ringColor: '#22140a',
            name: 'Sötét Dió',
            type: 'wood'
        });

        // 4. Meleg Bükk (Beech)
        this.textures['beech_warm'] = this.createWoodTexture({
            baseColor: '#d99f6c',
            grainColor: '#b06f3b',
            ringColor: '#8c5021',
            name: 'Meleg Bükk',
            type: 'wood'
        });

        // 5. Fenyő (Pine Wood)
        this.textures['pine_light'] = this.createWoodTexture({
            baseColor: '#edd09e',
            grainColor: '#c79c5a',
            ringColor: '#9e6d2c',
            name: 'Skandináv Fenyő',
            type: 'wood'
        });

        // 6. Fehér Selyemfényű / Kasmír (White Matte)
        this.textures['white_matte'] = this.createSolidTexture({
            color: '#f8f9fa',
            noiseAmount: 3,
            name: 'Prémium Fehér (Matt)',
            type: 'solid'
        });

        // 7. Kasmír Szürke (Cashmere Grey)
        this.textures['cashmere'] = this.createSolidTexture({
            color: '#dcd5cc',
            noiseAmount: 4,
            name: 'Kasmír Bézs',
            type: 'solid'
        });

        // 8. Antracit Szürke (Anthracite)
        this.textures['anthracite'] = this.createSolidTexture({
            color: '#383b40',
            noiseAmount: 5,
            name: 'Antracit Szürke',
            type: 'solid'
        });

        // 9. Fekete Matt (Black Matte)
        this.textures['black_matte'] = this.createSolidTexture({
            color: '#1a1a1a',
            noiseAmount: 6,
            name: 'Matt Fekete',
            type: 'solid'
        });

        // 10. Loft Beton Hatás (Concrete Loft)
        this.textures['concrete'] = this.createConcreteTexture({
            baseColor: '#8a8d91',
            name: 'Loft Beton',
            type: 'stone'
        });

        // 11. Rozsdamentes Acél (Stainless Steel)
        this.textures['stainless_steel'] = this.createSolidTexture({
            color: '#a8b0b8',
            noiseAmount: 3,
            name: 'Rozsdamentes Acél',
            type: 'metal',
            metalness: 0.85,
            roughness: 0.25
        });

        // 12. Fekete Sütő Üveg (Oven Black Glass)
        this.textures['oven_black_glass'] = this.createSolidTexture({
            color: '#111317',
            noiseAmount: 1,
            name: 'Fekete Üveg Sütőfront',
            type: 'glass',
            metalness: 0.1,
            roughness: 0.1
        });

        // 13. Indukciós Főzőlap Üveg (Cooktop Glass)
        this.textures['cooktop_glass'] = this.createSolidTexture({
            color: '#0a0d12',
            noiseAmount: 1,
            name: 'Indukciós Főzőlap',
            type: 'glass',
            metalness: 0.2,
            roughness: 0.1
        });

        // 14. Króm Fém Fogantyú (Chrome / Silver)
        this.textures['metal_chrome'] = this.createSolidTexture({
            color: '#d1d5db',
            noiseAmount: 2,
            name: 'Króm Fém',
            type: 'metal',
            metalness: 0.95,
            roughness: 0.15
        });
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
    createMaterial(textureKey = 'oak_natural') {
        const texInfo = this.textures[textureKey] || this.textures['oak_natural'];
        
        const mat = new THREE.MeshStandardMaterial({
            map: texInfo.texture,
            roughness: texInfo.roughness !== undefined ? texInfo.roughness : 0.65,
            metalness: texInfo.metalness !== undefined ? texInfo.metalness : 0.05
        });

        mat.userData = {
            textureKey: textureKey,
            textureName: texInfo.name
        };

        return mat;
    },

    /**
     * Kijelölt lap textúrájának frissítése
     */
    applyTextureToMesh(mesh, textureKey, repeatX = 1, repeatY = 1) {
        if (!mesh) return;
        const texInfo = this.textures[textureKey] || this.textures['oak_natural'];
        
        const clonedTexture = texInfo.texture.clone();
        clonedTexture.wrapS = THREE.RepeatWrapping;
        clonedTexture.wrapT = THREE.RepeatWrapping;
        clonedTexture.repeat.set(repeatX, repeatY);
        clonedTexture.needsUpdate = true;

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
