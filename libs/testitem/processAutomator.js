/// <reference path="../../include.d.ts" />
var request = require('request');
var cheerio = require('cheerio');
var commonUtil = require('../commonUtil.js');
var fs = require('fs');
var async = require('async');

var getSessions = commonUtil.getSessions;
var placeOrder = require('./frontAutomator.js').placeOrder;

var erp = require('./erpautomator.js');

var orderCenterProcess= erp.orderCenterProcess;
var supplierProcess = erp.supplierProcess;
var wmsProcess = erp.wmsProcess;


/**
 * 订单系统全逻辑
 */

/**
 * 完成一个订单
 */
function completedOrder() {
    async.waterfall([async.apply(placeOrder, 'en', 'multiplepayer@milanoo.com', '123456'), orderCenterProcess, supplierProcess, wmsProcess], function(err, result) {
        console.log(result);
    });
}
completedOrder();

