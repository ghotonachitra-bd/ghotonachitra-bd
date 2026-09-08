(function () {
  const db = window.GHOTONACHITRA || { records: [], sources: [] };
  const $ = (id) => document.getElementById(id);

  const els = {
    period: $('period'), category: $('category'), area: $('area'),
    kpiVerified: $('kpiVerified'), kpiVerifiedText: $('kpiVerifiedText'),
    kpiCurrent: $('kpiCurrent'), kpiCross: $('kpiCross'), kpiSources: $('kpiSources'),
    trend: $('trend'), trendStatus: $('trendStatus'), categoryBreakdown: $('categoryBreakdown'),
    comparisonBody: $('comparisonBody'), recordsList: $('recordsList'), recordCount: $('recordCount'),
    sourceGrid: $('sourceGrid')
  };

  const sourceMap = Object.fromEntries(db.sources.map(s => [s.id, s]));
  const sourceName = (id) => sourceMap[id]?.name || id;
  const sourceTypeLabel = (id) => sourceMap[id]?.type === 'primary' ? 'Primary' : 'Secondary';

  function filtered() {
    return db.records.filter(r => {
      const p = els.period.value, c = els.category.value, a = els.area.value;
      return (p === 'all' || r.period === p) && (c === 'all' || r.category === c) && (a === 'all' || r.area === a);
    });
  }

  function renderKpis(rows) {
    const verified = rows.filter(r => r.verified);
    const cross = rows.filter(r => r.crossChecked);
    els.kpiVerified.textContent = verified.length ? verified.reduce((n, r) => n + Number(r.count || 0), 0).toLocaleString('bn-BD') : '—';
    els.kpiVerifiedText.textContent = verified.length ? `${verified.length} verified record` : 'ডেটা অপেক্ষমাণ';
    els.kpiCurrent.textContent = rows.length ? rows.reduce((n, r) => n + Number(r.count || 0), 0).toLocaleString('bn-BD') : '—';
    els.kpiCross.textContent = cross.length ? cross.length.toLocaleString('bn-BD') : '—';
    els.kpiSources.textContent = db.sources.length.toLocaleString('bn-BD');
  }

  function renderTrend(rows) {
    if (!rows.length) {
      els.trendStatus.textContent = 'ডেটা অপেক্ষমাণ';
      els.trend.innerHTML = '<div class="empty"><b>যাচাইকৃত ডেটা যোগ হলে এখানে ট্রেন্ড দেখা যাবে</b><p>data.js-এর records array-তে verified record যোগ করুন।</p></div>';
      return;
    }
    els.trendStatus.textContent = 'Live filter';
    const years = [...new Set(rows.map(r => r.year))].sort((a,b)=>a-b);
    const totals = years.map(y => rows.filter(r=>r.year===y).reduce((n,r)=>n+Number(r.count||0),0));
    const max = Math.max(...totals, 1);
    els.trend.innerHTML = years.map((y,i) => `<div class="bar-row"><span>${y}</span><div class="bar-track"><div class="bar" style="width:${Math.max(2, totals[i]/max*100)}%"></div></div><b>${totals[i].toLocaleString('bn-BD')}</b></div>`).join('');
  }

  function renderCategories(rows) {
    const cats = {};
    rows.forEach(r => cats[r.category] = (cats[r.category] || 0) + Number(r.count || 0));
    const items = Object.entries(cats).sort((a,b)=>b[1]-a[1]);
    els.categoryBreakdown.innerHTML = items.length ? items.map(([k,v]) => `<li>${k}<b>${v.toLocaleString('bn-BD')}</b></li>`).join('') : '<li>নিখোঁজ ব্যক্তি/শিশু <b>—</b></li><li>অপহরণ <b>—</b></li><li>হত্যা <b>—</b></li><li>দুর্ঘটনা <b>—</b></li><li>অন্যান্য <b>—</b></li>';
  }

  function renderComparison(rows) {
    const periods = ['2000–2010','2011–2020','2021–2025','2026'];
    els.comparisonBody.innerHTML = periods.map(p => {
      const rs = rows.filter(r=>r.period===p), total = rs.reduce((n,r)=>n+Number(r.count||0),0), cross = rs.filter(r=>r.crossChecked).length;
      const sources = [...new Set(rs.flatMap(r=>r.sourceIds||[]))].map(sourceName);
      return `<tr><td>${p}</td><td>${total ? total.toLocaleString('bn-BD') : '—'}</td><td>${cross ? cross.toLocaleString('bn-BD') : '—'}</td><td>${sources.length ? sources.join(', ') : 'Source required'}</td><td>${rs.length ? (rs.every(r=>r.verified) ? 'Verified' : 'Review') : 'Pending'}</td></tr>`;
    }).join('');
  }

  function renderRecords(rows) {
    els.recordCount.textContent = `${rows.length.toLocaleString('bn-BD')} রেকর্ড`;
    if (!rows.length) {
      els.recordsList.innerHTML = '<div class="empty"><b>এখনো কোনো রেকর্ড যোগ করা হয়নি</b><p>data.js → records-এ আপনার যাচাই করা ডেটা যোগ করুন।</p></div>';
      return;
    }
    els.recordsList.innerHTML = rows.map(r => {
      const badges = (r.sourceIds||[]).map(id => `<span class="badge ${sourceMap[id]?.type||''}">${sourceTypeLabel(id)} · ${sourceName(id)}</span>`).join('');
      return `<article class="record"><div><small>${r.year} · ${r.area}</small><h3>${r.category}</h3><p>${r.note || '—'}</p></div><div class="record-right"><strong>${Number(r.count||0).toLocaleString('bn-BD')}</strong><span>${r.verified ? '✓ Verified' : 'Review'}</span><div>${badges}</div>${r.reference ? `<small>রেফারেন্স: ${r.reference}</small>` : ''}</div></article>`;
    }).join('');
  }

  function renderSources() {
    els.sourceGrid.innerHTML = db.sources.map(s => `<article class="source-card"><em>${s.type === 'primary' ? 'PRIMARY SOURCE' : 'NEWS / SECONDARY SOURCE'}</em><h3>${s.name}</h3><p>${s.title}</p><p>${s.authority}</p><p>Status: ${s.status}</p><a href="${s.url}" target="_blank" rel="noopener">মূল উৎস দেখুন ↗</a></article>`).join('');
  }

  function render() {
    const rows = filtered();
    renderKpis(rows); renderTrend(rows); renderCategories(rows); renderComparison(rows); renderRecords(rows); renderSources();
  }

  [els.period, els.category, els.area].forEach(x => x.addEventListener('change', render));
  $('resetBtn').addEventListener('click', () => { els.period.value='all'; els.category.value='all'; els.area.value='all'; render(); });
  render();
})();
