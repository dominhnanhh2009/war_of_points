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

## 2. Cách thức tấn công của các Object
- **Soldier**: Tấn công cận chiến, giảm 1 HP kẻ địch trong phạm vi. Hồi chiêu: 0.5s.
- **Tank**: Bắn đạn theo hướng mục tiêu, gây sát thương va chạm. Tầm bắn: 70. Hồi chiêu: 1.2s.
- **Cannon**: Gây sát thương diện rộng (bán kính 40) tại vị trí mục tiêu. Yêu cầu khoảng cách mục tiêu từ 50 đến 100. Hồi chiêu: 10s.
- **Mine**: Tự kích nổ khi có đơn vị địch chạm vào, gây sát thương diện rộng (bán kính 25).
## 3. Cách thiết lập
1. Tạo file `my_ai.js` trong thư mục project.
2. Mở `index.html` và thêm dòng này vào trước `</body>`:
   `<script src="my_ai.js"></script>`
3. Copy nội dung từ `template_ai.js` vào `my_ai.js` và bắt đầu lập trình!

## 4. Mẹo
- Trả về `null` nếu bạn muốn đơn vị đó sử dụng logic mặc định của game.
- Nếu bạn trả về `{ tx: x, ty: y }`, đơn vị sẽ ưu tiên di chuyển đến đó ngay lập tức.
- Bạn có thể kiểm tra danh sách `gameUnits` để biết vị trí của tất cả đồng đội và kẻ địch.

