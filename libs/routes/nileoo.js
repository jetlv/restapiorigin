var express = require('express');
var passport = require('passport');
var router = express.Router();
var async = require('async');
var config = require('../config.js')

var authentication = config.get('authentication') ? passport.authenticate('bearer', { session: false }) : [];
var nileoo = require('../testitem/nileooAutomator.js');

/** 自动生成一个nileoo订单 */

router.get('/order/addrandom', authentication, function (req, res) {
    async.waterfall([async.apply(nileoo.autoAdd), function (returned, callback) {
        var respCode;
        var randomCode = '';
        if (returned === 0) {
            respCode = 0;
        } else {
            respCode = 1;
            randomCode = returned;
        }
        res.json({
            code: respCode,
            randomCode: randomCode
        });
    }]);
});

module.exports = router;