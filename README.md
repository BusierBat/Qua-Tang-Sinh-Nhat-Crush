# Quà Tặng Sinh Nhật Crush 🎁

Một website quà tặng sinh nhật cỡ nhỏ nhưng làm bằng cả trái tim: hộp quà 3D mở nắp, thiệp, lá thư trong phong bì, lời nhắn nhỏ và màn kết thúc có hoa và ánh sáng. Không backend, không analytics, không nhạc nền — chỉ có hiệu ứng âm thanh nhẹ nhàng và một hành trình 2–5 phút dành riêng cho một người.

> Bản cộng đồng đang dùng **placeholder** (`[Tên người nhận]`, `[Tên người gửi]`, `[Ngày sinh nhật]`) và **văn bản mẫu** cho thư/lời nhắn. Cá nhân hóa bằng cách sửa `config.js` — xem bên dưới.

## Tính năng

- Hành trình 6 màn hình: Landing (hộp quà 3D) → Mở quà (rung → tháo nơ → mảnh ruy băng văng khỏi hộp → nắp mở kèm "camera punch" → giấy tissue bay ra → ánh sáng + tia sáng quay → thiệp nhỏ trồi ra → pháo lấp lánh) → Thiệp → Lá thư trong phong bì → Lời nhắn nhỏ (mở/đóng/bỏ qua) → Kết thúc (pháo giấy chào mừng, hoa, cánh hoa rơi) → màn tĩnh lặng có bụi sáng.
- Hộp quà 3D dựng bằng **CSS 3D thuần**: thân hộp + nắp có độ dày, **mặt trong lòng hộp tối màu tạo chiều sâu thật**, ruy băng và nơ có hình khối, giấy tissue bay khỏi hộp khi mở nắp, tia sáng quay chậm sau hộp lúc nắp mở, và **nghiêng theo con trỏ chuột** (pointer tilt, chỉ trên máy có chuột) — không cần WebGL, không tải thư viện từ CDN.
- **Animation phủ khắp hành trình, mỗi cái phục vụ cảm xúc**: hộp "thở" và xoay nhẹ liên tục; thiệp lật 3D vào, từng dòng trồi lên nối tiếp, ánh champagne quét qua chữ một lần, cành hoa trang trí được "vẽ nét" dần rồi hoa mới hiện; phong bì nghiêng 3D khi hover, giấy thư trồi lên có góc nghiêng; **lá thư hiện lần lượt từng đoạn**; thẻ lời nhắn nghiêng 3D theo con trỏ; modal pop có perspective; màn kết & màn tĩnh lặng stagger từng lớp. Tất cả tôn trọng `prefers-reduced-motion` và nằm dưới điều khiển của profile hiệu năng (máy yếu bỏ các animation chạy liên tục, giữ nguyên các hiệu ứng một lần).
- **Hệ thống tự đánh giá cấu hình** (mục VIII của đặc tả): thu thập tín hiệu thiết bị + benchmark nhẹ 42 frame + probe giải mã, chọn 1 trong 3 profile (`Tiết kiệm / Cân bằng / Chất lượng cao`), giám sát runtime có hysteresis, người dùng có thể chọn thủ công (mặc định: Tự động). Mọi profile đều **giữ nguyên tính năng** — chỉ đổi chất lượng kỹ thuật (số hạt, DPR canvas, blur, bóng).
- Âm thanh: 6 SFX ngắn (rung hộp, mở hộp, lấp lánh, mở phong bì, giấy, chuông kết) — **tự tổng hợp bằng kỹ thuật sound design thật**: tổng hợp modal (các mode cộng hưởng không hài hòa của vật thể + pitch drop lúc va chạm), partial chuông tỉ lệ thật kèm beating, sột giấy stick-slip có "hạt", reverb phòng convolution stereo, master chuẩn RMS + dither. Không dùng sample của bên thứ ba, bản quyền sạch 100%. Có nút bật/tắt. Nếu file lỗi/bị chặn (vd. mở bằng `file://`), hệ thống tự chuyển sang **fallback tổng hợp bằng WebAudio cùng tính cách âm** — trang không bao giờ vỡ vì âm thanh.
- Ba phương thức tương tác đầy đủ: chuột, cảm ứng, bàn phím (Tab/Enter/Space/Escape), vùng nhấn ≥ 44px, focus indicator rõ.
- Hai bố cục có chủ đích: **mobile portrait** (dọc, nút trong tầm một tay) và **desktop landscape** (copy & hộp quà cạnh nhau); thêm bố cục gọn riêng cho điện thoại/tablet ngang. Tôn trọng `prefers-reduced-motion` và safe-area (Dynamic Island, home indicator) qua `100dvh` + `env(safe-area-inset-*)`.

## Cấu trúc

```
Qua-Tang-Sinh-Nhat-Crush/
├── index.html      # khung semantic của cả hành trình
├── style.css       # thiết kế + hộp quà 3D + responsive + profile hiệu năng
├── script.js       # hành trình, hệ hiệu năng, âm thanh, hạt
├── config.js       # ★ TOÀN BỘ nội dung cá nhân hóa nằm ở đây
├── README.md
├── LICENSE         # MIT; font OFL; audio tự sinh
└── assets/
    ├── audio/      # 6 hiệu ứng mp3 (tự tổng hợp, xem LICENSE)
    ├── fonts/      # Playfair Display + Dancing Script (SIL OFL 1.1, subset vi+latin)
    └── images/     # favicon.svg + apple-touch-icon.png (xem trước khi gửi link)
```

## Cá nhân hóa (bắt buộc đọc trước khi tặng)

1. Mở **`config.js`**, thay các trường:
   - `recipientName`, `senderName`, `birthDateLabel` — tên người nhận, tên người gửi, ngày sinh nhật.
   - `birthDateISO` *(tùy chọn, dạng `"MM-DD"`)* — điền đúng ngày sinh nhật thì màn đầu hiện chip "Hôm nay, đúng ngày này…"; để trống nếu không muốn.
   - `landing.kicker`, `landing.chipOtherwise` — dòng dẫn và chip ở màn đầu (để trống `""` để ẩn).
   - `letter.paragraphs`, `letter.closing` — nội dung thư (đang là văn bản mẫu).
   - `letter.postscript` — dòng P/S dưới chữ ký, **chỗ để lời bạn muốn nói riêng** (để trống để ẩn).
   - `notes.items` — các lời nhắn nhỏ (đang là văn bản mẫu).
   - `ending.invite` — lời mời cuối màn kết thúc; để trống để ẩn hoàn toàn.
   - `farewell.sub` — dòng cảm ơn ở màn tĩnh lặng (để trống để ẩn).
2. Chạy thử, đọc lại từng màn hình một lần bằng chính thiết bị bạn sẽ tặng. Khi gửi link qua Zalo/Messenger, bản xem trước dùng `og:title`/`og:description` trong `index.html` (không chứa thông tin cá nhân — có thể tự sửa cho hợp ngữ cảnh).
3. **Riêng tư:** bản đã điền thông tin thật **không được commit** lên repo công khai. Hai cách:
   - `git update-index --skip-worktree config.js` (git sẽ bỏ qua thay đổi cục bộ của bạn), hoặc
   - tạo `config.personal.js` (đã bị `.gitignore` bỏ qua) chứa `window.GIFT_CONFIG_PERSONAL = {...}` và thêm một dòng `<script src="config.personal.js"></script>` ngay sau `config.js` trong `index.html` — script.js sẽ ưu tiên hợp nhất nó.
4. Không đặt thông tin cá nhân vào tên file, tên ảnh, commit message hay README.

## Chạy thử

Không cần build. Chỉ cần một static server (khuyến nghị, để âm thanh tải được file thật thay vì fallback):

```bash
cd Qua-Tang-Sinh-Nhat-Crush
python3 -m http.server 8080
# mở http://localhost:8080
```

Mở thẳng `index.html` (double-click) cũng chạy được: mọi tính năng vẫn hoạt động, âm thanh sẽ dùng nhánh WebAudio tự tổng hợp do giới hạn `file://` của trình duyệt.

## Hệ thống hiệu năng

| Profile | Áp dụng | Đổi gì (không mất tính năng) |
| --- | --- | --- |
| Tiết kiệm | máy yếu, `saveData`, pin yếu | 42 hạt burst, DPR canvas = 1, bỏ blur kính, bỏ animation idle (hộp thở, tia sáng, thiệp trôi), bóng mờ mỏng hơn |
| Cân bằng | mặc định tầm trung | 84 hạt, DPR ≤ 1.5, blur kính nhẹ |
| Chất lượng cao | máy mạnh | 150 hạt, DPR ≤ 2, bóng sâu hơn, cảm giác chuyển động đầy đủ nhất |

- Chế độ **Tự động** chấm điểm từ: `hardwareConcurrency`, `deviceMemory`, GPU renderer (nếu trình duyệt cho phép), benchmark 42 frame, probe giải mã audio, hỗ trợ `backdrop-filter`, `saveData`, pin. Không suy diễn cấu hình chính xác từ một tín hiệu duy nhất.
- Runtime monitor: fps < 22 trong ~6s → hạ một mức tạm (hysteresis 8s, không đổi trong lúc animation chính); fps ổn định > 50 → hạ cấp dần trở lại. Toàn bộ thay đổi chỉ ảnh hưởng số hạt/DPR/blur — không tắt màn hình hay animation nào.
- Người dùng đổi thủ công trong bảng cài (nút góc phải trên), thông báo toast xác nhận, lựa chọn được ghi nhớ trong `localStorage` (2 khóa: `qt-perf`, `qt-sound` — chỉ thiết bị của bạn, không gửi đi đâu).

## Tương thích & kiểm thử

Đã kiểm thử tự động trong môi trường headless Chromium (Linux) trên các viewport 320×640, 390×844, 430×932, 768×1024, 1024×768, 1366×768, 1920×1080: luồng đầy đủ chuột + bàn phím, không tràn ngang, không lỗi console, xử lý tab ẩn/quay lại giữa animation, theo dõi ghi chú `console` của hệ hiệu năng.

**Chưa xác minh trên thiết bị thật** (khai báo trung thực theo đặc tả mục IX/XIII): iOS Safari, Android Chrome/Samsung Internet, Windows Edge/Firefox, và đặc biệt là thiết bị tham chiếu ASUS VivoBook X540MA (Pentium N5000) — mã nguồn được viết để hướng mục tiêu ≥ 30 FPS trên máy này (CSS 3D thay WebGL, transform/opacity only, sprite dựng sẵn, pool tái sử dụng, canvas DPR cap) nhưng con số thực tế cần đo trên máy thật. Nếu phát hiện vấn đề, bảng cài hiệu năng ở góc phải trên có thể chuyển thủ công sang "Tiết kiệm tài nguyên".

## Quyền riêng tư

- Không backend, không analytics, không tracking, không yêu cầu quyền, không gửi dữ liệu ra ngoài.
- `localStorage` chỉ lưu 2 lựa chọn giao diện (âm thanh, hiệu năng).
- Thông tin cá nhân chỉ tồn tại trong `config.js` (bản cục bộ của bạn) — xem mục Cá nhân hóa.

## Giấy phép

MIT — xem `LICENSE`. Font: SIL OFL 1.1. Âm thanh: tự sinh cho dự án này, không giới hạn sử dụng.
