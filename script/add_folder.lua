
if ngx.var.raw ~= 'tadashi:tuku' then
	ngx.header['X-Redirect'] = 'login.html'
	return ngx.eof()
end

ngx.header['content-type'] = 'application/json'
ngx.req.read_body()
local cjson = require 'cjson'
local args = ngx.req.get_post_args()
local result = { success = true }
if args.name == '' then
	result.success = false
	result.errorMessage = '文件夹名称不能为空'
else
	local res = ngx.location.capture("/tuku_mysql", {args = { sql = string.format("SELECT COUNT(*) AS c FROM folders WHERE parent_id=%s AND folder_name=%s", args.parent_id, ngx.quote_sql_str(args.name))}})
	if res and res.status == ngx.HTTP_OK then
		local d = cjson.decode(res.body)
		if d[1].c > 0 then
			result.success = false
			result.errorMessage = '文件夹已经存在了'
		else
			res = ngx.location.capture("/tuku_mysql", {args = { sql = string.format("INSERT INTO folders(folder_name,parent_id, created_at)VALUES(%s, %s, %d)", ngx.quote_sql_str(args.name), args.parent_id, ngx.time())}})
			if res and res.status == ngx.HTTP_OK then
				local d = cjson.decode(res.body)
				if d.errcode == 0 then
					result.module = {
						parent_id = args.parent_id,
						id = d.insert_id,
						name = args.name
					}
				else
					result.success = false
					result.errorMessage = "服务器繁忙"
				end
			else
				result.success = false
				result.errorMessage = "服务器繁忙"
			end
		end
	else
		result.success = false
		result.errorMessage = "服务器繁忙"
	end
end
ngx.print(cjson.encode(result))
return ngx.eof()