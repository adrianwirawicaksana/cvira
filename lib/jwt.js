// lib/jwt.js — JWT helper (menggantikan express-session di Vercel)
const jwt = require('jsonwebtoken');

var SECRET = process.env.SESSION_SECRET || 'fallback-secret';
var COOKIE = 'cvcraft_token';

function sign(payload) {
    return jwt.sign(payload, SECRET, { expiresIn: '7d' });
}

function verify(token) {
    try { return jwt.verify(token, SECRET); }
    catch (e) { return null; }
}

function getUser(req) {
    var cookie = req.cookies && req.cookies[COOKIE];
    if (!cookie) {
        // Coba dari header Authorization juga
        var auth = req.headers && req.headers['authorization'];
        if (auth && auth.startsWith('Bearer ')) cookie = auth.slice(7);
    }
    if (!cookie) return null;
    return verify(cookie);
}

function setCookie(res, payload) {
    var token = sign(payload);
    var expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    res.setHeader('Set-Cookie',
        COOKIE + '=' + token
        + '; Path=/'
        + '; HttpOnly'
        + '; SameSite=Lax'
        + '; Expires=' + expires.toUTCString()
        + (process.env.NODE_ENV === 'production' ? '; Secure' : '')
    );
    return token;
}

function clearCookie(res) {
    res.setHeader('Set-Cookie',
        COOKIE + '=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
    );
}

// Parse cookies dari header string
function parseCookies(req) {
    var cookies = {};
    var header = req.headers && req.headers.cookie;
    if (!header) return cookies;
    header.split(';').forEach(function (part) {
        var idx = part.indexOf('=');
        if (idx < 0) return;
        var key = part.slice(0, idx).trim();
        var val = part.slice(idx + 1).trim();
        cookies[key] = decodeURIComponent(val);
    });
    return cookies;
}

module.exports = { sign, verify, getUser, setCookie, clearCookie, parseCookies, COOKIE };