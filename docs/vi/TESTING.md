# Kiểm tra

[English](../en/TESTING.md) · **Tiếng Việt** · [Mục lục](README.md)

[AGENTS.md](../../AGENTS.md) quy định chính sách kiểm tra L0–L4 và ngưỡng số module có hiệu lực. Chọn phạm vi theo đó, rồi dùng các lệnh bên dưới. Kết quả lịch sử trong [ghi chú refactor](history/REFACTOR_2026-10-02.md) không xác minh thay đổi về sau.

Chạy từ thư mục gốc repo bằng trình thông dịch Python đã chọn cho dự án. Ví dụ dùng `python3`; dùng lệnh tương đương trên máy host. Kiểm tra ảnh backend cần `cwebp` trong `PATH`. Không dùng dữ liệu đang phục vụ người dùng cho test.

## Kiểm tra hồi quy

Từ thư mục gốc repo, chạy kiểm tra backend:

```sh
python3 -m unittest discover -s tests -p 'test_*.py'
```

`tests/test_server.py` kiểm tra đăng nhập, ảnh và bình chọn, cùng ba lượt tải đồng thời toàn bộ tài nguyên được cho phép để kiểm tra phản hồi đầy đủ, không reset kết nối. `tests/test_admin.py` kiểm tra bảo toàn dữ liệu khi nâng cấp, quyền quản trị, ẩn/khôi phục, quyết định xử lý báo cáo, hạn chế hết hạn, lịch sử, bộ lọc danh sách và dấu hiệu Tổng quan. Các kiểm tra tạo cơ sở dữ liệu và ảnh trong thư mục tạm, dùng cổng local tạm thời. Chúng không dùng `mememap.sqlite3` hoặc ảnh đang phục vụ thực tế.

`tests/check_admin_ui.cjs` dùng Playwright/Chromium với URL do `python3 tests/serve_fixture.py` in ra. Nó kiểm tra gửi/xem xét báo cáo, ẩn/khôi phục, lọc lịch sử, hạn chế theo quyền và gỡ hạn chế, xóa vĩnh viễn, chuyển ngôn ngữ, mở hai bảng đồng thời trên desktop, bảng dùng chung trên mobile và cuộn/kéo bằng thao tác chạm. Đặt `MEMEMAP_TEST_BROWSER` nếu dùng file thực thi Chrome đã cài. Bài kiểm tra thay dữ liệu OpenFreeMap bằng style nền cố định, vẫn dùng engine MapLibre thật từ CDN. Dừng máy chủ dữ liệu tạm bằng Ctrl+C khi xong; cơ sở dữ liệu và ảnh của nó chỉ dùng tạm.

`tests/check_mobile_drawers.cjs` dùng cùng máy chủ dữ liệu tạm để kiểm tra chuyển Menu/Admin trên mobile, kéo mở rộng bằng thao tác chạm, ghi nhớ chiều cao riêng giữa các bảng cùng cấp, giữ điểm neo/bộ lọc, đóng về mức chỉ hiện tiêu đề, hai bảng độc lập trên desktop và đổi kích thước qua ngưỡng mobile.

`tests/check_mobile_sheet_motion.cjs` lấy mẫu khung hình khi đóng/mở bằng nút và kéo bằng chạm nhanh/chậm ở 390 × 844 (tiếng Việt) và 360 × 740 (tiếng Anh). Kiểm tra vị trí tương đối của tiêu đề/ngữ cảnh Menu/Admin ổn định và giống nhau, chân bảng trượt đồng bộ với chiều cao, không biến mất khi còn nằm trong bảng, nội dung bản thu nhỏ được đặt inert và nút lịch sử vẫn hiện, mở được từ bản thu nhỏ. Cũng kiểm tra hai bảng desktop độc lập cùng bố cục tab desktop ban đầu, lưu hình bản thu nhỏ/giữa lúc kéo để xem lại giao diện.

`tests/check_mobile_levels.cjs` kiểm tra cả ba mức chiều cao, khoảng thả tay dưới/trên một phần ba ở cả hai hướng, bỏ qua mức giữa, khoảng cách cạnh 16 px và kéo từ toàn bộ bản thu nhỏ. Sự kiện chạm thật trong Chromium kiểm tra chạm đúp Admin và popup hồ sơ không phóng trang, cùng pinch zoom bản đồ bằng hai ngón. Nhóm này kiểm tra nút giao diện ở trên ghim đặt cố định, vị trí chân bảng và mở rộng từ cả bốn tab Admin kể cả tab đang chọn, ghi nhớ mức giữa các bảng cùng cấp kể cả `peek`, mở lại chính bảng đang đóng ở mức mặc định, mức quay về riêng của Memerboard, mở rộng/chuyển ngang đồng thời ở tốc độ khôi phục 250/280 ms và đổi bảng cùng cấp trong lúc mở. Cũng kiểm tra hai bảng desktop sau khi đổi kích thước. `check_browser.cjs` kiểm tra thêm nhiều lượt mở rộng/trở về mặc định bằng chuột ở viewport mobile, giữ nguyên điểm neo bản đồ.

`tests/check_map_layers.cjs` kiểm tra phần tử thực sự nhận chạm trên desktop/mobile: ghim bản đồ dưới ghim đặt cố định, nội dung popup meme trên ghim đó sau khi hiện rõ và nút giao diện trên mọi pane bản đồ. Nhóm này kiểm tra ghim cố định đứng yên khi kéo/zoom tức thì và có animation, đặt ghim từ `peek` trên mobile và giữ hành vi desktop khi mọi bảng đóng. `check_interactive_pin.cjs` kiểm tra thêm tọa độ được chọn, kéo bản đồ, hủy/mở lại, lưu và đổi viewport trong lúc đặt ghim: bản thu nhỏ mobile dùng ghim cố định, còn chọn vị trí khi đóng bảng desktop dùng marker tạm riêng.

`tests/check_mobile_sheet_ux.cjs` kiểm tra viewport mobile 390 × 844 và 360 × 740: tự mở rộng khi tìm kiếm/chọn bộ lọc, kéo bằng thao tác chạm bắt đầu quanh các trường điều khiển và trên tiêu đề Admin sau khi cuộn qua hết bộ lọc, tập trung ô nhập và gửi bộ lọc, nút gợi ý đặt ghim theo chiều dài chữ, mở rộng khi vào Memerboard và khôi phục cả hai trạng thái menu gốc, cố định tiêu đề/thành phố khi cuộn kết quả và thu gọn khi chọn ghim trong khi bình chọn vẫn giữ bảng mở rộng. Nó cũng kiểm tra desktop sau khi đổi kích thước. Giả lập đổi chiều cao `visualViewport` kiểm tra vị trí trang/bản đồ/chân bảng ổn định khi tìm kiếm Menu/Admin và lúc bàn phím đóng, sau đó tiếp tục theo thay đổi thanh trình duyệt. Giả lập này không mở bàn phím hệ điều hành; cần thử riêng tập trung ô nhập, gõ chữ, bộ chọn, đóng bàn phím và xoay trên iOS/Android thật.

```sh
python3 tests/run_browser.py check_mobile_sheet_motion.cjs check_mobile_levels.cjs check_mobile_sheet_ux.cjs check_mobile_drawers.cjs check_pin_zoom.cjs check_map_layers.cjs
```

Bộ kiểm tra chuyển động bảng mobile cũng đo khoảng cách nút đặt ghim và dòng nguồn sau cập nhật bố cục, trước khi vẽ, khi kéo/thả và vào/quay lại Nông trại hào quang; dữ liệu bản đồ thử có dòng nguồn.

## Chạy toàn bộ kiểm tra nền tảng

```sh
python3 -m unittest discover -s tests -p 'test_*.py'
node tests/test_api_client.cjs
python3 tests/run_browser.py
```

Lệnh cuối tự tạo một server/database/ảnh tạm riêng cho từng nhóm `check_*.cjs` rồi dọn sau khi chạy. Có thể truyền tên một hoặc nhiều file để chỉ chạy các nhóm đó. Cần Node.js, Playwright và Chromium/Chrome; đặt `MEMEMAP_NODE` nếu Node nằm ngoài `PATH`, `NODE_PATH` nếu Playwright ở ngoài repo, và `MEMEMAP_TEST_BROWSER` nếu dùng Chrome đã cài.

`test_foundation.py` kiểm tra service độc lập HTTP, tổng hồ sơ, tách dữ liệu giữa các instance, dọn ảnh khi database lỗi, migration rollback/chạy lại và xung đột ảnh. `test_api_client.cjs` kiểm tra JSON, chi tiết lỗi, điều hướng khi phiên hết hạn và hủy yêu cầu. Hai nhóm browser mới kiểm tra hồ sơ với feed chỉ chứa một phần ghim, nguồn mở hồ sơ, đăng xuất lỗi và xác nhận/hủy đăng xuất trên hai trang, hai ngôn ngữ, desktop/mobile.

Các kiểm tra trình duyệt chạy trên Chromium và dùng style nền cố định thay dữ liệu bản đồ công cộng; viewport mobile và giả lập fallback ảnh không thay thế thử trên Safari/iPhone/Android thật.

`check_pin_zoom.cjs` kiểm tra chọn ghim trong Menu khi zoom dưới, bằng và trên mức mặc định ở viewport desktop/mobile. Nó cũng cung cấp mức mặc định khác qua phản hồi map-config để phát hiện giá trị zoom ghi cố định, và xác nhận popup của ghim đã chọn mở ra. Trên mobile, nó kéo mở rộng bảng trước mỗi lần chọn vì chọn ghim nay sẽ thu gọn bảng:

```sh
python3 tests/run_browser.py check_pin_zoom.cjs check_browser.cjs
```

## Kiểm tra migration MapLibre

`tests/map_fixture.cjs` thay style OpenFreeMap trong kiểm tra hành vi để không phụ thuộc tile công khai. ESM/CSS/worker MapLibre thật đã chốt phiên bản vẫn tải từ CDN. `check_maplibre.cjs` kiểm tra tâm API, thang pixel z17 so với z18 cũ, mở marker bằng bàn phím và thông báo VI/EN khi module/CSS/style/worker lỗi hoặc mất WebGL context. Các assertion ghim, layering, sheet, Admin, profile và logout dùng tọa độ/selector MapLibre, giữ phạm vi hành vi. Kiểm tra zoom mặc định khi chọn ghim tính phép trừ một; assertion touch zoom cho phép zoom liên tục của engine. Kiểm tra tải OpenFreeMap thật/attribution riêng với bộ suite cố định; WebGL/chạm/bàn phím/hiệu năng trên thiết bị thật tách khỏi giả lập.

`check_browser.cjs` còn đếm lần cập nhật nội dung popup qua refresh 10 giây: popup đóng không đổi không được dựng lại; vote thành công phải cập nhật aura đang hiển thị.
