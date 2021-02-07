/*
 * 插件支持的配置信息(基于不同的配置信息，实现不同的功能)： 
 *    + title[string] 标题
 *    + template[string] 自定义的内容或者模板(基于ES6的模板字符串,拼接更丰富的内容结构)
 *    + buttons[array] 自定义按钮(组)
 *      [{text:'确定',click:[callback]},...]
 *    + modal[boolean] 控制遮罩层是否显示 默认是true
 *    + drag[boolean] 是否允许拖拽 默认是true
 *    + onopen[function] 打开
 *    + onclose[function] 关闭
 * 拖拽的生命周期函数「当前操作的某个节点上，允许用户自定义处理的事情」
 *   「发布订阅」
 *    + 拖拽开始 ondragstart
 *    + 拖拽中 ondraging
 *    + 拖拽结束 ondragend
 */

/* 插件核心 */
function ModalPlugin(config) {
    let self = this;
    self.config = config;
    self.$drag_modal = null;
    self.$drag_content = null;
    self.startX = 0;
    self.startY = 0;
    self.startL = 0;
    self.startT = 0;
    self._MOVE = null;
    self._UP = null;
    //如果开启拖拽，我们需要创建三个事件池
    if (self.config.drag) {
        self.ondragstart = new Sub();
        self.ondraging = new Sub;
        self.ondragend = new Sub;
    }
    self.init();
}
ModalPlugin.prototype = {
    version: '1.0.0',
    constructor: ModalPlugin,
    init() {
        let self = this;
        self.create();

        if (self.$drag_content) {
            self.$drag_content.addEventListener('click', function (ev) {
                let target = ev.target,
                    targetTag = target.tagName,
                    targetClass = target.className;
                if (targetTag === 'A' && targetClass === 'drag_close') {
                    self.close();
                    return;
                }
                if (targetTag === 'A' && targetClass === 'drag_button') {
                    let index = +target.getAttribute('index'),
                        item = self.config.buttons[index];
                    if (item && utils.isFunction(item.click)) {
                        item.click.call(self, self);
                    }
                    return;
                }
            });
        }

        if (self.config.drag) {
            // 开启多拽
            let $drag_head = self.$drag_content.querySelector('.drag_head');
            $drag_head.style.cursor = 'move';
            $drag_head.addEventListener('mousedown', self.down.bind(self));
        }
    },
    create() {
        let self = this,
            config = self.config,
            fragment = document.createDocumentFragment();
        if (config.modal) {
            self.$drag_modal = document.createElement('div');
            self.$drag_modal.className = 'drag_modal';
            fragment.appendChild(self.$drag_modal);
        }
        self.$drag_content = document.createElement('div');
        self.$drag_content.className = 'drag_content';
        self.$drag_content.innerHTML = `
            <div class="drag_head">
                ${config.title}
                <a href="javascript:;" class="drag_close"></a>
            </div>
            <div class="drag_main">${config.template}</div>
            ${config.buttons.length>0?`<div class="drag_foot">
                ${config.buttons.map((item,index)=>{
                    return `<a href="javascript:;" class="drag_button" index="${index}">
                        ${item.text}
                    </a>`;
                }).join('')}
            </div>`:``}
        `;
        fragment.appendChild(self.$drag_content);
        document.body.appendChild(fragment);
        fragment = null;

        self.$drag_content.offsetHeight;
        self.$drag_modal ? self.$drag_modal.style.opacity = 1 : null;
        self.$drag_content.style.opacity = 1;

        // 改变盒子居中的方式
        self.$drag_content.style.left = `${(document.documentElement.clientWidth-self.$drag_content.offsetWidth)/2}px`;
        self.$drag_content.style.top = `${(document.documentElement.clientHeight-self.$drag_content.offsetHeight)/2}px`;
        self.$drag_content.style.transform = 'translate(0,0)';

        // 触发打开的周期函数
        self.config.onopen.call(self, self);
    },
    close() {
        let self = this,
            body = document.body;
        if (self.$drag_modal) {
            self.$drag_modal.style.opacity = 0;
            self.$drag_modal.ontransitionend = () => {
                body.removeChild(self.$drag_modal);
                self.$drag_modal = null;
            };
        }
        if (self.$drag_content) {
            self.$drag_content.style.opacity = 0;
            self.$drag_content.ontransitionend = () => {
                body.removeChild(self.$drag_content);
                self.$drag_content = null;
                // 触发关闭的周期函数
                self.config.onclose.call(self, self);
            };
        }
    },
    // 拖拽系列方法
    down(ev) {
        let self = this;
        self.startX = ev.pageX;
        self.startY = ev.pageY;
        self.startL = self.$drag_content.offsetLeft;
        self.startT = self.$drag_content.offsetTop;
        self._MOVE = self.move.bind(self);
        self._UP = self.up.bind(self);
        document.addEventListener('mousemove', self._MOVE);
        document.addEventListener('mouseup', self._UP);
        // 通知事件池中的方法执行
        self.ondragstart.fire(self);
    },
    move(ev) {
        let self = this,
            curL = ev.pageX - self.startX + self.startL,
            curT = ev.pageY - self.startY + self.startT;
        // 边界判断
        let HTML = document.documentElement,
            minL = 0,
            minT = 0,
            maxL = HTML.clientWidth - self.$drag_content.offsetWidth,
            maxT = HTML.clientHeight - self.$drag_content.offsetHeight;
        curL = curL < minL ? minL : (curL > maxL ? maxL : curL);
        curT = curT < minT ? minT : (curT > maxT ? maxT : curT);
        self.$drag_content.style.left = curL + 'px';
        self.$drag_content.style.top = curT + 'px';
        // 通知事件池中的方法执行
        self.ondraging.fire(self);
    },
    up() {
        let self = this;
        document.removeEventListener('mousemove', self._MOVE);
        document.removeEventListener('mouseup', self._UP);
        // 通知事件池中的方法执行
        self.ondragend.fire(self);
    }
};

/* 暴露API */
const props = {
    title: {
        type: 'string',
        default: '系统温馨提示'
    },
    template: {
        type: 'string',
        required: true
    },
    buttons: {
        type: 'array',
        default: []
    },
    modal: {
        type: 'boolean',
        default: true
    },
    drag: {
        type: 'boolean',
        default: true
    },
    onopen: {
        type: 'function',
        default: () => {}
    },
    onclose: {
        type: 'function',
        default: () => {}
    }
};
const proxyModal = function proxyModal(options) {
    !options || !utils.isPlainObject(options) ? options = {} : null;
    let config = {};
    utils.each(props, (key, rule) => {
        let optValue = options[key],
            {
                type,
                default: defaultValue,
                required
            } = rule;
        if (typeof optValue === "undefined") {
            if (required) throw new TypeError(`${key} must be required!`);
            config[key] = defaultValue;
            return;
        }
        if (utils.toType(optValue) !== type) throw new TypeError(`${key} must be an ${type}!`);
        config[key] = utils.merge(defaultValue, optValue);
    });
    return new ModalPlugin(config);
};
if (typeof window !== "undefined") {
    window.M = window.proxyModal = proxyModal;
}
if (typeof module === "object" && typeof module.exports === "object") {
    module.exports = proxyModal;
}