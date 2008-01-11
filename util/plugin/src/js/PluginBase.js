(function() {
    var PluginBase = function(config) {
        PluginBase.superclass.constructor.apply(this, arguments);
    };

    PluginBase.CONFIG = {
        'owner': {},
        'node': {},
        'name': {
            value:'abstractplugin'
        }
    };

    var proto = {

        _listeners: null,
        _overrides: null,

        initializer : function(config) {
            /* ?? 
            var node = null;

            if (config.owner.get && config.owner.get('node')) {
                node = config.owner.get('node');
            }

            this.set('owner', config.owner, true);
            this.set('node', node, true);
            this.set('name', this.name, true);
            */

            this._listeners = [];
            this._overrides = [];

            YAHOO.log('Initializing: ' + this.get('name'), 'info', 'PluginBase');
        },
        destructor: function() {
            for (var i = 0; i < this._listeners.length; i++) {
                var event = this._listeners[i];
                if (YAHOO.lang.isObject(event)) {
                    event.obj.unsubscribe(event.ev, event.fn);
                }
            }
            for (var i = 0; i < this._overrides.length; i++) {
                var o = this._overrides[i];
                if (YAHOO.lang.isObject(o)) {
                    o.obj[o.method] = o.fn;
                    this._overrides[i] = null;
                }
            }
        },
        listen: function(obj, ev, fn, s, o) {
            this._listeners[this._listeners.length] = { obj: obj, ev: ev, fn: fn };
            obj.on(ev, fn, s, o);
        },
        nolisten: function(obj, ev, fn) {
            obj.unsubscribe(ev, fn);
            for (var i = 0; i < this._listeners.length; i++) {
                if ((this._listeners[i].ev == ev) && (this._listeners[i].fn == fn) && (this._listeners[i].obj == obj)) {
                    this._listeners[i] = null;
                    break;
                }
            }
        },
        listenBefore: function(obj, ev, fn, s, o) {
            ev = 'before' + ev.charAt(0).toUpperCase() + ev.substr(1) + 'Change';
            this.listen(obj, ev, fn, s, o);
        },
        nolistenBefore: function(obj, ev, fn) {
            ev = 'before' + ev.charAt(0).toUpperCase() + ev.substr(1) + 'Change';
            this.nolisten(obj, ev, fn);
        },
        addOverride: function(obj, method, fn) {
            if (YAHOO.lang.isFunction(obj[method]) && YAHOO.lang.isFunction(fn)) {
                this._overrides[this._overrides.length] = { method: method, obj: obj, fn: obj[method] };
                obj[method] = fn;
            } else {
                YAHOO.log('Method (' + method + ') does not belong to object', 'error', 'PluginBase');
            }
        },
        removeOverride: function(obj, method) {
            for (var i = 0; i < this._overrides.length; i++) {
                var o = this._overrides[i];
                if ((o.obj == obj) && (o.method == method)) {
                    obj[method] = o.fn;
                    this._overrides[i] = null;
                }
            }
        },
        setSilent: function(obj, config, val) {
            obj._configs[config].value = val;
        },
        toString: function() {
            return this.name;
        }
    };

    YAHOO.lang.extend(PluginBase, YAHOO.util.Object, proto);
    YAHOO.namespace('plugin');
    YAHOO.plugin.PluginBase = PluginBase;
})();
