const App = {
  allowed: false,
  ready: function (fn) {
    if (!App.allowed) return;
    $(fn);
  }
};

(function () {
  const mode = document.body.dataset.guard || 'auth';
  App.allowed = Auth.guard(mode);
  if (!App.allowed) return;

  $(function () {
    UI.renderLayout();
    UI.renderSidebar();
    UI.bindPasswordToggles();
    if (mode !== 'guest') Notify.start();
    const flash = Utils.consumeFlash();
    if (flash) UI.toast(flash.message, flash.type);
  });
})();
