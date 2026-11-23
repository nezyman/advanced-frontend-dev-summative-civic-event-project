const Utils = (() => {
  const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

  function esc(value) {
    return String(value === null || value === undefined ? '' : value).replace(/[&<>"']/g, c => ESCAPES[c]);
  }

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function toDate(value) {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  function formatDate(value) {
    const d = toDate(value);
    return d ? d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  }

  function formatShortDate(value) {
    const d = toDate(value);
    return d ? d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  }

  function formatTime(value) {
    const d = toDate(value);
    return d ? d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '';
  }

  function formatDateTime(value) {
    const d = toDate(value);
    return d ? formatDate(value) + ' · ' + formatTime(value) : '—';
  }

  function formatDuration(seconds) {
    if (!isFinite(seconds) || seconds < 0) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return m + ':' + pad(s);
  }

  function timeAgo(value) {
    const d = toDate(value);
    if (!d) return '';
    const seconds = Math.round((Date.now() - d.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes + ' min ago';
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + ' h ago';
    const days = Math.floor(hours / 24);
    if (days < 7) return days + ' d ago';
    return formatShortDate(value);
  }

  function toLocalInput(value) {
    const d = toDate(value);
    if (!d) return '';
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function fromLocalInput(value) {
    const d = toDate(value);
    return d ? d.toISOString() : '';
  }

  function param(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function debounce(fn, wait) {
    let timer;
    return function () {
      const args = arguments;
      const ctx = this;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, wait);
    };
  }

  function truncate(text, max) {
    const t = String(text || '').trim();
    return t.length > max ? t.slice(0, max - 1).trimEnd() + '…' : t;
  }

  function initials(name) {
    const parts = String(name || '?').trim().split(/\s+/).slice(0, 2);
    return parts.map(p => p.charAt(0).toUpperCase()).join('') || '?';
  }

  function num(value) {
    const n = Number(value);
    return isFinite(n) ? n : 0;
  }

  function eventStatus(event) {
    const now = Date.now();
    const start = toDate(event.starts_at);
    const end = toDate(event.ends_at);
    if (end && end.getTime() < now) return 'past';
    if (start && start.getTime() > now) return 'upcoming';
    return 'ongoing';
  }

  function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
  }

  function passwordChecks(password) {
    return {
      length: password.length >= 8,
      lower: /[a-z]/.test(password),
      upper: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[\W_]/.test(password)
    };
  }

  function validateFile(file, rule) {
    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
    if (rule.exts.indexOf(ext) === -1) {
      return 'Unsupported file type. Allowed types: ' + rule.exts.join(', ').replace(/\./g, '') + '.';
    }
    if (file.size > rule.maxMB * 1024 * 1024) {
      return 'File is too large (' + (file.size / 1048576).toFixed(1) + ' MB). The maximum is ' + rule.maxMB + ' MB.';
    }
    return '';
  }

  function flash(message, type) {
    try {
      sessionStorage.setItem('civic_flash', JSON.stringify({ message: message, type: type || 'info' }));
    } catch (e) {
      return;
    }
  }

  function consumeFlash() {
    try {
      const raw = sessionStorage.getItem('civic_flash');
      if (!raw) return null;
      sessionStorage.removeItem('civic_flash');
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  return {
    esc, pad, toDate, formatDate, formatShortDate, formatTime, formatDateTime, formatDuration, timeAgo,
    toLocalInput, fromLocalInput, param, debounce, truncate, initials, num, eventStatus, validEmail,
    passwordChecks, validateFile, flash, consumeFlash
  };
})();

const Cache = (() => {
  const PREFIX = 'civic_cache_';

  function get(key) {
    try {
      const raw = sessionStorage.getItem(PREFIX + key);
      if (!raw) return null;
      const entry = JSON.parse(raw);
      if (Date.now() > entry.expires) {
        sessionStorage.removeItem(PREFIX + key);
        return null;
      }
      return entry.data;
    } catch (e) {
      return null;
    }
  }

  function set(key, data, ttl) {
    try {
      sessionStorage.setItem(PREFIX + key, JSON.stringify({ data: data, expires: Date.now() + (ttl || 120000) }));
    } catch (e) {
      return;
    }
  }

  function invalidate(prefix) {
    try {
      Object.keys(sessionStorage).forEach(function (k) {
        if (k.indexOf(PREFIX + prefix) === 0) sessionStorage.removeItem(k);
      });
    } catch (e) {
      return;
    }
  }

  return { get, set, invalidate };
})();
