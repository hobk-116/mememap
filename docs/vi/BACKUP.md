# Sao lưu và khôi phục

[English](../en/BACKUP.md) · **Tiếng Việt** · [Mục lục](README.md)

Ứng dụng hiện chưa có bộ lập lịch sao lưu tự động hoặc giao diện khôi phục tích hợp. Đây là quy trình của người vận hành; chuyển mã nguồn vào `archive/` không phải sao lưu database/ảnh.

## Dữ liệu khi chạy và sao lưu

Lần khởi động đầu tạo `mememap.sqlite3`; tải ảnh lên tạo `uploads/memes/` và `uploads/profiles/`. Git bỏ qua các dữ liệu này. Sao lưu cơ sở dữ liệu SQLite và thư mục ảnh cùng nhau khi máy chủ đã dừng, hoặc dùng phương pháp sao lưu SQLite bảo đảm dữ liệu nhất quán. Chỉ khôi phục một phần có thể khiến ghim hoặc hồ sơ trỏ đến file ảnh không tồn tại.

Không commit cơ sở dữ liệu, ảnh người dùng tải lên hoặc thông tin bí mật vào repo.


## Chọn đúng đường dẫn dữ liệu đang chạy

Kiểm tra `MEMEMAP_DB_PATH` và `MEMEMAP_UPLOADS_PATH` trong môi trường của server trước khi sao chép hoặc khôi phục. Mặc định là `mememap.sqlite3` và `uploads/` trong repo; đường dẫn tùy chỉnh tương đối tính từ repo. Lệnh cấp quyền admin phải dùng đúng database đã cấu hình.

Git bỏ qua đường dẫn dữ liệu mặc định. Đặt dữ liệu tùy chỉnh ngoài repo hoặc thêm quy tắc bỏ qua tương ứng. Lịch sử mã nguồn Git/GitHub không lưu dữ liệu người dùng đã bị bỏ qua.

## Sao lưu thủ công

1. Dừng ứng dụng để không còn thao tác ghi database hoặc ảnh.
2. Sao chép database SQLite và toàn bộ thư mục uploads đã cấu hình vào cùng một bộ sao lưu có ngày, nằm ngoài checkout mã nguồn.
3. Ghi commit hoặc phiên bản code, đường dẫn cấu hình và thời điểm sao lưu cùng bộ đó. Giữ cả `memes/` lẫn `profiles/`.
4. Khởi động lại ứng dụng và xác nhận hoạt động bình thường.

Sao lưu khi server đang chạy phải phối hợp việc ghi SQLite và ảnh để tạo một bộ nhất quán. Chỉ sao chép database trong khi ảnh đang thay đổi không bảo đảm điều này.

## Khôi phục và xác nhận

1. Khôi phục một bộ database/ảnh khớp nhau vào đường dẫn tách biệt trước, dùng phiên bản code phù hợp với bộ sao lưu đó.
2. Xác nhận khởi động, truy cập tài khoản, ảnh ghim và avatar, cùng trạng thái kiểm duyệt dự kiến. Dùng bản dữ liệu sao chép tạm cho kiểm tra này.
3. Khi khôi phục thật, dừng ứng dụng và giữ lại dữ liệu hiện tại trước khi thay bằng bộ đã xác minh.
4. Khởi động bằng các biến môi trường dự kiến và xác nhận các tham chiếu database trỏ đúng ảnh đã khôi phục.

Sao lưu trước migration schema/ảnh. Kiểm tra rollback và chạy lại migration nằm trong [hướng dẫn kiểm tra](TESTING.md); chúng không thay thế việc thử khôi phục một bộ sao lưu thực tế.
