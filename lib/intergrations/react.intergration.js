"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
function ReactWrapper(ReactComponent, depsFunc, pulseInstance) {
    var pulse = pulseInstance || globalThis.__pulse;
    if (!pulse)
        console.error("Pulse X React: Pulse instance inaccessible, it is likely you're using \"Pulse.React()\" before \"new Pulse()\"");
    var global = pulse._private.global, React = global.config.frameworkConstructor;
    return /** @class */ (function (_super) {
        __extends(class_1, _super);
        function class_1(props) {
            var _this = _super.call(this, props) || this;
            _this.props = props;
            // does pulse need to map data to props
            _this.mappable = false;
            // register component
            var cC = global.subs.registerComponent(_this, {}, depsFunc);
            // use mapData to subscribe since we need to support older versions
            cC.automaticDepTracking = depsFunc === undefined;
            if (!cC.automaticDepTracking) {
                var _a = global.subs.mapData(depsFunc, _this, true), mapToProps = _a.mapToProps, legacy = _a.legacy;
                cC.mappable = mapToProps;
                cC.legacy = legacy;
            }
            return _this;
        }
        class_1.prototype.componentDidMount = function () {
            if (global.config.waitForMount)
                global.subs.mount(this);
        };
        class_1.prototype.componentWillUnmount = function () {
            global.subs.unmount(this);
        };
        class_1.prototype.render = function () {
            var _a, _b;
            var props = __assign({}, this.props), cC = global.subs.get(this.__pulseUniqueIdentifier), customProp = global.config.mapDataUnderPropName, isFunc = typeof depsFunc === 'function';
            // METHOD (1) if no depFunc was supplied Pulse will track accessed dependencies
            if (cC.automaticDepTracking) {
                // start tracking component
                global.subs.trackingComponent = cC;
            }
            // METHOD (2) if custom prop is set and we were supplied a new mapData function
            else if (cC.mappable && customProp && isFunc) {
                props = __assign(__assign({}, props), (_a = {}, _a[customProp] = cC.depsFunc(global.contextRef), _a));
            }
            // METHOD (3) Pulse 2.2 map directly to props
            else if (cC.mappable && isFunc) {
                // concat current props with lastest pulse values
                props = __assign(__assign({}, props), cC.depsFunc(global.contextRef));
            }
            // METHOD (4) we were supplied legacy mapData object, string notation 'collection/property'
            else if (cC.legacy) {
                props = __assign(__assign({}, props), (_b = {}, _b[customProp || 'pulse'] = global.subs.legacyMapData(cC.depsFunc)
                    .evaluated, _b));
            }
            return React.createElement(ReactComponent, props);
        };
        return class_1;
    }(React.Component));
}
exports["default"] = {
    name: 'react',
    bind: function (pulseConstructor) {
        pulseConstructor.React = ReactWrapper;
    },
    updateMethod: function (componentInstance, updatedData) {
        if (updatedData) {
            componentInstance.setState(updatedData);
        }
        else {
            componentInstance.forceUpdate();
        }
    },
    onReady: function () {
        //
    }
};
//# sourceMappingURL=react.intergration.js.map