local _M = {VERSION = '0.9.8'}
_M.default = {
	MYSQL = {
		host = '127.0.0.1',
		port = 3306,
		dbname = 'db_tuku',
		user = 'test',
		pwd = '123456'
	},
	TUKU = {
		user = 'tadashi',
		password = 'tuku123456',
		save_path = '/var/www/images'
	}
}

return _M[ngx.var.project_confg]
