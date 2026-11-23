App.ready(function () {
  const id = Utils.param('id');
  const admin = Auth.isAdmin();
  const $content = $('#content');
  let promo = null;
  let captionUrl = null;

  if (!id) {
    UI.errorState($content, { status: 404, message: 'No promo was selected.' });
    return;
  }

  function vttTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return Utils.pad(h) + ':' + Utils.pad(m) + ':' + (s < 10 ? '0' : '') + s.toFixed(3);
  }

  function buildVtt(text, duration) {
    const cues = [];
    text.split(/\r?\n/).forEach(function (line) {
      const parts = line.trim().match(/[^.!?]+[.!?]*/g) || [];
      parts.forEach(function (part) {
        if (part.trim()) cues.push(part.trim());
      });
    });
    if (!cues.length) cues.push(text.trim());
    const total = isFinite(duration) && duration > 0 ? duration : cues.length * 4;
    const slice = total / cues.length;
    let out = 'WEBVTT\n\n';
    cues.forEach(function (cue, index) {
      out += (index + 1) + '\n' + vttTime(index * slice) + ' --> ' + vttTime((index + 1) * slice) + '\n' + cue + '\n\n';
    });
    return out;
  }

  function attachCaptions(video) {
    const text = $.trim(promo.caption_text || '');
    if (!text) return;
    let attached = false;

    function attach() {
      if (attached) return;
      attached = true;
      if (captionUrl) URL.revokeObjectURL(captionUrl);
      captionUrl = URL.createObjectURL(new Blob([buildVtt(text, video.duration)], { type: 'text/vtt' }));
      const track = document.createElement('track');
      track.kind = 'captions';
      track.label = 'English';
      track.srclang = 'en';
      track.default = true;
      track.src = captionUrl;
      video.appendChild(track);
      track.track.mode = 'showing';
    }

    if (video.readyState >= 1) attach();
    else video.addEventListener('loadedmetadata', attach);
  }

  function adminActions() {
    // ROLE GUARD (UI). Edit, publish/unpublish and delete controls are only rendered for administrators.
    if (!admin) return '';
    return '<div class="flex flex-wrap gap-2"><a class="btn btn-secondary btn-sm" href="promo-form.html?id=' + promo.id + '">' + UI.icon('pencil', 'h-4 w-4') + 'Edit</a>' +
      '<button type="button" id="toggle-publish" class="btn btn-secondary btn-sm">' + (promo.published ? 'Unpublish' : 'Publish') + '</button>' +
      '<button type="button" id="delete-promo" class="btn btn-danger btn-sm">' + UI.icon('trash', 'h-4 w-4') + 'Delete</button></div>';
  }

  function render() {
    document.title = promo.title + ' · CivicEvents+';
    const hasCaptions = !!$.trim(promo.caption_text || '');
    $content.html(
      '<article class="card overflow-hidden"><div class="bg-black"><video id="video" controls preload="metadata" playsinline class="aspect-video w-full" src="' + Utils.esc(promo.video_url) + '" aria-describedby="promo-description">' +
      'Your browser does not support video playback. <a href="' + Utils.esc(promo.video_url) + '">Download the video</a> to watch it on your device.</video></div>' +
      '<div class="p-6 sm:p-8"><div class="flex flex-wrap items-center gap-2">' + UI.badge('Video promo', 'amber') + (hasCaptions ? UI.badge('Captions', 'green') : UI.badge('No captions', 'slate')) + (admin && !promo.published ? UI.badge('Unpublished', 'amber') : '') + '</div>' +
      '<div class="mt-3 flex flex-wrap items-start justify-between gap-4"><h1 class="text-3xl font-bold tracking-tight text-slate-900">' + Utils.esc(promo.title) + '</h1>' + adminActions() + '</div>' +
      '<p class="mt-1 text-sm text-slate-500">Added ' + Utils.formatDateTime(promo.created_at) + '</p>' +
      (hasCaptions ? '<div class="mt-4"><button type="button" id="cc-toggle" class="btn btn-secondary btn-sm" aria-pressed="true">' + UI.icon('cc', 'h-4 w-4') + 'Captions: on</button></div>' : '') +
      '<p id="promo-description" class="mt-5 text-slate-700 whitespace-lines">' + Utils.esc(promo.description || 'No description has been added.') + '</p>' +
      '<details class="mt-6 rounded-xl border border-slate-200 p-4"' + (hasCaptions ? ' open' : '') + '><summary class="cursor-pointer text-sm font-semibold text-slate-900">Transcript</summary>' +
      '<p class="mt-3 text-sm text-slate-700 whitespace-lines">' + (hasCaptions ? Utils.esc(promo.caption_text) : 'A transcript has not been provided for this promo.') + '</p></details></div></article>'
    );

    const video = document.getElementById('video');
    attachCaptions(video);

    $('#cc-toggle').on('click', function () {
      const track = video.textTracks && video.textTracks[0];
      if (!track) return;
      const on = track.mode !== 'showing';
      track.mode = on ? 'showing' : 'hidden';
      $(this).attr('aria-pressed', String(on)).html(UI.icon('cc', 'h-4 w-4') + 'Captions: ' + (on ? 'on' : 'off'));
    });
  }

  function load() {
    $content.html('<div class="card overflow-hidden" aria-hidden="true"><div class="skeleton aspect-video"></div><div class="space-y-4 p-8"><div class="skeleton h-8 w-2/3 rounded"></div><div class="skeleton h-4 w-full rounded"></div></div></div>');
    Api.get('/promos/' + id).done(function (res) {
      promo = res.data;
      if (!admin && promo.published === false) {
        UI.errorState($content, { status: 404, message: 'This promo is not available.' });
        return;
      }
      render();
    }).fail(function (err) {
      UI.errorState($content, err, load);
    });
  }

  $content.on('click', '#toggle-publish', function () {
    if (!Auth.requireAdmin()) return;
    const $button = $(this);
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

  $content.on('click', '#delete-promo', function () {
    if (!Auth.requireAdmin()) return;
    UI.confirm({
      title: 'Delete this promo?',
      message: '"' + promo.title + '" will be permanently removed.',
      confirmText: 'Delete promo',
      danger: true
    }).then(function (ok) {
      if (!ok) return;
      Api.del('/promos/' + id)
        .done(function () {
          Cache.invalidate('promos');
          Utils.flash('Promo deleted.', 'success');
          window.location.href = 'promos.html';
        })
        .fail(UI.fail);
    });
  });

  load();
});
