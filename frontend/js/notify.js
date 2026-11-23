const Notify = (() => {
  let items = [];
  let timer = null;
  let lastFocus = null;

  const TYPES = {
    event: { label: 'Event', tone: 'brand' },
    announcement: { label: 'Announcement', tone: 'blue' },
    promo: { label: 'Promo', tone: 'amber' },
    system: { label: 'System', tone: 'slate' }
  };

  function readKey() {
    const user = Auth.user() || {};
    return 'civic_read_' + user.id;
  }

  function readSet() {
    try {
      return new Set(JSON.parse(localStorage.getItem(readKey()) || '[]'));
    } catch (e) {
      return new Set();
    }
  }

  function writeSet(set) {
    try {
      localStorage.setItem(readKey(), JSON.stringify(Array.from(set)));
      return true;
    } catch (e) {
      return false;
    }
  }

  function isRead(n) {
    return n.read === true || readSet().has(n.id);
  }

  function unreadCount() {
    const set = readSet();
    return items.filter(n => !(n.read === true || set.has(n.id))).length;
  }

  function typeInfo(type) {
    return TYPES[type] || { label: type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Update', tone: 'slate' };
  }

  function link(n) {
    const meta = n.metadata || {};
    if (meta.event_id) return { href: 'event-detail.html?id=' + encodeURIComponent(meta.event_id), label: 'Open event' };
    if (meta.announcement_id) return { href: 'announcement-detail.html?id=' + encodeURIComponent(meta.announcement_id), label: 'Open announcement' };
    if (meta.promo_id) return { href: 'promo-detail.html?id=' + encodeURIComponent(meta.promo_id), label: 'Open promo' };
    return null;
  }

  function updateBadge() {
    const count = unreadCount();
    $('#notif-badge').text(count > 99 ? '99+' : count).toggleClass('hidden', count === 0);
    $('#notif-btn').attr('aria-label', count ? 'Notifications, ' + count + ' unread' : 'Notifications');
  }

  function renderDrawer() {
    const $list = $('#notif-list');
    if (!$list.length) return;
    const set = readSet();
    if (!items.length) {
      $list.html('<p class="p-8 text-center text-sm text-slate-500">You have no notifications yet.</p>');
      return;
    }
    $list.html('<ul class="divide-y divide-slate-100">' + items.slice(0, 10).map(function (n) {
      const unread = !(n.read === true || set.has(n.id));
      const info = typeInfo(n.type);
      return '<li><a href="notifications.html?id=' + encodeURIComponent(n.id) + '" class="flex gap-3 px-5 py-4 hover:bg-slate-50">' +
        '<span class="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ' + (unread ? 'bg-brand-600' : 'bg-transparent') + '" aria-hidden="true"></span>' +
        '<span class="min-w-0 flex-1"><span class="flex items-center justify-between gap-2"><span class="truncate text-sm ' + (unread ? 'font-semibold text-slate-900' : 'text-slate-700') + '">' + Utils.esc(n.title) + '</span>' + UI.badge(info.label, info.tone) + '</span>' +
        '<span class="mt-0.5 line-clamp-2 block text-sm text-slate-600">' + Utils.esc(n.message) + '</span>' +
        '<span class="mt-1 block text-xs text-slate-500">' + Utils.timeAgo(n.created_at) + (unread ? '<span class="sr-only"> (unread)</span>' : '') + '</span></span></a></li>';
    }).join('') + '</ul>');
  }

  function load() {
    return Api.get('/notifications').done(function (res) {
      items = res.data || [];
      updateBadge();
      renderDrawer();
      $(document).trigger('notifications:updated');
    });
  }

  function markRead(id) {
    const set = readSet();
    if (set.has(id)) return true;
    const previous = new Set(set);
    set.add(id);
    if (!writeSet(set)) {
      writeSet(previous);
      updateBadge();
      return false;
    }
    updateBadge();
    renderDrawer();
    $(document).trigger('notifications:updated');
    return true;
  }

  function markUnread(id) {
    const set = readSet();
    set.delete(id);
    writeSet(set);
    updateBadge();
    renderDrawer();
    $(document).trigger('notifications:updated');
  }

  function markAllRead() {
    const set = readSet();
    items.forEach(n => set.add(n.id));
    writeSet(set);
    updateBadge();
    renderDrawer();
    $(document).trigger('notifications:updated');
  }

  function remove(id) {
    const index = items.findIndex(n => n.id === id);
    if (index === -1) return $.Deferred().resolve().promise();
    const removed = items[index];
    items.splice(index, 1);
    updateBadge();
    renderDrawer();
    $(document).trigger('notifications:updated');
    return Api.del('/notifications/' + id).fail(function () {
      items.splice(index, 0, removed);
      updateBadge();
      renderDrawer();
      $(document).trigger('notifications:updated');
    });
  }

  function openDrawer() {
    lastFocus = document.activeElement;
    $('#notif-overlay, #notif-drawer').removeClass('hidden');
    $('#notif-btn').attr('aria-expanded', 'true');
    $('#notif-close').trigger('focus');
    load();
  }

  function closeDrawer() {
    $('#notif-overlay, #notif-drawer').addClass('hidden');
    $('#notif-btn').attr('aria-expanded', 'false');
    if (lastFocus) $(lastFocus).trigger('focus');
  }

  function mount() {
    $('body').append(
      '<div id="notif-overlay" class="fixed inset-0 z-50 hidden bg-slate-900/40"></div>' +
      '<aside id="notif-drawer" role="dialog" aria-modal="true" aria-labelledby="notif-title" class="fixed right-0 top-0 z-50 flex hidden h-full w-full max-w-md flex-col bg-white shadow-2xl">' +
      '<div class="flex items-center justify-between border-b border-slate-200 px-5 py-4"><h2 id="notif-title" class="text-lg font-semibold text-slate-900">Notifications</h2>' +
      '<button type="button" id="notif-close" class="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close notifications">' + UI.icon('x') + '</button></div>' +
      '<div id="notif-list" class="flex-1 overflow-y-auto" aria-live="polite"></div>' +
      '<div class="flex items-center justify-between gap-3 border-t border-slate-200 px-5 py-3"><button type="button" id="notif-markall" class="text-sm font-medium text-brand-700 hover:underline">Mark all as read</button><a href="notifications.html" class="btn btn-primary btn-sm">View all</a></div></aside>'
    );

    $('#notif-btn').on('click', openDrawer);
    $('#notif-close, #notif-overlay').on('click', closeDrawer);
    $('#notif-markall').on('click', markAllRead);
    $(document).on('keydown', function (e) {
      if (e.key === 'Escape' && !$('#notif-drawer').hasClass('hidden')) closeDrawer();
    });
    $('#notif-drawer').on('keydown', function (e) {
      if (e.key !== 'Tab') return;
      const focusable = $(this).find('a[href], button').filter(':visible');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  function start() {
    mount();
    load();
    clearInterval(timer);
    timer = setInterval(load, APP_CONFIG.NOTIFICATION_POLL_MS);
  }

  return {
    start, load, markRead, markUnread, markAllRead, remove, isRead, unreadCount, typeInfo, link,
    items: () => items.slice(), openDrawer, closeDrawer
  };
})();
