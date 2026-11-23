App.ready(function () {
  const id = Utils.param('id');
  const admin = Auth.isAdmin();
  const $content = $('#content');
  let event = null;
  let registration = null;
  let myFeedback = null;
  let attendees = [];
  let feedbackList = [];

  if (!id) {
    UI.errorState($content, { status: 404, message: 'No event was selected.' });
    return;
  }

  function mapLink(location) {
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(location);
  }

  function registrationBlock() {
    // ROLE GUARD (UI). Registration controls are for normal users only; administrators manage events instead.
    if (admin) return '';
    const status = registration && registration.status;
    const timing = Utils.eventStatus(event);
    if (status === 'registered') {
      return '<div class="flex flex-wrap items-center gap-3"><span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">' + UI.icon('check', 'h-4 w-4') + 'You are registered</span>' +
        '<button type="button" id="cancel-reg" class="btn btn-secondary btn-sm">Cancel registration</button></div>';
    }
    if (status === 'cancelled') {
      return '<p class="rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-700">You cancelled your registration for this event. Please contact an administrator if you would like to join again.</p>';
    }
    if (timing === 'past') {
      return '<p class="rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-700">This event has finished, so registration is closed.</p>';
    }
    return '<button type="button" id="register-btn" class="btn btn-primary">Register for this event</button>';
  }

  function adminActions() {
    // ROLE GUARD (UI). Edit and delete are rendered only for administrators.
    if (!admin) return '';
    return '<div class="flex flex-wrap gap-2"><a class="btn btn-secondary btn-sm" href="event-form.html?id=' + event.id + '">' + UI.icon('pencil', 'h-4 w-4') + 'Edit event</a>' +
      '<button type="button" id="delete-event" class="btn btn-danger btn-sm">' + UI.icon('trash', 'h-4 w-4') + 'Delete</button></div>';
  }

  function attendeesSection() {
    // ROLE GUARD (UI). The registrant list is only shown to administrators (backend route is admin-only too).
    if (!admin) return '';
    const rows = attendees.length
      ? '<div class="overflow-x-auto"><table class="w-full text-left text-sm"><thead class="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500"><tr><th scope="col" class="py-2 pr-4">Name</th><th scope="col" class="py-2 pr-4">Email</th><th scope="col" class="py-2">Registered</th></tr></thead><tbody class="divide-y divide-slate-100">' +
        attendees.map(a => '<tr><td class="py-2 pr-4 font-medium text-slate-900">' + Utils.esc(a.full_name) + '</td><td class="py-2 pr-4 text-slate-600">' + Utils.esc(a.email) + '</td><td class="py-2 text-slate-600">' + Utils.formatShortDate(a.created_at) + '</td></tr>').join('') + '</tbody></table></div>'
      : '<p class="text-sm text-slate-500">Nobody has registered yet.</p>';
    return '<section class="card mt-6 p-6" aria-labelledby="h-attendees"><h2 id="h-attendees" class="text-lg font-semibold text-slate-900">Registrants <span class="text-slate-500">(' + attendees.length + ')</span></h2><div class="mt-4">' + rows + '</div></section>';
  }

  function feedbackSection() {
    if (admin) {
      const ratings = feedbackList.map(f => Utils.num(f.rating)).filter(r => r > 0);
      const average = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
      const items = feedbackList.length
        ? '<ul class="mt-6 divide-y divide-slate-100">' + feedbackList.map(f =>
          '<li class="py-4"><div class="flex flex-wrap items-center justify-between gap-2"><p class="font-medium text-slate-900">' + Utils.esc(f.full_name) + '</p>' + UI.stars(f.rating) + '</div>' +
          (f.comment ? '<p class="mt-1 text-sm text-slate-600 whitespace-lines">' + Utils.esc(f.comment) + '</p>' : '') +
          '<p class="mt-1 text-xs text-slate-500">' + Utils.formatShortDate(f.created_at) + '</p></li>').join('') + '</ul>'
        : '<p class="mt-6 text-sm text-slate-500">No feedback has been submitted yet.</p>';
      return '<section class="card mt-6 p-6" aria-labelledby="h-feedback"><h2 id="h-feedback" class="text-lg font-semibold text-slate-900">Attendee feedback</h2>' +
        '<div class="mt-3 flex items-center gap-4"><p class="text-4xl font-bold text-slate-900">' + (ratings.length ? average.toFixed(1) : '–') + '</p><div>' + UI.stars(average, 'h-5 w-5') + '<p class="mt-1 text-sm text-slate-500">' + ratings.length + ' rating' + (ratings.length === 1 ? '' : 's') + '</p></div></div>' + items + '</section>';
    }

    const rating = myFeedback ? Utils.num(myFeedback.rating) : 0;
    const stars = [1, 2, 3, 4, 5].map(n =>
      '<label class="cursor-pointer"><input type="radio" name="rating" value="' + n + '" class="peer sr-only"' + (rating === n ? ' checked' : '') + '>' +
      '<span data-star="' + n + '" class="block rounded text-4xl leading-none text-slate-300 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-600" aria-hidden="true">★</span><span class="sr-only">' + n + ' star' + (n === 1 ? '' : 's') + '</span></label>').join('');
    return '<section class="card mt-6 p-6" aria-labelledby="h-feedback"><h2 id="h-feedback" class="text-lg font-semibold text-slate-900">' + (myFeedback ? 'Your feedback' : 'Share your feedback') + '</h2>' +
      '<p class="mt-1 text-sm text-slate-600">You can leave one rating and comment per event' + (myFeedback ? ', and you can update it any time.' : '.') + '</p>' +
      '<form id="feedback-form" class="mt-4 space-y-4" novalidate><div id="form-error" class="hidden rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert"></div>' +
      '<fieldset><legend class="label">Rating</legend><div class="mt-1 flex gap-1" id="star-group">' + stars + '</div><p id="rating-error" class="field-error hidden" role="alert"></p></fieldset>' +
      '<div><label class="label" for="comment">Comment <span class="font-normal text-slate-500">(optional)</span></label><textarea id="comment" rows="4" maxlength="1000" class="input" placeholder="What did you think?">' + Utils.esc(myFeedback ? myFeedback.comment || '' : '') + '</textarea></div>' +
      '<button type="submit" id="feedback-btn" class="btn btn-primary">' + (myFeedback ? 'Update feedback' : 'Submit feedback') + '</button></form></section>';
  }

  function paintStars() {
    const value = Number($('#star-group input:checked').val() || 0);
    $('#star-group [data-star]').each(function () {
      const on = Number($(this).data('star')) <= value;
      $(this).toggleClass('text-amber-400', on).toggleClass('text-slate-300', !on);
    });
  }

  function render() {
    const image = event.metadata && event.metadata.image_url;
    const status = Utils.eventStatus(event);
    const tone = { upcoming: 'brand', ongoing: 'green', past: 'slate' }[status];
    const label = { upcoming: 'Upcoming', ongoing: 'Happening now', past: 'Finished' }[status];
    document.title = event.title + ' · CivicEvents+';

    $content.html(
      '<article class="card overflow-hidden">' +
      '<div class="relative aspect-[21/9] bg-gradient-to-br from-brand-600 to-brand-900"><div class="absolute inset-0 flex items-center justify-center text-white/70">' + UI.icon('calendar', 'h-16 w-16') + '</div>' +
      (image ? '<img src="' + Utils.esc(image) + '" alt="Poster for ' + Utils.esc(event.title) + '" class="absolute inset-0 h-full w-full object-cover" onerror="this.remove()">' : '') + '</div>' +
      '<div class="p-6 sm:p-8"><div class="flex flex-wrap items-center gap-2">' + UI.badge(label, tone) + (admin && event.published === false ? UI.badge('Draft', 'amber') : '') + '</div>' +
      '<div class="mt-3 flex flex-wrap items-start justify-between gap-4"><h1 class="text-3xl font-bold tracking-tight text-slate-900">' + Utils.esc(event.title) + '</h1>' + adminActions() + '</div>' +
      '<dl class="mt-6 grid gap-4 sm:grid-cols-3">' +
      '<div><dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">Starts</dt><dd class="mt-1 text-sm text-slate-800">' + Utils.formatDateTime(event.starts_at) + '</dd></div>' +
      '<div><dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">Ends</dt><dd class="mt-1 text-sm text-slate-800">' + Utils.formatDateTime(event.ends_at) + '</dd></div>' +
      '<div><dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">Location</dt><dd class="mt-1 text-sm text-slate-800">' + Utils.esc(event.location || 'To be announced') +
      (event.location ? ' <a class="ml-1 font-medium text-brand-700 hover:underline" href="' + mapLink(event.location) + '" target="_blank" rel="noopener noreferrer">View on map<span class="sr-only"> (opens in a new tab)</span></a>' : '') + '</dd></div></dl>' +
      '<div class="mt-6 border-t border-slate-100 pt-6"><h2 class="text-lg font-semibold text-slate-900">About this event</h2><p class="mt-2 text-slate-700 whitespace-lines">' + Utils.esc(event.description || 'No description has been added yet.') + '</p></div>' +
      '<div class="mt-8">' + registrationBlock() + '</div></div></article>' +
      attendeesSection() + feedbackSection()
    );
    paintStars();
  }

  function load() {
    $content.html('<div class="card overflow-hidden" aria-hidden="true"><div class="skeleton aspect-[21/9]"></div><div class="space-y-4 p-8"><div class="skeleton h-8 w-2/3 rounded"></div><div class="skeleton h-4 w-full rounded"></div><div class="skeleton h-4 w-5/6 rounded"></div></div></div>');
    const calls = [Api.get('/events/' + id)];
    if (admin) {
      calls.push(Api.get('/event-registrations/event/' + id + '/attendees'));
      calls.push(Api.get('/event-feedback/event/' + id));
    } else {
      calls.push(Api.get('/event-registrations/my-registrations'));
      calls.push(Api.get('/event-feedback/my-feedback'));
    }

    $.when.apply($, calls).done(function (eventRes, second, third) {
      event = eventRes.data;
      if (!admin && event.published === false) {
        UI.errorState($content, { status: 404, message: 'This event is not available.' });
        return;
      }
      if (admin) {
        attendees = second.data || [];
        feedbackList = third.data || [];
      } else {
        registration = (second.data || []).find(r => r.event_id === id) || null;
        myFeedback = (third.data || []).find(f => f.event_id === id) || null;
      }
      render();
    }).fail(function (err) {
      UI.errorState($content, err, load);
    });
  }

  $content.on('click', '#register-btn', function () {
    const $button = $(this);
    UI.setBusy($button, true, 'Registering…');
    Api.post('/event-registrations/register', { data: { event_id: id } })
      .done(function () {
        UI.toast('You are registered. See you there!', 'success');
        load();
      })
      .fail(function (err) {
        UI.setBusy($button, false);
        UI.fail(err);
      });
  });

  $content.on('click', '#cancel-reg', function () {
    const $button = $(this);
    UI.confirm({
      title: 'Cancel your registration?',
      message: 'You will no longer be listed as attending "' + event.title + '".',
      confirmText: 'Cancel registration',
      danger: true
    }).then(function (ok) {
      if (!ok) return;
      UI.setBusy($button, true, 'Cancelling…');
      Api.post('/event-registrations/cancel', { data: { event_id: id } })
        .done(function () {
          UI.toast('Your registration was cancelled.', 'success');
          load();
        })
        .fail(function (err) {
          UI.setBusy($button, false);
          UI.fail(err);
        });
    });
  });

  $content.on('click', '#delete-event', function () {
    if (!Auth.requireAdmin()) return;
    UI.confirm({
      title: 'Delete this event?',
      message: '"' + event.title + '" will be permanently removed. This cannot be undone.',
      confirmText: 'Delete event',
      danger: true
    }).then(function (ok) {
      if (!ok) return;
      Api.del('/events/' + id)
        .done(function () {
          Utils.flash('Event deleted.', 'success');
          window.location.href = 'events.html';
        })
        .fail(UI.fail);
    });
  });

  $content.on('change', '#star-group input', paintStars);

  $content.on('submit', '#feedback-form', function (e) {
    e.preventDefault();
    const $form = $(this);
    const $button = $('#feedback-btn');
    UI.clearErrors($form);
    const rating = Number($('#star-group input:checked').val() || 0);
    const comment = $.trim($('#comment').val());

    if (!rating) {
      $('#rating-error').text('Choose a rating from 1 to 5 stars.').removeClass('hidden');
      return;
    }

    UI.setBusy($button, true, 'Saving…');
    const request = myFeedback
      ? Api.put('/event-feedback/' + myFeedback.id, { data: { rating: rating, comment: comment } })
      : Api.post('/event-feedback', { data: { event_id: id, rating: rating, comment: comment } });

    request.done(function () {
      UI.toast(myFeedback ? 'Your feedback was updated.' : 'Thanks for your feedback!', 'success');
      load();
    }).fail(function (err) {
      UI.setBusy($button, false);
      if (err.status === 409) {
        UI.toast('You have already left feedback for this event. Loading it so you can update it.', 'warning');
        load();
      } else {
        UI.formError(UI.failMessage(err));
      }
    });
  });

  load();
});
