// 四站共享语言切换：EN⇄中文（字典 zh-dict.js）；localStorage hy-lang 记忆；动态渲染自动补翻
(function () {
  var KEY = 'hy-lang';
  var btn = document.createElement('button');
  btn.id = 'langbtn';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Switch language / 切换语言');
  btn.textContent = '中';
  btn.addEventListener('click', function () {
    var cur = document.documentElement.dataset.lang || 'en';
    set(cur === 'en' ? 'zh' : 'en');
  });
  function style() {
    var st = document.getElementById('langbtn-style');
    if (st) return;
    st = document.createElement('style');
    st.id = 'langbtn-style';
    st.textContent = '#langbtn{position:fixed;right:10px;bottom:10px;z-index:120;font:600 13px/1 system-ui,sans-serif;padding:7px 11px;cursor:pointer;border:1px solid rgba(127,127,127,.45);background:rgba(255,255,255,.92);color:#111;border-radius:3px}#langbtn:hover{background:#111;color:#fff}@media print{#langbtn{display:none}}';
    document.head.appendChild(st);
  }
  // 反向字典（中→英 还原）；值冲突时保留首个
  var REV = {};
  (function () {
    var d = window.ZH_DICT || {};
    Object.keys(d).forEach(function (k) { if (REV[d[k]] === undefined) REV[d[k]] = k; });
  })();

  // 带变量的句型（中英双向）
  var PATTERNS = [
    [/^Add (HY[0-9A-Z-]+|LCD-WIRING-SYSTEM) to RFQ list$/, '将 $1 加入询价清单'],
    [/^Cross-reference to ([0-9A-Z-]+( \([A-Za-z]+\))?)$/, '对应其它型号 $1'],
    [/^Request sample \/ datasheet$/, '申请样品 / 规格书'],
    [/^Request a sample$/, '申请样品'],
  ];
  var PATTERNS_R = [
    [/^将 (HY[0-9A-Z-]+|LCD-WIRING-SYSTEM) 加入询价清单$/, 'Add $1 to RFQ list'],
    [/^对应其它型号 ([0-9A-Z-]+( \([A-Za-z]+\))?)$/, 'Cross-reference to $1'],
  ];
  function swapText(node, d, zh) {
    var v = node.nodeValue.trim();
    if (!v) return;
    var norm = v.replace(/\s+/g, ' '); // 源码换行不阻碍整句匹配
    var t = d[norm];
    if (t !== undefined) { node.nodeValue = t; return; }
    var ps = zh ? PATTERNS : PATTERNS_R;
    for (var i = 0; i < ps.length; i++) {
      if (ps[i][0].test(norm)) { node.nodeValue = norm.replace(ps[i][0], ps[i][1]); return; }
    }
  }
  function apply() {
    var zh = (document.documentElement.dataset.lang || 'en') === 'zh';
    var d = zh ? (window.ZH_DICT || {}) : REV;
    document.documentElement.lang = zh ? 'zh-CN' : 'en';
    btn.textContent = zh ? 'EN' : '中';
    // 文本节点（双向：zh=替换为中文；en=还原英文）
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    var list = [], n;
    while ((n = w.nextNode())) if (n.nodeValue.trim()) list.push(n);
    list.forEach(function (t) { swapText(t, d, zh); });
    // placeholder / aria-label / title
    document.querySelectorAll('[placeholder],[title],[aria-label]').forEach(function (el) {
      ['placeholder', 'title', 'aria-label'].forEach(function (a) {
        var v = el.getAttribute(a);
        if (v && d[v]) el.setAttribute(a, d[v]);
      });
    });
    // 页面标题（双向）
    if (window.ZH_TITLES && document.title) {
      var tt = zh ? window.ZH_TITLES : window.ZH_TITLES.map(function (p) { return [p[1], p[0]]; });
      tt.forEach(function (p) {
        if (document.title.indexOf(p[0]) >= 0) { document.title = document.title.split(p[0])[0] + p[1]; }
      });
    }
  }
  function set(lang) {
    document.documentElement.dataset.lang = lang;
    try { localStorage.setItem(KEY, lang); } catch (e) {}
    apply();
  }
  function init() {
    style();
    document.body.appendChild(btn);
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    document.documentElement.dataset.lang = saved || 'en';
    apply();
    // 动态渲染（购物车表格/检索结果等）自动补翻
    if (window.MutationObserver) {
      var mo = new MutationObserver(function (muts) {
        if ((document.documentElement.dataset.lang || 'en') !== 'zh') return;
        var d = window.ZH_DICT || {};
        muts.forEach(function (m) {
          m.addedNodes.forEach(function (nd) {
            if (nd.nodeType !== 1) return;
            if (nd.id === 'langbtn') return;
            var w2 = document.createTreeWalker(nd, NodeFilter.SHOW_TEXT, null);
            var t2;
            while ((t2 = w2.nextNode())) swapText(t2, d, true);
          });
        });
      });
      mo.observe(document.body, { childList: true, subtree: true });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
