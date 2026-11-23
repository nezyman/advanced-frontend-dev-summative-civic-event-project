App.ready(function () {
  const admin = Auth.isAdmin();
  const size = APP_CONFIG.PAGE_SIZE;
  const $grid = $('#promo-grid');
  let page = 1;
  let observer = null;
  let current = [];

  // ROLE GUARD (UI). The "New promo" button is only revealed for administrators.
  if (admin) $('#create-promo').removeClass('hidden');

  function fetchPage(p) {
    const key = 'promos:' + p + ':' + size;
    const cached = Cache.get(key);
    if (cached) return $.Deferred().resolve(cached).promise();
    return Api.get('/promos', { params: { page: p, limit: size } }).done(function (res) { Cache.set(key, res); });
  }

  function lazyLoadThumbnails() {
    const $videos = $grid.find('video[data-src]');
    if (observer) observer.disconnect();
    if (!('IntersectionObserver' in window)) {
      $videos.each(function () { this.preload = 'metadata'; this.src = this.getAttribute('data-src'); });
      return;
    }
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        const video = entry.target;
        video.preload = 'metadata';
        video.src = video.getAttribute('data-src');
        video.removeAttribute('data-src');
        observer.unobserve(video);
      });
    }, { rootMargin: '200px' });
    $videos.each(function () { observer.observe(this); });
  }

  function card(p) {
    let actions = '<a class="btn btn-primary btn-sm" href="promo-detail.html?id=' + p.id + '">' + UI.icon('play', 'h-4 w-4') + 'Play</a>';
    if (admin) {
      actions += '<a class="btn btn-secondary btn-sm" href="promo-form.html?id=' + p.id + '">' + UI.icon('pencil', 'h-4 w-4') + 'Edit</a>' +
        '<button type="button" class="btn btn-secondary btn-sm" data-toggle="' + p.id + '">' + (p.published ? 'Unpublish' : 'Publish') + '</button>' +
        '<button type="button" class="btn btn-danger btn-sm" data-delete="' + p.id + '" data-title="' + Utils.esc(p.title) + '">' + UI.icon('trash', 'h-4 w-4') + 'Delete</button>';
    }
    return '<article class="card flex flex-col overflow-hidden">' +
      '<a href="promo-detail.html?id=' + p.id + '" class="group relative block aspect-video bg-slate-900" aria-label="Play ' + Utils.esc(p.title) + '">' +
      '<video muted playsinline preload="none" tabindex="-1" aria-hidden="true" data-src="' + Utils.esc(p.video_url) + '#t=0.5" class="h-full w-full object-cover"></video>' +
      '<span class="absolute inset-0 grid place-items-center bg-slate-900/30 transition group-hover:bg-slate-900/50"><span class="grid h-14 w-14 place-items-center rounded-full bg-white/90 text-brand-700">' + UI.icon('play', 'h-7 w-7') + '</span></span>' +
      (admin && !p.published ? '<span class="absolute left-3 top-3">' + UI.badge('Unpublished', 'amber') + '</span>' : '') + '</a>' +
      '<div class="flex flex-1 flex-col p-5"><h2 class="text-lg font-semibold leading-snug text-slate-900"><a class="hover:text-brand-700" href="promo-detail.html?id=' + p.id + '">' + Utils.esc(p.title) + '</a></h2>' +
      '<p class="mt-2 flex-1 text-sm text-slate-600">' + Utils.esc(Utils.truncate(p.description, 110)) + '</p>' +
      '<p class="mt-2 text-xs text-slate-500">' + Utils.formatShortDate(p.created_at) + (p.caption_text ? ' · Captions available' : '') + '</p>' +
      '<div class="mt-4 flex flex-wrap items-center gap-2">' + actions + '</div></div></article>';
  }

  function render(res) {
    current = res.data || [];
    // ROLE GUARD (data). Normal users only see published promos; administrators also see unpublished ones.
    const list = current.filter(p => admin || p.published !== false);
    const pagination = res.pagination || { page: 1, pages: 1 };

    if (!list.length) {
      UI.emptyState($grid, 'No promos yet', 'New video promos will appear here.', admin ? '<a class="btn btn-primary" href="promo-form.html">Create a promo</a>' : '');
      $('#pager').empty();
      return;
    }

    $grid.html(list.map(card).join(''));
    lazyLoadThumbnails();
    UI.pagination('#pager', {
      page: pagination.page || page,
      pages: pagination.pages || 1,
      onChange: function (p) { page = p; load(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    });
  }

  function load() {
    $grid.html(UI.skeletonCards(6));
    $('#pager').empty();
    fetchPage(page).done(render).fail(function (err) {
      UI.errorState($grid, err, load);
    });
  }

  $grid.on('click', '[data-toggle]', function () {
    if (!Auth.requireAdmin()) return;
    const $button = $(this);
    const id = $button.data('toggle');
    const promo = current.find(p => p.id === id);
    const action = promo.published ? 'unpublish' : 'publish';
    UI.setBusy($button, true, 'Saving…');
    Api.patch('/promos/' + id + '/' + action)
      .done(function () {
        Cache.invalidate('promos');
        UI.toast('Promo ' + (action === 'publish' ? 'published.' : 'unpublished.'), 'success');
        load();
      })
      .fail(function (err) {
        UI.setBusy($button, false);
        UI.fail(err);
      });
  });

  $grid.on('click', '[data-delete]', function () {
    if (!Auth.requireAdmin()) return;
    const id = $(this).data('delete');
    UI.confirm({
      title: 'Delete this promo?',
      message: '"' + $(this).attr('data-title') + '" will be permanently removed.',
      confirmText: 'Delete promo',
      danger: true
    }).then(function (ok) {
      if (!ok) return;
      Api.del('/promos/' + id)
        .done(function () {
          Cache.invalidate('promos');
          UI.toast('Promo deleted.', 'success');
          load();
        })
        .fail(UI.fail);
    });
  });

  load();
});
