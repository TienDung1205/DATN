# 04. Thiết kế REST API

## Quy ước

Base path `/api/v1`. JSON dùng `camelCase`; ID và tiền là chuỗi; timestamp theo ISO 8601 UTC. Endpoint danh sách nhận `page`, `limit` với mức trần cấu hình, whitelist bộ lọc và cột sắp xếp.

```json
{
  "data": [{ "id": "101", "title": "Sách minh họa", "price": "120000" }],
  "meta": { "page": 1, "limit": 20, "total": 1 }
}
```

```json
{
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Số lượng sách còn lại không đủ.",
    "details": [{ "bookId": "101", "available": 2 }],
    "requestId": "req-example"
  }
}
```

Mã HTTP: `200` đọc/cập nhật, `201` tạo, `202` nhận job, `204` xóa thành công, `400` input không hợp lệ, `401` chưa xác thực, `403` thiếu quyền, `404` không tìm thấy hoặc tài nguyên không thuộc người dùng, `409` xung đột nghiệp vụ, `429` vượt giới hạn, `500` lỗi nội bộ. Không trả stack trace hay thông tin SQL.

## Endpoint dự kiến

| Method | Path | Input / Output chính | Quyền |
| --- | --- | --- | --- |
| POST | `/auth/register` | Email, mật khẩu, tên → hồ sơ công khai | Khách |
| POST | `/auth/login` | Email, mật khẩu → access token và cookie phiên | Khách |
| POST | `/auth/refresh` | Cookie phiên → access token mới | Phiên hợp lệ |
| POST | `/auth/logout` | Thu hồi phiên, xóa cookie | Phiên hợp lệ |
| GET/PATCH | `/users/me` | Đọc/cập nhật tên, điện thoại; không nhận role | Khách hàng |
| POST | `/users/me/change-password` | Mật khẩu cũ/mới → thu hồi các phiên theo chính sách | Khách hàng |
| GET/POST | `/users/me/addresses` | Danh sách / tạo địa chỉ | Chủ tài khoản |
| PATCH/DELETE | `/users/me/addresses/:id` | Sửa / xóa địa chỉ | Chủ sở hữu |
| GET | `/books` | `q`, `categoryId`, `authorId`, `minPrice`, `maxPrice`, `sort` → danh sách | Công khai |
| GET | `/books/:id` | Chi tiết, ảnh, tác giả, tồn khả dụng | Công khai |
| GET | `/categories`, `/authors`, `/publishers` | Danh sách tham chiếu | Công khai |
| GET | `/cart` | Các dòng giỏ và giá tham khảo hiện tại | Khách hàng |
| POST | `/cart/items` | `bookId`, `quantity` → giỏ cập nhật | Khách hàng |
| PATCH/DELETE | `/cart/items/:bookId` | Số lượng mới / xóa | Chủ giỏ |
| POST | `/promotions/validate` | Mã và dòng hàng → giảm giá dự kiến, chưa giữ suất | Khách hàng |
| POST | `/orders` | Địa chỉ, dòng hàng, mã giảm, phương thức → đơn đã giữ hàng | Khách hàng |
| GET | `/orders`, `/orders/:id` | Lịch sử / chi tiết đơn của mình | Chủ đơn |
| POST | `/orders/:id/cancel` | Lý do → trạng thái mới | Chủ đơn, đúng điều kiện |
| POST | `/orders/:id/payment-attempts` | Tạo/thử lại thanh toán khi đơn còn hạn → URL sandbox | Chủ đơn |
| POST | `/payments/webhooks/:provider` | Payload, chữ ký → xác nhận theo giao thức cổng | Xác minh nhà cung cấp |
| GET/POST | `/books/:id/reviews` | Xem / tạo đánh giá | Công khai / người đã mua |
| POST | `/chat/sessions` | Tạo phiên → ID và credential phiên khách nếu cần | Khách hoặc khách hàng |
| POST | `/chat/sessions/:id/messages` | `message`, `clientMessageId` → trả lời và nguồn | Chủ phiên |
| GET | `/chat/sessions/:id/messages` | Lịch sử phân trang | Chủ phiên |
| POST/PATCH | `/admin/books`, `/admin/books/:id` | Tạo / cập nhật sách | Nhân viên, quản trị |
| POST/PATCH | `/admin/categories`, `/admin/categories/:id` | Tạo / cập nhật hoặc ngừng hoạt động | Nhân viên, quản trị |
| POST/PATCH | `/admin/authors`, `/admin/authors/:id` | Tạo / cập nhật tác giả | Nhân viên, quản trị |
| POST/PATCH | `/admin/publishers`, `/admin/publishers/:id` | Tạo / cập nhật NXB | Nhân viên, quản trị |
| POST | `/admin/uploads` | Ảnh multipart đã kiểm tra → URL/metadata | Nhân viên, quản trị |
| GET | `/admin/orders`, `/admin/orders/:id` | Danh sách / chi tiết phục vụ xử lý | Nhân viên, quản trị |
| PATCH | `/admin/orders/:id/status` | Trạng thái và lý do → đơn mới | Nhân viên, quản trị |
| POST | `/admin/orders/:id/cod-collection` | Xác nhận thu tiền có khóa chống lặp | Nhân viên, quản trị |
| GET | `/admin/inventory`, `/admin/inventory/movements` | Tồn và lịch sử | Nhân viên, quản trị |
| POST | `/admin/inventory/receipts` | Sách, số lượng, ngày nhập → lô và tồn | Nhân viên, quản trị |
| POST | `/admin/inventory/adjustments` | Chênh lệch, lô, lý do → tồn mới | Nhân viên, quản trị |
| GET/POST | `/admin/promotions` | Xem / tạo mã | Nhân viên, quản trị |
| PATCH | `/admin/promotions/:id` | Cập nhật hợp lệ hoặc tắt mã | Nhân viên, quản trị |
| GET/PATCH | `/admin/reviews`, `/admin/reviews/:id` | Danh sách / kiểm duyệt | Nhân viên, quản trị |
| GET | `/admin/analytics/sales` | `from`, `to`, `groupBy` → chỉ số đã định nghĩa | Nhân viên, quản trị |
| GET | `/admin/forecasts` | `categoryId`, `runId` tùy chọn → kết quả đã công bố | Nhân viên, quản trị |
| POST | `/admin/forecasts/runs` | Cấu hình cho phép → `jobId`, `runId` | Quản trị |
| GET | `/admin/jobs/:id` | Trạng thái và lỗi đã lọc | Quản trị |
| GET/PATCH | `/admin/alerts`, `/admin/alerts/:id` | Danh sách / xác nhận đã xử lý | Nhân viên, quản trị |
| GET/POST/PATCH | `/admin/knowledge-documents[/:id]` | Đọc / tạo / cập nhật, duyệt tri thức | Quản trị |
| GET/PATCH | `/admin/users`, `/admin/users/:id` | Danh sách / vai trò, khóa tài khoản | Quản trị |
| GET | `/admin/audit-logs` | Nhật ký phân trang | Quản trị |

Ký hiệu endpoint gộp trong bảng phải được tách thành operation riêng khi tạo OpenAPI. API cập nhật catalog dùng `status` để ngừng bán, không xóa lịch sử.

## Ví dụ đặt hàng

```http
POST /api/v1/orders
Authorization: Bearer <access-token>
Idempotency-Key: checkout-example-001
Content-Type: application/json
```

```json
{
  "addressId": "12",
  "items": [{ "bookId": "101", "quantity": 2 }],
  "promotionCode": null,
  "paymentMethod": "COD"
}
```

Output `201`: `data.id`, `data.orderCode`, `data.status`, `data.paymentStatus`, `data.grandTotal`, `data.items`. Backend kiểm tra địa chỉ thuộc người gọi, tính giá, phí và tồn từ dữ liệu đáng tin cậy. Các endpoint nhập kho, điều chỉnh, ghi nhận COD và tạo lần thanh toán cũng cần operation key/idempotency phù hợp.

## Hợp đồng Chatbot

Input chỉ nhận nội dung và ID chống gửi lặp; không nhận `userId`, role, SQL hoặc tên công cụ để thực thi trực tiếp. Output gồm `answer`, `sources`, `suggestedBooks` và `fallbackUsed`. Giá/tồn trong thẻ sách phải lấy từ API, còn phần văn bản của mô hình chỉ có giá trị hỗ trợ tư vấn.

## Webhook

Giữ raw body nếu cơ chế chữ ký yêu cầu. Chỉ đánh dấu event xử lý xong sau khi transaction nghiệp vụ commit; event đang lỗi phải có thể retry. Chống lặp cả event ID và mã giao dịch để nhiều event cho cùng thanh toán không ghi nhận tiền hai lần. Trang redirect thành công phía frontend không phải bằng chứng thanh toán.
