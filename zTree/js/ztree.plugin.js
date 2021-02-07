(function () {
    // 插件核心:OOP的模式，可以创建单独的实例，这样实现私有属性和公有方法的有效管理
    class zTree {
        constructor(element, options) {
            // init params
            let self = this,
                len = arguments.length,
                config = {
                    element: null,
                    data: null,
                    callback: function () {}
                };
            if (len === 0) throw new Error(`element or options are required!`);
            if (len === 1) options = element;
            if (!options || typeof options !== "object") throw new TypeError(`options must be an object!`);
            if (len === 2) options.element = element;
            config = Object.assign(config, options);

            // 校验传递信息的格式
            let {
                element: element2,
                data,
                callback
            } = config;
            if (!element2 || element2.nodeType !== 1) throw new TypeError(`element must be a DOM element object`);
            if (!Array.isArray(data)) throw new TypeError(`data must be an array!`);
            if (typeof callback !== "function") throw new TypeError(`callback must be an function!`);

            // 挂载到实例上
            self.element = element2;
            self.data = data;
            self.callback = callback;
            self.n = 0;

            // init
            self.init();
        }

        init() {
            let self = this;
            self.element.innerHTML = `<ul class="level level0">
                ${self.html(self.data)}
            </ul>`;
            self.handle();
        }

        // 动态创建dom结构
        html(data) {
            let self = this,
                str = ``;
            self.n++;
            data.forEach(item => {
                let {
                    name,
                    children,
                    open
                } = item;
                str += `<li>
                    <a href="#" class="title">${name}</a>
                    ${children && children.length>0?`
                        <em class="icon ${open?'open':''}"></em>
                        <ul class="level level${self.n}" style="display:${open?'block':'none'}">
                            ${self.html(children)}
                        </ul>
                    `:``}
                </li>`;
            });
            self.n--;
            return str;
        }
        // 实现具体功能
        handle() {
            let self = this;
            self.element.addEventListener('click', function (ev) {
                let target = ev.target;
                if (target.tagName === 'EM') {
                    let ulBox = target.nextElementSibling,
                        isOpen = target.classList.contains('open');
                    if (!ulBox) return;
                    if (isOpen) {
                        ulBox.style.display = 'none';
                        target.classList.remove('open');
                        self.callback(self, target, ulBox);
                        return;
                    }
                    ulBox.style.display = 'block';
                    target.classList.add('open');
                    self.callback(self, target, ulBox);
                }
            });
        }
    }

    // 暴露API
    if (typeof window !== "undefined") {
        window.zTree = zTree;
    }
    if (typeof module === "object" && typeof module.exports === "object") {
        module.exports = zTree;
    }
})();