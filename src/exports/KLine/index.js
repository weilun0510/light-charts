import React, { useLayoutEffect, useState } from 'react'
import './index.css';

import { COLOR, TEXT_COLOR, BG_COLOR, BORDER_COLOR, LINE_COLOR } from '../../colors/light';
import { renderLine, xAxisTickPointX, valueHeight, renderText, yAxisTickText, setCanvasSize, mergeObject, drawRoundedRect } from '../../utils/common';

const KLine = ({ option = {}, loadData, style = { width: '600px', height: '300px' } }) => {
  // 默认配置项
  const defaultConfig = {
    // 均线类型
    avgList: [5, 10, 20],
    // 是否绘制辅助线
    showTips: true,
    // 是否可以拖拽
    canDrag: true,
    // 是否可缩放
    canScroll: true,
    pageSize: 40,
    // 最多一页展示多少条数据（最多maxShowSize条）
    maxShowSize: 80,
    // 基础默认配置
    // y轴分段数量
    yAxisSplitNumber: 4,
    // 背景色
    backgroundColor: BG_COLOR.BODY,
    // x轴元素「文字和刻度」最大展示个数
    xAxisItemMaxShowNumber: 5,
    // 坐标轴与容器间的边距
    grid: {
      left: 30,
      right: 30,
      top: 20,
      bottom: 20,
      height: 'auto',
      width: 'auto',
    },
    // 刻度相关
    axisTick: {
      length: 5,
      show: true,
    },
  }

  const config = mergeObject(defaultConfig, option)
  const { yAxisSplitNumber, grid, axisTick: { length: tickLength }, avgList, showTips, canDrag, canScroll, pageSize, maxShowSize, backgroundColor, xAxisItemMaxShowNumber } = config;

  const [MAList, setMAList] = useState(() => {
    const map = new Map([]);
    const colorMap = {
      5: LINE_COLOR.YELLOW,
      10: LINE_COLOR.ORANGE,
      20: LINE_COLOR.BLUE,
    }
    avgList.forEach(day => {
      map.set(day, { color: colorMap[day], curVal: '', list: [] })
    })
    return map
  }) // 平均线集合)

  // 因为该函数只能执行一次，我们想要更新数据，又想要拿到上次的值，所以使用useRef
  // 如果能确保只执行一次，使用普通变量也可以，不能确保的话，使用useRef
  let dataSource = []
  let leftDataSource = []
  let rightDataSource = []

  // 初始变量：因为使用了React.memo,所以该函数只会执行一次，那么这些变量可以放在函数内部
  // TODO: ctx 放在useRef里
  let ctx = ''
  let canvasWidth = ''
  let canvasHeight = ''
  let yAxisOriginPointY = '' // y轴原点纵坐标
  let yAxisHeight = ''  // y轴高度
  let yAxisTickSpace = '' // y轴刻度间距
  let xAxisVertexX = '' // x轴顶点横坐标
  let xAxisWidth = '' // x轴宽度
  let init = true

  // 初始常量
  const originalPointX = grid.left // 原点横坐标
  const yAxisVertexY = grid.top // y轴顶点纵坐标

  // 随画布元素数量变化而变化的属性
  let xAxisItemWidth = '' // // x轴元素宽度
  let xAxisItemLength = pageSize
  let candleWidth = ''  // 蜡烛宽度


  /**
   * 绘制一串蜡烛（更新阶段）
   * @param {array} dataYAxisPoint 数据源
   * @param {number} candleWidth 蜡烛宽度
   */
  const renderCandles = (dataYAxisPoint, candleWidth) => {
    for (let i = 0, candleLength = dataYAxisPoint.length; i < candleLength; i++) {
      renderCandle(dataYAxisPoint[i], xAxisTickPointX(i, originalPointX, xAxisItemWidth), candleWidth)
    }
  }

  /**
   * 逐个渲染一串蜡烛（首次加载阶段）
   */
  const oneByOneRenderCandle = (dataYAxisPoint, candleWidth) => {
    for(let i = 0, candleLength = dataYAxisPoint.length; i < candleLength; i++) {
      (function(j) {
        setTimeout(() => {
          renderCandle(dataYAxisPoint[j], xAxisTickPointX(j, originalPointX, xAxisItemWidth), candleWidth)
        }, j * 100)
      }(i))
    }
  }

  /**
   * 绘制单个蜡烛
   * @param {number} dataItem 当前元素数据
   * @param {number} xAxisItemPointX 蜡烛横坐标
   * @param {number} candleWidth 蜡烛宽度
   */
  const renderCandle = (dataItem, xAxisItemPointX, candleWidth) => {
    const candleWidthHalf = candleWidth / 2

    const { highestPrice, lowestPrice, openingPrice, closingPrice } = dataItem
    let secondPointY = undefined;
    let thirdPointY = undefined;
    let candleColor = undefined;

    if (closingPrice < openingPrice) {
      // 涨
      candleColor = COLOR.RED
      secondPointY = closingPrice
      thirdPointY = openingPrice
    } else {
      candleColor = COLOR.GREEN
      secondPointY = openingPrice
      thirdPointY = closingPrice
    }

    // 绘制蜡烛上影线
    renderLine(ctx, xAxisItemPointX, highestPrice, xAxisItemPointX, secondPointY, candleColor, 1)

    // 绘制蜡烛下影线
    renderLine(ctx, xAxisItemPointX, lowestPrice, xAxisItemPointX, thirdPointY, candleColor, 1)

    // 绘制蜡烛实体（绘制矩形）
    ctx.beginPath()
    ctx.moveTo(xAxisItemPointX - candleWidthHalf, secondPointY)
    ctx.rect(xAxisItemPointX - candleWidthHalf, secondPointY, candleWidth, thirdPointY - secondPointY)
    ctx.fillStyle = candleColor

    if (candleColor === COLOR.RED) {
      ctx.stroke()
    } else {
      ctx.fill();
    }
  }

  /**
   * 绘制辅助线画布
   */
  const renderTipCanvas = () => {
    console.log('绘制辅助线画布');
    const tipCanvas = document.getElementById('tipCanvas');
    const ctxTip = tipCanvas.getContext('2d');

    const maxPrice = Math.max(...dataSource.map(x => x.highestPrice)) + 5
    const minPrice = Math.min(...dataSource.map(x => x.lowestPrice)) - 5

    // 提示框内部样式配置
    const padding_horizontal = 10;
    const padding_vertical = 20;
    const item_space = 20;

    // 提示框元素宽度
    let tipInfoElWidth = 100
    // 提示框高度
    let tipInfoElHeight = 120
    // x轴y轴上的提示背景框的宽、高
    const xyAxisTipBoxWidth = 50
    const xyAxisTipBoxHeight = 20

    // 判断鼠标是否在k线图内容区域
    const isContentArea = (e) => {
      const { offsetX, offsetY } = e
      return  offsetX > originalPointX - candleWidth/2 &&
              offsetX < canvasWidth + candleWidth/2 - grid.right - xAxisWidth / xAxisItemLength &&
              offsetY > grid.top &&
              offsetY < yAxisOriginPointY
    }

    // 监听鼠标移动事件并绘制辅助线
    tipCanvas.addEventListener('mousemove', function (e) {
      // 鼠标距目标节点左上角的X坐标、Y坐标
      const { offsetX, offsetY } = e
      // 清除画布
      ctxTip.clearRect(0, 0, canvasWidth, canvasHeight)
      // 不在内容区域则不进行绘制
      if (!isContentArea(e)) return

      // 绘制水平辅助线
      ctxTip.beginPath();
      ctxTip.setLineDash([3, 3]); // 设置虚线样式
      ctxTip.moveTo(originalPointX, offsetY);
      ctxTip.lineTo(canvasWidth - grid.right - xAxisWidth / xAxisItemLength, offsetY);
      ctxTip.strokeStyle = BORDER_COLOR.SECOND
      ctxTip.stroke();

      // 绘制垂直辅助线
      ctxTip.beginPath();
      ctxTip.setLineDash([3, 3]);
      ctxTip.moveTo(offsetX, grid.top);
      ctxTip.lineTo(offsetX, yAxisOriginPointY);
      ctxTip.strokeStyle = BORDER_COLOR.PRIMARY
      ctxTip.stroke();

      // 绘制y轴tip文字背景框
      ctxTip.beginPath();
      ctxTip.rect(originalPointX, offsetY - xyAxisTipBoxHeight / 2, xyAxisTipBoxWidth, xyAxisTipBoxHeight);
      ctxTip.fillStyle = BORDER_COLOR.SECOND
      ctxTip.fill();

      // 绘制y轴tip文字
      renderText(ctxTip, originalPointX + 25, offsetY, yAxisTickText(yAxisOriginPointY - offsetY, maxPrice, minPrice, yAxisHeight), 'center', COLOR.WHITE)

      // 绘制x轴tip文字背景框
      ctxTip.beginPath();
      ctxTip.rect(offsetX - xyAxisTipBoxWidth / 2, yAxisOriginPointY, xyAxisTipBoxWidth, xyAxisTipBoxHeight);
      ctxTip.fillStyle = BORDER_COLOR.SECOND
      ctxTip.fill();

      // 绘制x轴tip文字
      // 获取x轴元素在x轴上的下标
      const xTipIndex = Math.round((offsetX - originalPointX) / xAxisWidth * xAxisItemLength)
      renderText(ctxTip, offsetX, yAxisOriginPointY + xyAxisTipBoxHeight / 2, dataSource.map((x) => x.date)[xTipIndex] || '', 'center', COLOR.WHITE);

      // 更新均线值
      [...MAList].map((x) => {
        const [day, obj] = x;
        const curVal = obj.list[xTipIndex]
        document.getElementById(`avg${day}`).innerText = `MA${day} ${curVal}`
      })

      // 绘制提示框
      const dist = 10 // 提示框距离鼠标的距离
      const marginTop = yAxisVertexY + 30 // 提示框距离画布顶部的距离
      let tipInfoPointX = offsetX + dist  //  提示框的开始横坐标
      // TODO
      if (offsetX >  (canvasWidth / 2 - grid.left)) {
        // if (xTipIndex > xAxisItemLength / 2) {
        tipInfoPointX = offsetX - tipInfoElWidth - dist
      }
      ctxTip.beginPath()
      drawRoundedRect({
        x: tipInfoPointX,
        y: marginTop,
        width: tipInfoElWidth,
        height: tipInfoElHeight
      }, 10, ctxTip)
      ctxTip.fillStyle = BG_COLOR.COMPONENT
      ctxTip.globalAlpha = 0.9
      ctxTip.fill();

      const { date, highestPrice, lowestPrice, openingPrice, closingPrice } = dataSource[xTipIndex]
      const dataArr = [
        { label: '开盘', value: openingPrice },
        { label: '收盘', value: closingPrice },
        { label: '最高', value: highestPrice },
        { label: '最低', value: lowestPrice },
      ]
      const cloneDataArr = [{ label: '时间', value: date }, ...dataArr];
      // 绘制提示框内的元素
      cloneDataArr.forEach(({ label, value }, i) => {
        const y = marginTop + padding_vertical + i * item_space;
        renderText(ctxTip, tipInfoPointX + padding_horizontal, y, label, 'left', TEXT_COLOR.PRIMARY, '13px')
        renderText(ctxTip, tipInfoPointX + tipInfoElWidth - padding_horizontal, y, value, 'right', i !== 0 ? TEXT_COLOR.PRIMARY : TEXT_COLOR.RED, '13px')
      })
    }, false)
  }

  // 拖拽
  const getDrag = () => {
    // 水平拖动距离
    let horizontalDragDistance = 0
    // 插入数据时的光标位置
    let insertPosition = 0
    // 光标的上一个位置，用于判断拖动方向
    let lastPosition = ''

    /* 开始拖动目标元素时触发dragstart事件 */
    document.addEventListener("dragstart", function( event ) {
      // 清除提示画布
      const tipCanvas = document.getElementById('tipCanvas');
      const ctxTip = tipCanvas.getContext('2d');
      ctxTip.clearRect(0, 0, canvasWidth, canvasHeight)

      insertPosition = event.offsetX
      lastPosition = event.offsetX
    }, false);

    /* 拖动目标元素时触发drag事件 */
    document.addEventListener("drag", function( event ) {
      const { offsetX } = event

      // TODO 不清楚小于0的场景,是被display: none的原因吗??
      if (offsetX < 0) return

      // 计算水平拖动距离
      horizontalDragDistance = Math.abs(offsetX - insertPosition)

      const draggableNode = document.getElementById('draggable')
      draggableNode.style.cursor = 'grabbing'

      // 如果拖动距离大于x轴元素间距，则插入数据
      if ( horizontalDragDistance > xAxisItemWidth) {
        // 数据处理：根据上一刻的光标位置，判断鼠标拖动方向，更新数据重新渲染
        if (lastPosition !== offsetX) {
          console.log('拖拽中....');
          // 往右拖动
          if (lastPosition < offsetX) {
            // 如果左侧数据全部显示完成，则不绘制
            if (leftDataSource.length === 0) return

            dataSource.unshift(leftDataSource.pop())
            rightDataSource.unshift(dataSource.pop())
          } else {
            // 往左拖动
            if (rightDataSource.length === 0) return

            dataSource.push(rightDataSource.shift())
            leftDataSource.push(dataSource.shift())
          }
        }

        // 记录插入数据时的光标位置，用户判断下次的拖动方向
        insertPosition = offsetX

        // 清除画布并输入新数据重新绘制
        ctx.clearRect(0, 0, canvasWidth, canvasHeight)

        // 触发重新渲染
        renderCanvas()
      }

      lastPosition = offsetX
    }, false);

    // 拖动结束时，隐藏draggable，否则辅助线出不来
    document.addEventListener("dragend", function() {
      console.log('-------拖拽结束');
      const draggableNode = document.getElementById('draggable')
      draggableNode.style.display = 'none'
      draggableNode.style.cursor = 'default'

      // 请求数据：如果左侧数据小于页数，请求接口数据
      if (leftDataSource.length < maxShowSize) {
        console.log('leftDataSource', leftDataSource);
        console.log(`request: 左侧数据小于${maxShowSize}条，请求左侧数据，并赋值给myLeftDataSource.current`);

        // 请求数据
        loadData(maxShowSize, leftDataSource[0].date).then(res => {
          leftDataSource = [...res, ...leftDataSource]
        })
      }
    }, false);

    // 鼠标按下时，显示拖拽元素在最上层
    tipCanvas.addEventListener('mousedown', function (e) {
      const kWrapNode = document.getElementById('canvasWrap')
      const draggableNode = document.getElementById('draggable')

      // 如果拖拽元素存在，则显示（避免重复创建）
      if (draggableNode) {
        draggableNode.style.display = 'block'
        draggableNode.style.cursor = 'grab'
        return
      }

      //创建拖拽元素
      const div = document.createElement('div')
      div.style.position = 'absolute'
      div.style.zIndex = '10'
      div.style.left = `${grid.left}px`
      div.style.top = `${grid.top}px`
      div.style.width = `${canvasWidth - grid.left - grid.right}px`
      div.style.height = `${canvasHeight - grid.top - grid.bottom}px`
      div.style.cursor = 'grab'
      div.setAttribute('id', 'draggable')
      div.setAttribute('draggable', 'true')

      kWrapNode.appendChild(div)

      // 处理“没有拖动时，单击拖拽元素后提示画布没有隐藏，表现为卡顿'的情况
      // 解决：mouseup 时，隐蔽自己，否则拖拽元素在最上层，提示画布将被遮挡无法显示
      // 因为拖拽元素在最上层，所以 mouseup 事件要绑定在拖拽元素上，绑在 tipCanvas 上无效
      div.addEventListener('mouseup', function(e) {
        div.style.display = 'none'
      })
    }, false)
  }

  // 缩放
  const getScroll = () => {
    const kWrapNode = document.getElementById('canvasWrap')
    let timer = null

    // 监听滚轮事件（只考虑chrome）
    // 如需兼容火狐和ie，参考 https://blog.csdn.net/u014205965/article/details/46045099
    kWrapNode.addEventListener('wheel', function(e) {
      const { deltaX, deltaY } = e
      console.log(Date.now());

      // 方向判断
      if (Math.abs(deltaX) !== 0 && Math.abs(deltaY) !== 0) return console.log('没有固定方向');
      if (deltaX < 0) return console.log('向右');
      if (deltaX > 0) return console.log('向左');

      if (deltaY > 0) {
        // console.log('向上、放大');
        // 最小展示条数
        if (dataSource.length <= pageSize) return

        // 处理数据
        leftDataSource.push(dataSource.shift())
        rightDataSource.unshift(dataSource.pop())
      };

      if (deltaY < 0) {
        // console.log('向下、缩小')
        if (dataSource.length >= maxShowSize) return

        dataSource = [leftDataSource.pop(), ...dataSource]
      }

      // 1. 先判断是否停止 2.停止后做什么
      if (timer) {
        clearTimeout(timer)
      }
      // 模拟缩放结束事件
      const wheelStop = () => {
        // 滚动停止时执行的代码
        console.warn('wheelStop');
        if (leftDataSource.length < maxShowSize) {
          // 请求数据
          loadData(maxShowSize, dataSource[0].date).then(res => {
            leftDataSource = [...res, ...leftDataSource]
          })
        }
      }
      timer = setTimeout(wheelStop, 500);

      ctx.clearRect(0, 0, canvasWidth, canvasHeight)
      renderCanvas()
    }, false)
  }

  /**
   * 绘制画布
   */
   const renderCanvas = () => {
    if (dataSource.length === 0) return

    xAxisItemLength = dataSource.length
    xAxisItemWidth = xAxisWidth / xAxisItemLength
    const itemSpace = 3 // 表示x轴元素间距
    candleWidth = (xAxisWidth - itemSpace * (xAxisItemLength - 1)) / xAxisItemLength

    const maxPrice = Math.max(...dataSource.map(x => x.highestPrice)) + 5
    const minPrice = Math.min(...dataSource.map(x => x.lowestPrice)) - 5

    console.log('--------开始绘制k线图');

    // 实际价格转为canvas纵坐标
    const tranPriceToOrdinate = (price) => {
      return yAxisOriginPointY - valueHeight(price, maxPrice, minPrice, yAxisHeight)
    }

    // 纵坐标集合
    const dataYAxisPoint = dataSource.map(it => {
      const newIt = {}
      for (const key in it) {
        if (key === 'date') continue
        newIt[key] = tranPriceToOrdinate(it[key])
      }
      return newIt
    })

    // 绘制y轴文字和网格线
    for (let i = 0; i < yAxisSplitNumber; i++) {
      let sx = originalPointX
      let ex = originalPointX + tickLength
      let y = yAxisOriginPointY - yAxisTickSpace * i
      // renderText(ctx, sx - candleWidth / 2 - 3, y, yAxisTickText(i*yAxisTickSpace, maxPrice, minPrice, yAxisHeight), 'right', TEXT_COLOR.PRIMARY)
      renderLine(ctx, sx, y, xAxisVertexX, y, BORDER_COLOR.SECOND) // 网格线
    }

    // 绘制x轴
    // renderLine(ctx, originalPointX, yAxisOriginPointY, xAxisVertexX, yAxisOriginPointY, BORDER_COLOR.SECOND)

    // 绘制x轴刻度与文字
    const remainder = Math.ceil(xAxisItemLength / (xAxisItemMaxShowNumber - 1))
    for (let i = 0; i < xAxisItemLength; i++) {
      const xAxisTickX = xAxisTickPointX(i, originalPointX, xAxisItemWidth)

      // 隔点展示
      // if (i % remainder === 0 || i === xAxisItemLength - 1) {
      if (i % remainder === 0) {
        renderText(ctx, xAxisTickX, yAxisOriginPointY + tickLength + 10, dataSource.map((x) => x.date)[i], 'center', TEXT_COLOR.PRIMARY)
        renderLine(ctx, xAxisTickX, yAxisOriginPointY, xAxisTickX, yAxisOriginPointY + tickLength, BORDER_COLOR.SECOND) // 刻度线
        renderLine(ctx, xAxisTickX, yAxisOriginPointY, xAxisTickX, yAxisVertexY, BORDER_COLOR.SECOND) // 网格线
      }
    }

    /**
     * 绘制贝塞尔曲线
     * @param {array} controlPoint 控制点集合: [{ curX: lowestPricePointX, curY: lowestPricePointY, prevControlX, prevControlY, nextControlX, nextControlY } ...]
     * @param {string}  color 曲线颜色
     */
    const renderBezierCurve = (controlPoint, color) => {
      ctx.beginPath();
      for (let i = 0; i < controlPoint.length; i++) {
        const {
          curX,
          curY,
          prevControlX,
          prevControlY,
        } = controlPoint[i]

        if (i > 0 && i < controlPoint.length) {
          const prevNode = controlPoint[i - 1]
          ctx.bezierCurveTo(prevNode.nextControlX, prevNode.nextControlY, prevControlX, prevControlY, curX, curY);
          ctx.strokeStyle = color
          ctx.lineWidth = 0.7
        } else if ( i === 0) {
          ctx.moveTo(curX, curY);
        }
      }
      ctx.stroke();
    }

    /**
     * 求均线值在纵坐标中的值的集合。Moving average 移动平均线。MA = (C1+C2+C3+C4+C5+....+Cn)/n C 为收盘价，n 为移动平均周期数
     * @param {number} day 前day天
     * @returns array 纵坐标集合
     */
    const getMA = (day) => {
      // const result = [];
      const avgList = []
      dataSource.map((it, i) => {
        let beforeDays = [] // 前day日，开盘价集合
        if (i < day) {
          beforeDays = [...leftDataSource.slice(-day + i), ...dataSource.slice(0, i)];
        } else {
          beforeDays = [...dataSource.slice(i-day, i)]
        }
        const totalOpenPrice = beforeDays.reduce((prev, item) => prev + item.openingPrice, 0)
        // result.push(tranPriceToOrdinate())
        avgList.push(totalOpenPrice / day)

        // 初始化时，当前日期的均线值
        if (i === dataSource.length - 1) {
          setMAList(MAList.set(day, { ...MAList.get(day), curVal: totalOpenPrice / day }))
        }
      })
      setMAList(MAList.set(day, { ...MAList.get(day), list: avgList }))

      return avgList.map(x => tranPriceToOrdinate(x));
    }

    /**
     * 获取平均线控制点集合
     * @param {number} day 前day天
     * @returns [array] 当前点以及前后控制点坐集合
     */
    const getMAControlPointInfo = (day) => {
      let controlPoint = []
      const _MAList = getMA(day)

      for (let i = 0; i < xAxisItemLength; i++) {
        const pricePointX = xAxisTickPointX(i, originalPointX, xAxisItemWidth)
        const pricePointY = _MAList[i]
        let prevNode = 0  // 前控制的纵坐标
        let nextNode = 0

        // 边界处理：在首尾加入虚拟点，补全第一个元素没有前控制点，末尾元素没有后控制点的情况
        if (i === 0) {
          prevNode = pricePointY + 1
          nextNode = _MAList[i + 1]
        } else if (i === xAxisItemLength - 1) {
          prevNode = _MAList[i - 1]
          nextNode = pricePointY + 1
        } else {
          prevNode = _MAList[i - 1]
          nextNode = _MAList[i + 1]
        }
        // 前后点构成的三角形
        // b: 三角形的高
        const triangleHeight = Math.abs(nextNode - prevNode)

        // a: 三角形底边
        const triangleBottomLine = xAxisItemWidth * 2
        // c: 三角形斜边 = (高的平方+底边的平方)的平方根
        const triangleHypotenuse = Math.sqrt(Math.pow(triangleHeight, 2) +  Math.pow(triangleBottomLine, 2))

        // 前后控制点为斜边的三角形
        // C: 控制点三角形斜边长度(自定义)
        const controlPointW = xAxisItemWidth * 0.5
        // A: 控制点三角形底边
        const controlPointBottomLine = controlPointW * triangleBottomLine / triangleHypotenuse
        // B: 控制点三角形的高
        const controlPointHeight = controlPointW * triangleHeight / triangleHypotenuse

        // 前一个控制点纵坐标
        let prevControlY = undefined
        // 后一个控制点纵坐标
        let nextControlY = undefined

        // 相对于canvas的坐标，如果前个控制点纵坐标小于下个控制点的纵坐标（相当于视觉上的左高右低）
        if (prevNode < nextNode) {
          // 左高右低
          prevControlY = pricePointY - controlPointHeight / 2
          nextControlY = pricePointY + controlPointHeight / 2
        } else {
          prevControlY = pricePointY + controlPointHeight / 2
          nextControlY = pricePointY - controlPointHeight / 2
        }

        controlPoint.push({
          curX: pricePointX,
          curY: pricePointY,
          prevControlX: pricePointX - controlPointBottomLine / 2,
          prevControlY,
          nextControlX: pricePointX + controlPointBottomLine / 2,
          nextControlY
        })
      }

      return controlPoint
    }

    // 绘制平均线
    [...MAList].forEach((x) => {
      const [day, obj] = x;
      renderBezierCurve(getMAControlPointInfo(day), obj.color)
    })

    if (init) {
      oneByOneRenderCandle(dataYAxisPoint, candleWidth)
      showTips && renderTipCanvas();
      canDrag && getDrag();
      canScroll && getScroll();
    } else {
      // 绘制一串蜡烛
      renderCandles(dataYAxisPoint, candleWidth)
    }

    console.log('绘制完成');
    init = false
  }

  // 得到上下文，开始初始化画布
  useLayoutEffect(() => {
    const canvasEl = document.getElementById('canvas');
    const tipCanvasEl = document.getElementById('tipCanvas');
    if (!canvasEl.getContext) {
      console.error('该浏览器不支持展示<canvas>标签');
      return;
    }

    ctx = canvasEl.getContext('2d')
    const { width, height } = setCanvasSize(canvasEl, style, grid.width, grid.height)
    setCanvasSize(tipCanvasEl, style, grid.width, grid.height)

    // 可知条件
    canvasWidth = width
    canvasHeight = height
    yAxisOriginPointY = height - grid.bottom
    yAxisHeight = height - (grid.top + grid.bottom)
    yAxisTickSpace = yAxisHeight / (yAxisSplitNumber - 1)
    xAxisVertexX = width - grid.left
    xAxisWidth = width - grid.left - grid.right
    xAxisItemWidth = xAxisWidth / xAxisItemLength

    // 请求数据
    loadData(pageSize + maxShowSize).then(res => {
      const data = res;
      dataSource = data.slice(maxShowSize)
      leftDataSource = data.slice(0, maxShowSize)
      renderCanvas()
    })
  }, [])

  console.log('-----------render--------------');

  return (
    <>
      <div className="labels-container">
        <span className='abg-label'>均线</span>
        {[...MAList].map((x) => {
          const [type, obj] = x;
          return <span key={`avg${type}`} style={{ color: obj ? obj.color : ''  }} id={`avg${type}`}>{`MA${type} ${obj ? obj.curVal : ''}`}</span>
        })}
      </div>
      <div id="canvasWrap">
        <canvas id="canvas" style={{ backgroundColor }}></canvas>
        <canvas id="tipCanvas"></canvas>
      </div>
    </>

  )
}
export default React.memo(KLine)

