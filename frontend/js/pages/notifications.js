App.ready(function () {
  const admin = Auth.isAdmin();
  const $list = $('#list');
  const $detail = $('#detail');
  let filter = 'all';
  let selected = Utils.param('id');
  let fetched = null;

  function visibleItems() {
    return Notify.items().filter(function (n) {
      if (filter === 'all') return true;
      if (filter === 'unread') return !Notify.isRead(n);
      return n.type === filter;
    });
  }

  function findSelected() {
    return Notify.items().find(n => n.id === selected) || (fetched && fetched.id === selected ? fetched : null);
  }

  function renderSummary() {
    const total = Notify.items().length;
    const unread = Notify.unreadCount();
    $('#summary').text(total ? total + ' notification' + (total === 1 ? '' : 's') + ' · ' + unread + ' unread' : '');
    $('#mark-all').prop('disabled', unread === 0);
  }

  function renderList() {
    renderSummary();
    const items = visibleItems();
    if (!items.length) {
      UI.emptyState($list, filter === 'all' ? 'You are all caught up' : 'Nothing here', filter === 'all' ? 'New notifications will show up here.' : 'No notifications match this filter.');
      return;
    }
    $list.html(items.map(function (n) {
      const unread = !Notify.isRead(n);
      const info = Notify.typeInfo(n.type);
      const on = n.id === selected;
      return '<button type="button" data-open="' + n.id + '" class="card block w-full break-words p-4 text-left transition hover:border-brand-500 ' + (on ? 'border-brand-600 ring-2 ring-brand-600/20' : '') + '"' + (on ? ' aria-current="true"' : '') + '>' +
        '<span class="flex items-start gap-3"><span class="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ' + (unread ? 'bg-brand-600' : 'bg-transparent') + '" aria-hidden="true"></span>' +
        '<span class="min-w-0 flex-1"><span class="flex items-center justify-between gap-2"><span class="truncate text-sm ' + (unread ? 'font-semibold text-slate-900' : 'text-slate-700') + '">' + Utils.esc(n.title) + '</span>' + UI.badge(info.label, info.tone) + '</span>' +
        '<span class="mt-1 line-clamp-2 block text-sm text-slate-600">' + Utils.esc(n.message) + '</span>' +
        '<span class="mt-1 block text-xs text-slate-500">' + Utils.timeAgo(n.created_at) + (unread ? '<span class="sr-only"> (unread)</span>' : '') + '</span></span></span></button>';
    }).join(''));
  }

  function renderDetail() {
    const n = findSelected();
    if (!n) {
      $detail.html('<div class="card hidden p-10 text-center text-sm text-slate-500 lg:block">Select a notification to read it in full.</div>');
      return;
    }
    const info = Notify.typeInfo(n.type);
    const link = Notify.link(n);
    $detail.html(
      '<article class="card p-6 sm:p-8"><div class="flex flex-wrap items-center justify-between gap-2">' + UI.badge(info.label, info.tone) + '<span class="text-xs text-slate-500">' + Utils.formatDateTime(n.created_at) + '</span></div>' +
      '<h2 class="mt-4 text-xl font-semibold text-slate-900">' + Utils.esc(n.title) + '</h2>' +
      '<p class="mt-3 text-slate-700 whitespace-lines">' + Utils.esc(n.message) + '</p>' +
      '<p class="mt-4 text-xs text-slate-500">' + (n.recipient_id ? 'Sent to you personally' : 'Broadcast to everyone') + '</p>' +
      '<div class="mt-6 flex flex-wrap gap-2">' + (link ? '<a class="btn btn-primary btn-sm" href="' + link.href + '">' + link.label + '</a>' : '') +
      '<button type="button" id="mark-unread" class="btn btn-secondary btn-sm">Mark as unread</button>' +
      (admin ? '<button type="button" id="delete-notification" class="btn btn-danger btn-sm">' + UI.icon('trash', 'h-4 w-4') + 'Delete</button>' : '') + '</div></article>'
    );
  }

  function open(id, focusDetail) {
    selected = id;
    Notify.markRead(id);
    renderList();
    renderDetail();
    try { history.replaceState(null, '', 'notifications.html?id=' + encodeURIComponent(id)); } catch (e) { return; }
    if (focusDetail) $detail.trigger('focus');
  }

  function load() {
    $list.html(UI.skeletonRows(4));
    Notify.load().done(function () {
      renderList();
      if (selected) {
        if (findSelected()) {
          Notify.markRead(selected);
          renderList();
          renderDetail();
        } else {
          Api.get('/notifications/' + selected).done(function (res) {
            fetched = res.data;
            Notify.markRead(selected);
            renderDetail();
          }).fail(function (err) {
            selected = null;
            renderDetail();
            UI.fail(err);
          });
        }
      } else {
        renderDetail();
      }
    }).fail(function (err) {
      UI.errorState($list, err, load);
    });
  }

  $list.on('click', '[data-open]', function () { open($(this).data('open'), window.innerWidth < 1024); });

  $('[data-filter]').on('click', function () {
    filter = $(this).data('filter');
    $('[data-filter]').each(function () {
      const on = $(this).data('filter') === filter;
      $(this).toggleClass('btn-primary', on).toggleClass('btn-secondary', !on).attr('aria-pressed', String(on));
    });
    renderList();
  });

  $('#mark-all').on('click', function () {
    Notify.markAllRead();
    UI.toast('All notifications marked as read.', 'success');
  });

  $detail.on('click', '#mark-unread', function () {
    Notify.markUnread(selected);
    renderList();
  });

  $detail.on('click', '#delete-notification', function () {
    // ROLE GUARD (action). Only administrators can delete notifications; the backend route is admin-only as well.
    if (!Auth.requireAdmin()) return;
    const id = selected;
    UI.confirm({
      title: 'Delete this notification?',
      message: 'It will be removed for everyone it was sent to.',
      confirmText: 'Delete notification',
      danger: true
    }).then(function (ok) {
      if (!ok) return;
      selected = null;
      renderDetail();
      Notify.remove(id)
        .done(function () { UI.toast('Notification deleted.', 'success'); })
        .fail(function (err) {
          selected = id;
          renderDetail();
          UI.fail(err);
        });
    });
  });

  $(document).on('notifications:updated', function () {
    renderList();
  });

  load();
});
