local cjson = require 'cjson.safe'
local key = ngx.var.arg_key
local token = ngx.var.arg_token
ngx.header.content_type = 'text/javascript'

if not key or not token then
	return ngx.eof()
end


local res = ngx.location.capture("/tuku_mysql", {args = {
	sql = string.format("SELECT access_secret FROM access_token WHERE access_key=%s", ngx.quote_sql_str(key))
	}
})
if res and res.status == ngx.HTTP_OK then
	local d = cjson.decode(res.body)
	if d and d[1] then
		local secret = d[1].access_secret
		local time = ngx.time()
		time = time - time % 300;
		if ngx.md5(string.format('%d|%s', time, secret)) == token then
			ngx.header['Set-Cookie'] = string.format('tg_auth_key=%s; path=/; Expires=%s',
				ndk.set_var.set_encode_base32(ndk.set_var.set_encrypt_session("tadashi:tuku")),
				ngx.cookie_time(ngx.time() + 24 * 3600)
			)
		end
	end
end
return ngx.eof()