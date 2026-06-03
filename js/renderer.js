const c = document.getElementById("cv");
const ctx = c.getContext("2d");

function rs() {
    c.width = innerWidth;
    c.height = innerHeight;
}
rs();
onresize = rs;

function w2s(x, y) {
    let dx = x - cam.x;
    let dy = y - cam.y;
    let cs = Math.cos(cam.r);
    let sn = Math.sin(cam.r);
    return {
        x: c.width / 2 + (dx * cs - dy * sn) * cam.z,
        y: c.height / 2 + (dx * sn + dy * cs) * cam.z
    };
}

function s2w(x, y) {
    let dx = (x - c.width / 2) / cam.z;
    let dy = (y - c.height / 2) / cam.z;
    let cs = Math.cos(-cam.r);
    let sn = Math.sin(-cam.r);
    return {
        x: cam.x + dx * cs - dy * sn,
        y: cam.y + dx * sn + dy * cs
    };
}

function drawGrid() {
    let left = s2w(0, 0);
    let right = s2w(c.width, c.height);
    let sx = Math.floor(Math.min(left.x, right.x) / GRID) * GRID;
    let ex = Math.ceil(Math.max(left.x, right.x) / GRID) * GRID;
    let sy = Math.floor(Math.min(left.y, right.y) / GRID) * GRID;
    let ey = Math.ceil(Math.max(left.y, right.y) / GRID) * GRID;

    ctx.lineWidth = 1;
    for (let x = sx; x <= ex; x += GRID) {
        let a = w2s(x, sy);
        let b = w2s(x, ey);
        let chunk = x % CHUNK === 0;
        ctx.strokeStyle = chunk ? "#3af8" : "#444";
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        if (chunk) {
            ctx.fillStyle = "#4cf";
            for (let y = sy; y <= ey; y += CHUNK) {
                let p = w2s(x, y);
                ctx.fillText(`[${x},${y}]`, p.x + 4, p.y + 14);
            }
        }
    }
    for (let y = sy; y <= ey; y += GRID) {
        let a = w2s(sx, y);
        let b = w2s(ex, y);
        let chunk = y % CHUNK === 0;
        ctx.strokeStyle = chunk ? "#3af8" : "#444";
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
}

function drawExplosion(e) {
    let p = w2s(e.x, e.y);
    let t = e.life / e.max;
    let rr = e.r * cam.z * (1 + (1 - t) * .6);
    ctx.save();
    ctx.globalAlpha = t;
    ctx.beginPath();
    ctx.arc(p.x, p.y, rr, 0, 7);
    let g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rr);
    g.addColorStop(0, "#fff");
    g.addColorStop(.3, "#ff0");
    g.addColorStop(.7, "#f60");
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#f44";
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(p.x - 20, p.y); ctx.lineTo(p.x + 20, p.y);
    ctx.moveTo(p.x, p.y - 20); ctx.lineTo(p.x, p.y + 20);
    ctx.stroke();
    ctx.restore();
}

function draw() {
    ctx.clearRect(0, 0, c.width, c.height);
    drawGrid();
    for (let e of expl) drawExplosion(e);
    for (let u of units) {
        let p = w2s(u.x, u.y);
        let r = T[u.type].r * cam.z;
        let angle = u.ang + cam.r; // Góc quay của unit + góc xoay camera

        ctx.save(); // Lưu trạng thái canvas
        ctx.translate(p.x, p.y); // Di chuyển gốc tọa độ về tâm unit
        ctx.rotate(angle); // Xoay canvas theo góc hướng của unit

        // Vẽ shape dựa trên loại unit (tọa độ giờ đã được translate và rotate)
        ctx.beginPath();
        if (u.type === 'soldier') {
            ctx.arc(0, 0, r, 0, 7);
        } else if (u.type === 'tank') {
            ctx.rect(-r, -r / 2, r * 2, r);
        } else if (u.type === 'cannon') {
            for (let i = 0; i < 6; i++) {
                let a = i * Math.PI / 3;
                let x = r * Math.cos(a);
                let y = r * Math.sin(a);
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.closePath();
        } else if (u.type === 'mine') {
            ctx.moveTo(0, -r);
            ctx.lineTo(r, 0);
            ctx.lineTo(0, r);
            ctx.lineTo(-r, 0);
            ctx.closePath();
        }

        ctx.fillStyle = T[u.type].color; ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = u.team ? "#48f" : "#f44";
        ctx.stroke();

        // Vẽ nòng súng (cần xoay nên giờ chỉ cần vẽ thẳng ra)
        if (u.type !== 'mine') {
                ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(r * 1.5, 0);
                ctx.stroke();
            }
        ctx.restore(); // Khôi phục trạng thái canvas trước đó

        // Vẽ thanh máu (không cần xoay nên vẽ ngoài ctx.save/restore)
        ctx.fillStyle = "#0f0";
        ctx.fillRect(p.x - 12, p.y - r - 12, 24 * (u.hp / u.max), 3);
        if (sel.includes(u)) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, r + 7, 0, 7);
            ctx.strokeStyle = "#fff"; ctx.stroke();

            // Hiện vùng tấn công
            let range = T[u.type].range * cam.z;
            if (range > 0) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, range, 0, 7);
                ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
                ctx.stroke();
        }
    }
    }
    for (let b of bullets) {
        let p = w2s(b.x, b.y);
        ctx.fillStyle = "#fff"; ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
    if (rect) {
        ctx.strokeStyle = "#fff"; ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    }

    // Hiện toạ độ của con trỏ chuột
    let mouse = s2w(lastMouseX, lastMouseY);
    ctx.fillStyle = "#fff"; ctx.font = "14px monospace";
    ctx.fillText(`MOUSE ${Math.floor(mouse.x)},${Math.floor(mouse.y)}`, 12, c.height - 70);

    ctx.fillStyle = "#fff"; ctx.font = "14px monospace";
    ctx.fillText(`CAM ${cam.x.toFixed(0)} ${cam.y.toFixed(0)}`, 12, c.height - 52);
    ctx.fillText(`GRID ${GRID}`, 12, c.height - 34);
    ctx.fillText(`CHUNK ${Math.floor(cam.x / CHUNK)} : ${Math.floor(cam.y / CHUNK)}`, 12, c.height - 14);
}

