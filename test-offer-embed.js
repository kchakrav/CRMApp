/**
 * ═══════════════════════════════════════════════════════════════════════
 *  FROM SCRATCH: Build an Offer and Use It in the Email Editor
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  This test walks through EVERY step from zero to a sent email with
 *  a personalized offer, exactly mirroring what you would do in the UI.
 *
 *  Steps:
 *    1.  Create a Placement        → defines WHERE offers appear
 *    2.  Create a Fallback Offer   → safety net when nothing qualifies
 *    3.  Create a Personalized Offer → the real offer
 *    4.  Add Representations       → content for each placement
 *    5.  Approve & Publish offers  → make them live
 *    6.  Create a Collection       → group offers together
 *    7.  Create a Selection Strategy → how to pick the best offer
 *    8.  Create a Decision         → ties placement + strategy + fallback
 *    9.  Activate the Decision     → make it live
 *   10.  Simulate resolution       → test with a contact
 *   11.  Create an Email Delivery  → with offer block in content
 *   12.  Preview with test profile → see resolved offer
 *   13.  Send the delivery         → offers resolved per-contact
 *   14.  Check propositions        → verify tracking
 *   15.  Check delivery report     → final metrics
 */

const http = require('http');
const BASE = 'http://localhost:3000';

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const opts = {
      hostname: url.hostname, port: url.port,
      path: url.pathname + url.search, method,
      headers: { 'Content-Type': 'application/json' }
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

let passed = 0, failed = 0;
function pass(msg) { passed++; console.log(`    ✓ ${msg}`); }
function fail(msg) { failed++; console.error(`    ✗ ${msg}`); process.exitCode = 1; }
function assert(cond, msg) { cond ? pass(msg) : fail(msg); }
function step(num, title) {
  console.log(`\n${'━'.repeat(70)}`);
  console.log(`  STEP ${num}: ${title}`);
  console.log(`${'━'.repeat(70)}`);
}

async function run() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║  FROM SCRATCH: Build an Offer → Use It in Email Editor → Send   ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');

  // Grab a test contact for later
  const { body: cData } = await request('GET', '/api/contacts?limit=10');
  const contacts = cData.contacts || cData || [];
  const testContact = contacts.find(c => c.status === 'active') || contacts[0];
  console.log(`\n  Using test contact: #${testContact.id} ${testContact.first_name} ${testContact.last_name} (${testContact.email})`);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  step(1, 'Create a Placement');
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //
  //  A Placement defines WHERE an offer appears.
  //  We create one for the email channel with HTML content type.
  //
  //  UI path: Offer Decisioning → Placements → + Create Placement
  //

  const { status: plStatus, body: placement } = await request('POST', '/api/placements', {
    name: 'Email Promo Banner',
    description: 'Hero banner in promotional emails',
    channel: 'email',
    content_type: 'html',
    max_items: 1
  });

  assert(plStatus === 201, `Placement created: #${placement.id} "${placement.name}"`);
  assert(placement.channel === 'email', `Channel: ${placement.channel}`);
  assert(placement.content_type === 'html', `Content type: ${placement.content_type}`);
  console.log(`\n    This placement tells the system: "there is a slot in our emails`);
  console.log(`    that can hold 1 HTML offer."`);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  step(2, 'Create a Fallback Offer');
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //
  //  A Fallback Offer is shown when no personalized offers qualify.
  //  Every decision should have one as a safety net.
  //
  //  UI path: Offer Decisioning → Offers → + Create Offer → type: Fallback
  //

  const { status: fbStatus, body: fallbackOffer } = await request('POST', '/api/offers', {
    name: 'Free Shipping on All Orders',
    description: 'Default fallback offer - always available',
    type: 'fallback',
    priority: 0,
    status: 'draft'
  });

  assert(fbStatus === 201, `Fallback offer created: #${fallbackOffer.id} "${fallbackOffer.name}"`);
  assert(fallbackOffer.type === 'fallback', `Type: ${fallbackOffer.type}`);
  console.log(`\n    Fallback offers are the safety net. If no personalized offer`);
  console.log(`    qualifies for a contact, this one is shown instead.`);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  step(3, 'Create Personalized Offers');
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //
  //  Personalized Offers are ranked and matched to contacts based on
  //  eligibility rules, priority, and selection strategy.
  //
  //  UI path: Offer Decisioning → Offers → + Create Offer → type: Personalized
  //

  const { status: o1Status, body: offer1 } = await request('POST', '/api/offers', {
    name: '25% Off Summer Collection',
    description: 'Seasonal discount for all customers',
    type: 'personalized',
    priority: 10,
    status: 'draft'
  });

  const { status: o2Status, body: offer2 } = await request('POST', '/api/offers', {
    name: 'Buy 2 Get 1 Free - Accessories',
    description: 'Bundle deal on accessories',
    type: 'personalized',
    priority: 5,
    status: 'draft'
  });

  assert(o1Status === 201, `Offer #1 created: #${offer1.id} "${offer1.name}" (priority ${offer1.priority})`);
  assert(o2Status === 201, `Offer #2 created: #${offer2.id} "${offer2.name}" (priority ${offer2.priority})`);
  console.log(`\n    We created two offers with different priorities.`);
  console.log(`    Priority 10 beats priority 5, so "${offer1.name}" will`);
  console.log(`    be selected first when both qualify.`);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  step(4, 'Add Representations (content per placement)');
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //
  //  A Representation is the actual CONTENT of an offer for a specific
  //  placement. The same offer can look different in email vs web vs mobile.
  //
  //  UI path: Offers → [offer] → Representations tab → + Add Representation
  //

  const repHtml1 = `<div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:32px;border-radius:12px;text-align:center;">
  <h2 style="color:#fff;margin:0 0 8px;">25% OFF</h2>
  <p style="color:#e0d4f5;margin:0 0 16px;">Summer Collection — Limited Time</p>
  <a href="https://example.com/summer-sale" style="display:inline-block;padding:12px 32px;background:#fff;color:#764ba2;border-radius:6px;text-decoration:none;font-weight:bold;">Shop Now</a>
</div>`;

  const repHtml2 = `<div style="background:#FFF3E0;padding:24px;border-radius:12px;text-align:center;border:2px solid #FF9800;">
  <h2 style="color:#E65100;margin:0 0 8px;">Buy 2, Get 1 FREE</h2>
  <p style="color:#BF360C;margin:0 0 16px;">Accessories collection</p>
  <a href="https://example.com/accessories" style="display:inline-block;padding:12px 32px;background:#FF9800;color:#fff;border-radius:6px;text-decoration:none;font-weight:bold;">Browse Accessories</a>
</div>`;

  const repHtmlFb = `<div style="background:#E8F5E9;padding:24px;border-radius:12px;text-align:center;border:2px solid #4CAF50;">
  <h2 style="color:#2E7D32;margin:0 0 8px;">FREE SHIPPING</h2>
  <p style="color:#1B5E20;margin:0 0 16px;">On all orders — no minimum</p>
  <a href="https://example.com/shop" style="display:inline-block;padding:12px 32px;background:#4CAF50;color:#fff;border-radius:6px;text-decoration:none;font-weight:bold;">Start Shopping</a>
</div>`;

  // Offer 1 representation
  const { status: r1s, body: rep1 } = await request('POST', `/api/offers/${offer1.id}/representations`, {
    placement_id: placement.id,
    content_type: 'html',
    content: repHtml1,
    link_url: 'https://example.com/summer-sale',
    alt_text: '25% Off Summer Collection'
  });

  // Offer 2 representation
  const { status: r2s, body: rep2 } = await request('POST', `/api/offers/${offer2.id}/representations`, {
    placement_id: placement.id,
    content_type: 'html',
    content: repHtml2,
    link_url: 'https://example.com/accessories',
    alt_text: 'Buy 2 Get 1 Free Accessories'
  });

  // Fallback representation
  const { status: rfs, body: repFb } = await request('POST', `/api/offers/${fallbackOffer.id}/representations`, {
    placement_id: placement.id,
    content_type: 'html',
    content: repHtmlFb,
    link_url: 'https://example.com/shop',
    alt_text: 'Free Shipping'
  });

  assert(r1s === 201, `Representation for "${offer1.name}" → placement #${placement.id}`);
  assert(r2s === 201, `Representation for "${offer2.name}" → placement #${placement.id}`);
  assert(rfs === 201, `Representation for "${fallbackOffer.name}" (fallback) → placement #${placement.id}`);
  console.log(`\n    Each offer now has HTML content designed for the "Email Promo`);
  console.log(`    Banner" placement. The same offer could have different content`);
  console.log(`    for web, mobile, or SMS placements.`);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  step(5, 'Approve & Publish Offers (make them live)');
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //
  //  Offers go through a lifecycle: draft → approved → live → archived
  //  Only "live" offers are eligible for selection by the decision engine.
  //
  //  UI path: Offers → [offer] → Approve → Publish
  //

  await request('POST', `/api/offers/${offer1.id}/approve`);
  const { body: o1Live } = await request('POST', `/api/offers/${offer1.id}/publish`);
  assert(o1Live.status === 'live', `"${offer1.name}" is now LIVE`);

  await request('POST', `/api/offers/${offer2.id}/approve`);
  const { body: o2Live } = await request('POST', `/api/offers/${offer2.id}/publish`);
  assert(o2Live.status === 'live', `"${offer2.name}" is now LIVE`);

  await request('POST', `/api/offers/${fallbackOffer.id}/approve`);
  const { body: fbLive } = await request('POST', `/api/offers/${fallbackOffer.id}/publish`);
  assert(fbLive.status === 'live', `"${fallbackOffer.name}" (fallback) is now LIVE`);

  console.log(`\n    All three offers are live and eligible for the decision engine.`);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  step(6, 'Create a Collection (group offers)');
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //
  //  A Collection groups offers together. It can be:
  //    - Static:  manually pick specific offers
  //    - Dynamic: auto-include offers matching qualifier tags
  //
  //  UI path: Offer Decisioning → Collections → + Create Collection
  //

  const { status: colStatus, body: collection } = await request('POST', '/api/collections', {
    name: 'Summer Promotions',
    description: 'All summer promotional offers',
    type: 'static',
    offer_ids: [offer1.id, offer2.id]
  });

  assert(colStatus === 201, `Collection created: #${collection.id} "${collection.name}"`);
  console.log(`    Type: static (manually selected ${2} offers)`);
  console.log(`\n    The collection groups our two personalized offers. The decision`);
  console.log(`    engine will pick from this pool when resolving.`);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  step(7, 'Create a Selection Strategy');
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //
  //  A Selection Strategy defines HOW to pick the best offer:
  //    - Which collection to draw from
  //    - What ranking method to use (priority, formula, AI model)
  //    - Optional eligibility rule to pre-filter
  //
  //  UI path: Offer Decisioning → Decisions → Strategies → + Create
  //

  const { status: strStatus, body: strategy } = await request('POST', '/api/decisions/strategies', {
    name: 'Summer Priority Ranking',
    description: 'Rank summer offers by priority score',
    collection_id: collection.id,
    ranking_method: 'priority'
  });

  assert(strStatus === 201, `Strategy created: #${strategy.id} "${strategy.name}"`);
  console.log(`    Collection: #${collection.id} "${collection.name}"`);
  console.log(`    Ranking: by priority (higher priority wins)`);
  console.log(`\n    The strategy says: "Look at offers in 'Summer Promotions'`);
  console.log(`    and pick the one with the highest priority score."`);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  step(8, 'Create a Decision (the policy)');
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //
  //  A Decision ties everything together:
  //    - Which placement(s) it applies to
  //    - Which selection strategy to use for each placement
  //    - Which fallback offer to use if nothing qualifies
  //
  //  UI path: Offer Decisioning → Decisions → + Create Decision
  //

  const { status: decStatus, body: decision } = await request('POST', '/api/decisions', {
    name: 'Summer Email Campaign Decision',
    description: 'Personalized offer for summer email campaign',
    placement_configs: [
      {
        placement_id: placement.id,
        selection_strategy_id: strategy.id,
        fallback_offer_id: fallbackOffer.id
      }
    ]
  });

  assert(decStatus === 201, `Decision created: #${decision.id} "${decision.name}"`);
  console.log(`    Placement: #${placement.id} "${placement.name}"`);
  console.log(`    Strategy:  #${strategy.id} "${strategy.name}"`);
  console.log(`    Fallback:  #${fallbackOffer.id} "${fallbackOffer.name}"`);
  console.log(`\n    The decision says: "For the Email Promo Banner slot, use the`);
  console.log(`    Summer Priority Ranking strategy. If nothing qualifies, show`);
  console.log(`    the Free Shipping offer."`);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  step(9, 'Activate the Decision');
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //
  //  Decisions must be activated (set to "live") before they can be
  //  used in email deliveries or any channel.
  //
  //  UI path: Decisions → [decision] → Activate
  //

  const { body: activatedDec } = await request('POST', `/api/decisions/${decision.id}/activate`);

  assert(activatedDec.status === 'live', `Decision is now LIVE`);
  console.log(`\n    The decision engine is ready. Any email using this decision`);
  console.log(`    will now resolve personalized offers for each contact.`);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  step(10, 'Simulate: test offer resolution for a contact');
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //
  //  Before using it in an email, test that the decision resolves correctly.
  //  Simulation runs the full engine but does NOT log propositions.
  //
  //  UI path: Decisions → [decision] → Simulate
  //

  const { status: simStatus, body: simResult } = await request('POST', `/api/decisions/${decision.id}/simulate`, {
    contact_id: testContact.id,
    context: { channel: 'email' }
  });

  assert(simStatus === 200, `Simulation succeeded for contact #${testContact.id}`);

  const simPlacement = (simResult.placements || []).find(p => p.placement_id === placement.id);
  assert(!!simPlacement, `Placement "${placement.name}" resolved`);

  const resolvedOffer = simPlacement?.offers?.[0];
  assert(!!resolvedOffer, `Winning offer: "${resolvedOffer?.offer_name}"`);
  console.log(`    Fallback used: ${simPlacement?.fallback_used ? 'Yes' : 'No'}`);
  console.log(`    Content type: ${resolvedOffer?.content?.content_type || 'N/A'}`);
  console.log(`    Has HTML: ${resolvedOffer?.content?.content ? 'Yes' : 'No'}`);
  console.log(`\n    The engine selected "${resolvedOffer?.offer_name}" because it has`);
  console.log(`    the highest priority (${offer1.priority}) among eligible offers.`);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  step(11, 'Create an Email Delivery with the Offer Block');
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //
  //  Now we create the actual email delivery. In the UI you would:
  //    1. Create delivery → channel: Email
  //    2. Go to Step 3 (Content) → Open Email Designer
  //    3. Drag "Offer decision" from Components onto the canvas
  //    4. In Settings panel, select your Decision and Placement
  //    5. Save
  //
  //  The content_blocks array stores an "offer" type block:
  //
  //    {
  //      type: "offer",
  //      decisionId: <decision_id>,
  //      placementId: <placement_id>,
  //      offerFallbackHtml: "<fallback HTML>"
  //    }
  //
  //  And the html_output contains OFFER_BLOCK markers:
  //
  //    <!-- OFFER_BLOCK:decision=X&placement=Y -->
  //      <fallback html here>
  //    <!-- /OFFER_BLOCK -->
  //
  //  At send time, the server replaces these markers with the resolved
  //  offer content, personalized for each recipient.
  //

  const offerBlockMarker = `<!-- OFFER_BLOCK:decision=${decision.id}&placement=${placement.id} --><div style="padding:24px;text-align:center;color:#666;">Special offer loading...</div><!-- /OFFER_BLOCK -->`;

  const emailHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;font-family:Arial,sans-serif;background:#f4f4f4;">
<div style="max-width:640px;margin:0 auto;background:#fff;padding:32px;">

  <h1 style="color:#1a1a2e;text-align:center;">Hi {{first_name}}!</h1>
  <p style="color:#555;text-align:center;">We picked something special just for you:</p>

  <div style="margin:32px 0;">
    ${offerBlockMarker}
  </div>

  <hr style="border:none;border-top:1px solid #eee;margin:32px 0;">

  <p style="color:#999;font-size:12px;text-align:center;">
    This offer was personalized for you. &copy; 2026 Our Store.
  </p>

</div>
</body></html>`;

  const contentBlocks = [
    { id: 'blk-heading', type: 'text', content: '<h1>Hi {{first_name}}!</h1>' },
    { id: 'blk-intro', type: 'text', content: '<p>We picked something special just for you:</p>' },
    {
      id: 'blk-offer',
      type: 'offer',
      decisionId: decision.id,
      placementId: placement.id,
      offerLabel: decision.name,
      offerFallbackHtml: '<div style="padding:24px;text-align:center;color:#666;">Special offer loading...</div>',
      offerPreviewHtml: '',
      offerResolved: false
    },
    { id: 'blk-divider', type: 'divider', thickness: 1 },
    { id: 'blk-footer', type: 'text', content: '<p style="font-size:12px;color:#999;">Personalized for you.</p>' }
  ];

  const { status: delStatus, body: delivery } = await request('POST', '/api/deliveries', {
    name: 'Summer Promo - Personalized Offers',
    channel: 'Email',
    subject: 'A special deal just for you, {{first_name}}!',
    preheader: 'Your personalized summer offer inside',
    content_blocks: contentBlocks,
    html_output: emailHtml,
    status: 'draft'
  });

  assert(delStatus === 201, `Delivery created: #${delivery.id} "${delivery.name}"`);

  // Verify offer block persisted
  const { body: fetchedDel } = await request('GET', `/api/deliveries/${delivery.id}`);
  const offerBlk = (fetchedDel.content_blocks || []).find(b => b.type === 'offer');
  assert(!!offerBlk, `Offer block stored in content_blocks`);
  assert(offerBlk.decisionId === decision.id, `  → decisionId = ${offerBlk.decisionId}`);
  assert(offerBlk.placementId === placement.id, `  → placementId = ${offerBlk.placementId}`);
  assert((fetchedDel.html_output || '').includes('OFFER_BLOCK'), `HTML output has OFFER_BLOCK markers`);

  console.log(`\n    In the email designer, this is what happens when you drag the`);
  console.log(`    "Offer decision" block onto the canvas and select:`);
  console.log(`      Decision: "${decision.name}"`);
  console.log(`      Placement: "${placement.name}"`);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  step(12, 'Preview the email with a test profile');
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //
  //  Preview resolves the offer for a specific contact, so you can see
  //  exactly what they would receive.
  //
  //  UI path: Email Designer → Preview → select test profile
  //  Or: Delivery wizard → Step 4 (Preview & Proof) → select test profile
  //

  const { status: prevStatus, body: preview } = await request('POST', `/api/deliveries/${delivery.id}/preview`, {
    test_profile_id: testContact.id
  });

  assert(prevStatus === 200, `Preview returned successfully`);
  const previewHtml = preview.html || '';
  const markersGone = !previewHtml.includes('OFFER_BLOCK');
  assert(markersGone, `OFFER_BLOCK markers resolved (replaced with real offer)`);
  assert(previewHtml.length > 200, `Preview HTML: ${previewHtml.length} chars`);

  // Check which offer content is in the preview
  const hasOffer1 = previewHtml.includes('25% OFF') || previewHtml.includes('summer-sale');
  const hasOffer2 = previewHtml.includes('Buy 2, Get 1 FREE') || previewHtml.includes('accessories');
  const hasFallback = previewHtml.includes('FREE SHIPPING');
  console.log(`    Contains "${offer1.name}" content: ${hasOffer1 ? 'YES' : 'no'}`);
  console.log(`    Contains "${offer2.name}" content: ${hasOffer2 ? 'YES' : 'no'}`);
  console.log(`    Contains fallback content: ${hasFallback ? 'YES' : 'no'}`);

  assert(hasOffer1 || hasOffer2 || hasFallback, `Preview contains resolved offer content`);
  console.log(`\n    The preview shows the actual offer that contact #${testContact.id} would see.`);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  step(13, 'Send the delivery');
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //
  //  When the delivery is sent, the server:
  //    1. Resolves recipients from the audience/segment
  //    2. For EACH recipient, runs the decision engine
  //    3. Replaces OFFER_BLOCK markers with the winning offer's HTML
  //    4. Sends the personalized email
  //
  //  So contact A might get "25% Off" while contact B gets "Buy 2 Get 1 Free"
  //  depending on their profile, eligibility, and ranking.
  //

  const { status: sendStatus, body: sendResult } = await request('POST', `/api/deliveries/${delivery.id}/send`);

  assert(sendStatus === 200, `Delivery sent (HTTP ${sendStatus})`);
  assert(sendResult.sent > 0, `Sent to ${sendResult.sent} recipients`);
  console.log(`    Provider: ${sendResult.provider}`);
  console.log(`    Delivered: ${sendResult.delivered || 'N/A'}`);
  console.log(`\n    Each recipient received a unique email with the offer that was`);
  console.log(`    best for them, resolved in real time by the decision engine.`);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  step(14, 'Check offer propositions (tracking)');
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //
  //  Every time the engine resolves an offer for a contact, it logs a
  //  "proposition" — which offer was shown to whom, when, on which channel.
  //  This powers analytics and capping/frequency management.
  //

  const { body: propData } = await request('GET', `/api/decisions/propositions/list?decision_id=${decision.id}`);
  assert(propData.total > 0, `${propData.total} propositions logged`);

  const emailProps = (propData.propositions || []).filter(p => p.channel === 'email');
  assert(emailProps.length > 0, `${emailProps.length} email propositions found`);

  // Show a sample
  const sample = emailProps.slice(0, 5);
  for (const p of sample) {
    console.log(`    #${p.id}: "${p.offer_name}" → ${p.contact_name} (${p.is_fallback ? 'fallback' : 'personalized'})`);
  }
  console.log(`\n    Propositions track exactly which offer each contact received.`);
  console.log(`    This data feeds into analytics, A/B testing, and capping.`);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  step(15, 'Check the delivery report');
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const { status: rptStatus, body: report } = await request('GET', `/api/deliveries/${delivery.id}/report`);
  assert(rptStatus === 200, `Delivery report loaded`);
  assert(report.metrics.sent > 0, `Sent: ${report.metrics.sent}`);
  console.log(`    Delivered: ${report.metrics.delivered}`);
  console.log(`    Opens:     ${report.metrics.opens}`);
  console.log(`    Clicks:    ${report.metrics.clicks}`);
  console.log(`    Rates:     delivery=${report.rates.delivery_rate}%, open=${report.rates.open_rate}%, click=${report.rates.click_rate}%`);

  // ══════════════════════════════════════════════════════════════════════
  //  SUMMARY
  // ══════════════════════════════════════════════════════════════════════

  console.log(`\n${'═'.repeat(70)}`);
  console.log(`\n  RESULTS: ${passed} passed, ${failed} failed\n`);

  console.log('  What we built:');
  console.log(`    1. Placement:  #${placement.id}  "${placement.name}" (${placement.channel}/${placement.content_type})`);
  console.log(`    2. Fallback:   #${fallbackOffer.id}  "${fallbackOffer.name}"`);
  console.log(`    3. Offer A:    #${offer1.id}  "${offer1.name}" (priority ${offer1.priority})`);
  console.log(`    4. Offer B:    #${offer2.id}  "${offer2.name}" (priority ${offer2.priority})`);
  console.log(`    5. Collection: #${collection.id}  "${collection.name}" (${2} offers)`);
  console.log(`    6. Strategy:   #${strategy.id}  "${strategy.name}" (rank by priority)`);
  console.log(`    7. Decision:   #${decision.id}  "${decision.name}"`);
  console.log(`    8. Delivery:   #${delivery.id}  "${delivery.name}" → ${sendResult.sent} sent`);

  console.log(`\n  How it works in the Email Designer:`);
  console.log(`    1. Drag "Offer decision" (☆) from Components onto the canvas`);
  console.log(`    2. In Settings panel, select Decision: "${decision.name}"`);
  console.log(`    3. Select Placement: "${placement.name}"`);
  console.log(`    4. Click "Preview with test contact" to see the resolved offer`);
  console.log(`    5. Save → the offer block becomes an OFFER_BLOCK marker in HTML`);
  console.log(`    6. At send time, each contact gets their personalized offer\n`);

  if (failed > 0) {
    console.log(`  ⚠ ${failed} test(s) failed!\n`);
  } else {
    console.log(`  ✓ All ${passed} tests passed!\n`);
  }
}

run().catch(err => {
  console.error('Test crashed:', err);
  process.exitCode = 1;
});
