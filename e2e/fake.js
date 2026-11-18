// 🧪 เซิร์ฟเวอร์ปลอม (ข้อมูลสมมติล้วน) สำหรับเทสต์แอปด้วย Playwright
const APPV = require('fs').readFileSync(__dirname + '/../index.html', 'utf8').match(/const APP_VER = '([^']+)'/)[1];
function fresh() {
  return {
    tasks: [
      { no: 1, id: 'r1', task: 'สมชาย ล้างแผล', rest: 'ล้างแผล', name: 'สมชาย', ward: 'ฉก 7 ต', by: 'Tester', done: false, urgent: false },
      { no: 2, id: 'r2', task: 'มานี CBC', rest: 'CBC', name: 'มานี', ward: '72/8 ออก', by: 'Other', done: false, urgent: true },
      { no: 3, id: 'r3', task: 'สมหญิง เช็ก VAC', rest: 'เช็ก VAC', name: 'สมหญิง', ward: 'ฉก 7 ต', by: 'Tester', done: true, doneBy: 'Tester', doneAt: '09:00', result: 'ok' }
    ],
    pts: [
      { row: 2, rid: 'rt1', ward: 'ฉก 7 ต', bld: 'ตึกเฉลิมพระเกียรติ', name: 'สมชาย', hn: '11111111', staff: 'PM', dx: 'NF Lt foot', proc: '', team: 'Amy, R1', tags: ['Amy', 'R1'], remark: '', inactive: false, isNew: false, ww: 'Dw OD', plan: '' },
      { row: 3, rid: 'rt2', ward: 'ฉก 7 ต', bld: 'ตึกเฉลิมพระเกียรติ', name: 'สมหญิง', hn: '22222222', staff: 'KK', dx: 'Burn hand', proc: '', team: 'Ping', tags: ['Ping'], remark: '', inactive: false, isNew: false, ww: 'Check VAC', plan: '' },
      { row: 4, rid: 'rt3', ward: '72/8 ออก', bld: 'ตึก 72 ปี', name: 'มานี', hn: '33333333', staff: 'SC2', dx: 'Crouzon', proc: '', team: '', tags: ['ว่าง'], remark: '', inactive: false, isNew: false, ww: 'ดู pin', plan: '' }
    ]
  };
}
function handler(S) {
  return async route => {
    const req = route.request(), u = new URL(req.url()), q = Object.fromEntries(u.searchParams);
    let body = {}; if (req.method() === 'POST') try { body = JSON.parse(req.postData() || '{}'); } catch (e) {}
    const api = q.api || body.app, data = () => ({ day: 'วันนี้', off: +(q.off || 0), now: Date.now(), me: 'Tester', canEdit: true, admin: false, ver: APPV, notices: [], tasks: S.tasks });
    let r;
    if (api === 'data') r = data();
    else if (api === 'round') r = { pts: S.pts, wards: ['ฉก 7 ต', '72/8 ออก'], canEdit: true, admin: false, ver: APPV, tdOk: true };
    else if (api === 'admits') r = { rows: [] };
    else if (api === 'fights') r = { rows: [] };
    else if (api === 'run') {
      const t = String(q.text || q.t2 || q.cmd || '');
      let m;
      if ((m = t.match(/^ww\s+เสร็จ\s+(\d+)\s*(.*)$/))) { const x = S.tasks.find(k => k.no === +m[1]); if (x) Object.assign(x, { done: true, doneBy: 'Tester', doneAt: '10:00', result: m[2] || '' }); r = { msg: '✅ เสร็จ ' + m[1], data: data() }; }
      else if ((m = t.match(/^ww\s+(\S+)\s+(.+)$/))) { const no = S.tasks.length + 1; S.tasks.push({ no, id: 'r' + no, task: m[1] + ' ' + m[2], rest: m[2], name: m[1], ward: 'ทั่วไป', by: 'Tester', done: false }); r = { msg: '➕ ' + no + '. ' + m[2], data: data() }; }
      else r = { msg: '(fake) ' + t, data: data() };
      S.log.push(t);
    } else r = { ok: true, msg: '' };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(r) });
  };
}
module.exports = { fresh, handler, APPV };
