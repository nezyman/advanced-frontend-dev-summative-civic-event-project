const UI = (() => {
  const ICONS = {
    bell: 'M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0',
    menu: 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5',
    search: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z',
    calendar: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5',
    pin: ['M15 10.5a3 3 0 11-6 0 3 3 0 016 0z', 'M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z'],
    play: 'M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z',
    pause: 'M15.75 5.25v13.5m-7.5-13.5v13.5',
    pencil: 'M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10',
    trash: 'M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0',
    plus: 'M12 4.5v15m7.5-7.5h-15',
    check: 'M4.5 12.75l6 6 9-13.5',
    x: 'M6 18L18 6M6 6l12 12',
    chevron: 'M19.5 8.25l-7.5 7.5-7.5-7.5',
    user: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z',
    home: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25',
    users: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
    upload: 'M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5',
    megaphone: 'M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46',
    video: 'M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z',
    logout: 'M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75',
    alert: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
    cc: 'M6.75 7.5h10.5A2.25 2.25 0 0119.5 9.75v4.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 14.25v-4.5A2.25 2.25 0 016.75 7.5zM9.75 10.5h-1.5a.75.75 0 00-.75.75v1.5c0 .414.336.75.75.75h1.5M15.75 10.5h-1.5a.75.75 0 00-.75.75v1.5c0 .414.336.75.75.75h1.5'
  };

  const STAR_PATH = 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.563.563 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z';

  const TONES = {
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    amber: 'bg-amber-50 text-amber-800 ring-amber-600/20',
    red: 'bg-red-50 text-red-700 ring-red-600/20',
    slate: 'bg-slate-100 text-slate-700 ring-slate-500/20',
    brand: 'bg-brand-50 text-brand-700 ring-brand-600/20',
    blue: 'bg-blue-50 text-blue-700 ring-blue-600/20'
  };

  const TOASTS = {
    success: { cls: 'border-emerald-200 bg-emerald-50 text-emerald-900', icon: 'check' },
    error: { cls: 'border-red-200 bg-red-50 text-red-900', icon: 'alert' },
    warning: { cls: 'border-amber-200 bg-amber-50 text-amber-900', icon: 'alert' },
    info: { cls: 'border-slate-200 bg-white text-slate-800', icon: 'bell' }
  };

  function icon(name, cls) {
    const paths = [].concat(ICONS[name] || []);
    return '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.7" stroke="currentColor" class="' + (cls || 'h-5 w-5') + '" aria-hidden="true">' +
      paths.map(d => '<path stroke-linecap="round" stroke-linejoin="round" d="' + d + '"/>').join('') + '</svg>';
  }

  function stars(rating, cls) {
    const value = Math.round(Utils.num(rating));
    let html = '<span class="inline-flex items-center" role="img" aria-label="' + value + ' out of 5 stars">';
    for (let i = 1; i <= 5; i++) {
      html += '<svg viewBox="0 0 24 24" fill="currentColor" class="' + (cls || 'h-4 w-4') + ' ' + (i <= value ? 'text-amber-400' : 'text-slate-300') + '" aria-hidden="true"><path d="' + STAR_PATH + '"/></svg>';
    }
    return html + '</span>';
  }

  function badge(text, tone) {
    return '<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ' + (TONES[tone] || TONES.slate) + '">' + Utils.esc(text) + '</span>';
  }

  function spinner() {
    return '<svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" opacity="0.25"></circle><path d="M4 12a8 8 0 018-8" stroke="currentColor" stroke-width="4" stroke-linecap="round"></path></svg>';
  }

  function ensureToastRoot() {
    if (!$('#toast-root').length) {
      $('body').append('<div id="toast-root" class="pointer-events-none fixed inset-x-0 bottom-0 z-[80] flex flex-col items-center gap-2 p-4 sm:items-end" aria-live="polite"></div>');
    }
  }

  function toast(message, type, ms) {
    ensureToastRoot();
    const kind = TOASTS[type] || TOASTS.info;
    const $t = $(
      '<div role="' + (type === 'error' ? 'alert' : 'status') + '" class="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ' + kind.cls + '">' +
      icon(kind.icon, 'mt-0.5 h-5 w-5 shrink-0') +
      '<p class="flex-1">' + Utils.esc(message) + '</p>' +
      '<button type="button" class="-m-1 rounded p-1 opacity-70 hover:opacity-100" aria-label="Dismiss notification">' + icon('x', 'h-4 w-4') + '</button>' +
      '</div>'
    );
    $t.find('button').on('click', function () { $t.remove(); });
    $('#toast-root').append($t);
    setTimeout(function () { $t.fadeOut(200, function () { $(this).remove(); }); }, ms || 5000);
  }

  function failMessage(err) {
    err = err || {};
    let message = err.message || 'Something went wrong.';
    if (/foreign key/i.test(message)) {
      message = 'This item is still referenced by other records (for example registrations), so it cannot be deleted.';
    }
    if (err.details && err.details.length) message += ' ' + err.details.join(' ');
    if (err.status === 403) message += ' Contact an administrator if you need access.';
    return message;
  }

  function fail(err) {
    toast(failMessage(err), 'error', 7000);
  }

  function skeletonCards(count) {
    let html = '';
    for (let i = 0; i < count; i++) {
      html += '<div class="card overflow-hidden" aria-hidden="true"><div class="skeleton aspect-[16/9]"></div><div class="space-y-3 p-5"><div class="skeleton h-5 w-3/4 rounded"></div><div class="skeleton h-4 w-1/2 rounded"></div><div class="skeleton h-4 w-full rounded"></div><div class="skeleton h-9 w-28 rounded-lg"></div></div></div>';
    }
    return html;
  }

  function skeletonRows(count) {
    let html = '';
    for (let i = 0; i < count; i++) {
      html += '<div class="skeleton h-16 w-full rounded-xl" aria-hidden="true"></div>';
    }
    return '<div class="space-y-3" role="status" aria-label="Loading">' + html + '</div>';
  }

  function errorState(target, err, retry) {
    err = err || {};
    let title = 'Something went wrong';
    let body = err.message || 'Please try again.';
    if (err.network) title = 'Connection problem';
    else if (err.status === 403) {
      title = 'Access denied';
      body = (err.message || 'You do not have permission to view this.') + ' If you think this is a mistake, contact an administrator.';
    } else if (err.status === 404) title = 'Not found';
    const $el = $(target).html(
      '<div class="col-span-full rounded-2xl border border-red-200 bg-red-50 p-8 text-center" role="alert">' +
      '<div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">' + icon('alert', 'h-6 w-6') + '</div>' +
      '<h2 class="mt-4 text-lg font-semibold text-red-900">' + Utils.esc(title) + '</h2>' +
      '<p class="mx-auto mt-1 max-w-md text-sm text-red-800">' + Utils.esc(body) + '</p>' +
      '<div class="mt-5 flex flex-wrap justify-center gap-3">' +
      (retry ? '<button type="button" class="btn btn-primary btn-sm" data-retry>Try again</button>' : '') +
      '<a class="btn btn-secondary btn-sm" href="mailto:' + APP_CONFIG.SUPPORT_EMAIL + '">Contact support</a>' +
      '</div></div>'
    );
    if (retry) $el.find('[data-retry]').on('click', retry);
  }

  function emptyState(target, title, message, actionHtml) {
    $(target).html(
      '<div class="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">' +
      '<h2 class="text-lg font-semibold text-slate-900">' + Utils.esc(title) + '</h2>' +
      '<p class="mx-auto mt-1 max-w-md text-sm text-slate-600">' + Utils.esc(message) + '</p>' +
      (actionHtml ? '<div class="mt-5">' + actionHtml + '</div>' : '') +
      '</div>'
    );
  }

  function setBusy($btn, busy, text) {
    if (busy) {
      $btn.data('orig', $btn.html()).prop('disabled', true).attr('aria-busy', 'true')
        .html(spinner() + '<span>' + Utils.esc(text || 'Please wait…') + '</span>');
    } else {
      $btn.prop('disabled', false).removeAttr('aria-busy');
      if ($btn.data('orig') !== undefined) $btn.html($btn.data('orig'));
    }
  }

  function fieldError(id, message) {
    $('#' + id).attr('aria-invalid', 'true').attr('aria-describedby', id + '-error');
    $('#' + id + '-error').text(message).removeClass('hidden');
  }

  function clearErrors($scope) {
    $scope.find('[aria-invalid]').removeAttr('aria-invalid');
    $scope.find('[id$="-error"]').addClass('hidden').text('');
  }

  function formError(message, details) {
    const text = message + (details && details.length ? ' ' + details.join(' ') : '');
    $('#form-error').text(text).removeClass('hidden');
  }

  function pagination(target, state) {
    const $el = $(target).off('click.pg').empty();
    if (!state.pages || state.pages <= 1) return;
    const current = state.page;
    const total = state.pages;
    const from = Math.max(1, Math.min(current - 2, total - 4));
    const to = Math.min(total, from + 4);
    let html = '<nav aria-label="Pagination" class="flex flex-wrap items-center justify-center gap-1">';
    html += '<button type="button" class="btn btn-secondary btn-sm" data-page="' + (current - 1) + '"' + (current === 1 ? ' disabled' : '') + '>Previous</button>';
    for (let p = from; p <= to; p++) {
      html += '<button type="button" data-page="' + p + '" class="btn btn-sm ' + (p === current ? 'btn-primary' : 'btn-secondary') + '"' + (p === current ? ' aria-current="page"' : '') + ' aria-label="Page ' + p + '">' + p + '</button>';
    }
    html += '<button type="button" class="btn btn-secondary btn-sm" data-page="' + (current + 1) + '"' + (current === total ? ' disabled' : '') + '>Next</button></nav>';
    $el.html(html).on('click.pg', '[data-page]', function () {
      state.onChange(Number($(this).data('page')));
    });
  }

  function pager(target, state) {
    const $el = $(target).off('click.pg').empty();
    if (state.page === 1 && !state.hasNext) return;
    $el.html(
      '<nav aria-label="Pagination" class="flex items-center justify-center gap-3">' +
      '<button type="button" class="btn btn-secondary btn-sm" data-page="' + (state.page - 1) + '"' + (state.page === 1 ? ' disabled' : '') + '>Previous</button>' +
      '<span class="text-sm text-slate-600">Page ' + state.page + '</span>' +
      '<button type="button" class="btn btn-secondary btn-sm" data-page="' + (state.page + 1) + '"' + (state.hasNext ? '' : ' disabled') + '>Next</button></nav>'
    ).on('click.pg', '[data-page]', function () {
      state.onChange(Number($(this).data('page')));
    });
  }

  function openModal(html, opts) {
    opts = opts || {};
    const $previous = $(document.activeElement);
    const $wrap = $(
      '<div class="fixed inset-0 z-[70] flex items-center justify-center p-4" role="presentation">' +
      '<div class="absolute inset-0 bg-slate-900/50" data-close></div>' +
      '<div role="dialog" aria-modal="true" tabindex="-1" class="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"></div></div>'
    );
    const $dialog = $wrap.find('[role="dialog"]').attr('aria-label', opts.label || 'Dialog').html(html);
    $('body').append($wrap);

    function close(result) {
      $(document).off('keydown.modal');
      $wrap.remove();
      $previous.trigger('focus');
      if (opts.onClose) opts.onClose(result);
    }

    $wrap.on('click', '[data-close]', function () { close(false); });
    $(document).off('keydown.modal').on('keydown.modal', function (e) {
      if (e.key === 'Escape') {
        close(false);
        return;
      }
      if (e.key !== 'Tab') return;
      const focusable = $dialog.find('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])').filter(':visible:not([disabled])');
      if (!focusable.length) return;
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

    const $auto = $dialog.find('[data-autofocus]');
    ($auto.length ? $auto : $dialog).first().trigger('focus');
    return { $el: $dialog, close: close };
  }

  function confirm(opts) {
    return new Promise(function (resolve) {
      const tone = opts.danger ? 'btn-danger' : 'btn-primary';
      const modal = openModal(
        '<h2 class="text-lg font-semibold text-slate-900">' + Utils.esc(opts.title || 'Are you sure?') + '</h2>' +
        '<p class="mt-2 text-sm text-slate-600">' + Utils.esc(opts.message || '') + '</p>' +
        '<div class="mt-6 flex justify-end gap-3">' +
        '<button type="button" class="btn btn-secondary" data-close>Cancel</button>' +
        '<button type="button" class="btn ' + tone + '" data-ok data-autofocus>' + Utils.esc(opts.confirmText || 'Confirm') + '</button></div>',
        { label: opts.title, onClose: resolve }
      );
      modal.$el.on('click', '[data-ok]', function () { modal.close(true); });
    });
  }

  function bindDropdown(buttonSel, menuSel) {
    const $btn = $(buttonSel);
    const $menu = $(menuSel);
    if (!$btn.length) return;

    function close() {
      $menu.addClass('hidden');
      $btn.attr('aria-expanded', 'false');
    }

    $btn.on('click', function (e) {
      e.stopPropagation();
      const open = $menu.hasClass('hidden');
      $('[data-dropdown-menu]').addClass('hidden');
      $('[data-dropdown-btn]').attr('aria-expanded', 'false');
      if (open) {
        $menu.removeClass('hidden');
        $btn.attr('aria-expanded', 'true');
        $menu.find('a, button').first().trigger('focus');
      }
    });
    $menu.on('click', function (e) { e.stopPropagation(); });
    $(document).on('click', close);
    $(document).on('keydown', function (e) {
      if (e.key === 'Escape' && !$menu.hasClass('hidden')) {
        close();
        $btn.trigger('focus');
      }
    });
  }

  function navLink(href, label, key, active) {
    const on = key === active;
    return '<a href="' + href + '"' + (on ? ' aria-current="page"' : '') + ' class="rounded-lg px-3 py-2 text-sm font-medium ' + (on ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900') + '">' + label + '</a>';
  }

  function searchForm(idSuffix) {
    const query = Utils.param('q') || '';
    return '<form class="global-search relative w-full" role="search" action="search.html" method="get">' +
      '<label class="sr-only" for="global-search-' + idSuffix + '">Search events, announcements and promos</label>' +
      '<span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">' + icon('search', 'h-4 w-4') + '</span>' +
      '<input id="global-search-' + idSuffix + '" name="q" type="search" value="' + Utils.esc(document.body.dataset.nav === 'search' ? query : '') + '" placeholder="Search events, announcements, promos" class="w-full rounded-full border border-slate-300 bg-slate-50 py-2 pl-9 pr-4 text-sm focus:border-brand-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-600/30"></form>';
  }

  function renderLayout() {
    ensureToastRoot();
    if (document.body.dataset.guard === 'guest') return;

    const user = Auth.user() || {};
    const admin = Auth.isAdmin();
    const active = document.body.dataset.nav || '';
    const main = [
      ['dashboard.html', 'Dashboard', 'dashboard'],
      ['events.html', 'Events', 'events'],
      ['announcements.html', 'Announcements', 'announcements'],
      ['promos.html', 'Promos', 'promos']
    ];
    const adminItems = [
      ['admin-users.html', 'Manage users'],
      ['admin-notifications.html', 'Manage notifications'],
      ['event-form.html', 'Create event'],
      ['announcement-form.html', 'New announcement'],
      ['promo-form.html', 'New promo']
    ];
    const menuItem = 'block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100';

    // ROLE GUARD (navigation). The Admin menu is only rendered when the signed-in user's role is "admin";
    // normal users never receive these links in the DOM.
    const adminMenu = admin
      ? '<div class="relative hidden lg:block">' +
        '<button type="button" id="admin-btn" data-dropdown-btn class="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium ' + (active === 'admin' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100') + '" aria-haspopup="true" aria-expanded="false" aria-controls="admin-menu">Admin ' + icon('chevron', 'h-4 w-4') + '</button>' +
        '<div id="admin-menu" data-dropdown-menu class="absolute left-0 z-50 mt-2 hidden w-56 rounded-xl border border-slate-200 bg-white p-1 shadow-lg" role="menu">' +
        adminItems.map(i => '<a role="menuitem" class="' + menuItem + '" href="' + i[0] + '">' + i[1] + '</a>').join('') +
        '</div></div>'
      : '';

    const mobileAdmin = admin
      ? '<p class="px-3 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Admin</p>' + adminItems.map(i => '<a class="' + menuItem + '" href="' + i[0] + '">' + i[1] + '</a>').join('')
      : '';

    $('#app-header').html(
      '<a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow">Skip to main content</a>' +
      '<header class="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">' +
      '<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div class="flex h-16 items-center gap-2 sm:gap-3">' +
      '<button type="button" id="menu-toggle" class="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu">' + icon('menu') + '</button>' +
      '<a href="dashboard.html" class="flex items-center gap-2 font-bold text-brand-700"><span class="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-sm text-white">C+</span><span class="hidden sm:inline">CivicEvents+</span></a>' +
      '<nav class="ml-4 hidden items-center gap-1 lg:flex" aria-label="Primary">' + main.map(l => navLink(l[0], l[1], l[2], active)).join('') + adminMenu + '</nav>' +
      '<div class="ml-auto hidden max-w-xs flex-1 md:block">' + searchForm('desktop') + '</div>' +
      '<div class="ml-auto flex items-center gap-1 md:ml-0">' +
      '<button type="button" id="notif-btn" class="relative rounded-full p-2 text-slate-600 hover:bg-slate-100" aria-label="Notifications" aria-haspopup="dialog" aria-controls="notif-drawer">' + icon('bell', 'h-6 w-6') +
      '<span id="notif-badge" class="absolute -right-0.5 -top-0.5 hidden min-w-[1.25rem] rounded-full bg-red-600 px-1 text-center text-[11px] font-bold leading-5 text-white" aria-hidden="true">0</span></button>' +
      '<div class="relative"><button type="button" id="profile-btn" data-dropdown-btn class="flex items-center gap-2 rounded-full p-1 pr-2 hover:bg-slate-100" aria-haspopup="true" aria-expanded="false" aria-controls="profile-menu">' +
      '<span id="profile-initials" class="grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-xs font-semibold text-white">' + Utils.esc(Utils.initials(user.full_name)) + '</span>' +
      '<span id="profile-name" class="hidden max-w-[8rem] truncate text-sm font-medium text-slate-700 sm:inline">' + Utils.esc(user.full_name || '') + '</span>' + icon('chevron', 'hidden h-4 w-4 text-slate-500 sm:block') + '</button>' +
      '<div id="profile-menu" data-dropdown-menu class="absolute right-0 z-50 mt-2 hidden w-60 rounded-xl border border-slate-200 bg-white p-1 shadow-lg" role="menu">' +
      '<div class="px-3 py-2"><p class="truncate text-sm font-semibold text-slate-900">' + Utils.esc(user.full_name || '') + '</p><p class="truncate text-xs text-slate-500">' + Utils.esc(user.email || '') + '</p><p class="mt-1">' + badge(admin ? 'Administrator' : 'Member', admin ? 'brand' : 'slate') + '</p></div>' +
      '<hr class="my-1 border-slate-200">' +
      '<a role="menuitem" class="' + menuItem + '" href="profile.html">My profile</a>' +
      (admin ? '' : '<a role="menuitem" class="' + menuItem + '" href="my-registrations.html">My registrations</a>') +
      '<a role="menuitem" class="' + menuItem + '" href="notifications.html">Notifications</a>' +
      '<hr class="my-1 border-slate-200">' +
      '<button type="button" role="menuitem" id="sign-out" class="' + menuItem + ' w-full text-left text-red-700">Sign out</button></div></div>' +
      '</div></div></div>' +
      '<div id="mobile-menu" class="hidden border-t border-slate-200 bg-white px-4 py-3 lg:hidden">' +
      '<div class="mb-3 md:hidden">' + searchForm('mobile') + '</div>' +
      '<nav aria-label="Mobile" class="space-y-1">' + main.map(l => '<a class="' + menuItem + (l[2] === active ? ' bg-brand-50 font-semibold text-brand-700' : '') + '" href="' + l[0] + '">' + l[1] + '</a>').join('') +
      (admin ? '' : '<a class="' + menuItem + '" href="my-registrations.html">My registrations</a>') + mobileAdmin + '</nav></div></header>'
    );

    $('#app-footer').html(
      '<footer class="mt-12 border-t border-slate-200 bg-white"><div class="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-4 lg:px-8">' +
      '<div class="md:col-span-1"><div class="flex items-center gap-2 font-bold text-brand-700"><span class="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-xs text-white">C+</span>CivicEvents+</div><p class="mt-3 text-sm text-slate-600">Bringing communities together through events, announcements and local updates.</p></div>' +
      '<div><h2 class="text-sm font-semibold text-slate-900">Explore</h2><ul class="mt-3 space-y-2 text-sm text-slate-600"><li><a class="hover:text-brand-700" href="events.html">Events</a></li><li><a class="hover:text-brand-700" href="announcements.html">Announcements</a></li><li><a class="hover:text-brand-700" href="promos.html">Promos</a></li></ul></div>' +
      '<div><h2 class="text-sm font-semibold text-slate-900">Your account</h2><ul class="mt-3 space-y-2 text-sm text-slate-600"><li><a class="hover:text-brand-700" href="profile.html">Profile</a></li>' + (admin ? '' : '<li><a class="hover:text-brand-700" href="my-registrations.html">My registrations</a></li>') + '<li><a class="hover:text-brand-700" href="notifications.html">Notifications</a></li></ul></div>' +
      '<div><h2 class="text-sm font-semibold text-slate-900">Help &amp; contact</h2><ul class="mt-3 space-y-2 text-sm text-slate-600"><li><a class="hover:text-brand-700" href="mailto:' + APP_CONFIG.SUPPORT_EMAIL + '">' + APP_CONFIG.SUPPORT_EMAIL + '</a></li><li>Support hours: Mon–Fri, 8:00–17:00</li><li>Need access to an admin feature? Contact an administrator.</li></ul></div>' +
      '</div><div class="border-t border-slate-200 py-4 text-center text-xs text-slate-500">© ' + new Date().getFullYear() + ' CivicEvents+. Built for accessible, community-first civic engagement.</div></footer>'
    );

    bindDropdown('#admin-btn', '#admin-menu');
    bindDropdown('#profile-btn', '#profile-menu');

    $('#menu-toggle').on('click', function () {
      const open = $('#mobile-menu').hasClass('hidden');
      $('#mobile-menu').toggleClass('hidden', !open);
      $(this).attr('aria-expanded', String(open)).attr('aria-label', open ? 'Close menu' : 'Open menu');
    });

    $('#sign-out').on('click', function () { Auth.signOut('manual'); });
  }

  function renderSidebar() {
    const $side = $('#admin-sidebar');
    if (!$side.length) return;

    // ROLE GUARD (admin sidebar). The sidebar is removed from the DOM for anyone whose role is not "admin".
    if (!Auth.isAdmin()) {
      $side.remove();
      return;
    }

    const active = document.body.dataset.side || '';
    const items = [
      ['dashboard.html', 'Overview', 'dashboard', 'home'],
      ['admin-users.html', 'Users', 'users', 'users'],
      ['admin-notifications.html', 'Notifications', 'adminnotifs', 'bell'],
      ['events.html', 'Events', 'events', 'calendar'],
      ['announcements.html', 'Announcements', 'announcements', 'megaphone'],
      ['promos.html', 'Promos', 'promos', 'video']
    ];
    $side.html(
      '<nav aria-label="Admin sections" class="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">' +
      items.map(function (i) {
        const on = i[2] === active;
        return '<a href="' + i[0] + '"' + (on ? ' aria-current="page"' : '') + ' class="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ' + (on ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-white hover:text-slate-900') + '">' + icon(i[3], 'h-4 w-4') + i[1] + '</a>';
      }).join('') + '</nav>'
    );
  }

  function bindPasswordToggles() {
    $(document).on('click', '[data-toggle-password]', function () {
      const $input = $('#' + $(this).data('togglePassword'));
      const show = $input.attr('type') === 'password';
      $input.attr('type', show ? 'text' : 'password');
      $(this).text(show ? 'Hide' : 'Show').attr('aria-pressed', String(show));
    });
  }

  return {
    icon, stars, badge, spinner, toast, fail, failMessage, skeletonCards, skeletonRows, errorState, emptyState,
    setBusy, fieldError, clearErrors, formError, pagination, pager, openModal, confirm, renderLayout,
    renderSidebar, bindPasswordToggles, ensureToastRoot
  };
})();
