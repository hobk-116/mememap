# Đề xuất phát triển MemeMap

[English](../en/RECOMMENDATIONS.md) · **Tiếng Việt** · [Mục lục](README.md)

Cập nhật ngày 03/10/2026 từ cuộc trao đổi về dự án. Đây là kế hoạch phát triển; các mục checklist dưới đây chưa phải tính năng hoàn thành, trừ phần ghi rõ đã có.

## Nền tảng hiện tại

Đã hoàn thành sáu bước refactor: tách service, migration/cấu hình/ảnh có phiên bản, API client chung, tách module map, tổng hồ sơ từ database và tập trung phạm vi địa lý. Kiểm duyệt/báo cáo, đăng xuất đúng nguồn mở hồ sơ có xác nhận và bảng Menu/Admin dùng chung trên mobile đã có. Xem [kiến trúc](ARCHITECTURE.md), [API](API.md) và [lịch sử refactor](history/REFACTOR_2026-10-02.md).

Membership/local/guest community, polygon hành chính, feed lọc theo vùng, sao lưu tự động, Turnstile và app Android/iOS native vẫn là kế hoạch. Map hiện tải toàn bộ ghim mỗi 10 giây. Tài liệu này không xác nhận đã triển khai hosting hoặc mua tên miền.

## Thứ tự ưu tiên

| Thời điểm | Đề xuất | Lý do |
| --- | --- | --- |
| **Trước community** | Chốt môi trường Python/`cwebp` trên máy host thực tế; đưa mã nguồn vào Git và chuẩn bị quy trình branch GitHub cho team. | Mac của chủ dự án báo Python 3.14.7 và `cwebp` 1.6.0; log kiểm tra Python được cung cấp có 22 test đạt. Kết quả đó không xác minh máy host khác. Lịch sử mã nguồn không sao lưu dữ liệu người dùng. |
| **Trước khi đổi dữ liệu đang chạy** | Sao lưu database/ảnh khớp nhau và thử khôi phục bộ dữ liệu sao chép. | Membership/schema phải giữ tài khoản, bài, vote và ảnh. Xem [sao lưu](BACKUP.md). |
| **Trước triển khai community** | Chốt membership, xác minh, đổi cộng đồng và cách xử lý bài/aura hiện có. | Quan hệ địa lý không tự tạo quyền local; phường nơi sống và trường được chọn độc lập. |
| **Xây community** | Thêm migration membership, ranh giới có nguồn/phiên bản và quyết định local/guest tại backend. | Dùng các service nền tảng; giới hạn viewport không thực thi quyền API. |
| **Trước khi feed lớn** | Lọc theo vùng, phân trang và đo trên thiết bị thật. | Làm mới toàn bộ feed không phù hợp mãi khi dữ liệu tăng; tổng hồ sơ đã độc lập feed. |
| **Trước mở công khai** | Dùng Cloudflare Tunnel với HTTPS công khai và cookie Secure; triển khai giới hạn chống spam phù hợp cho đăng nhập/API, sao lưu tự động và quy trình khôi phục. | Đã có thiết lập triển khai, nhưng giới hạn tần suất chung, Turnstile và sao lưu tự động chưa được triển khai. Xem [triển khai](DEPLOYMENT.md). |
| **Trước demo công khai và quảng cáo** | Đặt tiêu chí nghiệm thu đăng nhập, đăng bài, ảnh, vote và kiểm duyệt, cùng checklist phát hành và ghi nhận sự cố/phản hồi. | Demo công chúng, gọi vốn hoặc nhà quảng cáo cần hành vi ổn định và bằng chứng chất lượng. Dùng [hướng dẫn kiểm tra](TESTING.md); không tính giả lập viewport là kiểm tra thiết bị thật. |
| **Trước app native** | Kiểm tra Safari/iPhone/Android thật, chọn cách tích hợp API/phiên đăng nhập, đóng gói và dịch vụ tile. | Refactor và community giúp chuẩn bị backend; chúng không tự tạo app Android/iOS. |

## Quy tắc community cần chốt

- Cấp 1 là thành phố/tỉnh, ban đầu Hà Nội; cấp 2 là phường/xã hiện hành nơi sống; cấp 3 là trường học, ban đầu đại học/THPT với HANU làm thí điểm.
- Mỗi tài khoản tham gia tối đa một cộng đồng ở mỗi cấp. Luồng thành phố → phường → trường có thể hướng dẫn đăng ký, nhưng membership trường và phường nơi sống độc lập. Sinh viên HANU chọn phường thực tế nơi sống, không bị gán phường suy ra từ trường.
- Xem map bắt buộc đăng nhập. Local và guest đều là người đã đăng nhập. Trạng thái được xác định theo cộng đồng cụ thể: thành viên đăng local trong cộng đồng của mình và guest ở cộng đồng khác theo quy tắc đăng bài đã chọn.
- Backend xác định membership và quyền đăng. Vùng đang xem, giới hạn viewport hoặc GPS hiện tại không tự cấp quyền local.
- Chốt xác minh, tần suất đổi membership, bài/aura trước đó, phạm vi kiểm duyệt và quan hệ ranh giới trường với cộng đồng nơi sống trước khi xây dựng.
- Chỉ yêu cầu vị trí khi người dùng chủ động. Membership không chứng minh người dùng đang ở tọa độ đó; không mặc định bổ sung theo dõi vị trí nền.

## Hướng đi bản đồ và mobile

MapLibre/OpenFreeMap hiện tại được mô tả trong [kiến trúc](ARCHITECTURE.md) và [triển khai](DEPLOYMENT.md#dịch-vụ-bản-đồ). Dữ liệu địa lý community nên độc lập thư viện hiển thị: ranh giới có nguồn/phiên bản, ID nhất quán và kiểm tra tại backend.

Xác định ý nghĩa từng cấp community trước khi chọn polygon, giới hạn viewport và bộ lọc feed. Chủ dự án đã cho phép migration renderer MapLibre/OpenFreeMap ngày 07/10/2026. Membership/polygon community và lựa chọn SDK native vẫn là đề xuất riêng; đổi renderer không triển khai những tính năng đó.

Đề xuất model và thiết kế Admin cũ được giữ trong [lịch sử](history/MODEL_AND_ADMIN_NOTES.md). Hành vi hiện tại nằm trong tài liệu API và kiến trúc.

## Sticky Note — tổng hợp từ cuộc trò chuyện

Phần riêng này giữ ba ưu tiên gốc từ [Sticky Note được lưu trữ](../../archive/STICKY_NOTE.md) và diễn giải thêm theo các đính chính của chủ dự án.

### Local & guest

- [ ] Xây membership community yêu cầu đăng nhập, tối đa một cộng đồng mỗi cấp.
- [ ] Thí điểm Hà Nội → phường/xã nơi sống và trường được chọn độc lập, ví dụ HANU.
- [ ] Thực thi quyền đăng local/guest theo cộng đồng tại backend; tính năng này không bao gồm xem map ẩn danh.
- [ ] Chốt xác minh, đổi cộng đồng, bài/aura cũ và kiểm duyệt trước khi xây schema.

### Improve Memerboard — Cải thiện Memerboard

- [ ] Chốt phạm vi xếp hạng ở cộng đồng thành phố, phường và trường.
- [ ] Giữ bảng xếp hạng khớp trạng thái ẩn/hiện, kiểm duyệt và quy tắc membership/aura đã thống nhất.
- [ ] Bổ sung lọc feed/xếp hạng phù hợp và đo hiệu năng khi dữ liệu tăng. Tổng hồ sơ từ database đã có.

### Improve UX — Cải thiện trải nghiệm

- [ ] Xác minh trên iPhone/Android thật: quyền vị trí, xử lý ảnh, hồ sơ, xác nhận và thao tác bảng mobile.
- [ ] Xem lại zoom trang ngoài ý muốn khi nhấn đúp ngoài map, đồng thời giữ tương tác map và khả năng tiếp cận phù hợp.
- [ ] Cải thiện trạng thái tải, lỗi/phiên hết hạn và nhãn local/guest dễ hiểu.
- [ ] Giữ quy tắc nguồn mở hồ sơ để đăng xuất, xác nhận và Menu/Admin dùng chung trên mobile khi bổ sung community.
