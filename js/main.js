// Khe Sanh Battle Simulation Setup
// Base/Defense (Team 1 - North)
for (let i = 0; i < 40; i++) units.push(U("soldier", 1, 150 + Math.random() * 50, (Math.random() - 0.5) * 200));
for (let i = 0; i < 5; i++) units.push(U("tank", 1, 140, (i - 2) * 40));
for (let i = 0; i < 3; i++) units.push(U("cannon", 1, 160, (i - 1) * 60));

// Attacking Force (Team 0 - South/East)
for (let i = 0; i < 80; i++) units.push(U("soldier", 0, -150 + Math.random() * 50, (Math.random() - 0.5) * 300));
for (let i = 0; i < 2; i++) units.push(U("tank", 0, -170, (i - 0.5) * 100));

// Defensive Mines
for (let i = 0; i < 10; i++) units.push(U("mine", 1, 50, (i - 5) * 30));

let lastFpsTime = performance.now();
let frameCount = 0;
function updateStats() {
    let now = performance.now();
    frameCount++;
    if (now - lastFpsTime >= 1000) {
        document.getElementById("statFps").innerText = frameCount;
        frameCount = 0;
        lastFpsTime = now;
    }
    document.getElementById("statUnits").innerText = units.length;
    document.getElementById("statRed").innerText = units.filter(u => u.team === 0).length;
    document.getElementById("statBlue").innerText = units.filter(u => u.team === 1).length;
}

let last = performance.now();
(function loop(t) {
    let dt = (t - last) / 1000;
    last = t;
    update(dt);
    updateStats();
    draw();
    requestAnimationFrame(loop);
})(last);

