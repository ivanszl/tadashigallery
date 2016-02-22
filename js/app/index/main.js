define('app/index/main', ['jquery', 'modal', 'route', './uploader', 'common', './show', 'ztree', 'tips'], function(require){
	require('modal'),require('ztree');
	var common = require('common'),
		Uploader = require('./uploader'),
		show = require('./show'),
		Route = require('route'),
		Tips = require('tips'),
		initFinished = false,
		loadedTree = false,
		setting = {
			async: {
				enable     : true,
				url        : common.queryUri,
				autoParam  : ["id"],
				otherParam : {"type":"folder"},
				type       : 'get'
			},
			callback: {
                onClick: function(a, b, c){
                    Route.go('go/' + c.id + '/1');
                },
                onAsyncSuccess: function(event, treeId, treeNode, msg) {
                	loadedTree = true;
                }
			}
		},
		searchInput = $('#J_SearForm input'),
		searchBtn = $('#J_SearForm button'),
		uploadModal = $('#uploaderModal'),
		mustRefresh = false,
		session = common.storeGet('tadashi_session'),
		uploader = new Uploader('#uploaderModal', {
			title               : '图片',
			extenstions         : 'jpg,jpeg,gif,png', 
			mimeTypes           : 'image/*',
			swf                 : './js/Uploader.swf',
			server              : common.uploadUri,
			fileNumLimit        : 300,
			fileSizeLimit       : 300 * 1024 * 1024,
			fileSingleSizeLimit : 2 * 1024 * 1024,
			onRemoveFile        : function() {},
			onSuccess           : function(response) {
				if (!response.success && !response.isLogin) {
					alert("你还未登录");
					window.location = 'login.html';
				} else if (!response.success){
					tipObj.show(response.errorMessage, true, true);
				}
			},
			onFinished          : function() {mustRefresh = true;}
		}),
		inputFolderName = $('#J_NewFoldername'),
		btnSubmit = $('#J_NewFolderSubmit'),
		modalFolder = $('#folderModal'),
		tipObj = new Tips();

	// 判断是否已经登录了
	if (session == null || session == '') {
		window.location = 'login.html';
		return;
	}

	tipObj.init();

	// 将ajax的完成事件绑定到document上，用于判断是否要进行跳转
	$(document).ajaxComplete(function (event, xhr, settings) {
		var url = xhr.getResponseHeader('X-Redirect');
		if (url) {
			window.location = url;
		}
	});
	// 提交数据前添加登录头信息
	$.ajaxPrefilter(function (options, originalOptions, xhr) {
		if (!options.crossDomain) {
			xhr.setRequestHeader('X-Tadashi-Session', session);
		}
	});

	var tree = $.fn.zTree.init($("#J_MainTree"), setting);

	$(window).on('resize.tuku', function(){
		var dh = $('.wrap').height() - 95;
		$('#J_PicContainer').height(dh);
	}).trigger('resize.tuku');

	// 点击提交新目录
	btnSubmit.on('click', function(){
		var name = inputFolderName.val().trim();
		if (name == '') {
			tipObj.show("文件夹名称不能为空", true, true);
		} else {
			tipObj.show('正在保存数据...', false);
			var node = tree.getSelectedNodes()[0];
			$.ajax({
				type: 'POST',
				url: common.addFolderUri,
				data: {name: name, parent_id: node.id},
				dataType: 'json'
			}).done(function(json){
				if (!json.success) {
					tipObj.show(json.errorMessage, true, true);
				} else {
					tree.addNodes(node, {isParent: !1,name: json.module.name,id: json.module.id, parent_id: json.module.parent_id});
					tipObj.hide();
					modalFolder.modal('hide');
				}
			}).fail(function(){
				tipObj.show('请求出错', true);
			});
		}
	});

	uploadModal.on('shown.bs.modal', function() {
		var node = tree.getSelectedNodes()[0];
		uploader.build(node.id, node.name, session);
	});

	uploadModal.on('hidden.bs.modal', function(){
		if (mustRefresh) {
			var node = tree.getSelectedNodes()[0];
			show.list(node.id, 1);
		}
	});

	$('#J_Crumbs').on('change.tadashi.folder', function(event, id){

		var node = tree.getNodesByParam("id", id, null)[0],
			lis = [];
		if (typeof node == 'undefined') return;
		if (node.id == 0) {
			lis.push('<li><i class="icon icon-pic"></i> ' + node.name + '</li>');
		}
		else {
			lis.push('<li>' + node.name + '</li>');
		}
		while (node.id != 0) {
			node = tree.getNodesByParam("id", node.parent_id, null)[0];
			if (node) {
				if (node.id == 0) {
					lis.push('<li><i class="icon icon-pic"></i> <a href="#!go/' + node.id + '/1">' + node.name + '</a></li>');
				} else {
					lis.push('<li><a href="#!go/' + node.id + '/1">' + node.name + '</a></li>');
				}
			} else {
				break;
			}
		}
		$(this).empty().append(lis.reverse().join(''));
	});

	searchBtn.on('click', function(){
		var val = $.trim(searchInput.val());
		if (val == '') { return }
		Route.go('search/' + val + '/1');
	});
	searchInput.on('keypress',function(event){
		if(event.keyCode == "13") {
			searchBtn.trigger('click');
		}
	});
	
	function expandNode(id) {
		var node = tree.getNodesByParam("id", id, null)[0];
		if (node) {
			tree.expandNode(node, true);
			tree.selectNode(node, false);
		}
	}
	Route.add('index', function(){
		initFinished = true;
		var f = function() {loadedTree?show.list(0, 1, function(){ expandNode(0)}):setTimeout(f, 150)};
		setTimeout(f, 150);
	});
	Route.add(/go\/(\d+)\/(\d+)/i, function(id, page){
		if (!initFinished) {
			Route.go('index');
			return;
		}
		expandNode(id);
		show.list(id, page);
	});
	Route.add(/search\/(.*)\/(\d+)/i, function(key, page){
		currentAlbumID = 0;
		show.search(key, page);
	});
	Route.init({
		key: '!',
		index: 'index'
	});
});