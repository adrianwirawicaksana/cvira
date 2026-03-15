// lib/gemini.js — Gemini API helper dengan fallback 3 key
var https = require('https');

var MODEL = 'gemini-2.5-flash-lite';
var BASE = 'https://generativelanguage.googleapis.com/v1beta/models/' + MODEL + ':generateContent';

function getKeys() {
    return [
        process.env.GEMINI_KEY_1,
        process.env.GEMINI_KEY_2,
        process.env.GEMINI_KEY_3,
    ].filter(function (k) { return k && !k.startsWith('GANTI'); });
}

function callGemini(apiKey, body) {
    return new Promise(function (resolve, reject) {
        var url = new URL(BASE + '?key=' + apiKey);
        var data = JSON.stringify(body);
        var req = https.request({
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
        }, function (res) {
            var raw = '';
            res.on('data', function (c) { raw += c; });
            res.on('end', function () {
                try {
                    var parsed = JSON.parse(raw);
                    if (res.statusCode >= 400) {
                        var e = new Error(parsed.error && parsed.error.message ? parsed.error.message : 'HTTP ' + res.statusCode);
                        e.status = res.statusCode; return reject(e);
                    }
                    resolve(parsed);
                } catch (err) { reject(new Error('Parse error')); }
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

function isLimitErr(err) {
    var msg = err.message || '';
    return err.status === 429 || msg.indexOf('QUOTA') !== -1 || msg.indexOf('exhausted') !== -1;
}

function generate(body) {
    var keys = getKeys();
    console.log('[gemini] total keys:', keys.length);
    if (keys.length === 0) {
        return Promise.reject(new Error('No Gemini API keys configured'));
    }
    function tryKey(idx) {
        if (idx >= keys.length)
            return Promise.reject(Object.assign(new Error('limit'), { limitReached: true }));
        console.log('[gemini] trying key #' + (idx + 1));
        return callGemini(keys[idx], body)
            .then(function (r) {
                console.log('[gemini] key #' + (idx + 1) + ' success');
                return r;
            })
            .catch(function (err) {
                console.error('[gemini] key #' + (idx + 1) + ' failed:', err.status, err.message);
                if (isLimitErr(err) || err.status === 400) return tryKey(idx + 1);
                throw err;
            });
    }
    return tryKey(0);
}

module.exports = { generate };