const { chromium } = require('playwright'), path = require('path'), { fresh, handler } = require('./fake'), axe = require('axe-core');
(async () => { const b = await chromium.launch();
for (const scheme of ['light', 'dark']) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, colorScheme: scheme }); await ctx.addInitScript(() => { try { localStorage.setItem('ww_greet', String(Date.now())); } catch (e) {} });
  const S = Object.assign(fresh(), { log: [] }); await ctx.route(/script\.google\.com/, handler(S)); const p = await ctx.newPage();
  await p.goto('file://' + path.resolve(__dirname, '../index.html') + '?t=FAKE'); await p.waitForTimeout(1500);
  for (const tab of ['#tabT', '#tabR']) { await p.click(tab); await p.waitForTimeout(800); await p.addScriptTag({ content: axe.source });
    const v = await p.evaluate(async () => (await axe.run(document, { runOnly: ['color-contrast', 'target-size', 'button-name', 'label', 'image-alt'] })).violations.map(v => `[${v.impact}] ${v.id} ×${v.nodes.length}: ` + v.nodes.slice(0, 4).map(n => n.target.join(' ') + ' (' + ((n.any[0] || n.all[0] || {}).message || '').slice(0, 90) + ')').join(' ; ')));
    console.log(scheme, tab, '\n  ' + (v.join('\n  ') || 'ok')); }
  await ctx.close(); }
await b.close(); })();
