/// <reference path="include.d.ts" />

var request = require('request');

var pst = 'http://localhost:1337/api/oauth/token';

var form = {
    "grant_type": "password",
    "client_id": "android",
    "client_secret": "SomeRandomCharsAndNumbers",
    "username": "myapi",
    "password": "abc1234"
}

request({url : pst, form : form, method : 'POST'}, function(err, resp, body) {
    console.log(body);
});

//https://github.com/ealeksandrov/NodeAPI