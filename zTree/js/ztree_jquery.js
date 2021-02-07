// jq版本
(function ($) {
    if (!$ || !$.fn.jquery) throw new ReferenceError('must be import jquery!');
    $.fn.extend({
        zTree(data, callback) {
            // init params
            typeof callback !== "function" ? callback = function () {} : null;
            let $self = this,
                n = 0;
            
            // 数据绑定
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
            $self.html(`<ul class="level level0">
                ${gethtml(data)}
            </ul>`);

            // 折叠展开切换
            $self.on('click', function (ev) {
                let target = ev.target,
                    $target = $(target);
                if (target.tagName === 'EM') {
                    let $ulBox = $target.next('ul');
                    $target.toggleClass('open');
                    $ulBox.stop().slideToggle(300);
                    // 触发回调函数
                    callback($target[0], $ulBox[0]);
                }
            });
        }
    });
})(typeof jQuery !== "undefined" ? jQuery : undefined);