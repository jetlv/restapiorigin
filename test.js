/// <reference path="include.d.ts" />

var request = require('request');
var async = require('async');
var fs = require('fs');

var pst = 'http://localhost:1337/api/oauth/token';

var form = {
    "grant_type": "password",
    "client_id": "android",
    "client_secret": "SomeRandomCharsAndNumbers",
    "username": "myapi",
    "password": "abc1234"
}


function token_processer(callback) {
    request({ url: pst, form: form, method: 'POST' }, function (err, resp, body) {
        var tokens = JSON.parse(body);
        callback(null, tokens);
    });
}

function baseAccess(tokens, callback) {
    var access_token = tokens.access_token;
    var refresh_token = tokens.refresh_token;
    var f = {
        'Authorization': 'bearer ' + access_token
    }
    var url = 'http://localhost:1337/api/users/info?Authorization=bearer' + access_token;
    request({ url: url, method : 'GET'}, function (err, resp, body) {
        var users = JSON.parse(body);
        fs.appendFileSync('users.json', body);
        callback(null, 'done');
    });
}

async.waterfall([token_processer, baseAccess], function (err, msg) {
    console.log(msg);
});

//https://github.com/ealeksandrov/NodeAPI