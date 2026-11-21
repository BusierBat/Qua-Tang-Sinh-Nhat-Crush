/* ============================================================
   QUA-TANG-SINH-NHAT-CRUSH — CẤU HÌNH NỘI DUNG
   ------------------------------------------------------------
   MỌI nội dung cá nhân hóa nằm trong file này.
   KHÔNG cần sửa index.html / style.css / script.js để đổi nội dung.

   PHIÊN BẢN CỘNG ĐỒNG: các trường tên/ngày đang là placeholder
   đúng theo đặc tả (mục XII). Nội dung thư & lời nhắn là VĂN BẢN
   MẪU (được đánh dấu ở từng mục) để hành trình hiển thị đầy đủ —
   hãy thay bằng lời của riêng bạn trước khi gửi.

   ⚠ RIÊNG TƯ: sau khi điền thông tin thật, KHÔNG commit file này
   lên repository công khai. Xem README.md → mục "Riêng tư".
   Cách an toàn: `git update-index --skip-worktree config.js`
   hoặc tạo `config.personal.js` (đã được .gitignore bỏ qua) chứa
   `window.GIFT_CONFIG_PERSONAL = { ... }` — script.js sẽ ưu tiên
   hợp nhất đè lên config.js nếu nó được khai báo trong index.html.
   ============================================================ */

window.GIFT_CONFIG = {

  /* ---------- DANH TÍNH (placeholder — bắt buộc thay) ---------- */
  // [Tên người nhận] — xuất hiện ở lời chào, thiệp, thư, kết thúc
  recipientName: "[Tên người nhận]",
  // [Tên người gửi] — ký cuối lá thư + màn hình kết thúc
  senderName: "[Tên người gửi]",
  // [Ngày sinh nhật] — hiển thị trên thiệp & dấu tròn trên lá thư, ví dụ: "20 tháng 11"
  birthDateLabel: "[Ngày sinh nhật]",
  // Ngày sinh nhật thật dạng "MM-DD" (vd "12-12" = 12 tháng 12). ĐỂ TRỐNG nếu không muốn.
  // Khi đúng ngày đó, trang hiện dòng chip "Hôm nay, đúng ngày này…" ở màn đầu.
  birthDateISO: "",

  /* ---------- 1. MÀN HÌNH ĐẦU (Hộp quà) ---------- */
  landing: {
    // Dòng nhỏ phía trên lời chào. {sender} = tên người gửi. Để trống "" để ẩn.
    kicker: "Từ {sender} — một điều nho nhỏ",
    // {name} sẽ được thay bằng recipientName tự động
    greeting: "Có một món quà nhỏ dành cho {name}.",
    sub: "Không phải quà đắt tiền — chỉ là thứ được chuẩn bị chỉn chu, dành riêng cho một người đặc biệt.",
    // Chip nhỏ dưới dòng phụ. Nếu không set birthDateISO thì luôn dùng chipOtherwise.
    chipOnBirthday: "Hôm nay, đúng ngày này — món quà được phép mở rồi đấy.",
    chipOtherwise: "Món quà này đã được gói từ mấy hôm trước, chỉ chờ đúng hôm nay thôi.",
    openButton: "Mở quà nhé!"
  },

  /* ---------- 3. THIỆP SINH NHẬT ---------- */
  card: {
    eyebrow: "Thiệp chúc mừng",
    title: "Chúc mừng sinh nhật, {name}!",
    // VĂN BẢN MẪU — thay bằng lời chúc của bạn (khuyến nghị 2–4 câu)
    message: "Mong tuổi mới của bạn như chiếc hộp vừa mở: bên trong luôn có ánh sáng, có tí lấp lánh, và một điều tốt đẹp đang chờ. Và mong rằng, giữa bao lời chúc bạn nhận được hôm nay, lời chúc của mình là lời khiến bạn mỉm cười lâu nhất.",
    toLetterButton: "Có một lá thư dành cho bạn"
  },

  /* ---------- 4. LÁ THƯ (Phong bì) ---------- */
  letter: {
    envelopeHint: "Chạm vào phong bì để mở",
    title: "Gửi {name},",
    // VĂN BẢN MẪU — thay bằng [Nội dung thư] của riêng bạn.
    // Mỗi phần tử mảng = một đoạn văn. Giữ 3–6 đoạn cho nhịp đọc đẹp.
    paragraphs: [
      "Hôm nay là ngày của bạn — và mình đã 'bận rộn' cả tuần chỉ để chuẩn bị dòng chữ này. Nghe hơi quá, nhưng thành thật mà nói: có những người khiến mình muốn chỉn chu hơn, và bạn là một trong số đó.",
      "Mình không giỏi gói quà, cũng không giỏi gói lời. Nên chiếc hộp vừa rồi chỉ là cái cớ — còn đây mới là điều thật: cảm ơn vì bạn luôn là đúng bản bạn. Cái cười hơi to của bạn, cách bạn chăm chút những thứ nhỏ, và cả những lúc bạn khó tính — đều quý.",
      "Mong năm mới của bạn đủ nhiều lý do để cười, đủ bình yên để ngủ ngon, và đủ dũng khí để chọn những điều mình xứng đáng có. Và nếu một ngày bạn quên mình giỏi nhường nào — mở lại lá thư này là được, mình viết sẵn cho ngày đó rồi."
    ],
    closing: "Chúc mừng sinh nhật. Thật nhiều — nhiều hơn cả những gì mình gói được trong này.",
    signatureLabel: "Thân mến,",
    // P/S hiện dưới chữ ký. ĐÂY LÀ CHỖ ĐẶT LỜI BẠN MUỐN NÓI RIÊNG.
    // Để trống "" để ẩn. Ví dụ: "P/S: Cuối tuần này rảnh không? Mình có chuyện muốn hỏi mặt."
    postscript: "P/S: Nếu bạn đang mỉm cười khi đọc tới đây… thì mọi thứ mình chuẩn bị đã đáng rồi đấy."
  },

  /* ---------- 5. LỜI NHẮN NHỎ (có thể bỏ qua) ---------- */
  notes: {
    sectionTitle: "Vài lời nhắn nhỏ",
    sectionHint: "Mở nếu bạn muốn — không bắt buộc đâu.",
    openLabel: "Lời nhắn",
    // VĂN BẢN MẪU — thay bằng [Lời nhắn riêng] của bạn. 2–4 mục là đẹp nhất.
    items: [
      {
        title: "Nhắn nhỏ thứ nhất",
        body: "Hôm nay bạn được phép: ngủ nướng, ăn ngon, từ chối mọi thứ vô duyên, và cười thật to không cần lý do. Đó là luật."
      },
      {
        title: "Nhắn nhỏ thứ hai",
        body: "Có một bí mật nho nhỏ: người chuẩn bị tất cả những thứ này, chỉ mong được thấy bạn cười lúc mở ra. Nếu bạn đang cười — người đó đang thắng lớn."
      },
      {
        title: "Nhắn nhỏ cuối",
        body: "Giữ lá thư này lại nhé. Ngày nào mưa kéo dài quá, mở ra đọc một đoạn — coi như một cái ôm được gửi trước, chưa cần trả lời."
      }
    ],
    skipLabel: "Đọc rồi, đi tiếp nhé"
  },

  /* ---------- 5b+6. THỬ THÁCH CUỐI: SNAKE (bắt buộc để đến màn kết thúc) ---------- */
  snake: {
    introTitle: "Một thử thách nhỏ trước điều cuối cùng",
    introBody: "Điều cuối cùng nằm sau một trò chơi nhỏ: điều khiển chú rắn pastel, thu thập đủ 5 trái tim là điều đặc biệt sẽ hiện ra. Chạm biên hay chạm thân là phải chơi lại — không sao, nhẹ nhàng thôi.",
    goalText: "Mục tiêu:",
    startLabel: "Bắt đầu thử thách",
    hudTitle: "Thu thập 5 trái tim",
    hint: "Không giới hạn thời gian — đi chậm mà chắc nhé.",
    controlsKbd: "Trên máy tính: WASD hoặc phím mũi tên — rắn quẹo mượt theo hướng bấm",
    controlsTouch: "Trên điện thoại: chạm và giữ ở nơi bạn muốn — rắn tự quẹo theo ngón tay",
    ovReady: "Sẵn sàng…",
    ovPaused: "Tạm dừng",
    resumeLabel: "Chơi tiếp",
    ovCrashTitle: "Chạm nhẹ quá rồi!",
    ovCrashBody: "Tiến trình tim quay về 0/5 — thử lại nhé, lần này chắc chắn sẽ được.",
    retryLabel: "Chơi lại từ đầu",
    ovWinTitle: "Tuyệt vời — đủ 5/5!",
    ovWinBody: "Điều cuối cùng đang mở ra…"
  },

  /* ---------- 6. MÀN HÌNH KẾT THÚC ---------- */
  ending: {
    title: "Và một điều cuối cùng…",
    // VĂN BẢN MẪU — có thể giữ nguyên hoặc viết lại
    message: "Mong mỗi ngày của bạn đều có một chút lấp lánh như lúc mở chiếc hộp này. Và nếu bạn chịu đọc tới đây thì mình nói thật: việc biết bạn mỉm cười, là món quà tốt nhất của riêng mình.",
    // Lời mời cuối — chỗ quyết định của bạn. Để trống "" để ẩn hoàn toàn.
    invite: "Còn nếu bạn muốn nói gì với người viết mấy dòng này… thì hôm nay là một ngày hợp lý đấy.",
    signature: "— {sender}",
    replayButton: "Xem lại từ đầu",
    endButton: "Kết thúc"
  },

  /* ---------- Màn hình "đã kết thúc" (sau nút Kết thúc) ---------- */
  farewell: {
    title: "Hẹn một ngày thật đẹp nhé.",
    // Dòng nhỏ dưới chữ ký. Để trống "" để ẩn.
    sub: "Cảm ơn vì đã mở hết mọi thứ.",
    replayHint: "mở lại từ đầu"
  },

  /* ---------- Giao diện tiện ích (không bắt buộc đổi) ---------- */
  ui: {
    soundOn: "Bật âm thanh hiệu ứng",
    soundOff: "Tắt âm thanh hiệu ứng",
    perfTitle: "Hiệu năng hiển thị",
    perfHint: "Chế độ Tự động sẽ tự chọn mức phù hợp với thiết bị. Mọi chế độ đều giữ nguyên nội dung và tính năng.",
    perfAuto: "Tự động (khuyến nghị)",
    perfEfficient: "Tiết kiệm tài nguyên",
    perfBalanced: "Cân bằng",
    perfHigh: "Chất lượng cao",
    perfNow: "Đang dùng: {profile} ({mode})",
    modeAuto: "tự động",
    modeManual: "thủ công",
    profileNames: { efficient: "Tiết kiệm", balanced: "Cân bằng", high: "Chất lượng cao" },
    toastPerf: "Hiệu năng: {profile}",
    toastRt: "Đã giảm tạm chất lượng hiệu ứng để chạy mượt hơn"
  }
};
