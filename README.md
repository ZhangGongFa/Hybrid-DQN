# Hybrid DQN Research Lab

Phiên bản 02 - Phân bổ vốn, danh mục và phân tích liên thị trường.

## Mở website

Mở index.html hoặc tệp HTML độc lập bằng trình duyệt. Không cần cài đặt, không cần Internet để chạy bản tải về.

## Luồng sử dụng

1. Mở Phân bổ vốn, chọn Việt Nam hoặc Hoa Kỳ.
2. Nhập vốn, kỳ hạn, hồ sơ, số cổ phiếu, giới hạn mỗi mã và tỷ lệ tiền mặt.
3. Có thể loại trừ mã trong Tùy chỉnh tập cổ phiếu.
4. Bấm Phân tích & phân bổ. Kết quả gồm danh sách đầy đủ các mã, tỷ trọng, số tiền, dự phòng và phí.
5. Tìm kiếm theo mã/tên/ngành; nhấn mã để mở chỉ số tích lũy, RSI và thông tin vị thế. Xuất CSV để lưu phương án.
6. Danh mục & hiệu quả: NAV, benchmark, AUM/NAV đơn vị, YTD, HHI, turnover, attribution, lợi nhuận năm, đầy đủ vị thế và nhật ký. Ctrl + cuộn để zoom, kéo ngang khi đã zoom để pan; nhấp đúp đặt lại.
7. Phân tích thị trường: RSI/MACD, rolling volatility/Sharpe, phân phối lợi nhuận, heatmap, hành động, sự kiện, tâm lý định lượng, độ rộng và tín hiệu từng mã.
8. So sánh thị trường: chọn kết quả công bố hoặc diễn biến danh mục chuẩn hóa của hai thị trường.
9. Nút EN/VI đổi các nhãn giao diện; nội dung học thuật chuyên sâu có thể giữ tiếng Việt. Theme và trình chiếu ở góc trên; Esc thoát trình chiếu.

## Dữ liệu và cách hiểu

Bảng kết quả nghiên cứu trích từ tài liệu đã cung cấp, không thay đổi theo đầu vào phân bổ. Các màn hình tương tác sử dụng dữ liệu tổng hợp, không phải giá lịch sử, bảng giá trực tiếp hay kết quả suy luận từ checkpoint D3QN thật. Nguồn, quy tắc và giới hạn được trình bày trong Phương pháp & nguồn dữ liệu. Không phát sinh lệnh giao dịch.

Bộ phân bổ tính toán thực trên chuỗi nghiên cứu: tổng ngân sách theo mã + tiền mặt + phí phải khớp vốn; trọng số không âm, có giới hạn; tín hiệu chọn mã không dùng dữ liệu sau ngày phân bổ. Phí, quy tắc tiền mặt và làm tròn được giải thích trong ứng dụng.

Nguồn tin tức, giá/khối lượng trực tiếp và dòng tiền chưa kết nối; website không tạo số bài báo hoặc giao dịch cho các nguồn thiếu.

## Mã nguồn

- app-core.js: cấu trúc ứng dụng và các màn hình gốc được nâng cấp
- app-v2.js: phân bổ vốn, mã cổ phiếu, phân tích, so sánh và tương tác
- engine.js: chuỗi nghiên cứu và bộ phân bổ chiến lược cơ sở
- engine-v2.js: kế hoạch vốn, giới hạn trọng số, chỉ báo và attribution
- styles.css và styles-v2.css: giao diện và responsive
- template.html: khung HTML
- build.py: ghép các tệp thành dist/index.html và sinh app.js
- verify.cjs, verify-v2.cjs: kiểm tra logic

Chạy build.py với Python; chạy hai tệp verify bằng Node.js. Các thư viện ngoài không cần thiết cho bản phát hành.
