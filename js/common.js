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
    queryUri     : 'http://www.linsongzheng.com/query.html',
    deleteUri    : 'http://www.linsongzheng.com/delete.html',
    loginUri     : '/tuku/login.html',
    addFolderUri : '/add_folder.html',
    uploadUri    : '/file_upload.html',
    delFileUri   : '/delete_file.html',
    imageHost    : 'http://images.bigka.cn',
    storeSave    : function(key, val) {
        if (window.localStorage) {
            localStorage[key] = val;
        } else {
             var exp = new Date();
              exp.setTime(exp.getTime() + 365 * 24 * 60 * 60 * 1000);
            document.cookie = key + "=" + escape(val) + ";expire=" + exp.toGMTString();
        }
    },
    storeDelete  : function(key) {
        if (window.localStorage) {
            localStorage.removeItem(key);
        } else {
            var exp = new Date();
            exp.setTime(exp.getTime() - 1);
            document.cookie = key + "=tadashi;expire=" + exp.toGMTString();
        }
    },
    storeGet    : function(key) {
        if (window.localStorage) {
            return localStorage.getItem(key);
        } else {
            var arr,reg=new RegExp("(^| )"+key+"=([^;]*)(;|$)");
            return (arr=document.cookie.match(reg))?unescape(arr[2]):null;
        }
    },
    getCookie  : function(key) {
        var arr,reg=new RegExp("(^| )"+key+"=([^;]*)(;|$)");
        return (arr=document.cookie.match(reg))?unescape(arr[2]):null;
    }
    }
});