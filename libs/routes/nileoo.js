var express = require('express');
var passport = require('passport');
var router = express.Router();
var async = require('async');
var config = require('../config.js')

var authentication = config.get('authentication') ? passport.authenticate('bearer', {session: false}) : [];
var nileoo = require('../testitem/nileooAutomator.js');

/** 自动生成一个nileoo订单 */

router.get('/order/addrandom', authentication, function (req, res) {
    async.waterfall([async.apply(nileoo.autoAdd), function (returned, callback) {
        var respCode;
        var order;
        if (returned === 0) {
            respCode = 0;
        } else {
            respCode = 1;
            order = returned;
        }
        res.json({
            code: respCode,
            order: order
        });
    }], function (error) {
        console.log(error);
    });
});

router.get('/order/addbyId/:memberId', authentication, function (req, res) {
    var memberId = req.params.memberId;
    async.waterfall([async.apply(nileoo.addById, memberId), function (returned, callback) {
        var respCode;
        var order;
        if (returned === 0) {
            respCode = 0;
        } else {
            respCode = 1;
            order = returned;
        }
        res.json({
            code: respCode,
            order: order
        });
    }], function (error) {
        console.log(error);
    });
});

/** 自动生成一个Nileoo商城订单 */
router.get('/order/addBuyerOrder', authentication, function (req, res) {
    nileoo.addBuyerOrder().then(function (optStr) {
        res.json({
            code: 0,
            order: optStr
        });
    });
});

module.exports = router;