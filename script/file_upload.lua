ngx.header['content-type'] = 'application/json'

local upload = require "resty.upload"
local resty_md5 = require "resty.md5"
local str = require "resty.string"
local save_path = TUKU.save_path
local chunk_size = 4096
local form, err = upload:new(chun_size)
if not form then
        ngx.print([[{"success": false, "errorMessage": "\u8bf7\u9009\u62e9\u8981\u4e0a\u4f20\u7684\u6587\u4ef6"}]])
        return
end
local file
local ext
local has_file = false
local current_field
local folder_id = ''
local filelen = 0
form:set_timeout(0) -- 无限时长
local filename = ''
local uri
local md5 = resty_md5:new()

function get_field(res)
	local it = ngx.re.gmatch(res, '([a-z]+)="([^"]+)"', "i")
	if not it then
		return nil
	else
		return it()
	end
end

while true do
	local typ, res, err = form:read()
	if not typ then
		ngx.print('{"success": false, "errorMessage": "' .. err .. '"}')
		return
	end
	if typ == 'header' then
		if res[1] == "Content-Type" then
			if res[2] ~= 'image/jpg' and res[2] ~= 'image/jpeg' and res[2] ~= 'image/png' and res[2] ~= 'video/mp4' then
				ngx.print([[{"success": false, "errorMessage": "\u53ea\u80fd\u4e0a\u4f20jpg, png, mp4\u7b49\u6587\u4ef6"}]])
				if file then
					file:close()
				end
				return
			end
			if res[2] == 'image/jpg' or res[2] == 'image/jpeg' then
				ext = 'jpg'
			end
			if res[2] == 'image/png' then
				ext = 'png'
			end
			if res[2] == 'video/mp4' then
				ext = 'mp4'
			end
		end
		if res[1] == "Content-Disposition" then
			local field, err = get_field(res[2])
			if field then
				current_field = field[2]
				if current_field == 'file' then
					has_file = true
					tmpfile = ngx.md5(ngx.var.remote_addr .. ngx.now())
					file = io.open("/tmp/" .. tmpfile, "w+")
				end
			end
		end
	elseif typ == 'body' then
		if current_field == 'name' then
			filename = filename .. res
		end
		if current_field == 'f' then
			folder_id = folder_id .. res
		end
		if file then
			filelen = filelen + tonumber(string.len(res))
			file:write(res)
			md5:update(res)
		end
	elseif typ == 'part_end' then
		if current_field == 'name' then
			filename = string.gsub(filename, "%.%w-$", '')
		end
		if file then
			file:close()
			file = nil
			local digest = md5:final()
			md5:reset()

			local name = str.to_hex(digest)
			local f = string.sub(name, -2, -2)
			local l = string.sub(name, -1)
			local path = string.format("/%s/%s/", f, l)
			uri = string.format("%s%s.%s", path, name, ext)
			os.execute('mkdir -p ' .. save_path .. path)
			os.execute("mv -f /tmp/" .. tmpfile .. ' ' .. save_path .. uri)
			if ext == 'jpg' or ext == 'jpeg' then
				os.execute("jpegtran -copy none -optimize -outfile " .. save_path .. uri .. " " .. save_path .. uri .. "&")
			end
			if ext == "png" then
				os.execute("pngquant --speed 11 --quality 95-99 --ext .png -f " .. save_path .. uri .. "&")
			end
			local res = ngx.location.capture("/tuku_mysql", {args = { sql = string.format("INSERT INTO files(`file_id`,`title`, `file_ext`, `file_path`, `file_size`, `created_at`) VALUES (%s, %s, %s, %s, %d, %d) ON DUPLICATE KEY UPDATE created_at=VALUES(created_at)",
					ngx.quote_sql_str(name),
					ngx.quote_sql_str(filename),
					ngx.quote_sql_str(ext),
					ngx.quote_sql_str(path .. name),
					filelen,
					ngx.time()
				) } })
			if not res and res.status ~= ngx.HTTP_OK then
				ngx.print([[{"success": false, "errorMessage": "\u670d\u52a1\u5668\u5f00\u5c0f\u5dee\u4e86"}]])
				return ngx.eof()
			end
			
			if folder_id == '' then
				folder_id = '0'
			end
			ngx.location.capture("/tuku_mysql", {args = { sql = string.format("INSERT INTO folder_files(`folder_id`, `file_id`) VALUES(%s, %s)", ngx.quote_sql_str(folder_id), ngx.quote_sql_str(name)) } } )
		end
	elseif typ == 'eof' then
		break
	end
end
if has_file then
	ngx.print([[{"success": true, "data":{"uri": "]] .. uri .. [["}}]])
else
	ngx.print([[{"success": false, "msg": "\u8bf7\u9009\u62e9\u8981\u4e0a\u4f20\u7684\u6587\u4ef6"}]])
end
return ngx.eof()
