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

## 🖼️ Cách Thêm Ảnh & Cơ Chế Random Ảnh Qua Các Màn
Bạn có thể thêm nhiều ảnh tùy thích vào game (ảnh meme, anime, idol, avatar,...):
1. Chép các file ảnh vào thư mục `assets/` theo cú pháp đặt tên: `card1.jpg`, `card2.jpg`, `card3.jpg`,... đến `card11.jpg`.
2. **Thuật toán xoay tua không bao giờ trùng ảnh**: Áp dụng công thức `(level % 11) ± i` cho 4 thẻ (với $i = 0, 1, 2, 3$). Màn 1 bắt đầu đẹp mắt với thẻ 1, 2, 3, 4 và tăng tiến xoay vòng qua các màn tiếp theo mà không bao giờ bị trùng lặp!
3. **Kích thước khuyến nghị**: Chuẩn **156 x 222 px** (hoặc tỉ lệ 2:3 như `312x444 px`). Hỗ trợ các định dạng: `.jpg`, `.png`, `.webp`.
4. Game sẽ tự động căn giữa tỉ lệ (`object-fit: cover`), bo tròn góc 12px và bọc viền neon phát sáng theo màu sắc rực rỡ!

---

## 🎂 Màn Chúc Mừng Sinh Nhật Bất Ngờ (Birthday Surprise)
Khi người chơi chiến thắng ở các màn có `level > 1`, bảng chiến thắng sẽ xuất hiện nút phát sáng:
> `🎁 Mở Lời Chúc Bất Ngờ ✨`

### Kịch bản tương tác (Phương án A):
1. **Chạm mở Hộp quà 3D**: Nắp hộp quà bung mở, pháo hoa bay lượn và bài hát **Happy Birthday To You** (giai điệu chuông pha lê Web Audio) tự động ngân vang!
2. **Thiệp chúc mừng sang trọng**: Khung avatar đội vương miện 👑 vàng lấp lánh và lời chúc được **gõ từng ký tự (Typewriter)** chân thành, cảm xúc.
3. **Thổi Nến Ước Nguyện**: Bấm nút `🎂 Thổi Nến Ước Nguyện` để dập tắt ngọn nến lung linh 🕯️ và nhận thông điệp ước nguyện thành hiện thực!

### Cách sửa lời chúc và tên người nhận:
Mở file `game.js`, tìm đoạn `this.birthdayConfig` (khoảng dòng 265) và thay đổi theo ý bạn:
```javascript
this.birthdayConfig = {
    recipientName: "Tên Người Nhận 💖",
    avatarImg: "assets/card1.jpg", 
    title: "HAPPY BIRTHDAY! 🎂",
    wishes: "Chúc mừng sinh nhật! 💖 Chúc bạn bước sang tuổi mới luôn ngập tràn tiếng cười, luôn rạng rỡ, xinh đẹp và mọi ước mơ đều trở thành hiện thực nhé! ✨🎂🎉"
};
```

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
