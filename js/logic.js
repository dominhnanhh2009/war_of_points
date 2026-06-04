function spawnAt(type, team, x, y) {
    let u = U(type, team, x, y);
    units.push(u);
    spawnFx.push({ x, y, life: 0.6, max: 0.6 });
    separateUnit(u);
}

function separateUnit(u) {
    for (let k = 0; k < 8; k++) {
        let moved = false;
        for (let v of units) {
            if (v === u) continue;
            let dx = u.x - v.x;
            let dy = u.y - v.y;
            let d = Math.hypot(dx, dy);
            let rr = T[u.type].r + T[v.type].r;
            if (d < rr && d > .0001) {
                let p = (rr - d) / 2;
                u.x += dx / d * p;
                u.y += dy / d * p;
                moved = true;
            }
        }
        if (!moved) break;
    }
}

function rotateToward(u, dt) {
    let diff = u.targetAng - u.ang;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    let step = T[u.type].turn * dt;
    u.ang += Math.sign(diff) * Math.min(Math.abs(diff), step);
}

function solveOverlap() {
    for (let i = 0; i < units.length; i++) {
        for (let j = i + 1; j < units.length; j++) {
            let a = units[i];
            let b = units[j];
            let dx = b.x - a.x;
            let dy = b.y - a.y;
            let d = Math.hypot(dx, dy);
            let rr = T[a.type].r + T[b.type].r;
            if (d < rr && d) {
                if (a.type === "mine" || b.type === "mine") continue;
                let p = (rr - d) / 2;
                a.x -= dx / d * p; a.y -= dy / d * p;
                b.x += dx / d * p; b.y += dy / d * p;
            }
        }
    }
}

function addExplosion(x, y, r) { expl.push({ x, y, r, life: .8, max: .8 }); }

function update(dt) {
    // AI LOGIC
    if (gameMode === "ai") {
        let enemyTeam = 1 - playerTeam;
    for (let u of units) {
            if (u.team === enemyTeam) {
                // AI chỉ hành động như player bình thường (cơ bản: tìm kẻ địch gần nhất và di chuyển/tấn công)
        let enemy = null;
        let nearestDist = Infinity;
        for (let v of units) {
                    if (v.team === playerTeam) {
            let dist = Math.hypot(v.x - u.x, v.y - u.y);
            if (dist < nearestDist) { nearestDist = dist; enemy = v; }
        }
                }
                if (enemy) {
                    u.tx = enemy.x;
                    u.ty = enemy.y;
                }
            }
        }
    }
        for (let u of units) {
        u.cool -= dt;
        let enemy = null;
        let nearestDist = Infinity;
        for (let v of units) {
            if (v.team === u.team) continue;
            let dist = Math.hypot(v.x - u.x, v.y - u.y);
            if (dist < nearestDist) { nearestDist = dist; enemy = v; }
        }
        if (enemy) u.targetAng = Math.atan2(enemy.y - u.y, enemy.x - u.x);
        rotateToward(u, dt);
        let dx = u.tx - u.x, dy = u.ty - u.y, dd = Math.hypot(dx, dy);
        if (dd > .4 && T[u.type].spd) {
            u.x += dx / dd * T[u.type].spd * dt;
            u.y += dy / dd * T[u.type].spd * dt;
        }
        if (enemy && u.cool <= 0 && D(u, enemy) < T[u.type].range) {
            if (u.type === "soldier") { enemy.hp--; u.cool = .5; }
            if (u.type === "tank") { bullets.push({ x: u.x, y: u.y, a: u.ang, d: 10, l: 100, t: u.team }); u.cool = 1.2; }
            if (u.type === "cannon") {
                let distToEnemy = D(u, enemy);
                // "ko quá lớn hơn 100 và ko nhỏ hơn 50" -> range is 50-100?
                // actually, let's implement the logic exactly as requested:
                // Tâm O của vụ nổ, O cách điểm khai hỏa (u.x, u.y) ko quá > 100 và không nhỏ hơn 50.
                // enemy is just a target. Let's aim at enemy if in range.
                if (distToEnemy >= 50 && distToEnemy <= 100) {
                    addExplosion(enemy.x, enemy.y, 40);
                for (let z of units) {
                    let d = Math.hypot(z.x - enemy.x, z.y - enemy.y);
                        // Damage is max(0, 40-d)
                        if (d < 40) z.hp -= Math.max(0, 40 - d);
                }
                u.cool = 3;
            }
        }
    }
    }
    solveOverlap();
    for (let m of units) {
        if (m.type !== "mine") continue;
        for (let z of units) {
            if (z === m || z.team === m.team) continue;
            if (Math.hypot(z.x - m.x, z.y - m.y) < T[m.type].r + T[z.type].r) {
                addExplosion(m.x, m.y, 25);
                for (let q of units) {
                    let d = Math.hypot(q.x - m.x, q.y - m.y);
                    if (d < 25) q.hp -= 25 - d;
                }
                m.hp = 0; break;
            }
        }
    }
    for (let b of bullets) {
        let s = 30 * dt;
        b.x += Math.cos(b.a) * s; b.y += Math.sin(b.a) * s;
        b.l -= s;
        for (let u of units) {
            if (u.team !== b.t && Math.hypot(u.x - b.x, u.y - b.y) < T[u.type].r) {
                let hit = Math.min(b.d, u.hp);
                u.hp -= hit; b.d -= hit;
                addExplosion(u.x, u.y, 8);
            }
        }
    }
    for (let i = spawnFx.length - 1; i >= 0; i--) { spawnFx[i].life -= dt; if (spawnFx[i].life <= 0) spawnFx.splice(i, 1); }
    for (let i = expl.length - 1; i >= 0; i--) { expl[i].life -= dt; if (expl[i].life <= 0) expl.splice(i, 1); }
    for (let i = bullets.length - 1; i >= 0; i--) { if (bullets[i].l <= 0 || bullets[i].d <= 0) bullets.splice(i, 1); }
    for (let i = units.length - 1; i >= 0; i--) { if (units[i].hp <= 0) units.splice(i, 1); }
}

