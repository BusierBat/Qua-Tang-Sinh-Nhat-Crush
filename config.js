

window.GIFT_CONFIG = {

  /* ---------- DANH TÍNH (placeholder — GIỮ NGUYÊN trong bản Community) ---------- */
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
    // Dòng nhỏ phía trên lời chào. {name} = tên người nhận. Để trống "" để ẩn.
    kicker: "Một món quà sinh nhật nhỏ dành cho {name}.",
    // {name} sẽ được thay bằng recipientName tự động
    greeting: "Có một món quà nhỏ dành cho {name}.",
    sub: "Một chút bất ngờ nhỏ dành cho ngày đặc biệt của em.",
    // Chip nhỏ dưới dòng phụ. Nếu không set birthDateISO thì luôn dùng chipOtherwise.
    chipOnBirthday: "Hôm nay, đúng ngày này — món quà được phép mở rồi đấy.",
    chipOtherwise: "Món quà nhỏ này đã được chuẩn bị, chỉ chờ đúng hôm nay thôi.",
    openButton: "Mở quà nhé!"
  },

  /* ---------- 3. THIỆP SINH NHẬT ---------- */
  card: {
    eyebrow: "Thiệp chúc mừng",
    title: "Chúc mừng sinh nhật {name}!",
    message: "Chúc em có một ngày sinh nhật thật vui vẻ, nhận được nhiều lời chúc và những món quà ý nghĩa!",
    toLetterButton: "Có một lá thư dành cho bạn"
  },

  /* ---------- 4. LÁ THƯ (Phong bì) ---------- */
  letter: {
    envelopeHint: "Chạm vào phong bì để mở",
    title: "Gửi {name},",
    // Mỗi phần tử mảng = một đoạn văn.
    paragraphs: [
      "Chúc mừng sinh nhật em!",
      "Chúc bạn học tập thật tốt, đạt được những kết quả như mong muốn và luôn thuận lợi trong những dự định sắp tới.",
      "Mong bạn ngày càng xinh đẹp, tự tin, luôn giữ được nụ cười tươi và có thật nhiều niềm vui bên gia đình, bạn bè.",
      "Chúc bạn có một ngày sinh nhật thật đáng nhớ và một tuổi mới thật nhiều điều tốt đẹp!"
    ],
    closing: "Chúc mừng sinh nhật!",
    signatureLabel: "Thân mến,",
    // P/S hiện dưới chữ ký. Để trống "" để ẩn.
    postscript: ""
  },

  /* ---------- 5. LỜI NHẮN NHỎ (có thể bỏ qua) ---------- */
  notes: {
    sectionTitle: "Vài lời nhắn nhỏ",
    sectionHint: "Mở nếu bạn muốn — không bắt buộc đâu.",
    openLabel: "Lời nhắn",
    items: [
      {
        title: "Chúc học tập thật tốt",
        body: "Chúc bạn luôn chăm chỉ, học tập tiến bộ và đạt được nhiều kết quả tốt. Mong những bài kiểm tra và kỳ thi sắp tới đều thuận lợi nhé!"
      },
      {
        title: "Luôn xinh đẹp và vui vẻ",
        body: "Chúc bạn ngày càng xinh đẹp, luôn tự tin và yêu đời. Mong mỗi ngày đều có thật nhiều niềm vui, tiếng cười và những điều khiến bạn hạnh phúc!"
      },
      {
        title: "Thật nhiều may mắn",
        body: "Chúc bạn luôn gặp nhiều may mắn, mọi việc đều suôn sẻ. Mong những dự định sắp tới đều đạt được kết quả tốt đẹp!"
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
    title: "Một lần nữa, chúc mừng sinh nhật bạn!",
    message: "Chúc bạn tuổi mới thật nhiều sức khỏe, niềm vui, may mắn và thành công. Mong rằng hôm nay sẽ là một ngày thật vui vẻ và đáng nhớ!",
    // Lời mời cuối — để trống "" để ẩn hoàn toàn.
    invite: "",
    signature: "— {sender}",
    replayButton: "Xem lại từ đầu",
    endButton: "Kết thúc"
  },

  /* ---------- Màn hình "đã kết thúc" (sau nút Kết thúc) ---------- */
  farewell: {
    title: "Hẹn một ngày thật đẹp nhé.",
    // Dòng nhỏ dưới chữ ký. Để trống "" để ẩn.
    sub: "Cảm ơn vì đã mở hết món quà.",
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
