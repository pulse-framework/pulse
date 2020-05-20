"use strict";
exports.__esModule = true;
exports["default"] = {
    name: 'vue',
    bind: function (pulseConstructor) {
        pulseConstructor.install = function (Vue) {
            var pulse = globalThis.__pulse;
            var global = pulse._private.global;
            var config = pulse._private.global.config;
            Vue.mixin({
                beforeCreate: function () {
                    var _this = this;
                    // bind root properties
                    Object.keys(global.contextRef).forEach(function (moduleInstance) {
                        _this['$' + moduleInstance] = global.contextRef[moduleInstance];
                    });
                    if (pulse.utils)
                        this.$utils = pulse.utils;
                    if (pulse.services)
                        this.$services = pulse.services;
                    // register component with Pulse
                    global.subs.registerComponent(this);
                    // alias map
                    var mapData = global.subs.mapData.bind(global.subs);
                    this.mapData = function (properties) { return mapData(properties, _this); };
                },
                mounted: function () {
                    if (this.__pulseUniqueIdentifier && config.waitForMount)
                        pulse.mount(this);
                },
                beforeDestroy: function () {
                    if (this.__pulseUniqueIdentifier && config.autoUnmount)
                        global.subs.unmount(this);
                }
            });
        };
    },
    updateMethod: function (componentInstance, updatedData) {
        for (var dataKey in updatedData) {
            componentInstance.$set(componentInstance, dataKey, updatedData[dataKey]);
        }
    },
    onReady: function (pulseConstructor) {
        var Vue = pulseConstructor.intergration.frameworkConstructor;
        Vue.use(pulseConstructor);
    }
};
//# sourceMappingURL=vue.intergration.js.map