App.ready(function () {
  const $form = $('#login-form');
  const $button = $('#login-btn');

  $form.on('submit', function (e) {
    e.preventDefault();
    UI.clearErrors($form);

    const email = $.trim($('#email').val());
    const password = $('#password').val();
    let valid = true;

    if (!Utils.validEmail(email)) {
      UI.fieldError('email', 'Enter a valid email address.');
      valid = false;
    }
    if (!password) {
      UI.fieldError('password', 'Enter your password.');
      valid = false;
    }
    if (!valid) {
      $form.find('[aria-invalid]').first().trigger('focus');
      return;
    }

    UI.setBusy($button, true, 'Signing in…');

    Api.post('/auth/login', { data: { email: email, password: password }, auth: false })
      .done(function (res) {
        const data = res.data;
        Auth.save(data.token, data.user, $('#remember').is(':checked'));
        window.location.href = 'dashboard.html';
      })
      .fail(function (err) {
        UI.setBusy($button, false);
        if (err.status === 401) {
          UI.formError('Incorrect email or password. Please try again.');
        } else {
          UI.formError(UI.failMessage(err));
        }
      });
  });
});
