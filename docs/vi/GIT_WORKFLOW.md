# GitHub, nhánh và hai phiên bản map chạy song song

[English](../en/GIT_WORKFLOW.md) · **Tiếng Việt** · [Mục lục tài liệu](README.md)

Đây là kế hoạch thực hiện cho lần đẩy GitHub và chuyển sang MapLibre + OpenFreeMap sau này. Việc ghi tài liệu này không commit/push, tạo branch/worktree, chạy server hay chuyển map. Hướng dẫn được đối chiếu ngày 04/10/2026; cần kiểm tra lại trạng thái repo trước khi thực hiện.

Trạng thái migration (07/10/2026): nhánh local `codex/maplibre-openfreemap` đã có và checkout gốc hiện đang ở nhánh đó. Sửa đổi migration chưa commit; tác vụ này chưa tạo worktree thứ hai, tag baseline, commit/push migration hoặc release. Sửa đổi chính sách chưa commit có sẵn vẫn được giữ trong working tree. Để so sánh hai bản, trước tiên bảo toàn thay đổi đã rà soát bằng commit được cho phép rõ ràng, rồi dùng checkout/dữ liệu riêng như dưới đây. Không chuyển checkout đang có thay đổi sang `main` rồi mặc định đang chạy bản cũ: sửa đổi chưa commit có thể đi theo khi chuyển nhánh. Lệnh upload/tag/merge dưới đây vẫn là hướng dẫn cần được cho phép.

## Bố trí dự kiến

| Phiên bản | Branch | Thư mục | URL tại máy | Dữ liệu chạy |
| --- | --- | --- | --- | --- |
| Bản Leaflet hiện tại làm mốc | `main` | `meme-map/` | `http://127.0.0.1:8000` | `mememap-data/leaflet/` |
| Bản thử MapLibre + OpenFreeMap | `codex/maplibre-openfreemap` | `meme-map-maplibre/` | `http://127.0.0.1:8001` | `mememap-data/maplibre/` |

Các thư mục trên nằm ngang hàng. Nhánh migration đã có; thư mục thứ hai vẫn là đề xuất. Mỗi bản checkout chứa toàn bộ mã nguồn ở phiên bản đó. Chỉ tạo branch chưa tạo được thư mục chạy thứ hai; [Git worktree](https://git-scm.com/docs/git-worktree) tạo các checkout riêng dùng chung lịch sử Git. Thay đổi chưa commit và file bị ignore không được sao chép sang checkout mới.

Repo tại máy có `main`, nhánh migration và baseline Leaflet chia module đã commit tại `41fb364` (đối chiếu nguồn ngày 07/10/2026). Sửa đổi migration vẫn chưa commit. `origin` được cấu hình cho `https://github.com/hobk-116/mememap.git`. Có remote được cấu hình không chứng minh GitHub đang chứa những commit nào hoặc tài khoản hiện tại có quyền ghi.

## 1. Bảo toàn dữ liệu và kiểm tra repo

Sao lưu database và uploads thực tế cùng nhau theo [hướng dẫn sao lưu](BACKUP.md). GitHub giữ lịch sử mã nguồn, không sao lưu tài khoản, bài đăng hay ảnh tải lên. Dữ liệu ở đường dẫn tùy chỉnh cũng phải nằm ngoài mã nguồn được theo dõi.

Trong `meme-map/`, kiểm tra:

```sh
git status --short
git branch --show-current
git remote -v
git log -5 --oneline
git ls-files
git fetch origin
git log --oneline --graph --decorate --all -15
```

Xác nhận danh tính Git, đăng nhập GitHub và quyền công khai/riêng tư của repo trước khi tải lên. Dùng repo hiện có nếu quyền truy cập đúng; nếu chưa tồn tại, tạo repo trống trong tài khoản chủ dự án rồi cập nhật `origin` theo URL thực tế. Không tạo repo Git lồng bên trong repo này. Nếu remote vừa tải về có thay đổi độc lập, xử lý có chủ đích; không force-push đè công việc của người khác.

Rà soát `.gitignore` và từng file sẽ stage. Nó bỏ qua `.env`/`.env.*` (trừ `.env.example` mẫu đã bỏ thông tin nhạy cảm), `.venv/`/`venv/`, cache Python, `.DS_Store`, database `*.sqlite`/`*.sqlite3` cùng file WAL/SHM/journal, `uploads/`, `backups/` ở gốc, `node_modules/`, `.next/` và `out/` ở gốc. Quy tắc Next.js là chuẩn bị cho lần chuyển đổi sau, không có nghĩa Next.js đã được cài đặt. Database tùy chỉnh có đuôi khác, thư mục ảnh/sao lưu tùy chỉnh và file thông tin đăng nhập có tên khác vẫn cần quy tắc riêng hoặc đặt ngoài repo. Ignore không bỏ theo dõi file đã commit. Giữ token tunnel và thông tin đăng nhập ngoài Git. Đưa đủ module nguồn, assets, tests, tài liệu song ngữ và các lần di chuyển archive có chủ đích vào bản commit.

## 2. Ghi và đẩy bản Leaflet làm mốc

Hoàn tất rà soát thay đổi hiện tại trên `main` trước. Chọn kiểm tra theo [AGENTS](../../AGENTS.md) và [hướng dẫn kiểm tra](TESTING.md). Với bản nền rộng trước khi chuyển map, dự kiến kiểm tra đầy đủ L4:

```sh
python3 -m unittest discover -s tests -p 'test_*.py' -v
node tests/test_api_client.cjs
python3 tests/run_browser.py
```

Đây là lệnh cho lần thực hiện sau, không phải kết quả kiểm tra khi viết tài liệu L0 này. Xử lý lỗi hoặc ghi rõ phần bị chặn trước khi gọi bản mốc là đã được xác minh. Sau đó chỉ stage bộ mã nguồn đã rà soát; `git add -A` dưới đây giả định đã kiểm tra ignore và danh sách file:

```sh
git add -A
git diff --cached --name-status
git diff --cached --stat
git diff --cached
git commit -m "Record current Leaflet baseline"
git push -u origin main
git tag -a baseline-leaflet -m "Leaflet baseline before MapLibre migration"
git push origin baseline-leaflet
```

Chỉ tạo tag sau đúng commit làm mốc và push thành công; xác nhận tag đề xuất chưa tồn tại. Nếu push bị từ chối, xem lịch sử vừa fetch và quyền truy cập trước khi thử lại. Tham khảo [hướng dẫn push của GitHub](https://docs.github.com/en/get-started/using-git/pushing-commits-to-a-remote-repository). Không dùng force-push làm cách xử lý thông thường. Kiểm tra trên GitHub có commit mới và đủ thư mục cần thiết. Tag giữ đúng bản mã nguồn đã chọn ngay cả khi `main` nhận thêm sửa lỗi sau này.

## 3. Tạo checkout chuyển map

Chỉ sau khi đã commit đủ file thuộc bản mốc, tại thư mục gốc:

```sh
git worktree add -b codex/maplibre-openfreemap ../meme-map-maplibre main
git worktree list
```

Giữ thư mục hiện tại trên `main`; mở `meme-map-maplibre/` trong cửa sổ editor riêng để chuyển map. Nếu branch đã tồn tại, kiểm tra nó rồi dùng `git worktree add ../meme-map-maplibre codex/maplibre-openfreemap`. Thông thường một branch không thể được checkout trong hai worktree cùng lúc. Nếu Codex tạo checkout, dùng quy trình worktree được ứng dụng quản lý và đường dẫn trả về; không tạo thêm bản thủ công trùng lặp. Ref bắt đầu cụ thể phải trỏ đến bản mốc đã commit.

## 4. Chạy cả hai với trạng thái riêng

Tạo các thư mục dữ liệu ngang hàng. Có thể dùng tài khoản thử mới ở mỗi bản, hoặc chép cùng một bộ sao lưu database/ảnh nhất quán vào từng thư mục khi cả hai server đã dừng. Không trỏ bản thử vào database hoặc ảnh đang phục vụ thật, kể cả khi dự kiến chỉ sửa frontend. Không chép SQLite đang chạy nếu chưa có bản sao lưu nhất quán. Hai bản sao giúp có bộ dữ liệu ban đầu để đối chiếu; thay đổi sau đó không tự đồng bộ.

Với shell macOS/Linux, terminal A ở `meme-map/`:

```sh
mkdir -p ../mememap-data/leaflet
MEMEMAP_HOST=127.0.0.1 MEMEMAP_PORT=8000 MEMEMAP_SECURE_COOKIE=0 MEMEMAP_DB_PATH="$PWD/../mememap-data/leaflet/mememap.sqlite3" MEMEMAP_UPLOADS_PATH="$PWD/../mememap-data/leaflet/uploads" python3 server.py
```

Terminal B ở `meme-map-maplibre/`:

```sh
mkdir -p ../mememap-data/maplibre
MEMEMAP_HOST=127.0.0.1 MEMEMAP_PORT=8001 MEMEMAP_SECURE_COOKIE=0 MEMEMAP_DB_PATH="$PWD/../mememap-data/maplibre/mememap.sqlite3" MEMEMAP_UPLOADS_PATH="$PWD/../mememap-data/maplibre/uploads" python3 server.py
```

Hai server cần terminal/process riêng. Dừng bằng `Ctrl+C`. Nếu dịch vụ khác đã dùng cổng, dừng nó hoặc chọn cổng khác. Nếu server ổn định hiện tại đang phục vụ người dùng thật, giữ cấu hình của nó và dùng thêm cổng/bộ dữ liệu thử để đối chiếu, thay vì thay đường dẫn dữ liệu đang phục vụ.

Tương đương trên Windows PowerShell: trong từng checkout, đặt cổng/thư mục dữ liệu phù hợp trước khi chạy Python. Ví dụ với checkout chuyển map:

```powershell
New-Item -ItemType Directory -Force ../mememap-data/maplibre
$env:MEMEMAP_HOST = "127.0.0.1"
$env:MEMEMAP_PORT = "8001"
$env:MEMEMAP_SECURE_COOKIE = "0"
$env:MEMEMAP_DB_PATH = Join-Path (Get-Location).Path "../mememap-data/maplibre/mememap.sqlite3"
$env:MEMEMAP_UPLOADS_PATH = Join-Path (Get-Location).Path "../mememap-data/maplibre/uploads"
python server.py
```

Dùng lệnh Python đã chọn cho project trên máy đó. Với terminal bản mốc, thay `maplibre` bằng `leaflet` và cổng `8001` bằng `8000`.

**Phiên trình duyệt:** cổng không tách cookie. Cookie hiện tại là `mememap_session`, giới hạn theo host và có `Path=/`; hai server trên `127.0.0.1` có thể ghi đè cookie đăng nhập của nhau dù khác cổng. Dùng profile trình duyệt riêng hoặc hai trình duyệt khác nhau cho hai bản. Hai tab trong cùng profile, hoặc nhiều cửa sổ riêng tư dùng chung một phiên riêng tư, chưa đủ. Xem [phạm vi cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies). Khác cổng tách origin của `localStorage`, nhưng chưa đủ tách đăng nhập.

Khi thử công khai/mobile, theo [triển khai Cloudflare Tunnel](DEPLOYMENT.md): trỏ các hostname HTTPS riêng đến hai cổng localhost, đặt `MEMEMAP_SECURE_COOKIE=1` cho các lượt chạy đó và dùng URL HTTPS. Không mặc định dùng IP công khai trực tiếp, mở cổng router hay DDNS. Chỉ GitHub Pages không chạy được server Python và API yêu cầu đăng nhập của project.

## 5. Chuyển map và kiểm tra trên branch tính năng

Trình tự dự kiến:

1. Kiểm kê chỗ phụ thuộc Leaflet trong `landing.html`, `map.js`, `map-layout.js`, `map-pins.js`, `map-composer.js`, CSS và bài kiểm tra trình duyệt; tính cả xem trước ghim từ Admin và nút vị trí. Định nghĩa giao diện map nhỏ cho camera, chuyển đổi tọa độ, marker, popup và sự kiện trước khi thay các lời gọi đó.
2. Chốt phiên bản MapLibre GL JS đã rà soát, nạp CSS/worker đúng cách. [Tài liệu MapLibre](https://maplibre.org/maplibre-gl-js/docs/) mô tả bộ dựng bản đồ; [hướng dẫn OpenFreeMap](https://openfreemap.org/quick_start/) cung cấp style, hiện gồm `https://tiles.openfreemap.org/styles/liberty`. URL style không phải URL thay trực tiếp cho template tile raster.
3. Chuyển tọa độ phía map cẩn thận: MapLibre dùng kinh độ/vĩ độ, còn field API hiện có vẫn là `lat`/`lng`. Giữ yêu cầu đăng nhập, giới hạn đặt ghim, quyền, tọa độ đã lưu và attribution nhìn thấy được. Đối chiếu camera/zoom bằng giao diện thay vì mặc định con số giữa hai engine tương đương.
4. Chuyển căn chỉnh/thứ tự lớp ghim cố định, tương tác popup, các mức/ghi nhớ Menu/Admin, animation Memerboard, chọn/đặt ghim, vị trí, bình chọn và xem trước kiểm duyệt. Giữ bản mốc chạy để đối chiếu song song. Không gộp community/schema vào việc đổi bộ dựng bản đồ nếu chưa xác định phạm vi riêng.
5. Xếp chuyển engine ở L4: đọc API/module trước và sau sửa; cập nhật docs/changelog EN/VI và các bài kiểm tra đang dùng selector/global Leaflet. Giữ kiểm tra hành vi. Bao phủ lỗi tải map/worker/style và kiểm tra riêng WebGL, chạm, bàn phím, hiệu năng trên iOS/Android thật. Chạy toàn bộ kiểm tra tại checkout chuyển map với fixture tạm, không dùng database của hai bản đang đối chiếu.

Commit từng mốc có thể rà soát tại thư mục chuyển map, đọc diff được stage trước mỗi commit rồi tải branch tính năng lên:

```sh
git push -u origin codex/maplibre-openfreemap
```

Mỗi người/agent dùng checkout và branch tính năng riêng. Thành viên dùng Windows clone repo về ổ đĩa máy và pull/push qua GitHub; không để các agent đồng thời sửa chung một thư mục qua SMB. Cấu hình đường dẫn dữ liệu trên từng host; chuyển database/ảnh là công việc riêng.

## 6. Rà soát, sáp nhập và giữ bản dự phòng

Mở pull request từ `codex/maplibre-openfreemap` vào `main`, nêu thay đổi, lệnh/kết quả, phạm vi thiết bị và giới hạn còn lại. Trong lúc chuyển map, có thể merge sửa lỗi từ `main` vào branch tính năng từ checkout của nó sau khi fetch, xử lý xung đột và chạy lại kiểm tra liên quan. Giữ hợp đồng kiểm tra phù hợp với engine dự kiến.

Chỉ merge sau khi chủ dự án chọn bản đã kiểm tra. Merge trên GitHub không cập nhật server đang chạy: dừng server bản mốc, đảm bảo checkout sạch, cập nhật bằng `git pull --ff-only origin main`, sao lưu dữ liệu chạy rồi khởi động lại với cấu hình đúng. Kiểm tra tuyến tunnel công khai và các luồng chính. Giữ tag bản mốc cùng bộ dữ liệu sao lưu tương ứng; quay về mã nguồn không tự đảo ngược migration schema/dữ liệu về sau. Nếu cần giữ bản cũ song song với `main` mới, có thể chạy checkout detached của `baseline-leaflet` bằng bản sao dữ liệu/cổng riêng.

Không xóa checkout chuyển map khi server/editor còn dùng nó hoặc còn file chưa commit/bị ignore cần giữ. Sau khi bảo toàn file cần thiết, dùng `git worktree remove ../meme-map-maplibre`, hoặc lưu trữ worktree do ứng dụng quản lý qua Codex. Branch remote, lịch sử nguồn và bản sao dữ liệu ngoài repo là các phần riêng với dọn worktree.
