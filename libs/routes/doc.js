var express = require('express');
var passport = require('passport');
var router = express.Router();
var config = require('../config.js')
var authentication = config.get('authentication') ? passport.authenticate('bearer', { session: false }) : [];
/* GET users listing. */
router.get('/', authentication, function (req, res) {
    res.render('doc');
});

module.exports = router;
