import React, { useLayoutEffect } from 'react'
import { COLOR, TEXT_COLOR, BG_COLOR, BORDER_COLOR } from '../../colors/light';
import { renderLine, renderText, yAxisTickText, xAxisTickPointX, valueHeight, setCanvasSize, mergeObject } from '../../utils/common';

const Line = ({ option = {}, style = { width: '600px', height: '300px' } }) => {
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
  const { yData, xData, yAxisSplitNumber, grid, axisTick: { length: axisTickLength, show: axisTickShow }, backgroundColor } = config;

  // 初始变量
  let yAxisHeight = ''  // y轴高度
  let xAxisWidth = ''   // x轴宽度
  let yAxisTickSpace = '' // y轴刻度间距
  let originalPointY = '' // 原点纵坐标
  let xAxisTopPointX = '' // x轴顶点横坐标

  // 初始常量
  const originalPointX = grid.left  // 原点横坐标

  // 绘制画布
  const renderCanvas = (ctx) => {
    // 随画布元素数量变化而变化的属性
    const xAxisItemLength = xData.length;
    // x轴元素间距
    const xAxisItemSpace = xAxisWidth / xAxisItemLength
    // 让x轴（刻度和矩形）向右移动的偏移量
    const xAxisItemSpaceHalf = xAxisItemSpace / 2
    // 最大最小值
    const maxValue = Math.max(...yData)
    const minValue = Math.min(...yData)

    // 绘制y轴文字与网格线
    for (let i = 0; i < yAxisSplitNumber; i++) {
      let y = originalPointY - yAxisTickSpace * i

      // y轴文字
      renderText(ctx, originalPointX - 10, y, yAxisTickText(i*yAxisTickSpace, maxValue, minValue, yAxisHeight, 0), 'right', TEXT_COLOR.PRIMARY)
      // 网格线
      renderLine(ctx, originalPointX, y, xAxisTopPointX, y, BORDER_COLOR.SECOND)
    }

    // 绘制x轴
    renderLine(ctx, originalPointX, originalPointY, xAxisTopPointX, originalPointY, COLOR.LINE)
    // 绘制x轴刻度与文字
    for (let i = 0; i < xAxisItemLength; i++) {
      const xAxisTickX = xAxisTickPointX(i, originalPointX, xAxisItemSpace)

      renderText(ctx, xAxisTickX + xAxisItemSpaceHalf, originalPointY + axisTickLength + 10, xData[i], 'center', TEXT_COLOR.PRIMARY)
      axisTickShow && renderLine(ctx, xAxisTickX, originalPointY, xAxisTickX, originalPointY + axisTickLength, BORDER_COLOR.SECOND)
    }

    // 折线坐标点集合
    const dataPoint = []
    for (let i = 0; i < xAxisItemLength; i++) {
      const value = yData[i];

      const x = xAxisTickPointX(i, originalPointX, xAxisItemSpace) + xAxisItemSpaceHalf
      const y = originalPointY - valueHeight(value, maxValue, minValue, yAxisHeight)
      dataPoint.push({ x, y })
    }

    // 绘制折线
    for(let i = 0; i < dataPoint.length - 1; i++) {
      const { x, y } = dataPoint[i];
      const { x: nextX, y: nextY } = dataPoint[i+1];

      renderLine(ctx, x, y, nextX, nextY, COLOR.PRIMARY, 1)

      // 绘制拐点小圆形
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2, true); // 绘制
      ctx.fillStyle = COLOR.PRIMARY;
      ctx.fill()

      // 动画
      // (function(j) {
      //   setTimeout(() => {
      //     const { x, y } = dataPoint[i];
      //     const { x: nextX, y: nextY } = dataPoint[i+1];

      //     renderLine(ctx, x, y, nextX, nextY, COLOR.PRIMARY, 1)

      //     // 绘制拐点小圆形
      //     ctx.beginPath();
      //     ctx.arc(x, y, 1, 0, Math.PI * 2, true); // 绘制
      //     ctx.fillStyle = COLOR.PRIMARY;
      //     ctx.fill()
      //   }, j * 100)
      // }(i))
    }
  }

  // DOM 变更之后，渲染之前 执行
  useLayoutEffect(() => {
    const canvasEl = document.getElementById('canvas')
    const ctx = canvasEl.getContext('2d')

    const { width, height } = setCanvasSize(canvasEl, style, grid.width, grid.height)

    // 可知条件：根据画布宽高计算
    yAxisHeight = height - (grid.top + grid.bottom)
    originalPointY = height - grid.bottom
    yAxisTickSpace = yAxisHeight / (yAxisSplitNumber - 1)
    xAxisTopPointX = width - grid.left
    xAxisWidth = width - grid.left - grid.right

    // 获取到数据后再填入数据和配置项
    yData.length && renderCanvas(ctx)
  }, [yData])

  return <canvas id="canvas" style={{ backgroundColor }} />
}
export default Line;