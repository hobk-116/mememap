# Hướng dẫn cho agent làm việc với MemeMap

[Bản gốc tiếng Anh](../../AGENTS.md) · [Mục lục tài liệu tiếng Việt](README.md)

Đây là bản dịch tham khảo của `AGENTS.md` ở thư mục gốc repo. Bản gốc là nguồn quy tắc chính; nếu có khác biệt, áp dụng bản gốc. Khi thay đổi hướng dẫn, cập nhật bản dịch tương ứng. Tài liệu này không thiết lập bộ quy tắc riêng cho thư mục `docs/vi/`.

- Cho đến khi chủ dự án thay đổi quyết định, đề xuất Cloudflare Tunnel để chia sẻ prototype hiện tại từ PC hoặc VPS ra Internet; không lấy việc mở trực tiếp máy chủ ra Internet, chuyển tiếp cổng router hoặc hosting qua DDNS làm phương án mặc định. Truy cập công khai phải dùng HTTPS; HTTP chỉ được dùng giữa tunnel và localhost.
- Xem các câu hỏi và câu hỏi về khả năng thực hiện, bao gồm “có làm không?” hoặc “có thể làm không?”, là yêu cầu cung cấp thông tin. Chỉ thực hiện thay đổi khi chủ dự án đích danh yêu cầu làm.

## Tài liệu bắt buộc đọc và nguồn xác định yêu cầu

- Khi bắt đầu tác vụ trong repo, đọc [README.md](../../README.md), [mục lục tài liệu](README.md) và các mục mới nhất trong [CHANGELOG.md](../../CHANGELOG.md).
- Trước khi sửa code, đọc phần liên quan trong [ARCHITECTURE.md](ARCHITECTURE.md), [API.md](API.md) nếu có API và [TESTING.md](TESTING.md), cùng mã nguồn và test liên quan. Đọc [RECOMMENDATIONS.md](RECOMMENDATIONS.md) khi tác vụ ảnh hưởng định hướng sản phẩm hoặc community.
- Đọc [VERSIONS.md](history/VERSIONS.md) khi cần truy nguyên lịch sử hoặc xử lý phiên bản. Không coi hành vi lịch sử trong VERSIONS hoặc changelog là yêu cầu hiện hành nếu đã bị thay thế.
- Đọc RUNNING, DEPLOYMENT, BACKUP hoặc GIT_WORKFLOW khi tác vụ liên quan. Không bắt buộc đọc toàn bộ tài liệu cho mọi chỉnh sửa nhỏ.
- Phân biệt rõ hành vi đã triển khai, quyết định đã chốt, đề xuất và quyết định chưa chốt. Không tự triển khai tính năng từ đề xuất, checklist hoặc trao đổi chỉ mang tính cân nhắc.
- Tuân theo yêu cầu hiện tại của chủ dự án và quy tắc AGENTS đang có hiệu lực. Khi tài liệu và code mâu thuẫn, báo rõ khác biệt thay vì tự suy đoán ý định sản phẩm.
- Không giả định truy cập được chat khác. Nếu quyết định cần thiết chưa có trong repo hoặc ngữ cảnh được cung cấp, hỏi chủ dự án trước khi thực hiện phần công việc phụ thuộc quyết định đó.

## Chính sách kiểm tra

Khi có yêu cầu triển khai rõ ràng, thực hiện các kiểm tra phù hợp như một phần của công việc. Phân loại từng thay đổi theo tác động và rủi ro thực tế, rồi áp dụng quy tắc số module bên dưới. Cấp độ mô tả thay đổi, không phải xếp hạng cố định của module.

| Cấp | Loại thay đổi | Kiểm tra cần thực hiện |
| --- | --- | --- |
| L0 | Chỉ sửa tài liệu, nội dung chữ hoặc bản dịch | Rà soát cách diễn đạt, liên kết và tính nhất quán Anh/Việt. Với chữ hiển thị cho người dùng, xem phần giao diện và các ngôn ngữ bị ảnh hưởng để phát hiện tràn chữ hoặc thiếu nhãn. Không cần chạy bộ kiểm tra hồi quy ứng dụng. |
| L1 | HTML/CSS đơn giản | Xem phần giao diện bị ảnh hưởng ở kích thước desktop và mobile. Nếu thay đổi bảng trượt, popup, thao tác chạm hoặc vị trí ghim, chạy các nhóm kiểm tra trình duyệt liên quan bên dưới. Chỉ cần kiểm tra backend nếu hành vi backend hoặc định tuyến tài nguyên bị ảnh hưởng. |
| L2 | Tính năng nhỏ hoặc sửa lỗi | Chạy các nhóm kiểm tra backend và/hoặc trình duyệt liên quan đến tất cả module bị ảnh hưởng. Chạy kiểm tra API client khi thay đổi lớp giao tiếp hoặc xử lý lỗi dùng chung. Bổ sung kiểm tra hồi quy tập trung cho hành vi có ý nghĩa mà test hiện có chưa bao phủ. |
| L3 | Tích hợp các tính năng liên quan hoặc nâng cấp từ L2 | Xem toàn bộ luồng bị ảnh hưởng và các phần sử dụng liên quan. Chạy toàn bộ nhóm backend nếu thay đổi hành vi backend, toàn bộ nhóm trình duyệt nếu thay đổi hành vi frontend, và kiểm tra API client nếu thay đổi giao tiếp hoặc hợp đồng API. Bổ sung kiểm tra tập trung cho tích hợp và các trường hợp lỗi liên quan. |
| L4 | Refactor diện rộng hoặc tính năng lớn, bao gồm community | Chạy toàn bộ kiểm tra backend, API client và trình duyệt. Bổ sung kiểm tra hành vi mới, giới hạn quyền truy cập và các trường hợp lỗi liên quan. Xem lại các luồng desktop/mobile bị ảnh hưởng; báo cáo riêng phạm vi kiểm tra trên thiết bị thật. |

Module là một nhóm trách nhiệm chức năng, ví dụ xác thực, hồ sơ, tạo ghim, bình chọn, bảng xếp hạng, kiểm duyệt, bố cục bản đồ, giao tiếp API dùng chung, lưu ảnh, migration hoặc phạm vi địa lý. Các file frontend và backend có thể cùng thuộc một module. Mỗi module có code hoặc hành vi thay đổi được tính một lần; không đếm theo file hoặc chia nhỏ một trách nhiệm để thay đổi số lượng. Tài liệu, bản dịch, changelog và test đi kèm không làm tăng số module của ứng dụng. Nêu các module bị ảnh hưởng cùng cấp độ, rồi cập nhật số lượng nếu phạm vi công việc mở rộng.

Với thay đổi triển khai từ L1 trở lên, chọn cấp kiểm tra tối thiểu như sau:

| Số module sửa | Cấp được chọn |
| --- | --- |
| 1–3 | Cấp cao nhất trong các module được sửa. Bao phủ tất cả module bị ảnh hưởng và gộp các kiểm tra cần thiết, bỏ phần trùng. |
| 4–5 | Nâng một cấp so với cấp cao nhất trong các module được sửa, tối đa L4. |
| Trên 5 | L4: kiểm tra toàn bộ. |

Rủi ro được ưu tiên hơn ngưỡng tối thiểu: migration schema/dữ liệu, thay đổi lớn về community, logic dùng chung ảnh hưởng rộng hoặc phạm vi tác động không thể khoanh vùng đều cần L4, kể cả chỉ sửa 1–3 module. Thay đổi hành vi xác thực, phân quyền, phiên đăng nhập hoặc API dùng chung cần tối thiểu L2 cùng các kiểm tra backend/API liên quan; thêm kiểm tra trình duyệt cho đăng xuất/hồ sơ hoặc Admin nếu bị ảnh hưởng. Thay đổi ảnh/lưu trữ cần `test_foundation.py` và `test_admin.py`, cùng kiểm tra API/trình duyệt liên quan, bao phủ bảo toàn dữ liệu, rollback/chạy lại và tính nhất quán của ảnh. Dùng L4 khi ảnh hưởng rộng.

Công việc chỉ sửa tài liệu giữ ở L0 bất kể số file. Không chạy lại kiểm tra đã đạt cho code liên quan chưa đổi chỉ vì có nhiều module; chạy lại khi thay đổi tiếp theo ảnh hưởng đến kết quả, có lỗi hoặc vấn đề chưa được giải quyết.

## Cấp chỉnh sửa và trạng thái kiểm tra

- Với mọi công việc chỉnh sửa, phải nêu rõ cấp thay đổi (L0–L4), kể cả công việc chỉ sửa tài liệu ở L0, cùng trạng thái sẽ thực hiện, đang thực hiện hoặc đã hoàn thành. Nêu cấp và phạm vi dự kiến trước khi sửa, thể hiện trạng thái hiện tại trong cập nhật tiến độ và báo cáo phạm vi đã hoàn thành ở câu trả lời cuối. Nếu phạm vi hoặc rủi ro thay đổi, cập nhật cấp đã nêu và giải thích lý do.
- Khi chạy kiểm tra ứng dụng, báo cáo riêng cấp kiểm tra đã chọn (L1–L4), tình trạng (dự kiến, đang chạy, đạt, chưa đạt, bị chặn hoặc chưa chạy), cùng tóm tắt ngắn phạm vi và kết quả. Nêu các lệnh thực sự đã chạy và lý do kiểm tra chưa hoàn thành; không được báo đạt khi mới dự kiến hoặc đang chạy. Cấp kiểm tra có thể cao hơn cấp chỉnh sửa theo quy tắc số module và rủi ro.
- Với công việc chỉ thuộc L0, báo cáo việc rà soát tài liệu và kết quả ở L0, nêu rõ không cần và không chạy kiểm tra ứng dụng. Rà soát cách diễn đạt, liên kết và bản dịch không nâng thay đổi lên L1 hoặc chứng minh kiểm tra ứng dụng đã đạt.

- Sau mỗi tác vụ chỉnh sửa được yêu cầu, đặt đề xuất phiên bản ở cuối báo cáo hoàn tất: **ứng viên patch**, **ứng viên minor** hoặc **không cần phiên bản ứng dụng mới**, kèm lý do ngắn và nêu nên gộp vào đợt `Unreleased` hiện tại hay đề xuất đợt riêng. Nếu chưa đủ căn cứ hoặc công việc/kiểm tra chưa hoàn tất, ghi rõ điều chưa xác định và giữ phân loại ở mức tạm thời. Phân loại này không cho phép tự tăng phiên bản hoặc phát hành. Giữ nguyên cách báo cáo L0–L4 sẽ/đang/đã thực hiện và kiểm tra hiện có; chúng tách riêng với phân loại phiên bản. Nhắc đề xuất AGENTS chưa sáp nhập, nếu có, đặt trước đề xuất phiên bản cuối cùng.

## Căn cứ xác nhận và phạm vi

- Bắt đầu với AGENTS, sau đó là mục lục tài liệu, tài liệu hiện trạng liên quan và mã/test thực tế của phần đang xét. Kiến trúc, API và vận hành mô tả hiện trạng; recommendations mô tả kế hoạch; history và archive là tham khảo, không chứng minh triển khai hiện tại.
- Không khẳng định tính năng đã tồn tại chỉ dựa trên kế hoạch, lịch sử chat hoặc tên module. Đối chiếu triển khai hiện tại và kiểm tra liên quan. Phân biệt đọc mã, bao phủ test hiện có, kết quả test lịch sử và kiểm tra thực sự đã chạy; ghi rõ chưa xác minh khi chưa đủ căn cứ.
- Nếu tài liệu và mã khác nhau, báo cáo khác biệt thay vì suy đoán để lấp chỗ thiếu hoặc âm thầm chọn một bên làm hành vi đã xác nhận.
- Không triển khai tính năng ngoài yêu cầu của chủ dự án chỉ vì chúng xuất hiện trong recommendations. Tuân thủ quy tắc cho phép hiện có đối với câu hỏi, chỉnh sửa và phạm vi đã duyệt.

## Đọc lại API và module

Với công việc có cấp kiểm tra được chọn từ L2 trở lên:

- Trước khi sửa, đọc tài liệu API và code route/client liên quan, các module sẽ thay đổi cùng nơi gọi, nơi sử dụng và phần phụ thuộc dùng chung trực tiếp. Xác định quyền hiện có, hợp đồng dữ liệu và hành vi khi lỗi. Nếu không liên quan API, nêu rõ và đọc giao diện giữa các module liên quan.
- Sau khi sửa, đọc lại code API và các module bị ảnh hưởng, đối chiếu phần thay đổi với phạm vi dự kiến, xác nhận tài liệu khớp hành vi đã triển khai. Chỉ đọc tài liệu API không thay thế việc đọc code liên quan.
- Báo cáo mọi thay đổi code hoặc hành vi ảnh hưởng đến module ngoài phạm vi đã nêu ban đầu, gồm sửa cần thiết tại nơi gọi hoặc phần phụ thuộc dùng chung. Nêu tên module, lý do ảnh hưởng và cách kiểm tra; điều chỉnh cấp kiểm tra khi cần. Yêu cầu báo cáo này không tự cho phép làm thêm tính năng không liên quan.

## Tài liệu và changelog

- Sau mỗi đợt chỉnh sửa hoàn tất, cập nhật cả hai changelog dưới `Unreleased`, bao gồm thay đổi L0 đối với tài liệu, bản dịch, cấu hình repo hoặc quy tắc dự án. Không tạo mục thay đổi hoàn tất khi chỉ đọc, tư vấn hoặc chạy lại kiểm tra mà không chỉnh sửa. Phân biệt sửa mã đã làm với kiểm tra đạt, thất bại hoặc bị chặn; yêu cầu, kế hoạch và báo cáo từ chat khác đơn thuần không phải bằng chứng hoàn thành.
- Mỗi lần tạo hoặc sửa bất kỳ tài liệu dự án nào, đồng bộ bản tiếng Anh/Việt tương ứng trong cùng công việc. Giữ tên kỹ thuật, lệnh, đường dẫn API, trường JSON và mã lỗi khớp nhau. Nếu thiếu bản tương ứng, tạo bản đó hoặc báo rõ phần đồng bộ chưa hoàn thành; không tuyên bố hoàn tất khi còn thiếu bản bắt buộc.
- Các cặp hiện tại: `README.md` / `README.vi.md`, `CHANGELOG.md` / `CHANGELOG.vi.md`, `docs/en/{README,ARCHITECTURE,API,RUNNING,BACKUP,DEPLOYMENT,TESTING,RECOMMENDATIONS}.md` / cùng tên file trong `docs/vi/`, và `AGENTS.md` / `docs/vi/AGENTS_GUIDE_vi.md`. Các cặp lịch sử có cùng tên trong `docs/en/history/` và `docs/vi/history/`; cặp lưu trữ là `archive/README.md` / `archive/README.vi.md` và `archive/STICKY_NOTE.md` / `archive/STICKY_NOTE.vi.md`.
- Mọi thay đổi triển khai được phân loại từ L1 trở lên phải cập nhật cả hai changelog và tài liệu dự án Anh/Việt liên quan trong cùng công việc. Mô tả hành vi, giao diện giữa các thành phần, vận hành hoặc bố cục phù hợp. Chỉ sửa changelog chưa đáp ứng yêu cầu cập nhật tài liệu; không cần sửa gượng ép tài liệu không liên quan.
- Mỗi thay đổi hướng dẫn AGENTS đã được duyệt cũng cần cả hai changelog và bản hướng dẫn tiếng Việt, dù thuộc L0. Quy tắc gốc và bản dịch đáp ứng yêu cầu tài liệu cho công việc chỉ sửa chính sách.
- Ghi công việc đã hoàn thành trong `Unreleased` với heading có ngày và nhóm Added/Changed/Fixed/Security phù hợp. Không tự đặt phiên bản đã phát hành, ngày hoàn thành hoặc tính năng đã triển khai. Đề xuất và công việc tương lai không được ghi như thay đổi đã hoàn thành. Ghi kết quả kiểm tra cũ dưới dạng lịch sử, không coi là kiểm tra cho thay đổi mới.
- Đồng bộ mục lục và liên kết tương đối khi thêm, đổi tên hoặc di chuyển tài liệu. Các đường dẫn trên mô tả bố cục hiện tại; cập nhật bảng đối chiếu khi thực hiện việc sắp xếp lại đã được cho phép.

## Mốc phát triển và phiên bản phát hành

- Phân biệt mốc phát triển trong VERSIONS với phiên bản phát hành. Các mốc `0.0.x` hiện có là ghi chép hồi cứu; chúng không xác nhận đã phát hành, triển khai hoặc tạo Git tag. Không tự tạo bản phát hành hoặc tăng patch sau mỗi lần sửa, lượt chat hay commit.
- Một mốc VERSIONS ghi nhận kết quả cụ thể: sửa một lỗi xác định, thêm một khả năng sử dụng hoặc hoàn thành thay đổi kỹ thuật/tài liệu có phạm vi rõ ràng. Gom chỉnh sửa vào cùng một mốc khi chúng giải quyết cùng lỗi hoặc hoàn thành cùng mục tiêu cụ thể, thuộc một đợt liên tục và chưa được chốt thành các mốc riêng.
- Ghi kết quả hoàn tất độc lập thành mốc riêng. Hai thay đổi độc lập có thể là hai mốc phát triển dù phát hành chung một patch. Trước khi chốt mốc, gộp những lần thử tiếp để hoàn thành cùng mục tiêu vào mốc đó; sửa lỗi mới sau khi đã chốt thuộc mốc tiếp theo, dẫn chiếu mốc trước khi cần.
- Không dùng số file, số lượt chat, độ dài yêu cầu hoặc cấp L0–L4 để quyết định số mốc. Chạy lại test, yêu cầu/báo cáo lặp và lịch sử bị lặp do fork không tạo mốc mới. Nếu đã sửa mã nhưng kiểm tra bị chặn, ghi trạng thái đó thay vì khẳng định đã xác minh đầy đủ.
- Giữ mốc theo trình tự thời gian trong nhóm giai đoạn phát triển phù hợp, đồng bộ cấu trúc EN/VI. Chỉ tạo nhóm mới khi giai đoạn mới có mục tiêu khác rõ ràng, không tạo sau mỗi sửa lỗi nhỏ. Nhóm tổ chức lịch sử, không gán phiên bản phát hành.
- Khả năng mới đáng kể, nhóm chức năng lớn hoặc thay đổi nền tảng lớn có thể gắn nhãn **Major milestone — minor candidate** (tiếng Việt: **Mốc lớn — ứng viên minor**). Với chuỗi mốc liên quan, ưu tiên gắn nhãn tại mốc kết thúc nhóm và ghi phạm vi. Nhãn không tăng số phiên bản, tạo tag hoặc xác nhận phát hành.
- Khi chỉ được yêu cầu đổi số, sắp xếp, chia nhóm hoặc gắn nhãn phiên bản, giữ nguyên tiêu đề, ngày, mô tả và kết quả kiểm tra lịch sử của các mốc còn lại. Chỉ đổi cấu trúc và số tham chiếu được cho phép. Nếu nội dung lịch sử có vẻ sai hoặc trùng, báo cáo và đề xuất sửa/xóa riêng, trừ khi việc sửa/xóa đó đã được cho phép đích danh.

## Chọn patch và minor khi phát hành

- **Patch:** sửa lỗi, điều chỉnh UX nhỏ, tối ưu hoặc refactor giữ nguyên khả năng sử dụng và hợp đồng API. **Minor:** thêm khả năng sử dụng mới hoặc hoàn thành nhóm thay đổi chức năng đáng kể.
- Đổi công nghệ như Next.js, Tailwind CSS, shadcn/ui hoặc MapLibre không tự quyết định minor. Đánh giá hành vi, khả năng sử dụng và hợp đồng API thực tế. Báo cáo rõ thay đổi không tương thích; không tự phân loại thành patch. Đề xuất cách đánh phiên bản và bước chuyển đổi để chủ dự án quyết định.
- Một bản phát hành có thể gom nhiều mốc phát triển. Một minor có thể gồm sửa lỗi liên quan; tài liệu, bản dịch và test thuộc đợt chúng hỗ trợ. Giữ công việc chưa phát hành dưới `Unreleased`, đề xuất số phiên bản theo kết quả chung của đợt khi chủ dự án yêu cầu phát hành.
- L0–L4 quyết định phạm vi kiểm tra, độc lập với patch/minor. Chỉ chốt số phiên bản phát hành, chuyển mục `Unreleased` thành mục phát hành, ghi ngày phát hành hoặc tạo Git tag khi chủ dự án yêu cầu hoặc phê duyệt rõ. Ngày phát hành phải phản ánh sự kiện thực tế, không lấy ngày sửa tài liệu thay thế.

## File phục vụ Git và thao tác được cho phép

- Rà soát `.gitignore` khi công cụ build, dependency, đường dẫn dữ liệu hoặc loại file sinh tự động thay đổi. Tránh đưa dữ liệu runtime, bí mật và file sinh tự động vào Git ngoài ý muốn, đồng thời cho phép theo dõi mã nguồn và template đã loại thông tin nhạy cảm. Cập nhật hướng dẫn Git EN/VI khi thay đổi cấu trúc repo, quy trình branch/worktree, chạy song song, dữ liệu, cổng hoặc tuyến tunnel. Không sửa các file này sau mọi lần chỉnh sửa nếu những nội dung đó không bị ảnh hưởng.
- Pattern ignore không bỏ theo dõi file đã tracked. Báo cáo dữ liệu nhạy cảm/runtime đã tracked và đề xuất xử lý; không tự xóa dữ liệu hoặc viết lại lịch sử Git.
- Yêu cầu sửa mã hoặc tài liệu đơn thuần không cho phép staging, commit, push, tạo tag, merge hoặc phát hành. Làm các thao tác này khi được yêu cầu đích danh hoặc đã được cho phép trong phạm vi tác vụ hiện tại; không hỏi lại thao tác đã được cho phép. Không amend, reset, force-push hoặc viết lại lịch sử ngoài phạm vi chủ dự án cho phép.
- Báo cáo Git phải phân biệt thay đổi đã staging, chưa staging và file chưa được theo dõi. Cấu hình remote không chứng minh push thành công; staging không phải commit; commit cục bộ không chứng minh phiên bản đã có trên GitHub. Chỉ báo thành công dựa trên kết quả thực tế.
- Với tác vụ tài liệu chỉ đổi số/nhóm/nhãn phiên bản, đối chiếu trước/sau để xác nhận nội dung mốc giữ lại không đổi ngoài phạm vi được phép; rà soát số thứ tự, tham chiếu, phạm vi nhóm, nhãn, liên kết và đồng bộ EN/VI. Báo cáo tác vụ ở L0; không cần bộ kiểm tra ứng dụng khi mã và hành vi ứng dụng không đổi.

## Thay đổi hướng dẫn cho agent

Quy trình xin phép này áp dụng từ lần sửa AGENTS tiếp theo sau đợt cập nhật do chủ dự án yêu cầu ngày 03/10/2026. Đợt này cần báo cáo, không cần xin duyệt lại.

- Yêu cầu đích danh của chủ dự án về việc sửa AGENTS cho phép thực hiện trực tiếp các thay đổi được yêu cầu. Báo cáo quy tắc sau khi sửa, đồng bộ hướng dẫn tiếng Việt và ghi vào cả hai changelog.
- Nếu công việc khác làm phát sinh nhu cầu đổi hướng dẫn cho agent, chuẩn bị nguyên văn đề xuất cùng lý do và ảnh hưởng, rồi hỏi chủ dự án trước khi ghi vào AGENTS hoặc sáp nhập vào quy tắc đang có hiệu lực. Trình bày đề xuất thành phần riêng có heading `Pending AGENTS proposal — DD/MM/YYYY`, điền ngày/tháng/năm thực tế, trước khi yêu cầu sáp nhập. Yêu cầu làm một tính năng ứng dụng không tự cho phép sửa AGENTS.
- Mỗi mục đề xuất pending phải nêu vị trí sáp nhập dự kiến (heading hiện có hoặc mới và vị trí chèn) cùng thao tác (thêm, thay thế hoặc xóa). Nếu thay thế/xóa, xác định hướng dẫn hiện có bị ảnh hưởng. Kèm nguyên văn đề xuất, lý do và ảnh hưởng; đồng bộ thông tin này trong hướng dẫn tiếng Việt. Khi được duyệt, chỉ tích hợp thay đổi đã cho phép tại vị trí đã nêu, rồi gỡ các mục pending đã sáp nhập. Các trường thông tin này không làm đề xuất có hiệu lực và không thay thế việc chủ dự án duyệt sáp nhập.
- Nếu chủ dự án cho phép ghi đề xuất nhưng chưa duyệt sáp nhập, đặt phần có ngày đó ở trên cùng AGENTS, trước các hướng dẫn có hiệu lực. Ghi rõ đây là đề xuất chưa có hiệu lực và đồng bộ phần này ở trên cùng hướng dẫn tiếng Việt. Chỉ sáp nhập sau khi được duyệt; nếu lần duyệt đã bao gồm cả ghi và sáp nhập thì không cần hỏi lần hai. Khi sáp nhập, gỡ phần chờ duyệt, đưa quy tắc đã duyệt vào nội dung chính và cập nhật cả hai changelog.
- Áp dụng cùng quy trình xin phép và đồng bộ khi tạo hoặc sửa `AGENTS.md` con. Dùng file con cho yêu cầu riêng của thư mục khi có ích; không dùng file con hoặc bản dịch để vượt qua quy tắc gốc hay yêu cầu xin phép của chủ dự án.

- Sau mỗi tác vụ chỉnh sửa được yêu cầu từ L1 trở lên, nếu còn đề xuất AGENTS chờ duyệt sáp nhập, thêm một nhắc ngắn trong báo cáo cuối, nêu đề xuất/ngày và hướng dẫn gốc hoặc con bị ảnh hưởng. Áp dụng cho cả đề xuất trong cuộc trò chuyện đã biết đang chờ sáp nhập và phần chờ đã được phép ghi vào file; không tự ghi đề xuất từ chat vào file khi chưa được phép. Không tự tạo trạng thái chờ hoặc tiếp tục nhắc sau khi đã sáp nhập hay được từ chối/rút lại rõ ràng. Đặt nhắc trước đề xuất phiên bản cuối cùng, tiếp tục công việc ứng dụng đã được phép, không hỏi duyệt lặp lại hoặc coi đề xuất là quy tắc có hiệu lực. Tác vụ chỉ L0 không bắt buộc nhắc này.

## Lệnh kiểm tra

Chạy từ thư mục gốc repo bằng trình thông dịch Python đã chọn cho dự án. Ví dụ dùng `python3`; trên máy hiện tại, dùng lệnh tương đương trỏ tới đúng trình thông dịch đó. Kiểm tra ảnh ở backend cần `cwebp` trong `PATH`. Kiểm tra trình duyệt cần Node.js, Playwright và Chromium/Chrome.

Kiểm tra toàn bộ:

```sh
python3 -m unittest discover -s tests -p 'test_*.py' -v
node tests/test_api_client.cjs
python3 tests/run_browser.py
```

Các nhóm backend riêng, chọn nhóm bị ảnh hưởng:

```sh
python3 -m unittest discover -s tests -p 'test_server.py' -v
python3 -m unittest discover -s tests -p 'test_admin.py' -v
python3 -m unittest discover -s tests -p 'test_foundation.py' -v
```

| Nhóm backend | Phạm vi |
| --- | --- |
| `test_server.py` | Route HTTP, xác thực, hồ sơ, ảnh, ghim, bình chọn và bảng xếp hạng |
| `test_admin.py` | Kiểm duyệt, báo cáo, hạn chế quyền, lịch sử quản trị và migration dữ liệu cũ |
| `test_foundation.py` | Service, tổng thống kê hồ sơ, phạm vi địa lý, tách biệt các instance ứng dụng, rollback/chạy lại migration và xử lý lỗi lưu ảnh |

Dùng chương trình chạy kiểm tra trình duyệt để tạo server và dữ liệu tạm riêng cho từng nhóm. Có thể truyền một hoặc nhiều tên file; không truyền tên file sẽ chạy tất cả các nhóm:

```sh
python3 tests/run_browser.py check_mobile_drawers.cjs
python3 tests/run_browser.py check_foundation_ui.cjs check_logout.cjs
```

| Nhóm trình duyệt | Chọn khi thay đổi |
| --- | --- |
| `check_browser.cjs` | Giao diện chung trang chính/bản đồ, hồ sơ/popup, bố cục, làm mới marker hoặc xử lý ảnh |
| `check_mobile_drawers.cjs` | Chuyển Menu/Admin trên mobile, kéo bảng hoặc bố cục theo kích thước màn hình |
| `check_interactive_pin.cjs` | Chọn vị trí, đặt ghim, biểu mẫu đăng bài hoặc tương tác bản đồ |
| `check_admin_ui.cjs` | Bảng Admin, báo cáo hoặc các luồng kiểm duyệt |
| `check_foundation_ui.cjs` | Tổng hồ sơ khi chỉ tải một phần ghim, các nơi mở hồ sơ hoặc xử lý đăng xuất thất bại |
| `check_logout.cjs` | Xác nhận/hủy đăng xuất trên trang chính/bản đồ bằng tiếng Việt/Anh ở kích thước desktop/mobile |

Nếu công cụ được cài ngoài `PATH`, dùng các biến môi trường `MEMEMAP_NODE`, `NODE_PATH` và `MEMEMAP_TEST_BROWSER` theo [hướng dẫn kiểm tra](TESTING.md); bản tiếng Anh tại `docs/en/TESTING.md`. Không ghi cố định đường dẫn runtime riêng của một lập trình viên vào file dự án.

## Dữ liệu kiểm tra và báo cáo

- Dùng database và thư mục ảnh tạm cho kiểm tra. Không thực hiện thao tác ghi thử hoặc migration thử trên dữ liệu người dùng đang chạy, kể cả khi dữ liệu dùng đường dẫn tùy chỉnh.
- Không thêm test chỉ lặp lại chi tiết triển khai hoặc không giúp bảo vệ hành vi có ý nghĩa đối với thay đổi nhỏ, dễ hoàn tác.
- Sau khi các kiểm tra bắt buộc đạt, chỉ chạy lại hoặc mở rộng khi có thay đổi mới, lỗi hoặc vấn đề chưa được giải quyết.
- Báo cáo mức kiểm tra đã chọn, các lệnh thực sự đã chạy, kết quả và những kiểm tra chưa hoàn thành cùng lý do. Kiểm tra bị chặn hoặc không thể chạy không được coi là đạt; kết quả trước đó không chứng minh các thay đổi về sau đã đạt.
- Phân biệt giả lập trình duyệt ở kích thước desktop/mobile với kiểm tra trên thiết bị iOS/Android thật. Không khẳng định đã kiểm tra thiết bị thật nếu chưa thực hiện.
