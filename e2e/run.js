// 🧪 เทสต์ขั้นตอนหลักของแอป (ข้อมูลสมมติ · ไม่แตะเซิร์ฟเวอร์จริง)  ใช้: node e2e/run.js [--axe]
const { chromium } = require('playwright'), path = require('path'), { fresh, handler } = require('./fake');
const URL0 = 'file://' + path.resolve(__dirname, '../index.html') + '?t=FAKE';
const out = []; const ok = (n, c, got) => { out.push((c ? '✅ ' : '❌ ') + n + (c ? '' : '  ⟶ ' + String(got).slice(0, 200))); };
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  await ctx.addInitScript(() => { try { localStorage.setItem('ww_greet', String(Date.now())); } catch (e) {} });
  const S = Object.assign(fresh(), { log: [] }); await ctx.route(/script\.google\.com/, handler(S));
  const p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(URL0); await p.waitForTimeout(1500);
  const txt = () => p.locator('#main').innerText();
  const tap = async (sel, o) => { try { await p.locator(sel).first().click(Object.assign({ timeout: 4000 }, o || {})); return true; } catch (e) { ok('กด ' + sel, false, 'กดไม่ได้'); return false; } };
  let t = await txt();
  ok('เปิดแอป: เห็นงานค้าง', /ล้างแผล/.test(t) && /CBC/.test(t), t);
  ok('งานด่วนมีป้าย', await p.locator('.urg').count() > 0, '');
  // ปิดงานด้วยวงกลม → รอ 5 วิ → ส่งคำสั่ง
  await tap('#task1 .box'); await p.waitForTimeout(6500);
  ok('ปิดงาน: ส่ง ww เสร็จ 1', S.log.some(x => /เสร็จ 1\b/.test(x)), JSON.stringify(S.log));
  ok('ปิดงาน: ขึ้นเป็นเสร็จ', await p.locator('#task1.done').count() === 1, await txt());
  // แตะงาน → แผงผล → บันทึกผล
  await tap('#task2 .row'); await p.waitForTimeout(300);
  ok('แตะงาน: แผงผลเปิด', await p.locator('#res2').count() === 1, '');
  await tap('#psheet', { position: { x: 10, y: 10 } }); await p.waitForTimeout(300);
  ok('ปิดแผงได้', !(await p.locator('#psheet').isVisible()), '');
  // แท็บราวด์
  await tap('#tabR'); await p.waitForTimeout(800); t = await txt();
  ok('ราวด์: เห็นคนไข้ 3 คน', /สมชาย/.test(t) && /สมหญิง/.test(t) && /มานี/.test(t), t);
  ok('ราวด์: เห็น HN', /11111111/.test(t), '');
  // แท็บรับใหม่ (ไม่พัง)
  await tap('#tabA'); await p.waitForTimeout(500);
  ok('รับใหม่: เปิดได้', (await txt()).length > 10, '');
  ok('รับใหม่: ปุ่ม 📄 ประวัติ เฉพาะคนที่มี HN', await p.locator('.admh').count() === 1, await p.locator('.admh').count());
  // แท็บเครื่องมือ
  await tap('#tabM'); await p.waitForTimeout(1200);
  const f = p.frameLocator('#toolsv iframe');
  ok('📐: เครื่องมือขึ้น', await f.locator('text=Cap refill').count() > 0, '');
  await tap('#tabT'); await p.waitForTimeout(500);
  ok('กลับแท็บงาน', /ล้างแผล/.test(await txt()), '');
  ok('ไม่มี error ในหน้า', !errs.length, errs.join(' | '));
  if (process.argv.includes('--axe')) {
    const axe = require('axe-core'); const res = {};
    for (const tab of ['งาน', 'ราวด์']) {
      await p.locator(tab === 'งาน' ? '#tabT' : '#tabR').click(); await p.waitForTimeout(800);
      await p.addScriptTag({ content: axe.source });
      res[tab] = await p.evaluate(async () => (await axe.run(document, { resultTypes: ['violations'] })).violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, n: v.nodes.length, ex: v.nodes.slice(0, 3).map(x => x.target.join(' ') + ' :: ' + (x.failureSummary || '').split('\n').slice(1, 2).join(' ')) })));
    }
    require('fs').writeFileSync(path.resolve(__dirname, 'axe-report.json'), JSON.stringify(res, null, 1));
    for (const k in res) { console.log('— axe: ' + k); res[k].forEach(v => console.log(`  [${v.impact}] ${v.id} ×${v.n} · ${v.help}\n     ${v.ex.join('\n     ')}`)); }
  }
  await b.close();
  const pass = out.filter(x => x[0] === '✅').length; console.log(`PASS ${pass}/${out.length}\n` + out.join('\n')); process.exit(pass === out.length ? 0 : 1);
})();
