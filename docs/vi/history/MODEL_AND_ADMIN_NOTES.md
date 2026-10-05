# Ghi chú lựa chọn model và thiết kế Admin từ đợt trước

[English](../../en/history/MODEL_AND_ADMIN_NOTES.md) · **Tiếng Việt** · [Mục lục](../README.md)

Phần này được tách khỏi recommendations và đưa vào lịch sử ngày 03/10/2026. Nội dung dưới đây là đề xuất của đợt trước; mô tả model không được coi là khuyến nghị hiện tại. Thiết kế Admin ban đầu cũng không thay thế [API](../API.md) và [kiến trúc](../ARCHITECTURE.md) hiện có.

Với MemeMap, mình khuyên dùng **GPT‑6.1 Sol** làm model chính trong Codex: repo có frontend, backend, bản đồ, ảnh và luồng đăng nhập nên thường cần vừa hiểu nhiều phần cùng lúc vừa giữ chi phí hợp lý. OpenAI mô tả Sol là lựa chọn cân bằng giữa năng lực và chi phí, còn **GPT‑6 Astra** là lựa chọn mạnh nhất cho các vấn đề phức tạp. [Tài liệu chính thức về model](https://developers.openai.com/api/docs/models)

- **GPT‑6.1 Sol** — dùng hằng ngày để phát triển tính năng và sửa lỗi.
- **GPT‑6 Astra** — chuyển sang khi xử lý lỗi khó, tái cấu trúc lớn hoặc vấn đề cần suy luận sâu.
- **GPT‑6 Luna** — hợp với yêu cầu nhỏ, rõ ràng như chỉnh chữ, tài liệu hoặc CSS đơn giản.

Trong danh sách ở ảnh, chọn **GPT‑6.1 Sol** làm mặc định là lựa chọn mình đề xuất.

| Effort | Khi nên dùng |
|---|---|
| **Low** | Đổi chữ, icon, font, màu hoặc chỉnh nhỏ |
| **Medium** | Tính năng đơn giản, sửa UI thông thường, viết tài liệu |
| **High** | Backend, đăng nhập, xử lý ảnh, animation và phối hợp map với menu |
| **Xhigh / Max** | Lỗi khó tái hiện, lỗi sửa nhiều lần chưa hết, tái cấu trúc lớn |

| Tính năng | Vị trí trong bảng Admin | Bố cục và cách thao tác |
|---|---|---|
| **Ẩn/khôi phục meme** | Tab **Meme** | Mỗi dòng hiện tiêu đề, người đăng, ngày đăng, aura và trạng thái. Nhấn để mở chi tiết; có **Xem trên bản đồ**, **Ẩn meme**. Meme đã ẩn hiện nút **Khôi phục**. Khi ẩn, popup yêu cầu lý do. **Xóa vĩnh viễn** nằm trong menu `⋯`, tránh bấm nhầm. |
| **Báo cáo meme** | Tab **Báo cáo** | Ba bộ lọc: **Chờ xử lý · Đang xem xét · Đã xử lý**. Gộp nhiều báo cáo của cùng một meme thành một dòng, hiện số báo cáo và lý do phổ biến. Mở chi tiết để xem meme và từng báo cáo; chọn **Ẩn meme** hoặc **Bỏ qua báo cáo**, kèm ghi chú xử lý. |
| **Tìm kiếm và lọc ghim** | Đầu tab **Meme** | Ô tìm kiếm theo tiêu đề, nội dung hoặc `@username`. Nút **Bộ lọc** mở các điều kiện: trạng thái, ngày đăng, có ảnh. Sắp xếp: **Mới nhất · Cũ nhất · Aura cao/thấp**. Hiện số kết quả và nút xóa bộ lọc. |
| **Khóa quyền đăng/vote** | Tab **Người dùng** → chi tiết tài khoản | Danh sách có tên, username, số meme, aura và trạng thái hạn chế. Trong chi tiết, chọn **Hạn chế đăng meme**, **Hạn chế vote** hoặc cả hai; nhập thời hạn và lý do. Hiện hạn chế hiện tại cùng nút **Gỡ hạn chế**. |
| **Lịch sử quản trị** | Nút lịch sử cạnh tiêu đề Admin | Mở một màn hình trong cùng bảng, có nút quay lại. Mỗi dòng ghi **admin nào · hành động · đối tượng · thời gian · lý do**. Lọc theo loại hành động và người thực hiện. Chi tiết meme/tài khoản cũng có liên kết tới lịch sử riêng của đối tượng đó. |
| **Phát hiện spam** | Khối cảnh báo trong **Tổng quan**; nhãn trong **Meme/Người dùng** | Hiện các dấu hiệu cụ thể như đăng dồn dập, nội dung trùng lặp, vote bất thường. Nhấn cảnh báo để mở đối tượng và bằng chứng liên quan. Giai đoạn đầu chỉ đánh dấu để admin xem xét; admin quyết định ẩn hoặc hạn chế. |
| **Thống kê cơ bản** | Tab **Tổng quan** | Trên cùng: **Báo cáo chờ xử lý** và **Cảnh báo spam** để ưu tiên việc cần làm. Bên dưới: meme mới, người dùng mới, dung lượng ảnh; chọn **Hôm nay · 7 ngày · 30 ngày**. Nhấn một chỉ số để tới danh sách tương ứng. |
