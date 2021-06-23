class VirtualScroll {
  constructor({ el, list, itemHeight, cacheCount, itemElementGenerator }) {
    this.$list = el // 视口元素
    this.list = list // 需要展示的列表数据
    this.itemHeight = itemHeight // 每个列表元素的高度
    this.itemElementGenerator = itemElementGenerator // 列表元素的DOM生成器
    
    // 优化：已渲染列表缓存
    this.cacheCount = cacheCount
    this.renderListWithCache = []


    this.mapList()
    this.initContainer()
    this.bindEvents()

    this._virtualOffset = 0
    this.virtualOffset = this._virtualOffset
  }
  initContainer() {
    this.containerHeight = this.$list.clientHeight
    this.$list.style.overflow = "hidden"
    this.contentHeight = sumHeight(this._list)
  }
  mapList() {
    this._list = this.list.map((item, i) => ({
      height: this.itemHeight,
      index: i,
      item: item,
    }))
  }
  bindEvents() {
    let y = 0
    const scrollSpace = this.contentHeight - this.containerHeight
    const updateOffset = (e) => {
      e.preventDefault()
      y += e.deltaY
      y = Math.max(y, 0)
      y = Math.min(y, scrollSpace)
      this.virtualOffset = y
    }
    // 节流
    const _updateOffset = throttle(updateOffset, 16)
    this.$list.addEventListener("wheel", _updateOffset);
  }

  set virtualOffset(val) {
    this._virtualOffset = val
    this.render(val)
  }
  get virtualOffset() {
    return this._virtualOffset
  }

  render(virtualOffset) {
    // 头部和底部分别渲染list的第几个
    const headIndex = findIndexOverHeight(this._list, virtualOffset)
    const tailIndex = findIndexOverHeight(this._list, virtualOffset + this.containerHeight)

    let renderOffset, headIndexWithCache
    
    // 当前滚动距离仍在缓存内
    if (withinCache(headIndex, tailIndex, this.renderListWithCache)) {
      // 只改变translateY
      headIndexWithCache = this.renderListWithCache[0].index
      renderOffset = virtualOffset - sumHeight(this._list, 0, headIndexWithCache)
      this.$listInner.style.transform = `translateY(-${renderOffset}px)`
      return
    }

    // 列表增加了前后缓存元素
    headIndexWithCache = Math.max(headIndex - this.cacheCount, 0)
    const tailIndexWithCache = Math.min(tailIndex + this.cacheCount, this._list.length)
    // 需要渲染出来的列表
    this.renderListWithCache = this._list.slice(headIndexWithCache, tailIndexWithCache)

    renderOffset = virtualOffset - sumHeight(this._list, 0, headIndex)

    renderDOMList.call(this, renderOffset)

    function renderDOMList(renderOffset) {
      this.$listInner = document.createElement("div")
      this.renderListWithCache.forEach((item) => {
        const $el = this.itemElementGenerator(item)
        this.$listInner.appendChild($el)
      })
      this.$listInner.style.transform = `translateY(-${renderOffset}px)`
      this.$list.innerHTML = ""
      this.$list.appendChild(this.$listInner)
    }
  }
}
// 找到第一个累加高度大于指定高度的序号
function findIndexOverHeight(list, offset) {
  let currentHeight = 0
  for (let i = 0; i < list.length; i++) {
    const { height } = list[i]
    currentHeight += height

    if (currentHeight > offset) {
      return i
    }
  }

  return list.length - 1
}

// 获取列表中某一段的累加高度
function sumHeight(list, start = 0, end = list.length) {
  let height = 0
  for (let i = start; i < end; i++) {
    height += list[i].height
  }

  return height
}

function throttle(func, wait) {
  if (typeof func !== 'function') throw new TypeError('func must be function');
  if (wait === undefined) wait = 500;
  let previous = 0,
    timer = null;
  return function proxy (...args) {
    let now = new Date(),
      self = this,
      remain = now - previous;
    if (remain >= wait) {// 立即执行
      clearTimeout(timer);
      timer = null;
      previous = now;
      func.call(this, ...args);
    } else if (!timer) {
      timer = setTimeout(() => {
        clearTimeout(timer);
        timer = null;
        previous = new Date();
        func.call(this, ...args);
      }, wait - remain);
    }
  }
}

function withinCache(currentHead, currentTail, renderListWithCache) {
  if (!renderListWithCache.length) return false

  const head = renderListWithCache[0]
  const tail = renderListWithCache[renderListWithCache.length - 1]
  const withinRange = (num, min, max) => num >= min && num <= max

  return withinRange(currentHead, head.index, tail.index) && withinRange(currentTail, head.index, tail.index)
}