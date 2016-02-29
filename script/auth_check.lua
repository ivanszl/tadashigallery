if not ngx.var.http_x_tadashi_session and not ngx.var.cookie_tg_auth_key then
        if ngx.var.redirect_header ~= "1" then
                return ngx.redirect("login.html")
        else
        		ngx.header['content-type'] = 'application/json'
                ngx.header['X-Redirect'] = 'login.html'
                ngx.print([[{"success": false, "errorMessage": "\u8bf7\u9009\u62e9\u8981\u4e0a\u4f20\u7684\u6587\u4ef6", "isLogin": false}]])
                return ngx.eof()
        end
end
local session = ""
if ngx.var.http_x_tadashi_session then
        session = ndk.set_var.set_decode_base32(ngx.var.http_x_tadashi_session)
else
        session = ndk.set_var.set_decode_base32(ngx.unescape_uri(ngx.var.cookie_tg_auth_key))
end

local raw = ndk.set_var.set_decrypt_session(session)
if raw ~= 'tadashi:tuku' then
        if ngx.var.redirect_header ~= "1" then
                return ngx.redirect("login.html")
        else
                ngx.header['content-type'] = 'application/json'
                ngx.header['X-Redirect'] = 'login.html'
                ngx.print([[{"success": false, "errorMessage": "\u8bf7\u9009\u62e9\u8981\u4e0a\u4f20\u7684\u6587\u4ef6", "isLogin": false}]])
                return ngx.eof()
        end
end