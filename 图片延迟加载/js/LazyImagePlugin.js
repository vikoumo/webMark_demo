(function () {
    function LazyImage(options) {
        // init params
        options = options || {};
        let defaults = {
            context: document,
            attr: 'lazy-image',
            threshold: 1,
            speed: 300,
            callback: Function.prototype
        };
        return new LazyImage.prototype.init(Object.assign(defaults, options));
    }
    LazyImage.prototype = {
        constructor: LazyImage,
        init: function init(config) {
            // 把信息挂在到实例上：在其它方法中，基于实例即可获取这些信息
            this.config = config;
            this.imageBoxList = [];

            // 创建监听器
            const oboptions = {
                threshold: [config.threshold]
            };
            this.ob = new IntersectionObserver(changes => {
                changes.forEach(item => {
                    let {
                        isIntersecting,
                        target
                    } = item;
                    if (isIntersecting) {
                        this.singleHandle(target);
                        this.ob.unobserve(target);
                    }
                });
            }, oboptions);
            this.observeAll();
        },
        // 单张图片的延迟加载
        singleHandle: function singleHandle(imgBox) {
            let config = this.config,
                imgObj = imgBox.querySelector('img'),
                trueImage = imgObj.getAttribute(config.attr);
            imgObj.src = trueImage;
            imgObj.removeAttribute(config.attr);
            imgObj.onload = () => {
                imgObj.style.transition = `opacity ${config.speed}ms`;
                imgObj.style.opacity = 1;
                // 回调函数->插件的生命周期函数「回调函数 & 发布订阅」
                config.callback.call(this, imgObj);
            };
        },
        // 监听需要的DOM元素
        observeAll(refresh) {
            let config = this.config,
                allImages = config.context.querySelectorAll(`img[${config.attr}]`);
            [].forEach.call(allImages, item => {
                let imageBox = item.parentNode;
                if (refresh && this.imageBoxList.includes(imageBox)) return;
                this.imageBoxList.push(imageBox);
                this.ob.observe(imageBox);
            });
        },
        // 刷新：获取新增的需要延迟加载的图片，做延迟加载
        refresh: function refresh() {
            this.observeAll(true);
        }
    };
    LazyImage.prototype.init.prototype = LazyImage.prototype;

    if (typeof window !== "undefined") {
        window.LazyImage = LazyImage;
    }
    if (typeof module === "object" && typeof module.exports === "object") {
        module.exports = LazyImage;
    }
})();