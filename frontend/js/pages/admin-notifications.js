App.ready(function () {
  // ROLE GUARD (page). This page is declared data-guard="admin". The action-level check below runs again
  // before every delete so a normal user can never send DELETE /notifications/:id from this page.
  if (!Auth.requireAdmin()) return;

  const $wrap = $('#table-wrap');

  function render() {
    const items = Notify.items();
    $('#count').text(items.length + ' total');
    if (!items.length) {
      $wrap.html('<p class="p-8 text-center text-sm text-slate-500">There are no notifications.</p>');
      return;
    }
    $wrap.html('<table class="w-full text-left text-sm"><thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>' +
      '<th scope="col" class="px-5 py-3">Notification</th><th scope="col" class="px-5 py-3">Type</th><th scope="col" class="px-5 py-3">Audience</th><th scope="col" class="px-5 py-3">Created</th><th scope="col" class="px-5 py-3"><span class="sr-only">Actions</span></th></tr></thead><tbody class="divide-y divide-slate-100">' +
      items.map(function (n) {
        const info = Notify.typeInfo(n.type);
        return '<tr><td class="max-w-xs px-5 py-3"><p class="font-medium text-slate-900">' + Utils.esc(n.title) + '</p><p class="truncate text-slate-500">' + Utils.esc(n.message) + '</p></td>' +
          '<td class="px-5 py-3">' + UI.badge(info.label, info.tone) + '</td>' +
          '<td class="px-5 py-3 text-slate-600">' + (n.recipient_id ? 'Single user' : 'Everyone') + '</td>' +
          '<td class="whitespace-nowrap px-5 py-3 text-slate-600">' + Utils.formatDateTime(n.created_at) + '</td>' +
          '<td class="px-5 py-3 text-right"><button type="button" class="btn btn-danger btn-sm" data-delete="' + n.id + '" data-title="' + Utils.esc(n.title) + '">' + UI.icon('trash', 'h-4 w-4') + 'Delete<span class="sr-only"> ' + Utils.esc(n.title) + '</span></button></td></tr>';
      }).join('') + '</tbody></table>');
  }

  function load() {
    $wrap.html('<div class="p-5">' + UI.skeletonRows(4) + '</div>');
    Notify.load().done(render).fail(function (err) {
      UI.errorState($wrap, err, load);
    });
  }

  function removeNotification(id, title) {
    if (!Auth.requireAdmin()) return;
    UI.confirm({
      title: 'Delete this notification?',
      message: title ? '"' + title + '" will be removed for everyone it was sent to.' : 'This notification will be removed for everyone it was sent to.',
      confirmText: 'Delete notification',
      danger: true
    }).then(function (ok) {
      if (!ok) return;
      const known = Notify.items().some(n => n.id === id);
      const request = known ? Notify.remove(id) : Api.del('/notifications/' + id);
      request.done(function () {
        UI.toast('Notification deleted.', 'success');
        if (!known) load();
      }).fail(UI.fail);
    });
  }

  $wrap.on('click', '[data-delete]', function () {
    removeNotification($(this).data('delete'), $(this).attr('data-title'));
  });

  $('#delete-form').on('submit', function (e) {
    e.preventDefault();
    UI.clearErrors($(this));
    const id = $.trim($('#notification-id').val());
    if (!id) {
      UI.fieldError('notification-id', 'Enter the ID of the notification you want to delete.');
      return;
    }
    removeNotification(id, '');
    $('#notification-id').val('');
  });

  $(document).on('notifications:updated', render);

  load();
});
