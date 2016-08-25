/// <reference path="../../include.d.ts" />
var request = require('request');
var cheerio = require('cheerio');
var commonUtil = require('../commonUtil.js');
var fs = require('fs');
var async = require('async');

var getSessions = commonUtil.getSessions;

/**
 *  订单系统中走完流程
 */

orderCenterProcess('en_mi_160825172403_427', null);

function orderCenterProcess(orderCid, callback) {
    var originalHeader = {
        "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:47.0) Gecko/20100101 Firefox/47.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3",
        "Accept-Encoding": "gzip, deflate",
        "Host":"192.168.11.13:82",
        "Connection": "keep-alive"
    }
    var hardcodeLogin = 'http://192.168.11.13:82/ordercenter/authentication_authLogin.do?cipher=AQP9d5s3xVhW1r65ZZsz2Uh98QIhSnMaLcqLq5YKpO9eTh9TzWhcpxkTcw9%2FdYXk%2FQV4T3%2BeubfqRhEiWXQOSA9B3S%2BAmYTDN%2Br4kd%2F1iPBL8ti7P%2FJvPI7kqpkz5k8FHV3nOb90Pd90dqRSp8p2GtoJ8F6UNi1vWGPM86zomCk%3D';
     request = request.defaults({ proxy: 'http://127.0.0.1:8888' });
    request({ method: 'GET', headers : originalHeader, url: hardcodeLogin, gzip: true }, function (e, r, b) {
        var cookie = getSessions(r);
        console.log(cookie);
        var authenticatedHeader = {
            "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:47.0) Gecko/20100101 Firefox/47.0",
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "Accept-Language": "zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3",
            "Accept-Encoding": "gzip, deflate",
            "Content-Type": "application/x-www-form-urlencoded",
            "X-Requested-With": "XMLHttpRequest",
            "Cookie": cookie,
            "Connection": "keep-alive"
        }
        var location = r.headers['location'];
        console.log(location)
        console.log(r.request.uri.href);

        request({ method: 'GET', url: location, gzip: true }, function (e, r, b) {
            /** 查询订单ID - e.g 由en_mi_xxxx查询到3360320 */
            var queryUrl = 'http://192.168.11.13:82/ordercenter/page/milanooOrder_query.do';
            var queryForm = {
                "order": "desc",
                "page": "1",
                "rows": "10",
                "sort": "id"
            };

            request({ method: 'POST', url: queryUrl, gzip: true, headers: authenticatedHeader, form: queryForm }, function (e, r, b) {
                var orders = JSON.parse(b);
                fs.writeFileSync('r.json', b);
                var orderId = -1;
                orders.result.rows.forEach(function (order, index, array) {
                    if (order.orderNumber == orderCid) {
                        orderId = order.id;
                    }
                });
                if (orderId == -1) {
                    callback('err!');
                    return;
                }
                /** 付款 */
                var payForm = {
                    "payment.serviceProvider": "PayPal",
                    "payment.paymentModuleCode": "PayPal",
                    "payment.currencyCode": "USD",
                    "payment.amount": "6",
                    "payment.transactionId": "000000",
                    "payment.receiveTime": "2016-08-25 15:53:06",
                    "id": orderId
                }

                var payPostUrl = 'http://192.168.11.13:82/ordercenter/page/milanooOrder_pay.do';
                request({ method: 'POST', url: payPostUrl, gzip: true, headers: authenticatedHeader, form: payForm }, function (e, r, b) {

                });
            });
        });
    });
}


/** 暂时放弃登录这一块，后面再想办法，先用hard code登录 */
function orderCenterProcess_stash(orderCid, callback) {
    var ocUrl = 'http://192.168.11.13:82/ordercenter';
    // request = request.defaults({ proxy: 'http://127.0.0.1:8888' });
    request({ method: 'GET', url: ocUrl, gzip: true }, function (e, r, b) {
        var originCookie = getSessions(r);

        var loginPostUrl = 'http://192.168.11.13:82/authcenter/authentication_login.do';

        var loginPostHeader = {
            "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:47.0) Gecko/20100101 Firefox/47.0",
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "Accept-Language": "zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3",
            "Accept-Encoding": "gzip, deflate",
            "Content-Type": "application/x-www-form-urlencoded",
            "X-Requested-With": "XMLHttpRequest",
            "Cookie": originCookie,
            "Connection": "keep-alive"
        }

        var loginPostForm = {
            "username": "admin",
            "password": "123456"
        }

        /** 原始POST到 http://192.168.11.13:82/authcenter/authentication_login.do */
        request({ method: 'POST', url: loginPostUrl, gzip: true, headers: loginPostHeader, form: loginPostForm, followAllRedirects: true }, function (e, r, b) {

            // fs.writeFileSync('resp.txt', JSON.stringify(r))

            var nextUrl = r.request.uri.href;
            console.log(nextUrl);

            var cookie = getSessions(r);

            var authenticatedHeader = {
                "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:47.0) Gecko/20100101 Firefox/47.0",
                "Accept": "application/json, text/javascript, */*; q=0.01",
                "Accept-Language": "zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3",
                "Accept-Encoding": "gzip, deflate",
                "Content-Type": "application/x-www-form-urlencoded",
                "X-Requested-With": "XMLHttpRequest",
                "Cookie": cookie,
                "Connection": "keep-alive"
            }
            var loginSysUrl = 'http://192.168.11.13:82/authcenter/project_loginSystem.do';
            var loginSysForm = { "projectName": "ordercenter" };
            request({ method: 'POST', url: loginSysUrl, gzip: true, headers: authenticatedHeader, form: loginSysForm, followAllRedirects: true }, function (e, r, b) {

                var ocAuthUrl = 'http://192.168.11.13:82/ordercenter/authentication_authLogin.do';
                request({ method: 'POST', url: queryUrl, gzip: true, headers: authenticatedHeader, form: queryForm }, function (e, r, b) {
                    var orders = JSON.parse(b);
                    fs.writeFileSync('r.json', b);
                    var orderId = -1;
                    orders.result.rows.forEach(function (order, index, array) {
                        if (order.orderNumber == orderCid) {
                            orderId = order.id;
                        }
                    });
                    if (orderId == -1) {
                        callback('err!');
                        return;
                    }
                    /** 付款 */
                    var payForm = {
                        "payment.serviceProvider": "PayPal",
                        "payment.paymentModuleCode": "PayPal",
                        "payment.currencyCode": "USD",
                        "payment.amount": "6",
                        "payment.transactionId": "000000",
                        "payment.receiveTime": "2016-08-25 15:53:06",
                        "id": orderId
                    }

                    var payPostUrl = 'http://192.168.11.13:82/ordercenter/page/milanooOrder_pay.do';
                    request({ method: 'POST', url: payPostUrl, gzip: true, headers: authenticatedHeader, form: payForm }, function (e, r, b) {

                    });
                });
            });
        });
    });
    //     });
    // });
}

