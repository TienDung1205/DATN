# 07. Bảo mật, kiểm thử và triển khai

## Bảo mật ứng dụng

- Băm mật khẩu bằng thuật toán chuyên dụng như Argon2id; cấu hình chi phí được kiểm tra trên môi trường chạy. Không log mật khẩu, access token, refresh token hoặc secret.
- Access token thời hạn ngắn, refresh token xoay vòng, lưu hash và thu hồi theo phiên. Phát hiện reuse có thể thu hồi cả family phiên.
- Cookie refresh dùng `HttpOnly`, `Secure` trên HTTPS và `SameSite` phù hợp. Kiểm tra Origin/CSRF cho endpoint dùng cookie; CORS chỉ cho origin cấu hình.
- Guard kiểm tra role và quyền sở hữu cho mọi tài nguyên riêng tư. DTO whitelist field để tránh khách cập nhật role hoặc giá đơn.
- Dùng truy vấn có tham số; mọi raw query khóa hàng phải bind tham số. Escape/sanitize nội dung HTML và Markdown.
- Giới hạn upload theo dung lượng, loại file và chữ ký nội dung; tạo tên file phía server, không cho thực thi file upload.
- Rate limit đăng nhập, refresh, tra cứu và Chatbot; proxy và IP thực phải được cấu hình đúng trước khi dựa vào IP.
- Xác minh webhook theo nhà cung cấp; không lưu dữ liệu thẻ. Không gọi URL do mô hình tự sinh nếu chưa có allowlist.
- Tài khoản DB của ứng dụng dùng quyền tối thiểu; migration dùng tài khoản riêng khi triển khai.
- Cấu hình thời hạn lưu hội thoại, log và dữ liệu hành vi; giảm thiểu dữ liệu gửi ra dịch vụ AI. Không đưa hội thoại riêng vào báo cáo công khai.

## Logging và lỗi

Log JSON gồm timestamp, level, service, requestId/jobId, tên sự kiện, thời lượng và mã lỗi. Ghi log chuyển trạng thái đơn, thất bại webhook, retry job và lỗi nhà cung cấp; lọc dữ liệu cá nhân và secret trước khi ghi.

Lỗi nghiệp vụ trả mã ổn định và thông báo tiếng Việt dễ hiểu. Lỗi ngoài dự kiến được ghi phía server, trả thông báo chung kèm requestId. Mất DB thì request thất bại có kiểm soát; không trả thông báo đặt hàng thành công nếu transaction chưa commit.

Audit ghi ai, hành động gì, đối tượng nào, thay đổi nào và khi nào. Hạn chế quyền sửa/xóa audit. Theo dõi tỷ lệ lỗi, p95 API, số kết nối DB, job thất bại, đơn hết hạn và chi phí AI.

## Ma trận kiểm thử

| Lớp | Nội dung | Kết quả cần xác minh |
| --- | --- | --- |
| Unit | Giá, giảm giá, làm tròn, máy trạng thái, ngưỡng cảnh báo | Biên hợp lệ và không hợp lệ cho kết quả đúng |
| Integration với MySQL | Transaction đặt đơn, reservation, hạn mức mã giảm | Rollback đầy đủ, constraint và khóa hoạt động đúng |
| Đồng thời | Hai người đặt sách chỉ còn một bản | Một đơn giữ hàng thành công, đơn còn lại nhận xung đột; tồn không âm |
| Idempotency | Gửi lặp đặt hàng, webhook, nhập kho và job | Không tạo trùng đơn, trừ kho hoặc ghi nhận tiền |
| Race condition | Webhook thành công và job hết hạn cùng chạy | Trạng thái nhất quán; thanh toán muộn vào đối soát |
| Phân quyền | Đổi ID đơn, địa chỉ, phiên chat người khác | Không đọc hoặc sửa được dữ liệu |
| Catalog | Tạo/PATCH `publisherName` thiếu, null, rỗng, hợp lệ hoặc quá 255 ký tự | Tạo thiếu → null; PATCH thiếu → giữ nguyên; rỗng → null; quá dài → lỗi |
| Đánh giá sau mua | Chưa mua, đơn chưa giao/hủy, đơn đã giao, giả mạo user, gửi trùng đồng thời | Chỉ user có đơn chứa sách `DELIVERED` được gửi; tối đa một đánh giá/user/sách |
| Nội dung đánh giá | Sao 0, 6, số lẻ; nhận xét trắng/quá 2.000 ký tự; nội dung HTML | Từ chối input sai; hiển thị văn bản không thực thi script |
| Kiểm duyệt đánh giá | Tạo mới, duyệt, ẩn và xem điểm trung bình | Mới là `PENDING`; chỉ `APPROVED` công khai và được tính điểm; không sửa sao/nhận xét |
| Frontend | Form, loading, lỗi mạng, refresh token | Không submit lặp vô ý; thông báo rõ, không vòng lặp refresh |
| E2E | Đăng nhập → mua COD/sandbox → xử lý → giao | Dòng tiền, tồn, báo cáo khớp nghiệp vụ |
| Chatbot | FAQ, giá, đơn, injection, timeout | Không bịa dữ liệu, không vượt quyền, có fallback |
| Forecast | Trễ, tuần thiếu, split theo thời gian, horizon | Không rò rỉ tương lai; metrics tái lập được |
| Vận hành | Backup/restore, restart worker giữa job | Khôi phục được và xử lý lại không nhân đôi tác động |

Công cụ đề xuất: Jest/Supertest cho backend, Vitest/React Testing Library cho frontend, Playwright cho E2E và công cụ tải phù hợp. Test transaction chạy trên MySQL cùng phiên bản triển khai, không thay bằng SQLite.

### Bộ dữ liệu kiểm thử tối thiểu

Tạo user A/B, nhân viên và quản trị; sách hết hàng, sách còn một bản, sách nhiều tác giả, lô cũ/mới; mã hết hạn, hết lượt và giảm vượt subtotal; đơn COD, đơn đã thanh toán và đơn hết hạn. Dữ liệu forecast riêng có tuần bằng 0, tuần thiếu, stockout và xu hướng thay đổi. Seed phải tái lập và không chứa dữ liệu cá nhân thật.

## Cấu hình dự kiến

| Nhóm | Biến môi trường / cấu hình |
| --- | --- |
| Server | `NODE_ENV`, `PORT`, `WEB_ORIGIN`, `BUSINESS_TIMEZONE` |
| Database | `DATABASE_URL`, giới hạn pool, timeout transaction |
| Auth | Secret/key ký token, `ACCESS_TOKEN_TTL`, `REFRESH_TOKEN_TTL` |
| Orders | `PAYMENT_RESERVATION_MINUTES`, `COD_CONFIRMATION_MINUTES`, phí vận chuyển |
| Payments | Provider, URL sandbox, merchant ID, webhook secret, return URL |
| AI | `LLM_PROVIDER`, `LLM_MODEL`, `LLM_API_KEY`, timeout, quota token |
| Jobs | Batch size, lease duration, max attempts, retry delay |
| Forecast | Horizon, ngưỡng dữ liệu tối thiểu, lịch chạy, artifact path |
| Alerts | Cửa sổ bán chậm, số ngày tồn lâu, ngưỡng tồn thấp |
| Storage | Upload path/bucket, dung lượng tối đa, retention |

Tạo `.env.example` chỉ chứa placeholder khi khởi tạo code. Secret không commit vào Git. Mọi biến frontend được đóng gói là công khai: không đưa secret thanh toán, DB hoặc LLM vào biến `VITE_*`. Backend fail fast với thông báo cấu hình thiếu đã lọc nhạy cảm.

## Triển khai đề xuất

Docker Compose gồm reverse proxy phục vụ React build, API, worker và MySQL. Chỉ proxy mở cổng công khai; MySQL ở mạng nội bộ. Dùng volume bền vững cho DB, ảnh và artifact; API/worker cùng image nhưng entrypoint khác nhau.

Quy trình: lint → typecheck → test → build → backup nếu migration thay đổi dữ liệu → migration một lần → khởi động API/worker → smoke test. Không chạy migration tự động đồng thời từ mọi instance. `/health/live` kiểm tra tiến trình; `/health/ready` kiểm tra DB và phụ thuộc bắt buộc, không trả secret. LLM không sẵn sàng không nên làm cửa hàng mất readiness nếu chế độ fallback hoạt động.

Backup gồm MySQL, ảnh, artifact và cấu hình cần khôi phục được lưu an toàn. Thử restore vào môi trường riêng và kiểm tra số đơn/tồn trước nghiệm thu. Rollback ứng dụng chỉ an toàn khi schema tương thích; migration phá hủy cần kế hoạch phục hồi riêng.

## Checklist nghiệm thu

- Build, typecheck và các test trọng yếu đạt; lưu báo cáo môi trường, dữ liệu và tải kiểm thử.
- Không vượt tồn, vượt lượt khuyến mãi hoặc thanh toán hai lần trong test đồng thời.
- FE không có secret; API và Chatbot không lộ dữ liệu giữa người dùng.
- Dự báo có baseline, dataset version, cutoff, metrics và nguồn dữ liệu rõ.
- Demo chạy được sau khi khởi động lại; đã thử phục hồi backup.
