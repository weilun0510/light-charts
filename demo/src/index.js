import React, { useEffect, useState, useCallback } from 'react'
import {render} from 'react-dom'
import moment from 'moment';
import { getKLineMockData, getBarMockData } from '../../src/utils/mock';

import { Test, KLine, Bar, Line } from '../../src'


const chartMap = [
  { label: 'k线图', value: 1 },
  { label: '柱状图', value: 2 },
  { label: '折线图', value: 3 },
]
// 该文件用于测试src中的组件，引入组件后，运行npm run start即可预览
const Demo = () => {
  const [type, setState] = useState(1);
  const [lineData, setLineData] = useState([]);

  /**
   * 请求K线图数据
   * @param {number} pageSize 页数
   * @param {string} endTime 结束时间
   */
  const getKLineData = (pageSize = 20, endTime = moment().format('MM-DD') ) => {
    return getKLineMockData({ pageSize, endTime })
  }

  useEffect(() => {
    getBarMockData().then((res) => {
      const data = res || [];
      setLineData(data)
    })
  }, [])

  useEffect(() => {
    //
    // class ECharts {
    //   constructor(dom, opts) {
    //     this.width = 300;
    //     this.height = 150;
    //   }
    //   // 处理options，并更新画布
    //   setOption() {

    //   }

    //   // 渲染函数
    //   // zrender() {
          // if(type === 'KLine') {

          // } else {

          // }
    //   // }
    // }

    // // 初始化方法
    // function init(dom) {
    //   if (!dom) {
    //     //如果传入的dom不是DOM结构的元素则抛出非法DOM结构的错误提示
    //     throw new Error('Initialize failed: invalid dom.');
    //   }

    //   // 新建echarts实例
    //   const chart = new ECharts(dom, opts)

    //   return chart
    // }

    // const echarts = {
    //   init
    // }




    // // 基于准备好的dom，初始化echarts实例
    // var myChart = echarts.init(document.getElementById('lineId'));

    // const option = {
    //   yData: lineData.map(x => x.value),
    //   xData: lineData.map(x => x.date),
    // }
    // // 使用刚指定的配置项和数据显示图表。
    // myChart.setOption(option);
  }, [])

  // z-render
  // 应用层
  // 转为react/vue组件


  const onWheelStop = () => {
    console.log('onWheelStop');
  }

  return (
    <div style={{ marginLeft: '20px' }}>
      <h1>light-charts preview</h1>
      <div style={{ marginBottom: '20px' }}>
        {chartMap.map(x => (
          <button
            onClick={() => setState(x.value)}
            style={{ marginRight: '10px', color: type === x.value ? '#365FAD' : '' }}
          >
            {x.label}
          </button>
        ))}
      </div>

      {type === 1 && (
        <KLine
          // onWheelStop={onWheelStop}
          // option={{
          //   grid: {
          //     left: 30,
          //     right: 30,
          //     top: 30,
          //     bottom: 30,
          //   },
          //   yAxisSplitNumber: 6,
          //   showTips: true,
          //   canDrag: true,
          //   canScroll: true,
          //   backgroundColor: '#f5f5f5'
          // }}
          option={{
            pageSize: 30
          }}
          loadData={getKLineData}
        />
      )}
      {type === 2 && (
        <Bar
          option={{
            yData: lineData.map(x => x.value),
            xData: lineData.map(x => x.date),
            // yData: [...lineData.map(x => x.value), ...lineData.map(x => x.value), ...lineData.map(x => x.value)],
            // xData: [...lineData.map(x => x.date),...lineData.map(x => x.date),...lineData.map(x => x.date)],
            // yAxisSplitNumber: 4,
            // grid: {
            //   left: 50,
            //   right: 40,
            //   top: 30,
            // },
            // axisTick: {
            //   length: 4,
            //   show: false,
            // },
            // backgroundColor: '#798891'
          }}
          style={{ width: '600px', height: '300px' }}
        />
      )}
      {type === 3 && (
        <Line
          option={{
            yData: lineData.map(x => x.value),
            xData: lineData.map(x => x.date),
          //   yAxisSplitNumber: 4,
          //   grid: {
          //     left: 50,
          //     right: 40,
          //     top: 30,
          //     // height: 0.5,
          //     // width: 0.5,
          //   },
          //   axisTick: {
          //     length: 4,
          //     show: false,
          //   },
          //   // backgroundColor: '#798891'
          }}
          style={{ width: '600px', height: '300px' }}
        />
      )}

    </div>
  )
}

export default Demo

render(<Demo/>, document.querySelector('#demo'))
