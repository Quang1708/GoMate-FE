const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { pathToFileURL } = require('node:url');
const { once } = require('node:events');
const { chromium } = require('playwright');
const { existsSync, mkdtempSync } = require('node:fs');
const { resolve, join } = require('node:path');
const { tmpdir } = require('node:os');
const beRoot = resolve(__dirname, '../../GoMate-BE'), beRequire = createRequire(beRoot + '/package.json');
const be = name => import(pathToFileURL(beRoot + '/src/' + name + '.js').href);

(async () => {
  const { MongoMemoryServer } = beRequire('mongodb-memory-server');
  const [{ createApp }, { readConfig }, { createClient, initializeDatabase }, { createAuthRepository }, { createActivityRepository }, { createChatRepository }, { seedWorkshopDemo }] = await Promise.all(['app', 'config/env', 'database/mongo', 'modules/auth/repository', 'modules/activities/repository', 'modules/chat/repository', 'database/workshop-demo'].map(be));
  const artifacts = mkdtempSync(join(tmpdir(), 'gomate-business-demo-')); console.log('Business demo artifacts:', artifacts);
  const mongo = await MongoMemoryServer.create(), client = createClient(readConfig({ MONGODB_URI: mongo.getUri('business_demo_ui') }));
  await client.connect(); const db = client.db(); await initializeDatabase(db); await seedWorkshopDemo(db);
  const auth = createAuthRepository(db), activities = createActivityRepository(db), chat = createChatRepository(db);
  const server = createApp(readConfig({}), { authRepository: auth, activityRepository: activities, chatRepository: chat }).listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`, errors = [];
  let browser, business, staff, member;
  try {
    browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || (existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe') ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined), headless: true });
    business = await browser.newPage({ viewport: { width: 1440, height: 1000 } }); staff = await browser.newPage({ viewport: { width: 1440, height: 1000 } }); member = await browser.newPage({ viewport: { width: 390, height: 900 } });
    for (const page of [business, staff, member]) { page.setDefaultTimeout(15000); page.on('pageerror', error => errors.push(error.message)); }

    const staffUser = await db.collection('users').findOne({email:'demo.staff@gomate.local'});
    const applicant = await db.collection('users').findOne({email:'demo.newbusiness@gomate.local'});
    const businessUser = await db.collection('users').findOne({email:'demo.business@gomate.local'});
    const app = await auth.portal.apply(applicant.id, {company:'Staff browser verification',category:'Workshop',website:'',document:{name:'proof.pdf',mime:'application/pdf',base64:Buffer.from('%PDF-1.4 test').toString('base64')}});
    const ticket = await auth.portal.createTicket(businessUser.id,'Staff browser support','Please help');
    const pendingPost = await auth.portal.createPost(businessUser.id, {
      title: 'Staff browser event', copy: 'Review the actual event details', premium: false, border: 'Solid',
      offer: 'A real offer', offerTerms: 'One per participant', discountPercent: 10,
      event: { title: 'Staff browser event', description: 'Review the actual event details', category: 'Workshop', location: 'Staff test venue', startsAt: new Date(Date.now()+3*86400000), endsAt: new Date(Date.now()+3*86400000+3600000), estimatedCost: 25000, maxParticipants: 8, plan: ['Staff test itinerary'] },
    });
    const report = await auth.community.report(applicant.id,{activityId:(await db.collection('activities').findOne({hostId:businessUser.id})).id,reason:'spam',detail:'Staff browser report'});
    await staff.goto(base+'/staff');
    await staff.locator('input[type=email]').fill(staffUser.email);
    await staff.locator('input[type=password]').fill('DemoGoMate123!');
    await staff.locator('button[type=submit]').click();
    await staff.locator('.staff-queue-grid[aria-busy=false]').waitFor();
    const metrics=await auth.portal.metrics('staff',staffUser.id);
    const counts=await staff.locator('.staff-queue-count').allTextContents();
    assert.deepEqual(counts,[metrics.pendingBusinesses,metrics.pendingPosts,metrics.openReports,metrics.openTickets,metrics.approvedPosts].map(String));
    assert.equal(counts[4],'1');
    await staff.locator('.staff-queue-card').first().click();
    const card=staff.locator('article').filter({hasText:app.company});
    await card.locator('.gm-btn--approve').click();
    await card.locator('.gm-decision-card').waitFor({state:'detached'});
    assert.equal((await db.collection('business_applications').findOne({id:app.id})).status,'approved');
    await staff.locator('.staff-sidebar nav button').nth(2).click();
    const postCard = staff.locator('article').filter({hasText:pendingPost.title});
    await postCard.getByText('Staff test itinerary', {exact:true}).waitFor();
    await postCard.getByText('Điều kiện áp dụng: One per participant', {exact:true}).waitFor();
    await postCard.locator('.gm-btn--approve').click();
    await postCard.locator('.gm-decision-card').waitFor({state:'detached'});
    assert.equal((await db.collection('business_posts').findOne({id:pendingPost.id})).status,'approved');
    assert.ok(await db.collection('activities').findOne({id:pendingPost.activityId}));
    await staff.locator('.staff-sidebar nav button').nth(5).click();
    await staff.getByRole('heading', {name:pendingPost.title,exact:true}).waitFor();
    await staff.locator('.staff-sidebar nav button').nth(4).click();
    const support=staff.locator('article').filter({hasText:ticket.subject});
    await support.locator('input').fill('Resolved by staff API');
    await support.locator('select').selectOption('closed');
    await support.locator('button[type=submit]').click();
    await support.getByText('Resolved by staff API',{exact:true}).waitFor();
    await staff.reload();
    await staff.locator('.staff-sidebar nav button').nth(4).click();
    await support.getByText('Resolved by staff API',{exact:true}).waitFor();
    assert.equal(await support.locator('select').inputValue(),'closed');
    await staff.locator('.staff-sidebar nav button').nth(3).click();
    const reported=staff.locator('article').filter({hasText:'Staff browser report'});
    await reported.locator('.gm-btn--approve').click();
    await reported.locator('.gm-decision-card').waitFor({state:'detached'});
    assert.equal((await db.collection('reports').findOne({id:report.id})).status,'resolved');
    await staff.locator('.staff-sidebar nav button').first().click();
    await staff.locator('.staff-queue-grid[aria-busy=false]').waitFor();
    assert.deepEqual(await staff.locator('.staff-queue-count').allTextContents(),['0','0','0','0','2']);
    await staff.route('**/api/portal/metrics',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Metrics unavailable'})}));
    await staff.locator('.staff-section-heading button').click();
    await staff.getByRole('alert').waitFor();
    assert.ok((await staff.locator('.staff-queue-count').allTextContents()).every(x=>x==='\u2014'));
    await staff.unroute('**/api/portal/metrics');
    await staff.locator('.staff-section-heading button').click();
    await staff.locator('.staff-queue-grid[aria-busy=false]').waitFor();
    await staff.screenshot({path:join(artifacts,'staff-dashboard.png'),fullPage:true});
    await staff.setViewportSize({width:390,height:844});
    assert.ok(await staff.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    assert.deepEqual(errors,[]);
    console.log('PASS staff metrics, application approval, persistent support replies/status, report resolution, failed metrics and retry, responsive layout');
  } finally { await browser?.close(); await new Promise(resolve=>server.close(resolve)); await client.close(); await mongo.stop(); }
})().catch(error=>{console.error(error);process.exitCode=1});
