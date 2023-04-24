import React, { useLayoutEffect } from 'react'
import { COLOR, TEXT_COLOR, BG_COLOR, BORDER_COLOR } from '../../colors/light';
import './index.css';
import { renderLine, renderText, yAxisTickText, xAxisTickPointX, valueHeight, setCanvasSize, renderRect, mergeObject, drawRoundedRect } from '../../utils/common';

const Bar = ({ option = {}, style = { width: '600px', height: '300px' } }) => {
  // 默认配置项
  const defaultConfig = {
    yData: [],
    xData: [],
    // y轴分段数量
    yAxisSplitNumber: 5,
    // 背景色
    backgroundColor: BG_COLOR.BODY,
    // 对象放在...option后面做覆盖式更新
    // 坐标轴与容器间的边距
    grid: {
      left: 30,
      right: 30,
      top: 30,
      bottom: 30,
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
  const { yData, xData, yAxisSplitNumber, grid, axisTick: { length: tickLength, show: axisTickShow }, backgroundColor } = config;

  // 初始变量
  let canvasWidth = ''
  let canvasHeight = ''
  let yAxisHeight = ''  // y轴高度
  let xAxisWidth = ''   // x轴宽度
  let yAxisTickSpace = '' // y轴刻度间距
  let originalPointY = '' // 原点纵坐标
  let xAxisTopPointX = '' // x轴顶点横坐标
  let yAxisOriginPointY = '' // y轴原点纵坐标
  let xAxisItemLength = ''

  // 初始常量
  const originalPointX = grid.left  // 原点横坐标
  const yAxisVertexY = grid.top // y轴顶点纵坐标

  /**
   * 绘制辅助线画布
   */
   const renderTipCanvas = () => {
    console.log('绘制辅助线画布');
    const tipCanvas = document.getElementById('tipCanvas');
    const ctxTip = tipCanvas.getContext('2d');

    // 提示框内部样式配置
    const padding_horizontal = 10;
    const padding_vertical = 25;

    // 提示框元素宽度
    let tipInfoElWidth = 100
    // 提示框高度
    let tipInfoElHeight = 50

    // 判断鼠标是否在k线图内容区域
    const isContentArea = (e) => {
      const { offsetX, offsetY } = e
      return  offsetX > originalPointX &&
              offsetX < canvasWidth - grid.right &&
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

      // 获取x轴元素在x轴上的下标和数据
      const xTipIndex = Math.floor((offsetX - originalPointX) / xAxisWidth * xAxisItemLength)
      const label = xData[xTipIndex]
      const value = yData[xTipIndex]

      const xAxisItemWidth = xAxisWidth / xAxisItemLength
      const xAxisTickX = xAxisTickPointX(xTipIndex, originalPointX, xAxisItemWidth)

      const dist =  10 // 提示框距离鼠标的距离
      let tipInfoPointX = offsetX + dist  //  提示框的开始横坐标
      if (offsetX >  (canvasWidth / 2 - grid.left)) {
        tipInfoPointX = offsetX - tipInfoElWidth - dist
      }

      // 绘制矩形背景
      ctxTip.beginPath()
      ctxTip.moveTo(xAxisTickX, yAxisVertexY)
      ctxTip.rect(xAxisTickX, yAxisVertexY, xAxisItemWidth, yAxisHeight)
      ctxTip.fillStyle = COLOR.PRIMARY
      ctxTip.globalAlpha = 0.1
      ctxTip.shadowBlur = 0;
      ctxTip.shadowOffsetX = 0
      ctxTip.shadowOffsetY = 0
      ctxTip.fill();
      ctxTip.closePath();

      // 绘制提示框
      ctxTip.beginPath()
      drawRoundedRect({
        x: tipInfoPointX,
        y: offsetY + 10,
        width: tipInfoElWidth,
        height: tipInfoElHeight
      }, 5, ctxTip)
      ctxTip.fillStyle = BG_COLOR.BODY
      ctxTip.globalAlpha = 1
      // 阴影
      ctxTip.shadowColor = BORDER_COLOR.SECOND;
      ctxTip.shadowBlur = 8;
      ctxTip.shadowOffsetX = 1
      ctxTip.shadowOffsetY = 1
      ctxTip.fill();

      // 绘制提示框内的元素
      const y = offsetY + 10 + padding_vertical;
      renderText(ctxTip, tipInfoPointX + padding_horizontal, y, label, 'left', TEXT_COLOR.PRIMARY, '13px')
      renderText(ctxTip, tipInfoPointX + padding_horizontal * 6, y, value, 'left', TEXT_COLOR.PRIMARY, '14px')
    }, false)
  }

  // 绘制画布
  const renderCanvas = (ctx) => {
    // 随画布元素数量变化而变化的属性
    xAxisItemLength = xData.length;
    // 最大最小值
    const maxValue = Math.max(...yData) + 20
    // const minValue = Math.min(...yData)
    const minValue = 0
    const xAxisItemWidth = xAxisWidth / xAxisItemLength
    const itemSpace = 30 // 表示x轴元素间距
    const barWidth = (xAxisWidth - itemSpace * (xAxisItemLength - 1)) / xAxisItemLength
    const barMarginLeft = itemSpace / 2

    // 绘制y轴文字与网格线
    for (let i = 0; i < yAxisSplitNumber; i++) {
      let y = originalPointY - yAxisTickSpace * i

      // y轴文字
      renderText(ctx, originalPointX - 10, y, yAxisTickText(i*yAxisTickSpace, maxValue, minValue, yAxisHeight, 0), 'right', TEXT_COLOR.PRIMARY)
      // 水平网格线
      renderLine(ctx, originalPointX, y, xAxisTopPointX, y, BORDER_COLOR.SECOND)
    }

    // 绘制x轴
    const xAxisItemMaxShowNumber = 20;  // 最多展示xAxisItemMaxShowNumber个
    const remainder = Math.ceil(xAxisItemLength / (xAxisItemMaxShowNumber - 1))
    renderLine(ctx, originalPointX, originalPointY, xAxisTopPointX, originalPointY, COLOR.LINE)
    // 绘制x轴刻度与文字
    for (let i = 0; i < xAxisItemLength; i++) {
      const xAxisTickX = xAxisTickPointX(i, originalPointX, xAxisItemWidth)

      if (i % remainder === 0) {
        renderText(ctx, xAxisTickX + xAxisItemWidth / 2, originalPointY + tickLength + 10, xData[i], 'center', TEXT_COLOR.PRIMARY)
        axisTickShow && renderLine(ctx, xAxisTickX, originalPointY, xAxisTickX, originalPointY + tickLength, BORDER_COLOR.SECOND)
      }
    }

    // 图形坐标点集合
    const dataPoint = []
    for (let i = 0; i < xAxisItemLength; i++) {
      const value = yData[i];

      const x = xAxisTickPointX(i, originalPointX, xAxisItemWidth) + barMarginLeft
      const y = originalPointY - valueHeight(value, maxValue, minValue, yAxisHeight)
      dataPoint.push({ x, y })
    }

    // 绘制矩形
    for (let i = 0; i < xAxisItemLength; i++) {
      const value = yData[i];
      const { x, y } = dataPoint[i];
      const h = valueHeight(value, maxValue, minValue, yAxisHeight)
      ctx.beginPath()
      drawRoundedRect({
        x,
        y,
        width: barWidth,
        height: h
      }, 3, ctx)
      ctx.fillStyle = COLOR.PRIMARY
      ctx.globalAlpha = 0.9
      ctx.fill();
    }

    renderTipCanvas()
  }

  // DOM 变更之后，渲染之前 执行
  useLayoutEffect(() => {
    const canvasEl = document.getElementById('canvas');
    const tipCanvasEl = document.getElementById('tipCanvas');
    if (!canvasEl.getContext) {
      console.error('该浏览器不支持展示<canvas>标签');
      return;
    }

    const ctx = canvasEl.getContext('2d')
    const { width, height } = setCanvasSize(canvasEl, style, grid.width, grid.height)
    setCanvasSize(tipCanvasEl, style, grid.width, grid.height)

    // 可知条件：根据画布宽高计算
    canvasWidth = width
    canvasHeight = height
    yAxisHeight = height - (grid.top + grid.bottom)
    originalPointY = height - grid.bottom
    yAxisTickSpace = yAxisHeight / (yAxisSplitNumber - 1)
    xAxisTopPointX = width - grid.left
    xAxisWidth = width - grid.left - grid.right
    yAxisOriginPointY = height - grid.bottom

    // 获取到数据后再填入数据和配置项
    yData.length && renderCanvas(ctx)
  }, [yData])

  return (
    <div id="canvasWrap">
      <canvas id="canvas" style={{ backgroundColor }} />
      <canvas id="tipCanvas" />
    </div>
  )
}
export default Bar;