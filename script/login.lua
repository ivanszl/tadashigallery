ngx.header['content-type'] = 'application/json'
ngx.req.read_body()
local cjson = require 'cjson'
local args = ngx.req.get_post_args()
local formhash = ngx.var.cookie_formhash

local hash = ngx.md5(TUKU.user .. '|' .. TUKU.password .. '|' .. formhash)
local result = {success = true}
if args.uname == TUKU.user
	and args.password == TUKU.password
	and args.hash == hash then
	result.session = ndk.set_var.set_encode_base32(ndk.set_var.set_encrypt_session("tadashi:tuku"))
else
	result.success = false
	result.errorMessage = "认证出错"
end
ngx.print(cjson.encode(result))