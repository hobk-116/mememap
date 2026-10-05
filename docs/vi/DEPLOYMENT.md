# Triển khai công khai qua Cloudflare Tunnel

[English](../en/DEPLOYMENT.md) · **Tiếng Việt** · [Mục lục](README.md)

## Quyết định hosting hiện tại

Chủ dự án đã chọn Cloudflare Tunnel để chia sẻ prototype công khai từ PC hoặc VPS. Người dùng truy cập HTTPS; tunnel kết nối đến ứng dụng tại máy qua HTTP. Dùng origin localhost như `http://127.0.0.1:8000`.

Với shell POSIX, khởi động ứng dụng bằng:

```sh
MEMEMAP_HOST=127.0.0.1 MEMEMAP_PORT=8000 MEMEMAP_SECURE_COOKIE=1 python3 server.py
```

Đặt cùng các biến môi trường trong service hoặc shell dùng trên máy host. Các thiết lập này cho ứng dụng lắng nghe tại localhost và thêm `Secure` cho cookie phiên; bản thân chúng không tạo tunnel hoặc cấu hình HTTPS. Dùng địa chỉ HTTPS công khai khi sử dụng định vị trên trình duyệt.

## Tunnel và tên miền

Cloudflare Tunnel chuyển tiếp tên miền đã chọn đến origin localhost. Cả ứng dụng và chương trình tunnel phải tiếp tục chạy. URL tạm/quick tunnel có thể đổi khi tạo lại; với tên miền ổn định, cấu hình tunnel có tên và DNS theo hướng dẫn hiện hành của nhà cung cấp.

Tài liệu này ghi quyết định hosting và thiết lập ứng dụng. Nó không xác nhận tên miền, tunnel, firewall hoặc VPS đã được cấu hình.

## Giới hạn bảo mật hiện tại

Máy chủ tích hợp của ứng dụng là bản thử nghiệm, chưa cung cấp reverse proxy cho production, xử lý HTTPS, giới hạn tần suất chung cho đăng nhập/API, token CSRF riêng, khôi phục tài khoản hoặc cấu hình triển khai đã được gia cố. Riêng việc gửi báo cáo meme có giới hạn tần suất theo [hướng dẫn kiểm duyệt](RUNNING.md#bảng-kiểm-duyệt). Cookie phiên có `HttpOnly` và `SameSite=Lax`, mặc định không có `Secure` để chạy HTTP tại máy; đặt `MEMEMAP_SECURE_COOKIE=1` khi phục vụ qua HTTPS. Tunnel mở truy cập từ ngoài LAN; chỉ mở sau khi xem xét quyền truy cập và bảo mật triển khai. Khi triển khai HTTPS, xem lại cấu hình proxy và bật cookie an toàn trước khi coi dịch vụ sẵn sàng cho production.

Trước khi mở công khai, cũng cần hoàn thành [sao lưu và thử khôi phục database/ảnh nhất quán](BACKUP.md), giới hạn phù hợp ở ứng dụng và kiểm tra thiết bị theo [hướng dẫn kiểm tra](TESTING.md). Các dấu hiệu kiểm duyệt và giới hạn riêng của báo cáo hiện tại nằm trong [vận hành tại máy](RUNNING.md#bảng-kiểm-duyệt).

## Dịch vụ bản đồ

Trang bản đồ tải Leaflet từ CDN và các tile ảnh raster tiêu chuẩn từ dịch vụ tile công khai của OpenStreetMap. Ứng dụng không tải hàng loạt để lưu cục bộ hoặc tự phục vụ tile. Giữ phần ghi nguồn hiển thị và tuân thủ chính sách sử dụng hiện hành; khi chạy production hoặc có lưu lượng lớn, chọn nhà cung cấp phù hợp về điều khoản và khả năng phục vụ. Không dùng endpoint tile công khai để tải tile hàng loạt.

Ứng dụng chỉ yêu cầu vị trí khi người dùng bật nút định vị; trình duyệt sẽ hỏi quyền. Ứng dụng không theo dõi vị trí liên tục. Ngoài ra, tọa độ ghim được chọn bằng tương tác trên bản đồ. Tra cứu vị trí ghim hiện không dùng dịch vụ geocoding.
