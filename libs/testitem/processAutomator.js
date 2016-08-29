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
function completedOrder(lang, email ,password, callback) {
    async.waterfall([async.apply(placeOrder, lang, email, password), orderCenterProcess, supplierProcess, wmsProcess], function(err, result) {
        if(err) {
            callback(null, 10001);
            return;
        }
        callback(null, result);
    });
}

module.exports = {
    completedOrder : completedOrder
}

