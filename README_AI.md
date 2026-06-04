# Hướng dẫn tạo AI cho War of Points

Chào mừng bạn đến với cộng đồng phát triển AI cho *War of Points*! Để tạo thuật toán riêng, hãy làm theo các bước dưới đây.

## 1. Cấu trúc Unit (Đối tượng AI có thể dùng)
Khi hàm `decide` được gọi, bạn nhận được một `unit`. Các thuộc tính bạn có thể truy cập:
- `unit.x`, `unit.y`: Vị trí hiện tại.
- `unit.team`: 0 (Đỏ) hoặc 1 (Xanh).
- `unit.type`: 'soldier', 'tank', 'cannon', 'mine'.
- `unit.hp`: Máu hiện tại.
- `unit.cool`: Thời gian hồi chiêu (Cooldown) của kỹ năng.
- `unit.targetAng`: Góc xoay hiện tại.

## 2. Cách thiết lập
1. Tạo file `my_ai.js` trong thư mục project.
2. Mở `index.html` và thêm dòng này vào trước `</body>`:
   `<script src="my_ai.js"></script>`
3. Copy nội dung từ `template_ai.js` vào `my_ai.js` và bắt đầu lập trình!

## 3. Mẹo
- Nếu bạn không trả về `{ tx: x, ty: y }`, đơn vị sẽ không di chuyển (tự tạo thuật toán hoàn toàn).
- Bạn có thể kiểm tra danh sách `gameUnits` để biết vị trí của tất cả đồng đội và kẻ địch.

