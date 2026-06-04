// template_ai.js
// Hãy sửa hàm này để tạo thuật toán AI của riêng bạn.

window.CustomAI.decide = function(unit, gameUnits) {
    // Lọc danh sách kẻ địch (khác team)
    const enemies = gameUnits.filter(u => u.team !== unit.team);
    
    // Tìm kẻ địch gần nhất
    let target = null;
    let minDistance = Infinity;
    
    for (const enemy of enemies) {
        const dist = Math.hypot(enemy.x - unit.x, enemy.y - unit.y);
        if (dist < minDistance) {
            minDistance = dist;
            target = enemy;
        }
    }

    // NẾU TÌM THẤY MỤC TIÊU:
    if (target) {
        // VÍ DỤ 1: Logic "Kamikaze" - Luôn lao thẳng vào địch
        // return { tx: target.x, ty: target.y };

        // VÍ DỤ 2: Logic "Thận trọng" - Nếu máu thấp, chạy trốn (về góc 0,0)
        // if (unit.hp < 20) return { tx: 0, ty: 0 };
        // return { tx: target.x, ty: target.y };

        // VÍ DỤ 3: Logic "Đội hình" - Chỉ di chuyển nếu địch ở gần (tấn công chủ động)
        if (minDistance < 200) {
            return { tx: target.x, ty: target.y };
        }
    }

    // Trả về null để game chạy logic mặc định
    return null;
};
