let drag = false, middleDrag = false;
let middleStartX = 0, middleStartY = 0, middleCamX = 0, middleCamY = 0;
let start, rect = null;
let lastMouseX = 0, lastMouseY = 0;

function spawnMode(type, team) {
    if (gameMode === "ai" && team !== playerTeam) return; // Chỉ cho phép spawn phe người chơi trong AI mode
    pendingSpawn = { type, team };
    document.getElementById("spawnInfo").textContent = `Spawn: ${type} ${team ? "BLUE" : "RED"}`;
}

addEventListener("keydown", e => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    const keys = { "1": ["soldier", 0], "2": ["soldier", 1], "3": ["tank", 0], "4": ["tank", 1], "5": ["cannon", 0], "6": ["cannon", 1], "7": ["mine", 0], "8": ["mine", 1] };
    if (keys[e.key]) spawnMode(...keys[e.key]);
    if (e.key === "Escape") toggleHelp();
});

function toggleHelp() {
    const help = document.getElementById("help");
    help.style.display = (help.style.display === "none" || help.style.display === "") ? "block" : "none";
}

c.onmousedown = e => {
    if (e.button === 1) {
        middleDrag = true;
        middleStartX = e.clientX; middleStartY = e.clientY;
        middleCamX = cam.x; middleCamY = cam.y;
        e.preventDefault(); return;
    }
    if (e.button !== 0) return;
    if (pendingSpawn) {
        let p = s2w(e.clientX, e.clientY);
        spawnAt(pendingSpawn.type, pendingSpawn.team, p.x, p.y);
        pendingSpawn = null;
        document.getElementById("spawnInfo").textContent = "Spawn: OFF";
        return;
    }
    drag = true;
    start = { x: e.clientX, y: e.clientY };
    rect = { x: start.x, y: start.y, w: 0, h: 0 };
};

onmousemove = e => {
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    if (middleDrag) {
        let dx = (e.clientX - middleStartX) / cam.z;
        let dy = (e.clientY - middleStartY) / cam.z;
        let cs = Math.cos(cam.r);
        let sn = Math.sin(cam.r);

        // Rotate the delta movement by the current camera rotation
        // So panning follows the screen, not the world grid
        cam.x = middleCamX - (dx * cs + dy * sn);
        cam.y = middleCamY - (-dx * sn + dy * cs);
        return;
    }
    if (!drag) return;
    rect = {
        x: Math.min(start.x, e.clientX),
        y: Math.min(start.y, e.clientY),
        w: Math.abs(start.x - e.clientX),
        h: Math.abs(start.y - e.clientY)
    };
};

onmouseup = e => {
    if (middleDrag) { middleDrag = false; return; }
    if (!drag) return;
    drag = false;
    sel = [];
    if (rect.w > 6 || rect.h > 6) {
        for (let u of units) {
            let p = w2s(u.x, u.y);
            if (p.x >= rect.x && p.x <= rect.x + rect.w && p.y >= rect.y && p.y <= rect.y + rect.h) sel.push(u);
        }
    }
    rect = null;
};

c.oncontextmenu = e => {
    e.preventDefault();
    let p = s2w(e.clientX, e.clientY);
    for (let u of sel) { u.tx = p.x; u.ty = p.y; }
};

c.addEventListener("wheel", e => {
    if (e.ctrlKey) {
        if (e.shiftKey) cam.r += -e.deltaY * .01;
        else {
            let mouseWorldBefore = s2w(e.clientX, e.clientY);
            cam.z = Math.max(2, Math.min(80, cam.z * Math.exp(-e.deltaY * .01)));
            let mouseWorldAfter = s2w(e.clientX, e.clientY);
            cam.x += mouseWorldBefore.x - mouseWorldAfter.x;
            cam.y += mouseWorldBefore.y - mouseWorldAfter.y;
        }
    } else {
        let cs = Math.cos(cam.r);
        let sn = Math.sin(cam.r);
        let dx = e.deltaX / cam.z;
        let dy = e.deltaY / cam.z;
        // Panning in world space relative to camera rotation
        cam.x += (dx * cs + dy * sn);
        cam.y += (-dx * sn + dy * cs);
    }
    e.preventDefault();
}, { passive: false });

