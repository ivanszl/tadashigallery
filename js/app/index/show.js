define('app/index/show', ['jquery', 'common', 'tips', 'zeroClipboard', 'route'], function(require, exports, module){
	var common = require('common'),
		Tips = require('tips'),
		Route = require('route'),
		ZeroClipboard = require('zeroClipboard'),
		tpl = [
			'<div class="item">',
			'<div class="image">',
			'<div class="base-msg">',
			'<div class="img-container"><img src="',
			common.imageHost,
			'%{path}.%{ext}" alt="%{title}"></div>',
			'<div class="img-name" title="%{title}">%{title}</div>',
			'<input type="text" value="%{title}" />',
			'<ul class="handle clearfix">',
			'<li class="clipboard" data-clipboard-text="%{url}" title="复制链接"><span class="icon icon-link"></span></li>',
			'<li class="delete" data-val="%{id}" title="删除文件"><span class="icon icon-trash"></span></li>',
			'</ul>',
			'</div>',
			'</div>',
			'</div>' ].join(''),
		folderTpl = [
			'<div class="item">',
			'<div class="folder" data-val="%{id}">',
			'<div class="base-msg">',
			'<div class="folder-msg">',
			'<div class="without-img"></div>',
			'</div>',
			'<div class="folder-name" title="%{title}">%{title}</div>',
			'<input type="text" value="%{title}" />',
			'</div>',
			'</div>',
			'</div>'
			].join(''),
		tipObj = new Tips(),
		zeroClipboard = null,
		renderPagination = function(id, current, total, pagesize, act){
			act = act || 'go';
			current = parseInt(current);
			total = parseInt(total);
			pagesize = parseInt(pagesize);

			var pages = Math.ceil(total / pagesize),
				li = [],
				star = current - 2 > 1 ? current - 2 : 1,
				end = current > pages - 2 ? pages : current + 2;

			if (current > 1) {
				li.push('<li><a href="#!' + act + '/' + id + '/' + (current - 1) + '" aria-label="上一页"><span aria-hidden="true">«</span></a></li>');
			} else {
				li.push('<li class="disabled"><span aria-hidden="true">«</span></li>');
			}
			for(var i = star; i < current;i++)
			{
				li.push('<li><a href="#!' + act + '/' + id + '/' + i + '">' + i + '</a></li>');
			}
			li.push('<li class="active"><span>' + current + '</span></li>');
			for(var i = current + 1; i <= end; i++) {
				li.push('<li><a href="#!' + act +'/' + id + '/' + i + '">' + i + '</a></li>');
			}
			if (pages > current) {
				li.push('<li><a href="#!' + act + '/' + id + '/' + (current + 1) + '" aria-label="下一页"><span aria-hidden="true">»</span></a></li>');
			} else {
				li.push('<li class="disabled"><span aria-hidden="true">»</span></li>');
			}
			$('#J_PageFooter').html('<div class="col-xs-offset-3"><ul class="pagination">' + li.join('') + '</ul></div>');
		},
		gotoFolder = function(id){
			$('#J_Crumbs').trigger('change.tadashi.folder', [id]);
		},
		listData = function(json) {
			var html = "";
			for(var i = 0, n = json.data.length; i < n; i++)
			{
				var data = json.data[i];
				if (data.is_folder == 0) {
					data.url = encodeURIComponent(common.imageHost + data.path + '.' + data.ext);
					html += tpl.jstpl_format(data);
				} else {
					html += folderTpl.jstpl_format(data);
				}
			}
			var h = $(html), elems = h.find('.handle li.clipboard'), lis = h.find('.handle li'), folder = h.find('.folder');
			$('#J_Picture').html('').append(h);
			elems.on('mouseover.tadashi.tuku', function(){
				$(this).parents('.item').addClass('on');
			}).on('mouseout.tadashi.tuku', function(e){
				$(this).parents('.item').removeClass('on');
				e.stopPropagation();
			});
			folder.on('click', function(){
				Route.go('go/' + $(this).data('val') + '/1');
			});
			lis.on('click', function(){
				var that = $(this), id = that.attr('data-val');
				if (that.hasClass('delete')) {
					$.getJSON(common.delFileUri, {id: id}, function(json){
						if (json.success) {
							tipObj.show("删除成功");
							that.parents('.item').remove();
						} else {
							tipObj.show(json.errorMessage, true, true);
						}
					});
				}
			});
			zeroClipboard && zeroClipboard.destroy();
			zeroClipboard = new ZeroClipboard(elems);
			zeroClipboard.on('ready', function() {
				zeroClipboard.on("copy", function(e) {
					e.clipboardData.setData('text/plain', decodeURIComponent(e.client.getData()['text/plain']));
					tipObj.show('复制成功');
					$(document).trigger('click');
				});
			});
		},
		listPicture = function(id, page, callback) {
			gotoFolder(id);
			tipObj.show('<i class="icon icon-loading icon-spin"></i>正在加载数据...', false);
			var ajax = $.ajax({
				dataType: 'json',
				url: common.queryUri,
				data: {folder_id: id, offset :page, type: 'file'}
			}).done(function(json){
				if (json.success) {
					var html = '';
					tipObj.hide();
					if (typeof callback == 'function') {
						callback.apply(json);
					}
					listData(json);
					renderPagination(id, page, json.total, json.size, 'go');
				} else {

				}
			}).fail(function(){
				tipObj.hide();
				tipObj.show('请求出错');
			});
		},
		searchPicture = function(key, page) {
			gotoFolder(key);
			tipObj.show('<i class="icon icon-loading icon-spin"></i>正在加载数据...', false);
			var ajax = $.ajax({
				dataType: 'json',
				url: common.queryUri,
				data: {q: key, offset :page, type: 'search'}
			}).done(function(json){
				if (json.success) {
					var html = '';
					tipObj.hide();
					listData(json);
					renderPagination(key, page, json.total, json.size, 'search');
				} else {
					tipObj.show(json.errorMessage);
				}
			}).fail(function(){
				tipObj.hide();
				tipObj.show('请求出错');
			});

		};
		tipObj.init();
		module.exports = {
			name: 'show',
			list: listPicture,
			search: searchPicture
		}
});
