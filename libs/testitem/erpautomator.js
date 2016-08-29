/// <reference path="../../include.d.ts" />
var request = require('request');
var cheerio = require('cheerio');
var commonUtil = require('../commonUtil.js');
var fs = require('fs');
var async = require('async');

var getSessions = commonUtil.getSessions;

/**
 *  订单系统中走完流程
 * 
 * 传入en_mi_xxxx的orderCid
 */

// orderCenterProcess('en_mi_160825172328_427', null);

function orderCenterProcess(orderCid, callback) {
    // console.log(orderCid);
    // var originalHeader = {
    //     "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:47.0) Gecko/20100101 Firefox/47.0",
    //     "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    //     "Accept-Language": "zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3",
    //     "Accept-Encoding": "gzip, deflate",
    //     "Host":"192.168.11.13:82",
    //     "Connection": "keep-alive"
    // }

    request = request.defaults({ proxy: 'http://127.0.0.1:8888' });
    // request({ method: 'GET', headers : originalHeader, url: hardcodeLogin, gzip: true }, function (e, r, b) {
    // var cookie = getSessions(r);
    // console.log(cookie);
    var unAuthenticatedHeader = {
        "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:47.0) Gecko/20100101 Firefox/47.0",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3",
        "Accept-Encoding": "gzip, deflate",
        "Connection": "keep-alive"
    }
    var hardcodeLogin = 'http://192.168.11.13:82/ordercenter/authentication_authLogin.do?cipher=AQP9d5s3xVhW1r65ZZsz2Uh98QIhSnMaLcqLq5YKpO9eTh9TzWhcpxkTcw9%2FdYXk%2FQV4T3%2BeubfqRhEiWXQOSA9B3S%2BAmYTDN%2Br4kd%2F1iPBL8ti7P%2FJvPI7kqpkz5k8FHV3nOb90Pd90dqRSp8p2GtoJ8F6UNi1vWGPM86zomCk%3D';
    request({ url: hardcodeLogin, method: 'GET', headers: unAuthenticatedHeader, gzip: true, followRedirect: false }, function (e, r, b) {
        var cookie = getSessions(r);
        // console.log(cookie);


        var authenticatedHeader = {
            "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:47.0) Gecko/20100101 Firefox/47.0",
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "Accept-Language": "zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3",
            "Accept-Encoding": "gzip, deflate",
            "Content-Type": "application/x-www-form-urlencoded",
            // "Cookie": "JSESSIONID=VYQsh5lI79vpxcMCTqdBmfEM.undefined",
            "Cookie": cookie,
            "Connection": "keep-alive"
        }
        // console.log(JSON.stringify(r.headers));
        // fs.writeFileSync('b.txt', b);
        // console.log(location)
        // console.log(r.request.uri.href);
        var ocHome = 'http://192.168.11.13:82/ordercenter/page/index.jsp';
        // request({ method: 'GET', url: ocHome, gzip: true, headers : authenticatedHeader}, function (e, r, b) {
        // fs.writeFileSync('b.txt', b);
        // console.log(JSON.stringify(r.request.headers));
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
            // console.log(JSON.stringify(r.request.headers));
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

            /** 我并不害怕callback hell！ */
            var payPostUrl = 'http://192.168.11.13:82/ordercenter/page/milanooOrder_pay.do';
            request({ method: 'POST', url: payPostUrl, gzip: true, headers: authenticatedHeader, form: payForm }, function (e, r, b) {
                /** 财务审核和第一次付款的表单是相同的 */
                var financeConfirmUrl = 'http://192.168.11.13:82/ordercenter/page/milanooOrder_financeConfirm.do';
                request({ method: 'POST', url: financeConfirmUrl, gzip: true, headers: authenticatedHeader, form: payForm }, function (e, r, b) {
                    /** 确认订单 */
                    var orderConfirmUrl = 'http://192.168.11.13:82/ordercenter/page/milanooOrder_confirm.do';
                    request({ method: 'POST', url: orderConfirmUrl, gzip: true, headers: authenticatedHeader, form: { id: orderId } }, function (e, r, b) {
                        /** 备货 */
                        var prepareUrl = 'http://192.168.11.13:82/ordercenter/page/milanooOrder_match.do';
                        request({ method: 'POST', url: prepareUrl, gzip: true, headers: authenticatedHeader, form: { id: orderId } }, function (e, r, b) {
                            /** 查询供应商ID */
                            var supplierIdQueryUrl = 'http://192.168.11.13:82/ordercenter/page/orderItem_query.do?orderId=' + orderId;
                            request({ method: 'GET', url: supplierIdQueryUrl, gzip: true, headers: authenticatedHeader }, function (e, r, b) {
                                var orderItem = JSON.parse(b);
                                var spId = orderItem.result.rows[0].procureOrder.supplierId;
                                /** 将orderId和supplierId传回 */
                                var entity = { orderNumber: orderCid, orderId: orderId, supplierId: spId };
                                callback(null, entity);
                            });
                        });
                    });
                });
            });
        });
    });
    // });
}

// supplierProcess({orderNumber : 'en_mi_160825153107_427', supplierId : '5400'}, null);
function supplierProcess(entity, callback) {
    // console.log(entity);
    var orderNumber = entity.orderNumber;
    var supplierId = entity.supplierId;
    /** 访问到供应商系统平台 */
    var supplierFrontUrl = 'http://192.168.11.13:82/supplierback/frontLogin.jsp';
    request({ method: 'GET', url: supplierFrontUrl, gzip: true }, function (e, r, b) {
        var cookie = getSessions(r);
        var authenticatedHeader = {
            "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:47.0) Gecko/20100101 Firefox/47.0",
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "Accept-Language": "zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3",
            "Accept-Encoding": "gzip, deflate",
            "Content-Type": "application/x-www-form-urlencoded",
            "Cookie": cookie,
            "Connection": "keep-alive"
        }
        /** 登录操作 */
        var loginPostUrl = 'http://192.168.11.13:82/supplierback/frontAuth_login.do';
        var loginForm = {
            userName: supplierId + 'milanoo',
            password: '123456'
        }
        request({ method: 'POST', url: loginPostUrl, headers: authenticatedHeader, form: loginForm, gzip: true }, function (e, r, b) {
            /** 获取订单在供应商系统的ID */
            var orderSidUrl = 'http://192.168.11.13:82/supplierback/member/order_orderList.do';
            var orderSidForm = {
                "cancelBeforeClaim": "0",
                "purchaseNo": orderNumber,
                "page": "1",
                "rows": "10",
                "sort": "id",
                "order": "desc"
            }
            request({ method: 'POST', url: orderSidUrl, headers: authenticatedHeader, form: orderSidForm, gzip: true }, function (e, r, b) {
                var orders = JSON.parse(b);
                // fs.writeFileSync('b.json', b);
                // console.log(orders);
                var sOrderId = -1;
                orders.result.rows.forEach(function (order, index, array) {
                    if (order.orderNumber.indexOf(orderNumber) !== -1) {
                        sOrderId = order.id;
                    }
                });
                // console.log(sOrderId);
                /** 确认采购单 */
                var confirmSOrderUrl = 'http://192.168.11.13:82/supplierback/member/order_claimOrder.do';
                var confirmForm = { idList: sOrderId };

                request({ method: 'POST', url: confirmSOrderUrl, headers: authenticatedHeader, form: confirmForm, gzip: true }, function (e, r, b) {

                    /** 获取供应商发货单的信息 */
                    var orderItemUrl = 'http://192.168.11.13:82/supplierback/member/orderItem_orderItemList.do';
                    var orderItemForm = {
                        "validateItemStates": "Processing",
                        "procureIdList": sOrderId,
                        "rows": "100000",
                        "page": "1",
                        "validateSending": "0",
                        "sort": "id",
                        "order": "desc"
                    }
                    request({ method: 'POST', url: orderItemUrl, headers: authenticatedHeader, form: orderItemForm, gzip: true }, function (e, r, b) {
                        var items = JSON.parse(b);
                        var orderItemId = -1;
                        var barcode = '';
                        items.result.rows.forEach(function (item, index, array) {
                            if (item.procureOrderId === sOrderId) {
                                orderItemId = item.id;
                                barcode = item.barcode;
                            }
                        });

                        // console.log(orderItemId);
                        /** 发货 */
                        var deliverUrl = 'http://192.168.11.13:82/supplierback/member/orderItem_deliverOrderItem.do';
                        var deliverForm = {
                            "trackingNumber": "000000",
                            "weight": "1.00",
                            "deliveryVendor": "uc56",
                            "itemList": "[{\"id\":" + orderItemId + ",\"realQuantity\":1}]"
                        }
                        request({ method: 'POST', url: deliverUrl, headers: authenticatedHeader, form: deliverForm, gzip: true }, function (e, r, b) {
                            callback(null, Object.assign(entity, { sOrderId: sOrderId, orderItemId: orderItemId, barcode: barcode }));
                        });
                    });
                });
            });
        });
    });
}


function wmsProcess(entity, callback) {
    var wmsLoginHardCode = 'http://192.168.11.13:82/wms/authentication_authLogin.do?cipher=AQP9d5s3xVhW1r65ZZsz2Uh98QIhSnMaLcqLq5YKpO9eTh9TzWhcpxkTcw9%2FdYXk%2FQV4T3%2BeubfqRhEiWXQOSA9B3S%2BAmYTDN%2Br4kd%2F1iPBL8ti7P%2FJvPI7kqpkz5k8FHV3nOb90Pd90dqRSp8p2GtoJ8F6UNi1vWGPM86zomCk%3D';
    var unAuthenticatedHeader = {
        "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:47.0) Gecko/20100101 Firefox/47.0",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3",
        "Accept-Encoding": "gzip, deflate",
        "Connection": "keep-alive"
    }
    request({ url: wmsLoginHardCode, method: 'GET', headers: unAuthenticatedHeader, gzip: true, followRedirect: false }, function (e, r, b) {
        var cookie = getSessions(r);
        var authenticatedHeader = {
            "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:47.0) Gecko/20100101 Firefox/47.0",
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "Accept-Language": "zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3",
            "Accept-Encoding": "gzip, deflate",
            "Content-Type": "application/x-www-form-urlencoded",
            // "Cookie": "JSESSIONID=VYQsh5lI79vpxcMCTqdBmfEM.undefined",
            "Cookie": cookie,
            "Connection": "keep-alive"
        }
        /** 订单系统orderID */
        var orderId = entity.orderId;
        /** 供应商系统orderID */
        var sOrderId = entity.sOrderId;
        /** 商品条码 */
        var barcode = entity.barcode;
        /** 供应商item ID */
        var itemID = entity.orderItemId;
        /** 查询收货信息URL  */
        var queryUrl = 'http://192.168.11.13:82/wms/page/@procure/procureOrderItem_orderItemList.do/forward';
        var queryForm = {
            "page": "1",
            "receive": "true",
            "rows": "100000",
            "procureOrderId": sOrderId,
            "validateItemStates": "Delivering",
            "warehouseId": "5"
        }

        request({ method: 'POST', url: queryUrl, headers: authenticatedHeader, form: queryForm, gzip: true }, function (e, r, b) {
            /** 根据id搜索的，只会有一个结果 */
            var deliverItem = JSON.parse(b).result.rows[0];
            var price = deliverItem.price;
            var skuId = deliverItem.skuInfo.skuId;
            var supplierId = deliverItem.supplierId;
            var sourceNumber = deliverItem.purchaseNo;
            var productId = deliverItem.skuInfo.productId;
            var categoryId = deliverItem.skuInfo.categoryId;

            /** 设置 服装-BFBA99 */
            var loc = 'http://192.168.11.13:82/wms/page/inventoryReceiveGroup_updateCargoSite.do';
            var locForm = {
                "receiveCategory": "服装",
                "cargoSiteCode": "B11102"
            }
            request({ method: 'POST', url: loc, headers: authenticatedHeader, form: locForm, gzip: true }, function (e, r, b) {
                /** 采购收货 */
                var receiveUrl = 'http://192.168.11.13:82/wms/page/inventory_receive.do';
                var inventoryJson = [{ "itemId": itemID, "price": parseFloat(price), barcode: barcode, "orderId": orderId, "sourceType": 1, "skuId": skuId, "supplierId": supplierId, "sourceId": sOrderId, "sourceNumber": sourceNumber, "missQuantity": 0, "productId": productId, "categoryId": categoryId, "receiveQuantity": 1, "trackingNumber": "" }];

                // console.log(JSON.stringify(inventoryJson));
                var receiveForm = {
                    inventoryInfoJSON: JSON.stringify(inventoryJson),
                    source: "采购"
                }
                request({ method: 'POST', url: receiveUrl, headers: authenticatedHeader, form: receiveForm, gzip: true }, function (e, r, b) {
                    fs.writeFileSync('shouhuo.txt', b);

                    /** 设置 直发区-BZXH99 */
                    var ilocUrl = 'http://192.168.11.13:82/wms/page/inspect_modifyInspectCargoSite.do';
                    var ilocForm = {
                        "code": "BZXH99",
                        "area": "直发区"
                    }
                    request({ method: 'POST', url: ilocUrl, headers: authenticatedHeader, form: ilocForm, gzip: true }, function (e, r, b) {
                        /** 采购质检 */
                        var inspectUrl = 'http://192.168.11.13:82/wms/page/inspect_inspect.do';
                        var inspectJson = JSON.stringify([{ "id": sOrderId, "realQuantity": 1, "problemQuantity": 0, "unQualifyReasons": [], "inspectWeight": 0, "sizeValue": "M ", "skuId": skuId, "productId": productId }]);
                        var inspectForm = {
                            "type": 1,
                            "sourceId": sOrderId,
                            "source": "采购",
                            "inspectList": inspectJson,
                            "receiveCargoSite": "B11102"
                        }
                        request({ method: 'POST', url: inspectUrl, headers: authenticatedHeader, form: inspectForm, gzip: true }, function (e, r, b) {
                            fs.writeFileSync('zhijian.txt', b);
                            /** 查询 wms package id */
                            setTimeout(function () {
                                // console.log(barcode);
                                var pidQueryUrl = 'http://192.168.11.13:82/wms/page/inventory_query.do';
                                var pidQueryForm = {
                                    rows: 1,
                                    barcode: barcode,
                                    countTotal: false,
                                    state: "已锁定"
                                };
                                request({ method: 'POST', url: pidQueryUrl, headers: authenticatedHeader, form: pidQueryForm, gzip: true }, function (e, r, b) {
                                    var pidJson = JSON.parse(b);
                                    // console.log(b);
                                    var wmsPackageId = pidJson.result.rows[0].wmsPackage.id;

                                    /** 查询inventory  */
                                    var inventoryQueryUrl = 'http://192.168.11.13:82/wms/page/wmsItem_query.do';
                                    var inventoryQueryForm = {
                                        rows: 100000,
                                        wmsPackageId : wmsPackageId
                                    };
                                    request({ method: 'POST', url: inventoryQueryUrl, headers: authenticatedHeader, form: inventoryQueryForm, gzip: true }, function (e, r, b) {
                                        var invJSON = JSON.parse(b);
                                        var inventoryId = invJSON.result.rows[0].id;
                                    /** 打包发货 */
                                    var packUrl = 'http://192.168.11.13:82/wms/page/wmsPackage_pack.do';
                                    var packForm = {
                                        packWeight: '1.00',
                                        deliveryId: 7,
                                        wmsPackageId: wmsPackageId,
                                        productInfoList: '[{"inventoryId":' + inventoryId + ', "skuId":' + skuId + ',"quantity":1,"missQuantity":0}]'
                                    }
                                    request({ method: 'POST', url: packUrl, headers: authenticatedHeader, form: packForm, gzip: true }, function (e, r, b) {
                                        fs.writeFileSync('dabao.txt', b);
                                        callback(null, entity);
                                    });
                                });
                                });
                            }, 2000);
                        });
                    });
                });
            });
        });
    });
}


module.exports = {
    orderCenterProcess: orderCenterProcess,
    supplierProcess: supplierProcess,
    wmsProcess: wmsProcess
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
            // console.log(nextUrl);

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

