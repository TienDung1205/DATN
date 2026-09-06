# 08. Kế hoạch thực hiện và bảo vệ

## Lộ trình tham khảo 12 tuần

Lịch cần điều chỉnh theo số thành viên và thời hạn nhà trường. Thu thập dữ liệu và kiểm chứng khả năng dự báo phải bắt đầu sớm, không chờ hoàn tất website.

| Tuần | Công việc | Đầu ra / điều kiện hoàn tất |
| --- | --- | --- |
| 1 | Chốt yêu cầu, vai trò, phạm vi và nguồn dữ liệu | Đề cương, use case, danh sách dữ liệu có thể sử dụng |
| 2 | ERD, hợp đồng API, wireframe, thử pipeline forecast tối thiểu | Schema review, OpenAPI nháp, baseline thử trên mẫu |
| 3 | Khởi tạo FE/BE, migration, auth và phân quyền | Đăng nhập, seed và kiểm thử quyền cơ bản |
| 4 | Catalog, tìm kiếm, ảnh và quản trị sản phẩm | Luồng xem/tạo/sửa/ngừng bán sách |
| 5 | Giỏ, tính tiền, khuyến mãi, giữ hàng và đơn COD | Test đồng thời không vượt tồn/hạn mức |
| 6 | Thanh toán sandbox, webhook, trạng thái, nhập/xuất kho | Test retry, webhook lặp và hết hạn đơn |
| 7 | Báo cáo, tổng hợp dữ liệu, kiểm tra chất lượng dataset | Dashboard khớp truy vấn kiểm chứng |
| 8 | Chatbot catalog/FAQ và tra đơn | Bộ câu hỏi đánh giá, kiểm thử truy cập chéo |
| 9 | Đặc trưng, ridge regression, rolling validation | So sánh baseline, khóa cấu hình trước test cuối |
| 10 | Công bố forecast, cảnh báo, giải thích trên UI | Biểu đồ có nguồn, kỳ, mô hình và metrics |
| 11 | E2E, tải, bảo mật, sửa lỗi, triển khai | Báo cáo test, backup/restore và demo ổn định |
| 12 | Hoàn thiện luận văn, slide, video và diễn tập | Kịch bản tái lập, giới hạn và hướng phát triển |

## Phân công theo nhóm công việc

| Nhóm việc | Trách nhiệm | Phụ thuộc |
| --- | --- | --- |
| Backend/nghiệp vụ | Auth, catalog, đơn, thanh toán, kho và API | ERD và hợp đồng API |
| Frontend | Cửa hàng, quản trị, Chatbot UI, dashboard | Hợp đồng API; có thể dùng mock đúng schema |
| Dữ liệu/AI | Dataset, Chatbot tools, forecast, metrics | Catalog và định nghĩa chỉ số |
| Tích hợp/QA | E2E, CI, triển khai, tài liệu demo | Các thành viên cùng phụ trách theo mốc |

Một người có thể đảm nhiệm nhiều nhóm việc. Mỗi thay đổi giao diện API hoặc schema cần trao đổi với người phụ trách phần liên quan. Review tập trung vào nghiệp vụ, input/output, lỗi và khả năng kiểm thử; không cần comment lặp lại tên hàm.

## Thứ tự ưu tiên

P0: luồng mua hàng, tính nhất quán kho/thanh toán, phân quyền, nguồn dữ liệu, baseline và thực nghiệm học máy, Chatbot có căn cứ. P1: UX quản trị, cảnh báo nâng cao, tối ưu tìm kiếm. P2: streaming, embeddings, forecast SKU và cá nhân hóa sâu.

Nếu thiếu dữ liệu, giảm độ chi tiết dự báo hoặc phạm vi đánh giá; vẫn giữ thực nghiệm baseline so với mô hình học máy và công bố giới hạn. Nếu dịch vụ AI không khả dụng lúc demo, dùng fallback được gắn nhãn; không trình bày câu trả lời giả lập như phản hồi AI trực tiếp.

## Kịch bản demo

1. Quản trị tạo sách, nhập lô và kiểm tra tồn khả dụng.
2. Khách tìm sách, hỏi Chatbot theo chủ đề/ngân sách; mở sản phẩm từ kết quả có nguồn.
3. Khách đặt hàng và thanh toán sandbox; frontend đọc trạng thái backend.
4. Gửi lại webhook để chứng minh hệ thống không ghi nhận tiền hai lần.
5. Nhân viên xác nhận, đóng gói, giao và hoàn tất đơn; xem movement và báo cáo.
6. Khách hỏi tình trạng đơn của mình; kiểm thử hỏi đơn tài khoản khác không trả dữ liệu.
7. Mở dashboard trên dataset lịch sử đã chuẩn bị, giải thích train/test, baseline, mô hình và sai số.
8. Xem cảnh báo tồn lâu/sắp hết và đề xuất ở cấp danh mục; người quản trị quyết định nhập hàng.

Dữ liệu lịch sử để trình diễn forecast tách khỏi vài đơn mới tạo trong demo. Thêm một đơn không đồng nghĩa mô hình được huấn luyện lại ngay; UI hiển thị cutoff và thời điểm chạy gần nhất.

## Hồ sơ bàn giao

- Mã nguồn có hướng dẫn cài đặt, cấu hình mẫu, migration và seed tái lập.
- Sơ đồ use case, ERD, kiến trúc, luồng đặt hàng và tài liệu OpenAPI.
- Báo cáo kiểm thử chức năng, đồng thời, bảo mật và vận hành.
- Dataset hoặc hướng dẫn truy cập hợp lệ; quy trình làm sạch, phiên bản và nhãn nguồn.
- Script huấn luyện/đánh giá, artifact, kết quả baseline/mô hình và phân tích lỗi.
- Tài liệu triển khai, backup/restore, tài khoản demo không dùng mật khẩu thật.
- Luận văn, slide và kịch bản demo có mục hạn chế, hướng phát triển.

## Những quyết định cần chốt trước khi lập trình

Số thành viên và thời hạn; dữ liệu thực tế có thể tiếp cận; cổng thanh toán sandbox; ngân sách/dịch vụ LLM; máy chủ triển khai; quy tắc phí giao hàng; thời hạn giữ hàng; phạm vi hoàn tiền. Các quyết định được ghi lại trong tài liệu tương ứng để FE, BE và phần dữ liệu triển khai thống nhất.
