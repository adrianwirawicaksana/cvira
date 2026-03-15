// Logout
app.post('/auth/logout', function (req, res) {
    req.logout(function () { res.json({ ok: true }); });
});