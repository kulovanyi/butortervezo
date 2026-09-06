/**
 * Firebase Realtime Database Szinkronizációs Menedzser (firebaseSync.js)
 * Lehetővé teszi a bútor katalógus és PBR anyagok (képekkel, térképekkel)
 * felhős valós idejű tárolását, tömörítését és automatikus megosztását.
 */

export const FirebaseSync = {
    app: null,
    db: null,
    isConnected: false,
    storageKeyConfig: 'butortervezo_firebase_config_v1',
    catalogListeners: [],
    materialListeners: [],
    lastCatalogData: null,
    lastMaterialsData: null,

    // Beépített alapértelmezett Firebase konfiguráció
    defaultConfig: {
        apiKey: "AIzaSyA7g7Y63Ht9F2IY2KuhUvdmi-d4lXImrJ0",
        authDomain: "butortervezo-3da49.firebaseapp.com",
        databaseURL: "https://butortervezo-3da49-default-rtdb.firebaseio.com",
        projectId: "butortervezo-3da49",
        storageBucket: "butortervezo-3da49.firebasestorage.app",
        messagingSenderId: "146339595839",
        appId: "1:146339595839:web:2a7059895c8b8581e21a8a",
        measurementId: "G-006Q1HLZTE"
    },

    /**
     * Firebase inicializálása
     */
    init(onCatalogUpdateCallback, onMaterialUpdateCallback) {
        if (onCatalogUpdateCallback) {
            this.onCatalogUpdate(onCatalogUpdateCallback);
        }
        if (onMaterialUpdateCallback) {
            this.onMaterialUpdate(onMaterialUpdateCallback);
        }

        const config = this.getConfig();
        if (config && config.apiKey && config.projectId) {
            this.connect(config);
        } else {
            console.log('[FIREBASE] Nincs konfigurálva Firebase adatbázis (Helyi mód aktív).');
        }
    },

    /**
     * Katalógus figyelő regisztrálása
     */
    onCatalogUpdate(callback) {
        if (callback && !this.catalogListeners.includes(callback)) {
            this.catalogListeners.push(callback);
            if (this.lastCatalogData) {
                try {
                    callback(this.lastCatalogData);
                } catch (e) {
                    console.error('Hiba az azonnali katalógus callback híváskor:', e);
                }
            }
        }
    },

    /**
     * PBR Anyag figyelő regisztrálása
     */
    onMaterialUpdate(callback) {
        if (callback && !this.materialListeners.includes(callback)) {
            this.materialListeners.push(callback);
            if (this.lastMaterialsData) {
                try {
                    callback(this.lastMaterialsData);
                } catch (e) {
                    console.error('Hiba az azonnali anyag callback híváskor:', e);
                }
            }
        }
    },

    /**
     * Elmentett vagy alapértelmezett konfiguráció lekérése
     */
    getConfig() {
        try {
            const saved = localStorage.getItem(this.storageKeyConfig);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error('Hiba a Firebase config betöltésekor:', e);
        }
        return this.defaultConfig;
    },

    /**
     * Konfiguráció mentése és újracsatlakozás
     */
    saveConfig(config) {
        try {
            localStorage.setItem(this.storageKeyConfig, JSON.stringify(config));
            return this.connect(config);
        } catch (e) {
            console.error('Hiba a Firebase config mentésekor:', e);
            return false;
        }
    },

    /**
     * Csatlakozás a Firebase-hez
     */
    connect(config) {
        if (typeof firebase === 'undefined') {
            console.warn('[FIREBASE] A Firebase SDK nem töltődött be.');
            this.isConnected = false;
            return false;
        }

        try {
            if (firebase.apps && firebase.apps.length > 0) {
                this.app = firebase.apps[0];
            } else {
                this.app = firebase.initializeApp(config);
            }

            this.db = firebase.database();
            this.isConnected = true;
            console.log('[FIREBASE] Sikeres csatlakozás a felhőhöz! Project:', config.projectId);

            // Valós idejű figyelők beállítása
            this.setupRealtimeListeners();
            this.updateStatusUI(true);
            return true;
        } catch (e) {
            console.error('[FIREBASE] Csatlakozási hiba:', e);
            this.isConnected = false;
            this.updateStatusUI(false, e.message);
            return false;
        }
    },

    /**
     * Valós idejű adatfigyelők (Katalógus és Anyagok)
     */
    setupRealtimeListeners() {
        if (!this.db) return;

        try {
            // 1. Katalógus figyelő
            const catalogRef = this.db.ref('catalog');
            catalogRef.on('value', (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    this.lastCatalogData = data;
                    this.catalogListeners.forEach(cb => {
                        try {
                            cb(data);
                        } catch (err) {
                            console.error('Hiba a katalógus frissítő callbackben:', err);
                        }
                    });
                }
            }, (error) => {
                console.error('[FIREBASE] Katalógus adatlekérési hiba:', error);
            });

            // 2. PBR Anyagok figyelő
            const materialsRef = this.db.ref('materials');
            materialsRef.on('value', (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    this.lastMaterialsData = data;
                    this.materialListeners.forEach(cb => {
                        try {
                            cb(data);
                        } catch (err) {
                            console.error('Hiba az anyag frissítő callbackben:', err);
                        }
                    });
                }
            }, (error) => {
                console.error('[FIREBASE] PBR Anyagok adatlekérési hiba:', error);
            });
        } catch (e) {
            console.error('[FIREBASE] Figyelő hiba:', e);
        }
    },

    /**
     * Katalógus mentése a Firebase felhőbe
     */
    async saveCatalog(categories, items, actionName = 'Katalógus mentés') {
        if (!this.isConnected || !this.db) {
            return false;
        }

        try {
            const payload = {
                version: '1.0',
                lastUpdated: new Date().toISOString(),
                lastAction: actionName,
                categories: categories || [],
                items: items || []
            };

            await this.db.ref('catalog').set(payload);
            console.log(`[FIREBASE] Sikeres felhő mentés: ${items.length} bútor, ${categories.length} kategória.`);
            return true;
        } catch (e) {
            console.error('[FIREBASE] Mentési hiba a felhőbe:', e);
            return false;
        }
    },

    /**
     * Egyedi PBR Anyag mentése / frissítése a Firebase felhőbe
     */
    async saveMaterial(materialObj) {
        if (!this.isConnected || !this.db || !materialObj || !materialObj.id) {
            return false;
        }

        try {
            const payload = {
                id: materialObj.id,
                name: materialObj.name || 'PBR Anyag',
                category: materialObj.category || 'front',
                type: materialObj.type || 'custom',
                color: materialObj.color || '#ffffff',
                dataUrl: materialObj.dataUrl || null,
                roughness: materialObj.roughness !== undefined ? Number(materialObj.roughness) : 0.65,
                roughnessMapDataUrl: materialObj.roughnessMapDataUrl || null,
                metalness: materialObj.metalness !== undefined ? Number(materialObj.metalness) : 0.05,
                metalnessMapDataUrl: materialObj.metalnessMapDataUrl || null,
                normalMapDataUrl: materialObj.normalMapDataUrl || null,
                normalScale: materialObj.normalScale !== undefined ? Number(materialObj.normalScale) : 1.0,
                repeatX: materialObj.repeatX !== undefined ? Number(materialObj.repeatX) : 1.0,
                repeatY: materialObj.repeatY !== undefined ? Number(materialObj.repeatY) : 1.0,
                rotation: materialObj.rotation !== undefined ? Number(materialObj.rotation) : 0,
                isCustom: true,
                isModified: true,
                lastUpdated: new Date().toISOString()
            };

            await this.db.ref(`materials/${materialObj.id}`).set(payload);
            console.log(`[FIREBASE] PBR Anyag sikeresen mentve a felhőbe: ${materialObj.name}`);
            return true;
        } catch (e) {
            console.error('[FIREBASE] Anyag mentési hiba a felhőbe:', e);
            return false;
        }
    },

    /**
     * PBR Anyag törlése a Firebase felhőből
     */
    async deleteMaterial(materialId) {
        if (!this.isConnected || !this.db || !materialId) {
            return false;
        }

        try {
            await this.db.ref(`materials/${materialId}`).remove();
            console.log(`[FIREBASE] Anyag törölve a felhőből: ${materialId}`);
            return true;
        } catch (e) {
            console.error('[FIREBASE] Anyag törlési hiba a felhőből:', e);
            return false;
        }
    },

    /**
     * Képfájl intelligens tömörítése és méretezése HTML5 Canvas segítségével
     * Biztosítja, hogy a nagy fotók is kis méretű (~80-180 KB), szupergyorsan betöltődő DataURL-lé váljanak.
     */
    compressImageFile(fileOrDataUrl, maxWidth = 1024, maxHeight = 1024, quality = 0.85) {
        return new Promise((resolve, reject) => {
            const processImage = (src) => {
                const img = new Image();
                img.onload = () => {
                    let w = img.width;
                    let h = img.height;

                    if (w > maxWidth || h > maxHeight) {
                        const ratio = Math.min(maxWidth / w, maxHeight / h);
                        w = Math.round(w * ratio);
                        h = Math.round(h * ratio);
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);

                    const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                    resolve(compressedDataUrl);
                };
                img.onerror = (err) => reject(err);
                img.src = src;
            };

            if (typeof fileOrDataUrl === 'string') {
                processImage(fileOrDataUrl);
            } else if (fileOrDataUrl instanceof Blob || fileOrDataUrl instanceof File) {
                const reader = new FileReader();
                reader.onload = (e) => processImage(e.target.result);
                reader.onerror = (err) => reject(err);
                reader.readAsDataURL(fileOrDataUrl);
            } else {
                reject(new Error('Érvénytelen képfájl formátum'));
            }
        });
    },

    /**
     * Felhasználói felület státuszfrissítése (zöld/szürke pont)
     */
    updateStatusUI(connected, errorMsg = '') {
        const dot = document.getElementById('firebase-status-dot');
        const badge = document.getElementById('firebase-status-badge');

        if (dot) {
            dot.style.background = connected ? '#10b981' : '#ef4444';
        }
        if (badge) {
            if (connected) {
                badge.textContent = '🟢 Csatlakozva a felhőhöz';
                badge.style.background = 'rgba(16, 185, 129, 0.2)';
                badge.style.color = '#10b981';
            } else {
                badge.textContent = errorMsg ? `🔴 Hiba: ${errorMsg}` : '⚪ Nincs beállítva (Helyi mód)';
                badge.style.background = 'rgba(239, 68, 68, 0.15)';
                badge.style.color = '#ef4444';
            }
        }
    }
};

// Globális elérhetőség
if (typeof window !== 'undefined') {
    window.FirebaseSync = FirebaseSync;
}

