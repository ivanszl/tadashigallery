local folder_id = ngx.var.arg_folder_id or (ngx.var.arg_id or 0)
local offset = tonumber(ngx.var.arg_offset or 0)
local query_type = ngx.var.arg_type or 'folder'
local q = ngx.unescape_uri(ngx.var.arg_q or '')

offset = offset - 1

-- 列出目录
if query_type == 'folder' then
	if folder_id == 0 then
		ngx.print('[{"id": 0,"name":"我的图库","isParent":true}]')
	else
		ngx.exec('/tuku_mysql', { sql = string.format("SELECT `id`,`folder_name` AS name,'true' AS isParent, parent_id FROM `folders` WHERE parent_id=%s AND id<>%s ORDER BY created_at ASC", folder_id, folder_id)})
	end
	return
end

-- 搜索模块
if query_type == 'search' then
	local res = ngx.location.capture("/tuku_mysql", {args = { sql = string.format("SELECT COUNT(*) AS c FROM files WHERE title LIKE %s", ngx.quote_sql_str('%' .. q .. '%'))}})
	local cjson = require "cjson"
	local result = {
		success = true
	}
	if not res or res.status ~= ngx.HTTP_OK then
		result.success = false
		result.errorMessage = "服务器繁忙"
	else
		
		local d = cjson.decode(res.body)
		res = ngx.location.capture("/tuku_mysql", {args = { sql = string.format("SELECT file_id AS id, title, file_path AS path, file_ext AS ext, file_size AS size FROM files WHERE title LIKE %s ORDER BY created_at ASC LIMIT %d, 40", ngx.quote_sql_str('%' .. q .. '%'), offset * 40 )}})
		if res and res.status == ngx.HTTP_OK then
			result.total = d[1].c
			result.size = 40
			if res.body == '' then
				result.data = {}
			else
				result.data = cjson.decode(res.body)
			end
		else
			result.success = false
			result.errorMessage = "服务器繁忙"
		end
	end
	ngx.print(cjson.encode(result))
	return
end

-- 列出某个目录上的图片跟子目录
local cjson = require "cjson"
local mysql = require "resty.mysql"
local db = mysql:new()
db:set_timeout(1000)
local ok, err, errno, sqlstate = db:connect({
	host = MYSQL.host,
	port = MYSQL.port,
	database = MYSQL.dbname,
	user = MYSQL.user,
	password = MYSQL.pwd,
	max_packet_size = 10485760
	})
local result = {
	success = true
}
if not ok then
	result.success = false
	result.errorMessage = err
	ngx.print(cjson.encode(result))
	return
end

local res, err, errno, sqlstate

local size, surplus, total, folders = 0, 40
res, err, errno, sqlstate = db:query(string.format("SELECT COUNT(*) AS c FROM folders WHERE parent_id=%s", ngx.quote_sql_str(folder_id)))
if not res then
	result.success = false
	result.errorMessage = err
	ngx.print(cjson.encode(result))
	return ngx.eof()
end
folders = tonumber(res[1].c)
total = folders
res, err, errno, sqlstate = db:query(string.format("SELECT COUNT(*) AS c FROM folder_files WHERE folder_id=%s", ngx.quote_sql_str(folder_id)))
if not res then
	result.success = false
	result.errorMessage = err
	ngx.print(cjson.encode(result))
	return ngx.eof()
end
total = total + tonumber(res[1].c)


if offset > 0 then
	size = folders - (offset - 1) * 40
	if size < 0 then
		size = folders
	end
end
if size >= (offset - 1) * 40 then
	res, err, errno, sqlstate = db:query(string.format("SELECT id, folder_name AS title, 1 AS is_folder, parent_id FROM folders WHERE parent_id=%s AND id<>%s ORDER BY created_at ASC LIMIT %d, 40", ngx.quote_sql_str(folder_id), folder_id, offset * 40))

	if not res then
		result.success = false
		result.errorMessage = err
		ngx.print(cjson.encode(result))
		return
	end

	result.data = res
	size = size + #res
	surplus = surplus - #res
else
	result.data = {}
end


if surplus > 0 then
	offset = (offset * 40) - size
	if offset < 0 then
		offset = 0
	end
	res, err, errno, sqlstate = db:query(string.format("SELECT file.file_id AS id, file.title AS title, file.file_path AS path, file.file_ext AS ext, file_size AS size, 0 AS is_folder FROM files AS file LEFT JOIN folder_files AS folder ON file.file_id=folder.file_id WHERE folder_id=%s ORDER BY created_at ASC LIMIT %d, %d", ngx.quote_sql_str(folder_id), offset, surplus))

	if not res then
		result.success = false
		result.errorMessage = err
		ngx.print(cjson.encode(result))
		return
	end
	for i,v in ipairs(res) do
		table.insert(result.data, v)
	end
end
result.total = total
result.size = 40

local parent_id = tonumber(folder_id)
result.level = {parent_id}

while(parent_id > 0)
	do
	res, err, errno, sqlstate = db:query(string.format("SELECT parent_id FROM folders WHERE id=%d", parent_id))
	if res then
		if #res > 0 then
			parent_id = tonumber(res[1].parent_id)
			table.insert(result.level, parent_id)
		end
	else
		parent_id = 0
	end
end

ngx.print(cjson.encode(result))
db:set_keepalive(10000, 100)
