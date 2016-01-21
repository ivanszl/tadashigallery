define('app/login/main', ['jquery', 'md5', 'common'], function(require){
	require('jquery');
	var md5 = require('md5'),
		common = require('common'),
		form = $('#login-form'),
		input = form.find('input').filter('[type!=checkbox]'),
		formhash = common.getCookie('formhash'),
		param = '',
		data = {},
		username = common.storeGet('tadashi_username';
	if (username) {
		form.find('input[name=uname]').val(username);
	}
	form.submit(function(){
		input.each(function(){
			var that = $(this);
			data[that.attr('name')] = $.trim(that.val());
		});
		if (data.uname == '' || data.password == '') {
			return false;
		}
		data.hash = md5.hex_md5(data.uname + '|' + data.password + '|' + formhash);
		var remember = $('#J_remember:checked').length > 0;
		$.post(common.loginUri, data, function(json){
			console.log(json);
			if (json.success) {
				if (remember) {
					common.storeSave('tadashi_username', data.uname);
				}
				common.storeSave('tadashi_session', json.session);
				window.location = 'index.html';
			} else {

			}
		});
		return false;
	});
});