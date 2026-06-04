function spawnAt(type, team, x, y) {
    let u = createUnit(type, team, x, y);
    GameState.units.push(u);
    GameState.spawnFx.push({ x, y, life: 0.6, max: 0.6 });
    separateUnit(u);
}

function separateUnit(u) {
    for (let k = 0; k < 8; k++) {
        let moved = false;
        for (let v of GameState.units) {
            if (v === u) continue;
            let dx = u.x - v.x;
            let dy = u.y - v.y;
            let d = Math.hypot(dx, dy);
            let rr = UnitTypes[u.type].r + UnitTypes[v.type].r;
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
    let step = UnitTypes[u.type].turn * dt;
    u.ang += Math.sign(diff) * Math.min(Math.abs(diff), step);
}

function solveOverlap() {
    for (let i = 0; i < GameState.units.length; i++) {
        for (let j = i + 1; j < GameState.units.length; j++) {
            let a = GameState.units[i];
            let b = GameState.units[j];
            let dx = b.x - a.x;
            let dy = b.y - a.y;
            let d = Math.hypot(dx, dy);
            let rr = UnitTypes[a.type].r + UnitTypes[b.type].r;
            if (d < rr && d) {
                if (a.type === "mine" || b.type === "mine") continue;
                let p = (rr - d) / 2;
                a.x -= dx / d * p; a.y -= dy / d * p;
                b.x += dx / d * p; b.y += dy / d * p;
            }
        }
    }
}

function addExplosion(x, y, r) { GameState.expl.push({ x, y, r, life: .8, max: .8 }); }

function update(dt) {
    // AI LOGIC
    if (GameState.gameMode === "ai" || GameState.gameMode === "aivsai") {
        let teamsToAi = [];
        if (GameState.gameMode === "ai") {
            teamsToAi.push(1 - GameState.playerTeam);
        } else {
            teamsToAi.push(0, 1);
        }

    for (let u of GameState.units) {
            if (teamsToAi.includes(u.team)) {
                // AI Logic: sử dụng contract CustomAI.
                // Nếu người dùng không định nghĩa, đơn vị sẽ đứng yên (không có hành động mặc định)
                if (window.CustomAI && typeof window.CustomAI.decide === 'function') {
                    let action = window.CustomAI.decide(u, GameState.units);

                if (action && typeof action.tx === 'number' && typeof action.ty === 'number') {
                    u.tx = action.tx;
                    u.ty = action.ty;
        }
                }
            }
        }
    }
        for (let u of GameState.units) {
        u.cool -= dt;
        let enemy = null;
        let nearestDist = Infinity;
        for (let v of GameState.units) {
            if (v.team === u.team) continue;
            let dist = Math.hypot(v.x - u.x, v.y - u.y);
            if (dist < nearestDist) { nearestDist = dist; enemy = v; }
        }
        if (enemy) u.targetAng = Math.atan2(enemy.y - u.y, enemy.x - u.x);
        rotateToward(u, dt);
        let dx = u.tx - u.x, dy = u.ty - u.y, dd = Math.hypot(dx, dy);
        if (dd > .4 && UnitTypes[u.type].spd) {
            u.x += dx / dd * UnitTypes[u.type].spd * dt;
            u.y += dy / dd * UnitTypes[u.type].spd * dt;
        }
        if (enemy && u.cool <= 0 && Math.hypot(u.x - enemy.x, u.y - enemy.y) < UnitTypes[u.type].range) {
            if (u.type === "soldier") { enemy.hp--; u.cool = .5; }
            if (u.type === "tank") { GameState.bullets.push({ x: u.x, y: u.y, a: u.ang, d: 10, l: 100, t: u.team }); u.cool = 1.2; }
            if (u.type === "cannon") {
                let distToEnemy = Math.hypot(u.x - enemy.x, u.y - enemy.y);
                // "ko quá lớn hơn 100 và ko nhỏ hơn 50" -> range is 50-100?
                // actually, let's implement the logic exactly as requested:
                // Tâm O của vụ nổ, O cách điểm khai hỏa (u.x, u.y) ko quá > 100 và không nhỏ hơn 50.
                // enemy is just a target. Let's aim at enemy if in range.
                if (distToEnemy >= 50 && distToEnemy <= 100) {
                    addExplosion(enemy.x, enemy.y, 40);
                for (let z of GameState.units) {
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
    for (let m of GameState.units) {
        if (m.type !== "mine") continue;
        for (let z of GameState.units) {
            if (z === m || z.team === m.team) continue;
            if (Math.hypot(z.x - m.x, z.y - m.y) < UnitTypes[m.type].r + UnitTypes[z.type].r) {
                addExplosion(m.x, m.y, 25);
                for (let q of GameState.units) {
                    let d = Math.hypot(q.x - m.x, q.y - m.y);
                    if (d < 25) q.hp -= 25 - d;
                }
                m.hp = 0; break;
            }
        }
    }
    for (let b of GameState.bullets) {
        let s = 30 * dt;
        b.x += Math.cos(b.a) * s; b.y += Math.sin(b.a) * s;
        b.l -= s;
        for (let u of GameState.units) {
            if (u.team !== b.t && Math.hypot(u.x - b.x, u.y - b.y) < UnitTypes[u.type].r) {
                let hit = Math.min(b.d, u.hp);
                u.hp -= hit; b.d -= hit;
                addExplosion(u.x, u.y, 8);
            }
        }
    }
    for (let i = GameState.spawnFx.length - 1; i >= 0; i--) { GameState.spawnFx[i].life -= dt; if (GameState.spawnFx[i].life <= 0) GameState.spawnFx.splice(i, 1); }
    for (let i = GameState.expl.length - 1; i >= 0; i--) { GameState.expl[i].life -= dt; if (GameState.expl[i].life <= 0) GameState.expl.splice(i, 1); }
    for (let i = GameState.bullets.length - 1; i >= 0; i--) { if (GameState.bullets[i].l <= 0 || GameState.bullets[i].d <= 0) GameState.bullets.splice(i, 1); }
    for (let i = GameState.units.length - 1; i >= 0; i--) { if (GameState.units[i].hp <= 0) GameState.units.splice(i, 1); }
}

