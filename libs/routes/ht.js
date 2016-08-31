var express = require('express');
var passport = require('passport');
var router = express.Router();
var async = require('async');
var config = require('../config.js')

var ht = require('../testitem/htAutomator.js');
var authentication = config.get('authentication') ? passport.authenticate('bearer', { session: false }) : [];
/**
 * 米兰测试站 - 根据用户邮箱获取用户ID
 * 
 * 路径 : /api/ht/member/id/邮箱地址
 * 
 * 文档待写
 * 
 */
router.get('/member/id/:email', authentication,  function (req, res) {
    var memberMail = req.params.email;
    // var mid = ht.getId(memberMail);
    async.waterfall([async.apply(ht.getId, memberMail), function (mid, callback) {
        res.json({
            code: 1,
            memberEmail: memberMail,
            mid: mid
        });
    }]);

});


/**
 * 米兰测试站，创建一个基于商品的折扣券
 * 
 * 路径： api/ht/pdiscout/add/语言站/商品id
 * 
 * 
 */
router.get('/pdiscout/add/:lang/:pid', authentication, function (req, res) {
    var productId = req.params.pid;
    var lang = req.params.lang;
    async.waterfall([async.apply(ht.runHt, ht.composeRegularProductDiscount, [lang, productId]), function (code, callback) {
        res.json({
            code: code,
            message : code == 1 ? '商品折扣券添加成功' : '商品折扣券添加失败'
        });
    }]);

});

/**
 * 米兰测试站，创建一个基于订单的折扣券
 * 
 * 路径： api/ht/odiscout/add/语言站
 * 
 * 
 */
router.get('/odiscout/add/:lang', authentication, function (req, res) {
    var productId = req.params.pid;
    var lang = req.params.lang;
    async.waterfall([async.apply(ht.runHt, ht.composeRegularOrderDiscount, [lang]), function (code, callback) {
        res.json({
            code: code,
            message : code == 1 ? '订单折扣券添加成功' : '订单折扣券添加失败'
        });
    }]);

});

/**
 * 米兰测试站，查询一个商品是否参加了任意活动
 * 
 * 路径： api/ht/activity/search/语言站/商品id
 * 
 * 
 */
router.get('/discout/search/:lang/:pid', authentication, function (req, res) {
    var productId = req.params.pid;
    var lang = req.params.lang;
    async.waterfall([async.apply(ht.queryPromotion,lang, productId), function (msg, callback) {
        res.json({
            message : msg
        });
    }]);

});


module.exports = router;
