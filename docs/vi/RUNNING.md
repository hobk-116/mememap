# Vận hành tại máy

[English](../en/RUNNING.md) · **Tiếng Việt** · [Mục lục](README.md)

Để truy cập công khai, dùng [triển khai qua Cloudflare Tunnel](DEPLOYMENT.md). Bảo vệ dữ liệu và lệnh kiểm tra nằm trong [sao lưu](BACKUP.md) và [kiểm tra](TESTING.md).

## Yêu cầu

- Python 3.10 trở lên.
- Lệnh `cwebp` có trong `PATH` để chuyển ảnh JPEG/PNG tải lên thành WebP, bao gồm ảnh gửi bằng phương án dự phòng cho Safari. Trên macOS có Homebrew: `brew install webp`.

Ứng dụng không có file khai báo trình quản lý gói hoặc thư viện Python bên thứ ba. Trình duyệt tải Leaflet và tile bản đồ từ dịch vụ ngoài, nên phải truy cập được các dịch vụ đó để hiển thị bản đồ.

## Khởi động và dừng

Từ thư mục repo:

```sh
python3 server.py
```

Mở `http://localhost:8000`. Dừng máy chủ bằng `Ctrl+C` trong terminal đang chạy nó.

Khởi động lại khi thay đổi `server.py` hoặc `mememap/`, bao gồm danh sách tài nguyên được phép phục vụ. HTML/CSS/JavaScript được đọc từ file trên ổ đĩa nên thông thường chỉ cần tải lại trình duyệt. Các tài nguyên giao diện phải được phục vụ qua máy chủ này; mở HTML trực tiếp từ ổ đĩa hoặc dùng máy chủ xem trước file tĩnh sẽ không cung cấp đăng nhập và API.

Địa chỉ lắng nghe mặc định là `0.0.0.0`, cổng mặc định là `8000`. Thay đổi cho một lần chạy:

```sh
MEMEMAP_HOST=127.0.0.1 MEMEMAP_PORT=8000 python3 server.py
```

Trên thiết bị khác cùng LAN, mở `http://<computer-lan-ip>:8000`, thay `<computer-lan-ip>` bằng IP LAN của máy chủ. Firewall của máy chủ phải cho phép kết nối vào cổng đã chọn. Truy cập qua Tailscale phụ thuộc vào việc cả hai thiết bị đã kết nối và được quy tắc truy cập của tailnet cho phép.

## Biến môi trường

| Biến | Mặc định | Ý nghĩa |
| --- | --- | --- |
| `MEMEMAP_HOST` | `0.0.0.0` | Địa chỉ máy chủ HTTP lắng nghe. |
| `MEMEMAP_PORT` | `8000` | Cổng TCP của máy chủ HTTP. |
| `MEMEMAP_DB_PATH` | `mememap.sqlite3` | Đường dẫn database; đường dẫn tương đối tính từ repo. |
| `MEMEMAP_UPLOADS_PATH` | `uploads` | Thư mục ảnh; đường dẫn tương đối tính từ repo. |
| `MEMEMAP_SECURE_COOKIE` | `0` | Đặt `1` để thêm `Secure` cho cookie khi dùng HTTPS. |

## Cấp quyền tài khoản admin

Repo không có màn hình tạo admin hoặc thông tin đăng nhập khởi tạo sẵn. Trước tiên đăng ký và đăng nhập bình thường bằng tài khoản muốn dùng để quản trị ghim. Dừng máy chủ, rồi chạy lệnh sau từ thư mục repo; thay `your_username` bằng username của tài khoản đó:

```sh
sqlite3 mememap.sqlite3 "UPDATE users SET is_admin = 1 WHERE username = 'your_username' COLLATE NOCASE;"
```

Khởi động lại máy chủ và đăng nhập lại. Để kiểm tra hoặc thu hồi quyền:

```sh
sqlite3 mememap.sqlite3 "SELECT username, is_admin FROM users WHERE username = 'your_username' COLLATE NOCASE;"
sqlite3 mememap.sqlite3 "UPDATE users SET is_admin = 0 WHERE username = 'your_username' COLLATE NOCASE;"
```

Username `admin` được dành riêng khi đăng ký, nhưng không tự có quyền quản trị. Giữ cơ sở dữ liệu riêng tư; người có thể sửa nó cũng có thể tự cấp quyền admin.

## Bảng kiểm duyệt

Khởi động lại máy chủ sau khi cập nhật backend. `Application.initialize()` chạy các migration còn thiếu và ghi vào `schema_migrations`: 1 — tài khoản/ghim, 2 — kiểm duyệt, 3 — thư mục ảnh. Database cũ chưa có bảng phiên bản được tiếp nhận mà không xóa dữ liệu. Schema và phiên bản commit cùng transaction; ảnh legacy được sao chép trước, chỉ xóa bản gốc sau commit. Nếu bị gián đoạn trước commit, có thể chạy lại. Nếu hai file ảnh cùng tên khác nội dung, quá trình dừng và giữ cả hai để kiểm tra; không ghi đè ảnh. Database có phiên bản mới hơn code bị từ chối. Sao lưu database và ảnh cùng nhau trước khi nâng cấp.

Bảng Admin có bốn phần: Tổng quan, Meme, Báo cáo và Người dùng. Lịch sử thao tác được mở từ đầu bảng. Menu và Admin mở độc lập trên desktop, dùng chung một bảng dưới cùng trên mobile; kiểm duyệt được thực hiện trong bảng Admin ngay trên trang bản đồ.

- **Ẩn/khôi phục:** tìm meme trong tab Meme, xem chi tiết rồi ẩn với lý do. Meme bị ẩn biến mất khỏi bản đồ và các tổng aura/meme công khai. Khôi phục hiển thị lại nội dung và lượt bình chọn đã giữ. Xóa vĩnh viễn xóa cả ảnh meme đã tải lên; dùng Ẩn khi cần khả năng khôi phục.
- **Báo cáo:** người dùng báo cáo từ chi tiết meme. Hàng đợi Admin gộp các báo cáo của cùng meme. Xem thông tin rồi ẩn meme hoặc bỏ qua báo cáo kèm ghi chú. Gửi báo cáo không tự làm meme bị ẩn.
- **Hạn chế:** tìm tài khoản trong tab Người dùng và hạn chế quyền đăng, bình chọn hoặc cả hai đến thời điểm đã chọn. Máy chủ kiểm tra hạn chế ngay cả khi người đó vẫn mở tab trình duyệt cũ. Gỡ hạn chế cũng được ghi lại. Giao diện không cho hạn chế tài khoản admin hoặc chính quản trị viên đang thao tác.
- **Lịch sử:** thao tác ẩn, khôi phục, xóa vĩnh viễn, xử lý báo cáo và thay đổi hạn chế ghi lại quản trị viên thực hiện, đối tượng, thời gian và lý do. Xóa meme không xóa lịch sử giải thích việc xóa đó.

Ảnh meme đã ẩn yêu cầu phiên admin và dùng header bộ nhớ đệm để kiểm tra lại quyền. Ẩn nội dung không thu hồi được bản sao đã tải xuống hoặc chụp lại trước đó.

Bảng quản trị không cấp hoặc thu hồi vai trò admin. Người vận hành thực hiện việc cấp quyền theo hướng dẫn ở trên.

Các thời hạn hạn chế có sẵn: 1 giờ, 24 giờ, 7 ngày và 30 ngày. Thời hạn được kiểm tra với mỗi yêu cầu đăng/bình chọn, không cần tác vụ định kỳ. Mỗi người chỉ được có một báo cáo chưa xử lý cho mỗi meme và gửi tối đa 10 báo cáo trong khoảng một giờ gần nhất.

Các thống kê Tổng quan dùng khoảng 24 giờ, 7 ngày hoặc 30 ngày gần nhất. Dung lượng ảnh tính các file hiện có trong cả hai thư mục tải lên; số báo cáo chưa xử lý bao gồm báo cáo đang xem xét. Dấu hiệu spam dùng khoảng thời gian riêng, không phụ thuộc khoảng thống kê Tổng quan:

- `posting_burst`: một tài khoản đăng ít nhất 5 meme trong 10 phút.
- `duplicate_content`: một tác giả đăng ít nhất 3 meme có tiêu đề và nội dung giống nhau sau chuẩn hóa trong 24 giờ. Chuẩn hóa gồm Unicode, chuyển về dạng so sánh không phân biệt hoa/thường và gộp khoảng trắng. Không so sánh ảnh.
- `vote_burst`: một tài khoản thực hiện ít nhất 20 thao tác bình chọn thành công trong 10 phút, bao gồm thao tác bật/tắt bình chọn. Sự kiện bình chọn mới được giữ tối đa 30 ngày và dọn khi có lượt bình chọn tiếp theo. Lượt bình chọn cũ không được gán thêm thời điểm sự kiện suy đoán.

Các dấu hiệu cũng xuất hiện trong danh sách meme/người dùng. Xem thông tin liên quan trước khi quyết định kiểm duyệt. Đây là các ngưỡng đơn giản, không phải hệ thống tự phân loại lạm dụng.

## Xử lý lỗi

- **Bản đồ trắng:** kiểm tra trình duyệt có truy cập được CDN Leaflet và máy chủ tile không, rồi xem console. Nhà cung cấp chặn tile có thể khiến nền bản đồ không tải dù máy chủ web tại máy vẫn phản hồi.
- **Tải ảnh thất bại do lỗi chuyển đổi:** cài `cwebp`, bảo đảm lệnh nằm trong `PATH` của tiến trình máy chủ rồi khởi động lại máy chủ.
- **Thiết bị khác không mở được trang:** xác nhận máy chủ đang chạy, dùng đúng IP LAN hiện tại và cổng, cho phép kết nối vào qua firewall. `localhost` trên điện thoại là chính điện thoại đó.
- **Ảnh ghim hoặc ảnh đại diện bị lỗi:** kiểm tra file được tham chiếu trong `uploads/` còn tồn tại; khôi phục cơ sở dữ liệu và thư mục ảnh từ cùng một bản sao lưu.
