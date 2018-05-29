/**
 * http配置
 */
import axios from 'axios'
import { API_BASE_URL } from '../utils/constants'

let jsonpAdapter = require('axios-jsonp')

// 超时时间
axios.defaults.timeout = 5 * 60 * 1000
axios.defaults.baseURL = API_BASE_URL
// 请求携带cookie
axios.defaults.withCredentials = true
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest'
// http请求拦截器
//添加时间戳 防止缓存
axios.interceptors.request.use(
    function(config) {
        if (config.method.toLowerCase() === 'get') {
            const url = config.url
            const t = new Date().getTime()
            config.url = `${url}${url.indexOf('?') === -1 ? '?' : '&'}t=${t}`
        }
        return config
    },
    function(error) {
        return Promise.reject(error)
    }
)

//统一处理结果
axios.interceptors.response.use(
    function(response) {
        return response.data;
    },
    function(error) {
        return Promise.reject(error)
    }
)

const jsonp = (url, params = {}) => {
    return axios({
        url,
        params,
        adapter: jsonpAdapter
    })
}
export { axios as http, jsonp }
export default axios
