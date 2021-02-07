let waterfallModule = (function () {
    // 获取需要操作的DOM元素
    let container = document.querySelector('.container'),
        columns = container.querySelectorAll('.column'),
        loadMore = document.querySelector('.loadMore');
    columns = Array.from(columns);

    // 基于AJAX从服务器端获取数据
    const queryData = () => {
        return new Promise(resolve => {
            let xhr = new XMLHttpRequest;
            xhr.open('GET', './data.json');
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4 && (xhr.status >= 200 && xhr.status < 300)) {
                    let data = JSON.parse(xhr.responseText);
                    resolve(data);
                }
            };
            xhr.send(null);
        });
    };

    // 页面中的数据绑定
    const bindHTML = data => {
        data = data.map(item => {
            let AW = 230,
                BW = item.width,
                BH = item.height,
                AH = AW / (BW / BH);
            item.width = AW;
            item.height = AH;
            return item;
        });
        for (let i = 0; i < data.length; i += 3) {
            let group = data.slice(i, i + 3);
            group.sort((a, b) => a.height - b.height);
            columns.sort((a, b) => b.offsetHeight - a.offsetHeight);
            group.forEach((item, index) => {
                let card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `<a href="${item.link}">
                    <div class="lazyImageBox" style="height: ${item.height}px;">
                        <img src="" alt="" lazy-image="${item.pic}">
                    </div>
                    <p>${item.title}</p>
                </a>`;
                columns[index].appendChild(card);
            });
        }
    };

    // 图片延迟加载
    let obImage = null;
    const singleLazy = lazyImageBox => {
        let imgObj = lazyImageBox.querySelector('img'),
            trueImg = imgObj.getAttribute('lazy-image');
        imgObj.src = trueImg;
        imgObj.removeAttribute('lazy-image');
        imgObj.onload = () => {
            imgObj.style.opacity = 1;
        };
    };
    const lazyAllImage = () => {
        // 创建监听器
        if (!obImage) {
            let oboptions = {
                threshold: [1]
            };
            obImage = new IntersectionObserver(changes => {
                changes.forEach(item => {
                    let {
                        isIntersecting,
                        target
                    } = item;
                    if (isIntersecting) {
                        singleLazy(target);
                        obImage.unobserve(target);
                    }
                });
            }, oboptions);
        }

        // 监听所有的图片的占位盒子
        let lazyImages = container.querySelectorAll('img[lazy-image]');
        [].forEach.call(lazyImages, lazyImage => {
            obImage.observe(lazyImage.parentNode);
        });
    };

    // 加载更多数据
    const loadMoreFunc = () => {
        // 创建监听器
        let oboptions = {
            threshold: [0]
        };
        let ob = new IntersectionObserver(async changes => {
            let item = changes[0];
            if (item.isIntersecting) {
                // 加载更多数据
                let data = await queryData();
                bindHTML(data);
                lazyAllImage();
            }
        }, oboptions);
        ob.observe(loadMore);
    };

    return {
        async init() {
            let data = await queryData();
            bindHTML(data);
            lazyAllImage();
            loadMoreFunc();
        }
    };
})();
waterfallModule.init();
