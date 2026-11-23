App.ready(function () {
  const admin = Auth.isAdmin();
  const user = Auth.user() || {};
  const $stats = $('#stats');
  let firstLoad = true;
  let lastUserData = null;

  $('#dash-title').text(admin ? 'Admin dashboard' : 'Welcome back, ' + (user.full_name || 'there').split(' ')[0]);
  $('#dash-sub').text(admin ? 'Live numbers across events, people and content.' : 'A quick look at your activity.');
  $('#admin-charts').toggleClass('hidden', !admin);
  $('#user-links').toggleClass('hidden', admin);

  function statCard(label, value, hint, href) {
    const inner = '<p class="text-sm font-medium text-slate-500">' + Utils.esc(label) + '</p>' +
      '<p class="mt-2 text-3xl font-bold text-slate-900">' + value + '</p>' +
      (hint ? '<p class="mt-1 text-xs text-slate-500">' + Utils.esc(hint) + '</p>' : '');
    return href
      ? '<a href="' + href + '" class="card block p-5 transition hover:border-brand-500 hover:shadow-md">' + inner + '</a>'
      : '<div class="card p-5">' + inner + '</div>';
  }

  function stamp() {
    $('#last-updated').text('Updated ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }

  function monthLabel(value) {
    const d = new Date(value + '-01T00:00:00');
    return isNaN(d.getTime()) ? value : d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
  }

  function renderAdmin(data) {
    const users = data.users || {};
    const events = data.events || {};
    const totalEvents = Utils.num(events.total_events);
    const upcoming = Utils.num(events.upcoming_events);
    const past = Utils.num(events.past_events);
    const active = Utils.num(users.active_users);
    const inactive = Utils.num(users.inactive_users);
    const promos = Utils.num((data.promos || {}).total_promos);
    const announcements = Utils.num((data.announcements || {}).total_announcements);
    const notifications = Utils.num((data.notifications || {}).total_notifications);

    $stats.html([
      statCard('Total events', totalEvents, upcoming + ' upcoming · ' + past + ' finished', 'events.html'),
      statCard('Users', Utils.num(users.total_users), active + ' active · ' + inactive + ' disabled', 'admin-users.html'),
      statCard('Event registrations', Utils.num((data.registrations || {}).total_registrations), 'Across all events'),
      statCard('Feedback entries', Utils.num((data.feedbacks || {}).total_feedback), 'Ratings and comments'),
      statCard('Promos', promos, 'Video promotions', 'promos.html'),
      statCard('Announcements', announcements, 'Audio announcements', 'announcements.html'),
      statCard('Notifications', notifications, 'Sent to users', 'admin-notifications.html')
    ].join(''));

    const growth = (data.user_growth || []).map(g => ({ label: monthLabel(g.month), value: Utils.num(g.new_users) }));
    Charts.bars('#chart-growth', growth, { color: Charts.COLORS[0], label: 'New users per month' });
    Charts.donut('#chart-users', [
      { label: 'Active', value: active, color: '#0e7c7c' },
      { label: 'Disabled', value: inactive, color: '#e11d48' }
    ], { label: 'Users by status', center: 'Users' });
    Charts.donut('#chart-events', [
      { label: 'Upcoming', value: upcoming, color: '#0e7c7c' },
      { label: 'In progress', value: Math.max(totalEvents - upcoming - past, 0), color: '#d97706' },
      { label: 'Finished', value: past, color: '#64748b' }
    ], { label: 'Events by timing', center: 'Events' });
    Charts.bars('#chart-content', [
      { label: 'Events', value: totalEvents },
      { label: 'Promos', value: promos },
      { label: 'Announce.', value: announcements },
      { label: 'Notifs', value: notifications }
    ], { label: 'Content overview' });
  }

  function renderUser(data) {
    lastUserData = data;
    $stats.html([
      statCard('My registrations', Utils.num((data.registrations || {}).total_registered_events), 'Events you signed up for', 'my-registrations.html'),
      statCard('My feedback', Utils.num((data.feedbacks || {}).total_feedbacks), 'Ratings you have shared'),
      statCard('Notifications', Utils.num((data.notifications || {}).total_notifications), Notify.unreadCount() + ' unread', 'notifications.html'),
      statCard('Announcements', Utils.num((data.announcements || {}).total_announcements), 'Audio updates', 'announcements.html'),
      statCard('Promos', Utils.num((data.promos || {}).total_promos), 'Video promotions', 'promos.html')
    ].join(''));
  }

  function load() {
    const $refresh = $('#refresh');
    if (firstLoad) $stats.html(UI.skeletonCards(3).replace(/aspect-\[16\/9\]/g, 'h-6'));
    $refresh.prop('disabled', true);

    // ROLE GUARD (data). Only administrators request /dashboard/admin; normal users are served /dashboard/me.
    // The backend repeats this check with authorize(['admin']) so a normal user cannot read admin statistics.
    const request = admin ? Api.get('/dashboard/admin') : Api.get('/dashboard/me');

    request.done(function (res) {
      firstLoad = false;
      if (admin) renderAdmin(res.data || {});
      else renderUser(res.data || {});
      stamp();
    }).fail(function (err) {
      if (firstLoad) UI.errorState($stats, err, load);
      else UI.fail(err);
    }).always(function () {
      $refresh.prop('disabled', false);
    });
  }

  $(document).on('notifications:updated', function () {
    if (!admin && lastUserData) renderUser(lastUserData);
  });

  $('#refresh').on('click', load);
  load();
  setInterval(load, 60000);
});
