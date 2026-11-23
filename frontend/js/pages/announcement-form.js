App.ready(function () {
  const id = Utils.param('id');
  const editing = !!id;
  const AUDIO_RULE = { exts: ['.mp3', '.wav', '.m4a', '.ogg'], maxMB: 5 };
  const $form = $('#announcement-form');
  const $button = $('#save-btn');
  let previewUrl = null;

  // ROLE GUARD (page). The page is declared data-guard="admin"; this repeats the check before any request is built.
  if (!Auth.requireAdmin()) return;

  if (editing) {
    $('#form-title').text('Edit announcement');
    document.title = 'Edit announcement · CivicEvents+';
    $('#audio-field').addClass('hidden');
    $('#edit-note').removeClass('hidden');
    $form.addClass('hidden');
    $('#load-state').html(UI.skeletonRows(3));
    Api.get('/announcements/' + id).done(function (res) {
      $('#title').val(res.data.title);
      $('#published').prop('checked', res.data.published !== false);
      $('#load-state').empty();
      $form.removeClass('hidden');
    }).fail(function (err) {
      UI.errorState('#load-state', err);
    });
  }

  $('#audio').on('change', function () {
    UI.clearErrors($form);
    const file = this.files[0];
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
    if (!file) {
      $('#audio-preview-wrap').addClass('hidden');
      return;
    }
    const problem = Utils.validateFile(file, AUDIO_RULE);
    if (problem) {
      UI.fieldError('audio', problem);
      this.value = '';
      $('#audio-preview-wrap').addClass('hidden');
      return;
    }
    previewUrl = URL.createObjectURL(file);
    $('#audio-preview').attr('src', previewUrl);
    $('#audio-preview-wrap').removeClass('hidden');
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
    const file = $('#audio')[0].files[0];
    const published = $('#published').is(':checked');
    let valid = true;

    if (!title) {
      UI.fieldError('title', 'Enter a title for the announcement.');
      valid = false;
    }
    if (!editing && !file) {
      UI.fieldError('audio', 'Choose an audio file to upload.');
      valid = false;
    }
    if (file) {
      const problem = Utils.validateFile(file, AUDIO_RULE);
      if (problem) {
        UI.fieldError('audio', problem);
        valid = false;
      }
    }
    if (!valid) {
      $form.find('[aria-invalid]').first().trigger('focus');
      return;
    }

    UI.setBusy($button, true, 'Saving…');

    let request;
    if (editing) {
      request = Api.put('/announcements/' + id, { data: { title: title, published: published } });
    } else {
      const body = new FormData();
      body.append('title', title);
      body.append('audio', file);
      body.append('published', published ? 'true' : 'false');
      setProgress(0);
      request = Api.post('/announcements', { form: body, onProgress: setProgress });
    }

    request.done(function (res) {
      Utils.flash(editing ? 'Announcement updated successfully.' : 'Announcement created. A notification was sent to all users.', 'success');
      window.location.href = 'announcement-detail.html?id=' + (res.data && res.data.id ? res.data.id : id);
    }).fail(function (err) {
      UI.setBusy($button, false);
      $('#progress-wrap').addClass('hidden');
      UI.formError(UI.failMessage(err));
      $('html, body').animate({ scrollTop: 0 }, 200);
    });
  });
});
