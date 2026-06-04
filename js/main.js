// Khe Sanh Battle Simulation Setup
function spawnArmy(team, xDir) {
    // Quân lính
    for (let i = 0; i < 40; i++) {
        units.push(U("soldier", team, xDir * (150 + Math.random() * 50), (Math.random() - 0.5) * 200));
    }
    // Xe tăng
    for (let i = 0; i < 5; i++) {
        units.push(U("tank", team, xDir * 140, (i - 2) * 40));
    }
    // Pháo
    for (let i = 0; i < 3; i++) {
        units.push(U("cannon", team, xDir * 160, (i - 1) * 60));
    }
    // Mìn
    for (let i = 0; i < 10; i++) {
        units.push(U("mine", team, xDir * 50, (i - 5) * 30));
    }
}

spawnArmy(0, -1); // Team 0 ở phía trái
spawnArmy(1, 1);  // Team 1 ở phía phải

function toggleHelp() {
    let h = document.getElementById("help");
    h.style.display = h.style.display === "block" ? "none" : "block";
}
function updateMode() {
    gameMode = document.getElementById("modeSelect").value;
    playerTeam = parseInt(document.getElementById("teamSelect").value);

    let teamContainer = document.getElementById("teamSelectContainer");
    let modeDisplay = document.getElementById("modeDisplay");

    if (gameMode === "ai") {
        teamContainer.style.display = "inline";
        modeDisplay.innerText = "AI Mode (" + (playerTeam === 0 ? "Red" : "Blue") + ")";
    } else {
        teamContainer.style.display = "none";
        modeDisplay.innerText = "Creative mode";
    }
}
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

