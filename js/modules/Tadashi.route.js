var Tadashi = Tadashi || {version:'0.9.8'};
Tadashi.emptyFn = function(){};
Tadashi.route = function(win, doc){
    var body = doc.getElementsByTagName('body')[0],
        laHash = '`',
        lash,
        Regex = [],
        key = '/',
        index,
        L,
        LL,
        popstate = function(){
            if (laHash == location.hash)
                return;
            route.lash = lash = location.hash.substring(key.length + 1);
            L = lash.split('/');
            var i = Regex.length;
            while(i--) if(LL = lash.match(Regex[i][0])) {
                LL[0] = Regex[i][1];
                L = LL;
                break;
            }
            if (!route[L[0]]) {
                location.hash = '#' + key + index;
                route.lash = index;
                return;
            }

            if (route.pop)
                route.pop.apple(win, L);
            laHash = location.hash;
            route[L.shift()].apply(win, L);
        },
        route = {
            lash: '',
            init: function(opt) {
                opt = opt || {}
                if (opt.key !== undefined)
                    key = opt.key;
                index = opt.index || 'D';

                if (opt.pop && typeof opt.pop == 'function')
                    p.pop = opt.pop;

                popstate();

                'onhashchange' in win ? win.onhashchange = popstate : setInterval(function(){
                    if (laHash != location.hash) {
                        popstate();
                        laHash = location.hash;
                    }
                }, 150);

                return this;
            },
            add: function(r, u) {
                if (typeof r == 'undefined')
                    return;

                // 过滤掉为空或者为对象的处理函数
                if (typeof u == 'undefined' || typeof u == 'object')
                    u = Tadashi.emptyFn;

                if (r instanceof RegExp) {
                    if(typeof u == 'function') {
                        var fn = 'F' + (('8' + Math.random()).substring(3) * 1).toString(16);
                        route[fn] = u;
                        u = fn;
                    }
                    Regex.push([r,u])
                } else if (r instanceof Array) {
                    for (var i in r) {
                        L = [].concat(r[i]).concat(u);
                        route.add.apply(this, L);
                    }
                } else if (r instanceof Object) {
                    for (var i in  r) {
                        L = [].concat(i).concat(r[i]);
                        route.add.apply(this, L);
                    }
                } else if (typeof r == 'string') {
                    if (typeof u == 'function') {
                        route[r] = u;
                    } else if (typeof u == 'string') {
                        route[r] = route[u];
                    }
                }
                return this;
            },
            D: function() {
                return this;
            },
            go: function(p) {
                location.hash = '#' + key + p;
                return this;
            },
            back: function() {
                history.back();
                return this;
            }
        };
    return route;
}(this, document);