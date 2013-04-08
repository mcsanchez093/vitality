/*
 * loader.js
 *
 * Copyright (c) 2012 'PerfectWorks' Ethan Zhang
 * Licensed under the MIT license.
 * https://github.com/gruntjs/grunt/blob/master/LICENSE-MIT
 */

/*jslint browser: true*/

(function (window) {
    'use strict';
    if (window.define) {
        return;
    }

    function isFunction(obj) {
        return Object.prototype.toString.call(obj) === '[object Function]';
    }

    var MM = {};
    var initModuleName = null;
    var scripts = window.document.getElementsByTagName('script');

    var i;
    for (i = 0; i < scripts.length && !initModuleName; i++) {
        initModuleName = scripts[i].getAttribute('data-main');
    }

    if (!initModuleName) {
        throw new Error('No data-main attribute in script tag.');
    }

    var require;

    var runModule = function runModule(name) {
        var exports = {};
        var module = MM[name];

        if (isFunction(MM[name].factory)) {
            var ret = MM[name].factory.apply(undefined, [require, exports, undefined]); // Argument 'module' hasn't been implemented yet.
            module.ret = ret === undefined ? exports : ret;
        } else {
            module.ret = MM[name].factory;
        }
        module.inited = true;
    };

    require = function require(name) {
        if (!MM[name]) {
            throw new Error('Module ' + name + ' is not defined.');
        }

        var module = MM[name];

        if (module.inited === false) {
            runModule(name);
        }

        return module.ret;
    };

    var define = function define(name, deps, factory) {
        if (MM[name]) {
            throw new Error('Module ' + name + ' has been defined already.');
        }

        if (isFunction(deps)) {
            factory = deps;
        }

        MM[name] = {
            factory: factory,
            inited: false
        };

        if (name === initModuleName) {
            runModule(name);
        }
    };

    window.define = define;
}(window));
;
/**
 * Created with JetBrains WebStorm.
 * User: lihui
 * Date: 13-3-21
 * Time: 下午1:50
 * To change this template use File | Settings | File Templates.
 */
define("plug-in/tooltip", function(require, exports, module) {
    !function($) {
        "use strict";
        /* TOOLTIP PUBLIC CLASS DEFINITION
         * =============================== */
        var Tooltip = function(element, options) {
            this.init("tooltip", element, options);
        };
        Tooltip.prototype = {
            constructor: Tooltip,
            init: function(type, element, options) {
                var eventIn, eventOut;
                this.type = type;
                this.$element = $(element);
                this.options = this.getOptions(options);
                this.enabled = true;
                if (this.options.trigger === "click") {
                    this.$element.on("click." + this.type, this.options.selector, $.proxy(this.toggle, this));
                } else if (this.options.trigger != "manual") {
                    eventIn = this.options.trigger == "hover" ? "mouseenter" : "focus";
                    eventOut = this.options.trigger == "hover" ? "mouseleave" : "blur";
                    this.$element.on(eventIn + "." + this.type, this.options.selector, $.proxy(this.enter, this));
                    this.$element.on(eventOut + "." + this.type, this.options.selector, $.proxy(this.leave, this));
                }
                this.options.selector ? this._options = $.extend({}, this.options, {
                    trigger: "manual",
                    selector: ""
                }) : this.fixTitle();
            },
            getOptions: function(options) {
                options = $.extend({}, $.fn[this.type].defaults, options, this.$element.data());
                if (options.delay && typeof options.delay == "number") {
                    options.delay = {
                        show: options.delay,
                        hide: options.delay
                    };
                }
                return options;
            },
            enter: function(e) {
                var self = $(e.currentTarget)[this.type](this._options).data(this.type);
                if (!self.options.delay || !self.options.delay.show) return self.show();
                clearTimeout(this.timeout);
                self.hoverState = "in";
                this.timeout = setTimeout(function() {
                    if (self.hoverState == "in") self.show();
                }, self.options.delay.show);
            },
            leave: function(e) {
                var self = $(e.currentTarget)[this.type](this._options).data(this.type);
                if (this.timeout) clearTimeout(this.timeout);
                if (!self.options.delay || !self.options.delay.hide) return self.hide();
                self.hoverState = "out";
                this.timeout = setTimeout(function() {
                    if (self.hoverState == "out") self.hide();
                }, self.options.delay.hide);
            },
            show: function() {
                var $tip, inside, pos, actualWidth, actualHeight, placement, tp;
                if (this.hasContent() && this.enabled) {
                    $tip = this.tip();
                    this.setContent();
                    if (this.options.animation) {
                        $tip.addClass("fade");
                    }
                    placement = typeof this.options.placement == "function" ? this.options.placement.call(this, $tip[0], this.$element[0]) : this.options.placement;
                    inside = /in/.test(placement);
                    $tip.remove().css({
                        top: 0,
                        left: 0,
                        display: "block"
                    }).appendTo(inside ? this.$element : document.body);
                    pos = this.getPosition(inside);
                    actualWidth = $tip[0].offsetWidth;
                    actualHeight = $tip[0].offsetHeight;
                    switch (inside ? placement.split(" ")[1] : placement) {
                      case "bottom":
                        tp = {
                            top: pos.top + pos.height,
                            left: pos.left + pos.width / 2 - actualWidth / 2
                        };
                        break;

                      case "top":
                        tp = {
                            top: pos.top - actualHeight,
                            left: pos.left + pos.width / 2 - actualWidth / 2
                        };
                        break;

                      case "left":
                        tp = {
                            top: pos.top + pos.height / 2 - actualHeight / 2,
                            left: pos.left - actualWidth
                        };
                        break;

                      case "right":
                        tp = {
                            top: pos.top + pos.height / 2 - actualHeight / 2,
                            left: pos.left + pos.width
                        };
                        break;
                    }
                    $tip.css(tp).addClass(placement).addClass("in");
                }
            },
            setContent: function() {
                var $tip = this.tip(), title = this.getTitle();
                $tip.find(".tooltip-inner")[this.options.html ? "html" : "text"](title);
                $tip.removeClass("fade in top bottom left right");
            },
            hide: function() {
                var that = this, $tip = this.tip();
                $tip.removeClass("in");
                function removeWithAnimation() {
                    var timeout = setTimeout(function() {
                        $tip.off($.support.transition.end).remove();
                    }, 500);
                    $tip.one($.support.transition.end, function() {
                        clearTimeout(timeout);
                        $tip.remove();
                    });
                }
                $.support.transition && this.$tip.hasClass("fade") ? removeWithAnimation() : $tip.remove();
                return this;
            },
            fixTitle: function() {
                var $e = this.$element;
                if ($e.attr("title") || typeof $e.attr("data-original-title") != "string") {
                    $e.attr("data-original-title", $e.attr("title") || "").removeAttr("title");
                }
            },
            hasContent: function() {
                return this.getTitle();
            },
            getPosition: function(inside) {
                return $.extend({}, inside ? {
                    top: 0,
                    left: 0
                } : this.$element.offset(), {
                    width: this.$element[0].offsetWidth,
                    height: this.$element[0].offsetHeight
                });
            },
            getTitle: function() {
                var title, $e = this.$element, o = this.options;
                title = $e.attr("data-original-title") || (typeof o.title == "function" ? o.title.call($e[0]) : o.title);
                return title;
            },
            tip: function() {
                return this.$tip = this.$tip || $(this.options.template);
            },
            validate: function() {
                if (!this.$element[0].parentNode) {
                    this.hide();
                    this.$element = null;
                    this.options = null;
                }
            },
            enable: function() {
                this.enabled = true;
            },
            disable: function() {
                this.enabled = false;
            },
            toggleEnabled: function() {
                this.enabled = !this.enabled;
            },
            toggle: function() {
                this[this.tip().hasClass("in") ? "hide" : "show"]();
            },
            destroy: function() {
                this.hide().$element.off("." + this.type).removeData(this.type);
            }
        };
        /* TOOLTIP PLUGIN DEFINITION
         * ========================= */
        $.fn.tooltip = function(option) {
            return this.each(function() {
                var $this = $(this), data = $this.data("tooltip"), options = typeof option == "object" && option;
                if (!data) $this.data("tooltip", data = new Tooltip(this, options));
                if (typeof option == "string") data[option]();
            });
        };
        $.fn.tooltip.Constructor = Tooltip;
        $.fn.tooltip.defaults = {
            animation: true,
            placement: "top",
            selector: false,
            template: '<div class="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',
            trigger: "hover",
            title: "",
            delay: 0,
            html: true
        };
    }(window.jQuery);
});;
/**
 * Created with JetBrains WebStorm.
 * User: lihui
 * Date: 13-3-27
 * Time: 下午2:26
 * To change this template use File | Settings | File Templates.
 */
define("plug-in/popover", function(require, exports, module) {
    require("plug-in/tooltip");
    /* ===========================================================
     * bootstrap-popover.js v2.1.1
     * http://twitter.github.com/bootstrap/javascript.html#popovers
     * ===========================================================
     * Copyright 2012 Twitter, Inc.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     * http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     * =========================================================== */
    !function($) {
        "use strict";
        // jshint ;_;
        /* POPOVER PUBLIC CLASS DEFINITION
         * =============================== */
        var Popover = function(element, options) {
            this.init("popover", element, options);
        };
        /* NOTE: POPOVER EXTENDS BOOTSTRAP-TOOLTIP.js
         ========================================== */
        Popover.prototype = $.extend({}, $.fn.tooltip.Constructor.prototype, {
            constructor: Popover,
            setContent: function() {
                var $tip = this.tip(), title = this.getTitle(), content = this.getContent();
                $tip.find(".popover-title")[this.options.html ? "html" : "text"](title);
                $tip.find(".popover-content > *")[this.options.html ? "html" : "text"](content);
                $tip.removeClass("fade top bottom left right in");
            },
            hasContent: function() {
                return this.getTitle() || this.getContent();
            },
            getContent: function() {
                var content, $e = this.$element, o = this.options;
                content = $e.attr("data-content") || (typeof o.content == "function" ? o.content.call($e[0]) : o.content);
                return content;
            },
            tip: function() {
                if (!this.$tip) {
                    this.$tip = $(this.options.template);
                }
                return this.$tip;
            },
            destroy: function() {
                this.hide().$element.off("." + this.type).removeData(this.type);
            }
        });
        /* POPOVER PLUGIN DEFINITION
         * ======================= */
        $.fn.popover = function(option) {
            return this.each(function() {
                var $this = $(this), data = $this.data("popover"), options = typeof option == "object" && option;
                if (!data) $this.data("popover", data = new Popover(this, options));
                if (typeof option == "string") data[option]();
            });
        };
        $.fn.popover.Constructor = Popover;
        $.fn.popover.defaults = $.extend({}, $.fn.tooltip.defaults, {
            placement: "right",
            trigger: "click",
            content: "",
            template: '<div class="popover"><div class="arrow"></div><div class="popover-inner"><h3 class="popover-title"></h3><div class="popover-content"><p></p></div></div></div>'
        });
    }(window.jQuery);
});