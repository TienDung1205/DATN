# 01. Phạm vi và yêu cầu

## Mục tiêu

1. Hoàn thiện quy trình tìm sách → giỏ hàng → đặt hàng → thanh toán → giao hàng.
2. Cung cấp công cụ quản lý danh mục, kho, đơn hàng và báo cáo kinh doanh.
3. Xây dựng Chatbot trả lời dựa trên dữ liệu hệ thống và chính sách được duyệt.
4. Thực nghiệm dự báo số lượng bán theo danh mục, so sánh với mô hình cơ sở và hiển thị kết quả có thể kiểm chứng.

## Vai trò

| Vai trò | Quyền chính |
| --- | --- |
| Khách | Xem, tìm kiếm sách; hỏi Chatbot về sản phẩm và chính sách công khai |
| Khách hàng | Quản lý tài khoản, địa chỉ, giỏ hàng, đơn của mình; đánh giá sách đã mua |
| Nhân viên | Xử lý đơn, nhập kho, quản lý sản phẩm và xem báo cáo theo quyền được cấp |
| Quản trị viên | Quản lý toàn bộ nghiệp vụ, tài khoản nhân viên, cấu hình và nhật ký |

Mọi quyền phải được kiểm tra ở backend. Đơn hàng, địa chỉ, hội thoại của khách hàng luôn bị giới hạn theo chủ sở hữu.

## Phạm vi MVP

| Nhóm | Chức năng | Tiêu chí nghiệm thu |
| --- | --- | --- |
| Tài khoản | Đăng ký, đăng nhập, đăng xuất, cập nhật hồ sơ, đổi mật khẩu | Kiểm tra dữ liệu đầu vào; email không trùng; mật khẩu được băm |
| Danh mục | CRUD sách, tác giả, nhà xuất bản, danh mục; ảnh bìa | Sách có SKU duy nhất, giá hợp lệ; ngừng bán được mà không mất lịch sử |
| Tìm kiếm | Từ khóa, danh mục, tác giả, khoảng giá, sắp xếp, phân trang | Bộ lọc kết hợp được; trạng thái rỗng và lỗi có thông báo |
| Giỏ hàng | Thêm, đổi số lượng, xóa sách | Số lượng nguyên dương; giá và tồn kho được xác thực lại lúc đặt hàng |
| Đơn hàng | Đặt hàng, xem lịch sử, hủy khi đủ điều kiện, xử lý giao hàng | Không đặt vượt tồn khả dụng; không chuyển trạng thái tùy ý |
| Thanh toán | COD và thanh toán sandbox | Webhook được xác minh, xử lý lặp không ghi nhận thanh toán hai lần |
| Khuyến mãi | Mã giảm theo số tiền hoặc phần trăm | Kiểm tra thời gian, hạn mức, tổng đơn tối thiểu và số lần sử dụng |
| Tồn kho | Nhập, điều chỉnh có lý do, giữ hàng, xuất hàng | Mỗi thay đổi có dấu vết; không âm tồn hoặc âm lượng giữ |
| Đánh giá | Chấm điểm và nhận xét sau mua | Xác minh đơn đã giao; một khách chỉ có một đánh giá cho một sách |
| Báo cáo | Doanh thu, số lượng bán, đơn, sách bán chạy/chậm | Chỉ số có định nghĩa thống nhất và lọc theo thời gian |
| Chatbot | Tìm sách, tư vấn, FAQ, tra cứu đơn của người đang đăng nhập | Dữ liệu sản phẩm lấy từ hệ thống; không lộ đơn người khác |
| Dự báo | Dự báo lượng bán danh mục cho các tuần tiếp theo | Có baseline, đánh giá theo thời gian và nguồn dữ liệu được công bố |
| Cảnh báo | Sắp hết hàng, tồn lâu, nhu cầu tăng | Giải thích được dữ liệu, ngưỡng và thời điểm tính |

## Ngoài MVP

Đa kho, nhiều nhà bán, ứng dụng di động riêng, tự động mua hàng từ nhà cung cấp, định giá tự động, cá nhân hóa bằng mô hình sâu và quy trình đổi trả một phần không thuộc phạm vi ban đầu. Hoàn tiền bất thường được quản trị viên theo dõi và đối soát; không giả định mọi cổng hỗ trợ hoàn tiền tự động.

## Quy tắc đơn hàng và kho

- Trạng thái đơn: `PENDING → CONFIRMED → PACKING → SHIPPING → DELIVERED`.
- `PENDING` hoặc `CONFIRMED` có thể chuyển sang `CANCELLED`; nhân viên phải xử lý ngoại lệ sau khi đóng gói bằng quy trình riêng, không sửa trực tiếp dữ liệu.
- Khi tạo đơn, tăng lượng giữ hàng trong giao dịch cơ sở dữ liệu. Tồn khả dụng = tồn vật lý − lượng đang giữ.
- Khi bắt đầu giao, giảm đồng thời tồn vật lý và lượng giữ; khi hủy trước giao, giải phóng lượng giữ.
- Đơn chờ thanh toán có hạn giữ hàng cấu hình được. Đơn COD chờ xác nhận có hạn xử lý riêng; tác vụ nền hủy đơn hết hạn theo cùng quy tắc giao dịch.
- Nếu thanh toán thành công đến sau khi đơn hết hạn/hủy, ghi nhận giao dịch để đối soát và chuyển sang xử lý hoàn tiền; không tự khôi phục đơn và không tự trừ kho.
- Trạng thái thanh toán tách biệt: `PENDING`, `PAID`, `FAILED`, `REFUND_PENDING`, `REFUNDED`. Thanh toán thất bại có thể tạo lần thanh toán mới khi đơn còn hiệu lực.
- Với COD, chỉ ghi nhận `PAID` khi có xác nhận thu tiền; thao tác giao thành công và thu tiền cần được kiểm soát, ghi nhật ký.

## Định nghĩa chỉ số

- Số lượng bán phục vụ dự báo: tổng số sách trong đơn `DELIVERED`, phân bổ theo ngày giao thành công.
- Doanh thu hàng hóa: giá trị dòng hàng sau giảm giá của đơn đã giao; không bao gồm phí vận chuyển. Báo cáo tiền thu thực tế theo giao dịch thanh toán là chỉ số riêng.
- MVP không có trả hàng một phần. Nếu bổ sung trả hàng, phải bổ sung bảng chi tiết và cập nhật định nghĩa doanh thu thuần, lượng bán ròng.
- Tuần nghiệp vụ bắt đầu thứ Hai theo múi giờ cửa hàng. Tuần hiện tại chưa kết thúc không được coi là tuần hoàn chỉnh khi huấn luyện.
- Sách bán chậm và tồn lâu được xác định bằng cửa sổ thời gian, lượng bán và tuổi lô còn tồn; không chỉ dựa trên ngày tạo sách.

## Yêu cầu phi chức năng đề xuất

Mục tiêu thử nghiệm ban đầu: API đọc phổ biến có p95 dưới 500 ms ở 50 người dùng đồng thời trên môi trường được công bố; không tính độ trễ nhà cung cấp AI/thanh toán. Đây là mục tiêu cần đo, chưa phải kết quả đạt được. Chatbot có timeout và câu trả lời dự phòng; lỗi dịch vụ AI không làm gián đoạn đặt hàng.
