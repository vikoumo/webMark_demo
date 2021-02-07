$(function () {
    let $magnifier = $('.magnifier'),
        $abbre = $magnifier.find('.abbre'),
        $mark = $abbre.find('.mark'),
        $detail = $magnifier.find('.detail'),
        $detailIMG = $detail.find('img');

    // 动态计算出大图的大小
    let abbreW = $abbre.width(),
        abbreH = $abbre.height(),
        abbreOffset = $abbre.offset(),
        markW = $mark.width(),
        markH = $mark.height(),
        detailW = $detail.width(),
        detailH = $detail.height(),
        detailIMGW = detailW / (markW / abbreW),
        detailIMGH = detailH / (markH / abbreH);
    $detailIMG.css({
        width: detailIMGW,
        height: detailIMGH
    });

    // 计算“MARK/大图”移动的位置
    const computed = function computed(ev) {
        let curL = ev.pageX - abbreOffset.left - markW / 2,
            curT = ev.pageY - abbreOffset.top - markH / 2;
        // 边界处理
        let minL = 0,
            minT = 0,
            maxL = abbreW - markW,
            maxT = abbreH - markH;
        curL = curL < minL ? minL : (curL > maxL ? maxL : curL);
        curT = curT < minT ? minT : (curT > maxT ? maxT : curT);

        $mark.css({
            left: curL,
            top: curT
        });
        $detailIMG.css({
            left: -curL / abbreW * detailIMGW,
            top: -curT / abbreH * detailIMGH
        });
    };


    // 事件触发
    $abbre.mouseenter(function (ev) {
        $mark.css('display', 'block');
        $detail.css('display', 'block');
        computed(ev);
    }).mousemove(function (ev) {
        computed(ev);
    }).mouseleave(function (ev) {
        $mark.css('display', 'none');
        $detail.css('display', 'none');
    });
});