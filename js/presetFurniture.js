/**
 * Mintabútorok és Beépített Sablonok (presetFurniture.js)
 * Előre összeállított, valós méretű bútorok a gyors teszteléshez és bemutatáshoz
 */

export const PresetFurniture = [
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
