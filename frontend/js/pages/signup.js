App.ready(function () {
  const $form = $('#signup-form');
  const $button = $('#signup-btn');
  const RULES = ['length', 'lower', 'upper', 'number', 'special'];

  function level(score) {
    if (score === 0) return { label: 'not entered yet', bar: 'bg-slate-200', text: 'text-slate-500' };
    if (score <= 2) return { label: 'Weak', bar: 'bg-red-500', text: 'text-red-700' };
    if (score === 3) return { label: 'Fair', bar: 'bg-amber-500', text: 'text-amber-700' };
    if (score === 4) return { label: 'Good', bar: 'bg-lime-500', text: 'text-lime-700' };
    return { label: 'Strong', bar: 'bg-emerald-600', text: 'text-emerald-700' };
  }

  function updateMeter() {
    const password = $('#password').val();
    const checks = Utils.passwordChecks(password);
    const score = RULES.filter(rule => checks[rule]).length;
    const info = level(score);

    $('#strength-bar span').each(function (index) {
      $(this).attr('class', 'h-1.5 flex-1 rounded-full ' + (index < score ? info.bar : 'bg-slate-200'));
    });
    $('#strength-label').attr('class', 'mt-1.5 text-xs font-medium ' + info.text).text('Password strength: ' + info.label);

    RULES.forEach(function (rule) {
      const $li = $('#pw-rules [data-rule="' + rule + '"]');
      const met = checks[rule];
      $li.toggleClass('text-emerald-700', met).toggleClass('text-slate-600', !met);
      $li.find('[data-mark]').text(met ? '✓' : '○');
      $li.find('[data-state]').text(met ? ' (met)' : ' (not met)');
    });
  }

  $('#password').on('input', updateMeter);

  $form.on('submit', function (e) {
    e.preventDefault();
    UI.clearErrors($form);

    const fullName = $.trim($('#full_name').val());
    const email = $.trim($('#email').val());
    const password = $('#password').val();
    const confirm = $('#confirm_password').val();
    const checks = Utils.passwordChecks(password);
    let valid = true;

    if (fullName.length < 2) {
      UI.fieldError('full_name', 'Enter your full name.');
      valid = false;
    }
    if (!Utils.validEmail(email)) {
      UI.fieldError('email', 'Enter a valid email address.');
      valid = false;
    }
    if (!RULES.every(rule => checks[rule])) {
      UI.fieldError('password', 'Use at least 8 characters with upper and lower case letters, a number and a special character.');
      valid = false;
    }
    if (confirm !== password || !confirm) {
      UI.fieldError('confirm_password', 'The passwords do not match.');
      valid = false;
    }
    if (!valid) {
      $form.find('[aria-invalid]').first().trigger('focus');
      return;
    }

    UI.setBusy($button, true, 'Creating account…');

    Api.post('/auth/signup', { data: { full_name: fullName, email: email, password: password }, auth: false })
      .done(function () {
        Utils.flash('Account created successfully. Please sign in.', 'success');
        window.location.href = 'login.html';
      })
      .fail(function (err) {
        UI.setBusy($button, false);
        if (err.status === 409) {
          UI.fieldError('email', 'That email is already registered. Try signing in instead.');
          $('#email').trigger('focus');
        } else {
          UI.formError(UI.failMessage(err));
        }
      });
  });
});
