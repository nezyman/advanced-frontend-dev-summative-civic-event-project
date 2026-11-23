App.ready(function () {
  // ROLE GUARD (page). This page is declared data-guard="admin" so only administrators ever reach it.
  // Every state-changing action below calls Auth.requireAdmin() first, and the backend repeats the check
  // with authorize(['admin']) on /users routes.
  if (!Auth.requireAdmin()) return;

  const LIMIT = 10;
  const me = Auth.user() || {};
  const $wrap = $('#table-wrap');
  let users = [];
  let page = 1;

  function filtered() {
    const q = $.trim($('#user-filter').val()).toLowerCase();
    if (!q) return users;
    return users.filter(u => (u.full_name + ' ' + u.email).toLowerCase().indexOf(q) !== -1);
  }

  function row(u) {
    const self = u.id === me.id;
    const active = u.is_active !== false;
    const toggle = self
      ? '<button type="button" class="btn btn-secondary btn-sm" disabled title="You cannot disable your own account">Disable</button>'
      : '<button type="button" class="btn ' + (active ? 'btn-danger' : 'btn-primary') + ' btn-sm" data-toggle="' + u.id + '">' + (active ? 'Disable' : 'Enable') + '<span class="sr-only"> ' + Utils.esc(u.full_name) + '</span></button>';
    return '<tr><td class="px-5 py-3"><div class="flex items-center gap-3"><span class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700" aria-hidden="true">' + Utils.esc(Utils.initials(u.full_name)) + '</span>' +
      '<div><p class="font-medium text-slate-900">' + Utils.esc(u.full_name) + (self ? ' <span class="text-xs font-normal text-slate-500">(you)</span>' : '') + '</p><p class="text-slate-500">' + Utils.esc(u.email) + '</p></div></div></td>' +
      '<td class="px-5 py-3">' + UI.badge(u.role === 'admin' ? 'Administrator' : 'Member', u.role === 'admin' ? 'brand' : 'slate') + '</td>' +
      '<td class="px-5 py-3">' + UI.badge(active ? 'Active' : 'Disabled', active ? 'green' : 'red') + '</td>' +
      '<td class="whitespace-nowrap px-5 py-3 text-slate-600">' + Utils.formatShortDate(u.created_at) + '</td>' +
      '<td class="px-5 py-3"><div class="flex justify-end gap-2"><button type="button" class="btn btn-secondary btn-sm" data-view="' + u.id + '">View<span class="sr-only"> ' + Utils.esc(u.full_name) + '</span></button>' + toggle + '</div></td></tr>';
  }

  function render() {
    const list = filtered();
    $('#count').text(list.length + ' shown');
    if (!list.length) {
      $wrap.html('<p class="p-8 text-center text-sm text-slate-500">No users match.</p>');
      return;
    }
    $wrap.html('<table class="w-full text-left text-sm"><thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>' +
      '<th scope="col" class="px-5 py-3">User</th><th scope="col" class="px-5 py-3">Role</th><th scope="col" class="px-5 py-3">Status</th><th scope="col" class="px-5 py-3">Joined</th><th scope="col" class="px-5 py-3"><span class="sr-only">Actions</span></th></tr></thead><tbody class="divide-y divide-slate-100">' +
      list.map(row).join('') + '</tbody></table>');
  }

  function load() {
    $wrap.html('<div class="p-5">' + UI.skeletonRows(5) + '</div>');
    Api.get('/users', { params: { page: page, limit: LIMIT } }).done(function (res) {
      users = res.data || [];
      render();
      UI.pager('#pager', {
        page: page,
        hasNext: users.length === LIMIT,
        onChange: function (p) { page = p; load(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
      });
    }).fail(function (err) {
      UI.errorState($wrap, err, load);
    });
  }

  $('#user-filter').on('input', Utils.debounce(render, 150));

  $wrap.on('click', '[data-view]', function () {
    const id = $(this).data('view');
    Api.get('/users/' + id).done(function (res) {
      const u = res.data;
      const active = u.is_active !== false;
      UI.openModal(
        '<div class="flex items-center gap-4"><span class="grid h-14 w-14 place-items-center rounded-full bg-brand-600 text-lg font-bold text-white" aria-hidden="true">' + Utils.esc(Utils.initials(u.full_name)) + '</span>' +
        '<div><h2 class="text-lg font-semibold text-slate-900">' + Utils.esc(u.full_name) + '</h2><p class="text-sm text-slate-500">' + Utils.esc(u.email) + '</p></div></div>' +
        '<dl class="mt-6 grid grid-cols-2 gap-4 text-sm"><div><dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">Role</dt><dd class="mt-1">' + UI.badge(u.role === 'admin' ? 'Administrator' : 'Member', u.role === 'admin' ? 'brand' : 'slate') + '</dd></div>' +
        '<div><dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</dt><dd class="mt-1">' + UI.badge(active ? 'Active' : 'Disabled', active ? 'green' : 'red') + '</dd></div>' +
        '<div><dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">Joined</dt><dd class="mt-1 text-slate-800">' + Utils.formatDateTime(u.created_at) + '</dd></div>' +
        '<div><dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">Last updated</dt><dd class="mt-1 text-slate-800">' + Utils.formatDateTime(u.updated_at) + '</dd></div>' +
        '<div class="col-span-2"><dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">User ID</dt><dd class="mt-1 break-all font-mono text-xs text-slate-700">' + Utils.esc(u.id) + '</dd></div></dl>' +
        '<div class="mt-6 flex justify-end"><button type="button" class="btn btn-secondary" data-close data-autofocus>Close</button></div>',
        { label: 'User details' }
      );
    }).fail(UI.fail);
  });

  $wrap.on('click', '[data-toggle]', function () {
    if (!Auth.requireAdmin()) return;
    const id = $(this).data('toggle');
    const user = users.find(u => u.id === id);
    if (!user || user.id === me.id) return;
    const wasActive = user.is_active !== false;
    UI.confirm({
      title: wasActive ? 'Disable this account?' : 'Enable this account?',
      message: wasActive ? user.full_name + ' will be marked as disabled.' : user.full_name + ' will be marked as active again.',
      confirmText: wasActive ? 'Disable account' : 'Enable account',
      danger: wasActive
    }).then(function (ok) {
      if (!ok) return;
      user.is_active = !wasActive;
      render();
      Api.patch('/users/' + id + '/' + (wasActive ? 'disable' : 'enable'))
        .done(function () { UI.toast(user.full_name + (wasActive ? ' was disabled.' : ' was enabled.'), 'success'); })
        .fail(function (err) {
          user.is_active = wasActive;
          render();
          UI.fail(err);
        });
    });
  });

  load();
});
