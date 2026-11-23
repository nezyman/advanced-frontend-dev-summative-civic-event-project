const Auth = (() => {
  const TOKEN_KEY = 'civic_token';
  const USER_KEY = 'civic_user';

  function activeStore() {
    if (localStorage.getItem(TOKEN_KEY)) return localStorage;
    if (sessionStorage.getItem(TOKEN_KEY)) return sessionStorage;
    return null;
  }

  function token() {
    const store = activeStore();
    return store ? store.getItem(TOKEN_KEY) : null;
  }

  function user() {
    const store = activeStore();
    if (!store) return null;
    try {
      return JSON.parse(store.getItem(USER_KEY));
    } catch (e) {
      return null;
    }
  }

  function clear() {
    [localStorage, sessionStorage].forEach(function (store) {
      store.removeItem(TOKEN_KEY);
      store.removeItem(USER_KEY);
    });
    Cache.invalidate('');
  }

  function save(newToken, newUser, persist) {
    clear();
    const store = persist ? localStorage : sessionStorage;
    store.setItem(TOKEN_KEY, newToken);
    store.setItem(USER_KEY, JSON.stringify(newUser));
  }

  function updateUser(patch) {
    const store = activeStore();
    const current = user();
    if (!store || !current) return;
    store.setItem(USER_KEY, JSON.stringify(Object.assign({}, current, patch)));
  }

  function tokenExpired(value) {
    try {
      const payload = JSON.parse(atob(value.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return !!payload.exp && payload.exp * 1000 < Date.now();
    } catch (e) {
      return true;
    }
  }

  function isLoggedIn() {
    const value = token();
    return !!value && !tokenExpired(value);
  }

  function isAdmin() {
    const current = user();
    return isLoggedIn() && !!current && current.role === 'admin';
  }

  function signOut(reason) {
    clear();
    if (reason === 'expired') Utils.flash('Your session has expired. Please sign in again.', 'error');
    if (reason === 'manual') Utils.flash('You have been signed out.', 'success');
    window.location.replace('login.html');
  }

  function guard(mode) {
    // ROLE GUARD (page level). Every page declares its access level in <body data-guard="...">:
    //   "guest" -> only signed-out visitors (login / signup); signed-in users are sent to the dashboard
    //   "auth"  -> any signed-in user, admin or normal user
    //   "admin" -> signed-in users whose role === "admin"; normal users are redirected to the dashboard
    // This only controls what the UI shows. The backend still enforces authenticate + authorize(['admin']).
    if (mode === 'guest') {
      if (isLoggedIn()) {
        window.location.replace('dashboard.html');
        return false;
      }
      return true;
    }

    if (!isLoggedIn()) {
      const hadToken = !!token();
      clear();
      Utils.flash(hadToken ? 'Your session has expired. Please sign in again.' : 'Please sign in to continue.', hadToken ? 'error' : 'info');
      window.location.replace('login.html');
      return false;
    }

    if (mode === 'admin' && !isAdmin()) {
      Utils.flash('That page is for administrators only.', 'error');
      window.location.replace('dashboard.html');
      return false;
    }

    return true;
  }

  function requireAdmin() {
    // ROLE GUARD (action level). Called before any admin-only action (create, edit, delete, enable/disable).
    // A normal user who somehow triggers one of these handlers is stopped here and the request is never sent.
    if (!isAdmin()) {
      if (window.UI) UI.toast('This action is only available to administrators.', 'error');
      return false;
    }
    return true;
  }

  return { token, user, save, clear, updateUser, isLoggedIn, isAdmin, signOut, guard, requireAdmin };
})();
