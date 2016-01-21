# Tadashi Gallery
Tadashi Gallery简称为TG，TG是一个类似于淘宝图片管理系统的简单版，便于将图片按文件夹进行分类管理，方便图片进行多次利用展示。

Version
======
This document describes TG v0.9.8 released on 21 January 2016.

Install
=======
install drizzle
```bash
$ wget https://openresty.org/download/drizzle7-2011.07.21.tar.gz
$ tar -xf drizzle7-2011.07.21.tar.gz
$ cd drizzle7-2011.07.21/
$ ./configure --without-server
$ make libdrizzle-1.0
$ make install-libdrizzle-1.0
```
install OpenResty
```bash
$ wget https://openresty.org/download/ngx_openresty-1.9.3.2.tar.gz
$ tar -xf ngx_openresty-1.9.3.2.tar.gz
$ cd ngx_openresty-1.9.3.2
$ ./configure --prefix=/opt/openresty --with-http_drizzle_module --with-lua51 --with-luajit --without-mail_pop3_module --without-mail_imap_module  --without-mail_smtp_module 
$ gmake
$ gmake install
$ ln -s /opt/openresty/nginx/conf /etc/nginx
```

install TG
```bash
$ git clone https://github.com/ivanszl/tadashigallery.git
$ cd tadashigallery
```

configure the common.js
```javascript
$ vim js/common.js
define(function(require, exports, modules){
	String.prototype.htmlEncode = function() {
		var tmp = document.createElement("div");
		(tmp.textContent != null) ? (tmp.textContent = this) : (tmp.innerText = this);
		var output = tmp.innerHTML;
 		tmp = null;
 		return output;
 	};
	String.prototype.htmlDecode = function() {
		var tmp = document.createElement("div");
		tmp.innerHTML = text;
		var output = tmp.innerText || tmp.textContent;
		tmp = null;
		return output;
	};
	String.prototype.jstpl_format = function(c) {
		function d(b, a) {
			if (a in c) {
				return c[a];
			}
			return "";
 		}
		return this.replace(/%\{([A-Za-z0-9_|.]+)\}/g, d);
	};
	modules.exports = {
		queryUri : '/query.html', // 查询文件、文件夹、搜索接口
		loginUri : '/login.html', // 登陆接口
		addFolderUri : '/add_folder.html', // 添加文件夹接口
		uploadUri : '/file_upload.html', // 文件上传接口
		delFileUri : '/delete_file.html', // 删除文件接口
		imageHost : 'http://images.linsongzheng.cn', // 图片访问域名 可以结合CDN来使用
		storeSave : function(key, val) {
			if (window.localStorage) {
				localStorage[key] = val;
			} else {
				var exp = new Date();
				exp.setTime(exp.getTime() + 365 * 24 * 60 * 60 * 1000);
				document.cookie = key + "=" + escape(val) + ";expire=" + exp.toGMTString();
			}
		},
		storeDelete : function(key) {
			if (window.localStorage) {
				localStorage.removeItem(key);
			} else {
				var exp = new Date();
				exp.setTime(exp.getTime() - 1);
				document.cookie = key + "=tadashi;expire=" + exp.toGMTString();
			}
		},
		storeGet : function(key) {
			if (window.localStorage) {
				return localStorage.getItem(key);
			} else {
				var arr,reg=new RegExp("(^| )"+key+"=([^;]*)(;|$)");
				return (arr=document.cookie.match(reg))?unescape(arr[2]):null;
			}
		},
		getCookie : function(key) {
			var arr,reg=new RegExp("(^| )"+key+"=([^;]*)(;|$)");
			return (arr=document.cookie.match(reg))?unescape(arr[2]):null;
		}
	}
});
```

modify the script/init.lua file
```lua
MYSQL = {
	host = '127.0.0.1',
	port = 3306,
	dbname = 'db_tuku',
	user = 'test',
	pwd = '123456'
}
 
TUKU = {
	user = 'tadashi', -- 登录用户名
	password = 'tuku123456' -- 登录密码
}
```

Detail
======
The detail infomation of this system can be obtained from the Tadashi Gallery introduce:
<http://blog.linsongzheng.com/archives/64.html>
