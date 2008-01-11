(function() {

    var Y = YAHOO,
        U = Y.util,
        D = U.Dom,
        L = Y.lang,
        W = Y.widget;

    // Widget API
    function SliderThumb(attributes) {
        this.constructor.superclass.constructor.apply(this, arguments);
    }

    // Widget API
    SliderThumb.NAME = "SliderThumb";

    // Widget API
    SliderThumb.CONFIG = {
        'group' : {},

        'minX' : {
            value : 0
        },

        'maxX' : {
            value : 0
        },

        'minY' : {
            value : 0
        },

        'maxY' : {
            value : 0
        },

        'tickSize' : {
            validator : function(val) {
                return (L.isNumber(val) && val >= 0);
            },
            value : 0
        },

        'x' : {
            set : function(val) {
                return this._constrain(val, SliderThumb.X);
            },
            value : 0
        },

        'y' : {
            set : function(val) {
                return this._constrain(val, SliderThumb.Y);
            },
            value : 0
        },

        'locked' : {
            value : false
        }
    };

    // Widget Static Constants
    SliderThumb.X = "X";
    SliderThumb.Y = "Y";

    L.extend(SliderThumb, W.Widget, {

        // Widget API
        initializer: function (attributes) {
            // Can Remove. Left in for Ref Impl. readability
        },

        // Widget API
        renderer : function() {
            this._centerPoint = this.findCenter();

            this.initDD();
            this.initUI();
        },

        lock : function() {
            this.set("locked", true);
        },

        unlock : function() {
            this.set("locked", false);
        },

        isLocked : function() {
            return this.get("locked");
        },

        getValue: function () {
            var p = this.parent, v;
            if (p._isRegion) {
                v = [this.getXValue(), this.getYValue()];
            } else if (p._isVert){
                v = this.getYValue();
            } else {
                v = this.getXValue();
            }
            return v;
        },

        getXValue: function () {
            return this.get("x");
        },

        getYValue: function () {
            return this.get("y");
        },

        getXRange :  function() {
            return this.get("maxX") - this.get("minX");
        },

        getYRange : function() {
            return this.get("maxY") - this.get("minY");
        },

        // UI Methods

        initDD : function() {

            var w = this,
                xs = this.getXScale(),
                ys = this.getYScale();

            var dd = new U.DD( this.getThumbEl().id, w.get("group"));

            dd.isTarget = false;
            dd.maintainOffset = true;
            dd.scroll = false;

            dd.setInitPosition();

            dd.setXConstraint( w.get("minX") * xs, w.get("maxX") * xs, w.get("tickSize") * xs);
            dd.setYConstraint( w.get("minY") * ys, w.get("maxY") * ys, w.get("tickSize") * ys);

            this._dd = dd;
        },

        getOffsetFromParent: function(parentPos) {

            var thumbEl = this.getThumbEl();
            var offset;

            if (!this.deltaOffset) {
                var thumbPos = D.getXY(thumbEl);
                parentPos = parentPos || D.getXY(this.getParentEl());

                offset = [ (thumbPos[0] - parentPos[0]), (thumbPos[1] - parentPos[1]) ];

                var l = parseInt( D.getStyle(thumbEl, "left"), 10 );
                var t = parseInt( D.getStyle(thumbEl, "top" ), 10 );
                var deltaX = l - offset[0];
                var deltaY = t - offset[1];

                if (!isNaN(deltaX) && !isNaN(deltaY)) {
                    this.deltaOffset = [deltaX, deltaY];
                }
            } else {
                var left = parseInt( D.getStyle(thumbEl, "left"), 10 );
                var top  = parseInt( D.getStyle(thumbEl, "top" ), 10 );
                offset  = [left + this.deltaOffset[0], top + this.deltaOffset[1]];
            }
            return offset;
        },

        getUIValue : function() {
            var p = this.parent, v;
            if (p._isHoriz) {
                v = this.getUIXValue();
            } else if (p._isVert) {
                v = this.getUIYValue();
            } else {
                v = [this.getUIXValue(), this.getUIYValue()];
            }
            return v;
        },

        getUIXValue : function() {
            return Math.round(this.getOffsetFromParent()[0]/this.getXScale());
        },

        getUIYValue : function() {
            return Math.round(this.getOffsetFromParent()[1]/this.getYScale());
        },

        setXOffset : function() {
            this.moveThumb(this.getOffsetForX(), null);
        },

        setYOffset : function() {
            this.moveThumb(null, this.getOffsetForY());
        },

        getXScale : function() {
            var range = this.getXRange();
            if (range > 0) {
                var uirange = this.getParentEl().offsetWidth - this.getThumbEl().offsetWidth;
                return Math.round(uirange/range);
            } else {
                return 0;
            }
        },

        getYScale : function() {
            var range = this.getYRange();
            if (range > 0) {
                var uirange = this.getParentEl().offsetHeight - this.getThumbEl().offsetHeight;
                return Math.round(uirange/range);
            } else {
                return 0;
            }
        },

        getOffsetForX : function(x) {
            var diff = this.getXValue() - this.get("minX");
            var offset = diff * this.getXScale() + this._centerPoint.x;

            var parentOffsetX = D.getXY(this.getParentEl())[0];
            return parentOffsetX + offset;
        },

        getOffsetForY : function(y) {
            var diff = this.getYValue() - this.get("minY");
            var offset = diff * this.getYScale() + this._centerPoint.y;
            var parentOffsetY = D.getXY(this.getParentEl())[1];
            return parentOffsetY + offset;
        },
        
        getThumbEl : function() {
            return this._node;
        },

        getParentEl : function() {
            return this.parent._node;
        },

        initUI : function() {
            this.addUIListeners();
        },

        addUIListeners : function() {
            this.on("xChange", this.setXOffset, this, true);
            this.on("yChange", this.setYOffset, this, true);
            this.on("tickSize", this._uiSetTickSize, this, true);
            this.on("lockedChange", this._uiSetLock, this, true);

            this.on("render", this.syncUI, this, true);
        },

        syncUI : function() {
            this._uiSetTickSize();
            this._uiSetLock();
            this.setYOffset();
            this.setXOffset();
        },

        findCenter : function() {
            var t = this.getThumbEl();
            return {
                x: parseInt(t.offsetWidth/2, 10),
                y: parseInt(t.offsetHeight/2, 10) 
            };
        },

        moveThumb : function(x, y) {
            var curCoord = D.getXY(this.getThumbEl());
            var cp = this._centerPoint;

            if (!x && x !== 0) {
                x = curCoord[0] + cp.x;
            }
            if (!y && y !== 0) {
                y = curCoord[1] + cp.y;
            }
            this._dd.setDelta(cp.x, cp.y);

            if (this.fireEvent("beforeMove", [x, y, curCoord]) !== false) {
                this.move(x, y);
                this.fireEvent("move");
            }
        },

        move : function(x, y) {
            this._dd.setDragElPos(x, y);
            this._endMove();
        },

        // TODO: Setup as move listener
        _endMove : function() {
            this.parent._endMove();
        },

        _constrain : function(val, axis) {

            var min = this.get("min" + axis);
            var max = this.get("max" + axis);

            var tSize = this.get("tickSize");

            if(val < min) {
                val = min;
            } else if (val > max){
                val = max;
            } else {
                if (tSize > 0) {
                    var diff = val % tSize;
                    if (diff > 0) {
                        if (diff < Math.round(tSize/2)) {
                            val = val - diff;
                        } else {
                            val = val + (tSize - diff);
                        }
                    }
                }
            }
            return val;
        },

        _uiSetTickSize : function() {
            if (this.get("tickSize") === 0) {
                this._dd.clearTicks();
            }
        },

        _uiSetLock : function() {
            var dd = this._dd;
            if (this.get("locked")) {
                dd.lock();
            } else {
                dd.unlock();
            }
        },

        _centerPoint : null,
        _dd : null
    });

    W.SliderThumb = SliderThumb;

})();

(function() {

    // var SliderModule = function(YAHOO) {

    var Y = YAHOO,
        U = Y.util,
        E = U.Event,
        D = U.Dom,
        L = Y.lang,
        W = Y.widget;

    function Slider(attributes) {
        this.constructor.superclass.constructor.apply(this, arguments);
    }

    // Widget API - Used for class name, event prefix, toString etc.
    Slider.NAME = "Slider";

    // Slider Specific Constants
    Slider.INC = 1;
    Slider.DEC = -1;
    Slider.REGION = "region";
    Slider.HORIZ = "horiz";
    Slider.VERT = "vert";

    // Widget API
    Slider.CONFIG = {
        group : {},
        thumb : {},
        type : {
            set : function(val) {
                if (val == Slider.REGION) {
                    this._isRegion = true;
                } else if (val == Slider.HORIZ) {
                    this._isHoriz = true;
                } else {
                    this._isVert = true;
                }
            },
            value : Slider.HORIZ,
            validator : function(val) {
                return (val == Slider.HORIZ || val == Slider.VERT || val == Slider.REGION);
            }
        },
        bgEnabled : {
            value:true
        },
        keysEnabled : {
            value:true 
        },
        keyIncrement : {
            value:20
        },
        locked : {
            value: false
        }
    };

    L.extend(Slider, W.Widget, {

        // Widget API
        initializer : function(attributes) {
            this.initThumb();
        },

        // Widget API
        renderer : function() {
            this._baselinePos = D.getXY(this.getBackgroundEl());

            this.getThumb().render();

            this.initDD();
            this.initUI();
        },

        initThumb: function() {
            var t =  this.getThumb();
            t.parent = this;
        },

        getThumb: function() {
            return this.get("thumb");
        },

        lock: function() {
            this.set("locked", true);
        },

        unlock: function() {
            this.set("locked", false);
        },

        isLocked : function() {
            return this.get("locked");
        },

        getValue: function () { 
            return this.getThumb().getValue();
        },

        setValueToMin : function() {
            this._setValToLimit(false);
        },

        setValueToMax : function() {
            this._setValToLimit(true);
        },

        setValue: function(val, force, silent) {
            if ( this.isLocked() && !force ) {
                return false;
            }
            if ( isNaN(val) ) {
                return false;
            }

            var t = this.getThumb();
            if (this._isRegion) {
                return false;
            } else if (this._isHoriz) {
                t.set("x", val, silent);
            } else if (this._isVert) {
                t.set("y", val, silent);
            }
        },

        setRegionValue: function(valX, valY, force, silent) {
            if (this.isLocked() && !force) {
                return false;
            }
            if ( isNaN(valX) && isNaN(valY)) {
                return false;
            }

            var t = this.getThumb();
            if (valX || valX === 0) {
                t.set("x", valX, silent);
            }
            if (valY || valY === 0) {
                t.set("y", valY, silent);
            }
        },

        stepYValue : function(dir) {
            var i = this.get("keyIncrement") * dir;

            var newY = this.getThumb().getYValue() + i; 
            if (this._isVert) {
                this.setValue(newY);
            } else if (this._isRegion) {
                this.setRegionValue(null, newY);
            }
        },

        stepXValue : function(dir) {
            var i = this.get("keyIncrement") * dir;

            var newX = this.getThumb().getXValue() + i;
            if (this._isHoriz) {
                this.setValue(newX);
            } else if (this._isRegion) {
                this.setRegionValue(newX, null);
            }
        },

        getBackgroundEl : function() {
            return this._node;
        },

        focus: function() {
            this._focusEl();
            if (this.isLocked()) {
                return false;
            } else {
                this._slideStart();
                return true;
            }
        },

        initDD : function() {
            this._dd = new U.DragDrop(
                this.getBackgroundEl().id, 
                this.get("group"), 
                true);

            this._dd.setInitPosition();
            this._dd.isTarget = false;
        },

        initUI : function() {
            // Events Fired in the UI, Update Model
            this.addKeyListeners();
            this.addDDListeners();
            this.addThumbDDListeners();

            // Events Fired in the Model, Update/Refresh View
            this.addUIListeners();
        },

        addKeyListeners: function() {
            var bg = this.getBackgroundEl();
            E.on(bg, "keydown",  this._onKeyDown,  this, true);
            E.on(bg, "keypress", this._onKeyPress, this, true);
        },

        addDDListeners : function() {
            var self = this,
                sDD = this._dd;

            sDD.b4MouseDown = function(e) {self._beforeBGMouseDown(e);};
            sDD.onDrag = function(e) {self._onBGDrag(e);};
            sDD.onMouseDown = function(e) {self._onBGMouseDown(e);};

            this.on(Slider.E.EndMove, this.syncValue, this, true);
        },

        addThumbDDListeners : function() {
            var self = this,
                tDD = this.getThumb()._dd;

            tDD.onMouseDown = function(e) {self._onThumbMouseDown(e);};
            tDD.startDrag = function(e) {self._onThumbStartDrag(e);};
            tDD.onDrag = function(e) {self._onThumbDrag(e);};
            tDD.onMouseUp = function(e) {self._onThumbMouseUp(e);};
        },

        addUIListeners : function() {
            this.on("lockedChange", this._uiSetLock, this, true);
        },

        syncUI : function() {
            this._uiSetLock();
        },

        syncValue : function() {
            var val = this.getThumb().getUIValue();
            if (this._isRegion) {
                this.setRegionValue(val[0], val[1], false, true);
            } else {
                this.setValue(val, false, true);
            }
        },

        _uiSetLock : function() {
            var dd = this._dd;
            var t = this.getThumb();
            if (this.get("locked")) {
                dd.lock();
                t.lock();
            } else {
                dd.unlock();
                t.unlock();
            }
        },

        _beforeBGMouseDown: function(e) {
            var dd = this.getThumb()._dd;
            dd.autoOffset();
            dd.resetConstraints();
        },

        _onBGMouseDown: function(e) {
            if (!this.isLocked() && this.get("bgEnabled")) {
                this.focus();
                this._moveThumb(e);
            }
        },

        _onBGDrag: function(e) {
            if (!this.isLocked()) {
                this._moveThumb(e);
            }
        },

        _onThumbMouseDown : function (e) { 
            return this.focus(); 
        },

        _onThumbStartDrag : function(e) { 
            this._slideStart(); 
        },

        _onThumbDrag : function(e) {
            this.syncValue();
            this._fireEvents(true);
        },

        _onThumbMouseUp: function(e) {
            if (!this.isLocked() && !this.moveComplete) {
                this._endMove();
            }
        },

        _onKeyPress: function(e) {
            if (this.get("keysEnabled")) {
                switch (E.getCharCode(e)) {
                    case 0x25: // left
                    case 0x26: // up
                    case 0x27: // right
                    case 0x28: // down
                    case 0x24: // home
                    case 0x23: // end
                        E.preventDefault(e);
                        break;
                    default:
                }
            }
    
        },

        _onKeyDown: function(e) {
            var s = Slider;

            if (this.get("keysEnabled")) {
                var changed = true;
                switch (E.getCharCode(e)) {
                    case 0x25:  // left 
                        this.stepXValue(s.DEC);
                        break;
                    case 0x26:  // up
                        this.stepYValue(s.DEC);
                        break;
                    case 0x27:  // right
                        this.stepXValue(s.INC);
                        break;
                    case 0x28:  // down
                        this.stepYValue(s.INC);
                        break;
                    case 0x24:  // home
                        this.setValueToMin();
                        break;
                    case 0x23:  // end
                        this.setValueToMax();
                        break;
                    default:
                        changed = false;
                }
                if (changed) {
                    E.stopEvent(e);
                }
            }
        },

        _setValToLimit : function(minOrMax) {
            var str = (minOrMax) ? "max" : "min",
                t = this.getThumb(),
                s = W.SliderThumb,
                x = s.X,
                y = s.Y;

            if (this._isRegion) {
                this.setRegionValue(t.get(str + x), t.get(str + y));
            } else if (this._isVert) {
                this.setValue(t.get(str + y));
            } else {
                this.setValue(t.get(str + x));
            }
        },

        _slideStart: function() {
            if (!this._sliding) {
                this.fireEvent(Slider.E.SlideStart);
                this._sliding = true;
            }
        },

        _slideEnd: function() {
            if (this._sliding && this.moveComplete) {
                this.fireEvent(Slider.E.SlideEnd);
                this._sliding = false;
                this.moveComplete = false;
            }
        },

        _focusEl : function() {
            var el = this.getBackgroundEl();
            if (el.focus) {
                try {
                    el.focus();
                } catch(e) {
                }
            }
            this._verifyOffset();
        },

        _endMove: function () {
            this.unlock();
            this.moveComplete = true;

            this.fireEvent(Slider.E.EndMove);
            this._fireEvents();
        },
        
        _verifyOffset: function(checkPos) {
            var newPos = D.getXY(this.getBackgroundEl());
            if (newPos) {
                if (newPos[0] != this._baselinePos[0] || newPos[1] != this._baselinePos[1]) {
                    this.getThumb()._dd.resetConstraints();
                    this._baselinePos = newPos;
                    return false;
                }
            }
            return true;
        },

        _cachePosition : function() {
            this.getThumb()._dd.cachePosition();        
        },

        _moveThumb : function(e) {
            var x = E.getPageX(e);
            var y = E.getPageY(e);
            this.getThumb().moveThumb(x, y);
        },

        _fireEvents: function (thumbEvent) {
            var t = this.getThumb();

            if (!thumbEvent) {
                this._cachePosition();
            }

            if (!this.isLocked()) {
                if (this._isRegion) {
                    var newX = t.getXValue();
                    var newY = t.getYValue();

                    if (newX != this.previousX || newY != this.previousY) {
                      this.fireEvent(Slider.E.Change, { x: newX, y: newY });
                    }

                    this.previousX = newX;
                    this.previousY = newY;
                } else {
                    var newVal = t.getValue();
                      if (newVal != this.previousVal) {
                        this.fireEvent(Slider.E.Change, newVal);
                      }
                      this.previousVal = newVal;
                }
                this._slideEnd();
            }
        },

        _dd : null
    });

    // Widget Specific Static Methods    
    Slider.getHorizSlider = function (sliderId, thumbId, minX, maxX, iTickSize) {
        var thumb = new W.SliderThumb({
                id: thumbId,  
                group: sliderId,
                minX: minX,
                maxX: maxX,
                minY: 0,
                maxY: 0,
                tickSize: iTickSize
        });
        return new Slider({ id: sliderId, group: sliderId, thumb : thumb, type: Slider.HORIZ });
    };

    Slider.getVertSlider = function (sliderId, thumbId, minY, maxY, iTickSize) {
        var thumb = new W.SliderThumb({ 
                id: thumbId,  
                group: sliderId,
                minY: minY,
                maxY: maxY,
                minX: 0,
                maxX: 0,
                tickSize: iTickSize
        });
        return new Slider({ id: sliderId, group: sliderId, thumb : thumb, type: Slider.VERT });
    };

    Slider.getRegionSlider = function (sliderId, thumbId, minX, maxX, minY, maxY, iTickSize) {
        var thumb = new W.SliderThumb({  
                id : thumbId,
                group: sliderId, 
                minX: minX,
                maxX: maxX,
                minY: minY,
                maxY: maxY,
                tickSize: iTickSize
        });
        return new Slider({ id: sliderId, group: sliderId, thumb : thumb, type: Slider.REGION });
    };

    // Widget API - Event Strings : TODO
    Slider.E = {
        SlideStart : "slideStart",
        SlideEnd : "slideEnd",
        EndMove: "endMove",
        Change: "change"
    };

    W.Slider = Slider;

//    };
//
//    YUI.add("slider", "widget", SliderModule , "3.0.0");

})();

YAHOO.register("slider", YAHOO.widget.Slider, {version: "@VERSION@", build: "@BUILD@"});
