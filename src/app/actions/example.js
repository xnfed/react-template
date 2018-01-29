import http from '../../utils/request'
import { STATIC_API } from '../../utils/constants'
import * as types from '../constants/ActionTypes'

export function test() {
  return (dispatch, getState) => {
    const url = `${STATIC_API}/config/getSaleTips/11291`;
    return http.get(url)
      .then(resp => {
        dispatch({
          type: types.EXAMPLE,
          title: '测试'
        });
      })
  }
}
