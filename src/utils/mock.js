// mock接口数据文件
import moment from 'moment'

/**
 *
 * @param {Object} param 获取K线图接口数据
 * @returns
 */
const getKLineMockData = function (param) {
  // mean 均值; stddev 差值
  const { pageSize = 10, endTime = '', mean = 500, stddev = 10 } = param
  return new Promise((resolved, rejected) => {
    setTimeout(resolved, 500, new Array(pageSize).fill({}).map((item, index) => {
      const openingPrice = Math.round(Math.max(0, mean + stddev * randn_bm()))
      const closingPrice = Math.round(Math.max(0, mean + stddev * randn_bm()))
      const highestPrice = Math.max(openingPrice, closingPrice) + Math.round(stddev/2 * randn_bm())
      const lowestPrice = Math.min(openingPrice, closingPrice) - Math.round(stddev/2 * randn_bm())

      return {
        id: Math.random().toString().slice(2, 7),
        date: moment(endTime).subtract(pageSize - index - 1, 'days').format('MM-DD'),
        openingPrice,
        closingPrice,
        highestPrice,
        lowestPrice,
      }
    }))
  })
}

function randn_bm() {
    var u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    return Math.abs(Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v))
}

/**
 *
 * @param {Object} param 获取柱状图接口数据
 * @returns
 */
 const getBarMockData = function () {
  return new Promise((resolved, rejected) => {
    setTimeout(resolved, 500, new Array(7).fill({}).map((item, index) => {
      return {
        date: moment().subtract(7 - index - 1, 'days').format('MM-DD'),
        value: +('10' + Math.random().toString().slice(2, 3)),
      }
    }))
  })
}

export {
  getKLineMockData,
  getBarMockData
}