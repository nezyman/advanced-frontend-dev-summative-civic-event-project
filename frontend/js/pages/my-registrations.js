App.ready(function () {
  const $list = $('#list');
  let items = [];
  let filter = 'all';

  function row(r) {
    const timing = Utils.eventStatus(r);
    const active = r.status === 'registered';
    const cancellable = active && timing !== 'past';
    return '<article class="card flex flex-wrap items-center justify-between gap-4 p-5">' +
      '<div class="min-w-0"><div class="flex flex-wrap items-center gap-2">' + UI.badge(active ? 'Registered' : 'Cancelled', active ? 'green' : 'slate') +
      (timing === 'past' ? UI.badge('Finished', 'slate') : '') + '</div>' +
      '<h2 class="mt-2 text-lg font-semibold text-slate-900"><a class="hover:text-brand-700" href="event-detail.html?id=' + r.event_id + '">' + Utils.esc(r.title) + '</a></h2>' +
      '<p class="mt-1 flex items-center gap-2 text-sm text-slate-600">' + UI.icon('calendar', 'h-4 w-4 text-slate-400') + Utils.formatDateTime(r.starts_at) + '</p>' +
      '<p class="mt-1 flex items-center gap-2 text-sm text-slate-600">' + UI.icon('pin', 'h-4 w-4 text-slate-400') + Utils.esc(r.location || 'To be announced') + '</p></div>' +
      '<div class="flex gap-2"><a class="btn btn-secondary btn-sm" href="event-detail.html?id=' + r.event_id + '">View</a>' +
      (cancellable ? '<button type="button" class="btn btn-danger btn-sm" data-cancel="' + r.event_id + '" data-title="' + Utils.esc(r.title) + '">Cancel</button>' : '') + '</div></article>';
  }

  function render() {
    const visible = items.filter(r => filter === 'all' || r.status === filter);
    if (!visible.length) {
      UI.emptyState($list, filter === 'all' ? 'No registrations yet' : 'Nothing to show here', filter === 'all' ? 'Browse events and register to see them listed here.' : 'No registrations match this filter.',
        filter === 'all' ? '<a class="btn btn-primary" href="events.html">Browse events</a>' : '');
      return;
    }
    $list.html(visible.map(row).join(''));
  }

  function load() {
    $list.html(UI.skeletonRows(3));
    Api.get('/event-registrations/my-registrations').done(function (res) {
      items = (res.data || []).slice().sort((a, b) => new Date(b.starts_at) - new Date(a.starts_at));
      render();
    }).fail(function (err) {
      UI.errorState($list, err, load);
    });
  }

  $('[data-filter]').on('click', function () {
    filter = $(this).data('filter');
    $('[data-filter]').each(function () {
      const on = $(this).data('filter') === filter;
      $(this).toggleClass('btn-primary', on).toggleClass('btn-secondary', !on).attr('aria-pressed', String(on));
    });
    render();
  });

  $list.on('click', '[data-cancel]', function () {
    const $button = $(this);
    const eventId = $button.data('cancel');
    UI.confirm({
      title: 'Cancel your registration?',
      message: 'You will no longer be listed as attending "' + $button.attr('data-title') + '".',
      confirmText: 'Cancel registration',
      danger: true
    }).then(function (ok) {
      if (!ok) return;
      const previous = items.map(r => Object.assign({}, r));
      items.forEach(function (r) { if (r.event_id === eventId) r.status = 'cancelled'; });
      render();
      Api.post('/event-registrations/cancel', { data: { event_id: eventId } })
        .done(function () { UI.toast('Registration cancelled.', 'success'); })
        .fail(function (err) {
          items = previous;
          render();
          UI.fail(err);
        });
    });
  });

  load();
});
