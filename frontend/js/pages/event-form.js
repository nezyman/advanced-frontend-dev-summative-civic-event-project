App.ready(function () {
  const id = Utils.param('id');
  const editing = !!id;
  const IMAGE_RULE = { exts: ['.jpg', '.jpeg', '.png', '.gif'], maxMB: 2 };
  const $form = $('#event-form');
  const $button = $('#save-btn');
  let previewUrl = null;

  // ROLE GUARD (page). This page is declared data-guard="admin" so normal users are redirected before it renders.
  // The check is repeated here so the form can never be submitted by a non-admin session.
  if (!Auth.requireAdmin()) return;

  if (editing) {
    $('#form-title').text('Edit event');
    document.title = 'Edit event · CivicEvents+';
    $form.addClass('hidden');
    $('#load-state').html(UI.skeletonRows(4));
    Api.get('/events/' + id).done(function (res) {
      const e = res.data;
      $('#title').val(e.title);
      $('#description').val(e.description || '');
      $('#location').val(e.location || '');
      $('#starts_at').val(Utils.toLocalInput(e.starts_at));
      $('#ends_at').val(Utils.toLocalInput(e.ends_at));
      $('#published').prop('checked', e.published !== false);
      if (e.metadata && e.metadata.image_url) {
        $('#preview').attr('src', e.metadata.image_url);
        $('#preview-wrap').removeClass('hidden');
        $('#image-hint').text('Current image shown below. Choose a file to replace it. JPG, PNG or GIF, up to 2 MB.');
      }
      $('#load-state').empty();
      $form.removeClass('hidden');
    }).fail(function (err) {
      UI.errorState('#load-state', err);
    });
  }

  $('#image').on('change', function () {
    UI.clearErrors($form);
    const file = this.files[0];
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
    if (!file) {
      $('#preview-wrap').addClass('hidden');
      return;
    }
    const problem = Utils.validateFile(file, IMAGE_RULE);
    if (problem) {
      UI.fieldError('image', problem);
      this.value = '';
      $('#preview-wrap').addClass('hidden');
      return;
    }
    previewUrl = URL.createObjectURL(file);
    $('#preview').attr('src', previewUrl);
    $('#preview-wrap').removeClass('hidden');
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
    const location = $.trim($('#location').val());
    const startsAt = $('#starts_at').val();
    const endsAt = $('#ends_at').val();
    const file = $('#image')[0].files[0];
    let valid = true;

    if (!title) {
      UI.fieldError('title', 'Enter a title for the event.');
      valid = false;
    }
    if (!location) {
      UI.fieldError('location', 'Enter where the event will take place.');
      valid = false;
    }
    if (!startsAt) {
      UI.fieldError('starts_at', 'Choose a start date and time.');
      valid = false;
    }
    if (!endsAt) {
      UI.fieldError('ends_at', 'Choose an end date and time.');
      valid = false;
    }
    if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
      UI.fieldError('ends_at', 'The event must end after it starts.');
      valid = false;
    }
    if (file) {
      const problem = Utils.validateFile(file, IMAGE_RULE);
      if (problem) {
        UI.fieldError('image', problem);
        valid = false;
      }
    }
    if (!valid) {
      $form.find('[aria-invalid]').first().trigger('focus');
      return;
    }

    const body = new FormData();
    body.append('title', title);
    body.append('description', $.trim($('#description').val()));
    body.append('location', location);
    body.append('starts_at', Utils.fromLocalInput(startsAt));
    body.append('ends_at', Utils.fromLocalInput(endsAt));
    body.append('published', $('#published').is(':checked') ? 'true' : 'false');
    if (file) body.append('image', file);

    UI.setBusy($button, true, 'Saving…');
    if (file) setProgress(0);

    const options = { form: body, onProgress: setProgress };
    const request = editing ? Api.put('/events/' + id, options) : Api.post('/events', options);

    request.done(function (res) {
      Utils.flash(editing ? 'Event updated successfully.' : 'Event created. A notification was sent to all users.', 'success');
      window.location.href = 'event-detail.html?id=' + (res.data && res.data.id ? res.data.id : id);
    }).fail(function (err) {
      UI.setBusy($button, false);
      $('#progress-wrap').addClass('hidden');
      UI.formError(UI.failMessage(err));
      $('html, body').animate({ scrollTop: 0 }, 200);
    });
  });
});
