/* Moderation dashboard and report dialog. Drawer geometry stays in map-layout.js. */
(() => {
  const copy = {
    vi: {
      title:'Quản trị', eyebrow:'Quản trị · Hà Nội', overview:'Tổng quan', pins:'Meme', reports:'Báo cáo', users:'Người dùng', history:'Lịch sử quản trị', tabs:'Mục quản trị', back:'Quay lại', loading:'Đang tải…', retry:'Thử lại', empty:'Chưa có dữ liệu phù hợp.', search:'Tìm kiếm', filter:'Bộ lọc', reset:'Xóa bộ lọc', results:'kết quả', previous:'Trước', next:'Sau', page:'Trang', all:'Tất cả', status:'Trạng thái', visible:'Đang hiển thị', hidden:'Đã ẩn', image:'Ảnh', withImage:'Có ảnh', withoutImage:'Không có ảnh', since:'Từ ngày', until:'Đến ngày', sort:'Sắp xếp', newest:'Mới nhất', oldest:'Cũ nhất', aura_desc:'Aura cao nhất', aura_asc:'Aura thấp nhất', pinSearch:'Nội dung hoặc @username', userSearch:'Tên hoặc @username', viewMap:'Xem trên bản đồ', profile:'Xem hồ sơ', hide:'Ẩn meme', restore:'Khôi phục', remove:'Xóa vĩnh viễn', more:'Thao tác khác', reason:'Lý do', reasonPlaceholder:'Ghi rõ lý do xử lý…', hiddenReason:'Lý do ẩn', cancel:'Hủy', confirm:'Xác nhận', saving:'Đang lưu…', saved:'Đã cập nhật.', deleteDescription:'Meme và ảnh đi kèm sẽ bị xóa vĩnh viễn. Thao tác này không thể khôi phục.', deleted:'Đã xóa vĩnh viễn meme.', pending:'Chờ xử lý', reviewing:'Đang xem xét', resolved:'Đã xử lý', review:'Đánh dấu đang xem xét', dismiss:'Bỏ qua báo cáo', hideReport:'Ẩn meme và xử lý báo cáo', reportCount:'báo cáo', report:'Báo cáo meme', reportReason:'Loại báo cáo', detail:'Chi tiết', detailPlaceholder:'Thông tin giúp quản trị viên xem xét…', optional:'không bắt buộc', reportSent:'Đã gửi báo cáo. Quản trị viên sẽ xem xét.', spam:'Spam', harassment:'Quấy rối', inappropriate:'Nội dung không phù hợp', misleading:'Thông tin gây hiểu nhầm', other:'Khác', restrict:'Hạn chế quyền', lift:'Gỡ hạn chế', scope:'Quyền bị hạn chế', post:'Đăng meme', vote:'Bình chọn aura', both:'Đăng meme và bình chọn', duration:'Thời hạn', hour1:'1 giờ', hour24:'24 giờ', hour168:'7 ngày', hour720:'30 ngày', restricted:'Đang bị hạn chế', unrestricted:'Không bị hạn chế', admin:'Quản trị viên', joined:'Tham gia', expires:'Đến', postRestriction:'Hạn chế đăng meme', voteRestriction:'Hạn chế bình chọn', actor:'Quản trị viên thực hiện', action:'Hành động', target:'Đối tượng', newPins:'Meme mới', newUsers:'Người dùng mới', pendingReports:'Báo cáo chờ xử lý', imageBytes:'Dung lượng ảnh', alerts:'Cần xem xét', noAlerts:'Chưa ghi nhận dấu hiệu cần xem xét trong khoảng thời gian này.', today:'24 giờ qua', days7:'7 ngày qua', days30:'30 ngày qua', period:'Khoảng thời gian', refresh:'Làm mới', automaticNotice:'Các dấu hiệu dưới đây cần được quản trị viên xem xét trước khi xử lý.', deletedPin:'Meme đã xóa', removedContent:'Nội dung meme này đã bị xóa vĩnh viễn.', reportList:'Các báo cáo', close:'Đóng', targetHistory:'Lịch sử đối tượng', spamPinBurst:'Đăng meme dồn dập', spamDuplicate:'Nội dung trùng lặp', spamVoteBurst:'Bình chọn dồn dập', spamReports:'Meme có nhiều báo cáo', signal:'Dấu hiệu cần xem xét', mentions:'lần', clearTarget:'Xem toàn bộ lịch sử', activeRestrictions:'Hạn chế hiện tại', noRestrictions:'Không có hạn chế đang áp dụng.', historyFor:'Lịch sử của', targetPin:'Meme', targetUser:'Người dùng', time:'Thời gian', openList:'Về danh sách', requestFailed:'Không tải được dữ liệu. Hãy thử lại.', actionFailed:'Chưa thực hiện được thao tác. Hãy thử lại.', authentication_required:'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.', admin_required:'Tài khoản hiện tại không có quyền quản trị.', pin_not_found:'Meme không còn tồn tại. Hãy làm mới danh sách.', user_not_found:'Không tìm thấy người dùng.', duplicate_report:'Bạn đã báo cáo meme này và báo cáo vẫn đang chờ xử lý.', report_already_exists:'Bạn đã báo cáo meme này và báo cáo vẫn đang chờ xử lý.', invalid_reason:'Vui lòng nhập lý do hợp lệ.', reason_required:'Vui lòng nhập lý do xử lý.', cannot_restrict_admin:'Không thể hạn chế tài khoản quản trị viên.', self_restriction:'Không thể tự hạn chế tài khoản của bạn.', invalid_request:'Thông tin chưa hợp lệ. Hãy kiểm tra lại.', noReports:'Không có báo cáo trong mục này.', noPins:'Không tìm thấy meme phù hợp.', noUsers:'Không tìm thấy người dùng phù hợp.', noHistory:'Chưa có thao tác quản trị phù hợp.', invalid_date_range:'Ngày kết thúc cần bằng hoặc sau ngày bắt đầu.', sent:'Đã gửi báo cáo', pin_hide:'Ẩn meme', pin_restore:'Khôi phục meme', pin_delete:'Xóa meme', reports_review:'Xem xét báo cáo', reports_dismiss:'Bỏ qua báo cáo', reports_hide:'Ẩn meme từ báo cáo', user_restrict:'Hạn chế người dùng', user_lift:'Gỡ hạn chế người dùng',
    },
    en: {
      title:'Administration', eyebrow:'Admin · Hanoi', overview:'Overview', pins:'Memes', reports:'Reports', users:'Users', history:'Admin history', tabs:'Admin sections', back:'Back', loading:'Loading…', retry:'Try again', empty:'No matching records yet.', search:'Search', filter:'Filters', reset:'Clear filters', results:'results', previous:'Previous', next:'Next', page:'Page', all:'All', status:'Status', visible:'Visible', hidden:'Hidden', image:'Image', withImage:'With image', withoutImage:'Without image', since:'From date', until:'To date', sort:'Sort by', newest:'Newest', oldest:'Oldest', aura_desc:'Highest aura', aura_asc:'Lowest aura', pinSearch:'Content or @username', userSearch:'Name or @username', viewMap:'View on map', profile:'View profile', hide:'Hide meme', restore:'Restore', remove:'Delete permanently', more:'More actions', reason:'Reason', reasonPlaceholder:'Explain the reason for this action…', hiddenReason:'Hidden because', cancel:'Cancel', confirm:'Confirm', saving:'Saving…', saved:'Updated successfully.', deleteDescription:'The meme and its image will be permanently deleted. This cannot be undone.', deleted:'Meme permanently deleted.', pending:'Pending', reviewing:'In review', resolved:'Resolved', review:'Mark as in review', dismiss:'Dismiss reports', hideReport:'Hide meme and resolve reports', reportCount:'reports', report:'Report meme', reportReason:'Report category', detail:'Details', detailPlaceholder:'Information that will help an administrator review this…', optional:'optional', reportSent:'Report sent. An administrator will review it.', spam:'Spam', harassment:'Harassment', inappropriate:'Inappropriate content', misleading:'Misleading information', other:'Other', restrict:'Restrict permissions', lift:'Lift restriction', scope:'Permissions', post:'Post memes', vote:'Vote on aura', both:'Post and vote', duration:'Duration', hour1:'1 hour', hour24:'24 hours', hour168:'7 days', hour720:'30 days', restricted:'Restricted', unrestricted:'Not restricted', admin:'Administrator', joined:'Joined', expires:'Until', postRestriction:'Posting restricted', voteRestriction:'Voting restricted', actor:'Acting administrator', action:'Action', target:'Target', newPins:'New memes', newUsers:'New users', pendingReports:'Pending reports', imageBytes:'Image storage', alerts:'Needs review', noAlerts:'No review signals found for this period.', today:'Last 24 hours', days7:'Last 7 days', days30:'Last 30 days', period:'Period', refresh:'Refresh', automaticNotice:'These signals require an administrator to review them before taking action.', deletedPin:'Deleted meme', removedContent:'This meme has been permanently deleted.', reportList:'Reports received', close:'Close', targetHistory:'Target history', spamPinBurst:'Frequent meme posting', spamDuplicate:'Repeated content', spamVoteBurst:'Frequent voting', spamReports:'Meme reported repeatedly', signal:'Needs review', mentions:'occurrences', clearTarget:'View all history', activeRestrictions:'Current restrictions', noRestrictions:'No active restrictions.', historyFor:'History for', targetPin:'Meme', targetUser:'User', time:'Time', openList:'Back to list', requestFailed:'Could not load the data. Please try again.', actionFailed:'Could not complete this action. Please try again.', authentication_required:'Your session has expired. Please sign in again.', admin_required:'This account does not have administrator access.', pin_not_found:'This meme no longer exists. Refresh the list.', user_not_found:'User not found.', duplicate_report:'You already have an open report for this meme.', report_already_exists:'You already have an open report for this meme.', invalid_reason:'Please provide a valid reason.', reason_required:'Please explain the reason for this action.', cannot_restrict_admin:'Administrator accounts cannot be restricted.', self_restriction:'You cannot restrict your own account.', invalid_request:'Some information is invalid. Please check the form.', noReports:'There are no reports in this section.', noPins:'No matching memes found.', noUsers:'No matching users found.', noHistory:'No matching admin actions yet.', invalid_date_range:'The end date must be on or after the start date.', sent:'Report sent', pin_hide:'Hide meme', pin_restore:'Restore meme', pin_delete:'Delete meme', reports_review:'Review reports', reports_dismiss:'Dismiss reports', reports_hide:'Hide reported meme', user_restrict:'Restrict user', user_lift:'Lift user restriction',
    },
  };
  Object.assign(copy.vi, {
    hide_pin:'Ẩn meme', restore_pin:'Khôi phục meme', delete_pin:'Xóa meme', review_reports:'Xem xét báo cáo', dismiss_reports:'Bỏ qua báo cáo', resolve_reports:'Ẩn meme và xử lý báo cáo', restrict_post:'Hạn chế đăng meme', restrict_vote:'Hạn chế vote', lift_post:'Gỡ hạn chế đăng meme', lift_vote:'Gỡ hạn chế vote',
    report_already_open:'Bạn đã có báo cáo đang chờ xử lý cho meme này.', report_rate_limited:'Bạn đã gửi 10 báo cáo trong một giờ. Hãy thử lại sau.', protected_admin:'Không thể hạn chế tài khoản quản trị.', invalid_report_detail:'Vui lòng nhập chi tiết báo cáo (tối đa 500 ký tự).', invalid_report_reason:'Hãy chọn loại báo cáo.', open_reports_not_found:'Các báo cáo này đã được xử lý. Hãy tải lại danh sách.', invalid_duration:'Hãy chọn thời hạn hợp lệ.', invalid_date:'Ngày chưa hợp lệ.', moderation_storage_failed:'Chưa lưu được thay đổi. Hãy thử lại.',
    noAlerts:'Chưa có dấu hiệu bất thường gần đây.', since:'Từ ngày (UTC)', until:'Đến ngày (UTC)',
    posting_burst:'Đăng từ 5 meme trong 10 phút', duplicate_content:'Từ 3 meme trùng tiêu đề và nội dung trong 24 giờ', vote_burst:'Từ 20 thao tác vote trong 10 phút',
  });
  Object.assign(copy.en, {
    hide_pin:'Hide meme', restore_pin:'Restore meme', delete_pin:'Delete meme', review_reports:'Review reports', dismiss_reports:'Dismiss reports', resolve_reports:'Hide meme and resolve reports', restrict_post:'Restrict posting', restrict_vote:'Restrict voting', lift_post:'Lift posting restriction', lift_vote:'Lift voting restriction',
    report_already_open:'You already have an open report for this meme.', report_rate_limited:'You have submitted 10 reports in one hour. Please try again later.', protected_admin:'Administrator accounts cannot be restricted.', invalid_report_detail:'Please add report details (up to 500 characters).', invalid_report_reason:'Choose a report category.', open_reports_not_found:'These reports have already been handled. Refresh the list.', invalid_duration:'Choose a valid duration.', invalid_date:'Enter a valid date.', moderation_storage_failed:'Could not save the change. Please try again.',
    noAlerts:'No recent unusual activity signals.', since:'From date (UTC)', until:'Through date (UTC)',
    posting_burst:'5 or more memes in 10 minutes', duplicate_content:'3 or more memes with identical title and text in 24 hours', vote_burst:'20 or more vote actions in 10 minutes',
  });
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const defaults = {
    overview:{days:'7'},
    pins:{q:'',status:'all',image:'all',since:'',until:'',sort:'newest'},
    reports:{status:'pending'},
    users:{q:'',status:'all',since:'',until:''},
    history:{action:'',actor:'',target_type:'',target_id:''},
  };
  const actionKeys = ['hide_pin','restore_pin','delete_pin','review_reports','dismiss_reports','resolve_reports','restrict_post','restrict_vote','lift_post','lift_vote'];

  function createAdminDashboard({panel, apiClient, getLanguage, onChanged, onViewPin, onViewProfile, onNavigate}) {
    const body = panel.querySelector('#adminBody');
    const tabs = panel.querySelector('#adminTabs');
    const notice = panel.querySelector('#adminNotice');
    const heading = panel.querySelector('#adminHeading');
    const historyButton = panel.querySelector('#adminHistory');
    const overlay = document.getElementById('adminActionOverlay');
    const actionForm = document.getElementById('adminActionForm');
    const actionFields = document.getElementById('adminActionFields');
    const actionError = document.getElementById('adminActionError');
    const actionSubmit = document.getElementById('adminActionSubmit');
    const popup = MemeMap.createPopup(overlay);
    const state = {enabled:false,tab:'overview',page:1,data:null,loading:false,error:'',pending:0,focusPin:null,returnView:null,filters:structuredClone(defaults),expanded:new Set(),noticeKey:''};
    let request = 0, controller = null, dialog = null, dialogBusy = false, restoreFocus = null;
    let records = new Map(), alerts = [];
    const tr = key => (copy[getLanguage() === 'en' ? 'en' : 'vi'][key] || copy.en[key] || key);
    const locale = () => getLanguage() === 'en' ? 'en-US' : 'vi-VN';
    const number = value => new Intl.NumberFormat(locale()).format(Number(value) || 0);

    function asDate(value) {
      if (value === null || value === undefined || value === '') return null;
      if (typeof value === 'number' || /^\d+(\.\d+)?$/.test(String(value))) {
        const numeric = Number(value);
        return new Date(numeric < 1e12 ? numeric * 1000 : numeric);
      }
      let stamp = String(value).replace(' ', 'T');
      if (!/(Z|[+-]\d\d:\d\d)$/.test(stamp)) stamp += 'Z';
      return new Date(stamp);
    }
    function date(value) {
      const parsed = asDate(value);
      return parsed && !Number.isNaN(parsed.getTime()) ? parsed.toLocaleString(locale(), {dateStyle:'short',timeStyle:'short'}) : '—';
    }
    const activeRestriction = value => (asDate(value)?.getTime() || 0) > Date.now();
    function bytes(value) {
      const size = Number(value) || 0;
      const unit = size >= 1024 ** 3 ? 'GB' : size >= 1024 ** 2 ? 'MB' : size >= 1024 ? 'KB' : 'B';
      const divisor = {B:1,KB:1024,MB:1024 ** 2,GB:1024 ** 3}[unit];
      return `${new Intl.NumberFormat(locale(), {maximumFractionDigits:1}).format(size / divisor)} ${unit}`;
    }
    function imageUrl(value) {
      try {
        const url = new URL(value, location.origin);
        return url.origin === location.origin && /^\/(uploads|assets)\//.test(url.pathname) ? url.pathname + url.search : '';
      } catch { return ''; }
    }
    const option = (value, label, selected) => `<option value="${escape(value)}"${String(value) === String(selected) ? ' selected' : ''}>${escape(tr(label))}</option>`;
    const select = (name, label, choices, value, extra = '') => `<label>${escape(tr(label))}<select name="${escape(name)}" ${extra}>${choices.map(([key,text]) => option(key,text,value)).join('')}</select></label>`;
    const button = (action, label, id = '', style = '', extra = '') => `<button class="admin-button ${style}" type="button" data-admin-action="${action}"${id !== '' ? ` data-id="${escape(id)}"` : ''} ${extra}>${escape(tr(label))}</button>`;
    const empty = key => `<div class="admin-empty">${escape(tr(key))}</div>`;
    const badge = (key, style = '') => `<span class="admin-badge ${style}">${escape(tr(key))}</span>`;
    const signalBadges = record => (record.signals || []).map(kind => badge(kind,'warning')).join('');

    const api = apiClient.request;
    function showNotice(key, failed = false) {
      state.noticeKey = key;
      notice.textContent = tr(key);
      notice.dataset.error = String(failed);
      notice.hidden = !key;
    }
    function renderHeader() {
      panel.setAttribute('aria-label', tr('title'));
      panel.querySelector('#adminEyebrow').textContent = tr('eyebrow');
      heading.textContent = tr(state.tab === 'history' && !panel.classList.contains('mobile-peek') ? 'history' : 'title');
      historyButton.title = tr(state.tab === 'history' ? 'back' : 'history');
      historyButton.setAttribute('aria-label', historyButton.title);
      historyButton.textContent = state.tab === 'history' ? '←' : '↶';
      tabs.hidden = state.tab === 'history';
      tabs.setAttribute('aria-label', tr('tabs'));
      tabs.innerHTML = ['overview','pins','reports','users'].map(tab => `<button id="admin-tab-${tab}" class="admin-tab" type="button" role="tab" aria-controls="adminBody" aria-selected="${state.tab === tab}" tabindex="${state.tab === tab ? '0' : '-1'}" data-admin-tab="${tab}">${escape(tr(tab))}${tab === 'reports' && state.pending ? `<span class="admin-tab-count">${number(state.pending)}</span>` : ''}</button>`).join('');
      body.setAttribute('aria-label', tr(state.tab));
      if (state.tab !== 'history') body.setAttribute('aria-labelledby', `admin-tab-${state.tab}`);
      else body.removeAttribute('aria-labelledby');
      if (state.noticeKey) notice.textContent = tr(state.noticeKey);
    }
    function queryForm() {
      const filter = state.filters[state.tab];
      if (state.focusPin) return button('pin-list','openList','','admin-back');
      if (state.tab === 'overview') return `<form class="admin-filters"><div class="admin-search-row">${select('days','period',[['1','today'],['7','days7'],['30','days30']],filter.days)}${button('refresh','refresh')}</div></form>`;
      if (state.tab === 'reports') return `<form class="admin-filters">${select('status','status',[['pending','pending'],['reviewing','reviewing'],['resolved','resolved']],filter.status)}</form>`;
      if (state.tab === 'history') return `${button('history-back','back','','admin-back')}<form class="admin-filters"><div class="admin-filter-grid">${select('action','action',[['','all'],...actionKeys.map(key => [key,key])],filter.action)}<label>${escape(tr('actor'))}<input name="actor" value="${escape(filter.actor)}" placeholder="@username" maxlength="100"></label></div><button class="admin-button" type="submit">${escape(tr('search'))}</button>${filter.target_id ? `<p class="admin-muted">${escape(tr('historyFor'))} ${escape(tr(filter.target_type === 'user' ? 'targetUser' : 'targetPin'))} #${escape(filter.target_id)}</p>${button('history-all','clearTarget')}` : ''}</form>`;
      const isPins = state.tab === 'pins';
      const filtered = Object.keys(defaults[state.tab]).some(key => String(filter[key]) !== String(defaults[state.tab][key]));
      return `<form class="admin-filters"><div class="admin-search-row"><input type="search" name="q" value="${escape(filter.q)}" placeholder="${escape(tr(isPins ? 'pinSearch' : 'userSearch'))}" aria-label="${escape(tr('search'))}" maxlength="120"><button class="admin-button" type="submit">${escape(tr('search'))}</button></div><details class="admin-filter-options"${filtered ? ' open' : ''}><summary>${escape(tr('filter'))}</summary><div class="admin-filter-grid">${select('status','status',isPins ? [['all','all'],['visible','visible'],['hidden','hidden']] : [['all','all'],['restricted','restricted']],filter.status)}${isPins ? select('sort','sort',['newest','oldest','aura_desc','aura_asc'].map(key => [key,key]),filter.sort) + select('image','image',[['all','all'],['yes','withImage'],['no','withoutImage']],filter.image,'class="admin-full"') : ''}<label>${escape(tr('since'))}<input type="date" name="since" value="${escape(filter.since)}"></label><label>${escape(tr('until'))}<input type="date" name="until" value="${escape(filter.until)}"></label></div></details>${filtered ? `<button class="admin-filter-reset" type="button" data-admin-action="clear-filters">${escape(tr('reset'))}</button>` : ''}</form>`;
    }
    function pager(data) {
      if (!(data.total > 0)) return '';
      const pages = Math.max(1, Number(data.pages) || 1), page = Number(data.page) || state.page;
      return `<div class="admin-pagination">${button('previous','previous','','',page <= 1 ? 'disabled' : '')}<span>${escape(tr('page'))} ${number(page)} / ${number(pages)}</span>${button('next','next','','',page >= pages ? 'disabled' : '')}</div>`;
    }
    function pinCard(pin, forceOpen = false) {
      records.set(`pin:${pin.id}`, pin);
      const src = imageUrl(pin.image);
      return `<details class="admin-card" data-entry="pin:${Number(pin.id)}"${forceOpen || state.expanded.has(`pin:${pin.id}`) ? ' open' : ''}><summary><strong class="admin-card-title">${escape(pin.title)}</strong><span class="admin-card-meta">@${escape(pin.username)} · ${number(pin.aura)} aura<br>${escape(date(pin.created_at))}</span><span class="admin-badges">${badge(pin.is_hidden ? 'hidden' : 'visible',pin.is_hidden ? 'hidden' : '')}${signalBadges(pin)}</span></summary><div class="admin-card-content">${src ? `<img class="admin-meme-image" src="${escape(src)}" loading="lazy" alt="${escape(pin.title)}">` : ''}${pin.story ? `<p class="admin-story">${escape(pin.story)}</p>` : ''}${pin.is_hidden && pin.hidden_reason ? `<p class="admin-reason"><strong>${escape(tr('hiddenReason'))}:</strong> ${escape(pin.hidden_reason)}</p>` : ''}<div class="admin-actions">${button('map-pin','viewMap',pin.id)}${button('profile-pin','profile',pin.id)}${button(pin.is_hidden ? 'restore-pin' : 'hide-pin',pin.is_hidden ? 'restore' : 'hide',pin.id,pin.is_hidden ? 'primary' : '')}<details class="admin-overflow"><summary aria-label="${escape(tr('more'))}" title="${escape(tr('more'))}">⋯</summary><div class="admin-overflow-menu">${button('history-pin','targetHistory',pin.id)}${button('delete-pin','remove',pin.id,'danger')}</div></details></div></div></details>`;
    }
    function renderOverview(data) {
      const stats = data.stats || {};
      alerts = data.alerts || [];
      const cards = [['pendingReports',number(stats.pending_reports),'reports','urgent'],['alerts',number(alerts.length),'alerts','urgent'],['newPins',number(stats.new_pins),'new-pins',''],['newUsers',number(stats.new_users),'new-users','']];
      return `<div class="admin-stats-grid">${cards.map(([label,value,action,style]) => `<button class="admin-stat-card ${style}" type="button" data-admin-action="${action}"><span>${escape(tr(label))}</span><strong>${escape(value)}</strong></button>`).join('')}<div class="admin-stat-card"><span>${escape(tr('imageBytes'))}</span><strong>${escape(bytes(stats.image_bytes))}</strong></div></div><h2 class="admin-section-title" id="adminAlerts">${escape(tr('alerts'))}</h2>${alerts.length ? `<p class="admin-muted">${escape(tr('automaticNotice'))}</p>${alerts.map((alert,index) => {
        const names = {posting_burst:'spamPinBurst',duplicate_content:'spamDuplicate',vote_burst:'spamVoteBurst'};
        return `<button class="admin-alert" type="button" data-admin-action="alert" data-id="${index}"><strong>${escape(tr(names[alert.kind] || 'signal'))}</strong><span>${escape(alert.title || (alert.username ? '@' + alert.username : ''))}${alert.count != null ? ` · ${number(alert.count)} ${escape(tr('mentions'))}` : ''}</span><span>${escape(tr(alert.kind))}</span></button>`;
      }).join('')}` : empty('noAlerts')}`;
    }
    function renderReports(data) {
      if (!data.reports?.length) return empty('noReports');
      return data.reports.map(group => {
        records.set(`report:${group.pin_id}`,group);
        const gone = Boolean(group.pin_deleted), src = imageUrl(group.image);
        return `<details class="admin-card" data-entry="report:${Number(group.pin_id)}"${state.expanded.has(`report:${group.pin_id}`) ? ' open' : ''}><summary><strong class="admin-card-title">${escape(group.title || tr('deletedPin'))}</strong><span class="admin-card-meta">${group.username ? `@${escape(group.username)} · ` : ''}${number(group.report_count)} ${escape(tr('reportCount'))}<br>${escape(date(group.last_report_at))}</span><span class="admin-badges">${(group.reasons || []).map(reason => badge(reason,'warning')).join('')}${gone ? badge('deletedPin','hidden') : group.is_hidden ? badge('hidden','hidden') : ''}</span></summary><div class="admin-card-content">${gone ? `<p class="admin-muted">${escape(tr('removedContent'))}</p>` : `${src ? `<img class="admin-meme-image" src="${escape(src)}" alt="${escape(group.title)}" loading="lazy">` : ''}${group.story ? `<p class="admin-story">${escape(group.story)}</p>` : ''}<div class="admin-actions">${button('map-report','viewMap',group.pin_id)}${group.username ? button('profile-report','profile',group.pin_id) : ''}</div>`}<h3 class="admin-section-title">${escape(tr('reportList'))}</h3>${(group.reports || []).map(report => `<div class="admin-report"><strong>${escape(tr(report.reason))}</strong><span class="admin-card-meta">@${escape(report.username)} · ${escape(date(report.created_at))}<br>${escape(tr(report.status))}</span>${report.detail ? `<p>${escape(report.detail)}</p>` : ''}${report.resolved_by ? `<p class="admin-muted">@${escape(report.resolved_by)} · ${escape(date(report.resolved_at))}<br>${escape(report.resolution_reason || '')}</p>` : ''}</div>`).join('')}<div class="admin-actions">${state.filters.reports.status === 'pending' ? button('review-report','review',group.pin_id) : ''}${state.filters.reports.status !== 'resolved' ? button('dismiss-report','dismiss',group.pin_id) + (!gone && !group.is_hidden ? button('hide-report','hideReport',group.pin_id,'primary') : '') : ''}${button('history-report','targetHistory',group.pin_id)}</div></div></details>`;
      }).join('');
    }
    function renderUsers(data) {
      if (!data.users?.length) return empty('noUsers');
      return data.users.map(user => {
        records.set(`user:${user.id}`,user);
        const restricted = ['post','vote'].filter(scope => activeRestriction(user[`${scope}_restricted_until`]));
        return `<details class="admin-card" data-entry="user:${Number(user.id)}"${state.expanded.has(`user:${user.id}`) ? ' open' : ''}><summary><strong class="admin-card-title">${escape(user.name)}</strong><span class="admin-card-meta">@${escape(user.username)} · ${number(user.meme_count)} meme · ${number(user.aura)} aura</span><span class="admin-badges">${user.is_admin ? badge('admin') : ''}${restricted.length ? badge('restricted','warning') : ''}${signalBadges(user)}</span></summary><div class="admin-card-content"><p class="admin-muted">${escape(tr('joined'))}: ${escape(date(user.created_at))}</p>${restricted.length ? restricted.map(scope => `<div class="admin-restriction"><strong>${escape(tr(scope === 'post' ? 'postRestriction' : 'voteRestriction'))}</strong>${escape(tr('expires'))}: ${escape(date(user[`${scope}_restricted_until`]))}<p>${escape(user[`${scope}_restriction_reason`])}</p></div>`).join('') : `<p class="admin-muted">${escape(tr('noRestrictions'))}</p>`}<div class="admin-actions">${button('profile-user','profile',user.id)}${!user.is_admin ? button('restrict-user','restrict',user.id) : ''}${restricted.length ? button('lift-user','lift',user.id,'primary') : ''}${button('history-user','targetHistory',user.id)}</div></div></details>`;
      }).join('');
    }
    function renderHistory(data) {
      if (!data.entries?.length) return empty('noHistory');
      return data.entries.map(entry => `<article class="admin-audit-entry"><strong>${escape(tr(entry.action))}</strong><span>@${escape(entry.actor_username)} · ${escape(date(entry.created_at))}</span><span class="admin-card-meta">${escape(tr(entry.target_type === 'user' ? 'targetUser' : 'targetPin'))} #${escape(entry.target_id)} · ${escape(entry.target_label)}</span>${entry.reason ? `<p>${escape(entry.reason)}</p>` : ''}</article>`).join('');
    }
    function render() {
      renderHeader();
      if (!state.enabled) { body.innerHTML = ''; return; }
      records = new Map();
      body.setAttribute('aria-busy', String(state.loading));
      let html = queryForm();
      if (state.focusPin) html += pinCard(state.focusPin,true);
      else if (state.loading) html += empty('loading');
      else if (state.error) html += `<div class="admin-empty"><p>${escape(tr(state.error))}</p>${button('refresh','retry')}</div>`;
      else if (state.data) {
        const data = state.data;
        if (state.tab !== 'overview') html += `<div class="admin-results-line"><span>${number(data.total)} ${escape(tr('results'))}</span>${button('refresh','refresh')}</div>`;
        if (state.tab === 'overview') html += renderOverview(data);
        else if (state.tab === 'pins') html += data.pins?.length ? data.pins.map(pin => pinCard(pin)).join('') : empty('noPins');
        else if (state.tab === 'reports') html += renderReports(data);
        else if (state.tab === 'users') html += renderUsers(data);
        else html += renderHistory(data);
        if (state.tab !== 'overview') html += pager(data);
      }
      body.innerHTML = html;
    }
    async function refresh() {
      if (!state.enabled) return;
      if (state.focusPin) { render(); return; }
      controller?.abort();
      controller = new AbortController();
      const revision = ++request, tab = state.tab;
      state.loading = true; state.error = '';
      render();
      const params = new URLSearchParams({...state.filters[tab],page:String(state.page)});
      try {
        const data = await api(`/api/admin/${tab === 'history' ? 'audit' : tab}?${params}`,{signal:controller.signal});
        if (revision !== request || !state.enabled) return;
        state.data = data;
        if (tab === 'overview') state.pending = Number(data.stats?.pending_reports) || 0;
        if (tab === 'reports') state.pending = Number(data.pending_count) || 0;
        if (data.pages > 0 && state.page > data.pages) { state.page = data.pages; return refresh(); }
      } catch (error) {
        if (error.name === 'AbortError' || revision !== request) return;
        state.data = null; state.error = copy.en[error.message] ? error.message : 'requestFailed';
      } finally {
        if (revision === request) { state.loading = false; render(); }
      }
    }
    function openTab(tab, filters = {}) {
      if (!state.enabled || !Object.hasOwn(defaults,tab)) return;
      state.tab = tab; state.focusPin = null; state.page = 1; state.expanded.clear();
      state.filters[tab] = {...defaults[tab],...Object.fromEntries(Object.entries(filters).filter(([key]) => Object.hasOwn(defaults[tab],key)))};
      body.scrollTop = 0; showNotice('');
      return refresh();
    }
    function openPin(pin) {
      if (!state.enabled || !pin || !Number.isFinite(Number(pin.id))) return;
      controller?.abort(); request++;
      state.tab = 'pins'; state.page = 1; state.focusPin = {...pin}; state.loading = false; state.error = ''; state.data = null;
      body.scrollTop = 0; showNotice(''); render();
    }
    function openHistory(targetType = '', targetId = '') {
      if (state.tab !== 'history') state.returnView = {tab:state.tab,filters:{...state.filters[state.tab]},focusPin:state.focusPin};
      return openTab('history',{target_type:targetType,target_id:String(targetId)});
    }
    function returnFromHistory() {
      const previous = state.returnView;
      state.returnView = null;
      return previous?.focusPin ? openPin(previous.focusPin) : openTab(previous?.tab || 'overview',previous?.filters || {});
    }
    function periodFilters() {
      const stamp = new Date(Date.now() - Number(state.filters.overview.days) * 86400000);
      return {since:stamp.toISOString().slice(0,10)};
    }

    function renderDialog(values = {}) {
      if (!dialog) return;
      const {kind,target} = dialog;
      const titles = {hide:'hide',restore:'restore',delete:'remove',review:'review',dismiss:'dismiss',hideReport:'hideReport',restrict:'restrict',lift:'lift',report:'report'};
      document.getElementById('adminActionTitle').textContent = tr(titles[kind]);
      document.getElementById('adminActionDescription').textContent = kind === 'delete' ? `${target.title || ''} — ${tr('deleteDescription')}` : target.title || (target.username ? '@' + target.username : '');
      document.getElementById('adminActionClose').setAttribute('aria-label',tr('close'));
      document.getElementById('adminActionCancel').textContent = tr('cancel');
      actionSubmit.textContent = tr(dialogBusy ? 'saving' : kind === 'report' ? 'report' : 'confirm');
      actionSubmit.classList.toggle('danger',kind === 'delete');
      let fields = '';
      if (kind === 'report') {
        fields += `<div class="field">${select('reason','reportReason',['spam','harassment','inappropriate','misleading','other'].map(key => [key,key]),values.reason || 'spam')}</div><div class="field"><label for="adminActionDetail">${escape(tr('detail'))} (${escape(tr('optional'))})</label><textarea id="adminActionDetail" name="detail" maxlength="500" placeholder="${escape(tr('detailPlaceholder'))}">${escape(values.detail || '')}</textarea></div>`;
      } else {
        if (kind === 'restrict' || kind === 'lift') {
          const scopes = kind === 'lift' ? ['post','vote'].filter(scope => activeRestriction(target[`${scope}_restricted_until`])) : ['post','vote'];
          if (scopes.length > 1) scopes.push('both');
          fields += `<div class="field">${select('scope','scope',scopes.map(key => [key,key]),values.scope || (scopes.includes('both') ? 'both' : scopes[0]))}</div>`;
          if (kind === 'restrict') fields += `<div class="field">${select('duration_hours','duration',[['1','hour1'],['24','hour24'],['168','hour168'],['720','hour720']],values.duration_hours || '24')}</div>`;
        }
        fields += `<div class="field"><label for="adminActionReason">${escape(tr('reason'))}</label><textarea id="adminActionReason" name="reason" required maxlength="500" placeholder="${escape(tr('reasonPlaceholder'))}">${escape(values.reason || '')}</textarea></div>`;
      }
      actionFields.innerHTML = fields;
      for (const element of actionForm.elements) element.disabled = dialogBusy;
    }
    function openDialog(kind,target) {
      if (dialogBusy) return;
      restoreFocus = document.activeElement;
      actionSubmit.hidden = false;
      dialog = {kind,target}; actionError.textContent = '';
      renderDialog(); popup.open();
      requestAnimationFrame(() => actionFields.querySelector('select,textarea,input')?.focus({preventScroll:true}));
    }
    function closeDialog() {
      if (dialogBusy) return;
      popup.close(); dialog = null;
      if (restoreFocus?.isConnected) restoreFocus.focus({preventScroll:true});
    }
    actionForm.addEventListener('submit',async event => {
      event.preventDefault();
      if (!dialog || dialogBusy) return;
      const values = Object.fromEntries(new FormData(actionForm));
      if (dialog.kind !== 'report' && !values.reason?.trim()) { actionError.textContent = tr('reason_required'); return; }
      if (dialog.kind === 'report' && values.reason === 'other' && !values.detail?.trim()) { actionError.textContent = tr('invalid_report_detail'); return; }
      const current = dialog, {kind,target} = current;
      let endpoint, payload, method = 'POST';
      if (kind === 'report') { endpoint = `/api/pins/${target.id}/reports`; payload = {reason:values.reason,detail:(values.detail || '').trim()}; }
      else if (kind === 'hide' || kind === 'restore') { endpoint = `/api/admin/pins/${target.id}/moderate`; payload = {action:kind,reason:values.reason.trim()}; }
      else if (kind === 'delete') { endpoint = `/api/pins/${target.id}`; payload = {reason:values.reason.trim()}; method = 'DELETE'; }
      else if (['review','dismiss','hideReport'].includes(kind)) { endpoint = `/api/admin/reports/${target.pin_id}`; payload = {action:kind === 'hideReport' ? 'hide' : kind,reason:values.reason.trim()}; }
      else { endpoint = `/api/admin/users/${target.id}/restrictions`; payload = {scope:values.scope,action:kind === 'lift' ? 'lift' : 'restrict',duration_hours:Number(values.duration_hours || 24),reason:values.reason.trim()}; }
      dialogBusy = true; actionError.textContent = ''; renderDialog(values);
      try {
        await api(endpoint,{method, json: payload});
        dialogBusy = false;
        if (kind === 'report') {
          dialog = null;
          document.getElementById('adminActionTitle').textContent = tr('sent');
          document.getElementById('adminActionDescription').textContent = tr('reportSent');
          actionFields.innerHTML = '';
          actionSubmit.hidden = true;
          for (const element of actionForm.elements) element.disabled = false;
          document.getElementById('adminActionCancel').textContent = tr('close');
          document.getElementById('adminActionCancel').focus({preventScroll:true});
        } else {
          closeDialog(); state.focusPin = null;
          showNotice(kind === 'delete' ? 'deleted' : 'saved');
        }
        // A completed moderation stays completed even if a follow-up map refresh fails.
        try { await onChanged?.(); } catch { /* The map owns its own load error presentation. */ }
        if (state.enabled) await refresh();
      } catch (error) {
        dialogBusy = false;
        if (dialog !== current) return;
        renderDialog(values);
        actionError.textContent = tr(copy.en[error.message] ? error.message : 'actionFailed');
      }
    });
    document.getElementById('adminActionClose').addEventListener('click',closeDialog);
    document.getElementById('adminActionCancel').addEventListener('click',closeDialog);
    overlay.addEventListener('click',event => { if (event.target === overlay) closeDialog(); });
    overlay.addEventListener('keydown',event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeDialog(); }
      if (event.key !== 'Tab') return;
      const focusable = [...actionForm.querySelectorAll('button,input,select,textarea,a[href]')].filter(element => !element.disabled && !element.hidden);
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    historyButton.addEventListener('click',() => {
      onNavigate?.('adminTab');
      state.tab === 'history' ? returnFromHistory() : openHistory();
    });
    panel.addEventListener('sheetlevelchange', () => {
      heading.textContent = tr(state.tab === 'history' && !panel.classList.contains('mobile-peek') ? 'history' : 'title');
    });
    tabs.addEventListener('keydown',event => {
      if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
      const names = ['overview','pins','reports','users'], index = names.indexOf(state.tab);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? names.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + names.length) % names.length;
      event.preventDefault(); onNavigate?.('adminTab'); openTab(names[next]);
      document.getElementById(`admin-tab-${names[next]}`)?.focus();
    });
    panel.addEventListener('toggle',event => {
      const entry = event.target.dataset.entry;
      if (entry) event.target.open ? state.expanded.add(entry) : state.expanded.delete(entry);
    },true);
    body.addEventListener('input',event => {
      const name = event.target.name;
      if (name && Object.hasOwn(state.filters[state.tab],name)) state.filters[state.tab][name] = event.target.value;
    });
    body.addEventListener('change',event => {
      if (event.target.matches('select,input[type="date"]')) event.target.closest('form')?.requestSubmit();
    });
    body.addEventListener('submit',event => {
      event.preventDefault();
      Object.assign(state.filters[state.tab],Object.fromEntries(new FormData(event.target)));
      const filters = state.filters[state.tab];
      if (filters.since && filters.until && filters.since > filters.until) { showNotice('invalid_date_range',true); return; }
      state.page = 1; state.expanded.clear(); showNotice(''); refresh();
    });
    panel.addEventListener('click',event => {
      const tab = event.target.closest('[data-admin-tab]');
      if (tab) {
        const mobileNavigation = onNavigate?.('adminTab');
        if (!mobileNavigation || tab.dataset.adminTab !== state.tab || state.focusPin) openTab(tab.dataset.adminTab);
        return;
      }
      const target = event.target.closest('[data-admin-action]');
      if (!target || target.disabled) return;
      const action = target.dataset.adminAction, id = target.dataset.id;
      const pin = records.get(`pin:${id}`), report = records.get(`report:${id}`), user = records.get(`user:${id}`);
      if (action === 'refresh') refresh();
      else if (action === 'previous' || action === 'next') { state.page += action === 'next' ? 1 : -1; state.expanded.clear(); body.scrollTop = 0; refresh(); }
      else if (action === 'clear-filters') openTab(state.tab);
      else if (action === 'pin-list') openTab('pins');
      else if (action === 'history-back') returnFromHistory();
      else if (action === 'history-all') openTab('history');
      else if (action === 'history-pin' || action === 'history-report') openHistory('pin',id);
      else if (action === 'history-user') openHistory('user',id);
      else if (action === 'reports') openTab('reports');
      else if (action === 'new-pins') openTab('pins',periodFilters());
      else if (action === 'new-users') openTab('users',periodFilters());
      else if (action === 'alerts') body.querySelector('#adminAlerts')?.scrollIntoView({behavior:'smooth',block:'start'});
      else if (action === 'alert') {
        const alert = alerts[Number(id)];
        if (alert?.pin_id) openTab('pins',{q:alert.username ? '@' + alert.username : String(alert.title || '').slice(0,120)});
        else if (alert?.username) openTab('users',{q:alert.username});
      }
      else if (action === 'map-pin' && pin) onViewPin?.(pin);
      else if (action === 'map-report' && report) onViewPin?.({...report,id:report.pin_id});
      else if (action === 'profile-pin' && pin) onViewProfile?.(pin.username);
      else if (action === 'profile-report' && report) onViewProfile?.(report.username);
      else if (action === 'profile-user' && user) onViewProfile?.(user.username);
      else if (action === 'hide-pin' && pin) openDialog('hide',pin);
      else if (action === 'restore-pin' && pin) openDialog('restore',pin);
      else if (action === 'delete-pin' && pin) openDialog('delete',pin);
      else if (action === 'review-report' && report) openDialog('review',report);
      else if (action === 'dismiss-report' && report) openDialog('dismiss',report);
      else if (action === 'hide-report' && report) openDialog('hideReport',report);
      else if (action === 'restrict-user' && user) openDialog('restrict',user);
      else if (action === 'lift-user' && user) openDialog('lift',user);
    });
    return {
      setEnabled(enabled) {
        const changed = state.enabled !== Boolean(enabled);
        state.enabled = Boolean(enabled);
        if (!state.enabled) {
          controller?.abort(); request++; state.data = null; state.loading = false; state.focusPin = null;
          if (dialog && dialog.kind !== 'report' && !dialogBusy) closeDialog();
          render();
        } else if (changed) refresh();
      },
      setLanguage() {
        render();
        if (dialog) renderDialog(Object.fromEntries(new FormData(actionForm)));
      },
      refresh, openTab, openPin,
      reportPin(pinId) {
        const id = Number(pinId);
        if (!Number.isFinite(id) || id < 1) return;
        actionSubmit.hidden = false;
        openDialog('report',{id});
      },
    };
  }
  window.MemeMap.createAdminDashboard = createAdminDashboard;
})();
