// api/config.js
module.exports = function (req, res) {
    res.json({ proLink: process.env.MAYAR_PRO_LINK || '#' });
};