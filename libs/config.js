/** nconf 相关文档 - https://github.com/indexzero/nconf */
var nconf = require('nconf');

nconf.argv()
	.env()
	.file({
		file: process.cwd() + '/config.json'
	});

module.exports = nconf;