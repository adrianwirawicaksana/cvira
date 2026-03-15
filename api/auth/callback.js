// api/auth/callback.js — Handle Google OAuth callback
var https = require('https');
var jwtLib = require('../../lib/jwt');
var mayar = require('../../lib/mayar');

function post(url, body, headers) {
    return new Promise(function (resolve, reject) {
        var data = new URLSearchParams(body).toString();
        var u = new URL(url);
        var req = https.request({
            hostname: u.hostname,
            path: u.pathname,
            method: 'POST',
            headers: Object.assign({
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(data),
            }, headers || {}),
        }, function (res) {
            var raw = '';
            res.on('data', function (c) { raw += c; });
            res.on('end', function () {
                try { resolve(JSON.parse(raw)); }
                catch (e) { reject(new Error('Parse error')); }
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

function getProfile(accessToken) {
    return new Promise(function (resolve, reject) {
        var req = https.request({
            hostname: 'www.googleapis.com',
            path: '/oauth2/v2/userinfo',
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + accessToken },
        }, function (res) {
            var raw = '';
            res.on('data', function (c) { raw += c; });
            res.on('end', function () {
                try { resolve(JSON.parse(raw)); }
                catch (e) { reject(new Error('Parse error')); }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

function todayStr() { return new Date().toISOString().slice(0, 10); }

module.exports = async function (req, res) {
    var code = (req.query && req.query.code) || new URL('https://x.com' + req.url).searchParams.get('code');

    if (!code) return res.redirect('/?auth=failed');

    try {
        // 1. Tukar code dengan access_token
        var tokens = await post('https://oauth2.googleapis.com/token', {
            code: code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: process.env.APP_URL + '/auth/google/callback',
            grant_type: 'authorization_code',
        });

        if (!tokens.access_token) return res.redirect('/?auth=failed');

        // 2. Ambil profil Google
        var profile = await getProfile(tokens.access_token);

        var googleId = profile.id;
        var email = profile.email || '';
        var name = profile.name || email;
        var picture = profile.picture || '';

        // 3. Cek Mayar credit
        var customerId = null;
        var plan = 'free';
        var balance = 0;

        var customer = await mayar.getCustomerByEmail(email);
        if (customer) {
            customerId = customer.id;
            balance = await mayar.getCredit(customer.id);
            plan = balance > 0 ? 'pro' : 'free';
        }

        // 4. Buat JWT payload
        // freeCount & freeDate disimpan di JWT untuk tracking stateless
        var payload = {
            googleId: googleId,
            email: email,
            name: name,
            picture: picture,
            customerId: customerId,
            plan: plan,
            balance: balance,
            freeCount: 0,
            freeDate: todayStr(),
        };

        jwtLib.setCookie(res, payload);
        res.redirect('/?auth=ok&plan=' + plan);

    } catch (err) {
        console.error('[callback] error:', err.message);
        res.redirect('/?auth=failed');
    }
};