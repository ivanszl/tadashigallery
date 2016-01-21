if ngx.var.raw ~= 'tadashi:tuku' then
	ngx.header['X-Redirect'] = 'login.html'
	return ngx.eof()
end

local file_id = ngx.var.arg_id or ''
local save_path = "/var/www/images"

if file_id == '' then
	ngx.print([[{"success": false, "errorMessage": "\u53c2\u6570\u51fa\u9519"}]])
	return ngx.eof()
end

local res = ngx.location.capture("/tuku_mysql", {args = { sql = string.format("SELECT file_path FROM files WHERE file_id=%s", ngx.quote_sql_str(file_id) ) } } )

if res and res.status == ngx.HTTP_OK then
	local cjson = require 'cjson'
	local d = cjson.decode(res.body)
	if d[1] then
		res = ngx.location.capture("/tuku_mysql", {args = { sql = string.format("DELETE FROM files WHERE file_id=%s", ngx.quote_sql_str(file_id) ) } } )
		if res and res.status == ngx.HTTP_OK then
			os.remove(save_path .. d[1].file_path)
			ngx.print([[{"success": true, "data": {"uri": "]] .. d[1].file_path .. [["}]])
		else
			ngx.print([[{"success": false, "errorMessage": "\u670d\u52a1\u5668\u5f00\u5c0f\u5dee\u4e86"}]])
		end
	else
		ngx.print([[{"success": false, "errorMessage": "\u53c2\u6570\u51fa\u9519"}]])
	end
end

return ngx.eof()