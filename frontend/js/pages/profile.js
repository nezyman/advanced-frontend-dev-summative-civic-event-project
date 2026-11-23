App.ready(function () {
  const $content = $('#content');
  let profile = null;

  function render() {
    const isAdmin = profile.role === 'admin';
    $content.html(
      '<aside class="card h-fit p-6 text-center"><span class="mx-auto grid h-20 w-20 place-items-center rounded-full bg-brand-600 text-2xl font-bold text-white" aria-hidden="true">' + Utils.esc(Utils.initials(profile.full_name)) + '</span>' +
      '<h2 class="mt-4 text-lg font-semibold text-slate-900">' + Utils.esc(profile.full_name) + '</h2><p class="text-sm text-slate-500">' + Utils.esc(profile.email) + '</p>' +
      '<div class="mt-4 flex flex-wrap justify-center gap-2">' + UI.badge(isAdmin ? 'Administrator' : 'Member', isAdmin ? 'brand' : 'slate') + UI.badge(profile.is_active ? 'Active' : 'Disabled', profile.is_active ? 'green' : 'red') + '</div>' +
      '<p class="mt-4 text-xs text-slate-500">Member since ' + Utils.formatShortDate(profile.created_at) + '</p></aside>' +
      '<section class="card p-6 md:col-span-2" aria-labelledby="h-edit"><h2 id="h-edit" class="text-lg font-semibold text-slate-900">Account details</h2>' +
      '<form id="profile-form" class="mt-5 space-y-5" novalidate><div id="form-error" class="hidden rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert"></div>' +
      '<div><label class="label" for="full_name">Full name</label><input id="full_name" type="text" class="input" value="' + Utils.esc(profile.full_name) + '" required><p id="full_name-error" class="field-error hidden" role="alert"></p></div>' +
      '<div><label class="label" for="email">Email address</label><input id="email" type="email" class="input" value="' + Utils.esc(profile.email) + '" required><p id="email-error" class="field-error hidden" role="alert"></p></div>' +
      '<div class="grid gap-5 sm:grid-cols-2"><div><label class="label" for="role">Role</label><input id="role" type="text" class="input" value="' + Utils.esc(profile.role) + '" readonly aria-describedby="locked-note"></div>' +
      '<div><label class="label" for="status">Account status</label><input id="status" type="text" class="input" value="' + (profile.is_active ? 'Active' : 'Disabled') + '" readonly aria-describedby="locked-note"></div></div>' +
      '<p id="locked-note" class="text-xs text-slate-500">Your role and account status can only be managed by the system, so these fields cannot be edited.</p>' +
      '<div class="flex justify-end border-t border-slate-100 pt-5"><button type="submit" id="save-btn" class="btn btn-primary">Save changes</button></div></form></section>'
    );
  }

  function load() {
    $content.html('<div class="card h-64 skeleton" aria-hidden="true"></div><div class="card h-64 skeleton md:col-span-2" aria-hidden="true"></div>');
    Api.get('/users/profile/me').done(function (res) {
      profile = res.data;
      render();
    }).fail(function (err) {
      UI.errorState($content, err, load);
    });
  }

  $content.on('submit', '#profile-form', function (e) {
    e.preventDefault();
    const $form = $(this);
    const $button = $('#save-btn');
    UI.clearErrors($form);

    const fullName = $.trim($('#full_name').val());
    const email = $.trim($('#email').val());
    let valid = true;

    if (!fullName) {
      UI.fieldError('full_name', 'Your name cannot be empty.');
      valid = false;
    }
    if (!Utils.validEmail(email)) {
      UI.fieldError('email', 'Enter a valid email address.');
      valid = false;
    }
    if (!valid) {
      $form.find('[aria-invalid]').first().trigger('focus');
      return;
    }

    const changes = {};
    if (fullName !== profile.full_name) changes.full_name = fullName;
    if (email !== profile.email) changes.email = email;
    if (!Object.keys(changes).length) {
      UI.toast('There are no changes to save.', 'info');
      return;
    }

    UI.setBusy($button, true, 'Saving…');
    Api.patch('/users/profile/me', { data: changes })
      .done(function (res) {
        profile = Object.assign({}, profile, res.data || changes);
        Auth.updateUser({ full_name: profile.full_name, email: profile.email });
        $('#profile-name').text(profile.full_name);
        $('#profile-initials').text(Utils.initials(profile.full_name));
        render();
        UI.toast('Your profile was updated.', 'success');
      })
      .fail(function (err) {
        UI.setBusy($button, false);
        if (err.status === 409) {
          UI.fieldError('email', 'That email address is already used by another account.');
          UI.openModal(
            '<h2 class="text-lg font-semibold text-slate-900">Email already in use</h2>' +
            '<p class="mt-2 text-sm text-slate-600">Another account already uses <strong>' + Utils.esc(email) + '</strong>. Please choose a different email address. Your details have not been changed.</p>' +
            '<div class="mt-6 flex justify-end"><button type="button" class="btn btn-primary" data-close data-autofocus>Choose another email</button></div>',
            { label: 'Email already in use', onClose: function () { $('#email').trigger('focus'); } }
          );
        } else {
          UI.formError(UI.failMessage(err));
        }
      });
  });

  load();
});
