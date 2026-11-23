const Api = (() => {
  const DEFAULT_MESSAGES = {
    400: 'The request was not valid.',
    401: 'Please sign in again.',
    403: 'You do not have permission to do that.',
    404: 'We could not find what you were looking for.',
    409: 'That conflicts with existing data.',
    500: 'The server ran into a problem. Please try again.'
  };

  function normalizeError(xhr) {
    if (xhr.status === 0) {
      return {
        status: 0,
        network: true,
        details: [],
        message: 'Cannot reach the server. Check your connection and make sure the backend is running.'
      };
    }
    const body = xhr.responseJSON || {};
    const details = Array.isArray(body.errors) ? body.errors.map(e => e.message).filter(Boolean) : [];
    return {
      status: xhr.status,
      network: false,
      details: details,
      message: body.message || DEFAULT_MESSAGES[xhr.status] || 'Something went wrong. Please try again.'
    };
  }

  function request(method, path, options) {
    options = options || {};
    const deferred = $.Deferred();
    const needsAuth = options.auth !== false;

    if (needsAuth && Auth.token() && !Auth.isLoggedIn()) {
      Auth.signOut('expired');
      return deferred.reject({ status: 401, message: 'Your session has expired.', details: [] }).promise();
    }

    const settings = {
      url: APP_CONFIG.API_BASE_URL + path,
      method: method,
      dataType: 'json',
      headers: {}
    };

    if (needsAuth && Auth.token()) settings.headers.Authorization = 'Bearer ' + Auth.token();

    if (options.form) {
      settings.data = options.form;
      settings.processData = false;
      settings.contentType = false;
      if (options.onProgress) {
        settings.xhr = function () {
          const xhr = $.ajaxSettings.xhr();
          if (xhr.upload) {
            xhr.upload.addEventListener('progress', function (e) {
              if (e.lengthComputable) options.onProgress(Math.round((e.loaded / e.total) * 100));
            });
          }
          return xhr;
        };
      }
    } else if (options.data !== undefined) {
      settings.data = JSON.stringify(options.data);
      settings.contentType = 'application/json';
    } else if (options.params) {
      settings.data = options.params;
    }

    $.ajax(settings)
      .done(function (res) { deferred.resolve(res); })
      .fail(function (xhr) {
        const err = normalizeError(xhr);
        if (err.status === 401 && needsAuth) {
          Auth.signOut('expired');
        }
        deferred.reject(err);
      });

    return deferred.promise();
  }

  return {
    get: (path, options) => request('GET', path, options),
    post: (path, options) => request('POST', path, options),
    put: (path, options) => request('PUT', path, options),
    patch: (path, options) => request('PATCH', path, options),
    del: (path, options) => request('DELETE', path, options)
  };
})();
