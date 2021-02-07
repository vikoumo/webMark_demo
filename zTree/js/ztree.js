// 正常逻辑版本
let zTreeModule = (function () {
    let container = document.querySelector('.container'),
        levelBox = document.querySelector('.container>ul');

    // 从服务器获取数据
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

    // 数据绑定
    const bindHTML = data => {
        let n = 0;
        const gethtml = data => {
            let str = ``;
            n++;
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
                        <ul class="level level${n}" style="display:${open?'block':'none'}">
                            ${gethtml(children)}
                        </ul>
                    `:``}
                </li>`;
            });
            n--;
            return str;
        };
        levelBox.innerHTML = gethtml(data);
    };

    // 基于事件委托实现点击折叠切换
    const handle = () => {
        container.addEventListener('click', function (ev) {
            let target = ev.target;
            if (target.tagName === 'EM') {
                let ulBox = target.nextElementSibling,
                    isOpen = target.classList.contains('open');
                if (!ulBox) return;
                if (isOpen) {
                    ulBox.style.display = 'none';
                    target.classList.remove('open');
                    return;
                }
                ulBox.style.display = 'block';
                target.classList.add('open');
            }
        });
    };

    return {
        async init() {
            let data = await queryData();
            bindHTML(data);
            handle();
        }
    };
})();
zTreeModule.init();