App.ready(function () {
  const admin = Auth.isAdmin();
  const query = $.trim(Utils.param('q') || '');
  const $results = $('#results');

  if (!query) {
    $('#search-sub').text('Type something in the search bar to look through events, announcements and promos.');
    return;
  }

  $('#search-title').text('Results for “' + query + '”');
  $results.html(UI.skeletonRows(4));
  const needle = query.toLowerCase();

  function matches() {
    const fields = Array.prototype.slice.call(arguments);
    return fields.join(' ').toLowerCase().indexOf(needle) !== -1;
  }

  function section(title, items, render) {
    if (!items.length) return '';
    return '<section aria-label="' + Utils.esc(title) + '"><h2 class="text-lg font-semibold text-slate-900">' + Utils.esc(title) + ' <span class="text-slate-500">(' + items.length + ')</span></h2><ul class="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">' +
      items.map(i => '<li>' + render(i) + '</li>').join('') + '</ul></section>';
  }

  function item(href, title, meta, text) {
    return '<a href="' + href + '" class="block px-5 py-4 hover:bg-slate-50"><p class="font-medium text-slate-900">' + Utils.esc(title) + '</p>' +
      '<p class="mt-0.5 text-xs text-slate-500">' + Utils.esc(meta) + '</p>' +
      (text ? '<p class="mt-1 text-sm text-slate-600">' + Utils.esc(Utils.truncate(text, 140)) + '</p>' : '') + '</a>';
  }

  $.when(
    Api.get('/events'),
    Api.get('/announcements', { params: { page: 1, limit: 100 } }),
    Api.get('/promos', { params: { page: 1, limit: 100 } })
  ).done(function (eventsRes, announcementsRes, promosRes) {
    const events = (eventsRes.data || []).filter(e => (admin || e.published !== false) && matches(e.title, e.description, e.location));
    const announcements = (announcementsRes.data || []).filter(a => (admin || a.published !== false) && matches(a.title));
    const promos = (promosRes.data || []).filter(p => (admin || p.published !== false) && matches(p.title, p.description));
    const total = events.length + announcements.length + promos.length;

    $('#search-sub').text(total ? total + ' result' + (total === 1 ? '' : 's') + ' found.' : '');

    if (!total) {
      UI.emptyState($results, 'No results', 'We could not find anything matching “' + query + '”. Try a different word.');
      return;
    }

    $results.html(
      section('Events', events, e => item('event-detail.html?id=' + e.id, e.title, Utils.formatDateTime(e.starts_at) + ' · ' + (e.location || ''), e.description)) +
      section('Announcements', announcements, a => item('announcement-detail.html?id=' + a.id, a.title, 'Announcement · ' + Utils.formatShortDate(a.created_at), '')) +
      section('Promos', promos, p => item('promo-detail.html?id=' + p.id, p.title, 'Promo · ' + Utils.formatShortDate(p.created_at), p.description))
    );
  }).fail(function (err) {
    UI.errorState($results, err, function () { window.location.reload(); });
  });
});
