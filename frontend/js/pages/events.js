App.ready(function () {
  const admin = Auth.isAdmin();
  const size = APP_CONFIG.PAGE_SIZE;
  const $grid = $('#event-grid');
  let events = [];
  let registrations = {};
  let page = 1;

  // ROLE GUARD (UI). "Create event" is only revealed for administrators.
  if (admin) $('#create-event').removeClass('hidden');
  $('#f-q').val(Utils.param('q') || '');

  function filtered() {
    const q = $.trim($('#f-q').val()).toLowerCase();
    const loc = $.trim($('#f-loc').val()).toLowerCase();
    const from = $('#f-from').val();
    const to = $('#f-to').val();
    const status = $('#f-status').val();

    return events.filter(function (e) {
      // ROLE GUARD (data). Normal users only ever see published events; administrators also see drafts.
      if (!admin && e.published === false) return false;
      if (q && (e.title + ' ' + (e.description || '')).toLowerCase().indexOf(q) === -1) return false;
      if (loc && (e.location || '').toLowerCase().indexOf(loc) === -1) return false;
      if (from && new Date(e.ends_at || e.starts_at) < new Date(from + 'T00:00:00')) return false;
      if (to && new Date(e.starts_at) > new Date(to + 'T23:59:59')) return false;
      const timing = Utils.eventStatus(e);
      if (status === 'upcoming' && timing === 'past') return false;
      if (status === 'past' && timing !== 'past') return false;
      return true;
    });
  }

  function card(e) {
    const image = e.metadata && e.metadata.image_url;
    const status = Utils.eventStatus(e);
    const tone = { upcoming: 'brand', ongoing: 'green', past: 'slate' }[status];
    const label = { upcoming: 'Upcoming', ongoing: 'Happening now', past: 'Finished' }[status];
    const registration = registrations[e.id];
    let actions = '<a class="btn btn-secondary btn-sm" href="event-detail.html?id=' + e.id + '">View</a>';

    if (admin) {
      actions += '<a class="btn btn-secondary btn-sm" href="event-form.html?id=' + e.id + '">' + UI.icon('pencil', 'h-4 w-4') + 'Edit</a>' +
        '<button type="button" class="btn btn-danger btn-sm" data-delete="' + e.id + '" data-title="' + Utils.esc(e.title) + '">' + UI.icon('trash', 'h-4 w-4') + 'Delete</button>';
    } else if (registration === 'registered') {
      actions += '<span class="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">' + UI.icon('check', 'h-4 w-4') + 'Registered</span>';
    } else if (registration === 'cancelled') {
      actions += '<span class="text-sm text-slate-500">Registration cancelled</span>';
    } else if (status !== 'past') {
      actions += '<button type="button" class="btn btn-primary btn-sm" data-register="' + e.id + '">Register</button>';
    }

    return '<article class="card flex flex-col overflow-hidden">' +
      '<div class="relative aspect-[16/9] bg-gradient-to-br from-brand-600 to-brand-900">' +
      '<div class="absolute inset-0 flex items-center justify-center text-white/70">' + UI.icon('calendar', 'h-12 w-12') + '</div>' +
      (image ? '<img src="' + Utils.esc(image) + '" alt="Poster for ' + Utils.esc(e.title) + '" loading="lazy" class="absolute inset-0 h-full w-full object-cover" onerror="this.remove()">' : '') +
      '<div class="absolute left-3 top-3 flex gap-2">' + UI.badge(label, tone) + (admin && e.published === false ? UI.badge('Draft', 'amber') : '') + '</div></div>' +
      '<div class="flex flex-1 flex-col p-5">' +
      '<h2 class="text-lg font-semibold leading-snug text-slate-900"><a class="hover:text-brand-700" href="event-detail.html?id=' + e.id + '">' + Utils.esc(e.title) + '</a></h2>' +
      '<dl class="mt-3 space-y-1.5 text-sm text-slate-600">' +
      '<div class="flex items-start gap-2"><dt class="sr-only">Date</dt>' + UI.icon('calendar', 'mt-0.5 h-4 w-4 shrink-0 text-slate-400') + '<dd>' + Utils.formatDateTime(e.starts_at) + '</dd></div>' +
      '<div class="flex items-start gap-2"><dt class="sr-only">Location</dt>' + UI.icon('pin', 'mt-0.5 h-4 w-4 shrink-0 text-slate-400') + '<dd>' + Utils.esc(e.location || 'Location to be announced') + '</dd></div></dl>' +
      '<p class="mt-3 flex-1 text-sm text-slate-600">' + Utils.esc(Utils.truncate(e.description, 120)) + '</p>' +
      '<div class="mt-5 flex flex-wrap items-center gap-2">' + actions + '</div></div></article>';
  }

  function render() {
    const list = filtered();
    const pages = Math.max(1, Math.ceil(list.length / size));
    if (page > pages) page = pages;
    const slice = list.slice((page - 1) * size, page * size);

    $('#result-count').text(list.length ? 'Showing ' + slice.length + ' of ' + list.length + ' event' + (list.length === 1 ? '' : 's') : '');

    if (!list.length) {
      UI.emptyState($grid, 'No events found', events.length ? 'Try changing or clearing your filters.' : 'There are no events yet. Please check back soon.',
        admin ? '<a class="btn btn-primary" href="event-form.html">Create the first event</a>' : '');
      $('#pager').empty();
      return;
    }

    $grid.html(slice.map(card).join(''));
    UI.pagination('#pager', { page: page, pages: pages, onChange: function (p) { page = p; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); } });
  }

  function load() {
    $grid.html(UI.skeletonCards(6));
    $('#pager').empty();
    $('#result-count').text('');

    const calls = [Api.get('/events')];
    if (!admin) calls.push(Api.get('/event-registrations/my-registrations'));

    $.when.apply($, calls).done(function (eventsRes, registrationsRes) {
      events = eventsRes.data || [];
      registrations = {};
      if (registrationsRes && registrationsRes.data) {
        registrationsRes.data.forEach(function (r) { registrations[r.event_id] = r.status; });
      }
      page = 1;
      render();
    }).fail(function (err) {
      UI.errorState($grid, err, load);
    });
  }

  $('#filters').on('submit', function (e) { e.preventDefault(); });
  $('#f-q, #f-loc').on('input', Utils.debounce(function () { page = 1; render(); }, 200));
  $('#f-from, #f-to, #f-status').on('change', function () { page = 1; render(); });
  $('#f-clear').on('click', function () {
    $('#filters')[0].reset();
    page = 1;
    render();
  });

  $grid.on('click', '[data-register]', function () {
    const $button = $(this);
    const id = $button.data('register');
    UI.setBusy($button, true, 'Registering…');
    Api.post('/event-registrations/register', { data: { event_id: id } })
      .done(function () {
        registrations[id] = 'registered';
        UI.toast('You are registered for this event.', 'success');
        render();
      })
      .fail(function (err) {
        UI.setBusy($button, false);
        UI.fail(err);
      });
  });

  $grid.on('click', '[data-delete]', function () {
    if (!Auth.requireAdmin()) return;
    const id = $(this).data('delete');
    const title = $(this).attr('data-title');
    UI.confirm({
      title: 'Delete this event?',
      message: '"' + title + '" will be permanently removed. This cannot be undone.',
      confirmText: 'Delete event',
      danger: true
    }).then(function (ok) {
      if (!ok) return;
      Api.del('/events/' + id)
        .done(function () {
          UI.toast('Event deleted.', 'success');
          load();
        })
        .fail(UI.fail);
    });
  });

  load();
});
