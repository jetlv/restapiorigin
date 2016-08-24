var express = require('express');
var passport = require('passport');
var router = express.Router();
var async = require('async');

var ht = require('../testitem/htAutomator.js');

/**
 * 米兰测试站 - 根据用户邮箱获取用户ID
 * 
 * 路径 : /api/ht/member/id/邮箱地址
 * 
 * 文档待写
 * 
 * 此接口未做权限验证
 */
router.get('/member/id/:email'/** , passport.authenticate('bearer', { session: false })*/, function (req, res) {
    var memberMail = req.params.email;
    // var mid = ht.getId(memberMail);
    async.waterfall([async.apply(ht.getId, memberMail), function (mid, callback) {
        res.json({
            code: '1',
            memberEmail: memberMail,
            mid: mid
        });
    }]);

});


router.get('/pdiscout/add/:pid'/** , passport.authenticate('bearer', { session: false })*/, function (req, res) {
    
    async.waterfall([async.apply(ht.getId, memberMail), function (mid, callback) {
        res.json({
            code: '1',
            memberEmail: memberMail,
            mid: mid
        });
    }]);

});


module.exports = router;
