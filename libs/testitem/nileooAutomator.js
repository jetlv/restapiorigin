/// <reference path="../../include.d.ts" />
const fs = require('fs');
var ew = require('node-xlsx');
var util = require('../commonUtil.js');
var request = require('request');

/** 自动添加一个nileoo订单的逻辑 - 随机生成code*/
function autoAddNileooOrder(callback) {
    var random = util.randomStr(8);
    var columns = ["物流公司", "序号", "目的地国家", "收件人", "地址1", "地址2", "州", "城市", "邮编", "电话", "数量", "价格_元", "包裹总重量_KG", "HSCODE", "成分描述", "包裹详情_英", "包裹详情_中", "申报价格_元"];
    var row = ["Fedex", random, "IE", "测试组构造的数据", "123213", "", "", "321321", "354", "0894345569", "1||3", "58||161", "2.8", "6104490099||6114200091", "cosplay clothes 55% Nylon & 45% cotton||100% cotton mens cloth", "shoes||clothes", "鞋子||衣服", "501", "Fedex"];
    var sheet = { name: 'temp', data: [] };
    sheet.data.push(columns);
    sheet.data.push(row);

    var buffer = ew.build([sheet]);

    fs.writeFileSync(random + '.xls', buffer);

    var readStream = fs.createReadStream(random + '.xls');

    var uploadFileUrl = 'http://192.168.11.13:8080/fs/nileooFile/uploadNileooLogistics.htm';
    var formData = {
        fileData: readStream
    }
    request.post({ url: uploadFileUrl, formData: formData, gzip: true }, function (error, resp, body) {
        if (error) console.log(error);
        console.log(body);
        var bodyJson = JSON.parse(body);
        var fullPath = 'http://192.168.11.67/upload/nileoo/logistics_excel/o/' + bodyJson.filePath;
        var importApi = 'http://192.168.12.40:8080/order/order/importOrder.json?memberId=1&memberName=测试部&url=' + fullPath;
        console.log(importApi);
        request.post({ url: importApi, gzip: true }, function (error, resp, body) {
            fs.unlinkSync(random + '.xls');
            var importResponse = JSON.parse(body);
            if (importResponse.msg === 'success.' && importResponse.code === '0') {
                var searchUrl = 'http://192.168.12.40:8080/order/order/getOrderPages.json?memberId=1&pageNo=0&pageSize=10&code=' + random;
                request({ url: searchUrl, gzip: true }, function (err, res, body) {
                    var results = JSON.parse(body);
                    var count = results.result.result.length;
                    if (count !== 1) {
                        callback(null, 0);
                    } else {
                        callback(null, results.result.result[0]);
                    }
                });
            } else {
                callback(null, 0);
            }
        });
    });
}

module.exports = {
    autoAdd: autoAddNileooOrder
}
