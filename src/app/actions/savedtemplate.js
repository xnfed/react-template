import request from '../../utils/request'
import * as types from '../constants/ActionTypes'
import { STATIC_API } from '../../utils/constants'
const componentObj = {};

export function fetchAddcomponent(params) {
    let {fieldType, modelId} = params;
    return (dispatch, getState) => {
        const url = `${STATIC_API}/modelField/queryModelFieldList`;
        let data = {
            fieldType,
            modelId,
        };
        return request.GET(url,data)
            .then(resp => {
                let params = {
                    data: resp
                };
                dispatch(receiveAddComponent(params));
                return resp
            })
    }
}

function receiveAddComponent(params) {
    return {
        type: types.RECEIVE_ADD_COMPONENT,
        params
    }
}

export function fetchSavedtemplate( modelId ) {
    return (dispatch, getState) => {

        const url = `${STATIC_API}/template/queryViewTemplate`;

        let data = {
            modelId,
        };

        return request.GET(url,data)
            .then(resp => {
                dispatch(receiveSavedTemplate(resp, componentObj));
                return resp
            })
    }
}

function receiveSavedTemplate(savedtemplate, componentObj) {
    return {
        type: types.RECEIVE_SAVED_TEMPLATE,
        savedtemplate,
        componentObj
    }
}

// 向页签中添加组件
export function fetchPushcomponent( params ){
    return {
        type: types.RECEIVE_PUSH_COMPONENT,
        params
    }
}

export function deleteComponent(params){
    return {
        type: types.RECEIVE_DELETE_COMPONENT,
        params,
    }
}

// 添加标签
export function addTabs(params) {
    return {
        type: types.RECEIVE_ADD_TAB,
        params
    }
}

// 修改标签信息
export function changeTabs(params) {
    return {
        type: types.RECEIVE_CHANGE_TAB,
        params
    }
}

// 删除标签信息
export function deleteTabs(params) {
    return {
        type: types.RECEIVE_DELETE_TAB,
        params
    }
}

// 修改页签状态
export function changeTabStatus(params) {
    return {
        type: types.RECEIVE_CHANGE_TABSTATUS,
        params
    }
}
// 重置样式
export function resetData(params) {
    return {
        type: types.RECEIVE_RESET_DATA,
        params
    }
}
// man端富文本
export function fetchManSaleTitle(categoryId, callBack) {
    return (dispatch, getState) => {
        const url = `${STATIC_API}/config/getSaleTips`;
        return request.GET(url, {
            categoryId: categoryId
        })
            .then(resp => {
                callBack(resp);
            })
    }
}

// 获取初始组件(用来与初始模版组件做对比)
export function fetchInitComponent( typeList, modelId, callback ) {
    return (dispatch) => {
        let promises = typeList.map((item) => {
            return getComponent(item.key, item.value, modelId);
        });
        return Promise.all(promises).then(() => {
            dispatch(fetchSavedtemplate(modelId))
        })
    };
}

export function getComponent(fieldType, fieldName, modelId) {
    const url = `${STATIC_API}/modelField/queryModelFieldList`;

    let data = {
        fieldType,
        modelId,
    };

    return request.GET(url,data)
        .then(resp => {
            let data = resp.data;
            let tempList = data.map((item) => {
                return item.letter;
            });
            Object.assign(componentObj, {
                [fieldName]: tempList
            });
            return resp
        })
}

// 删除销售属性多模式页签
export function deleteSaleTabs(params) {
    return {
        type: types.DELETE_SALE_TABS,
        params
    }
}

export function setSaleTabs(params) {
    return {
        type: types.SET_SALE_TABS,
        params
    }
}
