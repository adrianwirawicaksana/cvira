// api/auth/google.js — Redirect ke Google OAuth
module.exports = function (req, res) {
    var clientId = process.env.GOOGLE_CLIENT_ID;
    var redirectUri = process.env.APP_URL + '/auth/google/callback';
    var scope = 'openid email profile';

    var params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: scope,
        access_type: 'online',
    });

    res.redirect(302, 'https://accounts.google.com/o/oauth2/v2/auth?' + params.toString());
};