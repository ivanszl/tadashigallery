define("app/index/uploader", ["jquery", "webuploader", "common"], function(require, exports, module){
	var common = require('common');

	// 添加的文件数量
	var fileCount = 0,
	// 添加的文件总大小
		fileSize = 0,
	// 可能有pedding, ready, uploading, confirm, done.
		state = 'pedding',
	// 所有文件的进度信息，key为file id
		percentages = {},
		supportTransition = (function(){
			var s = document.createElement('p').style,
			r = 'transition' in s ||
				'WebkitTransition' in s ||
				'MozTransition' in s ||
				'msTransition' in s ||
				'OTransition' in s;
			s = null;
			return r;
		})();

	function Uploader(element, options) {
		//容器对象
		this.$wrap = $(element);
		this.options = options || {title: '图片', extenstions: 'jpg,jpeg,gif,png', mimeTypes: 'image/*', swf: './swf/Uploader.swf', server: './file_upload', fileNumLimit: 300, fileSizeLimit: 300 * 1024 * 1024, fileSingleSizeLimit: 2 * 1024 * 1024};
		// 图片容器
		this.$queue = $('<ul class="fileList"></ul>').appendTo(this.$wrap.find('.queueList'));
		// 状态栏，包括进度和控制按钮
		this.$statusBar = this.$wrap.find('.statusBar');
		// 文件总体选择信息
		this.$info = this.$statusBar.find('.info');
		// 上传按钮
		this.$upload = this.$wrap.find('.uploadBtn');
		// 没选择文件之前的内容
		this.$placeHolder = this.$wrap.find('.placeholder');
		// 总体进度条
		this.$progress = this.$statusBar.find('.progress').hide();
		// 上传组件实例
		this.uploader = null;
		// 相册名称
		this.albumName = '我的图片';

		if ( !WebUploader.Uploader.support() ) {
 			alert( 'Web Uploader 不支持您的浏览器！如果你使用的是IE浏览器，请尝试升级 flash 播放器');
			throw new Error( 'WebUploader does not support the browser you are using.' );
		}

		var that = this;
		this.$upload.on('click', function() {
			if ( $(this).hasClass( 'disabled' ) ) {
				return false;
			}
			if ( state === 'ready' ) {
				that.uploader.upload();
			} else if ( state === 'paused' ) {
				that.uploader.upload();
			} else if ( state === 'uploading' ) {
				that.uploader.stop();
			}
		});
		this.$info.on( 'click', '.retry', function() {
			that.uploader.retry();
		} );
		this.$info.on( 'click', '.ignore', function() {
			that.uploader.reset();
		} );
		this.$upload.addClass( 'state-' + state );
	}

	module.exports = Uploader;

	Uploader.prototype.addFile = function(file) {
		var $li = $( '<li id="' + file.id + '">' + '<p class="title">' + file.name + '</p>' + '<p class="imgWrap"></p>'+ '<p class="progress"><span></span></p>' + '</li>' ),
			$btns = $('<div class="file-panel">' +'<span class="icon icon-trash"></span>' + '<span class="icon icon-refresh"></span>' + '<span class="icon undo icon-refresh"></span></div>').appendTo( $li ),
			$progress = $li.find('p.progress span'),
			$wrap = $li.find( 'p.imgWrap' ),
			$info = $('<p class="error"></p>'),
			showError = function( code ) { 
				switch( code ) {
					case 'exceed_size':
						text = '文件大小超出';
					break;
					case 'interrupt':
						text = '上传暂停';
					break;
					default:
						text = '上传失败，请重试';
					break;
				}
				$info.text( text ).appendTo( $li );
			};
		if ( file.getStatus() === 'invalid' ) {
			showError( file.statusText );
		} else {
			$wrap.text( '预览中' );
			var src = WebUploader.Runtime.Html5.Util.createObjectURL(file.source.getSource());
			$wrap.empty().append( '<img src="'+src+'">' );
			percentages[ file.id ] = [ file.size, 0 ];
			file.rotation = 0;
		}
		file.on('statuschange', function( cur, prev ) {
			if ( prev === 'progress' ) {
				$progress.hide().width(0);
			} else if ( prev === 'queued' ) {
				$li.off( 'mouseenter mouseleave' );
				$btns.remove();
			}
			// 成功
			if ( cur === 'error' || cur === 'invalid' ) {
				showError( file.statusText );
				percentages[ file.id ][ 1 ] = 1;
			} else if ( cur === 'interrupt' ) {
				showError( 'interrupt' );
			} else if ( cur === 'queued' ) {
				percentages[ file.id ][ 1 ] = 0;
			} else if ( cur === 'progress' ) {
				$info.remove();
				$progress.css('display', 'block');
			} else if ( cur === 'complete' ) {
				$li.append( '<span class="success"></span>' );
			}
			$li.removeClass( 'state-' + prev ).addClass( 'state-' + cur );
		});
		$li.on( 'mouseenter', function() {
			$btns.stop().animate({height: 30});
		});
		$li.on( 'mouseleave', function() {
			$btns.stop().animate({height: 0});
		});
		$btns.on( 'click', 'span', function() {
			var index = $(this).index(), deg;
			switch ( index ) {
				case 0:
					this.uploader.removeFile( file );
				return;
				case 1:
					file.rotation += 90;
					break;
				case 2:
					file.rotation -= 90;
					break;
			}
			if ( supportTransition ) {
				deg = 'rotate(' + file.rotation + 'deg)';
				$wrap.css({'-webkit-transform': deg, '-mos-transform': deg, '-o-transform': deg, 'transform': deg });
			} else {
				$wrap.css( 'filter', 'progid:DXImageTransform.Microsoft.BasicImage(rotation='+ (~~((file.rotation/90)%4 + 4)%4) +')');
			}
		});
		$li.appendTo( this.$queue );
	};

	//负责view的销毁
	Uploader.prototype.removeFile = function( file ) {
		var $li = $('#'+file.id);
		delete percentages[ file.id ];
		this.updateTotalProgress();
		$li.off().find('.file-panel').off().end().remove();
		if ($.type(this.options.onRemoveFile) == 'function') {
			this.options.onRemoveFile(file);
		}
	};

	Uploader.prototype.updateTotalProgress = function() {
		var loaded = 0,
			total = 0,
			spans = this.$progress.children(),
			percent;
		$.each( percentages, function( k, v ) {
			total += v[ 0 ];
			loaded += v[ 0 ] * v[ 1 ];
		} );
		percent = total ? loaded / total : 0;
		spans.eq( 0 ).text( Math.round( percent * 100 ) + '%' );
		spans.eq( 1 ).css( 'width', Math.round( percent * 100 ) + '%' );
		this.updateStatus();
	};

	Uploader.prototype.updateStatus = function() {
		var text = '', stats;
		if ( state === 'ready' ) {
			text = '选中' + fileCount + '张图片，共' + WebUploader.formatSize( fileSize ) + '。';
		} else if ( state === 'confirm' ) {
			stats = this.uploader.getStats();
			if ( stats.uploadFailNum ) {
				text = stats.uploadFailNum + '张照片上传失败，<a class="retry" href="#">重新上传</a>失败图片';
			}
		} else {
			stats = this.uploader.getStats();
			text = '共' + fileCount + '张（' + WebUploader.formatSize( fileSize ) + '），已上传' + stats.successNum + '张';
			if ( stats.uploadFailNum ) {
				text += '，失败' + stats.uploadFailNum + '张';
			}
		}
		this.$info.html( text );
	};

	Uploader.prototype.setState = function( val ) {
		var stats;
		if ( val === state ) {
			return;
		}
		this.$upload.removeClass( 'state-' + state ).addClass( 'state-' + val );
		state = val;
		switch ( state ) {
			case 'pedding':
				this.$placeHolder.removeClass( 'element-invisible' );
				this.$queue.parent().removeClass('filled');
				this.$queue.hide();
				this.$statusBar.addClass( 'element-invisible' );
				this.uploader.refresh();
				break;
			case 'ready':
				this.$placeHolder.addClass( 'element-invisible' );
				$( '#filePicker2' ).removeClass( 'element-invisible');
				this.$queue.parent().addClass('filled');
				this.$queue.show();
				this.$statusBar.removeClass('element-invisible');
				this.uploader.refresh();
				break;
			case 'uploading':
				$( '#filePicker2' ).addClass( 'element-invisible' );
				this.$progress.show();
				this.$upload.text( '暂停上传' );
				break;
			case 'paused':
				this.$progress.show();
				this.$upload.text( '继续上传' );
				break;
			case 'confirm':
				this.$progress.hide();
				this.$upload.text( '开始上传' ).addClass( 'disabled' );
				stats = this.uploader.getStats();
				if ( stats.successNum && !stats.uploadFailNum ) {
					this.setState( 'finish' );
					return;
				}
				break;
			case 'finish':
				stats = this.uploader.getStats();
				if (!stats.successNum) {
					state = 'done';
				}
				if ($.type(this.options.onFinished) == 'function') {
					this.options.onFinished();
				}
				break;
		}
		this.updateStatus();
	};

	Uploader.prototype.uploadSuccess = function(response) {
		if ($.type(this.options.onSuccess) == 'function') {
			this.options.onSuccess(response);
		}
	};

	Uploader.prototype.build = function(albumId, albumName, session) {
		if (this.uploader) {
			this.uploader.destroy();
			delete this.uploader;
		}
		this.albumName = albumName;
		this.uploader = WebUploader.create({
			pick: {
				id: '#filePicker',
				label: '点击选择图片'
			},
			dnd: '#webUploader .queueList',
			paste: document.body,
			accept: {
				title      : this.options.title,
				extensions : this.options.extenstions,
				mimeTypes  : this.options.mimeTypes
			},
			swf: this.options.swf,
			disableGlobalDnd: true,
			chunked: true,
			formData: {folder_id: albumId},
			server: this.options.server,
			fileNumLimit: this.options.fileNumLimit,
			fileSizeLimit: this.options.fileSizeLimit,
			fileSingleSizeLimit: this.options.fileSingleSizeLimit
		});
		// 头部添加SESSION信息
		if (session) {
			this.uploader.on('uploadBeforeSend', function(object, data, headers){
				headers['X-Tadashi-Session'] = session;
			});
		}
		// 加"添加文件"的按钮
		this.uploader.addButton({
			id: '#filePicker2',
			label: '继续添加'
		});
		var that = this;
		this.uploader.onUploadProgress = function (file, percentage) {
			var $li = $('#' + file.id),
				$percent = $li.find('.progress span');
			$percent.css('width', percentage * 100 + '%');
			percentages[file.id][1] = percentage;
			that.updateTotalProgress();
		};
		this.uploader.onFileQueued = function (file) {
			fileCount++;
			fileSize += file.size;
			if (fileCount === 1) {
				that.$placeHolder.addClass('element-invisible');
				that.$statusBar.show();
			}

			that.addFile(file);
			that.setState('ready');
			that.updateTotalProgress();
		};
		this.uploader.onFileDequeued = function (file) {
			fileCount--;
			fileSize -= file.size;

			if (!fileCount) {
				that.setState('pedding');
			}
			that.removeFile(file);
			that.updateTotalProgress();
		};
		this.uploader.onError = function (code) {
			alert('Eroor: ' + code);
		};
		this.uploader.onUploadSuccess = function(file, response) {
			that.uploadSuccess(response);
		};
		this.uploader.on('all', function (type, file, response) {
			switch (type) {
				case 'uploadFinished':
					that.setState('confirm');
				break;
				case 'startUpload':
					that.setState('uploading');
				break;
				case 'stopUpload':
					that.setState('paused');
				break;
			}
		});
		this.updateTotalProgress();
	};
});