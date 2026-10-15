const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { pathToFileURL } = require('node:url');
const { once } = require('node:events');
const { chromium } = require('playwright');
const { existsSync, mkdtempSync, readFileSync } = require('node:fs');
const { resolve, join } = require('node:path');
const { tmpdir } = require('node:os');
const artifacts = mkdtempSync(join(tmpdir(), 'gomate-trip-ui-'));
console.log('Trip UI artifacts:', artifacts);
const beRoot = resolve(__dirname, '../../GoMate-BE'), beRequire = createRequire(beRoot + '/package.json');
const be = name => import(pathToFileURL(beRoot + '/src/' + name + '.js').href);
(async () => {
  const { MongoMemoryServer } = beRequire('mongodb-memory-server');
  const [{ createApp }, { readConfig }, { createClient, initializeDatabase }, { createAuthRepository }, { createActivityRepository }, { createChatRepository }, { hashPassword }] = await Promise.all(['app','config/env','database/mongo','modules/auth/repository','modules/activities/repository','modules/chat/repository','modules/auth/password'].map(be));
  const mongo = await MongoMemoryServer.create(), client = createClient(readConfig({ MONGODB_URI: mongo.getUri('trip_browser') }));
  await client.connect(); const db = client.db(); await initializeDatabase(db);
  const authRepository = createAuthRepository(db), activityRepository = createActivityRepository(db), chatRepository = createChatRepository(db);
  const passwordHash = await hashPassword('123456'), people = [];
  for (const [index, name] of ['Travel Host','Travel Friend One','Travel Friend Two','Travel Guest'].entries()) {
    const person = await authRepository.createUser({ name, email: 'travel'+index+'@example.com', passwordHash });
    await db.collection('users').updateOne({ id: person.id }, { $set: { email_verified: true, username: ['travelhost','travelfriendone','travelfriendtwo','travelguest'][index], birthDate: '2000-01-01', gender: 'undisclosed', location: 'Hà Nội', bio: 'Travel together', interests: ['Du lịch'], languages: ['Tiếng Việt'] } });
    people.push(person);
  }
  const request = await authRepository.friendRequest(people[0].id, people[2].id); await authRepository.decideFriend(people[2].id, request.id, 'accepted');
  const images = { async upload(buffer) { return { publicId: 'trip-photo', url: 'data:image/webp;base64,'+buffer.toString('base64') }; }, async remove() {} };
  const server = createApp(readConfig({}), { authRepository, activityRepository, chatRepository, avatarStorage: images, coverStorage: images }).listen(0, '127.0.0.1');
  await once(server,'listening'); const base = 'http://127.0.0.1:'+server.address().port;
  const chrome = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || (existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe') ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined);
  let browser, page, friend;
  const errors = [];
  try {
    browser = await chromium.launch({ executablePath: chrome, headless: true });
    page = await browser.newPage({ viewport: { width: 390, height: 900 } }); friend = await browser.newPage({ viewport: { width: 390, height: 900 } });
    for (const p of [page,friend]) { p.setDefaultTimeout(20000); p.on('pageerror', error=>errors.push(error.message)); }
    const click = (p,text) => p.getByText(text,{exact:true}).last().click();
    const visible = (p,text) => p.getByText(text,{exact:true}).first().waitFor({state:'visible'});
    const login = async (p,index) => { await p.goto(base+'/#/auth/login'); await p.getByLabel('Email',{exact:true}).fill('travel'+index+'@example.com'); await p.getByLabel('Mật khẩu',{exact:true}).fill('123456'); await click(p,'Đăng nhập'); await p.getByText(people[index].name,{exact:false}).first().waitFor({state:'visible'}); };
    await login(page,0); await login(friend,1);
    await page.goto(base+'/#/app/messages/friends');
    await page.getByLabel('Tìm bạn bằng tên hoặc Nickname',{exact:true}).fill('travelfriendone'); await click(page,'Tìm bạn');
    await page.getByLabel('Kết bạn với Travel Friend One',{exact:true}).click(); await visible(page,'Đã gửi lời mời');
    await friend.goto(base+'/#/app/messages/friends');
    await friend.getByLabel('Chấp nhận Travel Host',{exact:true}).click();
    await visible(friend,'Bạn bè (1)'); console.log('PASS friend request and recipient acceptance through UI');

    await page.goto(base+'/#/app/create');
    assert.equal(await page.getByText('Doanh nghiệp',{exact:true}).count(),0);
    await click(page,'Tiếp tục');
    const errorBox=await page.getByRole('alert').boundingBox(), nextBox=await page.getByText('Tiếp tục',{exact:true}).last().boundingBox();
    assert.ok(errorBox && nextBox && errorBox.y + errorBox.height <= nextBox.y + 10 && nextBox.y - errorBox.y < 160);
    await page.getByLabel('Danh mục',{exact:true}).click(); await page.getByLabel('Tìm danh mục',{exact:true}).fill('cau long'); await page.getByLabel('Danh mục: Cầu lông',{exact:true}).click(); await click(page,'Xong');
    await page.getByLabel('Tên hoạt động',{exact:true}).fill('Travel UI Trip'); await page.getByLabel('Mô tả',{exact:true}).fill('Trip created through the real editor');
    const png = await beRequire('sharp')({create:{width:32,height:32,channels:3,background:'#8877cc'}}).png().toBuffer();
    const photo = page.waitForEvent('filechooser'); await click(page,'Thêm ảnh'); await (await photo).setFiles([{name:'trip.png',mimeType:'image/png',buffer:png}]);
    await page.getByLabel('Xóa ảnh',{exact:true}).waitFor({state:'visible'}); await click(page,'Tiếp tục');
    assert.match(await page.getByLabel('Tỉnh / thành phố',{exact:true}).innerText(),/Hà Nội/);
    const localNow = new Date(Date.now()+7*3600000), start = new Date(localNow.getTime()+2*86400000).toISOString().slice(0,10), end = new Date(localNow.getTime()+3*86400000).toISOString().slice(0,10);
    const display = iso=>iso.slice(8,10)+'/'+iso.slice(5,7)+'/'+iso.slice(0,4);
    await page.getByLabel('Ngày bắt đầu và kết thúc',{exact:true}).click();
    const month = async iso => { await page.getByLabel('Chọn tháng và năm',{exact:true}).click(); await page.getByLabel('Tháng: '+iso.slice(5,7),{exact:true}).click(); await page.getByLabel('Năm: '+iso.slice(0,4),{exact:true}).click(); await click(page,'Xem lịch'); };
    await month(start); await page.getByRole('button',{name:display(start),exact:true}).click(); if (start.slice(0,7)!==end.slice(0,7)) await month(end);
    await page.getByRole('button',{name:display(end),exact:true}).click(); await click(page,'Dùng khoảng ngày');
    const time = async (label,hour,minute) => { await page.getByLabel(label,{exact:true}).click(); await page.getByLabel('Giờ: '+hour,{exact:true}).click(); await page.getByLabel('Phút: '+minute,{exact:true}).click(); await click(page,'Dùng giờ này'); };
    await time('Bắt đầu','10','15'); await time('Kết thúc','17','45'); await click(page,'Trước 12 tiếng');
    const select = async (label,option,{query,multiple=false}={}) => {
      await page.getByLabel(label,{exact:true}).click();
      if (query) await page.getByLabel('Tìm '+label.toLowerCase(),{exact:true}).fill(query);
      await page.getByLabel(label+': '+option,{exact:true}).click();
      if (multiple) await click(page,'Thêm '+option);
      await click(page,'Xong');
    };
    await select('Quận / khu vực (tùy chọn)','Quận Ba Đình',{query:'Ba Đình'});
    const regions = JSON.parse(readFileSync(resolve(__dirname,'../src/data/regions.json'),'utf8'));
    const ward = regions.find(region=>region.name.includes('Hà Nội')).wards[0];
    await select('Phường / xã (tùy chọn)',ward,{query:ward});
    await page.getByLabel('Địa chỉ',{exact:true}).fill('12 Test Road');
    await page.screenshot({path:join(artifacts,'calendar-location-390.png'),fullPage:true});
    await click(page,'Tiếp tục');
    assert.equal(await page.getByLabel('Yêu cầu tham gia',{exact:true}).count(),0);
    await page.getByLabel('Tối thiểu',{exact:true}).fill('3'); await page.getByLabel('Tối đa',{exact:true}).fill('6'); await page.getByLabel('Bạn đi cùng chưa dùng GoMate',{exact:true}).fill('2');
    await select('Thêm bạn bè GoMate có sẵn','Travel Friend One · @travelfriendone',{query:'travelfriendone',multiple:true});
    await page.getByLabel('Tùy chọn nâng cao',{exact:true}).click(); await select('Tuổi từ','18 tuổi'); await select('Đến tuổi','65 tuổi'); await select('Ngôn ngữ của nhóm','Tiếng Việt',{multiple:true});
    await page.getByLabel('Chi phí dự kiến / người (không bắt buộc)',{exact:true}).fill('250000');
    await page.getByLabel('Chi phí bao gồm / cách chia',{exact:true}).fill('Gồm xe; ăn uống tự túc');
    await click(page,'Tạo gợi ý 3 mốc'); await page.getByLabel('Sửa mốc 2',{exact:true}).click(); await page.getByLabel('Nội dung mốc 2',{exact:true}).fill('Check in bản địa');
    await page.getByLabel('Link Google Sheets / kế hoạch online',{exact:true}).fill('https://docs.google.com/spreadsheets/d/trip-example');
    const workbook = Buffer.concat([Buffer.from('d0cf11e0a1b11ae1','hex'),Buffer.from('Spreadsheet attachment')]);
    const file = page.waitForEvent('filechooser'); await click(page,'Đính kèm tệp Excel'); await (await file).setFiles([{name:'trip.xls',mimeType:'application/vnd.ms-excel',buffer:workbook}]); await visible(page,'trip.xls');
    await click(page,'Tiếp tục'); await visible(page,'Bài đăng hiển thị trên Match'); await visible(page,'Travel UI Trip'); await page.getByText('2. Check in bản địa',{exact:true}).waitFor({state:'visible'}); await visible(page,'4/6 thành viên');
    assert.equal(await page.getByLabel('Lưu hoạt động yêu thích',{exact:true}).count(),0);
    for (const width of [390,768,1440]) { await page.setViewportSize({width,height:900}); assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)); await page.screenshot({path:join(artifacts,'match-preview-'+width+'.png'),fullPage:true}); }
    const thumbnail = await page.getByLabel('Ảnh hoạt động 1',{exact:true}).boundingBox(); assert.ok(thumbnail.width > 50 && thumbnail.height >= 80);
    await click(page,'Đăng hoạt động'); await visible(page,'Cùng nhóm sẵn sàng lên đường');
    let activity = await db.collection('activities').findOne({title:'Travel UI Trip'});
    assert.equal(activity.category,'Cầu lông'); assert.equal(activity.organizerType,'personal'); assert.equal(new Date(activity.startsAt)-new Date(activity.registrationDeadline),12*3600000); assert.equal(activity.memberCount,4); assert.equal(activity.reservedSeats,2); assert.equal(activity.participantPreferences.minAge,18); assert.equal(activity.planFile.name,'trip.xls'); assert.equal(activity.itinerary.length,3);
    assert.equal(activity.province,'Hà Nội'); assert.equal(activity.ward,ward); assert.equal(activity.costNote,'Gồm xe; ăn uống tự túc');
    console.log('PASS one date-range calendar, time wheels, profile location, district/ward wheels, simple capacity, age, Excel and real Match preview');

    const guestLogin = await fetch(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'travel3@example.com',password:'123456'})});
    const guestSession=await guestLogin.json();
    assert.equal((await fetch(base+'/api/activities/'+activity.id+'/join-requests',{method:'POST',headers:{Authorization:'Bearer '+guestSession.accessToken,'Content-Type':'application/json'},body:'{}'})).status,201);
    await page.setViewportSize({width:390,height:900}); await page.reload(); await visible(page,'Travel Guest');
    await click(page,'Duyệt'); await visible(page,'Chưa có yêu cầu mới');
    activity=await db.collection('activities').findOne({id:activity.id}); assert.equal(activity.memberCount,5); assert.ok(activity.joinRequests.some(row=>row.userId===people[3].id && row.status==='approved'));
    await page.screenshot({path:join(artifacts,'manage-390.png'),fullPage:true});
    await click(page,'Mở chat nhóm');
    assert.equal(await page.getByRole('tab',{name:'Quản lý',exact:true}).count(),1);
    await page.getByRole('tab',{name:'Quản lý',exact:true}).click(); await click(page,'Chốt lịch đi'); await click(page,'Xác nhận'); await visible(page,'Đã chốt lịch · Thành viên có thể xem trong Kế hoạch');
    await page.getByRole('tab',{name:'Chat',exact:true}).click();
    await page.getByLabel('Tin nhắn',{exact:true}).fill('Lên kế hoạch thật trước chuyến đi'); await page.getByLabel('Gửi tin nhắn',{exact:true}).click(); await visible(page,'Lên kế hoạch thật trước chuyến đi'); await page.reload(); await visible(page,'Lên kế hoạch thật trước chuyến đi');
    await friend.goto(base+'/#/app/messages'); await click(friend,'Travel UI Trip'); assert.equal(await friend.getByRole('tab',{name:'Quản lý',exact:true}).count(),0); await visible(friend,'Lên kế hoạch thật trước chuyến đi');
    await friend.getByLabel('Tin nhắn',{exact:true}).fill('Mình đã sẵn sàng'); await friend.getByLabel('Gửi tin nhắn',{exact:true}).click(); await visible(page,'Mình đã sẵn sàng');
    await page.getByRole('tab',{name:'Thành viên',exact:true}).click(); await click(page,'Thêm bạn bè vào nhóm');
    await select('Chọn bạn bè thêm vào nhóm','Travel Friend Two · travelfriendtwo',{query:'travelfriendtwo',multiple:true}); await click(page,'Thêm vào nhóm và chat'); await visible(page,'Travel Friend Two');
    activity = await db.collection('activities').findOne({id:activity.id}); assert.equal(activity.memberCount,5); assert.equal(activity.reservedSeats,1);
    await page.getByRole('tab',{name:'Kế hoạch',exact:true}).click(); await click(page,'Chỉnh sửa kế hoạch chuyến đi');
    await page.getByLabel('Link Google Sheets / kế hoạch online',{exact:true}).fill('https://example.com/updated-trip'); await click(page,'Lưu kế hoạch'); await visible(page,'Chỉnh sửa kế hoạch chuyến đi');
    activity = await db.collection('activities').findOne({id:activity.id}); assert.equal(activity.planLink,'https://example.com/updated-trip');
    const download = page.waitForEvent('download'); await page.getByText('Excel: trip.xls ↓',{exact:true}).click(); assert.equal((await download).suggestedFilename(),'trip.xls');
    await friend.getByRole('tab',{name:'Kế hoạch',exact:true}).click(); await visible(friend,'Mở kế hoạch online ↗'); assert.equal(await friend.getByText('Chỉnh sửa kế hoạch chuyến đi',{exact:true}).count(),0);
    await page.getByRole('tab',{name:'Chat',exact:true}).click();
    await visible(page,'Mình đã sẵn sàng');
    for (const width of [390,768,1440]) { await page.setViewportSize({width,height:900}); assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)); await page.screenshot({path:join(artifacts,'group-chat-'+width+'.png'),fullPage:true}); }
    await page.setViewportSize({width:390,height:900});
    await page.goto(base+'/#/app/messages'); await page.getByLabel('Tìm kiếm cuộc trò chuyện',{exact:true}).fill('Travel UI Trip'); await visible(page,'Travel UI Trip');
    const inboxTitle=page.getByText('Travel UI Trip',{exact:true}).first();
    const inboxTitleBox=await inboxTitle.boundingBox(); assert.ok(inboxTitleBox.width>100 && inboxTitleBox.height>=18);
    await page.screenshot({path:join(artifacts,'inbox-390.png'),fullPage:true});
    await page.goto(base+'/#/app/messages/friends'); await page.getByLabel('Nhắn tin cho Travel Friend One',{exact:true}).click(); await page.getByLabel('Tin nhắn',{exact:true}).fill('Chào bạn từ chat riêng'); await page.getByLabel('Gửi tin nhắn',{exact:true}).click(); await visible(page,'Chào bạn từ chat riêng');
    await page.reload(); await visible(page,'Chào bạn từ chat riêng');
    console.log('PASS persistent early group chat, cross-user messages, adding a friend using reserved seats, host-only shared plan, Excel download and direct chat');
    assert.deepEqual(errors,[]); console.log('PASS no browser runtime errors');
  } catch (error) {
    for (const [name,p] of [['host',page],['friend',friend]]) if (p) { console.log('FAILED '+name,p.url(),(await p.locator('body').innerText()).slice(0,5000)); await p.screenshot({path:join(artifacts,'failure-'+name+'.png'),fullPage:true}).catch(()=>{}); }
    throw error;
  } finally { await browser?.close(); await new Promise(resolve=>server.close(resolve)); await client.close(); await mongo.stop(); }
})().catch(error=>{ console.error(error); process.exitCode=1; });
