// js/ai_interface.js
// Đây là "hợp đồng" (contract) cho các nhà phát triển AI
// Người chơi có thể ghi đè hàm decide để tạo thuật toán riêng.

window.CustomAI = {
    /**
     * Hàm này được gọi mỗi frame cho mỗi đơn vị thuộc team AI.
     * @param {Object} unit - Đối tượng đơn vị hiện tại.
     * @param {Array} gameUnits - Danh sách tất cả đơn vị trong game.
     * @returns {Object|null} - Trả về { tx: number, ty: number } để di chuyển, hoặc null để dùng logic mặc định.
     */
    decide: function(unit, gameUnits) {
        // Mặc định trả về null để sử dụng logic của game
        return null; 
    }
};
