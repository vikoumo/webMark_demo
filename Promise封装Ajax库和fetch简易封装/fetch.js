(function () {
    var class2type = {};
    var toString = class2type.toString;
    var hasOwn = class2type.hasOwnProperty;
    var fnToString = hasOwn.toString;
    var ObjectFunctionString = fnToString.call(Object);
    var getProto = Object.getPrototypeOf;

    var mapType = ["Boolean", "Number", "String", "Function", "Array", "Date", "RegExp", "Object", "Error", "Symbol", "BigInt"];
    mapType.forEach(function (name) {
        class2type["[object " + name + "]"] = name.toLocaleLowerCase();
    });

    var toType = function toType(obj) {
        if (obj == null) {
            return obj + "";
        }
        return typeof obj === "object" || typeof obj === "function" ?
            class2type[toString.call(obj)] || "object" :
            typeof obj;
    };

    var isFunction = function isFunction(obj) {
        return typeof obj === "function" && typeof obj.nodeType !== "number";
    };

    var isWindow = function isWindow(obj) {
        return obj != null && obj === obj.window;
    };

    var isArrayLike = function isArrayLike(obj) {
        var length = !!obj && "length" in obj && obj.length,
            type = toType(obj);
        if (isFunction(obj) || isWindow(obj)) return false;
        return type === "array" || length === 0 ||
            typeof length === "number" && length > 0 && (length - 1) in obj;
    };

    var isPlainObject = function isPlainObject(obj) {
        var proto, Ctor;
        if (!obj || toString.call(obj) !== "[object Object]") {
            return false;
        }
        proto = getProto(obj);
        if (!proto) return true;
        Ctor = hasOwn.call(proto, "constructor") && proto.constructor;
        return typeof Ctor === "function" && fnToString.call(Ctor) === ObjectFunctionString;
    };

    var isEmptyObject = function isEmptyObject(obj) {
        if (obj == null) return false;
        if (typeof obj !== "object") return false;
        var keys = Object.keys(obj);
        if (hasOwn.call(Object, 'getOwnPropertySymbols')) {
            keys = keys.concat(Object.getOwnPropertySymbols(obj));
        }
        return keys.length === 0;
    };

    var isNumeric = function isNumeric(obj) {
        var type = toType(obj);
        return (type === "number" || type === "string") && !isNaN(+obj);
    };

    var each = function each(obj, callback) {
        var length, i = 0;
        if (isArrayLike(obj)) {
            length = obj.length;
            for (; i < length; i++) {
                var result = callback.call(obj[i], i, obj[i]);
                if (result === false) {
                    break;
                }
            }
        } else {
            var keys = Object.keys(obj);
            typeof Symbol !== "undefined" ? keys = keys.concat(Object.getOwnPropertySymbols(obj)) : null;
            for (; i < keys.length; i++) {
                var key = keys[i];
                if (callback.call(obj[key], key, obj[key]) === false) {
                    break;
                }
            }
        }
        return obj;
    }

    var shallowMerge = function shallowMerge(obj1, obj2) {
        var isPlain1 = isPlainObject(obj1),
            isPlain2 = isPlainObject(obj2);
        if (!isPlain1) return obj2;
        if (!isPlain2) return obj1;
        each(obj2, function (key, value) {
            obj1[key] = value;
        });
        return obj1;
    };

    var deepMerge = function deepMerge(obj1, obj2, cache) {
        cache = !Array.isArray(cache) ? [] : cache;
        if (cache.indexOf(obj2) >= 0) return obj2;
        cache.push(obj2);
        var isPlain1 = isPlainObject(obj1),
            isPlain2 = isPlainObject(obj2);
        if (!isPlain1 || !isPlain2) return shallowMerge(obj1, obj2);
        each(obj2, function (key, value) {
            obj1[key] = deepMerge(obj1[key], value, cache);
        });
        return obj1;
    };

    var shallowClone = function shallowClone(obj) {
        var type = toType(obj),
            Ctor = null;
        if (obj == null) return obj;
        Ctor = obj.constructor;
        if (/^(regexp|date)$/i.test(type)) return new Ctor(obj);
        if (/^(symbol|bigint)$/i.test(type)) return Object(obj);
        if (/^error$/i.test(type)) return new Ctor(obj.message);
        if (/^function$/i.test(type)) {
            return function anonymous() {
                return obj.apply(this, arguments);
            };
        }
        if (isPlainObject(obj) || type === "array") {
            var result = new Ctor();
            each(obj, function (key, value) {
                result[key] = value;
            });
            return result;
        }
        return obj;
    };

    var deepClone = function deepClone(obj, cache) {
        var type = toType(obj),
            Ctor = null,
            result = null;
        if (!isPlainObject(obj) && type !== "array") return shallowClone(obj);
        cache = !Array.isArray(cache) ? [] : cache;
        if (cache.indexOf(obj) >= 0) return obj;
        cache.push(obj);
        Ctor = obj.constructor;
        result = new Ctor();
        each(obj, function (key, value) {
            result[key] = deepClone(value, cache);
        });
        return result;
    };

    // 暴露到外部
    var utils = {
        toType: toType,
        isFunction: isFunction,
        isWindow: isWindow,
        isArrayLike: isArrayLike,
        isPlainObject: isPlainObject,
        isEmptyObject: isEmptyObject,
        isNumeric: isNumeric,
        each: each,
        shallowMerge: shallowMerge,
        deepMerge: deepMerge,
        shallowClone: shallowClone,
        deepClone: deepClone
    };
    if (typeof window !== "undefined") {
        window._ = window.utils = utils;
    }
    if (typeof module === "object" && typeof module.exports === "object") {
        module.exports = utils;
    }
})();

/* 实现对Fetch的简易封装 */
(function () {
    // 配置项默认规则
    const configRule = {
        url: {
            type: 'string',
            required: true
        },
        method: {
            type: 'string',
            default: 'GET'
        },
        headers: {
            type: 'object',
            default: {}
        },
        params: {
            type: 'object',
            default: {}
        },
        cache: {
            type: 'boolean',
            default: true
        },
        data: {
            type: 'object string',
            default: {}
        },
        withCredentials: {
            type: 'boolean',
            default: false
        },
        responseType: {
            type: 'string',
            default: 'json'
        },
        validateStatus: {
            type: 'function',
            default: status => {
                return status >= 200 && status < 300;;
            }
        },
        mode: {
            type: 'string',
            default: 'same-origin'
        }
    };

    // 处理URL
    const paramsSerializer = function paramsSerializer(obj) {
        let str = ``;
        _.each(obj, (key, value) => {
            str += `&${key}=${value}`;
        });
        return str.substring(1);
    };
    const handleURL = function handleURL(config) {
        let {
            url,
            params
        } = config;
        params = paramsSerializer(params);
        url += `${url.includes('?')?'&':'?'}${params}`;
        return url;
    };

    // 处理DATA
    const handleDATA = function handleDATA(config) {
        let {
            data,
            headers
        } = config,
        ContentType = headers['Content-Type'] || 'application/json';
        if (data == null || typeof data !== "object") return data;
        // 基于设定的请求头信息，自动处理DATA的格式
        switch (ContentType) {
            case 'application/json':
                data = JSON.stringify(data);
                break;
            case 'application/x-www-form-urlencoded':
                data = paramsSerializer(data);
                break;
            case 'multipart/form-data':
                data = data;
                break;
        }
        return data;
    };

    // 请求的方法
    const http = function http(config) {
        // 合并配置项
        !_.isPlainObject(config) ? config = {} : null;
        let configRuleClone = _.deepClone(configRule);
        _.each(configRuleClone, (key, rule) => {
            let {
                type,
                default: defaultValue,
                required
            } = rule;
            let myValue = config[key],
                myType = _.toType(myValue);
            if (myType === "undefined") {
                if (required) throw new TypeError(`${key} must be required!`);
                config[key] = defaultValue;
                return;
            }
            if (!type.includes(myType)) throw new TypeError(`${key} must be ${type}!`);
            if (_.isPlainObject(defaultValue) && _.isPlainObject(myValue)) {
                config[key] = _.deepMerge(defaultValue, myValue);
                return;
            }
            config[key] = myValue;
        });

        // 获取配置项信息
        let {
            method,
            cache,
            withCredentials,
            mode,
            headers,
            validateStatus,
            responseType
        } = config;

        // 发送数据请求
        let configReal = {};
        configReal.method = method.toUpperCase();
        /^(post|put|patch)$/i.test(method) ? configReal.body = handleDATA(config) : null;
        configReal.cache = cache ? 'default' : 'no-cache';
        configReal.credentials = withCredentials ? 'include' : 'same-origin';
        configReal.mode = mode;
        configReal.headers = headers;
        return fetch(handleURL(config), configReal).then(response => {
            // 首先校验状态码
            let status = response.status;
            if (!validateStatus(status)) {
                // 状态码失败
                return Promise.reject({
                    state: 'status error',
                    status: status,
                    statusText: response.statusText,
                    data: null
                });
            }
            // 成功
            let result = '';
            switch (responseType.toUpperCase()) {
                case 'JSON':
                    result = response.json();
                    break;
                case 'ARRAYBUFFER':
                    result = response.arrayBuffer();
                    break;
                case 'BLOB':
                    result = response.blob();
                    break;
                case 'TEXT':
                    result = response.text();
                    break;
            }
            return result;
        }, reason => {
            // 网络断开 OR 请求中断
            return Promise.reject({
                state: 'network error',
                status: 0,
                statusText: '网络断开或者请求中断!',
                data: null
            });
        });
    };

    /*  暴露API */
    if (typeof window !== "undefined") {
        window.http = http;
    }
    if (typeof module === "object" && typeof module.exports === "object") {
        module.exports = http;
    }
})();


// 业务层二次封装
let baseURL = 'http://127.0.0.1:8888',
    mode = 'cors',
    cache = false,
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    };

function get(url, params, config = {}) {
    return http({
        url: baseURL + url,
        params,
        mode,
        cache,
        headers: _.deepMerge(_.deepMerge({}, headers), config.headers)
    }).catch(reason => {
        // 失败的统一处理
        // ...
        console.log(reason);
        return Promise.reject(reason);
    });
};