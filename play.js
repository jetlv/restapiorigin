/// <reference path="./include.d.ts" />
var request = require('request');
var cheerio = require('cheerio');
var commonUtil = require('./libs/commonUtil.js');
var fs = require('fs');
var async = require('async');
var mysql = require('mysql');
var moment = require('moment');
var mysqlOptions = {
    host: '127.0.0.1',
    user: 'root',
    password: 'devpass',
    database: 'play'
}

// var buffer = fs.readFileSync('D:\Wildlife.wmv', 'utf-8');


var folderPath = 'D:\\play\\';
var files = fs.readdirSync(folderPath);

// files.forEach(function(file, index, array) {
//     var fileBuffer = fs.readFileSync(folderPath + file);
//     fs.writeFileSync(folderPath + 'buffer_' + file + '.txt' , fileBuffer);
//     fs.unlink(folderPath + file,  function(err) {
//         if(err) console.log(err);
//     });
// });

var buffer = fs.readFileSync(folderPath + 'buffer_7.wmv.txt');







// var connection = mysql.createConnection(mysqlOptions);

// connection.connect();

// var query = "insert into videos (name, buf) values ('Wildlife', ?)";


// connection.query(query, buffer, function (err, data) {
//     if (err) console.log(err);
//     connection.end();
// });


