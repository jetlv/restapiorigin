var express = require('express');
var passport = require('passport');
var router = express.Router();
var async = require('async');
var config = require('../config.js')

var frontAutumator = require('../testitem/frontAutomator.js');
var authentication = config.get('authentication') ? passport.authenticate('bearer', { session: false }) : [];
/**
 * 米兰测试站 - 下一个订单
 * 
 * 路径 : /api/front/order/add/语言站/邮箱地址/密码
 * 
 */
router.get('/order/add/:lang/:email/:password', authentication,  function (req, res) {
    var lang = req.params.lang;
    var email = req.params.email;
    var password = req.params.password;
    async.waterfall([async.apply(frontAutumator.placeOrder, lang, email, password), function (returnMessage, callback) {
        var msg = '';
        var orderNumber = '';
        if(returnMessage === 10001) {
            msg = '失败，可能是用户不存在，或者是该用户没有收货地址'
        } else {
            msg = returnMessage;
        }
        res.json({
            code: 1,
            msg : msg,
            orderNumber : orderNumber
        });
    }]);

});

module.exports = router;