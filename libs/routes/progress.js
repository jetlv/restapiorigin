var express = require('express');
var passport = require('passport');
var router = express.Router();
var async = require('async');
var config = require('../config.js')

var processAutomator = require('../testitem/processAutomator.js');
var authentication = config.get('authentication') ? passport.authenticate('bearer', { session: false }) : [];
/**
 * 米兰测试站 - 做一个完整的订单（采购+发货全部完成）
 * 
 * 路径 : /completeOrder/语言站/邮箱/密码
 * 
 */
router.get('/completeorder/:lang/:email/:password', authentication, function (req, res) {
    var lang = req.params.lang;
    var email = req.params.email;
    var password = req.params.password;
    async.waterfall([async.apply(processAutomator.completedOrder, lang, email, password), function (returnMessage, callback) {
        var msg = '';
        if (returnMessage === 10001) {
            msg = '失败，可能是用户信息有误，或者是该用户没有收货地址。请重试几次，如果均失败，请联系接口作者'
            returnMessage = {
                msg : msg,
                code : 10001
            }
        }
        res.json(Object.assign(returnMessage, {email : email}));
    }]);

});

module.exports = router;