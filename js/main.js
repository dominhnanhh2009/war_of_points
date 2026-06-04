// Khe Sanh Battle Simulation Setup
function spawnArmy(team, xDir) {
    // Quân lính
    for (let i = 0; i < 40; i++) {
        GameState.units.push(createUnit("soldier", team, xDir * (150 + GameState.random() * 50), (GameState.random() - 0.5) * 200));
    }
    // Xe tăng
    for (let i = 0; i < 5; i++) {
        GameState.units.push(createUnit("tank", team, xDir * 140, (i - 2) * 40));
    }
    // Pháo
    for (let i = 0; i < 0; i++) {
        GameState.units.push(createUnit("cannon", team, xDir * 160, (i - 1) * 60));
    }
    // Mìn
    for (let i = 0; i < 10; i++) {
        GameState.units.push(createUnit("mine", team, xDir * 50, (i - 5) * 30));
    }
}

spawnArmy(0, -1); // Team 0 ở phía trái
spawnArmy(1, 1);  // Team 1 ở phía phải

function toggleHelp() {
    let h = document.getElementById("help");
    h.style.display = h.style.display === "block" ? "none" : "block";
}
function saveGame() {
    let data = GameState.save();
    let blob = new Blob([data], { type: "application/json" });
    let a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "savegame.json";
    a.click();
}

function loadGame(event) {
    let file = event.target.files[0];
    if (!file) return;
    let reader = new FileReader();
    reader.onload = function(e) {
        GameState.load(e.target.result);
        alert("Game loaded!");
    };
    reader.readAsText(file);
}

function updateMode() {
    GameState.gameMode = document.getElementById("modeSelect").value;
    GameState.playerTeam = parseInt(document.getElementById("teamSelect").value);

    let teamContainer = document.getElementById("teamSelectContainer");
    let modeDisplay = document.getElementById("modeDisplay");

    if (GameState.gameMode === "ai") {
        teamContainer.style.display = "inline";
        modeDisplay.innerText = "AI Mode (" + (GameState.playerTeam === 0 ? "Red" : "Blue") + ")";
    } else if (GameState.gameMode === "aivsai") {
        teamContainer.style.display = "none";
        modeDisplay.innerText = "AI vs AI mode";
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
    document.getElementById("statUnits").innerText = GameState.units.length;
    document.getElementById("statRed").innerText = GameState.units.filter(u => u.team === 0).length;
    document.getElementById("statBlue").innerText = GameState.units.filter(u => u.team === 1).length;
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

