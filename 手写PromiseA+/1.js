/* 
 * 基于原生JS实现Promise「遵循的是Promise A Plus规范」
 *    https://promisesaplus.com/ 
 */
(function () {
    /* 工具类方法 */
    var isPromise = function isPromise(obj) {
        if ((obj !== null && typeof obj === "object") || (typeof obj === "function")) {
            if (typeof obj.then === "function") {
                return true;
            }
        }
        return false;
    };

    function Promise(executor) {
        // 要求传递的executor必须是一个函数才可以
        if (typeof executor !== 'function') throw new TypeError('Promise resolver ' + executor + ' is not a function');

        // self->promise实例 && 初始其状态PromiseState和值PromiseResult
        var self = this;
        self.PromiseState = 'pending';
        self.PromiseResult = undefined;
        self.onFulfilledCallbacks = [];
        self.onRejectedCallbacks = [];

        var change = function change(state, value) {
            // 状态只能修改一次,第二次更改无效
            if (self.PromiseState !== 'pending') return;
            self.PromiseState = state;
            self.PromiseResult = value;
            
            // 通知集合中的方法执行
            setTimeout(function () {
                var callbacks = self.PromiseState === 'fulfilled' ? self.onFulfilledCallbacks : self.onRejectedCallbacks;
                for (var i = 0; i < callbacks.length; i++) {
                    var item = callbacks[i];
                    if (typeof item === "function") {
                        item(self.PromiseResult);
                    }
                }
            });
        };

        try {
            executor(function resolve(result) {
                change('fulfilled', result);
            }, function reject(reason) {
                change('rejected', reason);
            });
        } catch (err) {
            change('rejected', err);
        }
    }

    /* function resolvePromise(promiseNew, x, resolve, reject) {
        if (x === promiseNew) throw new TypeError('Chaining cycle detected for promise #<Promise>');
        //必须保证返回值是你自己构建的这个Promise类的实例,如果是类promise实例，比如说有then的函数，或者是别人定义的myPromise
        if (x instanceof Promise) {
            // 返回结果是一个新的promise实例
            x.then(resolve, reject);
        } else {
            // 返回结果不是promise实例
            resolve(x);
        }
    } */
    var resolvePromise = function resolvePromise(promiseNew, x, resolve, reject) {
        if (x === promiseNew) throw new TypeError('Chaining cycle detected for promise #<Promise>');
        if (isPromise(x)) {
            try {
                x.then(resolve, reject);
            } catch (err) {
                reject(err);
            }
            return;
        }
        resolve(x);
    };

    Promise.prototype = {
        constructor: Promise,
        /*
         * .then(onfulfilled, onrejected) 
         *    case1：如果此时promise实例已经是成功或者失败，我们创建一个异步的微任务，等待同步任务结束，执行对应的函数即可
         *    case2：此时状态还是pending，我们需要把onfulfilled/onrejected保存起来，当后期状态修改了（例如：resolve/reject方法执行），再次通知保存的方法执行，而这个操作也是异步微任务
         */
        then: function (onfulfilled, onrejected) {
            // onfulfilled/onrejected如果不是函数：未来保证穿透顺延的效果，我们需要为其设置默认的函数
            if (typeof onfulfilled !== "function") {
                onfulfilled = function onfulfilled(value) {
                    return value;
                };
            }
            if (typeof onrejected !== "function") {
                onrejected = function onrejected(value) {
                    throw value;
                };
            }

            var self = this;
            // 创建一个新的promise实例并且返回
            //   + 执行resolve/reject控制它成功或者失败
            //   + 到底是成功还是失败，是由onfulfilled/onrejected执行决定
            //       + onfulfilled/onrejected函数执行不报错，应该让其状态为成功，让其值为函数执行的返回值
            //       + 如果onfulfilled/onrejected返回的也是promise实例，那么promiseNew的状态和值和新返回的实例保持一致
            //       + 但是如果onfulfilled/onrejected返回的promise实例和promiseNew是一个东西，则直接抛出异常即可
            var promiseNew = new Promise(function (resolve, reject) {
                switch (self.PromiseState) {
                    case 'fulfilled':
                        setTimeout(function () {
                            try {
                                var x = onfulfilled(self.PromiseResult);
                                resolvePromise(promiseNew, x, resolve, reject);
                            } catch (err) {
                                reject(err);
                            }
                        });
                        break;
                    case 'rejected':
                        setTimeout(function () {
                            try {
                                var x = onrejected(self.PromiseResult);
                                resolvePromise(promiseNew, x, resolve, reject);
                            } catch (err) {
                                reject(err);
                            }
                        });
                        break;
                    default:
                        // 把它存储到集合中，但是我们以后还要监听方法执行的结果，从而做其它事情
                        self.onFulfilledCallbacks.push(function (value) {
                            try {
                                var x = onfulfilled(value);
                                resolvePromise(promiseNew, x, resolve, reject);
                            } catch (err) {
                                reject(err);
                            }
                        });
                        self.onRejectedCallbacks.push(function (value) {
                            try {
                                var x = onrejected(value);
                                resolvePromise(promiseNew, x, resolve, reject);
                            } catch (err) {
                                reject(err);
                            }
                        });
                }
            });
            return promiseNew;
        },
        catch: function (onrejected) {
            var self = this;
            return self.then(null, onrejected);
        }
    };

    /* 对象 */
    Promise.resolve = function resolve(value) {
        return new Promise(function (resolve) {
            resolve(value);
        });
    };
    Promise.reject = function reject(value) {
        return new Promise(function (_, reject) {
            reject(value);
        });
    };

    Promise.all = function all(promises) {
        return new Promise(function (resolve, reject) {
            try {
                var index = 0,
                    len = promises.length,
                    results = [];
                for (var i = 0; i < len; i++) {
                    (function (i) {
                        var item = promises[i];
                        if (!isPromise(item)) {
                            index++;
                            results[i] = item;
                            index === len ? resolve(results) : null;
                            return;
                        }
                        item.then(function (result) {
                            index++;
                            results[i] = result;
                            index === len ? resolve(results) : null;
                        }, function (reason) {
                            reject(reason);
                        });
                    })(i);
                }
            } catch (err) {
                reject(err);
            }
        });
    };

    // 暴露API
    if (typeof module === 'object' && typeof module.exports === 'object') {
        module.exports = Promise;
    }
    if (typeof window !== 'undefined') {
        window.Promise = Promise;
    }
})();

let p1 = new Promise((resolve, reject) => {
    // resolve(100);
    // reject(0);
    setTimeout(() => {
        resolve(100);
        console.log(2);
    }, 1000);
});
p1.then(result => {
    console.log('成功', result);
}, reason => {
    console.log('失败', reason);
});
p1.then(result => {
    console.log('成功', result);
}, reason => {
    console.log('失败', reason);
});
console.log(`1`);