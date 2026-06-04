// my_ai.js
// War of Points Custom AI
// Style: tấn công liều lĩnh + mưu mô
// Fix: soldier không còn lùi hàng loạt khi còn rất xa cannon địch

window.CustomAI = window.CustomAI || {};

window.CustomAI._brain = {
    tick: 0,
    unitMemory: new Map()
};

window.CustomAI.decide = function(unit, gameUnits) {
    const B = window.CustomAI._brain;
    B.tick++;

    const id = getUnitId(unit);

    if (!B.unitMemory.has(id)) {
        B.unitMemory.set(id, {
            born: B.tick,
            lastX: unit.x,
            lastY: unit.y,
            stuck: 0,
            flankSide: Math.random() < 0.5 ? -1 : 1,
            aggression: 0.85 + Math.random() * 0.3
        });
    }

    const mem = B.unitMemory.get(id);

    const allies = gameUnits.filter(u => u.team === unit.team && u !== unit);
    const enemies = gameUnits.filter(u => u.team !== unit.team);

    if (enemies.length === 0) return null;

    const moved = Math.hypot(unit.x - mem.lastX, unit.y - mem.lastY);
    if (moved < 0.4) mem.stuck++;
    else mem.stuck = 0;

    mem.lastX = unit.x;
    mem.lastY = unit.y;

    if (mem.stuck > 25) {
        mem.flankSide *= -1;
        mem.stuck = 0;
    }

    const armyCenter = centerOf([unit, ...allies]);
    const enemyCenter = centerOf(enemies);

    const target =
        choosePersonalTarget(unit, enemies, allies) ||
        chooseStrategicTarget(unit, enemies, allies) ||
        nearest(unit, enemies).obj;

    if (!target) return null;

    unit.targetAng = Math.atan2(target.y - unit.y, target.x - unit.x);

    const danger = estimateDanger(unit, enemies);
    const support = estimateSupport(unit, allies);

    if (unit.type === "soldier") {
        return soldierBrain(unit, enemies, allies, target, armyCenter, enemyCenter, mem, danger, support);
    }

    if (unit.type === "tank") {
        return tankBrain(unit, enemies, allies, target, armyCenter, enemyCenter, mem, danger, support);
    }

    if (unit.type === "cannon") {
        return cannonBrain(unit, enemies, allies, target, armyCenter, enemyCenter, mem, danger, support);
    }

    if (unit.type === "mine") {
        return mineBrain(unit, enemies, allies, target, armyCenter, enemyCenter, mem);
    }

    return moveTo(target);
};


// =====================================================
// SOLDIER
// =====================================================

function soldierBrain(unit, enemies, allies, target, armyCenter, enemyCenter, mem, danger, support) {
    const hp = unit.hp ?? 100;

    const enemyCannon = nearestEnemyCannon(unit, enemies);

    if (enemyCannon) {
        const cd = dist(unit, enemyCannon);
        const allyNearCannon = allies.filter(a => dist(a, enemyCannon) < 140).length;
        const allyNearMe = allies.filter(a => dist(a, unit) < 130).length;

        // Đã áp sát pháo thì dí chết ngay.
        if (cd < 45) {
            return moveTo(enemyCannon);
        }

        // Vùng chết của cannon: 50-100.
        // Không đứng yên, không lùi hàng loạt.
        // Soldier sẽ cố lao sát hoặc né ngang để phá tracking.
        if (cd >= 50 && cd <= 105) {
            if (hp > 28 || allyNearMe >= 1 || allyNearCannon >= 1) {
                return approachWithStrafe(unit, enemyCannon, mem.flankSide, 70);
            }

            // Chỉ rút khi thật sự yếu và cô độc.
            return retreatFrom(unit, enemyCannon, 95);
        }

        // Nếu còn xa cannon, KHÔNG lùi.
        // Tiến đến điểm tập kết ngoài vùng chết, sau đó mới lao vào.
        if (cd > 105 && cd < 330) {
            const staging = stagingPointOutsideCannon(unit, enemyCannon, mem.flankSide, 118);

            // Nếu có đồng minh quanh mình thì táo bạo hơn, tiến thẳng xiên vào pháo.
            if (allyNearMe >= 1 || hp > 45) {
                return approachWithStrafe(unit, enemyCannon, mem.flankSide, 85);
            }

            return moveTo(staging);
        }
    }

    // Ưu tiên kết liễu kẻ yếu máu, tránh mine.
    const weakEnemy = enemies
        .filter(e => e.type !== "mine" && (e.hp ?? 100) <= 30)
        .sort((a, b) => dist(unit, a) - dist(unit, b))[0];

    if (weakEnemy && dist(unit, weakEnemy) < 260) {
        return moveTo(weakEnemy);
    }

    // Không đâm đầu vào mine.
    if (target.type === "mine") {
        if (dist(unit, target) < 85) return retreatFrom(unit, target, 100);
        return attackEnemyCenter(unit, enemyCenter, mem);
    }

    // Gặp tank/cannon thì bọc sườn, nhưng vẫn hướng về địch.
    if (target.type === "tank" || target.type === "cannon") {
        return approachWithStrafe(unit, target, mem.flankSide, 80);
    }

    // Soldier bình thường: lao lên.
    return attackEnemyCenter(unit, target, mem);
}


// =====================================================
// TANK
// =====================================================

function tankBrain(unit, enemies, allies, target, armyCenter, enemyCenter, mem, danger, support) {
    const hp = unit.hp ?? 100;

    const enemyCannon = nearestEnemyCannon(unit, enemies);

    if (enemyCannon) {
        const cd = dist(unit, enemyCannon);
        const allyNearMe = allies.filter(a => dist(a, unit) < 160).length;
        const allyNearCannon = allies.filter(a => dist(a, enemyCannon) < 150).length;

        // Tank tránh đứng đúng tầm pháo nếu đơn độc.
        if (cd >= 50 && cd <= 110) {
            if ((allyNearMe >= 2 || allyNearCannon >= 2) && hp > 45) {
                return approachWithStrafe(unit, enemyCannon, mem.flankSide, 60);
            }

            return retreatFrom(unit, enemyCannon, 125);
        }

        // Ngoài tầm pháo thì tiến xiên, không lùi.
        if (cd > 110 && cd < 280) {
            if (allyNearMe >= 1 || hp > 55) {
                return approachWithStrafe(unit, enemyCannon, mem.flankSide, 75);
            }
        }
    }

    const closeMine = enemies.find(e => e.type === "mine" && dist(unit, e) < 80);
    if (closeMine) {
        return retreatFrom(unit, closeMine, 120);
    }

    const d = dist(unit, target);

    // Tank giữ tầm bắn khoảng 55-70.
    if (d < 45) {
        return retreatFrom(unit, target, 75);
    }

    if (d > 75) {
        return approachWithStrafe(unit, target, mem.flankSide, 70);
    }

    return orbitPoint(unit, target, mem.flankSide, 65);
}


// =====================================================
// CANNON
// =====================================================

function cannonBrain(unit, enemies, allies, target, armyCenter, enemyCenter, mem, danger, support) {
    const hp = unit.hp ?? 100;

    const closeThreat = enemies.find(e => {
        const d = dist(unit, e);
        return (
            (e.type === "soldier" && d < 75) ||
            (e.type === "tank" && d < 65) ||
            (e.type === "mine" && d < 85)
        );
    });

    if (closeThreat || hp < 40) {
        const guard = nearest(unit, allies.filter(a => a.type === "soldier" || a.type === "tank")).obj;
        if (guard) return kiteAwayFrom(unit, closeThreat || target, guard, 105);
        return retreatFrom(unit, closeThreat || target, 125);
    }

    const cluster = bestEnemyCluster(enemies.filter(e => e.type !== "mine"), 45);
    if (cluster && cluster.count >= 2) {
        target = cluster.center;
    }

    const d = dist(unit, target);

    // Cannon cần mục tiêu trong 50-100.
    if (d < 55) {
        return retreatFrom(unit, target, 85);
    }

    if (d > 95) {
        return approachWithStrafe(unit, target, mem.flankSide, 80);
    }

    // Đang ở tầm đẹp thì di chuyển nhẹ ngang để tránh bị áp sát.
    return orbitPoint(unit, target, mem.flankSide, 82);
}


// =====================================================
// MINE
// =====================================================

function mineBrain(unit, enemies, allies, target, armyCenter, enemyCenter, mem) {
    const nearestEnemy = nearest(unit, enemies).obj;
    if (!nearestEnemy) return null;

    if (dist(unit, nearestEnemy) < 85) {
        return moveTo(nearestEnemy);
    }

    const enemyCannon = nearestEnemyCannon(unit, enemies);

    // Mine ưu tiên cắt đường cannon.
    if (enemyCannon && dist(unit, enemyCannon) < 320) {
        const trap = pointBetween(unit, enemyCannon, 0.65);
        const side = perpendicularPoint(unit, enemyCannon, 35 * mem.flankSide);
        return moveTo(mixPoints(trap, side, 0.3));
    }

    const alliedCannon = allies
        .filter(a => a.type === "cannon")
        .sort((a, b) => dist(unit, a) - dist(unit, b))[0];

    if (alliedCannon && dist(unit, alliedCannon) > 45) {
        const ambush = pointBetween(alliedCannon, enemyCenter, 0.35);
        return moveTo(ambush);
    }

    return moveTo(pointBetween(armyCenter, enemyCenter, 0.65));
}


// =====================================================
// TARGETING
// =====================================================

function chooseStrategicTarget(unit, enemies, allies) {
    let best = null;
    let bestScore = -Infinity;

    for (const e of enemies) {
        const d = dist(unit, e);
        const hp = e.hp ?? 100;

        let score = 0;

        if (e.type === "cannon") score += 150;
        else if (e.type === "tank") score += 75;
        else if (e.type === "soldier") score += 45;
        else if (e.type === "mine") score += 15;

        score += Math.max(0, 70 - hp) * 1.5;
        score += Math.max(0, 320 - d) * 0.2;

        const allyPressure = allies.filter(a => dist(a, e) < 150).length;
        const enemyGuard = enemies.filter(x => x !== e && dist(x, e) < 130).length;

        score += (allyPressure - enemyGuard) * 18;

        if (e.type === "cannon") {
            score += 60;
            if (allyPressure >= enemyGuard) score += 50;
        }

        if (e.type === "mine") {
            if (unit.type !== "mine") score -= 80;
            if (d > 90) score -= 80;
        }

        if (score > bestScore) {
            bestScore = score;
            best = e;
        }
    }

    return best;
}

function choosePersonalTarget(unit, enemies, allies) {
    let best = null;
    let bestScore = -Infinity;

    for (const e of enemies) {
        const d = dist(unit, e);
        const hp = e.hp ?? 100;

        let score = 0;

        if (unit.type === "soldier") {
            if (e.type === "cannon") score += 160;
            if (e.type === "tank") score += 70;
            if (e.type === "soldier") score += 40;
            if (e.type === "mine") score -= 150;
        }

        if (unit.type === "tank") {
            if (e.type === "cannon") score += 115;
            if (e.type === "soldier") score += 55;
            if (e.type === "tank") score += 50;
            if (e.type === "mine") score -= 100;
        }

        if (unit.type === "cannon") {
            const clusterCount = enemies.filter(x => dist(x, e) < 45).length;
            score += clusterCount * 55;
            if (e.type === "soldier") score += 55;
            if (e.type === "tank") score += 45;
            if (e.type === "cannon") score += 65;
            if (d < 50) score -= 100;
            if (d > 105) score -= 45;
        }

        if (unit.type === "mine") {
            if (e.type === "cannon") score += 150;
            if (e.type === "tank") score += 70;
            if (e.type === "soldier") score += 50;
        }

        score += Math.max(0, 60 - hp) * 1.6;
        score += Math.max(0, 280 - d) * 0.2;

        score += allies.filter(a => dist(a, e) < 140).length * 18;

        if (e.type === "mine" && unit.type !== "mine") {
            score -= 120;
        }

        if (score > bestScore) {
            bestScore = score;
            best = e;
        }
    }

    return best;
}


// =====================================================
// MOVEMENT
// =====================================================

function attackEnemyCenter(unit, target, mem) {
    return approachWithStrafe(unit, target, mem.flankSide, 90);
}

function stagingPointOutsideCannon(unit, cannon, side, radius) {
    // Điểm tập kết nằm ngoài vùng chết 50-100.
    // Quan trọng: điểm này nằm về phía unit hiện tại,
    // nên soldier không chạy xuyên qua vùng pháo quá sớm.
    const angleFromCannonToUnit = Math.atan2(unit.y - cannon.y, unit.x - cannon.x);
    const sideAngle = angleFromCannonToUnit + side * 0.45;

    return {
        x: cannon.x + Math.cos(sideAngle) * radius,
        y: cannon.y + Math.sin(sideAngle) * radius
    };
}

function approachWithStrafe(unit, target, side, step) {
    if (!target) return null;

    const angle = Math.atan2(target.y - unit.y, target.x - unit.x);
    const strafeAngle = angle + side * Math.PI / 2;

    return {
        tx: unit.x + Math.cos(angle) * step * 0.78 + Math.cos(strafeAngle) * step * 0.32,
        ty: unit.y + Math.sin(angle) * step * 0.78 + Math.sin(strafeAngle) * step * 0.32
    };
}

function orbitPoint(unit, target, side, radius) {
    if (!target) return null;

    const angle = Math.atan2(unit.y - target.y, unit.x - target.x);
    const orbitAngle = angle + side * 0.6;

    return {
        tx: target.x + Math.cos(orbitAngle) * radius,
        ty: target.y + Math.sin(orbitAngle) * radius
    };
}

function retreatFrom(unit, threat, distance) {
    if (!threat) return null;

    const angle = Math.atan2(unit.y - threat.y, unit.x - threat.x);

    return {
        tx: unit.x + Math.cos(angle) * distance,
        ty: unit.y + Math.sin(angle) * distance
    };
}

function kiteAwayFrom(unit, threat, towardAlly, distance) {
    if (!threat && towardAlly) return moveTo(towardAlly);
    if (!towardAlly) return retreatFrom(unit, threat, distance);

    const away = retreatFrom(unit, threat, distance);
    const safe = { x: towardAlly.x, y: towardAlly.y };

    return moveTo(mixPoints(away, safe, 0.45));
}

function moveTo(p) {
    if (!p) return null;
    return { tx: p.x, ty: p.y };
}


// =====================================================
// EVALUATION
// =====================================================

function estimateDanger(unit, enemies) {
    let danger = 0;

    for (const e of enemies) {
        const d = dist(unit, e);

        if (e.type === "soldier") {
            if (d < 45) danger += 3.5;
            else if (d < 100) danger += 1.5;
        }

        if (e.type === "tank") {
            if (d < 75) danger += 3.0;
            else if (d < 130) danger += 1.2;
        }

        if (e.type === "cannon") {
            if (d >= 50 && d <= 100) danger += 8.0;
            else if ((d >= 40 && d < 50) || (d > 100 && d <= 125)) danger += 3.5;
            else if (d < 40) danger += 1.0;
        }

        if (e.type === "mine") {
            if (d < 45) danger += 6.0;
            else if (d < 90) danger += 2.0;
        }
    }

    return danger;
}

function estimateSupport(unit, allies) {
    let support = 0;

    for (const a of allies) {
        const d = dist(unit, a);

        if (d < 80) support += 2.5;
        else if (d < 160) support += 1.2;
        else if (d < 250) support += 0.4;

        if (a.type === "cannon" && d < 170) support += 1.8;
        if (a.type === "tank" && d < 140) support += 1.3;
        if (a.type === "soldier" && d < 120) support += 1.0;
    }

    return support;
}

function bestEnemyCluster(enemies, radius) {
    let best = null;

    for (const e of enemies) {
        const group = enemies.filter(x => dist(x, e) <= radius);

        if (!best || group.length > best.count) {
            best = {
                count: group.length,
                center: centerOf(group)
            };
        }
    }

    return best;
}


// =====================================================
// HELPERS
// =====================================================

function getUnitId(u) {
    if (!u.__ai_id) {
        u.__ai_id =
            "u_" +
            Math.random().toString(36).slice(2) +
            "_" +
            Date.now().toString(36);
    }

    return u.__ai_id;
}

function dist(a, b) {
    if (!a || !b) return Infinity;
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function nearest(unit, arr) {
    let obj = null;
    let d = Infinity;

    for (const x of arr) {
        const dx = dist(unit, x);

        if (dx < d) {
            d = dx;
            obj = x;
        }
    }

    return { obj, d };
}

function nearestEnemyCannon(unit, enemies) {
    const cannons = enemies.filter(e => e.type === "cannon");
    if (cannons.length === 0) return null;
    return nearest(unit, cannons).obj;
}

function centerOf(arr) {
    if (!arr || arr.length === 0) return { x: 0, y: 0 };

    let x = 0;
    let y = 0;

    for (const a of arr) {
        x += a.x;
        y += a.y;
    }

    return {
        x: x / arr.length,
        y: y / arr.length
    };
}

function pointBetween(a, b, t) {
    return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t
    };
}

function mixPoints(a, b, t) {
    if (!a) return b;
    if (!b) return a;

    return {
        x: a.x * (1 - t) + b.x * t,
        y: a.y * (1 - t) + b.y * t
    };
}

function perpendicularPoint(a, b, offset) {
    const angle = Math.atan2(b.y - a.y, b.x - a.x) + Math.PI / 2;

    return {
        x: b.x + Math.cos(angle) * offset,
        y: b.y + Math.sin(angle) * offset
    };
}