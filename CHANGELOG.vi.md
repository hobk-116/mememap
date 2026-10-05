# Nhật ký thay đổi

[English](CHANGELOG.md) · **Tiếng Việt** · [Mục lục tài liệu](docs/vi/README.md)

Nhật ký này ghi các thay đổi dự án đã hoàn thành. `Unreleased` nghĩa là các thay đổi chưa được gán phiên bản phát hành công khai. Ngày ghi nhận là ngày của công việc có tài liệu, không phải ngày triển khai server. Thêm mục mới ở trên cùng và đồng bộ với bản tiếng Anh. Đề xuất và tính năng dự kiến thuộc tài liệu kế hoạch.

## Unreleased

### 04/10/2026

#### Đã sửa

- Xóa dòng trống thừa ở cuối `mememap/moderation.py`. Đây chỉ là chỉnh sửa định dạng, không thay đổi hành vi ứng dụng.

### 04/10/2026

#### Changed — Thay đổi

- Sáp nhập hai đề xuất AGENTS đã được chủ dự án duyệt vào đúng vị trí đã nêu: thêm quy tắc căn cứ/phạm vi trước mục đọc API/module và yêu cầu mỗi đề xuất pending ghi vị trí/thao tác sáp nhập dự kiến. Gỡ phần pending sau khi sáp nhập; hướng dẫn tiếng Việt đồng bộ quy tắc đang áp dụng. Hoàn tất rà soát L0 về nội dung, liên kết và tính nhất quán EN/VI; không cần và không chạy kiểm tra ứng dụng.
- Sáp nhập chính sách AGENTS đã được chủ dự án duyệt về mốc phát triển cụ thể, lịch sử phiên bản phân nhóm song ngữ, nhãn ứng viên minor, chọn patch/minor khi phát hành, ghi changelog cho sửa L0 và quyền thao tác Git. Mỗi tác vụ chỉnh sửa đặt đề xuất patch/minor/không cần phiên bản ứng dụng mới cùng lý do gộp đợt ở cuối báo cáo; phân loại tạm thời khi chưa đủ căn cứ, giữ nguyên báo cáo trạng thái L0–L4. Tác vụ chỉnh sửa L1+ thêm nhắc ngắn trước đề xuất phiên bản khi thực sự còn đề xuất AGENTS chờ duyệt sáp nhập; đề xuất chờ chưa có hiệu lực. Đồng bộ hướng dẫn tiếng Việt. Hoàn tất rà soát L0 về nội dung, liên kết và quy tắc song ngữ; không cần và không chạy kiểm tra ứng dụng.
- Xóa mốc trùng và đánh số lại cặp lịch sử phiên bản theo thời gian thành `0.0.1–0.0.38`: bỏ các bản tóm tắt cũ `0.0.22–0.0.26` và bản refactor lặp `0.0.30`, giữ bản nền tảng gốc cùng các chỉnh sửa chi tiết còn lại. Chỉ đổi số tham chiếu phiên bản; tiêu đề, ngày, mô tả và kết quả test lịch sử của các mốc giữ lại không đổi. Các mốc đầu chưa rõ ngày giữ thứ tự tương đối suy đoán đã có. Hoàn tất rà soát L0 về số thứ tự, bảo toàn nội dung, liên kết nội bộ và đồng bộ EN/VI; không cần và không chạy kiểm tra ứng dụng. Số phiên bản trong mục changelog trước là số lịch sử.
- Mở rộng `.gitignore` cho file môi trường cục bộ (giữ `.env.example` mẫu đã bỏ thông tin nhạy cảm có thể đưa lên Git), môi trường ảo Python, database SQLite tùy chỉnh/file phụ, sao lưu ở gốc và file sinh tự động Node.js/Next.js về sau. Đồng bộ hướng dẫn Git EN/VI. Thay đổi cấu hình repo/tài liệu L0; kiểm tra quy tắc bỏ qua và khả năng theo dõi mã nguồn/file mẫu bằng `git check-ignore`, rà soát nội dung/liên kết song ngữ; không cần và không chạy kiểm tra ứng dụng.
- Đổi Menu/Admin cùng cấp trên mobile khôi phục mức kéo gần nhất riêng của từng bảng, kể cả bản thu nhỏ tối đa, tách riêng với mức quay về từ Memerboard. Đóng/mở lại chính bảng đang dùng vẫn mở ở mức mặc định. Khôi phục mở Memerboard đồng thời: mở rộng chiều cao 250 ms cùng chuyển ngang 280 ms ở tốc độ cũ, thay cho animation tuần tự được ghi bên dưới.
- Hướng dẫn cho agent yêu cầu nêu cấp chỉnh sửa L0–L4 và trạng thái sẽ/đang/đã thực hiện trong mọi công việc sửa file, kể cả L0. Khi kiểm tra ứng dụng, phải báo cáo riêng cấp kiểm tra L1–L4, tình trạng và tóm tắt phạm vi/kết quả. Rà soát chỉ sửa tài liệu vẫn ở L0. Đã đồng bộ hướng dẫn tiếng Việt; sửa chính sách lần này được rà soát L0 về diễn đạt, liên kết và tính nhất quán song ngữ, không cần và không chạy kiểm tra ứng dụng.
- Menu/Admin mobile có ba mức kéo: bản thu nhỏ chỉ hiện tiêu đề, cách cạnh 16 px; mức ban đầu/mặc định 230 px, cách cạnh 8 px; mức mở rộng bằng 76% vùng hiển thị, không quá 640 px. Thả tay chọn mức theo ngưỡng một phần ba mỗi khoảng theo hướng kéo, có thể bỏ qua mức giữa. Toàn bộ bản thu nhỏ đều kéo được.
- Bản triển khai ba mức kéo ban đầu mở hoặc chuyển Menu/Admin về chiều cao mặc định, đóng về bản thu nhỏ và chỉ khôi phục chiều cao khi quay về từ Memerboard. Thay đổi ghi nhớ cùng cấp ở trên thay thế quy tắc chuyển bảng đó. Quy tắc hành động dùng chung quy định mở rộng khi tìm kiếm/chọn bộ lọc và về mặc định khi chọn ghim.
- Bốn tab Admin chuyển xuống chân bảng mobile. Mọi tab, kể cả tab đang chọn, đều mở rộng bảng; bấm tab đang chọn giữ nguyên bộ lọc.
- Lần triển khai Memerboard mobile ban đầu dùng hai bước tuần tự: mở rộng 210 ms rồi chuyển ngang 210 ms, tổng 420 ms. Sau đó đã khôi phục mở đồng thời như mục ở trên.

#### Fixed — Sửa lỗi

- Ghim đặt cố định mobile tiếp tục hiện và dùng được ở mức bảng thu nhỏ nhất, dùng một ghim cố định duy nhất khi đặt. Chọn vị trí khi mọi bảng desktop đóng vẫn dùng marker tạm riêng. Đổi chế độ viewport trong lúc mở biểu mẫu giữ tọa độ đã chọn và chuyển cách hiển thị ghim tương ứng.
- Thứ tự lớp map trên desktop/mobile đặt ghim bản đồ dưới ghim cố định, popup meme trên ghim cố định và nút giao diện trên các pane bản đồ. Pane Leaflet riêng bù chuyển động bản đồ để ghim cố định đứng yên trong lúc kéo/zoom.
- Header Menu/Admin mobile giữ khoảng cách ổn định và giống nhau khi kéo hoặc thả về/ra khỏi bản thu nhỏ. Nút lịch sử luôn hiện, không làm đổi chiều cao hàng ngữ cảnh và mở rộng bảng khi vào lịch sử từ bản thu nhỏ.
- Nút Memerboard và chân bảng Admin dùng chung chuyển động trượt xuống liên tục theo tiến độ thu gọn. Giữ nguyên bố cục khi kéo nhanh/chậm, chỉ ẩn sau khi đã đi ra ngoài vùng bị cắt và chuyển động đóng kết thúc. Nội dung bản thu nhỏ không nhận tương tác con trỏ/bàn phím trong lúc đi ra; phần cuộn kết quả Admin chừa chiều cao chân bảng đã đo.
- Nút, bảng và popup mobile dùng quy tắc touch-action cùng xử lý chặn lần chạm thứ hai để hạn chế vô tình phóng trang, gồm nút Admin. Xử lý này bỏ qua vùng thao tác bản đồ, trường nhập và chạm nhiều ngón; vẫn có thể pinch zoom bản đồ.
- Ghim đặt cố định trên mobile nằm dưới thanh đầu trang, bảng và các nút giao diện. Thao tác kéo cũng tiếp tục khi chuyển động đầu tiên của con trỏ rời tay nắm hẹp trước khi được bắt giữ.
- Tăng hàng đợi kết nối của server HTTP lên 128 để nhận lượt tải tài nguyên trang đồng thời. Chẩn đoán trình duyệt đã ghi nhận reset khi tải `shared.js` từ localhost; cấu hình mới giảm nguy cơ tràn hàng đợi nhỏ, chưa chứng minh mọi timeout khởi tạo trước đó đều cùng nguyên nhân.

#### Added — Bổ sung

- Thêm phần `Pending AGENTS proposal — 04/10/2026` ở đầu AGENTS và hướng dẫn tiếng Việt theo yêu cầu chỉ ghi để xem xét, gồm hai đề xuất chưa có hiệu lực: căn cứ/phạm vi công việc và vị trí/thao tác dự kiến cho từng mục pending. Ghi nguyên văn, lý do, ảnh hưởng và vị trí chèn; giữ nguyên quy tắc hiện hành, chưa sáp nhập đề xuất nào. Hoàn tất rà soát L0 về bảo toàn nội dung có hiệu lực, đồng bộ song ngữ và liên kết nội bộ; không cần và không chạy kiểm tra ứng dụng.
- Chia cặp lịch sử phiên bản thành bảy nhóm theo thời gian và gắn nhãn mốc lớn/ứng viên minor tại `0.0.4`, `0.0.13`, `0.0.19`, `0.0.24`, `0.0.36`. Heading nhóm bao ngoài các phiên bản ở heading con; số phiên bản, tiêu đề, ngày và mô tả gốc giữ nguyên. Nhãn không gán bản phát hành minor. Hoàn tất rà soát L0 về bảo toàn nội dung, phạm vi nhóm, nhãn, liên kết nội bộ và đồng bộ EN/VI; không cần và không chạy kiểm tra ứng dụng.
- Sửa và nối cặp [lịch sử phiên bản](docs/vi/history/VERSIONS.md) đến `0.0.44`, sau khi rà soát toàn bộ lịch sử truy cập được trong chín chat liên quan MemeMap. `0.0.27` bắt đầu từ yêu cầu sửa đầu tiên trong Refractor (đăng xuất qua icon tài khoản); `.gitignore` được ghi ở `0.0.44`. Bổ sung 18 mốc chi tiết, dẫn chiếu phần tóm tắt cũ bị trùng, hành vi mobile đã thay thế, lần kiểm tra Python lịch sử bị chặn và công việc Figma ngoài repo hoàn thành một phần. Lượt fork bị lặp, đề xuất và chuẩn bị Git không tính thành sửa runtime mới. Đây là ghi chép hồi cứu, chưa phải bản phát hành/tag; `0.1.0` chưa được chọn. Hoàn tất rà soát tài liệu L0 về nội dung, liên kết và đồng bộ EN/VI; không cần và không chạy kiểm tra ứng dụng.
- Thêm hướng dẫn GitHub/branch/worktree song ngữ để giữ bản Leaflet làm mốc và chạy bản thử MapLibre/OpenFreeMap tách dữ liệu, phiên trình duyệt, tuyến tunnel, cùng kế hoạch chuyển map L4 sau này. Chỉ sửa tài liệu L0; chưa commit/push, tạo branch/worktree, chạy server hay chuyển map. Đã rà soát diễn đạt, liên kết và lệnh EN/VI; không cần và không chạy kiểm tra ứng dụng.
- Kiểm tra phần tử nhận chạm và kéo/zoom có animation trên desktop/mobile trong `check_map_layers.cjs`; bổ sung hồi quy ghi nhớ cùng cấp/menu cha, thời gian animation được khôi phục và đặt ghim/đổi viewport từ bản thu nhỏ trong các nhóm hiện có.
- Kiểm tra chuyển động bảng mobile lấy mẫu khung hình khi mở/đóng và kéo nhanh/chậm bằng tiếng Việt/Anh, xác minh khoảng cách header ổn định, chân bảng liên tục, mở lịch sử từ bản thu nhỏ và bố cục desktop.
- Kiểm tra hồi quy ba mức bảng mobile: ngưỡng theo hướng kéo, bỏ qua mức giữa, khoảng cách cạnh, chạm đúp, pinch bản đồ, thứ tự lớp, điều hướng chân bảng và chuyển động tuần tự/có hủy. Cập nhật kiểm tra chuyển bảng, cuộn và thời gian chuyển động theo quy tắc mới.
- Kiểm tra backend tải đồng thời mọi tài nguyên được cho phép trong ba lượt, xác minh phản hồi đầy đủ.

Chọn L4 cho thao tác mobile dùng chung và thay đổi ở bố cục map, chọn ghim từ danh sách, Memerboard và giao diện Admin. Phục vụ HTTP là module bổ sung ngoài phạm vi giao diện ban đầu; thay đổi hàng đợi được kiểm tra bằng toàn bộ nhóm backend và lượt tải trình duyệt. Đã chạy `python3 -m unittest discover -s tests -p 'test_*.py' -v` (23 kiểm tra đạt), `node tests/test_api_client.cjs` (đạt) và `python3 tests/run_browser.py`. Cả chín nhóm trình duyệt đạt qua lượt đầy đủ và lượt chạy lại riêng `check_foundation_ui.cjs`; một lần kiểm tra hồ sơ trong lượt đầy đủ đọc được chữ hiển thị rỗng nên bài kiểm tra nay chờ popup hồ sơ hiện rõ trước khi đọc tổng theo ngôn ngữ. Không sửa code hồ sơ chạy trong ứng dụng. Cũng rà soát code module/API liên quan, cú pháp JavaScript, tài liệu song ngữ và liên kết nội bộ, xem hình bản thu nhỏ mobile và vị trí chân bảng Admin. Trình duyệt dùng giả lập desktop/mobile Chromium; kiểm tra Safari/iOS/Android thật vẫn cần thực hiện.

Lần sửa header/chân bảng tiếp theo ở trên thuộc L2 với hai module chạy ứng dụng: bố cục map và giao diện Admin; kiểm tra L2. Đã chạy `python3 tests/run_browser.py check_mobile_levels.cjs check_mobile_sheet_ux.cjs check_admin_ui.cjs`, tiếp theo `python3 tests/run_browser.py check_mobile_sheet_motion.cjs check_mobile_drawers.cjs check_browser.cjs check_interactive_pin.cjs check_pin_zoom.cjs`, cùng lượt chạy lại riêng `python3 tests/run_browser.py check_mobile_sheet_motion.cjs` sau khi sửa nhãn lịch sử mong đợi trong bài kiểm tra mới. Cả tám nhóm trình duyệt liên quan đều đạt. Đã rà soát cú pháp JavaScript, giao diện giữa các module sau khi sửa, diễn đạt/liên kết/lệnh song ngữ và hình bản thu nhỏ/giữa lúc kéo. Không sửa module ngoài phạm vi bố cục/Admin đã nêu. Hợp đồng backend/API và giao tiếp dùng chung không đổi nên không cần và không chạy kiểm tra backend/API client cho lần sửa này. Phạm vi dùng giả lập Chromium; chưa kiểm tra iOS/Android thật. Kết quả L4 phía trên thuộc đợt triển khai ba mức kéo/thao tác chạm trước đó.

Lần sửa ghi nhớ cùng cấp/animation/thứ tự lớp mới nhất đã hoàn thành ở L2, kiểm tra L2 trong bố cục map, cách mở Memerboard và đặt ghim. Đặt ghim là luồng chịu tác động bổ sung so với phạm vi bố cục/menu con ban đầu; đã kiểm tra đặt từ bản thu nhỏ, tọa độ được chọn, đổi viewport và lưu mà không đổi API của nó. Đã chạy `python3 tests/run_browser.py check_map_layers.cjs check_mobile_levels.cjs check_mobile_drawers.cjs check_interactive_pin.cjs`, tiếp theo `python3 tests/run_browser.py check_mobile_levels.cjs check_map_layers.cjs check_mobile_sheet_motion.cjs check_mobile_sheet_ux.cjs check_admin_ui.cjs check_browser.cjs check_pin_zoom.cjs`, rồi `python3 tests/run_browser.py check_interactive_pin.cjs check_map_layers.cjs` sau khi bổ sung xử lý đổi viewport lúc đặt ghim và `python3 tests/run_browser.py check_map_layers.cjs` sau khi bài kiểm tra chờ popup hiện rõ trước khi chụp ảnh. Cả chín nhóm liên quan đã đạt qua các lượt này. Lần đầu, bài kiểm tra pinch chạm vào Admin được khôi phục ở mức mở rộng; đã sửa bước chuẩn bị để lộ map trước khi pinch và bài kiểm tra đạt. Đã rà soát code/hợp đồng API sau sửa, cú pháp JavaScript, tài liệu/liên kết/lệnh song ngữ và ảnh desktop/mobile. Hợp đồng backend/API và giao tiếp dùng chung không đổi; không cần và không chạy kiểm tra backend/API client. Phạm vi dùng giả lập Chromium, chưa thử iOS/Android thật. Các đoạn kiểm tra phía trước thuộc từng lần chỉnh sửa trước đó.

### 03/10/2026

#### Fixed — Sửa lỗi

- Menu/Admin mobile không còn đổi kích thước toàn bộ bản đồ/trang theo vùng hiển thị bị bàn phím thu nhỏ trong lúc nhập ở bảng hoặc đóng bàn phím. Trang mobile được cố định để hạn chế cuộn bên ngoài; hành vi bàn phím được kiểm tra bằng giả lập viewport, chưa thử bàn phím trên thiết bị thật.
- Tay nắm và tiêu đề Admin tiếp tục kéo được, kể cả sau khi cuộn qua hết bộ lọc. Chuyển thao tác kéo bằng chạm từ một trường điều khiển sang bảng không còn kết thúc thao tác quá sớm.
- Mở ghim từ danh sách trong Menu giữ zoom lớn hơn mức mặc định đã cấu hình và nâng zoom thấp hơn về mức đó. Mức mặc định lấy từ `/api/map-config`, thay cho giá trị cố định. Bổ sung kiểm tra hồi quy trình duyệt desktop/mobile với cả cấu hình thật và mức mặc định khác; xem [kiểm tra](docs/vi/TESTING.md).

#### Added — Bổ sung

- Nhóm kiểm tra UX bảng mobile trên hai kích thước, thao tác kéo bằng chạm, tìm kiếm/bộ lọc Menu/Admin, giả lập mở/đóng bàn phím, cuộn/khôi phục trạng thái bảng xếp hạng, thu gọn khi chọn ghim, bình chọn không thu gọn và hành vi desktop.
- Recommendations và ghi chép lịch sử Anh/Việt tương ứng, hướng dẫn riêng cho chạy máy/sao lưu/triển khai/kiểm tra và mục lục `archive/` ở gốc, cùng bản dịch tiếng Việt riêng của Sticky Note gốc.
- Changelog tiếng Anh/Việt, mục lục tài liệu tiếng Anh và liên kết đến changelog cùng hướng dẫn cho agent từ cả hai mục lục tài liệu và README dự án.

#### Changed — Thay đổi

- Tập trung/nhập vào ô tìm kiếm và chọn bộ lọc mở rộng bảng Menu/Admin đang dùng trên mobile. Có thể bắt đầu kéo qua hàng tìm kiếm Menu, bộ lọc Admin và lựa chọn thành phố của bảng xếp hạng; trường điều khiển cần chuyển động chủ yếu theo chiều dọc từ 8 px để hạn chế kéo nhầm khi chạm.
- Mở Memerboard sẽ mở rộng bảng mobile và nhớ trạng thái mở rộng/thu gọn của Menu gốc để khôi phục khi quay lại. Tiêu đề và lựa chọn thành phố cố định, chỉ danh sách kết quả cuộn. Bộ điều khiển bố cục cung cấp `setSubview` cho các menu con sau này.
- Chọn ghim trong Menu thu gọn bảng mobile trước khi mở popup, giữ nguyên quy tắc zoom đã cấu hình. Nút gợi ý đặt ghim được căn giữa và có chiều rộng theo nội dung. Các bảng desktop giữ hành vi hiện có.
- Gom tài liệu hiện tại vào `docs/en/` và `docs/vi/`, đưa refactor cùng đề xuất model/Admin cũ vào `history/` của từng ngôn ngữ. Tách hướng dẫn vận hành cũ thành các tài liệu theo mục đích và cập nhật điều hướng trong toàn bộ tài liệu.
- Tổng hợp Sticky Note gốc ở cuối recommendations theo đính chính của chủ dự án: local/guest đều đăng nhập, tối đa một membership mỗi cấp, chọn trường/phường nơi sống độc lập. Chuyển nguyên nội dung `STICKY_NOTE.md` và `assets/index_old.html` vào `archive/` ở gốc.
- Cập nhật bảng đối chiếu tài liệu và liên kết hướng dẫn kiểm tra trong AGENTS theo bố cục đã được cho phép.
- [Quy tắc cho agent](AGENTS.md) và [hướng dẫn tiếng Việt](docs/vi/AGENTS_GUIDE_vi.md) định nghĩa cấp kiểm tra L0–L4. Với thay đổi triển khai, 1–3 module dùng cấp cao nhất liên quan, 4–5 nâng một cấp và trên 5 kiểm tra toàn bộ. Migration và hành vi dùng chung ảnh hưởng lớn vẫn có ngoại lệ kiểm tra toàn bộ; công việc chỉ sửa tài liệu giữ ở L0.
- Sửa tài liệu phải đồng bộ Anh/Việt. Thay đổi triển khai từ HTML/CSS đơn giản trở lên phải cập nhật cả hai changelog và tài liệu song ngữ liên quan; thay đổi AGENTS đã được duyệt cũng cần ghi nhật ký và cập nhật bản dịch.
- Công việc từ L2 trở lên phải đọc code API và module liên quan trước/sau khi sửa, báo cáo thay đổi ở module ngoài phạm vi đã nêu ban đầu.
- Từ lần sửa AGENTS tiếp theo, thay đổi phát sinh trong công việc khác cần chủ dự án duyệt trước khi ghi hoặc sáp nhập. Đề xuất có heading riêng kèm ngày và chưa có hiệu lực trong thời gian chờ duyệt. Yêu cầu đích danh sửa AGENTS cho phép thực hiện trực tiếp phần được yêu cầu; quy trình cũng áp dụng cho file hướng dẫn con.

Các cập nhật tài liệu/chính sách được rà soát diễn đạt, tính nhất quán song ngữ và liên kết nội bộ. Sửa zoom ghim trong menu đã đạt `check_pin_zoom.cjs`, `check_browser.cjs` và kiểm tra cú pháp JavaScript. Kiểm tra zoom dùng viewport desktop/mobile Chromium với cấu hình mặc định thật và khác; không xác nhận kiểm tra thiết bị thật. Hành vi backend/API không đổi nên không chạy lại nhóm backend cho sửa lỗi frontend này.

Kiểm tra UX mobile chọn L3 cho bốn module L2 bị ảnh hưởng: bố cục map, chọn ghim từ danh sách, bảng xếp hạng và giao diện Admin. Đã chạy `python3 tests/run_browser.py`; cả tám nhóm trình duyệt đạt qua các lượt đầy đủ và chạy lại riêng `check_interactive_pin.cjs`, `check_mobile_sheet_ux.cjs`. Một số lượt timeout lúc khởi tạo trang; các nhóm liên quan đạt khi chạy lại riêng, chưa xác định nguyên nhân các timeout khởi tạo này. Cũng kiểm tra cú pháp ba script thay đổi và hai bài kiểm tra trình duyệt, liên kết tài liệu và lệnh Anh/Việt tương ứng. Đã đọc code API và module liên quan trước/sau khi sửa. Hợp đồng backend/API và giao tiếp dùng chung không đổi nên không chạy lại nhóm backend/API client. Phạm vi bao gồm viewport desktop/mobile Chromium và giả lập thay đổi vùng hiển thị khi bàn phím mở; kiểm tra bàn phím Safari/iOS/Android thật vẫn còn cần thực hiện. Không thay đổi module chạy ứng dụng ngoài phạm vi đã nêu.

### 02/10/2026

#### Added — Bổ sung

- Service và cấu hình riêng cho từng ứng dụng trong `mememap/`, migration có phiên bản ghi tại `schema_migrations`, và `GET /api/map-config` yêu cầu đăng nhập.
- Chương trình chạy kiểm tra trình duyệt tạo dữ liệu tạm riêng cho từng nhóm, kiểm tra nền tảng/API client và kiểm tra trình duyệt cho tổng hồ sơ cùng hành vi đăng xuất.

#### Changed — Thay đổi

- Hoàn thành sáu bước refactor nền tảng: sửa giả định kiểm tra hồi quy, tách nghiệp vụ khỏi HTTP, chuẩn hóa migration/cấu hình/lưu ảnh, dùng chung lớp giao tiếp API, tách các trách nhiệm của map, chuyển tổng hồ sơ và phạm vi địa lý sang service backend.
- Schema migration và bản ghi phiên bản commit cùng nhau; ảnh cũ được sao chép trước commit, file đích xung đột khiến migration dừng mà không ghi đè.
- Tổng meme/aura hồ sơ dùng toàn bộ ghim đang hiển thị của tác giả trong database, độc lập các ghim map đã tải. Phạm vi đăng ghim và bảng xếp hạng vẫn tách riêng.

Kết quả kiểm tra lịch sử tại [ghi chú refactor](docs/vi/history/REFACTOR_2026-10-02.md): 22 kiểm tra Python, kiểm tra API client và 6 nhóm trình duyệt đạt ngày 02/10/2026. Trình duyệt dùng Chromium với viewport desktop/mobile; kết quả không xác nhận đã kiểm tra thiết bị iOS/Android thật.

## Hành vi đã có khi bắt đầu nhật ký

Nhật ký này không ghi ngày chính xác của các thay đổi trước đó dưới đây:

- Dòng đăng xuất chỉ xuất hiện khi mở hồ sơ bản thân qua icon tài khoản ở đầu trang, có xác nhận tiếng Việt/Anh. Hồ sơ mở từ ghim, bảng xếp hạng hoặc Admin không hiển thị đăng xuất.
- Menu và Admin dùng chung một bảng dưới cùng trên mobile; các bảng desktop mở độc lập.
- Type annotation ở các module xác thực, ghim và ảnh liên quan được đánh giá trì hoãn để tránh lỗi toán tử union khi import trên trình thông dịch cũ như đã báo. Điều này không xác nhận hỗ trợ mọi phiên bản Python.

Membership community, quyền local/guest, ranh giới polygon, sao lưu tự động, Turnstile và app Android/iOS native chưa phải các tính năng hoàn thành trong nhật ký này.
