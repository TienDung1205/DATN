# 05. Frontend React TypeScript

## Bố cục và trang

| Khu vực | Route đề xuất | Nội dung |
| --- | --- | --- |
| Cửa hàng | `/`, `/books`, `/books/:slug` | Trang chủ, tìm kiếm, bộ lọc và chi tiết sách |
| Tài khoản | `/login`, `/register`, `/account`, `/account/addresses` | Xác thực, hồ sơ và địa chỉ |
| Mua hàng | `/cart`, `/checkout`, `/orders`, `/orders/:id` | Giỏ, xác nhận giá, đặt hàng và theo dõi |
| Kết quả thanh toán | `/payment/result` | Đọc trạng thái từ backend; hiển thị đang xác minh khi cần |
| Quản trị | `/admin`, `/admin/books`, `/admin/categories`, `/admin/authors` | Dashboard và catalog |
| Vận hành | `/admin/orders`, `/admin/inventory`, `/admin/promotions`, `/admin/reviews` | Đơn, kho, khuyến mãi, kiểm duyệt |
| Phân tích | `/admin/analytics`, `/admin/forecasts`, `/admin/alerts` | Báo cáo, thực tế/dự báo, cảnh báo |
| Cấu hình | `/admin/users`, `/admin/knowledge`, `/admin/audit-logs` | Tài khoản, tri thức Chatbot, nhật ký |

Route chi tiết theo slug cần API hỗ trợ tra slug, ví dụ bổ sung `GET /books/by-slug/:slug`; các hành động giỏ/đơn vẫn sử dụng ID trả về. Chatbot là widget trong layout cửa hàng và có màn hình mở rộng trên thiết bị nhỏ.

## Tổ chức theo tính năng

```text
src/
├── app/                  # Router, providers, layout
├── features/
│   ├── auth/
│   ├── catalog/
│   ├── cart/
│   ├── checkout/
│   ├── orders/
│   ├── chatbot/
│   └── admin/
├── components/           # Button, dialog, table, trạng thái dùng chung
├── lib/                  # HTTP client, định dạng tiền/ngày, cấu hình
└── types/                # Kiểu giao diện; hợp đồng API dùng nguồn chung
```

Mỗi feature có `api`, `components`, `hooks`, `schemas` khi cần. Không tạo abstraction nếu chưa có nhu cầu tái sử dụng rõ ràng.

## Quản lý trạng thái

- TanStack Query quản lý sách, giỏ server, đơn và báo cáo. Sau mutation, invalidation đúng query bị ảnh hưởng.
- Form giữ bằng React Hook Form; schema kiểm tra để phản hồi sớm, backend vẫn là nơi xác thực cuối.
- Filter, sort, page đưa vào URL để tải lại hoặc chia sẻ liên kết giữ nguyên trạng thái.
- State giao diện như mở modal, tab và draft câu hỏi dùng local state; chỉ bổ sung global store nếu thật sự dùng chung nhiều nơi.
- Access token giữ trong bộ nhớ; refresh cookie `HttpOnly` do backend đặt. Không lưu refresh token ở localStorage.
- HTTP client chỉ cho một luồng refresh chạy khi nhiều request cùng hết hạn; refresh thất bại thì kết thúc phiên, tránh vòng lặp retry.

## Trải nghiệm mua hàng

Giao diện có loading, empty, error và retry cho từng màn hình. Checkout hiển thị giá, giảm giá, phí giao và tổng cuối cùng; nếu backend báo giá/tồn thay đổi, người dùng xem lại trước khi xác nhận. Nút đặt hàng bị khóa trong lúc gửi nhưng idempotency phía server vẫn cần thiết.

Mỗi lần checkout logic giữ một idempotency key để retry lỗi mạng. Nếu người dùng đổi giỏ hoặc địa chỉ và gửi một yêu cầu mới thì tạo key mới. Khi chưa biết request cũ thành công hay chưa, tra kết quả hoặc gửi lại cùng key trước khi tạo đơn khác.

Ảnh có alt text, input có label, lỗi gắn với field, dialog điều khiển được bằng bàn phím, trạng thái không chỉ phân biệt bằng màu. Trang responsive cho điện thoại và máy tính.

## Nhà xuất bản và đánh giá sách

- Form tạo/sửa sách có ô tên nhà xuất bản `publisherName` không bắt buộc, tối đa 255 ký tự. Trang chi tiết chỉ hiển thị khi có giá trị; không có trang quản lý nhà xuất bản riêng.
- Trang chi tiết sách hiển thị điểm trung bình, số lượt và nhận xét đã duyệt, có phân trang. Chưa có lượt thì hiển thị “Chưa có đánh giá”.
- Người chưa đăng nhập thấy hướng dẫn đăng nhập. Người đăng nhập dùng `/books/:id/review-eligibility` để biết có thể đánh giá hoặc đã có đánh giá hay chưa.
- Khi đủ điều kiện đã mua và đơn `DELIVERED`, hiển thị form chọn 1–5 sao và nhập nhận xét bắt buộc, tối đa 2.000 ký tự; bộ chọn sao có label và dùng được bằng bàn phím.
- Gửi thành công hiển thị “Đánh giá đang chờ duyệt”, làm mới eligibility và khóa tạo thêm đánh giá cho sách đó. Hiển thị rõ lỗi chưa đủ điều kiện hoặc đã đánh giá từ backend.
- Nhận xét render dưới dạng văn bản an toàn. Màn hình quản trị đánh giá cho phép duyệt/ẩn, không sửa sao và nội dung của khách. Chưa có tính năng trả lời bình luận trong MVP.

## Dashboard và dự báo

- Hiển thị khoảng thời gian, múi giờ, định nghĩa doanh thu và thời điểm cập nhật.
- Biểu đồ thực tế và dự báo dùng kiểu nét khác nhau, đánh dấu ranh giới dữ liệu đã quan sát.
- Ghi mô hình, phiên bản, kỳ dự báo, MAE/WAPE và nguồn dữ liệu thật hay mô phỏng.
- Khoảng dự báo chỉ hiển thị nếu backend đã tính và đánh giá; không tự sinh phần trăm tin cậy trên frontend.
- Thiếu dữ liệu phải hiển thị rõ, không trình bày như nhu cầu bằng 0.
- Cảnh báo gồm đối tượng, lý do, dữ liệu/ngưỡng và thời điểm phát hiện. Gợi ý nhập hàng cần người quản trị xem xét.

## Chatbot

Thẻ gợi ý gồm tên, giá, tình trạng và liên kết chi tiết. Câu trả lời FAQ có nguồn chính sách. Yêu cầu tra đơn khi chưa đăng nhập dẫn người dùng tới đăng nhập; không hỏi người dùng cung cấp mật khẩu hoặc mã OTP trong hội thoại.

MVP dùng request/response có timeout. Streaming là mở rộng. Nội dung trả lời được render dưới dạng văn bản hoặc Markdown đã sanitize, không render HTML thô từ mô hình.
