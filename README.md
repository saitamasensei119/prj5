# 🎯 Card Drop Shooter - Game Bắn Rơi 4 Thẻ Bài

Game arcade bắn súng cắt dây treo thẻ bài trên nền tảng **HTML5 Canvas & JavaScript**, tối ưu hóa 100% cho trải nghiệm chạm/vuốt trên điện thoại di động (iOS & Android).

---

## 🎮 Cách Chơi (Gameplay)
- **Cơ chế chính**: **Thanh ray cố định** trên đỉnh màn hình. Cả 4 thẻ bài di chuyển ngang độc lập với các hướng và vận tốc khác nhau, **có thể lướt xuyên qua nhau** mượt mà, thẳng đứng và không bị lắc.
- **Bắn đứt dây**: Người chơi điều khiển nòng pháo ở dưới đáy:
  - **Trên điện thoại**: Chạm & kéo ngón tay trên màn hình để ngắm đường đạn laser -> Thả tay ra để BẮN!
- **Mục tiêu & Đạn xuyên thấu**: Đạn có thể **xuyên thẳng qua thân thẻ bài** mà không bị chặn, bay thẳng lên để cắt đứt **sợi dây treo** làm thẻ rơi xuống!
- **Hoàn thành màn**: Bắn rơi đủ 4 thẻ để qua màn mới với tốc độ nhanh và thử thách hơn!

---

## 🖼️ Cách Thay Thẻ Bằng Hình Ảnh Tự Chọn
Bạn có thể tự thay 4 thẻ bài bằng bất kỳ ảnh nào bạn thích (ảnh meme, anime, logo, avatar,...):
1. Chuẩn bị 4 file ảnh và chép vào thư mục `assets/` với đúng tên sau:
   - `assets/card1.png` (thay cho thẻ thứ 1)
   - `assets/card2.png` (thay cho thẻ thứ 2)
   - `assets/card3.png` (thay cho thẻ thứ 3)
   - `assets/card4.png` (thay cho thẻ thứ 4)
2. **Kích thước khuyến nghị**: Chuẩn **208 x 296 px** (hoặc tỉ lệ 2:3 như `416x592 px`). Định dạng: `.jpg`, `.png`, `.webp`.
3. Game sẽ tự động nạp ảnh (hỗ trợ cả `.jpg` và `.png`), bo tròn góc 16px và bọc viền neon phát sáng. Nếu chưa có ảnh, game tự động vẽ quân bài mặc định!

---

## 🚀 Hướng Dẫn Đưa Lên GitHub & Bật Link Chơi Trên Điện Thoại (GitHub Pages)

Để gửi link cho bạn bè hoặc người khác mở trên điện thoại chơi ngay (không cần cài app):

### Bước 1: Tạo Repository trên GitHub
1. Đăng nhập vào [GitHub](https://github.com).
2. Bấm nút **New** (Tạo repo mới).
3. Đặt tên repository (ví dụ: `card-drop-shooter`), chọn **Public**, rồi bấm **Create repository**.

### Bước 2: Đẩy Code Lên GitHub
Mở terminal tại thư mục `d:\prj5` và chạy các lệnh sau:
```bash
git init
git add .
git commit -m "Initial commit: Card drop shooter game"
git branch -M main
git remote add origin https://github.com/<tai-khoan-cua-ban>/<ten-repo>.git
git push -u origin main
```
*(Thay `<tai-khoan-cua-ban>` và `<ten-repo>` bằng tài khoản và tên repository thực tế của bạn).*

### Bước 3: Bật GitHub Pages (Lấy Link Chơi)
1. Trong trang repository trên GitHub, vào mục **Settings** (Cài đặt) -> chọn tab **Pages** ở thanh bên trái.
2. Tại mục **Build and deployment** -> **Branch**:
   - Chọn nhánh: `main`
   - Chọn thư mục: `/ (root)`
3. Bấm **Save**.
4. Chờ khoảng 30 giây đến 1 phút, GitHub sẽ hiển thị đường link trang web của bạn:
   > 🔗 `https://<tai-khoan-cua-ban>.github.io/<ten-repo>/`

👉 **Gửi link này cho bất kỳ ai**, họ chỉ cần bấm vào trên điện thoại (Safari, Chrome, Zalo, Messenger) là chơi được ngay lập tức với âm thanh sống động và 60 FPS mượt mà!

---

## 🛠 Công Nghệ Sử Dụng
- **HTML5 Canvas**: Vẽ đồ họa vector sắc nét (hỗ trợ màn hình Retina High-DPI).
- **Vanilla JavaScript (ES6+)**: Xử lý vật lý lắc lư (pendulum sway), trọng lực rơi thẻ, hệ thống hạt nổ (sparks) và pháo hoa (confetti).
- **Web Audio API**: Tự động tổng hợp âm thanh laser, tiếng cắt dây và nhạc chiến thắng bằng mã nguồn (không cần tải thêm bất kỳ file mp3 bên ngoài nào).
- **Mobile Touch Events**: Hỗ trợ cảm ứng đa điểm, khóa cuộn trang (`touch-action: none`) chống lag giật trên thiết bị di động.
