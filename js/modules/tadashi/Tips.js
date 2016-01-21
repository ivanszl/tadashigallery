define('modules/tadashi/Tips', ['jquery'], function(require, exports, module){
    require('jquery');
    function Tips(options) {
        this.id = 'tadashi_' + (new Date()).getTime();
        this.options = $.extend({successCss: 'success', errorCss: 'error', css: 'page_tips', delay:3000}, options);
        this.timer   = null;
    }
    Tips.prototype.init = function() {
        this.element = $('#' + this.id);
        if (this.element.length == 0) {
            this.element = $('<div id="' + this.id + '" class="' + this.options.css + '"><div class="inner"></div></div>').appendTo(document.body);
        }
        this.message = this.element.find('.inner');
    };

    Tips.prototype.show = function(msg, auto, error) {
        if (!this.timer) {
            clearTimeout(this.timer);
        }
        var that = this;
        this.message.html(msg);
        this.element.removeClass(this.options.errorCss).removeClass(this.options.successCss).addClass(error ? this.options.errorCss : this.options.successCss).addClass('show');
        if (typeof auto == 'undefined' || auto == true)
            this.timer = setTimeout(function(){that.hide();}, this.options.delay);
    };

    Tips.prototype.hide = function() {
        clearTimeout(this.timer),this.timer = null,this.element.removeClass(this.options.successCss).removeClass('show').removeClass(this.options.errorCss);
    };
    module.exports = Tips;
});