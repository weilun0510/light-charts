/**
 * 设置容器和画布宽高，并返回画布宽高
 * @param {object} canvasEl canvas元素
 * @param {object} style 容器样式「宽、高」
 * @param {string | number} gridWidth grid组件的宽度 auto | 0-1（百分比，1代表100%）
 * @param {string | number} gridHeight grid组件的高度 auto | 0-1
 * @returns object 宽高
 */
export const setCanvasSize = (canvasEl, style, gridWidth = 'auto', gridHeight = 'auto') => {
  const ctx = canvasEl.getContext('2d')
  const width = style.width.slice(0, -2)
  const height = style.height.slice(0, -2)

  // 设置css样式
  canvasEl.style.width = width + 'px'
  canvasEl.style.height = height + 'px'

  // 解决不同视网膜屏幕下「像素比不一致」，文字、样式的模糊问题
  // 获取像素比，对画布大小和上下文进行缩放
  const ratio = getPixelRatio(ctx)

  // 1.对画布大小「宽高」进行缩放
  canvasEl.width = width * ratio
  canvasEl.height = height * ratio

  // 2.对画布水平、垂直方向的单位进行缩放（注意：从某些方面说, scale() 缩放的不是画布，而是画布上 1 个单位的距离）
  ctx.scale(ratio, ratio)

  return {
    width: gridWidth === 'auto' ? width : width * gridWidth,
    height: gridHeight === 'auto' ? height : height * gridWidth,
  }
}

/**
   * 绘制线条
   * @param {number} ctx 上下文
   * @param {number} sx 开始坐标点横坐标
   * @param {number} sy 开始坐标点纵坐标
   * @param {number} ex 结束坐标点横坐标
   * @param {number} ey 结束坐标点纵坐标
   * @param {string} lineColor 线条颜色
   * @param {number} lineWidth 线条宽度
   */
export const renderLine = (ctx, sx, sy, ex, ey, lineColor = COLOR.BLACK, lineWidth = 0.2) => {
  ctx.beginPath()
  ctx.moveTo(sx, sy)
  ctx.lineTo(ex, ey)
  ctx.strokeStyle = lineColor
  ctx.lineWidth = lineWidth
  ctx.stroke()
  ctx.closePath();
}

/**
   * 绘制文字
   * @param {object} ctx 上下文
   * @param {number} x 横坐标
   * @param {number} y 纵坐标
   * @param {string} text 文本
   * @param {string} align 文本对齐方式
   * @param {string} color 文本颜色
   */
export const renderText = (ctx, x, y, text, align = 'left', color = '#FFF') => {
  ctx.fillStyle = color;  // 文字颜色
  ctx.textBaseline = "middle";
  ctx.textAlign = align;

  ctx.font = "10px Arial";  // 高为10px的字体
  ctx.fillText(text, x, y)  // 描绘实体文字
}

/**
 * 计算Y轴刻度对应的数值：根据最大最小值动态变化
 * @param {number} height y轴刻度的高度
 * @param {number} maxValue 最大值
 * @param {number} minValue 最小值
 * @param {number} yAxisHeight y轴高度
 * @returns number 刻度对应的数值
 */
export const yAxisTickText = (height, maxValue, minValue, yAxisHeight) => {
  // value 与 y轴高度的比例
  const ratio = (maxValue - minValue) / yAxisHeight
  const value = (minValue + height * ratio).toFixed(2)
  return value
}

/**
 * 求x轴刻度横坐标
 * @param {number} i 下标
 * @param {number} xAxisPointX x轴原点横坐标
 * @param {number} xAxisItemSpace x轴刻度间距
 * @returns number x轴刻度横坐标
 */
export const xAxisTickPointX = (i, xAxisPointX, xAxisItemSpace) => {
  return xAxisPointX + i * xAxisItemSpace
}

/**
 * 求该值在y轴高度中的所占的高度值
 * @param {number} value 数值
 * @param {number} maxValue 最大值
 * @param {number} minValue 最小值
 * @param {number} yAxisHeight y轴高度
 * @returns number 该数值的对应高度
 */
export const valueHeight = (value, maxValue, minValue, yAxisHeight) => {
  // 每块钱占自定义坐标系的高度
  const rate = yAxisHeight / (maxValue - minValue)
  // 当前价格占自定义坐标系的高度
  const h = rate *  (value - minValue)
  return h;
}

/**
   * 绘制矩形
   * @param {object} ctx 上下文
   * @param {number} x 横坐标
   * @param {number} y 纵坐标
   * @param {number} width 宽度
   * @param {number} height 高度
   * @param {string} color 颜色
   */
export const renderRect = (ctx, x, y, width = 20, height, color) => {
  const halfWidth = width / 2

  // 绘制矩形
  ctx.beginPath()
  ctx.moveTo(x - halfWidth, y)
  ctx.rect(x - halfWidth, y, width, height)
  ctx.fillStyle = color
  ctx.fill();
}

/**
 * 返回像素比
 * @param {object} context 渲染上下文
 * @returns number
 */
export const getPixelRatio = function (context) {
  var backingStore = context.backingStorePixelRatio ||
      context.webkitBackingStorePixelRatio ||
      context.mozBackingStorePixelRatio ||
      context.msBackingStorePixelRatio ||
      context.oBackingStorePixelRatio ||
      context.backingStorePixelRatio || 1;
  return (window.devicePixelRatio || 1) / backingStore;
};

/**
 * 深度合并对象
 * @param {object} object 默认对象
 * @param {object} target 目标对象
 */
export const mergeObject = (object = {}, target = {}) => {
  const res = {}
  for (const key in object) {
    if (Object.prototype.toString.call(target[key]) === '[object Object]') {
      res[key] = mergeObject(object[key], target[key])
    } else {
      res[key] = target[key] || object[key]
    }
  }
  return res;
}