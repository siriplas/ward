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
  // 📄 ใบ consult 2 รูป (รูปสมมติ) → การ์ดตรวจ มีรูปตัด + ward + ช่อง อ.
  { const png = Buffer.from(await p.evaluate(() => { const c = document.createElement('canvas'); c.width = 600; c.height = 800; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 600, 800); x.fillStyle = '#000'; x.font = '28px sans-serif'; x.fillText('ปัญหาของผู้ป่วย: แผลกดทับ (สมมติ)', 30, 260); return c.toDataURL('image/png').split(',')[1]; }), 'base64');
    await p.locator('input[onchange^="consultPick"]').setInputFiles([{ name: 'a.png', mimeType: 'image/png', buffer: png }, { name: 'b.png', mimeType: 'image/png', buffer: png }]);
    await p.waitForTimeout(2500); const n = await p.locator('.adr').count();
    ok('consult: 2 ใบ = 2 การ์ด', n === 2, n);
    ok('consult: มีรูปตัด + ward + ช่อง อ.', await p.locator('.adr img').count() === 2 && await p.locator('.adr input[placeholder^="ward"]').first().inputValue() === 'ICU สยามินทร์' && await p.locator('.adr input[placeholder="อ."]').count() === 2, '');
    await p.locator('.adr input[placeholder="อ."]').first().fill('AB');
    await p.screenshot({ path: '/tmp/claude-0/consult_mock.png' });
    await tap('.adbar .b.p'); await p.waitForTimeout(800);
    ok('consult: พักไว้ (hold) ส่ง ward + อ. ไม่ส่งรูป', S.saved && S.saved[0].ward === 'ICU สยามินทร์' && S.saved[0].staff === 'AB' && S.saved[0].hold === true && !S.saved[0].crop, JSON.stringify(S.saved || '').slice(0, 200)); }
  { await tap('#tabR'); await p.waitForTimeout(800); await tap('#tabA'); await p.waitForTimeout(800); const c = p.locator('.adc', { hasText: 'รอ อ.' }); ok('consult: รายการขึ้น "รอ อ."', await c.count() >= 1, await txt());
    await c.first().click(); await p.waitForTimeout(300); await p.screenshot({ path: '/tmp/claude-0/consult_edit.png' });
    await tap('text=บันทึก + เข้าตาราง'); await p.waitForTimeout(600);
    ok('consult: กดเข้าตาราง ส่ง push', S.edit && S.edit.push === true && S.edit.vals.ward === 'ICU สยามินทร์', JSON.stringify(S.edit || '').slice(0, 200)); }
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
