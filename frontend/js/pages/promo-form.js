App.ready(function () {
  const id = Utils.param('id');
  const editing = !!id;
  const VIDEO_RULE = { exts: ['.mp4', '.mov', '.avi', '.mkv'], maxMB: 8 };
  const $form = $('#promo-form');
  const $button = $('#save-btn');
  let previewUrl = null;

  // ROLE GUARD (page). The page is declared data-guard="admin"; this repeats the check before any request is built.
  if (!Auth.requireAdmin()) return;

  if (editing) {
    $('#form-title').text('Edit promo');
    document.title = 'Edit promo · CivicEvents+';
    $('#video-required').addClass('hidden');
    $('#video-hint').text('Leave empty to keep the current video, or choose a file to replace it. MP4, MOV, AVI or MKV, up to 8 MB.');
    $form.addClass('hidden');
    $('#load-state').html(UI.skeletonRows(4));
    Api.get('/promos/' + id).done(function (res) {
      const p = res.data;
      $('#title').val(p.title);
      $('#description').val(p.description || '');
      $('#caption_text').val(p.caption_text || '');
      $('#published').prop('checked', p.published !== false);
      $('#video-preview').attr('src', p.video_url);
      $('#video-preview-wrap').removeClass('hidden');
      $('#load-state').empty();
      $form.removeClass('hidden');
    }).fail(function (err) {
      UI.errorState('#load-state', err);
    });
  }

  $('#video').on('change', function () {
    UI.clearErrors($form);
    const file = this.files[0];
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
    if (!file) return;
    const problem = Utils.validateFile(file, VIDEO_RULE);
    if (problem) {
      UI.fieldError('video', problem);
      this.value = '';
      return;
    }
    previewUrl = URL.createObjectURL(file);
    $('#video-preview').attr('src', previewUrl);
    $('#video-preview-wrap').removeClass('hidden');
  });

  function setProgress(pct) {
    $('#progress-wrap').removeClass('hidden');
    $('#progress-bar').css('width', pct + '%');
    $('#progress-text').text(pct + '%');
    $('#progress-bar-wrap').attr('aria-valuenow', pct);
  }

  $form.on('submit', function (e) {
    e.preventDefault();
    if (!Auth.requireAdmin()) return;
    UI.clearErrors($form);

    const title = $.trim($('#title').val());
    const description = $.trim($('#description').val());
    const captionText = $.trim($('#caption_text').val());
    const file = $('#video')[0].files[0];
    const published = $('#published').is(':checked');
    let valid = true;

    if (!title) {
      UI.fieldError('title', 'Enter a title for the promo.');
      valid = false;
    }
    if (!description) {
      UI.fieldError('description', 'Add a short description.');
      valid = false;
    }
    if (!captionText) {
      UI.fieldError('caption_text', 'Add caption text so the video is accessible.');
      valid = false;
    }
    if (!editing && !file) {
      UI.fieldError('video', 'Choose a video file to upload.');
      valid = false;
    }
    if (file) {
      const problem = Utils.validateFile(file, VIDEO_RULE);
      if (problem) {
        UI.fieldError('video', problem);
        valid = false;
      }
    }
    if (!valid) {
      $form.find('[aria-invalid]').first().trigger('focus');
      return;
    }

    const body = new FormData();
    body.append('title', title);
    body.append('description', description);
    body.append('caption_text', captionText);
    if (editing) body.append('published', published ? 'true' : 'false');
    if (file) {
      body.append('video', file);
      setProgress(0);
    }

    UI.setBusy($button, true, 'Saving…');
    const options = { form: body, onProgress: setProgress };
    const request = editing ? Api.put('/promos/' + id, options) : Api.post('/promos', options);

    request.then(function (res) {
      const savedId = res.data && res.data.id ? res.data.id : id;
      if (!editing && !published) {
        return Api.patch('/promos/' + savedId + '/unpublish').then(function () { return savedId; });
      }
      return savedId;
    }).done(function (savedId) {
      Cache.invalidate('promos');
      Utils.flash(editing ? 'Promo updated successfully.' : 'Promo created. A notification was sent to all users.', 'success');
      window.location.href = 'promo-detail.html?id=' + savedId;
    }).fail(function (err) {
      UI.setBusy($button, false);
      $('#progress-wrap').addClass('hidden');
      UI.formError(UI.failMessage(err));
      $('html, body').animate({ scrollTop: 0 }, 200);
    });
  });
});
