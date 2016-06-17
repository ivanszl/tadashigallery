local config = require 'config'
local cjson = require 'cjson'

ngx.header['content-type'] = 'application/json'
ngx.req.read_body()
local args = ngx.req.get_post_args()
local formhash = ngx.var.cookie_formhash

local hash = ngx.md5(config.TUKU.user .. '|' .. config.TUKU.password .. '|' .. formhash)
local result = {success = true}
if args.uname == config.TUKU.user
	and args.password == config.TUKU.password
	and args.hash == hash then
	result.session = ndk.set_var.set_encode_base32(ndk.set_var.set_encrypt_session("tadashi:tuku"))
else
	result.success = false
	result.errorMessage = "认证出错"
end
ngx.print(cjson.encode(result))