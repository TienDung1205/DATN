# Website bán sách tích hợp Chatbot và AI phân tích, dự báo nhu cầu

## Giới thiệu

Dự án đồ án tốt nghiệp xây dựng website thương mại điện tử chuyên kinh doanh sách, tích hợp Chatbot hỗ trợ khách hàng và chức năng phân tích, dự báo phục vụ quản trị kinh doanh.

Stack được lựa chọn: **Node.js + TypeScript** cho backend, **MySQL** cho cơ sở dữ liệu và **React + TypeScript** cho frontend. Các thư viện và dịch vụ bên ngoài trong tài liệu là phương án thiết kế đề xuất, chưa phải thành phần đã được cài đặt.

## Bộ tài liệu

| Tài liệu | Nội dung |
| --- | --- |
| [01 - Phạm vi và yêu cầu](docs/01-pham-vi-va-yeu-cau.md) | Vai trò, nghiệp vụ, MVP và tiêu chí nghiệm thu |
| [02 - Kiến trúc hệ thống](docs/02-kien-truc-he-thong.md) | Thành phần, module, luồng xử lý và cấu trúc mã nguồn |
| [03 - Thiết kế cơ sở dữ liệu](docs/03-co-so-du-lieu.md) | Bảng, quan hệ, ràng buộc, chỉ mục và giao dịch |
| [04 - Thiết kế API](docs/04-thiet-ke-api.md) | Quy ước API, endpoint, phân quyền và xử lý lỗi |
| [05 - Thiết kế frontend](docs/05-frontend.md) | Trang, tổ chức React, quản lý trạng thái và trải nghiệm |
| [06 - Chatbot và dự báo](docs/06-chatbot-va-du-bao.md) | Công cụ Chatbot, pipeline dữ liệu, mô hình và đánh giá |
| [07 - Bảo mật, kiểm thử và triển khai](docs/07-bao-mat-kiem-thu-trien-khai.md) | Bảo vệ dữ liệu, test, cấu hình và vận hành |
| [08 - Kế hoạch thực hiện](docs/08-ke-hoach-thuc-hien.md) | Mốc triển khai, phân công và kịch bản bảo vệ |

## Giả định thiết kế

- Một cửa hàng, một kho, tiền tệ VND và múi giờ nghiệp vụ `Asia/Ho_Chi_Minh`.
- Một bản ghi sách tương ứng một ấn bản/SKU; các định dạng hoặc ấn bản khác nhau được quản lý riêng.
- Người dùng đăng nhập để đặt hàng. Khách chưa đăng nhập có thể xem sách và sử dụng Chatbot tư vấn công khai.
- MVP hỗ trợ COD và một cổng thanh toán ở môi trường sandbox, được chọn khi triển khai.
- Dự báo ban đầu ở cấp danh mục theo tuần; cấp từng sách là phần mở rộng nếu đủ dữ liệu.
- Không mặc định có dữ liệu giao dịch thực tế. Dữ liệu mô phỏng phải được gắn nhãn và công bố giới hạn đánh giá.
- Bộ tài liệu mô tả thiết kế dự kiến; chưa có ứng dụng, migration, mô hình đã huấn luyện hoặc hệ thống đã triển khai.

## Cách sử dụng

Đọc tài liệu theo thứ tự 01–08. Trước khi lập trình, nhóm cần chốt phạm vi với giảng viên, nguồn dữ liệu, cổng thanh toán và nhà cung cấp mô hình ngôn ngữ. Những lựa chọn này không làm thay đổi stack cốt lõi.

Các ngưỡng cảnh báo, thời hạn giữ hàng, tỷ lệ chia dữ liệu và số tuần dự báo cần đặt trong cấu hình; giá trị trong ví dụ là giả định phục vụ thiết kế.
