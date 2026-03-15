// api/auth/me.js — Info user yang sedang login
var jwtLib = require('../../lib/jwt');
var mayar = require('../../lib/mayar');

var FREE_LIMIT = parseInt(process.env.FREE_DAILY_LIMIT || '3');

function todayStr() { return new Date().toISOString().slice(0, 10); }

module.exports = async function (req, res) {
    req.cookies = jwtLib.parseCookies(req);
    var user = jwtLib.getUser(req);

    if (!user) return res.json({ loggedIn: false });

    // Cek apakah freeCount perlu direset (hari baru)
    var freeCount = (user.freeDate === todayStr()) ? (user.freeCount || 0) : 0;
    var freeLeft = user.plan === 'pro' ? null : Math.max(0, FREE_LIMIT - freeCount);

    // Refresh kredit Mayar kalau Pro
    var balance = user.balance || 0;
    if (user.plan === 'pro' && user.customerId) {
        try {
            balance = await mayar.getCredit(user.customerId);
            if (balance <= 0) user.plan = 'free';
        } catch (e) { }
    }

    res.json({
        loggedIn: true,
        name: user.name,
        email: user.email,
        picture: user.picture,
        plan: user.plan,
        balance: balance,
        freeLeft: freeLeft,
        freeLimit: FREE_LIMIT,
        freeUsedToday: freeCount,
    });
};