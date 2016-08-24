/// <reference path="../../include.d.ts" />
var request = require('request');
var cheerio = require('cheerio');
var commonUtil = require('../commonUtil.js');
var fs = require('fs');
var async = require('async');
var mysql = require('mysql');
var mysqlOptions = {
    host: '192.168.11.24',
    user: 'dev',
    password: 'devpass',
    database: 'milanoo'
}

var getSessions = commonUtil.getSessions;

/**
 * 根据email获取用户id
 */
function idFetcher(email, callback) {
    var connection = mysql.createConnection(mysqlOptions);
    connection.connect();
    connection.query('select m.MemberId as mid from milanoo_member m where m.MemberEmail=\'' + email + '\'', function (err, rows, fields) {
        if (err) throw err;

        if(rows.length == 0) {
            callback(null, -1);
            return;
        }
        var id = rows[0].mid;

        connection.end();

        callback(null, id);
    });


}

/** 以几个http req实现cas 授权，拿到milanooAdminId */
/**
 * 传入要执行的方法
 */
function runHt(toRun, args) {
    request({ gzip: true, url: 'http://192.168.11.67:8580/cas/login?service=http%3A%2F%2Ftest.item.ht.milanoo.com%2Fmilanooht%2Findex.php', method: 'GET' }, function (err, resp, body) {
        var cookie = getSessions(resp);
        var jSessionId = cookie.split("=")[1].split('=')[0];
        console.log(jSessionId);
        var $ = cheerio.load(body);
        var lt = $('input[name="lt"]').attr('value');
        console.log(cookie);
        var form = {
            "username": "admin",
            "password": "milan00@999",
            "lt": lt,
            "execution": "e1s1",
            "_eventId": "submit",
            "submit": "登录"
        }

        var loginPostHeaders = {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Encoding": "gzip, deflate",
            "Accept-Language": "zh-CN,zh;q=0.8",
            "Cache-Control": "max-age=0",
            "Connection": "keep-alive",
            "Content-Type": "application/x-www-form-urlencoded",
            "Cookie": cookie,
            "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36",
            "Host": "192.168.11.67:8580"
        };

        // request = request.defaults({ proxy: 'http://127.0.0.1:8888' });
        request({ gzip: true, url: 'http://192.168.11.67:8580/cas/login;jsessionid=' + jSessionId + '?service=http%3A%2F%2Ftest.item.ht.milanoo.com%2Fmilanooht%2Findex.php', method: 'POST', headers: loginPostHeaders, form: form }, function (err, resp, body) {
            var ticket = resp.headers['location'].split("=")[1];
            var htHeaders = {
                "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:47.0) Gecko/20100101 Firefox/47.0",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3",
                "Accept-Encoding": "gzip, deflate",
                "Connection": "keep-alive"
            }
            request({ gzip: true, url: 'http://test.item.ht.milanoo.com/milanooht/index.php?ticket=' + ticket, method: 'GET', headers: htHeaders }, function (err, resp, body) {
                var htCookie = getSessions(resp);
                htHeaders.Cookie = "milanooAdminId=" + ticket + ";";
                request({ gzip: true, url: 'http://test.item.ht.milanoo.com/milanooht/index.php', method: 'GET', headers: htHeaders }, function (err, resp, body) {
                    toRun.apply({ headers: htHeaders }, args);
                });
            });
        });
    });
}

/** 设置一个基本商品满减的活动 缺少数据库写权限，只能由php接口写*/
function composeRegularProductDiscount(productId) {
    var form = {
        "module_id": "154",
        "module_action": "action",
        "menu_action": "addpost",
        "id": "",
        "WebsiteId": "1",
        "type": "0",
        "NoteName": productId + "NoteName",
        "name": productId + "name",
        "libkey": productId + "code",
        "ceremony_details": productId + "rule",
        "Against": "commodities",
        "prokey": "",
        "is_auto_used": "0",
        "RangeTime": "-1",
        "startime": "",
        "endtime": "",
        "RangeProducts": productId,
        "CategoriesAdditional_Id": "",
        "ShopSum": 1,
        "range_type": 1,
        "RangeLumpSum[1][0]": 0,
        "RangeLumpSum[1][1]": -1,
        "DiscountWay[1]": 1,
        "DiscountData[1][1]": 10,
        // "DiscountData[1][2]": "",
        "rule": 0,
        "myaccount_display": 1,
        "submit": "提 交"
    }

    request({ gzip: true, url: 'http://test.item.ht.milanoo.com/milanooht/index.php?module_id=154', method: 'POST', form: form, headers: this.headers }, function (err, resp, body) {
        if (err) console.log(err);
        // fs.writeFileSync('body.html', body);
    });
}

// sqlFetcher('prictdecreasetester@milanoo.com');

// runHt(composeRegularProductDiscount, ['510233']);

module.exports = {
    getId: idFetcher
}