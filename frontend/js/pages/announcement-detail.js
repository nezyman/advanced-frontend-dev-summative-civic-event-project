App.ready(function () {
  const id = Utils.param('id');
  const admin = Auth.isAdmin();
  const $content = $('#content');
  let announcement = null;

  if (!id) {
    UI.errorState($content, { status: 404, message: 'No announcement was selected.' });
    return;
  }

  function adminActions() {
    // ROLE GUARD (UI). Edit, publish/unpublish and delete controls are only rendered for administrators.
    if (!admin) return '';
    return '<div class="flex flex-wrap gap-2"><a class="btn btn-secondary btn-sm" href="announcement-form.html?id=' + announcement.id + '">' + UI.icon('pencil', 'h-4 w-4') + 'Edit</a>' +
      '<button type="button" id="toggle-publish" class="btn btn-secondary btn-sm">' + (announcement.published ? 'Unpublish' : 'Publish') + '</button>' +
      '<button type="button" id="delete-announcement" class="btn btn-danger btn-sm">' + UI.icon('trash', 'h-4 w-4') + 'Delete</button></div>';
  }

  function playerMarkup() {
    return '<audio id="audio" preload="metadata" src="' + Utils.esc(announcement.audio_url) + '">Your browser does not support audio playback. <a href="' + Utils.esc(announcement.audio_url) + '">Download the audio file</a> to listen on your device.</audio>' +
      '<div class="rounded-2xl bg-slate-900 p-5 text-white" role="group" aria-label="Audio player">' +
      '<div class="flex items-center gap-3">' +
      '<button type="button" id="p-play" class="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-500 text-white hover:bg-brand-400" aria-label="Play announcement">' + UI.icon('play', 'h-6 w-6') + '</button>' +
      '<button type="button" id="p-back" class="rounded-lg px-2 py-1 text-sm font-semibold hover:bg-white/10" aria-label="Rewind 10 seconds">−10s</button>' +
      '<button type="button" id="p-fwd" class="rounded-lg px-2 py-1 text-sm font-semibold hover:bg-white/10" aria-label="Forward 10 seconds">+10s</button>' +
      '<div class="ml-auto flex items-center gap-2 text-sm"><label for="p-speed" class="text-slate-300">Speed</label>' +
      '<select id="p-speed" class="rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-sm text-white"><option value="0.75">0.75×</option><option value="1" selected>1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option><option value="2">2×</option></select></div></div>' +
      '<div class="mt-4"><label class="sr-only" for="p-seek">Seek through announcement</label>' +
      '<input id="p-seek" type="range" class="range w-full" min="0" max="100" step="1" value="0" aria-valuetext="0:00 of --:--">' +
      '<div class="mt-1 flex justify-between text-xs text-slate-300"><span id="p-cur" aria-hidden="true">0:00</span><span id="p-dur" aria-hidden="true">--:--</span></div></div>' +
      '<div class="mt-3 flex items-center gap-2 text-sm"><label for="p-vol" class="text-slate-300">Volume</label><input id="p-vol" type="range" class="range w-32" min="0" max="1" step="0.05" value="1"></div>' +
      '<p id="p-error" class="mt-3 hidden rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-100" role="alert">This audio file could not be played in your browser. You can download it using the link above or try another browser.</p></div>';
  }

  function bindPlayer() {
    const audio = document.getElementById('audio');
    const $play = $('#p-play');
    const $seek = $('#p-seek');
    let seeking = false;

    function setPlaying(playing) {
      $play.html(UI.icon(playing ? 'pause' : 'play', 'h-6 w-6')).attr('aria-label', playing ? 'Pause announcement' : 'Play announcement');
    }

    function refresh() {
      const cur = Utils.formatDuration(audio.currentTime);
      const dur = Utils.formatDuration(audio.duration);
      $('#p-cur').text(cur);
      $('#p-dur').text(dur);
      if (!seeking) $seek.val(audio.currentTime);
      $seek.attr('aria-valuetext', cur + ' of ' + dur);
    }

    audio.addEventListener('loadedmetadata', function () {
      if (isFinite(audio.duration)) $seek.attr('max', Math.floor(audio.duration));
      refresh();
    });
    audio.addEventListener('timeupdate', refresh);
    audio.addEventListener('play', function () { setPlaying(true); });
    audio.addEventListener('pause', function () { setPlaying(false); });
    audio.addEventListener('ended', function () { setPlaying(false); });
    audio.addEventListener('error', function () { $('#p-error').removeClass('hidden'); });

    $play.on('click', function () {
      if (audio.paused) audio.play().catch(function () { $('#p-error').removeClass('hidden'); });
      else audio.pause();
    });
    $('#p-back').on('click', function () { audio.currentTime = Math.max(0, audio.currentTime - 10); });
    $('#p-fwd').on('click', function () { audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10); });
    $seek.on('input', function () { seeking = true; $('#p-cur').text(Utils.formatDuration(Number(this.value))); });
    $seek.on('change', function () { audio.currentTime = Number(this.value); seeking = false; });
    $('#p-speed').on('change', function () { audio.playbackRate = Number(this.value); });
    $('#p-vol').on('input', function () { audio.volume = Number(this.value); });
  }

  function render() {
    document.title = announcement.title + ' · CivicEvents+';
    const transcript = announcement.transcript
      ? '<p class="mt-2 text-slate-700 whitespace-lines">' + Utils.esc(announcement.transcript) + '</p>'
      : '<p class="mt-2 text-sm text-slate-500">A written transcript has not been provided for this announcement.</p>';

    $content.html(
      '<article class="card p-6 sm:p-8"><div class="flex flex-wrap items-center gap-2">' + UI.badge('Audio announcement', 'blue') + (admin && !announcement.published ? UI.badge('Unpublished', 'amber') : '') + '</div>' +
      '<div class="mt-3 flex flex-wrap items-start justify-between gap-4"><h1 class="text-3xl font-bold tracking-tight text-slate-900">' + Utils.esc(announcement.title) + '</h1>' + adminActions() + '</div>' +
      '<p class="mt-2 text-sm text-slate-500">Published ' + Utils.formatDateTime(announcement.created_at) + '</p>' +
      '<div class="mt-6">' + playerMarkup() + '</div>' +
      '<section class="mt-8 border-t border-slate-100 pt-6" aria-labelledby="h-transcript"><h2 id="h-transcript" class="text-lg font-semibold text-slate-900">Transcript</h2>' + transcript + '</section></article>'
    );
    bindPlayer();
  }

  function load() {
    $content.html('<div class="card space-y-4 p-8" aria-hidden="true"><div class="skeleton h-8 w-2/3 rounded"></div><div class="skeleton h-4 w-1/3 rounded"></div><div class="skeleton h-40 w-full rounded-2xl"></div></div>');
    Api.get('/announcements/' + id).done(function (res) {
      announcement = res.data;
      if (!admin && announcement.published === false) {
        UI.errorState($content, { status: 404, message: 'This announcement is not available.' });
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
    const action = announcement.published ? 'unpublish' : 'publish';
    UI.setBusy($button, true, 'Saving…');
    Api.patch('/announcements/' + id + '/' + action)
      .done(function () {
        UI.toast('Announcement ' + (action === 'publish' ? 'published.' : 'unpublished.'), 'success');
        load();
      })
      .fail(function (err) {
        UI.setBusy($button, false);
        UI.fail(err);
      });
  });

  $content.on('click', '#delete-announcement', function () {
    if (!Auth.requireAdmin()) return;
    UI.confirm({
      title: 'Delete this announcement?',
      message: '"' + announcement.title + '" will be permanently removed.',
      confirmText: 'Delete announcement',
      danger: true
    }).then(function (ok) {
      if (!ok) return;
      Api.del('/announcements/' + id)
        .done(function () {
          Utils.flash('Announcement deleted.', 'success');
          window.location.href = 'announcements.html';
        })
        .fail(UI.fail);
    });
  });

  load();
});
