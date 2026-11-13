# Kiến trúc

[English](../en/ARCHITECTURE.md) · **Tiếng Việt** · [Mục lục](README.md)

## Luồng yêu cầu

Dự án là một ứng dụng web nhỏ dùng chung nguồn truy cập (same-origin). `server.py` phục vụ các trang HTML và API JSON trên cùng máy chủ và cổng; các lệnh `fetch()` trong trình duyệt dùng cookie phiên đăng nhập. Frontend dùng HTML, CSS và JavaScript thuần, tải MapLibre GL JS 6.13.0 dạng ES module từ unpkg và style/tile vector Liberty từ OpenFreeMap.

```text
Trình duyệt
  ├── / hoặc /index.html → index.html (trang chính, đăng nhập, hồ sơ bản thân)
  ├── /landing.html      → bản đồ tương tác yêu cầu đăng nhập
  ├── /api/*             → API JSON trong server.py
  ├── /assets/*          → ảnh hồ sơ và icon trong danh sách được phép phục vụ
  └── /uploads/*         → ảnh tải lên yêu cầu đăng nhập

server.py → mememap.app.Application → services → SQLite (mememap.sqlite3) + uploads/{memes,profiles}/
```

Các trang HTML chứa cấu trúc giao diện và tải CSS/JavaScript từ file riêng. MapLibre GL JS là thư viện bản đồ duy nhất của trang bản đồ. Dự án không có bước build.

| File | Trách nhiệm |
| --- | --- |
| `assets/css/shared.css` | Các giá trị định kiểu chữ dùng chung, animation popup và thành phần hồ sơ |
| `assets/css/home.css` | Bố cục trang chính và biểu mẫu tài khoản |
| `assets/css/map.css` | Bản đồ, bảng trượt desktop, bảng kéo mobile, biểu mẫu đặt ghim và bảng xếp hạng |
| `assets/css/admin.css` | Tab Admin, bộ lọc, danh sách kết quả, thống kê, lịch sử và popup kiểm duyệt |
| `assets/js/shared.js` | Xử lý ảnh và phương án dự phòng cho Safari, gợi ý username, quá trình đóng popup và chặn chạm đúp trên giao diện mobile |
| `assets/js/home.js` | Giao diện tài khoản và hồ sơ trên trang chính |
| `assets/js/map.js` | Khởi tạo MapLibre, ghép các module và sự kiện trang |
| `assets/js/api.js` | API client dùng chung, JSON, lỗi, phiên hết hạn và hủy yêu cầu |
| `assets/js/map-pins.js` | Tải ghim, marker, popup và vote |
| `assets/js/map-composer.js` | Chọn vị trí, xử lý ảnh và đăng ghim |
| `assets/js/map-profile.js` | Hồ sơ, avatar, đăng xuất và thống kê từ backend |
| `assets/js/map-leaderboard.js` | Tải và hiển thị Memerboard |
| `assets/js/map-copy.js` | Nội dung tiếng Việt/Anh của trang bản đồ |
| `assets/js/map-layout.js` | Trạng thái bảng dùng chung, thao tác kéo bảng, vị trí ghim cố định và bản đồ, ghim chọn vị trí tạm và xử lý đổi kích thước cửa sổ |
| `assets/js/admin.js` | Dữ liệu và tương tác bảng Admin, thao tác kiểm duyệt, báo cáo từ người dùng và thông báo theo ngôn ngữ |
| `mememap/{auth,profiles,pins,moderation}.py` | Nghiệp vụ không phụ thuộc HTTP handler |
| `mememap/{app,config,database,migrations,media,regions,errors}.py` | Khởi tạo ứng dụng, cấu hình và các dịch vụ nền tảng |
| `moderation.py` | Lớp import tương thích cho công cụ cũ |

Bộ điều khiển bố cục quản lý trạng thái mở riêng của từng bảng và chiều cao chung của các bảng trên mobile. Khi kích thước hoặc vị trí bảng thay đổi, nó giữ nguyên tọa độ địa lý bên dưới ghim cố định. Khi kéo bản đồ bình thường, ghim vẫn đứng yên trên màn hình; nếu chọn vị trí meme khi ghim cố định đang dùng được, ghim di chuyển đến điểm đã chọn. Trên mobile, ghim này luôn dùng được ở mọi mức chiều cao, kể cả `peek`.

Chỉ trên desktop, khi tất cả bảng đã đóng, việc chọn vị trí dùng một marker DOM MapLibre tạm riêng, có animation xuất hiện riêng. Marker này giữ nguyên tọa độ đã chọn, bị ẩn khi có bảng mở và được gỡ khi đóng hoặc lưu biểu mẫu đặt ghim. Chọn vị trí khi các bảng desktop đóng không làm thay đổi vị trí ghim cố định hoặc điểm neo bố cục.

Trên desktop, bảng có thể nằm bên trái hoặc bên phải thông qua cấu hình `side`; ghim được căn giữa vùng còn lại giữa các bảng đang mở. Trên mobile, Menu và Admin dùng chung vị trí bảng dưới cùng, chỉ một nội dung được mở tại một thời điểm. Chuyển giữa hai nội dung giữ nguyên tọa độ neo, trạng thái nội dung và mức chiều cao gần nhất của từng bảng. Kéo bảng cập nhật chiều cao và bản đồ dựa trên tọa độ neo tuyệt đối. Trên desktop, hai bảng vẫn mở độc lập. Khi thu cửa sổ từ desktop xuống mobile, bảng được mở gần nhất được giữ lại ở mức mặc định, hoặc `peek` nếu cả hai đã đóng.


## Các trang

### Tương tác bảng trên mobile

Trên mobile, nút đặt ghim và dòng nguồn bản đồ bám theo mép trên thực tế của bảng đang hoạt động, kể cả kéo tự do, tự về mức sau khi thả và chuyển Nông trại hào quang. ResizeObserver của bảng đồng bộ vị trí trước khi vẽ; nút chừa 16 px cộng chiều cao dòng nguồn, còn dòng nguồn kết thúc cách bảng 4 px. Ghim đặt vị trí giữ cơ chế căn chỉnh neo địa lý hiện có.

Ở chiều rộng tối đa 600 px, `map-layout.js` quản lý ba mức chiều cao và quy tắc hành động dùng chung:

| Mức | Chiều cao và cách hiển thị |
| --- | --- |
| `peek` | Vừa dòng địa danh/ngữ cảnh và tiêu đề chính, giữ nút lịch sử của Admin; cách cạnh bên và đáy màn hình 16 px. Toàn bộ bảng đang thấy là vùng bắt đầu kéo. Thay cho ẩn hoàn toàn nhưng không phải mức ban đầu. |
| `default` | 230 px, giới hạn bằng mức mở rộng trên màn hình thấp; khoảng cách cạnh 8 px. Là mức ban đầu và khi mở lại chính bảng đang đóng. |
| `expanded` | 76% chiều cao vùng hiển thị đã ghi nhận, không quá 640 px; khoảng cách cạnh 8 px. |

Thả tay chọn mức theo hướng kéo. Vượt một phần ba khoảng cách từ mức bắt đầu đến mức kế bên sẽ chọn mức kế bên. Tiếp tục vượt mức mặc định ít nhất một phần ba khoảng tiếp theo có thể đi thẳng giữa `peek` và `expanded`. Dưới mức mặc định, khoảng cách cạnh tăng dần từ 8 lên 16 px. Mức nhỏ nhất hiện Hà Nội và “Chuyện quanh đây.” trong Menu, hoặc dòng ngữ cảnh Admin và “Quản trị” cùng nút lịch sử/quay lại. Nội dung dưới tiêu đề bị cắt theo cạnh bảng và ẩn sau khi chuyển động kết thúc. Nút mở/đóng tính mức này là đóng, nhưng ghim đặt cố định mobile vẫn hiện và dùng được phía trên bảng; không cần marker tạm riêng.

Header Menu/Admin mobile giữ cùng padding và khoảng cách tiêu đề trong suốt lúc kéo và thả tay. Nút lịch sử Admin được đặt độc lập với hàng ngữ cảnh nên không làm đổi chiều cao hàng này. Mở lịch sử từ bản thu nhỏ sẽ mở rộng bảng. Cả hai chân bảng giữ vị trí tuyệt đối, dùng cùng tiến độ `--sheet-collapse` để trượt xuống ngoài bảng giữa `default` và `peek`. Khi kéo, chuyển động theo ngón tay; sau khi thả, nó dùng cùng thời gian và easing với bảng. Chỉ đổi trạng thái hiển thị chân bảng sau khi chuyển động đóng kết thúc, thay vì dùng `display:none` giữa chừng. `ResizeObserver` của chân bảng chừa đúng chiều cao phía trên kết quả Admin; tab bị ẩn trong lịch sử không chừa khoảng trống. Nội dung bản thu nhỏ được đặt inert ngay để chặn kích hoạt bằng bàn phím hoặc con trỏ trong lúc đi ra, không đổi bố cục.

`sheetRules.actions` dùng chung quy định chiều cao cho `setOpen` và `applyAction(id, action)`: đóng Menu/Admin đang dùng về `peek`, mở lại chính bảng đó về `default`, tìm kiếm/bộ lọc và mọi tab Admin về `expanded`, chọn ghim trong Menu về `default`. Đổi qua lại các nút Menu/Admin cùng cấp sẽ lưu mức của bảng vừa rời và khôi phục mức riêng của bảng đích, kể cả `peek`; lần mở đầu của mỗi bảng dùng `default`. Ghi nhớ trong trang chỉ áp dụng khi đổi bảng cùng cấp, tách riêng với mức quay về từ menu con. Bấm tab Admin đang chọn vẫn mở rộng mà không đặt lại bộ lọc. Bốn tab Admin nằm ở chân bảng mobile. `setExpanded` giữ vai trò hàm tiện ích cho hành động tìm kiếm/chọn ghim; bảng desktop giữ hành vi hiện có.

Tập trung hoặc nhập vào ô tìm kiếm Menu/Admin và chọn bộ lọc mở rộng bảng đang dùng qua sự kiện ủy quyền, gồm cả các trường Admin được dựng lại động. Vùng bắt đầu kéo kéo dài qua hàng tìm kiếm Menu, biểu mẫu bộ lọc Admin và lựa chọn thành phố của bảng xếp hạng. Vùng thường bắt đầu kéo sau 4 px; các nút/ô nhập cần chuyển động chủ yếu theo chiều dọc từ 8 px. Chuyển động vẫn được theo dõi nếu con trỏ rời tay nắm trước khi được bắt giữ. Chạm vẫn nhập/chọn/bấm bình thường; kéo xong chặn sự kiện bấm phát sinh từ chính thao tác kéo đó. Danh sách kết quả tiếp tục cuộn riêng.

Mở Memerboard bằng `setSubview(id, view, {onReady})` mở rộng bảng trong 250 ms và gọi `onReady` ngay để bắt đầu chuyển động ngang 280 ms cùng lúc, khôi phục tốc độ cũ. Nếu đã mở rộng, chỉ cần chuyển động ngang. Không còn lượt hiện menu con bị trì hoãn cần hủy. Chỉ nút quay lại của Memerboard gọi `setSubview(id, null, {restore:true})` để khôi phục mức menu gốc đã nhớ. Đổi Menu/Admin cùng cấp giữ riêng mức quay về này và menu con đang mở. Đóng/mở lại chính Menu đang dùng đặt mức quay về thành `default`; cách thoát khác dùng `{restore:false}`. Menu con sau này có thể dùng chung giao diện này. Trên mobile, tiêu đề và lựa chọn thành phố nằm ngoài phần kết quả có thể cuộn. Chọn ghim trong Menu thu về `default` trước khi mở popup ghim; nút bình chọn và quản lý không thu gọn bảng. Nút gợi ý đặt ghim được căn giữa và có chiều rộng theo nội dung trong vùng còn trống.

Các vùng giao diện mobile dùng `touch-action: manipulation` cùng xử lý một ngón tay dùng chung để chặn lần chạm thứ hai trên cùng phần tử trong 300 ms. Áp dụng cho nút, bảng và popup trên cả hai trang, kể cả nội dung popup MapLibre. Xử lý bổ sung này bỏ qua trường nhập và vùng thao tác bản đồ; chạm nhiều ngón xóa trạng thái ghi nhận chạm. Vẫn có thể pinch zoom bản đồ. Giả lập Chromium không xác nhận hành vi Safari/iOS thật.

Trên desktop và mobile, nút ghim cố định giữ nguyên giao diện, nằm trong lớp phủ màn hình với `z-index:650`, trên marker DOM MapLibre (`600`) và dưới popup meme (`700`). Lớp phủ giữ tọa độ màn hình khi kéo/zoom mà không cần bù pane của engine. Các thành phần nằm trong stacking context cô lập của bản đồ, dưới thanh đầu trang, bảng và nút giao diện. Ghim emoji xanh, ghim đặt vị trí màu đỏ đậm (`#d62f1f`), nội dung popup và hành vi drawer/sheet được giữ lại. Chỉ desktop ẩn/vô hiệu hóa nút cố định khi mọi bảng đã đóng; mobile giữ nó phía trên bản thu nhỏ chỉ hiện tiêu đề.

Chiều cao trang mobile giữ bằng mức trước khi mở bàn phím trong lúc trường của bảng đang được tập trung, và trong lúc đóng bàn phím nếu vùng hiển thị vẫn ngắn hơn trên 120 px. Bảng mở rộng ngay khi tập trung vào ô nhập để đưa ô tìm kiếm lên cao trước khi bàn phím xuất hiện. Trang không nâng phần chân bảng lên trên bàn phím; bàn phím có thể che kết quả phía dưới và phần chân bảng cho đến khi đóng. Sau đó trang tiếp tục theo thay đổi kích thước thông thường; đổi chiều rộng vẫn cập nhật bố cục responsive. Trang mobile được cố định và khóa cuộn bên ngoài, còn danh sách kết quả vẫn cuộn được. Việc nhận diện bàn phím dùng ngưỡng ước lượng vì [visual viewport](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport) có thể đổi độc lập với layout viewport. Giả lập viewport Chromium không xác nhận hành vi bàn phím Safari/iOS/Android thật; cần thử trên các thiết bị đó trước khi phát hành.

### `index.html`

Trang vào ứng dụng cung cấp hướng dẫn song ngữ và đăng ký/đăng nhập. Sau khi đăng nhập, trang hiển thị liên kết mở bản đồ và bảng hồ sơ của người đang đăng nhập. Tài khoản mới dùng ảnh hồ sơ mặc định `assets/default-profile-picture.webp`.

Trên cả hai trang, hồ sơ mở từ icon tài khoản ở đầu trang có dòng đăng xuất. Hồ sơ mở qua ghim, Memerboard hoặc Admin không có dòng này, kể cả khi đó là hồ sơ của người đang xem. Thao tác đăng xuất yêu cầu xác nhận theo ngôn ngữ đang chọn; hủy xác nhận giữ nguyên phiên đăng nhập. Đăng xuất từ bản đồ đưa người dùng về trang chính.

### `landing.html`

Nút Menu và Admin nằm cùng hàng bên dưới thanh thao tác trên cùng. Hai nút có cùng hình dạng và bán kính bo góc; chỉ quản trị viên thấy nút Admin. Trên desktop, Menu và Admin mở/đóng độc lập và có thể cùng hiển thị.

Trên desktop, mép trên các bảng thẳng hàng với hàng nút; khi mở, nút nằm cạnh mép trong của bảng tương ứng, khi đóng thì trở về mép ngoài màn hình. Nếu cửa sổ nhỏ và cả hai bảng cùng mở, các bảng thu hẹp để chừa chỗ cho nút ở giữa. Trên mobile, các nút vẫn nằm dưới thanh trên cùng và chuyển giữa Menu/Admin trong một bảng dưới cùng, khôi phục mức gần nhất riêng của từng bảng cùng cấp. Nhấn nút của nội dung đang mở thu về mức nhỏ nhất chỉ hiện tiêu đề; nhấn lại nút đó mở ở mức mặc định. Nút zoom nằm dưới hàng nút trên mobile; phần ghi nguồn bản đồ nằm ở dưới cùng bản đồ.

Bản đồ bắt đầu tại vĩ độ `20.9893`, kinh độ `105.7953`, mức zoom API/cũ `18` (zoom MapLibre `17`). Trang hỗ trợ xem bản đồ, tạo và xem ghim, xem hồ sơ, bình chọn aura, Memerboard Hà Nội và bảng Admin. Backend cũng kiểm tra phạm vi bản đồ khi tạo ghim: vĩ độ `20.09`–`21.89`, kinh độ `104.83`–`106.76`.

Chọn ghim từ danh sách ghim trong Menu đưa bản đồ đến ghim và mở popup. Mức zoom là giá trị lớn hơn giữa zoom hiện tại và `zoom` mặc định từ `/api/map-config`, quy đổi bằng cách trừ một: giữ mức đang phóng lớn hơn, còn mức đang thu nhỏ hơn được nâng về mặc định đã cấu hình. Bộ điều khiển ghim nhận mức mặc định từ phần ghép trang thay vì ghi cố định một mức zoom.

Bảng Admin mặc định mở Tổng quan, cùng các tab Meme, Báo cáo và Người dùng. Lịch sử là màn hình con có nút quay lại. Tab và bộ lọc được giữ trong bộ nhớ của trang, không được lưu qua lần tải lại. Chỉ phiên admin được đọc dữ liệu quản trị; thành viên đã đăng nhập gửi báo cáo từ meme. `admin.js` và `admin.css` được tải trên trang bản đồ. Bảng Admin và popup thao tác hỗ trợ cả tiếng Việt lẫn tiếng Anh, dùng chung animation popup hiện có.

HTML popup được ghi nhớ theo marker, nên refresh feed không đổi tái sử dụng cả marker và nội dung; vote và thay đổi ngôn ngữ/nội dung vẫn cập nhật popup đang mở.

Ghim được tải khi mở trang và cập nhật mỗi 10 giây khi tab đang hiển thị. Bảng xếp hạng cập nhật cùng chu kỳ khi bảng đó mở. Lựa chọn ngôn ngữ được lưu trong `localStorage`; cờ mở hướng dẫn chào mừng một lần sau đăng ký dùng `sessionStorage`.

MapLibre 6.13.0 và CSS được chốt phiên bản trên unpkg; thư viện ESM tự xác định worker cùng phiên bản qua Blob URL. `/api/map-config` bổ sung URL `style` Liberty OpenFreeMap; field `tiles` cũ được giữ để tương thích. Giá trị vĩ độ/kinh độ API chỉ được đổi sang kinh độ/vĩ độ tại ranh giới MapLibre. Trừ một từ zoom cũ giữ thang pixel Mercator (tile thế giới 512 px so với 256 px). Tắt thao tác xoay/nghiêng để giữ giao diện bản đồ phẳng. Attribution lấy từ nguồn style qua control MapLibre. Attribution nằm trên sheet mobile và trong vùng bản đồ còn lại trên desktop; hint chừa chiều cao attribution mà không dời ghim đặt vị trí. Ứng dụng không đóng gói dữ liệu bản đồ. Lỗi module/CSS/khởi tạo, style/tile/worker và mất WebGL context hiện thông báo song ngữ; tải lại sau khi kiểm tra kết nối/trình duyệt. Khi hủy trang, bộ hẹn giờ refresh và map được gỡ. Đọc tài liệu [MapLibre](https://maplibre.org/maplibre-gl-js/docs/) và [OpenFreeMap](https://openfreemap.org/quick_start/) trước khi đổi dependency hoặc chính sách hosting.

Icon đầu trang là `assets/icon-128x.png`; icon tab là `assets/icon-64x.png`. Cả hai nằm trong danh sách tài nguyên máy chủ cho phép phục vụ.

### Trang được lưu trữ

Trang cũ được giữ tại [`archive/index_old.html`](../../archive/index_old.html). Đây là bản tham khảo lịch sử, không phải trang vào hiện tại và không được ứng dụng phục vụ.

## Backend và lưu trữ

`server.py` dùng lớp `MemeMapHTTPServer` kế thừa `ThreadingHTTPServer`, cùng `BaseHTTPRequestHandler`, `sqlite3` và các mô-đun khác thuộc thư viện chuẩn Python. Hàng đợi kết nối là 128 thay cho mặc định nhỏ của thư viện chuẩn để nhận các kết nối tải tài nguyên trang đồng thời. Đây là hàng đợi kết nối, không phải giới hạn tốc độ yêu cầu. Máy chủ tạo hoặc nâng cấp cấu trúc cơ sở dữ liệu khi khởi động.

| Bảng | Mục đích |
| --- | --- |
| `users` | Tên hiển thị, trường email nội bộ, username, đường dẫn ảnh đại diện, cờ admin, hash/salt mật khẩu, thời điểm tạo, thời hạn và lý do hạn chế từng quyền |
| `sessions` | Hash token phiên đăng nhập, tham chiếu người dùng, thời hạn |
| `pins` | Người đăng, tọa độ, tiêu đề, nội dung, đường dẫn ảnh tùy chọn, thời điểm tạo, trạng thái ẩn/hiện khi kiểm duyệt |
| `pin_votes` | Một lượt bình chọn `-1` hoặc `+1` cho mỗi cặp người dùng–ghim, kèm thời gian để tính dấu hiệu hoạt động |
| `pin_reports` | Người báo cáo, bản ghi thông tin meme tại thời điểm báo cáo, lý do/chi tiết, trạng thái xem xét và kết quả xử lý; vẫn tồn tại khi meme bị xóa |
| `admin_audit` | Lịch sử thao tác không cho sửa/xóa, kèm thông tin người thực hiện, đối tượng và lý do; vẫn tồn tại khi meme bị xóa |
| `vote_events` | Thời điểm các thao tác bình chọn thành công để phát hiện hoạt động dồn dập; bản ghi quá 30 ngày được dọn khi có lượt bình chọn tiếp theo |
| `schema_migrations` | Phiên bản, tên và thời điểm migration đã hoàn thành |

Mật khẩu được lưu dưới dạng hash tạo bằng PBKDF2 với salt ngẫu nhiên riêng cho từng người. Token phiên được tạo ngẫu nhiên; cơ sở dữ liệu chỉ lưu hash SHA-256 của token. Phiên đăng nhập có thời hạn 30 ngày. Ảnh tải lên có tên ngẫu nhiên và được tách vào thư mục meme hoặc hồ sơ. Phải sao lưu cơ sở dữ liệu cùng thư mục ảnh tải lên.

Đường dẫn ảnh đại diện của tài khoản cũ được bổ sung bằng ảnh mặc định PNG khi cần; tài khoản mới dùng ảnh mặc định WebP. Khi khởi động, máy chủ chuyển các đường dẫn ảnh tải lên cũ sang các thư mục đã tách riêng.

## Xử lý ảnh

- Đầu vào được chấp nhận: ảnh tĩnh JPEG/JPG, PNG và WebP. Biểu mẫu/API tải ảnh hiện không hỗ trợ ảnh động.
- Dung lượng ảnh nguồn tối đa: 10 MiB cho cả ảnh meme lẫn ảnh đại diện.
- Ảnh mới tải lên được mã hóa và lưu thành WebP. Nếu trình duyệt không mã hóa được WebP, máy chủ gọi `cwebp`.
- Trình duyệt thu nhỏ ảnh đại diện để cạnh dài nhất không vượt quá 512 px; máy chủ kiểm tra lại giới hạn này.
- Trình duyệt thu nhỏ ảnh meme để cạnh dài nhất không vượt quá 1600 px trước khi gửi. Hiện chưa áp dụng mức trần dung lượng cố định cho ảnh đầu ra.
- Canvas của trình duyệt xuất WebP với chất lượng 0.82. Nếu không xuất được WebP, trình duyệt gửi PNG để máy chủ chuyển sang WebP, giữ độ trong suốt. Cả trình duyệt và máy chủ đều kiểm tra để từ chối WebP/APNG động.
- Chỉ người đã đăng nhập được xem ảnh tải lên. Ảnh hồ sơ mặc định được phục vụ công khai.

## Đăng nhập và quyền admin

Đăng ký và đăng nhập dùng username. Cơ sở dữ liệu giữ lại cột `email` cũ để sử dụng nội bộ, điền giá trị thay thế dành riêng cho tài khoản mới; giao diện hiện không yêu cầu email.

Quyền admin được biểu diễn bằng `users.is_admin`. Mọi API quản trị kiểm tra cờ này trên máy chủ. Không có endpoint công khai để khởi tạo admin; việc cấp quyền được thực hiện bởi người vận hành thông qua cơ sở dữ liệu. Không công khai thông tin đăng nhập hoặc cấp cờ này cho tài khoản không tin cậy.

Đăng ký mới không cho dùng username `admin`; riêng tên này không tự cấp quyền quản trị. Xem cách cấp quyền cho tài khoản đã có trong [vận hành tại máy](RUNNING.md#cấp-quyền-tài-khoản-admin).

### Hành vi kiểm duyệt

Ẩn meme giữ lại bản ghi, lượt bình chọn và ảnh để quản trị viên có thể khôi phục. Meme đã ẩn không xuất hiện trong danh sách bản đồ thông thường, tổng meme/aura trên hồ sơ hoặc bảng xếp hạng, và không nhận được bình chọn. Danh sách Meme trong Admin là nơi xem nội dung bị ẩn và lý do. Xóa vĩnh viễn gỡ meme, lượt bình chọn và ảnh đã lưu; lịch sử giữ lại thông tin xác định nội dung bị xóa.

Người đã đăng nhập gửi báo cáo; hàng đợi Admin gộp báo cáo theo meme. Trạng thái xem xét và quyết định xử lý được lưu lại. Báo cáo trùng của cùng một người cho cùng meme không tạo thêm mục đang chờ xử lý.

Hạn chế đăng và hạn chế bình chọn là hai quyền riêng, có lý do và thời hạn. Máy chủ kiểm tra chúng với mỗi yêu cầu ghi dữ liệu. Hạn chế tự hết hiệu lực khi hết hạn, không cần tác vụ dọn dẹp định kỳ. Không cho hạn chế chính mình hoặc một quản trị viên khác. Hạn chế không ngăn đăng nhập hoặc đọc bản đồ.

Cảnh báo hoạt động dùng các quy tắc đơn giản trên thao tác đã lưu. Chúng là dấu hiệu cần xem xét, chưa đủ để kết luận lạm dụng, và không tự ẩn nội dung hoặc hạn chế tài khoản. Khoảng thời gian và ngưỡng cụ thể được ghi trong [hướng dẫn vận hành](RUNNING.md#bảng-kiểm-duyệt).

## Ghi chú sản phẩm

Các ưu tiên hiện tại và phần Sticky Note đã sáp nhập được ghi trong [đề xuất phát triển](RECOMMENDATIONS.md). Khi hỗ trợ thành phố mới, cập nhật đồng bộ hành vi bản đồ/frontend và cấu hình phạm vi thành phố/bảng xếp hạng ở backend.

Vùng chữ nhật của bảng xếp hạng Hà Nội (`Regions.leaderboards`) nhỏ hơn vùng cho phép đặt ghim (`Regions.posting`). Vì vậy ghim hợp lệ gần mép ngoài bản đồ có thể không được tính vào bảng xếp hạng thành phố. Địa điểm trên hồ sơ hiện là nhãn Hà Nội cố định, không phải kết quả tra cứu địa danh từ tọa độ.

## Hợp đồng nền tảng sau refactor

`Application(Settings(...))` sở hữu kết nối dữ liệu, kho ảnh và các service riêng cho từng instance. `create_server()` gắn instance vào HTTP server; kiểm thử có thể gọi service trực tiếp hoặc chạy nhiều server với dữ liệu tách biệt. Service nhận dữ liệu và người thực hiện, trả kết quả hoặc `RequestError`; handler chịu trách nhiệm status, cookie và JSON.

`migrations.py` chạy migration có thứ tự dưới transaction `BEGIN IMMEDIATE`; thay đổi schema và bản ghi phiên bản commit cùng nhau. Schema mới hơn ứng dụng bị từ chối. Ảnh legacy được sao chép trước khi commit, chỉ xóa bản cũ sau khi thành công; lỗi không làm mất bản gốc. File đích trùng tên nhưng khác nội dung khiến migration dừng để người vận hành kiểm tra.

`api.js` được dùng bởi trang chính, các module map và Admin. `ApiError` giữ mã lỗi, HTTP status và dữ liệu bổ sung như lý do hạn chế. Chỉ `authentication_required` kích hoạt điều hướng đăng nhập; `invalid_credentials` vẫn hiển thị ở biểu mẫu. Lỗi hủy yêu cầu được giữ nguyên; các thao tác ghi không tự gửi lại.

Tổng meme/aura của hồ sơ được tính trên backend từ toàn bộ ghim đang hiển thị của tác giả, không tính lại từ các ghim đang tải trên map. Module hồ sơ làm mới dữ liệu khi cần và loại bỏ phản hồi cũ sau khi đổi/đóng hồ sơ. Feed hiện vẫn tải toàn bộ ghim mỗi 10 giây; phân trang hoặc lọc theo vùng chưa được triển khai.

`regions.py` là nguồn cấu hình phạm vi hiện tại. Frontend lấy cấu hình qua `/api/map-config`; tạo ghim dùng cùng phạm vi tại backend. Vùng đăng ghim và vùng Memerboard Hà Nội vẫn là hai hình chữ nhật khác nhau, giữ nguyên hành vi cũ. Đây chưa phải ranh giới hành chính hoặc quyền community.

Community tiếp theo cần tách quan hệ địa lý khỏi membership: tối đa một cộng đồng mỗi cấp, phường nơi sống và trường được chọn độc lập. Local/guest sẽ được backend xác định theo cộng đồng; cả hai đều yêu cầu đăng nhập. Refactor này chưa tạo bảng membership, polygon, quyền local/guest hay ứng dụng Android/iOS. Bản đồ hiện dùng MapLibre/OpenFreeMap; tính năng cộng đồng vẫn là đề xuất riêng.
