App.ready(function () {
  const admin = Auth.isAdmin();
  const size = APP_CONFIG.PAGE_SIZE;
  const $grid = $('#announcement-grid');
  const durations = {};
  let items = [];
  let page = 1;
  let player = null;
  let playingId = null;

  // ROLE GUARD (UI). The "New announcement" button is only revealed for administrators.
  if (admin) $('#create-announcement').removeClass('hidden');

  function visible() {
    // ROLE GUARD (data). Normal users only see published announcements; administrators also see unpublished ones.
    return items.filter(a => admin || a.published !== false);
  }

  function stopPlayback() {
    if (player) {
      player.pause();
      player = null;
    }
    playingId = null;
  }

  function setButton(id, playing) {
    const $b = $grid.find('[data-play="' + id + '"]');
    const title = $b.attr('data-title');
    $b.html(UI.icon(playing ? 'pause' : 'play', 'h-4 w-4') + (playing ? 'Pause' : 'Play'))
      .attr('aria-label', (playing ? 'Pause ' : 'Play ') + title);
  }

  function card(a) {
    let actions = '<a class="btn btn-secondary btn-sm" href="announcement-detail.html?id=' + a.id + '">Details</a>';
    if (admin) {
      actions += '<a class="btn btn-secondary btn-sm" href="announcement-form.html?id=' + a.id + '">' + UI.icon('pencil', 'h-4 w-4') + 'Edit</a>' +
        '<button type="button" class="btn btn-secondary btn-sm" data-toggle="' + a.id + '">' + (a.published ? 'Unpublish' : 'Publish') + '</button>' +
        '<button type="button" class="btn btn-danger btn-sm" data-delete="' + a.id + '" data-title="' + Utils.esc(a.title) + '">' + UI.icon('trash', 'h-4 w-4') + 'Delete</button>';
    }
    return '<article class="card flex flex-col p-5">' +
      '<div class="flex items-start justify-between gap-3"><span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">' + UI.icon('megaphone', 'h-6 w-6') + '</span>' +
      (admin && !a.published ? UI.badge('Unpublished', 'amber') : '') + '</div>' +
      '<h2 class="mt-4 text-lg font-semibold leading-snug text-slate-900"><a class="hover:text-brand-700" href="announcement-detail.html?id=' + a.id + '">' + Utils.esc(a.title) + '</a></h2>' +
      '<dl class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600"><div class="flex gap-1"><dt>Length:</dt><dd data-duration="' + a.id + '">' + (durations[a.id] || 'Loading…') + '</dd></div>' +
      '<div class="flex gap-1"><dt>Published:</dt><dd>' + Utils.formatShortDate(a.created_at) + '</dd></div></dl>' +
      '<div class="mt-5 flex flex-wrap items-center gap-2"><button type="button" class="btn btn-primary btn-sm" data-play="' + a.id + '" data-title="' + Utils.esc(a.title) + '" aria-label="Play ' + Utils.esc(a.title) + '">' + UI.icon('play', 'h-4 w-4') + 'Play</button>' + actions + '</div></article>';
  }

  function probeDurations(slice) {
    slice.forEach(function (a) {
      if (durations[a.id]) return;
      const probe = new Audio();
      probe.preload = 'metadata';
      probe.addEventListener('loadedmetadata', function () {
        durations[a.id] = Utils.formatDuration(probe.duration);
        $grid.find('[data-duration="' + a.id + '"]').text(durations[a.id]);
      });
      probe.addEventListener('error', function () {
        durations[a.id] = 'Unavailable';
        $grid.find('[data-duration="' + a.id + '"]').text('Unavailable');
      });
      probe.src = a.audio_url;
    });
  }

  function render() {
    stopPlayback();
    const list = visible();
    const pages = Math.max(1, Math.ceil(list.length / size));
    if (page > pages) page = pages;
    const slice = list.slice((page - 1) * size, page * size);
    $('#result-count').text(list.length ? list.length + ' announcement' + (list.length === 1 ? '' : 's') : '');

    if (!list.length) {
      UI.emptyState($grid, 'No announcements yet', 'New audio announcements will appear here.',
        admin ? '<a class="btn btn-primary" href="announcement-form.html">Create an announcement</a>' : '');
      $('#pager').empty();
      return;
    }

    $grid.html(slice.map(card).join(''));
    probeDurations(slice);
    UI.pagination('#pager', { page: page, pages: pages, onChange: function (p) { page = p; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); } });
  }

  function load() {
    $grid.html(UI.skeletonCards(6));
    $('#pager').empty();
    Api.get('/announcements', { params: { page: 1, limit: 100 } }).done(function (res) {
      items = res.data || [];
      page = 1;
      render();
    }).fail(function (err) {
      UI.errorState($grid, err, load);
    });
  }

  $grid.on('click', '[data-play]', function () {
    const id = $(this).data('play');
    const announcement = items.find(a => a.id === id);
    if (!announcement) return;

    if (playingId === id && player) {
      if (player.paused) {
        player.play();
        setButton(id, true);
      } else {
        player.pause();
        setButton(id, false);
      }
      return;
    }

    if (playingId) setButton(playingId, false);
    stopPlayback();
    player = new Audio(announcement.audio_url);
    playingId = id;
    player.addEventListener('ended', function () { setButton(id, false); playingId = null; player = null; });
    player.addEventListener('error', function () {
      setButton(id, false);
      playingId = null;
      player = null;
      UI.toast('This audio could not be played. Open the details page for more options.', 'error');
    });
    player.play().then(function () { setButton(id, true); }).catch(function () { setButton(id, false); });
  });

  $grid.on('click', '[data-toggle]', function () {
    if (!Auth.requireAdmin()) return;
    const $button = $(this);
    const id = $button.data('toggle');
    const announcement = items.find(a => a.id === id);
    const action = announcement.published ? 'unpublish' : 'publish';
    UI.setBusy($button, true, 'Saving…');
    Api.patch('/announcements/' + id + '/' + action)
      .done(function (res) {
        announcement.published = res.data ? res.data.published : !announcement.published;
        UI.toast('Announcement ' + (announcement.published ? 'published.' : 'unpublished.'), 'success');
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
    UI.confirm({
      title: 'Delete this announcement?',
      message: '"' + $(this).attr('data-title') + '" will be permanently removed.',
      confirmText: 'Delete announcement',
      danger: true
    }).then(function (ok) {
      if (!ok) return;
      Api.del('/announcements/' + id)
        .done(function () {
          items = items.filter(a => a.id !== id);
          UI.toast('Announcement deleted.', 'success');
          render();
        })
        .fail(UI.fail);
    });
  });

  load();
});
