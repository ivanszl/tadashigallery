# Tadashi Gallery
Tadashi Gallery简称为TG，TG是一个类似于淘宝图片管理系统的简单版，便于将图片按文件夹进行分类管理，方便图片进行多次利用展示。

Version
======
This document describes TG v0.9.9 released on 21 January 2016.

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

configure the nginx server
```bash
$ mkdir -p /etc/nginx/{vhost,backend}
$ vim /etc/nginx/nginx.conf
```
nginx configure
```bash
user www;
worker_processes 1;
 
#error_log logs/error.log;
#error_log logs/error.log notice;
#error_log logs/error.log info;
 
pid /var/run/nginx.pid;
 
worker_rlimit_nofile 65535;
events {
    worker_connections 65535;
    multi_accept on;
}
 
 
http {
    include mime.types;
    default_type application/octet-stream;
 
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
 
    keepalive_timeout 5;
    client_header_timeout 10;
    client_body_timeout 120;
    reset_timedout_connection on;
    send_timeout 3600;
    gzip on;
    gzip_min_length 1k;
    gzip_buffers 4 64k;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/x-javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_vary on;
 
    client_header_buffer_size 32k;
    large_client_header_buffers 4 64k;
    client_max_body_size 200m;
 
    open_file_cache max=100000 inactive=20s;
    open_file_cache_valid 30s;
    open_file_cache_min_uses 2;
    open_file_cache_errors on;
 
    resolver 10.202.72.118 10.202.72.116;
    lua_package_path '/opt/openresty/lualib/?.lua;;';
    lua_package_cpath '/opt/openresty/lualib/?.so;;';
    include conf/backend/*.enable;
    include conf/vhost/*.enable;
}
```
add vhost configure file
```bash
$ vim /etc/nginx/vhost/tuku.enable
 
init_by_lua_file '/var/www/html/tadashigallery/script/init.lua';
server {
    listen 80;
    server_name tuku.linsongzheng.com;
    access_log logs/tuku.access.log main;
    error_log logs/tuku.error.log;
    root /var/www/html/tadashigallery;
    index index.html;
    location ~ ^/(query|add_folder|file_upload|delete_file|rename).html$ {
        default_type applcation/json;
        set $redirect_header 1;
        access_by_lua_file /var/www/html/tadashigallery/script/auth_check.lua; 
        content_by_lua_file /var/www/html/tadashigallery/script/$1.lua;
    }
    location /tuku/index.html {
        access_by_lua_file /var/www/html/tadashigallery/script/auth_check.lua;
        alias /var/www/html/tadashigallery/index.html;
    }
    location /login.html {
        default_type text/html;
        if ($request_method = POST) {
            content_by_lua_file /var/www/html/tadashigallery/script/login.lua;
        }
        alias /var/www/html/tadashigallery/login.html;
        if ($cookie_formhash = '') {
            access_by_lua "
                local ip = ngx.var.binary_remote_addr
                local hash = ngx.md5(ip .. (ngx.time() / 7200))
                ngx.header['Set-Cookie'] = {'formhash=' .. hash}
            ";
        }
    }
    location =/auth {
        content_by_lua_file /var/www/html/tadashigallery/script/auth.lua;
    }
    encrypted_session_key "abcdefghijklmnopqrstuvwxyz123456";
    encrypted_session_iv "abcdefok12345678";
    encrypted_session_expires 1d;
    location /tuku_mysql {
        internal;
        add_header Access-Control-Allow-Origin *;
        set_unescape_uri $sql $arg_sql;
        drizzle_pass tuku;
        drizzle_module_header off;
        drizzle_connect_timeout 500ms;
        drizzle_send_query_timeout 2s;
        drizzle_recv_cols_timeout 1s;
        drizzle_recv_rows_timeout 1s;
        drizzle_query $sql;
        rds_json on;
    }
    location ~ \.(js|css)$ {
        expires 30d;
    }
}
```

add drizzle backend configure file
```bash
$ vim /etc/nginx/backend/tuku.enable
 
upstream tuku {
    drizzle_server 127.0.0.1:3306 dbname=db_tuku password=123456 user=tuku protocol=mysql;
}
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
	var common = {
        queryUri     : '/query.html',
        deleteUri    : '/delete.html',
        loginUri     : '/login.html',
        addFolderUri : '/add_folder.html',
        uploadUri    : '/file_upload.html',
        delFileUri   : '/delete_file.html',
        renameUri    : '/rename.html',
        imageHost    : 'http://images.linsongzheng.com',
        storeSave    : function(key, val) {
            if (window.localStorage) {
                localStorage[key] = val;
            } else {
                common.setCookie(key, val, 365 * 24 * 3600);
            }
        },
        storeDelete  : function(key) {
            if (window.localStorage) {
                localStorage.removeItem(key);
            } else {
                common.setCookie(key, 'tadashi', -1);
            }
        },
        storeGet    : function(key) {
            if (window.localStorage) {
                return localStorage.getItem(key);
            } else {
                return common.getCookie(key);
            }
        },
        setCookie  : function(key, val, expire) {
            var exp = new Date();
            exp.setTime(exp.getTime() + expire * 1000);
            document.cookie = key + "=" + escape(val) + ";expire=" + exp.toGMTString();
        },
        getCookie  : function(key) {
            var arr,reg=new RegExp("(^| )"+key+"=([^;]*)(;|$)");
            return (arr=document.cookie.match(reg))?unescape(arr[2]):null;
        }
    };
    modules.exports = common;
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

Auth
====
可以通过第三方应用登陆时授权，自动登陆本系统。
只需要在第三方应用登陆后添加以下代码。
```html
<script type="text/javascript" src="http://tuku.linsongzheng.com/auth?key=$access_key&token=$token"></script>
```
在表`access_token` 中创建 access_key 和 access_secret 用于第三方登陆。
token 的生成如下所示
```php
$time = $time();
$token = md5(($time - $time % 300) . '|' . $access_secret);
```
Detail
======
The detail infomation of this system can be obtained from the Tadashi Gallery introduce:
<http://blog.linsongzheng.com/archives/64.html>
