// scratch/test_room_wall_hiding.js

function isPointInsidePolygon(px, pz, vertices) {
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

function getOutwardNormalForSegment(p1, p2, vertices) {
    const dx = p2.x - p1.x;
    const dz = p2.z - p1.z;
    const len = Math.hypot(dx, dz);
    if (len < 0.001) return { x: 0, z: 1 };

    const nx1 = -dz / len;
    const nz1 = dx / len;
    const nx2 = dz / len;
    const nz2 = -dx / len;

    const midX = (p1.x + p2.x) / 2;
    const midZ = (p1.z + p2.z) / 2;

    const testX1 = midX + nx1 * 20;
    const testZ1 = midZ + nz1 * 20;

    if (!isPointInsidePolygon(testX1, testZ1, vertices)) {
        return { x: nx1, z: nz1 };
    } else {
        return { x: nx2, z: nz2 };
    }
}

// Test L-shaped room
const lVertices = [
    { x: -2250, z: -1750 },
    { x: 2250, z: -1750 },
    { x: 2250, z: -50 },
    { x: 250, z: -50 },
    { x: 250, z: 1750 },
    { x: -2250, z: 1750 }
];

console.log('\n--- Testing L-Shaped Room ---');
for (let i = 0; i < lVertices.length; i++) {
    const p1 = lVertices[i];
    const p2 = lVertices[(i + 1) % lVertices.length];
    const norm = getOutwardNormalForSegment(p1, p2, lVertices);
    console.log(`L-Wall ${i} (${p1.x},${p1.z} -> ${p2.x},${p2.z}): norm = (${norm.x.toFixed(2)}, ${norm.z.toFixed(2)})`);
}

const camNorthWest = { x: -3500, y: 2000, z: -3500 };
console.log('\nCamera at North-West (-3500, -3500) looking into L-shape:');
for (let i = 0; i < lVertices.length; i++) {
    const p1 = lVertices[i];
    const p2 = lVertices[(i + 1) % lVertices.length];
    const norm = getOutwardNormalForSegment(p1, p2, lVertices);
    const midX = (p1.x + p2.x) / 2;
    const midZ = (p1.z + p2.z) / 2;
    const distFromPlane = (camNorthWest.x - midX) * norm.x + (camNorthWest.z - midZ) * norm.z;
    const isHidden = distFromPlane > 10;
    console.log(`L-Wall ${i} (mid: ${midX}, ${midZ}): dist = ${distFromPlane.toFixed(1)} -> ${isHidden ? 'HIDDEN ❌ (see through)' : 'VISIBLE ✅'}`);
}
