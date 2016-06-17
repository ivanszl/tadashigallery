local cjson = require 'cjson'

ngx.header['content-type'] = 'application/json'
ngx.req.read_body()
local args = ngx.req.get_post_args()
local result = { success = true }
if args.name == '' then
	result.success = false
	result.errorMessage = '名称不能为空'
else
	if not args.type or args.type == '' or not args.id or args.id == '' then
		result.success = false
		result.errorMessage = '参数出错了'
	else
		local sql = ''
		if args.type == 'folder' then
			sql = string.format("UPDATE folders SET folder_name=%s WHERE id=%s", ngx.quote_sql_str(args.name), ngx.quote_sql_str(args.id))
		else
			sql = string.format("UPDATE files SET title=%s WHERE file_id=%s", ngx.quote_sql_str(args.name), ngx.quote_sql_str(args.id))
		end
		local res = ngx.location.capture("/tuku_mysql", {args = { sql = sql}})
		if res and res.status == ngx.HTTP_OK then
			local d = cjson.decode(res.body)
			if d.errcode ~= 0 then
				result.success = false
				result.errorMessage = "服务器繁忙"
			end
		else
			result.success = false
			result.errorMessage = "服务器繁忙"
		end
	end
end
ngx.print(cjson.encode(result))
return ngx.eof()