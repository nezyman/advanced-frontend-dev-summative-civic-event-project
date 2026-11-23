const Charts = (() => {
  const COLORS = ['#0e7c7c', '#d97706', '#2563eb', '#e11d48', '#64748b', '#7c3aed'];

  function bars(target, items, opts) {
    opts = opts || {};
    if (!items.length) {
      $(target).html('<p class="py-10 text-center text-sm text-slate-500">No data yet.</p>');
      return;
    }
    const max = Math.max.apply(null, items.map(i => i.value).concat([1]));
    const summary = items.map(i => i.label + ': ' + i.value).join(', ');
    const columns = items.map(function (item, index) {
      const height = Math.round((item.value / max) * 100);
      const color = opts.color || COLORS[index % COLORS.length];
      return '<li class="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">' +
        '<span class="text-xs font-semibold text-slate-700">' + item.value + '</span>' +
        '<div class="flex h-40 w-full items-end"><div class="chart-bar w-full rounded-t-md" style="height:' + height + '%;min-height:' + (item.value > 0 ? 4 : 0) + 'px;background:' + color + '"></div></div>' +
        '<span class="w-full truncate text-center text-xs text-slate-500" title="' + Utils.esc(item.label) + '">' + Utils.esc(item.label) + '</span></li>';
    }).join('');
    $(target).html('<ul role="img" aria-label="' + Utils.esc((opts.label || 'Bar chart') + '. ' + summary) + '" class="flex items-end gap-2 sm:gap-4">' + columns + '</ul>');
  }

  function donut(target, parts, opts) {
    opts = opts || {};
    const total = parts.reduce((sum, p) => sum + p.value, 0);
    let offset = 0;
    const rings = total > 0 ? parts.map(function (part, index) {
      const pct = (part.value / total) * 100;
      const ring = '<circle cx="18" cy="18" r="15.9155" fill="none" stroke="' + (part.color || COLORS[index % COLORS.length]) + '" stroke-width="4" stroke-dasharray="' + pct + ' ' + (100 - pct) + '" stroke-dashoffset="' + (-offset) + '"></circle>';
      offset += pct;
      return ring;
    }).join('') : '';
    const legend = parts.map(function (part, index) {
      return '<li class="flex items-center justify-between gap-4 text-sm"><span class="flex items-center gap-2"><span class="h-3 w-3 rounded-full" style="background:' + (part.color || COLORS[index % COLORS.length]) + '"></span>' + Utils.esc(part.label) + '</span><span class="font-semibold text-slate-900">' + part.value + '</span></li>';
    }).join('');
    const label = (opts.label || 'Chart') + ': ' + parts.map(p => p.label + ' ' + p.value).join(', ');
    $(target).html(
      '<div class="flex flex-wrap items-center gap-6">' +
      '<div class="relative h-36 w-36 shrink-0" role="img" aria-label="' + Utils.esc(label) + '">' +
      '<svg viewBox="0 0 36 36" class="h-full w-full -rotate-90"><circle cx="18" cy="18" r="15.9155" fill="none" stroke="#e2e8f0" stroke-width="4"></circle>' + rings + '</svg>' +
      '<div class="absolute inset-0 flex flex-col items-center justify-center"><span class="text-2xl font-bold text-slate-900">' + total + '</span><span class="text-xs text-slate-500">' + Utils.esc(opts.center || 'Total') + '</span></div></div>' +
      '<ul class="min-w-[10rem] flex-1 space-y-2">' + legend + '</ul></div>'
    );
  }

  return { bars, donut, COLORS };
})();
