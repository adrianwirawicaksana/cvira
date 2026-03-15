// lib/mayar.js — Mayar API helper
var https = require('https');

var MAYAR_BASE = 'https://api.mayar.id';

function mayarReq(method, endpoint, body) {
    return new Promise(function (resolve, reject) {
        var url = new URL(MAYAR_BASE + endpoint);
        var data = body ? JSON.stringify(body) : null;
        var headers = {
            'Authorization': 'Bearer ' + process.env.MAYAR_API_KEY,
        };
        if (data) {
            headers['Content-Type'] = 'application/json';
            headers['Content-Length'] = Buffer.byteLength(data);
        }
        var req = https.request({
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: method,
            headers: headers,
        }, function (res) {
            var raw = '';
            res.on('data', function (c) { raw += c; });
            res.on('end', function () {
                try {
                    var parsed = JSON.parse(raw);
                    if (res.statusCode >= 400) {
                        var e = new Error(parsed.message || 'HTTP ' + res.statusCode);
                        e.status = res.statusCode; return reject(e);
                    }
                    resolve(parsed);
                } catch (err) { reject(new Error('Parse error')); }
            });
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

function getCustomerByEmail(email) {
    return mayarReq('GET', '/hl/v1/customer?page=1&pageSize=50')
        .then(function (res) {
            if (!res.data) return null;
            for (var i = 0; i < res.data.length; i++)
                if (res.data[i].email === email) return res.data[i];
            return null;
        })
        .catch(function () { return null; });
}

function getCredit(customerId) {
    var qs = '?productId=' + process.env.MAYAR_PRODUCT_ID
        + '&membershipTierId=' + process.env.MAYAR_TIER_ID
        + '&customerId=' + customerId;
    return mayarReq('GET', '/credit/v1/credit/customer/balance' + qs)
        .then(function (r) { return r.customerBalance || 0; })
        .catch(function () { return 0; });
}

function spendCredit(customerId) {
    return mayarReq('POST', '/credit/v1/credit/customer/spend', {
        customerId: customerId,
        productId: process.env.MAYAR_PRODUCT_ID,
        membershipTierId: process.env.MAYAR_TIER_ID,
        amount: 1,
    });
}

module.exports = { getCustomerByEmail, getCredit, spendCredit };