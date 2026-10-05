# Lịch sử phiên bản MemeMap — 0.0.x

[English](../../en/history/VERSIONS.md) · **Tiếng Việt** · [Mục lục](../README.md) · [Changelog](../../../CHANGELOG.vi.md)

Tổng hợp ngày **04/10/2026**, theo yêu cầu đánh số từ **0.0.1**, chỉ trong dải **0.0.x**, chưa nâng lên **0.1.0**. Mốc tổng hợp cuối của tài liệu này là **0.0.38**.

## Cách đọc và căn cứ

Đây là các mốc phát triển được đánh số hồi cứu từ cuộc trò chuyện và tài liệu repo. Chúng chưa phải các bản phát hành công khai, Git tag hoặc các bản mã nguồn có thể checkout riêng. Git hiện có một commit `4ea8a00` tên `Initial MemeMap project` ngày 01/10/2026 và chưa có tag; không đủ căn cứ ghép mỗi mốc bên dưới với một commit.

Các lần chỉnh nhỏ cùng mục tiêu được gộp theo kết quả có ý nghĩa. Thứ tự thể hiện tiến trình phát triển ở mức nhóm; những việc làm xen kẽ không được suy diễn thành thứ tự commit chính xác. Giai đoạn đầu chưa có ngày hoàn thành riêng, được ghi rõ là **chưa xác định ngày**. Ngày ở giai đoạn sau lấy từ changelog/ghi chép lịch sử, không phải ngày phát hành. 04/10/2026 là ngày tổng hợp tài liệu, không phải ngày hoàn thành tất cả tính năng.

Giữ nguyên nhãn 0.0.1–0.0.20 đã có. Các mốc 0.0.21–0.0.38 đã tóm tắt một phần công việc từ nhiều chat. Theo yêu cầu chủ dự án, 0.0.21 bắt đầu ghi chi tiết theo trình tự từ yêu cầu sửa đầu tiên trong **Refractor**, thay vì chỉ nối các thay đổi chưa xuất hiện trong phần tóm tắt. Phần trùng là hai cách ghi cùng công việc, không phải triển khai hay phát hành thêm lần nữa. Ngày của phần nối tiếp lấy từ ghi chép chat theo múi giờ dự án. Mọi kết quả test bên dưới là lịch sử, không phải kiểm tra chạy lại cho lần cập nhật tài liệu này.

- **S1 — Cuộc trò chuyện:** các quyết định và đợt chỉnh sửa sản phẩm; đối chiếu với [kiến trúc hiện tại](../ARCHITECTURE.md), [API](../API.md), nội dung hai trang và các module liên quan để không coi mọi yêu cầu là bằng chứng đã hoàn thành.
- **S2 — Lịch sử refactor:** [đợt giao diện và nền tảng](REFACTOR_2026-10-02.md).
- **S3 — Changelog hiện có:** [thay đổi có ngày và kết quả kiểm tra lịch sử](../../../CHANGELOG.vi.md).
- **S4 — Tài liệu vận hành và kế hoạch:** [chạy tại máy](../RUNNING.md), [sao lưu](../BACKUP.md), [triển khai](../DEPLOYMENT.md), [kiểm tra](../TESTING.md), [Git](../GIT_WORKFLOW.md), [recommendations](../RECOMMENDATIONS.md), [ghi chép Admin cũ](MODEL_AND_ADMIN_NOTES.md) và [archive](../../../archive/README.vi.md).
- **S5 — Rà soát chat ngày 04/10/2026:** toàn bộ lịch sử truy cập được trong chín chat liên quan MemeMap liệt kê bên dưới, chỉ tính một lần các lượt bị lặp do fork. Ghi nhận sửa file/công cụ và báo cáo hoàn tất giúp phân biệt chỉnh sửa đã làm với câu hỏi và đề xuất.

Changelog tiếp tục ghi công việc theo ngày trong `Unreleased`. Tài liệu này cung cấp cách nhìn theo mốc phiên bản; khi có khác biệt với hành vi cũ, tài liệu kiến trúc/API hiện hành mô tả trạng thái đang dùng.

## Nhóm 1 — Sản phẩm cốt lõi

*Phạm vi: `0.0.1–0.0.5`.*

### 0.0.1 — Dựng lại giao diện bản đồ

*Ngày: chưa xác định. Căn cứ: S1 và trang HTML trong archive.*

- **Thay đổi:** bắt đầu lại giao diện MemeMap, giữ trang cũ làm tham khảo dưới tên `index_old.html`.
- **Thay đổi:** tập trung bản đồ Leaflet vào khu vực Đại học Hà Nội; chốt tâm `20.9893, 105.7953` và zoom `18` sau các lần thử mức zoom khác.
- Trang tham khảo cũ về sau được chuyển đến `archive/index_old.html` ở mốc 0.0.30.

### 0.0.2 — Tách trang chính và bản đồ, thêm tiếng Anh

*Ngày: chưa xác định. Căn cứ: S1, kiến trúc.*

- **Thay đổi:** `index.html` trở thành trang chính, giới thiệu/hướng dẫn; `landing.html` là trang bản đồ tương tác.
- **Bổ sung:** giao diện tiếng Anh bên cạnh tiếng Việt.
- **Bổ sung:** hướng dẫn nhanh ngay trên trang bản đồ, mở nội dung tại chỗ thay cho điều hướng về trang chính.

### 0.0.3 — Đăng ký, đăng nhập bằng username

*Ngày: chưa xác định. Căn cứ: S1, API và mã xử lý tài khoản.*

- **Bổ sung:** đăng ký, đăng nhập và phiên đăng nhập; nút vào bản đồ thay đổi theo trạng thái đăng nhập.
- **Thay đổi:** ẩn email khỏi biểu mẫu và dùng username để đăng nhập; gợi ý username từ tên hiển thị.
- **Sửa lỗi:** chuẩn hóa chữ tiếng Việt khi gợi ý username, bao gồm các trường hợp dấu như `ạ`, `ầ`, `ẳ`; kiểm tra username và mật khẩu ở backend. Các gợi ý nhập liệu được điều chỉnh theo chế độ đăng ký/đăng nhập.

### 0.0.4 — Lưu ghim và bình chọn aura

> **Mốc lớn — ứng viên minor:** Sản phẩm cốt lõi: tài khoản, ghim và bình chọn.

*Ngày: chưa xác định. Căn cứ: S1, API.*

- **Bổ sung:** lưu ghim với tọa độ, tiêu đề, nội dung và người đăng; hiển thị username trên meme.
- **Bổ sung:** bình chọn aura dương/âm, đổi lựa chọn hoặc bỏ bình chọn bằng cách nhấn lại.
- **Thay đổi:** người đăng không thể tự bình chọn ghim của mình; nút được vô hiệu hóa và backend kiểm tra quyền.
- **Bổ sung:** tải lại ghim/aura mỗi 10 giây khi trang đang hiển thị.

### 0.0.5 — Memerboard Hà Nội

*Ngày: chưa xác định. Căn cứ: S1, API và module bảng xếp hạng.*

- **Bổ sung:** bảng xếp hạng người đăng theo aura và số ghim, ban đầu chỉ hỗ trợ Hà Nội.
- **Thay đổi:** Memerboard trở thành màn hình con trong Menu, có nút quay lại và chuyển động ngang theo hướng điều hướng.
- **Thay đổi:** hoàn thiện nhãn tiếng Việt thành “Nông trại hào quang”; hạng 1/2/3 có màu vàng/bạc/đồng, các hạng sau dùng màu mặc định. Các chỉnh chữ/màu này được gộp vào mốc của tính năng.

## Nhóm 2 — Giao diện và hồ sơ

*Phạm vi: `0.0.6–0.0.15`.*

### 0.0.6 — Ghim cố định và chuyển động bản đồ

*Ngày: chưa xác định. Căn cứ: S1, S2.*

- **Bổ sung:** ghim đặt tại tâm phần bản đồ còn nhìn thấy sau khi trừ vùng Menu.
- **Thay đổi:** ghim đứng yên trên màn hình khi kéo bản đồ; chọn vị trí để đăng meme đưa ghim tới điểm đã chọn, đóng biểu mẫu trả về trạng thái chờ đặt.
- **Sửa lỗi:** phối hợp vị trí ghim và bản đồ khi đóng/mở Menu hoặc đổi kích thước cửa sổ; giảm hiện tượng ghim đuổi theo chuyển động hoặc bị mất.
- Các thử nghiệm fade và tốc độ được gộp theo luồng này; quy tắc mobile mới nhất nằm ở 0.0.33–0.0.36.

### 0.0.7 — Bảng kéo trên mobile

*Ngày: chưa xác định. Căn cứ: S1, S2.*

- **Bổ sung:** Menu mobile dạng bảng kéo từ dưới, cuộn danh sách và điều khiển bằng thao tác chạm.
- **Sửa lỗi:** rìa bảng nhảy tới ngón tay khi bắt đầu kéo; bản đồ trôi dần sang đông sau nhiều lần kéo.
- **Thay đổi:** mở rộng vùng bắt đầu kéo tới tiêu đề, điều chỉnh nút Menu/Admin, nhãn Menu và vị trí zoom phù hợp mobile.
- Bố cục nút/bảng đã qua nhiều lần thay đổi; các mốc 0.0.24 và 0.0.33–0.0.36 mô tả những lần thay thế về sau.

### 0.0.8 — Popup hướng dẫn và thao tác đặt meme

*Ngày: chưa xác định. Căn cứ: S1, giao diện hiện tại.*

- **Thay đổi:** hướng dẫn nhanh mở bằng popup từ thanh trên cùng; nội dung hướng dẫn được đồng bộ trên hai trang.
- **Thay đổi:** dùng animation chung với bảng đặt ghim cho popup; hướng dẫn tự mở sau đăng ký mới.
- **Thay đổi:** lời nhắc chọn vị trí trở thành nút “Đặt ghim mới hoặc chạm vào bản đồ”, có cùng tác dụng mở biểu mẫu; bỏ các nút đặt ghim trùng lặp theo các lần chỉnh giao diện.

### 0.0.9 — Ảnh meme và phạm vi bản đồ

*Ngày: chưa xác định. Căn cứ: S1, kiến trúc, API.*

- **Bổ sung:** lưu ảnh meme trên máy chủ, đặt tên ngẫu nhiên và chuẩn bị/nén ảnh trước khi gửi.
- **Thay đổi:** giới hạn ảnh nhập ở 10 MiB, chấp nhận JPG/JPEG/PNG/WebP tĩnh, ghi điều kiện dưới trường ảnh; chưa hỗ trợ ảnh động.
- **Thay đổi:** phạm vi bản đồ được điều chỉnh từ vùng quanh điểm mặc định sang vùng rộng khoảng 100 km; backend hiện dùng giới hạn vĩ độ `20.09`–`21.89`, kinh độ `104.83`–`106.76`.
- Quy tắc mọi ảnh mới thành WebP và tương thích Safari được hoàn thiện ở 0.0.13. Phạm vi trên là hình chữ nhật, không phải ranh giới hành chính hoặc đường tròn chính xác.

### 0.0.10 — Quyền admin và bảng quản trị ban đầu

*Ngày: chưa xác định. Căn cứ: S1, API và kiến trúc.*

- **Bổ sung:** quyền admin để xóa ghim của người dùng; ban đầu thao tác được đặt trong danh sách ghim.
- **Bổ sung:** bảng Admin riêng và nút mở theo quyền của tài khoản.
- **Sửa lỗi:** bảng hoặc nút Admin/Menu chồng nhau, icon bị trôi, ghim mất hoặc map tự di chuyển khi đổi bảng.
- Tài liệu này không ghi lại mật khẩu thử nghiệm. Quyền admin hiện được kiểm tra qua `is_admin`, không tự cấp chỉ vì username là `admin`; cách cấp quyền nằm trong hướng dẫn vận hành.

### 0.0.11 — Nội dung hướng dẫn và thuật ngữ song ngữ

*Ngày: chưa xác định. Căn cứ: S1 và nội dung giao diện.*

- **Thay đổi:** dùng “Meme” trong biểu mẫu đăng bài; hướng dẫn dùng “đăng meme”, rút gọn các mô tả không cần thiết.
- **Thay đổi:** “Canh tác hào quang”/“Aurafarm”, cách viết `+aura`/`−aura`, tên “Nông trại hào quang” cho Memerboard tiếng Việt.
- **Thay đổi:** nút ngôn ngữ dùng cờ Mỹ/Việt Nam; nhãn địa điểm được rút gọn thành Hà Nội, vẫn là nhãn cố định.

### 0.0.12 — Hồ sơ người dùng

*Ngày: chưa xác định. Căn cứ: S1, API.*

- **Bổ sung:** icon hồ sơ ở đầu trang chính và trang bản đồ; hồ sơ gồm ảnh đại diện, tên, username, Hà Nội, số meme và aura.
- **Thay đổi:** căn giữa tên/username dưới ảnh, tên đậm, username nhỏ hơn; aura dương không thêm dấu cộng, aura âm giữ dấu trừ.
- **Bổ sung:** xem hồ sơ người đăng từ username trên ghim và từ tên/username trong Memerboard.
- **Sửa lỗi:** hồ sơ không mở trên trang chính, popup nằm dưới bản đồ và ảnh đại diện người khác không hiển thị.

### 0.0.13 — Đổi avatar, WebP và Safari

> **Mốc lớn — ứng viên minor:** Hồ sơ và xử lý ảnh.

*Ngày: chưa xác định. Căn cứ: S1, S2, kiến trúc và API.*

- **Bổ sung:** nhấn ảnh hồ sơ bản thân để chọn ảnh mới; tách ảnh thành `uploads/memes/` và `uploads/profiles/`.
- **Thay đổi:** mọi ảnh tải lên mới được lưu thành WebP; ảnh đại diện tối đa 512 × 512 px, ảnh meme có cạnh dài nhất tối đa 1600 px khi xử lý ở trình duyệt. Chưa áp dụng mức trần dung lượng ảnh đầu ra.
- **Thay đổi:** tài khoản mới dùng ảnh mặc định WebP; giữ file PNG để tương thích đường dẫn tài khoản cũ. Avatar dùng cùng điều kiện ảnh tĩnh và giới hạn đầu vào 10 MiB; ẩn dòng hướng dẫn điều kiện trong hồ sơ.
- **Sửa lỗi:** khi canvas không xuất được WebP, gửi PNG và dùng `cwebp` trên máy chủ. Kiểm tra fallback giả lập không tương đương kiểm tra Safari thật.

### 0.0.14 — Tách cách mở hồ sơ và sửa fade-out

*Ngày: chưa xác định. Căn cứ: S1, S2.*

- **Thay đổi:** trên desktop, hồ sơ mở từ icon tài khoản nằm góc trên bên phải dưới thanh thao tác, không làm tối nền; hồ sơ mở từ ghim vẫn dùng popup giữa màn hình, kể cả ghim của bản thân.
- **Sửa lỗi:** giữ đúng kiểu hiển thị suốt fade-out, tránh nhảy về giữa màn hình lúc đóng.
- **Thay đổi:** liên kết người đăng chỉ có gạch chân khi hover; dữ liệu hồ sơ tải trễ không được ghi đè hồ sơ khác vừa mở hoặc mở lại bảng đã đóng.

### 0.0.15 — Nhận diện và nội dung trang chính

*Ngày: chưa xác định. Căn cứ: S1 và file giao diện hiện tại.*

- **Thay đổi:** sau các thử nghiệm Space Grotesk, Comic Sans và VNF-Comic Sans, chốt font Nunito.
- **Thay đổi:** thử biểu tượng `☺︎` và SVG, rồi dùng `assets/icon-128x.png` trên trang để xử lý lỗi hiển thị; tab dùng `assets/icon-64x.png`.
- **Sửa lỗi:** tiêu đề tiếng Việt giữ “MemeMap — Trang chính” sau đăng nhập; tiếng Anh dùng “MemeMap — Home”.
- **Thay đổi:** dòng cuối trang thành “Vibe-coded by GPT-6 Luna & Sol ✳”.

## Nhóm 3 — Cấu trúc mã và quản trị

*Phạm vi: `0.0.16–0.0.20`.*

### 0.0.16 — Refactor giao diện và các lỗi tích lũy

*Ngày: chưa xác định riêng. Căn cứ: S2, phần refactor giao diện trước đó.*

- **Thay đổi:** tách CSS/JavaScript khỏi hai HTML; dùng chung typography, popup, hồ sơ và xử lý ảnh.
- **Thay đổi:** gom hình học ghim, map, nút và bảng kéo vào `map-layout.js`; tính theo tọa độ neo tuyệt đối.
- **Sửa lỗi:** tái sử dụng marker khi refresh, giữ popup đang mở, chờ xử lý ảnh trước khi gửi và bỏ kết quả ảnh cũ khi chọn ảnh khác.
- **Sửa lỗi:** đóng kết nối SQLite sau sử dụng, đổi avatar theo transaction và dọn đúng ảnh cũ; phục vụ rõ các asset cùng chính sách cache.
- **Bổ sung:** kiểm tra backend/trình duyệt với database và ảnh tạm. Kết quả lịch sử nằm ở ghi chép refactor.

### 0.0.17 — Ghim tương tác thứ hai

*Ngày: chưa xác định. Căn cứ: S1, S2 và kiến trúc.*

- **Bổ sung:** marker tạm có animation riêng khi chọn vị trí lúc các bảng đóng; marker đứng tại tọa độ được chọn và được gỡ khi hủy/lưu.
- **Bổ sung:** có thể mở thao tác đặt ghim từ chính ghim cố định.
- **Thay đổi về sau:** từ 0.0.36, marker tạm chỉ dành cho desktop khi mọi bảng đóng; mobile dùng ghim cố định cả ở mức bảng nhỏ nhất.

### 0.0.18 — Bảng Admin phía đối diện trên desktop

*Ngày: chưa xác định. Căn cứ: S1, kiến trúc.*

- **Thay đổi:** Admin chuyển sang phía đối diện Menu; cho phép mở đồng thời cả hai trên desktop.
- **Thay đổi:** nút Admin nằm dưới hàng hồ sơ, cùng hàng và cùng bo góc với nút Menu; mép trên bảng thẳng với hàng nút.
- **Thay đổi:** bố cục map tính vùng còn lại giữa hai bảng. Bố cục mobile tiếp tục được thay thế ở các mốc sau.

### 0.0.19 — Bảng kiểm duyệt đầy đủ

> **Mốc lớn — ứng viên minor:** Hệ thống kiểm duyệt.

*Ngày: chưa xác định riêng. Căn cứ: S1, API và tài liệu vận hành; thiết kế cũ đối chiếu bằng S4.*

- **Bổ sung:** bốn tab Tổng quan, Meme, Báo cáo, Người dùng; lịch sử là màn hình con có nút quay lại.
- **Bổ sung:** tìm kiếm/lọc/sắp xếp meme, xem trên bản đồ, ẩn/khôi phục theo lý do và xóa vĩnh viễn trong thao tác quản trị.
- **Bổ sung:** người đã đăng nhập báo cáo meme, gộp theo meme, xử lý trạng thái; một báo cáo chưa xử lý/người/meme và tối đa 10 lần gửi trong một giờ gần nhất.
- **Bổ sung:** hạn chế đăng/bình chọn riêng hoặc cả hai, thời hạn 1 giờ/24 giờ/7 ngày/30 ngày; ghi lịch sử và tự hết hiệu lực theo thời hạn.
- **Bổ sung:** thống kê và dấu hiệu `posting_burst`, `duplicate_content`, `vote_burst` để admin xem xét, không tự xử phạt.
- **Bảo mật:** kiểm tra quyền ở backend; meme ẩn không tính vào feed/tổng hồ sơ/bảng xếp hạng và không nhận bình chọn; lịch sử/báo cáo giữ thông tin sau xóa. Ảnh meme ẩn chỉ admin được đọc.

### 0.0.20 — README và tài liệu tiếng Việt

*Ngày: chưa xác định riêng. Căn cứ: S1 và các cặp tài liệu hiện có.*

- **Bổ sung:** README, kiến trúc, API và hướng dẫn vận hành cho toàn repo; bổ sung mô tả kiểm duyệt sau khi triển khai.
- **Bổ sung:** README tiếng Việt, bản dịch các tài liệu kỹ thuật và mục lục; giữ nguyên tên lệnh/API/trường dữ liệu.
- **Thay đổi:** đối chiếu đề xuất với chức năng đã có, ghi rõ các phần còn cần phát triển. Bố cục tài liệu được tổ chức lại ở 0.0.30.

## Nhóm 4 — Củng cố nền tảng

*Phạm vi: `0.0.21–0.0.25`.*

### 0.0.21 — Đăng xuất từ hồ sơ mở qua icon tài khoản

*Ngày ghi nhận: 02/10/2026. Căn cứ: S5, đối chiếu S2–S4 và mã liên quan khi có.*

- **Bổ sung:** Thêm dòng đăng xuất trên trang chính/bản đồ, chỉ khi người đang đăng nhập mở hồ sơ của mình qua icon tài khoản.
- **Thay đổi:** Hồ sơ mở qua ghim, Memerboard hoặc các lối khác không có dòng này, kể cả hồ sơ của chính người xem. Đăng xuất trên bản đồ đưa về trang chính.
- **Kiểm tra lịch sử:** Chat ghi nhận kiểm tra desktop/mobile bằng tiếng Việt/Anh. Bước xác nhận được thêm tiếp ở 0.0.22.

### 0.0.22 — Xác nhận đăng xuất

*Ngày ghi nhận: 02/10/2026. Căn cứ: S5, đối chiếu S2–S4 và mã liên quan khi có.*

- **Bổ sung:** Thêm xác nhận tiếng Việt/Anh trước khi đăng xuất trên cả hai trang; hủy giữ nguyên phiên đăng nhập và trang hiện tại.
- **Kiểm tra lịch sử:** Kiểm tra được ghi nhận bao phủ xác nhận/hủy ở kích thước desktop/mobile trong cả hai ngôn ngữ.

### 0.0.23 — Bảng Menu/Admin dùng chung trên mobile

*Ngày ghi nhận: 02/10/2026. Căn cứ: S5, đối chiếu S2–S4 và mã liên quan khi có.*

- **Thay đổi:** Menu và Admin dùng chung một bảng mobile, chuyển nội dung khi chọn nút. Desktop giữ hai bảng độc lập.
- **Thay đổi:** Hành vi chuyển ban đầu giữ chiều cao bảng, bộ lọc và trạng thái đặt ghim. Quy tắc thao tác và ghi nhớ được sửa tiếp ở 0.0.33 và 0.0.36.
- **Kiểm tra lịch sử:** Chat ghi nhận kiểm tra kéo/chuyển bảng mobile và luồng Admin liên quan; mục này không xác nhận kiểm tra trên thiết bị thật.

### 0.0.24 — Nền tảng backend/frontend tách module

> **Mốc lớn — ứng viên minor:** Nền tảng kiến trúc và API.

*Ngày ghi nhận: 02/10/2026. Căn cứ: S2 và S3.*

- **Thay đổi:** tách `server.py` thành lớp HTTP và các service `mememap/`; `Application(Settings(...))` giữ database, ảnh và dịch vụ riêng cho mỗi instance.
- **Bổ sung:** migration có phiên bản trong `schema_migrations`, rollback/retry, sao chép ảnh trước commit và dừng khi file đích xung đột; cấu hình đường dẫn dữ liệu và cookie bằng môi trường.
- **Thay đổi:** dùng `api.js` chung; chia map thành pins, composer, profile, leaderboard, copy và layout. Tổng hồ sơ lấy từ database, độc lập feed đang tải.
- **Bổ sung:** `GET /api/map-config` và cấu hình địa lý tập trung; phạm vi đăng ghim và Memerboard vẫn riêng.
- **Hành vi đã có khi ghi nhận mốc:** Menu/Admin mobile dùng chung một bảng; đăng xuất chỉ từ hồ sơ mở qua icon bản thân và có xác nhận. Trình tự chỉnh sửa có ngày được ghi chi tiết ở 0.0.21–0.0.24.
- **Kiểm tra lịch sử:** tài liệu ghi 22 kiểm tra Python, API client và 6 nhóm trình duyệt đạt ngày 02/10/2026; không phải kết quả kiểm tra của lần viết tài liệu này.
- **Trình tự chi tiết:** 0.0.21–0.0.25; các mục này ghi cùng công việc.

### 0.0.25 — Hoãn đánh giá type annotation

*Ngày ghi nhận: 02/10/2026. Căn cứ: S5, đối chiếu S2–S4 và mã liên quan khi có.*

- **Sửa lỗi:** Thêm `from __future__ import annotations` vào `mememap/auth.py`, `mememap/media.py` và `mememap/pins.py` sau lỗi `TypeError: unsupported operand type(s) for |: 'type' and 'NoneType'` trên trình Python cũ.
- **Kiểm tra lịch sử:** Có ghi nhận sửa mã và các dòng này vẫn còn trong nguồn. Lần kiểm tra gốc thất bại do sandbox không cho mở socket (`PermissionError`), rồi lượt làm việc bị gián đoạn. Đây là kiểm tra bị chặn, không phải bộ test đạt hay bằng chứng tương thích mọi phiên bản Python cũ.

## Nhóm 5 — Quy trình phát triển

*Phạm vi: `0.0.26–0.0.30`.*

### 0.0.26 — Quy tắc AGENTS gốc ban đầu

*Ngày ghi nhận: 03/10/2026. Căn cứ: S5, đối chiếu S2–S4 và mã liên quan khi có.*

- **Bổ sung:** Tạo `AGENTS.md`, quy định Cloudflare Tunnel là phương án mặc định đưa prototype từ PC/VPS ra công chúng, dùng HTTPS bên ngoài và HTTP chỉ giữa tunnel với localhost.
- **Bổ sung:** Quy định câu hỏi/kiểm tra khả năng chỉ yêu cầu thông tin; chỉnh sửa cần chủ dự án yêu cầu đích danh. Mốc này sửa tài liệu quy tắc, không sửa hành vi ứng dụng.

### 0.0.27 — Phân cấp kiểm tra và các lệnh kiểm tra

*Ngày ghi nhận: 03/10/2026. Căn cứ: S5, đối chiếu S2–S4 và mã liên quan khi có.*

- **Bổ sung:** Thêm phạm vi kiểm tra khác nhau cho tài liệu, HTML/CSS đơn giản, tính năng nhỏ và refactor lớn/chức năng lớn; kèm lệnh backend, API client và browser theo phạm vi.
- **Thay đổi:** Yêu cầu dữ liệu kiểm tra dùng một lần và báo cáo đúng kiểm tra đạt, thất bại hoặc không chạy được. Chính sách L0–L4/số module được chuẩn hóa ở 0.0.29.

### 0.0.28 — Hướng dẫn agent tiếng Việt

*Ngày ghi nhận: 03/10/2026. Căn cứ: S5, đối chiếu S2–S4 và mã liên quan khi có.*

- **Bổ sung:** Tạo `docs/vi/AGENTS_GUIDE_vi.md`, đồng bộ quy tắc gốc, tên kỹ thuật và lệnh kiểm tra, có liên kết từ `AGENTS.md` và mục lục tiếng Việt.
- **Thay đổi:** Quy tắc gốc tiếng Anh vẫn là nguồn có thẩm quyền; đợt này chỉ sửa tài liệu.

### 0.0.29 — Quy tắc số module và ghi chép thay đổi song ngữ

*Ngày ghi nhận: 03/10/2026. Căn cứ: S5, đối chiếu S2–S4 và mã liên quan khi có.*

- **Bổ sung:** Chuẩn hóa L0–L4: 1–3 module chạy ở cấp cao nhất, 4–5 tăng một cấp tối đa L4, trên năm kiểm tra toàn bộ. Rủi ro có thể nâng cấp; module là trách nhiệm chức năng, không phải số file.
- **Bổ sung:** Tạo `CHANGELOG.md` / `CHANGELOG.vi.md`, yêu cầu đồng bộ tài liệu hai ngôn ngữ và cập nhật tài liệu liên quan/changelog khi sửa ứng dụng L1+. Tài liệu/bản dịch/test không làm tăng số module runtime.
- **Bổ sung:** Yêu cầu L2+ đọc mã/API/nơi gọi trước và sau chỉnh sửa, báo cáo module bị ảnh hưởng ngoài phạm vi ban đầu.
- **Bổ sung:** Yêu cầu chủ dự án duyệt sửa AGENTS gốc/con ngoài yêu cầu trực tiếp, trình đề xuất chờ có ngày trước khi sáp nhập. Yêu cầu đích danh sửa AGENTS cho phép trực tiếp thay đổi quy tắc được yêu cầu.

### 0.0.30 — Sắp xếp tài liệu và lưu trữ bản cũ

*Ngày ghi nhận: 03/10/2026. Căn cứ: S5, đối chiếu S2–S4 và mã liên quan khi có.*

- **Thay đổi:** Sắp xếp đối xứng `docs/en/` / `docs/vi/`, tách RUNNING/BACKUP/DEPLOYMENT/TESTING và đưa ghi chép cũ vào `history/`.
- **Bổ sung:** Tạo `archive/` giữ nguyên Sticky Note gốc và `index_old.html`, kèm mục lục hai ngôn ngữ và bản dịch Sticky Note tiếng Việt.
- **Thay đổi:** Sáp nhập khuyến nghị Sticky Note vào phần riêng ở dưới RECOMMENDATIONS, phân biệt truy cập bản đồ bắt buộc đăng nhập đã có với kế hoạch thành viên local/guest: một cộng đồng mỗi cấp, chọn trường/phường nơi sống độc lập.
- **Kiểm tra lịch sử:** Đợt này ghi nhận rà soát 217 liên kết nội bộ và 15 cặp song ngữ. Mã ứng dụng không đổi và không chạy các bộ kiểm tra ứng dụng.

## Nhóm 6 — Hoàn thiện UX mobile

*Phạm vi: `0.0.31–0.0.36`.*

### 0.0.31 — Giữ mức zoom gần hơn khi chọn ghim trong menu

*Ngày ghi nhận: 03/10/2026. Căn cứ: S5, đối chiếu S2–S4 và mã liên quan khi có.*

- **Sửa lỗi:** Chọn ghim trong menu giữ zoom hiện tại nếu lớn hơn mặc định cấu hình; nếu không thì nâng về mặc định. Mặc định lấy từ `/api/map-config`, không hardcode giá trị ví dụ 16.
- **Kiểm tra lịch sử:** Lượt tiếp tục đã hoàn tất kiểm tra desktop/mobile và trường hợp mặc định cấu hình khác. Không chỉ dựa vào yêu cầu ban đầu bị gián đoạn để xác nhận hoàn thành.

### 0.0.32 — UX tìm kiếm, bàn phím và Memerboard mobile

*Ngày ghi nhận: 03/10/2026. Căn cứ: S5, đối chiếu S2–S4 và mã liên quan khi có.*

- **Thay đổi:** Focus tìm kiếm và chọn bộ lọc mở rộng bảng. Nút gợi ý đặt ghim có chiều rộng theo nội dung và nằm giữa thay vì trải hết màn hình.
- **Sửa lỗi:** Giữ bố cục trang/bản đồ ổn định khi viewport bàn phím thay đổi và đóng, tránh kéo cả trang và tràn trang trong các kịch bản browser đã kiểm tra.
- **Thay đổi:** Memerboard mở rộng mặc định và khôi phục mức Menu trước đó khi quay lại. Tiêu đề/bộ chọn thành phố cố định trong khi danh sách kết quả cuộn.
- **Thay đổi:** Mở vùng bắt đầu kéo xuống ô tìm Menu, bộ lọc Admin và bộ chọn thành phố, có ngưỡng chuyển động để giữ thao tác chạm điều khiển. Chọn ghim trong menu thu gọn bảng mobile.
- **Kiểm tra lịch sử:** Tám bộ browser đạt qua các lượt ghi nhận sau khi chạy lại do timeout khởi tạo. Bàn phím được mô phỏng trong browser; kiểm tra bàn phím iOS/Android thật vẫn chưa thực hiện.

### 0.0.33 — Ba mức bảng, chống zoom chạm đúp và footer Admin

*Ngày ghi nhận: 04/10/2026. Căn cứ: S5, đối chiếu S2–S4 và mã liên quan khi có.*

- **Bổ sung:** Thêm mobile `peek` chỉ có tiêu đề, `default` 230 px và `expanded` bằng 76% viewport tối đa 640 px; khoảng cách cạnh tăng từ 8 px lên 16 px ở mức nhỏ nhất.
- **Thay đổi:** Thả tay chuyển mức theo một phần ba khoảng giữa hai chiều cao theo hướng kéo, cho phép bỏ qua mức giữa. Toàn bảng nhỏ nhất kéo được; vẫn bắt thao tác khi con trỏ rời tay nắm sớm.
- **Thay đổi:** Chuyển bốn tab Admin xuống footer; mọi lần bấm, kể cả tab đang chọn, mở rộng bảng và giữ bộ lọc. Quy tắc Menu/Admin ban đầu mở ở mặc định, đóng về nhỏ nhất và chưa ghi nhớ giữa hai bảng.
- **Sửa lỗi:** Ngăn zoom trang ngoài ý muốn do chạm đúp ngoài bản đồ, trường nhập và thao tác nhiều ngón; vẫn dùng được cử chỉ bản đồ. Điều khiển/bảng ứng dụng nằm trên ghim đặt cố định.
- **Thay đổi:** Memerboard ban đầu mở tuần tự: mở rộng 210 ms rồi trượt 210 ms. Animation này và quy tắc chuyển hai bảng được sửa ở 0.0.36.
- **Sửa lỗi:** Có thêm sửa module phục vụ HTTP: tăng hàng đợi kết nối lên 128 cho tải asset đồng thời, kèm regression riêng. Không khẳng định đây là nguyên nhân mọi timeout trước đó.
- **Kiểm tra lịch sử:** Kiểm tra L4 được ghi nhận: 23 test backend, kiểm tra API client và đủ chín bộ browser đạt qua lượt đầy đủ và lượt chạy lại tập trung. Bao phủ là mô phỏng Chromium, không phải thiết bị iOS/Android thật.

### 0.0.34 — Khai báo cấp chỉnh sửa và trạng thái kiểm tra

*Ngày ghi nhận: 04/10/2026. Căn cứ: S5, đối chiếu S2–S4 và mã liên quan khi có.*

- **Bổ sung:** AGENTS yêu cầu mọi tác vụ chỉnh sửa, kể cả L0, khai báo cấp và trạng thái dự kiến/đang thực hiện/hoàn tất trước khi sửa, trong cập nhật và báo cáo cuối.
- **Bổ sung:** Kiểm tra ứng dụng báo cáo riêng cấp kiểm tra L1–L4, trạng thái và tóm tắt bao phủ/kết quả. Thay đổi phạm vi/rủi ro phải sửa cấp đã khai báo; rà soát tài liệu L0 không được coi là test ứng dụng đạt.
- **Thay đổi:** Đồng bộ hướng dẫn tiếng Việt và hai changelog; sửa quy tắc này chỉ cần rà soát tài liệu L0.

### 0.0.35 — Đồng bộ header bảng và chuyển động footer liên tục

*Ngày ghi nhận: 04/10/2026. Căn cứ: S5, đối chiếu S2–S4 và mã liên quan khi có.*

- **Sửa lỗi:** Menu/Admin dùng hình học và spacing header nhất quán khi kéo/chuyển mức. Lịch sử quản trị vẫn hiện ở mức nhỏ nhất và mở rộng bảng khi truy cập.
- **Sửa lỗi:** Nút Memerboard và footer Admin trượt xuống liên tục, chỉ ẩn sau khi ra khỏi vùng cắt của bảng và hoàn tất chuyển động. Nội dung đang thoát không nhận chạm/bàn phím; kết quả Admin dành chỗ cho chiều cao footer.
- **Kiểm tra lịch sử:** Đợt L2 ở layout/Admin ghi nhận đủ tám bộ browser liên quan đạt, gồm lấy mẫu frame chuyển động tiếng Việt/Anh. Backend/API không đổi; không ghi nhận chạy lại backend/API client hay kiểm tra thiết bị thật.

### 0.0.36 — Ghi nhớ bảng cùng cấp và lớp ghim cố định

> **Mốc lớn — ứng viên minor:** Hoàn thiện UX mobile, kết thúc nhóm 0.0.33–0.0.36.

*Ngày ghi nhận: 04/10/2026. Căn cứ: S5, đối chiếu S2–S4 và mã liên quan khi có.*

- **Thay đổi:** Menu/Admin khôi phục mức kéo gần nhất riêng của từng bảng, kể cả nhỏ nhất, khi chuyển giữa hai bảng cùng cấp. Đóng/mở lại cùng bảng đang chọn vẫn mở ở mặc định. Ghi nhớ này tách khỏi ghi nhớ quay về từ Memerboard.
- **Thay đổi:** Khôi phục mở Memerboard đồng thời: mở rộng chiều cao 250 ms cùng trượt ngang 280 ms ban đầu, thay các bước tuần tự ở 0.0.33.
- **Sửa lỗi:** Ghim cố định mobile vẫn hiện/dùng được ở mức nhỏ nhất; đặt ghim khi desktop đóng hết bảng vẫn dùng marker tạm. Đổi chế độ viewport khi soạn giữ tọa độ đã chọn.
- **Sửa lỗi:** Trên desktop/mobile, marker bản đồ dưới ghim cố định, popup meme trên ghim cố định và điều khiển ứng dụng trên các lớp map. Pane Leaflet riêng bù dịch chuyển để ghim cố định đứng yên khi pan/zoom.
- **Kiểm tra lịch sử:** Kiểm tra L2 được ghi nhận đạt đủ chín bộ browser liên quan qua các lượt. Đặt ghim là module tiêu thụ bị ảnh hưởng thêm, được kiểm tra chọn vị trí, lưu và đổi viewport. API/backend/lớp truyền dùng chung không đổi; chưa bao phủ thiết bị thật.

## Nhóm 7 — Chuẩn bị GitHub

*Phạm vi: `0.0.37–0.0.38`.*

### 0.0.37 — Hướng dẫn GitHub và chạy song song branch/worktree

*Ngày ghi nhận: 04/10/2026. Căn cứ: S5, đối chiếu S2–S4 và mã liên quan khi có.*

- **Bổ sung:** Thêm cặp `GIT_WORKFLOW.md` hướng dẫn giữ baseline Leaflet và chuẩn bị thử MapLibre/OpenFreeMap độc lập với dữ liệu, cổng, profile trình duyệt và tuyến tunnel HTTPS riêng.
- **Thay đổi:** Giải thích tách cookie, dùng clone riêng cho thành viên thay vì sửa đồng thời một checkout SMB, các bước merge/triển khai chủ động và phân biệt quay lại mã với khôi phục dữ liệu migration.
- **Thay đổi:** Mốc này chỉ hoàn tất tài liệu song ngữ đã rà soát; không xác nhận đã push, tạo branch/worktree mới, chuyển MapLibre hay cài Next.js.

### 0.0.38 — Bảo vệ repo trước khi tạo baseline GitHub

*Ngày ghi nhận: 04/10/2026. Căn cứ: S5, đối chiếu S2–S4 và mã liên quan khi có.*

- **Thay đổi:** Mở rộng `.gitignore` cho các biến thể `.env` cục bộ nhưng cho phép `.env.example` đã loại thông tin nhạy cảm, môi trường ảo Python, database/file phụ SQLite, sao lưu ở gốc, uploads và file sinh tự động Node.js/Next.js trong tương lai.
- **Thay đổi:** Quy tắc chuẩn bị cho công cụ frontend tương lai, chưa cài chúng. Pattern ignore không tự bỏ theo dõi file đã tracked; đường dẫn runtime tùy chỉnh khác cần quy tắc riêng hoặc lưu ngoài repo.
- **Kiểm tra lịch sử:** Rà soát L0 ghi nhận kiểm tra 36 trường hợp ignore: 21 bị loại và 15 đường dẫn mã nguồn/template vẫn theo dõi được. Staging và rà soát thông tin nhạy cảm là thao tác chuẩn bị, không phải bản phát hành ứng dụng riêng.

## Các chat đã rà soát và công việc ngoài mốc mã nguồn

| Tên chat | Kết quả rà soát |
| --- | --- |
| Refractor | Trình tự sửa chi tiết 0.0.21–0.0.38; trao đổi chọn số phiên bản sau đó không tạo bản phát hành. |
| MemeMap Main Chat | Phát triển giai đoạn trước và phần tóm tắt 0.0.1–0.0.20 đã có; phần trùng được dẫn chiếu ở trên. |
| UI | Lịch sử kế thừa từ Refractor và trao đổi thiết kế; chỉnh sửa bị lặp chỉ tính một lần. |
| GPT | Lịch sử kế thừa và tư vấn model/effort; sửa AGENTS về báo cáo trạng thái bị lặp là 0.0.34. |
| UI Design | Công việc ngoài repo trên [Figma MemeMap](https://www.figma.com/design/43esIr6bcVNFEoGzfuiRSl?node-id=8-2): chat báo cáo bố cục landing desktop/mobile dạng layer chỉnh sửa được và 43 component. Việc lắp map/popup và rà soát cuối còn dang dở sau giới hạn gói Figma MCP. Đây là thiết kế hoàn thành một phần, chưa phải chuyển frontend hoàn tất hay mốc phát hành mã nguồn. |
| Terminal | Khởi động lại server và kiểm tra phản hồi HTTP; không thêm tính năng ứng dụng hay mốc mã nguồn. |
| OSM -> OFM | So sánh nhà cung cấp/chuyển map và tư vấn Git; chưa triển khai chuyển map. |
| App port | Tư vấn kiến trúc app native; chưa triển khai app Android/iOS. |
| Phân loại squircle và rounded trên i | Trao đổi hình dạng/thiết kế; không ghi nhận triển khai. |

Đã rà soát cả cấu hình danh tính Git, staging và kiểm tra thông tin nhạy cảm. Chúng chuẩn bị chia sẻ repo, không xác nhận đã commit/push hay tạo phiên bản ứng dụng phát hành. Việc soạn lịch sử phiên bản ban đầu và chỉnh lại lần này là cập nhật ghi chép L0, không thêm mốc runtime.

## Những nội dung không được tính là tính năng đã hoàn thành

Community/thành viên/local–guest, polygon hành chính, tên địa điểm ghim bằng geocoding, tải toàn bộ OSM, MapLibre/OpenFreeMap, Next.js + Tailwind CSS + shadcn/ui, GIF/WebM, giới hạn ảnh đầu ra cố định 500 KB, sao lưu tự động, Turnstile, khôi phục mật khẩu và app native vẫn là trao đổi/kế hoạch hoặc chưa xác nhận đã triển khai. Xem [recommendations](../RECOMMENDATIONS.md) và API để biết trạng thái hiện tại, không suy ra đã hoàn thành từ câu hỏi trong chat. Công việc Figma hoàn thành một phần ở trên không thay đổi trạng thái này.

## Duy trì lịch sử từ đây

Ghi thay đổi hoàn thành theo ngày vào cả hai changelog trong `Unreleased`. Với mốc hoàn thành riêng biệt tiếp theo, nối thêm `0.0.39`, rồi tiếp tục tăng phần cuối trong dải `0.0.x`; chỉ tạo `0.1.0` nếu chủ dự án chọn mốc đó. Chỉ gắn ngày phát hành hoặc Git tag khi thực sự thực hiện và có căn cứ. Cập nhật hai bản VERSIONS cùng nhau, gộp sửa nhỏ cùng mục tiêu và giữ chú thích khi hành vi cũ bị thay thế.
