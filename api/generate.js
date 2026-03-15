// api/generate.js — Generate CV endpoint
var jwtLib = require('../lib/jwt');
var mayar = require('../lib/mayar');
var gemini = require('../lib/gemini');

var FREE_LIMIT = parseInt(process.env.FREE_DAILY_LIMIT || '3');

function todayStr() { return new Date().toISOString().slice(0, 10); }

// Parse body dari raw stream (Vercel tidak auto-parse)
function parseBody(req) {
    return new Promise(function (resolve, reject) {
        if (req.body) return resolve(req.body);
        var raw = '';
        req.on('data', function (chunk) { raw += chunk; });
        req.on('end', function () {
            try { resolve(JSON.parse(raw || '{}')); }
            catch (e) { resolve({}); }
        });
        req.on('error', reject);
    });
}

module.exports = async function (req, res) {
    // Handle CORS preflight
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST')
        return res.status(405).json({ error: 'method_not_allowed' });

    req.cookies = jwtLib.parseCookies(req);
    var user = jwtLib.getUser(req);
    if (!user) return res.status(401).json({ error: 'login_required' });

    // Parse body
    var body;
    try { body = await parseBody(req); }
    catch (e) { return res.status(400).json({ error: 'bad_request' }); }

    if (!body || !body.contents)
        return res.status(400).json({ error: 'bad_request' });

    // Reset freeCount jika hari baru
    var today = todayStr();
    var freeCount = (user.freeDate === today) ? (user.freeCount || 0) : 0;
    var freeDate = today;

    // Cek kuota
    if (user.plan !== 'pro' && freeCount >= FREE_LIMIT) {
        return res.status(403).json({
            error: 'free_limit',
            freeLeft: 0,
            freeLimit: FREE_LIMIT,
            usedToday: freeCount,
        });
    }

    console.log('[generate] ' + user.email + ' plan=' + user.plan + ' freeCount=' + freeCount);

    try {
        var result = await gemini.generate(body);

        // Update JWT dengan freeCount terbaru
        var newPayload = Object.assign({}, user, {
            freeCount: user.plan === 'pro' ? freeCount : freeCount + 1,
            freeDate: freeDate,
        });
        delete newPayload.iat;
        delete newPayload.exp;

        // Spend Mayar credit jika Pro
        if (user.plan === 'pro' && user.customerId) {
            try {
                await mayar.spendCredit(user.customerId);
                newPayload.balance = Math.max(0, (user.balance || 1) - 1);
                if (newPayload.balance <= 0) newPayload.plan = 'free';
            } catch (e) {
                console.warn('[generate] spend credit failed:', e.message);
            }
        }

        jwtLib.setCookie(res, newPayload);
        res.json({ ok: true, response: result });

    } catch (err) {
        console.error('[generate] FATAL:', err.message, err.stack);
        res.status(err.limitReached ? 429 : 500).json({
            error: err.limitReached ? 'gemini_limit' : 'server_error',
            limitReached: !!err.limitReached,
        });
    }
};