/// <reference path="../../include.d.ts" />
var request = require('request');
var cheerio = require('cheerio');
var commonUtil = require('../commonUtil.js');
var fs = require('fs');
var async = require('async');

var getSessions = commonUtil.getSessions;

// placeOrder('en', 'multiplepayer@milanoo.com', '123456', function () { });
/**
 * 前台下一个订单 - 商品是写死的， 仅在没任何要求就要一个订单的时候使用
 */
function placeOrder(lang, usr, psw, callback) {
    var base = 'http://test.item.www.milanoo.com/' + lang;
    request({ method: 'GET', url: base + '/member/login.html', gzip: true }, function (err, resp, body) {
        var cookie = getSessions(resp);
        var loginPostHeaders = {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Encoding": "gzip",
            "Accept-Language": "zh-CN,zh;q=0.8",
            "Cache-Control": "max-age=0",
            "Connection": "keep-alive",
            "Content-Type": "application/x-www-form-urlencoded",
            "Cookie": cookie,
            "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36"
        };
        var form = {
            loginusername: usr,
            loginuserpass: psw
        }
        request({ method: 'POST', url: base + '/member/login.html', gzip: true, form: form, headers: loginPostHeaders }, function (err, resp, body) {
            var cookieAfterLogin = cookie.split('; ').concat(getSessions(resp).split('; ')).join('; ');
            // console.log(cookieAfterLogin);
            var buffer = fs.readFileSync('./hars/addToCart.json', 'utf-8');
            var addCartHar = JSON.parse(buffer.toString());
            addCartHar.headers.push({
                "name": "Cookie",
                "value": cookieAfterLogin
            });
            request({ har: addCartHar, gzip: true }, function (err, resp, body) {
                var step1Headers = {
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                    "Accept-Encoding": "gzip",
                    "Accept-Language": "zh-CN,zh;q=0.8",
                    "Cache-Control": "max-age=0",
                    "Connection": "keep-alive",
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Cookie": cookieAfterLogin,
                    "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36"
                };
                request({ url: base + '/shop/Step1.html', method: 'GET', gzip: true, headers: step1Headers }, function (err, resp, body) {
                    var $ = cheerio.load(body);
                    var formAuth = $('input[name="formAuth"]').attr('value');
                    var cartId = $('input[name="cartId[]"]').attr('value');
                    // console.log(formAuth + ' : ' + cartId);
                    var step2Headers = {
                        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                        "Accept-Encoding": "gzip",
                        "Accept-Language": "zh-CN,zh;q=0.8",
                        "Cache-Control": "max-age=0",
                        "Connection": "keep-alive",
                        "Content-Type": "application/x-www-form-urlencoded",
                        "Cookie": cookieAfterLogin,
                        "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36"
                    };
                    var form = {
                        "formAuth": formAuth,
                        "websiteId": "1",
                        "stateId": "1",
                        "addressId": "2752955",
                        "logistics_key": "SuperSaver",
                        "insurance": "1.99",
                        "cartId[]": cartId,
                        "remarks": "",
                        "act": "coupons",
                        "libkey": ""
                    }
                    request({ method: 'POST', url: base + '/shop/Step2.html', form: form, gzip: true, headers: step2Headers }, function (err, resp, body) {

                        var paymentUrl = resp.headers['location'];
                        // console.log(paymentUrl);
                        request({ method: 'GET', url: paymentUrl, gzip: true, headers: step2Headers }, function (err, resp, body) {
                            var $ = cheerio.load(body);
                            var orderNum = $('.orderinfo_num').text();
                            callback(null, orderNum);
                        });

                    });
                });

            });
        });
    });
}


module.exports = {
    placeOrder : placeOrder
}