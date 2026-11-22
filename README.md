# Unwrap Community 🎁 — bản Community

Một website quà tặng sinh nhật cỡ nhỏ: hộp quà 3D mở nắp, thiệp, lá thư trong phong bì, lời nhắn nhỏ, minigame Snake (bắt buộc) và màn kết thúc có hoa và ánh sáng. **Bản Community** dùng nội dung **lời chúc sinh nhật trung tính**, không cá nhân hóa, không tình cảm riêng tư. Không backend, không analytics — chỉ có một hành trình 2–5 phút.

> Các trường tên/ngày là **placeholder** (`[Tên người nhận]`, `[Tên người gửi]`, `[Ngày sinh nhật]`). Nội dung thư & lời nhắn là **lời chúc sinh nhật thông thường** (học tập, sức khỏe, may mắn, xinh đẹp, tự tin). Nếu muốn cá nhân hóa, xem mục bên dưới — nhưng **không commit** bản đã điền lên repo công khai.

## Tính năng

- Hành trình 7 màn hình: Landing (hộp quà 3D) → Mở quà (rung → tháo nơ → mảnh ruy băng văng khỏi hộp → nắp mở kèm "camera punch" → giấy tissue bay ra → ánh sáng + tia sáng quay → thiệp nhỏ trồi ra → pháo lấp lánh) → Thiệp → Lá thư trong phong bì → Lời nhắn nhỏ → **Giới thiệu thử thách cuối → Minigame Snake (bắt buộc, không có skip)** → màn kết thúc (3 đợt pháo giấy) → màn tĩnh lặng có bụi sáng.
- **KHÔNG có nhạc nền.** Chỉ có 8 hiệu ứng âm thanh ngắn (rung hộp, mở hộp, lấp lánh, mở phong bì, giấy, thu thập tim, hoàn thành snake, chuông kết). Mặc định **muted** cho tới khi người dùng chủ động bật bằng nút loa. Nếu file âm thanh lỗi/bị chặn (vd. mở bằng `file://`), hệ thống tự chuyển sang fallback tổng hợp bằng WebAudio cùng tính cách âm — trang không bao giờ vỡ vì âm thanh.
- **Minigame Snake — cổng bắt buộc vào màn kết thúc**: thu thập đúng 5 trái tim mới được chuyển sang màn kết. Rắn vẽ tọa độ liên tục trên canvas (không lưới, không pixel art, không emoji).
  - **Thân rắn giãn cách đều theo quãng đường di chuyển thực tế** (không phụ thuộc FPS): polyline vị trí đầu rắn được lấy mẫu lại theo cung để các đoạn luôn cách nhau một khoảng cố định — mượt và ổn định cả khi FPS thấp/cao/thay đổi.
  - **Điều khiển**: trên máy tính **WASD hoặc phím mũi tên** (nhận diện cả `e.code` vật lý lẫn `e.key` chữ cái nên đúng cả bàn phím AZERTY/QWERTZ); trên điện thoại **vuốt theo hướng muốn rẽ** (một cú vuốt = một lần đổi hướng, Pointer Events + `touch-action:none` nên vuốt trong sân không cuộn trang).
  - Va chạm biên/thân → chỉ chơi lại minigame, tiến trình tim về 0/5, các phần trước giữ nguyên. Không giới hạn thời gian, không skip.
  - **Tạm dừng**: khi rời tab hoặc bấm Space, game dừng hẳn và hiện overlay "Tạm dừng"; nhấn nút **Chơi tiếp** (hoặc Space) mới chạy lại. Không tự chạy lại khi chưa xác nhận.
  - **Khóa màn kết thúc tập trung**: `goto('ending')` chỉ mở khi đã thắng Snake đủ 5/5 (`snakeDone`). Không dựa vào ẩn/hiện nút.
- Hộp quà 3D dựng bằng **CSS 3D thuần**: thân hộp + nắp có độ dày, mặt trong lòng hộp tối màu tạo chiều sâu thật, ruy băng và nơ có hình khối, giấy tissue bay khỏi hộp khi mở nắp, tia sáng quay chậm sau hộp lúc nắp mở, và nghiêng theo con trỏ chuột (pointer tilt, chỉ trên máy có chuột) — không cần WebGL, không tải thư viện từ CDN.
- **Animation phủ khắp hành trình**: hộp "thở" và xoay nhẹ liên tục; thiệp lật 3D vào, từng dòng trồi lên nối tiếp, ánh champagne quét qua chữ một lần, cành hoa trang trí "vẽ nét" dần; phong bì nghiêng 3D khi hover; lá thư hiện lần lượt từng đoạn; thẻ lời nhắn nghiêng 3D theo con trỏ; modal pop có perspective; màn kết & màn tĩnh lặng stagger từng lớp. Tất cả tôn trọng `prefers-reduced-motion` và nằm dưới điều khiển của profile hiệu năng.
- **Hệ thống tự đánh giá cấu hình**: thu thập tín hiệu thiết bị + benchmark nhẹ 42 frame + probe giải mã, chọn 1 trong 3 profile (`Tiết kiệm / Cân bằng / Chất lượng cao`), giám sát runtime có hysteresis, người dùng có thể chọn thủ công (mặc định: Tự động). **Mọi profile đều giữ nguyên tính năng** — chỉ đổi chất lượng kỹ thuật (số hạt, DPR canvas, độ mờ bóng/độ trong kính).
- Ba phương thức tương tác đầy đủ: chuột, cảm ứng, bàn phím (Tab/Enter/Space/Escape), vùng nhấn ≥ 44px, focus indicator rõ.
- Hai bố cục có chủ đích: **mobile portrait** (dọc) và **desktop landscape** (copy & hộp quà cạnh nhau); thêm bố cục gọn riêng cho điện thoại/tablet ngang. Tôn trọng `prefers-reduced-motion` và safe-area (Dynamic Island, home indicator) qua `100dvh` + `env(safe-area-inset-*)`.

## Cấu trúc

```
Unwrap-Community/
├── index.html      # khung semantic của cả hành trình (kèm sân minigame)
├── style.css       # thiết kế + hộp quà 3D + minigame snake + responsive + profile hiệu năng
├── snake.js        # minigame Snake (thân giãn cách đều, WASD/swipe, pause/resume, khóa ending)
├── script.js       # hành trình, hệ hiệu năng, âm thanh SFX, hạt
├── config.js       # ★ TOÀN BỘ nội dung hiển thị nằm ở đây
├── README.md
├── LICENSE         # MIT; font OFL; audio tự sinh
└── assets/
    ├── audio/      # 8 hiệu ứng mp3 (tự tổng hợp, xem LICENSE) — KHÔNG có nhạc nền
    ├── fonts/      # Playfair Display + Dancing Script (SIL OFL 1.1, subset vi+latin)
    └── images/     # favicon.svg + apple-touch-icon.png
```

## Nội dung (bản Community)

Toàn bộ nội dung hiển thị nằm trong `config.js`:

- `recipientName`, `senderName`, `birthDateLabel`, `birthDateISO` — placeholder; điền nếu muốn cá nhân hóa.
- `landing.*`, `card.*`, `letter.*` (kể cả `letter.paragraphs`, `letter.closing`, `letter.signatureLabel`), `notes.items`, `ending.*`, `farewell.*` — lời chúc sinh nhật trung tính.
- `ending.invite` để trống `""` → ẩn hoàn toàn. `letter.postscript` để trống `""` → ẩn.
- `snake.controlsKbd`, `snake.controlsTouch` — mô tả điều khiển thực tế (WASD/mũi tên và vuốt).

**Riêng tư:** bản đã điền thông tin thật **không được commit** lên repo công khai. Hai cách:
- `git update-index --skip-worktree config.js`, hoặc
- tạo `config.personal.js` (đã bị `.gitignore` bỏ qua) chứa `window.GIFT_CONFIG_PERSONAL = {...}` và thêm `<script src="config.personal.js"></script>` ngay sau `config.js` trong `index.html` — script.js sẽ ưu tiên hợp nhất nó.

Không đặt thông tin cá nhân vào tên file, tên ảnh, commit message hay README.

## Chạy thử

Không cần build. Chỉ cần một static server (khuyến nghị, để âm thanh tải được file thật thay vì fallback):

```bash
cd Unwrap-Community
python3 -m http.server 8080
# mở http://localhost:8080
```

Mở thẳng `index.html` (double-click) cũng chạy được: mọi tính năng vẫn hoạt động, âm thanh sẽ dùng nhánh WebAudio tự tổng hợp do giới hạn `file://` của trình duyệt.

## Hệ thống hiệu năng

| Profile | Áp dụng | Đổi gì (không mất tính năng) |
| --- | --- | --- |
| Tiết kiệm | máy yếu, `saveData`, pin yếu | Ít hạt hơn (burst ~42, ambient thấp), DPR canvas = 1, bỏ blur kính, bóng đổ mỏng hơn — **vẫn giữ mọi animation và hiệu ứng** |
| Cân bằng | mặc định tầm trung | ~84 hạt, DPR ≤ 1.5, blur kính nhẹ |
| Chất lượng cao | máy mạnh | ~150 hạt, DPR ≤ 2, bóng sâu hơn, cảm giác chuyển động đầy đủ nhất |

- Chế độ **Tự động** chấm điểm từ: `hardwareConcurrency`, `deviceMemory`, GPU renderer (nếu trình duyệt cho phép), benchmark 42 frame, probe giải mã audio, hỗ trợ `backdrop-filter`, `saveData`, pin. Không suy diễn cấu hình chính xác từ một tín hiệu duy nhất.
- Runtime monitor: fps < 22 trong ~6s → hạ tạm một mức (hysteresis 8s, không đổi trong lúc animation chính); fps ổn định > 50 → nâng cấp dần trở lại. Thay đổi chỉ ảnh hưởng số hạt/DPR/độ mờ bóng — **không tắt animation hay ẩn hiệu ứng nào**.
- Người dùng đổi thủ công trong bảng cài (nút góc phải trên), thông báo toast xác nhận, lựa chọn được ghi nhớ trong `localStorage` (2 khóa: `qt-perf`, `qt-sound` — chỉ thiết bị của bạn, không gửi đi đâu).

## Điều kiện mở màn kết thúc

Màn kết thúc chỉ mở khi người chơi **hoàn thành Snake với đủ 5/5 trái tim**. Gate nằm tập trung trong `goto('ending')` của `script.js` (dựa trên cờ `snakeDone`), không dựa vào việc ẩn/hiện nút. Thua chỉ chơi lại minigame, không reset toàn bộ website.

## Tương thích & kiểm thử

Mã nguồn hướng tới responsive đầy đủ (320×640 … 1920×1080) và thiết bị cảm ứng (Android/iOS Safari, Chrome). **Chưa xác minh trên thiết bị thật**: mã được viết để chạy tốt trên nhiều cấu hình nhưng số liệu FPS thực tế cần đo trên máy thật. Nếu cần, bảng cài hiệu năng ở góc phải trên có thể chuyển thủ công sang "Tiết kiệm tài nguyên".

## Quyền riêng tư

- Không backend, không analytics, không tracking, không yêu cầu quyền, không gửi dữ liệu ra ngoài.
- `localStorage` chỉ lưu 2 lựa chọn giao diện (âm thanh, hiệu năng).
- Thông tin cá nhân (nếu có) chỉ tồn tại trong `config.js` cục bộ của bạn.

## Giấy phép

MIT — xem `LICENSE`. Font: SIL OFL 1.1. Âm thanh: tự sinh cho dự án này, không giới hạn sử dụng.