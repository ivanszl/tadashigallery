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