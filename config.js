/* ============================================================
   UNWRAP — CẤU HÌNH NỘI DUNG LỜI CHÚC SINH NHẬT
   ------------------------------------------------------------
   MỌI nội dung cá nhân hóa nằm trong file này.
   KHÔNG cần sửa index.html / style.css / script.js để đổi nội dung.

   Token {name} / {sender} được thay tự động từ recipientName / senderName.
   Giữ nguyên token để dễ đổi tên sau này.

   ⚠ RIÊNG TƯ: nếu điền tên thật, KHÔNG commit file đã điền lên
   repository công khai. Xem README.md → mục "Quyền riêng tư".
   ============================================================ */

window.GIFT_CONFIG = {

  /* ---------- DANH TÍNH (placeholder — giữ nguyên token) ---------- */
  // [Tên người nhận] — xuất hiện ở lời chào, thiệp
  recipientName: "{name}",
  // [Tên người gửi] — ký cuối lá thư + màn hình tạm biệt
  senderName: "{sender}",
  // [Ngày sinh nhật] — hiển thị trên thiệp & dấu tròn trên lá thư, ví dụ: "20 tháng 11"
  birthDateLabel: "[Ngày sinh nhật]",
  // Ngày sinh nhật thật dạng "MM-DD" (vd "12-12" = 12 tháng 12). ĐỂ TRỐNG nếu không muốn.
  // Khi đúng ngày đó, trang hiện dòng chip "Hôm nay, đúng ngày này…" ở màn đầu.
  birthDateISO: "",

  /* ---------- 1. MÀN HÌNH ĐẦU (Hộp quà) ---------- */
  landing: {
    // Dòng nhỏ phía trên lời chào. {name} = tên người nhận. Để trống "" để ẩn.
    kicker: "Một món quà nhỏ dành riêng cho {name}.",
    greeting: "Có một món quà sinh nhật dành cho em nè.",
    sub: "Anh có chuẩn bị một chút bất ngờ cho em. Không biết em có thích không, nhưng anh hy vọng khi mở món quà này ra, em sẽ thấy vui.",
    // Chip nhỏ dưới dòng phụ. Nếu không set birthDateISO thì luôn dùng chipOtherwise.
    chipOnBirthday: "Hôm nay, đúng ngày này — món quà được phép mở rồi đấy.",
    chipOtherwise: "Món quà nhỏ này đã được chuẩn bị, chỉ chờ đúng hôm nay thôi.",
    openButton: "Mở quà thôi!"
  },

  /* ---------- 2. THIỆP SINH NHẬT ---------- */
  card: {
    eyebrow: "Thiệp chúc mừng",
    title: "Chúc mừng sinh nhật {name}! 🎉",
    message: "Hôm nay là sinh nhật em rồi! Chúc em có một ngày thật vui, nhận được nhiều quà và thật nhiều lời chúc. Mong là hôm nay sẽ có thật nhiều điều dễ thương đến với em.",
    toLetterButton: "Đọc thư nè"
  },

  /* ---------- 3. LÁ THƯ (Phong bì) ---------- */
  letter: {
    envelopeHint: "Chạm vào phong bì để mở",
    title: "Anh có vài điều muốn gửi em...",
    // Mỗi phần tử mảng = một đoạn văn.
    paragraphs: [
      "Sinh nhật vui vẻ nha em!",
      "Vậy là em lại thêm một tuổi mới rồi. Anh chúc em luôn khỏe mạnh, vui vẻ, học hành thật tốt và gặp nhiều may mắn trong mọi chuyện.",
      "Mong em lúc nào cũng tự tin, ngày càng xinh đẹp và đạt được những điều em đang cố gắng. Có chuyện vui thì cứ vui thật nhiều, còn nếu có ngày nào không vui thì mong mọi chuyện cũng sớm ổn hơn.",
      "Anh hy vọng tụi mình sẽ còn có thêm nhiều kỷ niệm đẹp cùng nhau. Cảm ơn em vì đã xuất hiện và khiến cuộc sống của anh có thêm nhiều điều đặc biệt.",
      "Anh không biết món quà này có đúng ý em không, nhưng anh đã dành thời gian chuẩn bị nó vì muốn dành tặng em một điều gì đó thật riêng.",
      "Một lần nữa, chúc em sinh nhật vui vẻ. Anh thương em!"
    ],
    // Không dùng dòng chốt riêng — đoạn cuối của thư đã là lời kết.
    closing: "",
    signatureLabel: "Gửi em,",
    // P/S hiện dưới chữ ký. Để trống "" để ẩn.
    postscript: ""
  },

  /* ---------- 4. NHỮNG LỜI CHÚC NHỎ ---------- */
  notes: {
    sectionTitle: "Những lời chúc nhỏ",
    sectionHint: "Mở nếu em muốn — không bắt buộc đâu.",
    openLabel: "Lời chúc",
    items: [
      {
        title: "Học hành thật tốt",
        body: "Chúc em học ngày càng tốt hơn, kiểm tra gặp đề dễ, thi cử thuận lợi và đạt được kết quả mà em mong muốn. Nhớ đừng thức khuya làm bài nhiều quá nha!"
      },
      {
        title: "Ngày càng xinh đẹp",
        body: "Chúc em ngày càng xinh đẹp, luôn tự tin và vui vẻ với chính mình. Mà thật ra trong mắt anh, em đã đáng yêu lắm rồi."
      },
      {
        title: "Luôn vui vẻ",
        body: "Mong em có thật nhiều ngày vui, gặp được nhiều chuyện thú vị và luôn có người để chia sẻ những chuyện nhỏ nhặt trong ngày."
      },
      {
        title: "Gặp nhiều may mắn",
        body: "Chúc em làm gì cũng thuận lợi, những dự định sắp tới đều suôn sẻ. Nếu có chuyện khó khăn thì cũng mong em sớm tìm được cách giải quyết."
      }
    ],
    skipLabel: "Đọc rồi, đi tiếp nhé"
  },

  /* ---------- 5. THỬ THÁCH CUỐI: SNAKE (bắt buộc để đến màn kết thúc) ---------- */
  snake: {
    introTitle: "Một thử thách nhỏ trước điều cuối cùng",
    introBody: "Điều cuối cùng nằm sau một trò chơi nhỏ: điều khiển chú rắn pastel, thu thập đủ 5 trái tim là điều đặc biệt sẽ hiện ra. Chạm biên hay chạm thân là phải chơi lại — không sao, nhẹ nhàng thôi.",
    goalText: "Mục tiêu:",
    startLabel: "Bắt đầu thử thách",
    hudTitle: "Thu thập 5 trái tim",
    hint: "Không giới hạn thời gian.",
    controlsKbd: "Trên máy tính: dùng WASD hoặc các phím mũi tên để đổi hướng",
    controlsTouch: "Trên điện thoại: chạm và vuốt tại bất kỳ đâu trên sân; nếu lệch hướng, rắn tự chỉnh về hướng gần nhất. Có thể đổi sang 4 nút mũi tên bên dưới.",
    controlsLabel: "Điều khiển:",
    controlStick: "Cần vuốt",
    controlDpad: "4 nút mũi tên",
    ovReady: "Sẵn sàng…",
    ovPaused: "Tạm dừng",
    resumeLabel: "Chơi tiếp",
    ovCrashTitle: "Thua rùii",
    ovCrashBody: "Tiến trình tim quay về 0/5 — thử lại nha, lần này chắc chắn sẽ được.",
    retryLabel: "Chơi lại từ đầu",
    ovWinTitle: "Tuyệt vời — đủ 5/5!",
    ovWinBody: "Điều cuối cùng đang mở ra…"
  },

  /* ---------- 6. MÀN HÌNH KẾT THÚC ---------- */
  ending: {
    title: "Em mở hết quà rồi đó!",
    // Xuống dòng bằng \n\n — CSS .ending-message dùng white-space: pre-line.
    message: "Vậy là em đã mở hết món quà anh chuẩn bị rồi. Anh hy vọng em thích nó và có thêm một chút niềm vui trong ngày hôm nay.\n\nChúc cô gái của anh có một tuổi mới thật vui và thật nhiều điều đáng nhớ. ❤️",
    // Lời mời cuối — để trống "" để ẩn hoàn toàn.
    invite: "",
    // Không ký ở màn kết (chữ ký nằm ở màn tạm biệt).
    signature: "",
    replayButton: "Xem lại từ đầu",
    endButton: "Kết thúc"
  },

  /* ---------- Màn hình "đã kết thúc" (sau nút Kết thúc) ---------- */
  farewell: {
    title: "Đến đây là hết món quà rồi.",
    sub: "Cảm ơn em đã dành thời gian mở món quà nhỏ này. Chúc em sinh nhật vui vẻ, luôn khỏe mạnh, học tốt và cười thật nhiều nha.",
    sign: "{sender}",
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
