# HTTP API

[English](../en/API.md) · **Tiếng Việt** · [Mục lục](README.md)

Các API được `server.py` phục vụ trên cùng nguồn truy cập với các trang web. API yêu cầu cookie `mememap_session` để xác thực, trừ đăng ký/đăng nhập/đăng xuất và `GET /api/me` như bảng dưới đây. Phần thân yêu cầu JSON dùng `Content-Type: application/json`; máy chủ chấp nhận phần thân tối đa 15 MiB.

## Đăng nhập và hồ sơ

| Phương thức và đường dẫn | Cần đăng nhập | Mục đích |
| --- | --- | --- |
| `GET /api/me` | Không bắt buộc | Trả về `{authenticated, user}`. Người đã đăng nhập có thông tin tên, username, ảnh đại diện, số meme và aura. |
| `POST /api/register` | Không | Phần thân: `{name, username, password}`. Tạo tài khoản và phiên đăng nhập. Trả về `201`. |
| `POST /api/login` | Không | Phần thân: `{username, password}`. Tạo phiên đăng nhập. |
| `POST /api/logout` | Không bắt buộc | Xóa phiên hiện tại và làm cookie hết hiệu lực. |
| `GET /api/profiles/{username}` | Có | Trả về thông tin hồ sơ công khai cho người xem đã đăng nhập, gồm `is_self`. |
| `POST /api/profile/avatar` | Có | Phần thân: `{image}`, trong đó `image` là data URL base64 của ảnh JPEG, PNG hoặc WebP. Chuyển ảnh và lưu thành WebP. |

Điều kiện đăng ký được backend kiểm tra: tên hiển thị dài 1–60 ký tự; username dài 3–24 ký tự, chỉ gồm chữ cái ASCII, số, dấu chấm hoặc gạch dưới, với ký tự đầu và cuối là chữ cái hoặc số; mật khẩu dài 8–256 ký tự ASCII có thể in được. Username `admin` được dành riêng.

## Ghim và bình chọn

| Phương thức và đường dẫn | Cần đăng nhập | Mục đích |
| --- | --- | --- |
| `GET /api/pins` | Có | Trả về `{pins, can_delete_pins}`. Mỗi ghim có tọa độ, tiêu đề, nội dung (`story`), URL ảnh, username, aura, lượt bình chọn của người xem, trạng thái sở hữu, quyền xóa và thời điểm tạo. |
| `POST /api/pins` | Có | Phần thân: `{lat, lng, title, story, image?}`. Tạo ghim, trả về `201` với `{pin}`. |
| `POST /api/pins/{id}/vote` | Có | Phần thân: `{value: 1}` hoặc `{value: -1}`. Bình chọn lại cùng giá trị sẽ bỏ bình chọn; giá trị ngược lại sẽ đổi bình chọn. Người đăng không được bình chọn ghim của mình. |
| `DELETE /api/pins/{id}` | Admin | Xóa ghim. |
| `GET /api/leaderboard?city=hanoi` | Có | Trả về tối đa 100 người dùng, xếp theo aura rồi số ghim. Hiện chỉ hỗ trợ `hanoi`. |

Ảnh meme là tùy chọn. Các loại data URL được chấp nhận: `image/jpeg`, `image/png`, `image/webp`; ảnh nguồn tối đa 10 MiB. Ảnh mới được lưu thành WebP trong `/uploads/memes/`. Ảnh đại diện nằm trong `/uploads/profiles/`, có kích thước tối đa 512 × 512 px sau chuyển đổi.

## Đường dẫn trang và ảnh

| Phương thức và đường dẫn | Mục đích |
| --- | --- |
| `GET /` hoặc `GET /index.html` | Phục vụ trang chính/đăng nhập. |
| `GET /landing.html` | Phục vụ bản đồ cho người đã đăng nhập; nếu chưa đăng nhập thì chuyển đến `/?login=required`. |
| `GET /assets/default-profile-picture.png` | Ảnh đại diện mặc định cũ, được phục vụ công khai. |
| `GET /assets/default-profile-picture.webp` | Ảnh đại diện mặc định cho tài khoản mới, được phục vụ công khai. |
| `GET /assets/icon.svg` | Icon SVG thay thế, được phục vụ công khai; đầu trang hiện dùng icon PNG. |
| `GET /assets/icon-128x.png` | Icon đầu trang, được phục vụ công khai. |
| `GET /assets/icon-64x.png` | Icon tab trình duyệt, được phục vụ công khai. |
| `GET /uploads/{memes,profiles}/{random-id}.{ext}` | Phục vụ ảnh tải lên cho người đã đăng nhập. |

Máy chủ chỉ cho phép các đường dẫn tài nguyên được liệt kê, không có đường dẫn phục vụ file tĩnh tùy ý.

Máy chủ cũng phục vụ các file frontend `assets/css/{shared,home,map,admin}.css` và `assets/js/{shared,api,home,map-layout,map-copy,map-pins,map-composer,map-profile,map-leaderboard,map,admin}.js`. Các file này được truy cập công khai và dùng `Cache-Control: no-cache` để trình duyệt kiểm tra lại khi có cập nhật. Ảnh hồ sơ tải lên dùng bộ nhớ đệm riêng tư, bất biến theo URL ngẫu nhiên. Ảnh meme tải lên dùng `private, no-store`; mỗi yêu cầu kiểm tra meme còn hiển thị hoặc người xem là admin. Ảnh không tồn tại, đã xóa hoặc bị ẩn mà người xem không có quyền đều trả về 404.

## Kiểm duyệt và báo cáo

Mọi đường dẫn `/api/admin/*` yêu cầu quản trị viên đã đăng nhập. Phản hồi dùng JSON và không được lưu vào bộ nhớ đệm. `/api/me` có trường `user.is_admin`; danh sách ghim thông thường loại bỏ meme đã ẩn kể cả khi người xem là admin. Meme đã ẩn và lượt bình chọn của chúng không được tính vào tổng hồ sơ công khai và bảng xếp hạng; khôi phục sẽ tính lại. Bình chọn meme đã ẩn trả về 404.

| Phương thức và đường dẫn | Tham số / phần thân | Kết quả |
| --- | --- | --- |
| `GET /api/admin/overview` | `days=1`, `7` (mặc định) hoặc `30` | `{stats:{new_pins,new_users,pending_reports,image_bytes},alerts,days}`. Số mới được tính trong khoảng ngày gần nhất; báo cáo chưa xử lý và dung lượng ảnh là tổng hiện tại. |
| `GET /api/admin/pins` | `q`, `status=all/visible/hidden`, `image=all/yes/no`, `since`, `until`, `sort=newest/oldest/aura_desc/aura_asc`, `page` | `{pins,total,page,pages}`. Mỗi dòng gồm người đăng, tọa độ, nội dung, ảnh, aura, trạng thái/lý do/thời điểm ẩn và `signals`. |
| `POST /api/admin/pins/{id}/moderate` | `{action:"hide"/"restore",reason}` | `{pin}`; ẩn yêu cầu lý do. Yêu cầu không làm thay đổi trạng thái hiển thị sẽ không tạo lịch sử mới. |
| `DELETE /api/pins/{id}` | `{reason}` không bắt buộc cho client cũ; bảng Admin yêu cầu lý do | Xóa vĩnh viễn meme, lượt bình chọn và ảnh meme đã lưu, giữ thông tin trong lịch sử, xử lý các báo cáo còn mở. |
| `POST /api/pins/{id}/reports` | `{reason,detail}`; thành viên bất kỳ đã đăng nhập | 201 `{report:{id,pin_id,status:"pending"}}`. Lý do: `spam`, `harassment`, `inappropriate`, `misleading`, `other`; `other` yêu cầu chi tiết. |
| `GET /api/admin/reports` | `status=pending/reviewing/resolved`, `page` | `{reports,total,page,pages}`; gộp theo meme, gồm lý do, số báo cáo, nội dung hiện tại và từng báo cáo. Meme đã xóa vẫn giữ thông tin tiêu đề/người đăng và có `pin_deleted:true`. |
| `POST /api/admin/reports/{pin_id}` | `{action:"review"/"dismiss"/"hide",reason}` | `{updated,pin_id,affected}`. Thay đổi các báo cáo chưa xử lý; `hide` đồng thời ẩn meme. `dismiss`/`hide` yêu cầu lý do. |
| `GET /api/admin/users` | `q`, `status=all/restricted`, `since`, `until`, `page` | `{users,total,page,pages}`; tổng meme/aura công khai, cờ admin, hạn chế đăng/bình chọn hiện tại và `signals`. |
| `POST /api/admin/users/{id}/restrictions` | `{scope:"post"/"vote"/"both",action:"restrict"/"lift",duration_hours,reason}` | `{user}`. Thời hạn: 1, 24, 168, 720 giờ; gỡ hạn chế bỏ qua thời hạn. Bắt buộc có lý do. Không được hạn chế tài khoản admin. |
| `GET /api/admin/audit` | `action`, `actor`, `target_type=pin/user`, `target_id`, `page` | `{entries,total,page,pages}`; mỗi mục gồm username người thực hiện, thông tin đối tượng tại thời điểm thao tác, hành động, lý do và thời gian. |

Mỗi trang danh sách có tối đa 20 bản ghi; kể cả danh sách rỗng vẫn có ít nhất một trang. Tìm kiếm theo chuỗi con nguyên văn; các ký tự đại diện của SQL được xử lý để không trở thành mẫu tìm kiếm. `since` và `until` dùng ngày theo UTC (`YYYY-MM-DD`), tính cả ngày kết thúc. Mốc thời gian là số giây Unix. Lý do/chi tiết tối đa 500 ký tự; từ khóa tìm kiếm tối đa 120 ký tự.

Mỗi thành viên chỉ có một báo cáo chưa xử lý cho mỗi meme (409 `report_already_open`), và được gửi tối đa 10 báo cáo trong khoảng một giờ gần nhất (429 `report_rate_limited`). Máy chủ kiểm tra hạn chế quyền: lỗi 403 `post_restricted` hoặc `vote_restricted` trả thêm `until` và `reason`. Hạn chế hết hạn tự ngừng áp dụng. Lỗi 403 `protected_admin` ngăn hạn chế quản trị viên.

Mã hành động trong lịch sử: `hide_pin`, `restore_pin`, `delete_pin`, `review_reports`, `dismiss_reports`, `resolve_reports`, `restrict_post`, `restrict_vote`, `lift_post`, `lift_vote`. Bản ghi lịch sử được lưu trong cùng giao dịch với thao tác cơ sở dữ liệu liên quan. Trigger chặn cập nhật/xóa bảo vệ lịch sử khỏi sửa đổi nhầm; thông tin lịch sử và báo cáo vẫn tồn tại sau khi meme bị xóa vĩnh viễn.

Cảnh báo hoạt động dùng `posting_burst`, `duplicate_content` và `vote_burst`, kèm số lượng và khoảng thời gian. Chúng không tự kiểm duyệt. Xem quy tắc cụ thể trong [hướng dẫn vận hành](RUNNING.md#bảng-kiểm-duyệt).

## Lỗi thường gặp

Lỗi là đối tượng JSON có trường `error`. Các giá trị liên quan gồm `invalid_request`, `authentication_required`, `invalid_credentials`, `username_exists`, `invalid_username`, `invalid_image`, `image_too_large`, `webp_conversion_failed`, `outside_map_bounds`, `cannot_vote_own_pin`, `pin_not_found`, `unsupported_city`. Mã HTTP phân biệt dữ liệu đầu vào sai (`400`), chưa đăng nhập (`401`), thao tác bị cấm (`403`), không tìm thấy bản ghi (`404`), xung đột (`409`) và lỗi máy chủ/lưu trữ (`500`).

Bản đồ chỉ chấp nhận ghim trong vùng chữ nhật do backend quy định: vĩ độ `20.09` đến `21.89`, kinh độ `104.83` đến `106.76`. Bảng xếp hạng hiện chỉ nhận `city=hanoi`, xếp theo aura, số ghim, rồi username.

## Cấu hình bản đồ và tổng hồ sơ

`GET /api/map-config` yêu cầu đăng nhập (401 khi chưa đăng nhập), trả đối tượng sau. `bounds` là hai góc tây nam/đông bắc, tọa độ theo thứ tự latitude, longitude:

```json
{
  "bounds": [[20.09, 104.83], [21.89, 106.76]],
  "center": [20.9893, 105.7953],
  "zoom": 18,
  "min_zoom": 11,
  "max_zoom": 19,
  "style": "https://tiles.openfreemap.org/styles/liberty",
  "tiles": {
    "url": "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    "attribution": "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap contributors</a>"
  }
}
```

`style` là field bổ sung cho MapLibre; `tiles` được giữ cho client cũ, nhưng trang hiện tại không tải các tile raster đó. Tọa độ vẫn theo thứ tự vĩ độ/kinh độ. Giá trị zoom giữ thang tile 256 px cũ: client MapLibre trừ một từ `zoom`, `min_zoom` và `max_zoom` để dùng thang tile thế giới 512 px (zoom ban đầu 17). Xác thực, giới hạn đăng ghim và phạm vi Memerboard không đổi.

`meme_count` và `aura` trong `/api/me` và `/api/profiles/{username}` là tổng từ toàn bộ ghim đang hiển thị của tác giả. Việc lọc ghim ở frontend không làm thay đổi các tổng này. Cấu hình map không cấp quyền truy cập hoặc xác định local/guest.
