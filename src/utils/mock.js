// mock接口数据文件
import moment from 'moment'

/**
 *
 * @param {Object} param 获取K线图接口数据
 * @returns
 */
const getKLineMockData = function (param) {
  console.log('------------------param: ', param);
  const { pageSize = 10, endTime = '' } = param
  return new Promise((resolved, rejected) => {
    setTimeout(resolved, 500, new Array(pageSize).fill({}).map((item, index) => {
      return {
        id: Math.random().toString().slice(2, 7),
        date: moment(endTime).subtract(pageSize - index - 1, 'days').format('MM-DD'),
        heightPrice: +('10' + Math.random().toString().slice(2, 4)),
        lowPrice: +('7' + Math.random().toString().slice(2, 4)),
        openingPrice: +('8' + Math.random().toString().slice(2, 4)),
        closingPice: +('8' + Math.random().toString().slice(2, 4)),
      }
    }))
  })
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