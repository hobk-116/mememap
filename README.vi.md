# MemeMap

[English](README.md) · **Tiếng Việt**

MemeMap là bản đồ cộng đồng hỗ trợ tiếng Việt và tiếng Anh, cho phép đăng meme và nội dung ngắn tại các địa điểm quanh Hà Nội. Ứng dụng có tài khoản, hồ sơ người dùng, bình chọn aura, bảng xếp hạng theo thành phố và bảng quản trị nội dung.

## Thành phần dự án

- `index.html` — trang chính, hướng dẫn, đăng ký/đăng nhập và hồ sơ của người đang đăng nhập.
- `landing.html` — bản đồ tương tác MapLibre GL JS cùng các bảng menu, biểu mẫu đặt ghim, hồ sơ, Memerboard (Nông trại hào quang) và bảng Admin.
- `server.py` — lớp HTTP: định tuyến, cookie, đọc yêu cầu và gửi phản hồi.
- `mememap/` — nghiệp vụ tài khoản, hồ sơ, ghim và kiểm duyệt; cấu hình, migration, ảnh và phạm vi địa lý.
- `assets/` — ảnh hồ sơ mặc định và biểu tượng ứng dụng. Giao diện dùng `icon-128x.png`; tab trình duyệt dùng `icon-64x.png`. Tài khoản mới dùng ảnh đại diện mặc định WebP; tài khoản cũ có thể vẫn dùng PNG.
- `assets/css/` và `assets/js/` — thành phần dùng chung cùng CSS/JavaScript riêng cho trang chính và bản đồ. Trách nhiệm từng file được mô tả trong tài liệu kiến trúc.
- `archive/` — Sticky Note gốc và trang HTML lịch sử giữ nguyên nội dung, có mục lục song ngữ. Đây là tài liệu mã nguồn tham khảo, không phải sao lưu dữ liệu đang chạy.
- `docs/en/` và `docs/vi/` — các tài liệu kiến trúc, API, vận hành, sao lưu, triển khai, kiểm tra và recommendations cùng tên; ghi chép cũ nằm trong thư mục `history/` của từng ngôn ngữ.
- `tests/` — kiểm tra hồi quy backend và trình duyệt bằng dữ liệu tạm.

## Chạy tại máy

Yêu cầu: Python 3.10 trở lên và lệnh `cwebp` có trong `PATH`. Máy chủ dùng `cwebp` khi cần chuyển ảnh JPEG/PNG tải lên thành WebP. Trình duyệt có thể chuyển ảnh trước; xử lý tại máy chủ là phương án dự phòng cho Safari.

Trên macOS có Homebrew:

```sh
brew install webp
python3 server.py
```

Sau đó mở [http://localhost:8000](http://localhost:8000). Máy chủ mặc định lắng nghe tại `0.0.0.0:8000`, nên thiết bị khác trong mạng có thể kết nối bằng `http://<computer-ip>:8000`, thay `<computer-ip>` bằng IP của máy chạy máy chủ.

Cấu hình tùy chọn:

```sh
MEMEMAP_HOST=127.0.0.1 MEMEMAP_PORT=8000 python3 server.py
```

Xem [vận hành tại máy](docs/vi/RUNNING.md), [sao lưu](docs/vi/BACKUP.md) và [triển khai Cloudflare Tunnel](docs/vi/DEPLOYMENT.md) để biết cấu hình host, bảo vệ dữ liệu, truy cập LAN và HTTPS công khai.

## Tính năng chính

- Đăng ký tài khoản và đăng nhập bằng username.
- Đặt ghim trên bản đồ với tiêu đề, nội dung và ảnh tĩnh JPG/JPEG/PNG/WebP tùy chọn. Ảnh mới tải lên được lưu thành WebP.
- Xem hồ sơ, đổi ảnh đại diện và xem tổng số meme cùng aura.
- Bình chọn `+1` hoặc `-1` aura cho ghim của người khác. Người đăng không thể bình chọn ghim của mình.
- Xem Memerboard Hà Nội và báo cáo meme để quản trị viên xem xét.
- Quản trị viên có thể tìm meme, ẩn/khôi phục, xử lý báo cáo và tạm hạn chế quyền đăng hoặc bình chọn. Các thao tác kiểm duyệt được ghi vào lịch sử quản trị.
- Bảng Tổng quan của Admin hiển thị thống kê hoạt động và cảnh báo spam theo quy tắc để quản trị viên xem xét.
- Sử dụng giao diện tiếng Việt hoặc tiếng Anh.
- Bản đồ cập nhật ghim mỗi 10 giây khi trang đang hiển thị.

## Dữ liệu và cấu hình

- Cơ sở dữ liệu SQLite: `mememap.sqlite3` ở thư mục gốc repo, được tạo trong lần khởi động đầu tiên.
- Ảnh tải lên: `uploads/memes/` và `uploads/profiles/`, được tạo khi cần.
- Đây là dữ liệu phát sinh khi ứng dụng chạy và được Git bỏ qua. Sao lưu chúng cùng nhau vì cơ sở dữ liệu lưu đường dẫn đến ảnh.
- Tâm bản đồ, phạm vi đăng ghim và style OpenFreeMap được cấu hình tại `mememap/regions.py`, cung cấp cho frontend qua `GET /api/map-config` có xác thực. Phạm vi Memerboard được khai báo riêng trong cùng module; xem [kiến trúc](docs/vi/ARCHITECTURE.md).
- Khởi động lại máy chủ sau khi cập nhật backend. Migration có phiên bản, giữ dữ liệu hiện có; sao lưu database và ảnh cùng nhau trước khi nâng cấp. Có thể cấu hình đường dẫn dữ liệu bằng biến môi trường trong tài liệu vận hành.

## Tài liệu

- [Mục lục tài liệu tiếng Anh](docs/en/README.md)
- [Mục lục tài liệu tiếng Việt](docs/vi/README.md)
- [Nhật ký thay đổi](CHANGELOG.vi.md) · [English](CHANGELOG.md)
- [Lịch sử phiên bản — 0.0.x](docs/vi/history/VERSIONS.md) · [English](docs/en/history/VERSIONS.md)
- [Quy tắc cho agent](AGENTS.md) · [Hướng dẫn tiếng Việt](docs/vi/AGENTS_GUIDE_vi.md)
- [Kiến trúc và mô hình dữ liệu](docs/vi/ARCHITECTURE.md)
- [Tài liệu HTTP API](docs/vi/API.md)
- [Vận hành tại máy](docs/vi/RUNNING.md)
- [Sao lưu và khôi phục](docs/vi/BACKUP.md)
- [Triển khai Cloudflare Tunnel](docs/vi/DEPLOYMENT.md)
- [Kiểm tra](docs/vi/TESTING.md)
- [Đề xuất phát triển và Sticky Note đã sáp nhập](docs/vi/RECOMMENDATIONS.md)
- [Lịch sử refactor](docs/vi/history/REFACTOR_2026-10-02.md)
- [File gốc được lưu trữ](archive/README.vi.md)

## Trạng thái dự án

Đây là bản thử nghiệm đang tiếp tục phát triển. Bản đồ và Memerboard hiện hỗ trợ Hà Nội. Máy chủ HTTP có quy mô nhỏ và chưa được gia cố đầy đủ để vận hành công khai trong môi trường production. Đọc phần bảo mật và dịch vụ bản đồ trong [hướng dẫn triển khai](docs/vi/DEPLOYMENT.md) trước khi mở truy cập ra ngoài môi trường thử nghiệm tin cậy.

## Showcase chỉ frontend

Showcase trên Vercel dùng lại giao diện HTML/CSS với bộ điều hợp dữ liệu trong trình duyệt tại `assets/js/api.js`. Hoạt động của người dùng được lưu trong `sessionStorage` của tab hiện tại. Đây là bản trình diễn, không lưu tài khoản, ghim, vote hoặc media trên máy chủ. Khi triển khai dạng static trên Vercel, không cần Python runtime hoặc SQLite database.
