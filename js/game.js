const GRID = 100;
const CHUNK = 500;

const cam = { x: 0, y: 0, z: 10, r: 0 };
const units = [];
const bullets = [];
const expl = [];
const spawnFx = [];
const deathFx = [];
let sel = [];
let pendingSpawn = null;

const T = {
    soldier: { r: 1, hp: 1.5, spd: 3, range: 50, color: "#ff0", turn: 8 },
    tank: { r: 2, hp: 30, spd: 5, range: 100, color: "#fa0", turn: 2 },
    cannon: { r: 3, hp: 5, spd: .5, range: 100, color: "#0f0", turn: .7 },
    mine: { r: 1, hp: 1, spd: 0, range: 0, color: "#888", turn: 0 }
};

function U(type, team, x, y) {
    let t = T[type];
    return { type, team, x, y, tx: x, ty: y, hp: t.hp, max: t.hp, ang: Math.random() * 6.28, targetAng: 0, cool: 0 };
}

function D(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}
