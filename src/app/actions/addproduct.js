import request from '../../utils/request'
import * as types from '../constants/ActionTypes'
import { MODULE_BATCH_SAVE, STATIC_API } from '../../utils/constants'
let linkageOptionObj = {};
let linkageOptionValue = {};
let bigDataList = {}; // 编辑商品 海量数据组织

export function fetchAddproduct( modelId, categoryId ) {
    return (dispatch, getState) => {
        const url = `${STATIC_API}/jmiWare/getTemplateInfo/${modelId}`;

        return request.GET(url)
            .then(resp => {
                let po = {   // pc端富文本
                    cataId: categoryId,
                    letter: 'note'
                };
                dispatch(queryRichText(po));
                let poMobile = {   // 移动端富文本
                    cataId: categoryId,
                    letter: 'appNote'
                };
                dispatch(queryRichText(poMobile));
                return resp
            })
            .then(resp => {
                dispatch(receiveAddproduct( resp ));
                return resp
            })
    }
}

function receiveAddproduct( addproduct, dim, replaceNameObj ) {
    return {
        type: types.RECEIVE_ADD_PRODUCT,
        addproduct,
    }
}

export function deleteSalesattrs(params) {
    return {
        type: types.RECEIVE_DELETE_SALESATTRS,
        params
    }
}

export function changeDimData(params) {
    return {
        type: types.RECEIVE_CHANGE_DIM_DATA,
        params
    }
}

export function fetchLinkage( params ) {
    return (dispatch, getState) => {

        const url = `${STATIC_API}/linkage/cachedChildren`;

        let data = {
            parentId: params.parentId,
            letter: params.letter
        };

        // 如果params中含有init属性,则代表是初始联动菜单赋值
        if (params.hasOwnProperty('init') && parseInt(params.linkageLevel) > 1) {
            let curId = `${params.linkageId};${parseInt(params.linkageLevel) - 1}`
            let curLinkageOptionObj = linkageOptionObj[curId];
            curLinkageOptionObj.map((item) => {
                if (item.letter === params.letter) {
                    Object.assign(data, {
                        parentId: item.parentId
                    });
                    params.linkageOptionValue = {
                        [params.linkage]: {
                            linkageLetter: params.linkageLetter,
                            value: `${params.current};${item.parentId}`
                        }
                    };
                }
            })
        }

        return request.GET(url,data)
            .then(resp => {
                let obj = {
                    linkageOptionObj: {[params.linkage]: resp},
                    linkageOptionValue: params.linkageOptionValue,
                };
                let findStatus = false;
                resp.map((item) => {
                    if (item.letter === params.current) {
                        params.linkageOptionValue = {
                            [params.linkage]: {
                                linkageLetter: params.linkageLetter,
                                value: `${item.letter};${item.parentId}`
                            }
                        };
                        findStatus = true;
                    }
                });

                if(!params.current) { // 如果current为空,则代表为初始化回显时发送的请求
                    findStatus = true;
                }

                let finalArr = [],
                    linkage = params.linkage,
                    parentId = '';
                if (resp && resp.length > 0) {
                    parentId = resp[0].parentId;
                }
                if (!findStatus) { // 如果此条件成立,证明没有找到对应的
                    new Promise((resolve, reject)  =>{
                        const url = `${STATIC_API}/linkage/findLinkageValue`;
                        let po = {
                            parentId: parentId,
                            currentParentId: params.linkageId,
                            letter: params.current,
                            name: '菜单'
                        };
                        let data = {
                            q: JSON.stringify(po)
                        };
                        resolve(request.GET(url,data))
                    }).then(data => {
                        let tempData = [];
                        data.map((item) => {
                            if (item.id > -1) {
                                tempData.push(Object.assign(item, {
                                    parentId
                                }))
                            }
                        });

                        finalArr = [].concat(resp, tempData);
                        Object.assign(linkageOptionObj, {[linkage]: finalArr});
                        let value = `${params.current};${parentId}`;
                        Object.assign(params.linkageOptionValue, {
                            [linkage]: Object.assign(params.linkageOptionValue[linkage],{
                                value
                            })
                        });
                        Object.assign(linkageOptionValue, params.linkageOptionValue);
                        dispatch(receiveLinkage( Object.assign({}, params, obj)));
                    })
                } else {
                    Object.assign(linkageOptionObj, {[linkage]: resp});
                    Object.assign(linkageOptionValue, params.linkageOptionValue);
                    dispatch(receiveLinkage( Object.assign({}, params, obj)));
                }

                return resp
            })
    }
}

function receiveLinkage( linkage ) {
    return {
        type: types.RECEIVE_ADD_LINKAGE,
        linkage,
    }
}

export function fetchNewAddproduct( params ){
    return {
        type: types.RECEIVE_NEWADD_PRODUCT,
        params,
    }
}

export function fetchLinkageSearch( params ) {
    return (dispatch, getState) => {
        const url = `${STATIC_API}/linkage/findLinkageValue`;

        let data = {
            q: JSON.stringify(params)
        };
        let currentParentId = params.currentParentId,
            level= params.level;
        return request.GET(url,data)
            .then(resp => {
                let optionArr = [];
                if (Object.prototype.toString.call(resp) === '[object Array]') {
                    resp.map((item) => {
                        if (item.hasOwnProperty('id') && item.id > -1) {
                            Object.assign(item, {
                                parentId: params.parentId
                            });
                            optionArr.push(item);
                        }
                    })
                }
                dispatch(receiveLinkageSearch({
                    [`${currentParentId};${level}`]: optionArr,
                    key: `${currentParentId};${level}`,
                    value: optionArr
                }));
                return resp
            })
    }
}

function receiveLinkageSearch( params ) {
    return {
        type: types.RECEIVE_ADD_LINKAGE_SEARCH,
        params
    }
}

export function fetchAddproductResult( productParams ){
    return {
        type: types.RECEIVE_PRODUCT_RESULT,
        productParams,
    }
}

// 组织销售属性数据
export function organizeSaleData( saleParams ) {
    return {
        type: types.RECEIVE_ORGANIZE_SALE_DATA,
        saleParams,
    }
}

// 获取商品属性数据
export function fetchCommodityData( commodityParams ) {
    return {
        type: types.RECEIVE_FETCH_COMMODITY_DATA,
        commodityParams
    }
}

// 获取商品数据
export function fetchWareData(operateType, callback) {
    return (dispatch, getState) => {
        return new Promise((resolve, reject) => {
            resolve({operateType, callback})
        }).then((params) => {
            dispatch({
                type: types.RECEIVE_FETCH_WARE_DATA,
                operateType: params.operateType
            });
            return params.callback
        }).then((callback) => {
            callback()
        })
    }
}

// 获取已添商品的数据
export function fetchModifyProduct( modelId, venderId, jWareId, categoryId ) {
    return (dispatch, getState) => {
        const url = `${STATIC_API}/jmiWare/getTemplateInfo/${modelId}`;

        return request.GET(url)
            .then(resp => {
                dispatch(receiveAddproduct( resp ));
                return resp
            }).then(resp => {
                dispatch(fetchModifyData( jWareId, venderId ))
            })
    }
}

function fetchModifyData( jWareId, venderId ) {
    return (dispatch, getState) => {
        const url = `${STATIC_API}/jmiWare/getWareById/${venderId}/${jWareId}`;

        return request.GET(url)
            .then(resp => {
                let po = {
                    cataId: resp.data.catId,
                    letter: 'note'
                };
                dispatch(queryRichText(po));
                let poMobile = {   // 移动端富文本
                    cataId: resp.data.catId,
                    letter: 'appNote'
                };
                dispatch(queryRichText(poMobile));
                dispatch(receiveModifyProduct( resp ));
                return resp
            })
    }
}

// 接收已添商品数据信息
function receiveModifyProduct( addproduct ) {
    return {
        type: types.RECEIVE_MODIFY_PRODUCT,
        addproduct
    }
}

// 应用扩展商品属性数据功能
export function salePropertyExtend(params) {
    return {
        type: types.RECEIVE_SALEPROPERTY_EXTEND,
        params
    }
}

// 修改错误提示信息
export function changeErrorMsg(params) {
    return {
        type: types.RECEIVE_CHANGE_ERROR_MSG,
        params
    }
}

// 上传图片
// export function uploadImage(params) {
//     return {
//         type: types.RECEIVE_UPLOAD_IMAGE,
//         params
//     }
// }

// 删除图片
export function removeImage(params) {
    return {
        type: types.RECEIVE_REMOVE_IMAGE,
        params
    }
}

// 提交商品数据
export function commitWareData(data, callback) {
    return (dispatch, getState) => {
        const url = `${STATIC_API}/jmiWare/addWare`;
        return request.POST(url,data, {
            type: 'json'
        })
            .then(resp => {
                callback(resp)
            })
            .fail(error => {
                callback(error)
            })
    }

}

// 修改商品
export function modifyWareData(data, type, callback) {
    return (dispatch, getState) => {
        let apiName = 'updateWare';
        if (type === MODULE_BATCH_SAVE.SALE) {
            apiName = 'updateSkus';
        }
        const url = `${STATIC_API}/jmiWare/${apiName}`;
        return request.POST(url, data, {
            type: 'json',
            contentType: 'application/x-www-form-urlencoded'
        })
            .then(resp => {
                callback(resp)
            })
            .fail(error => {
                callback(error)
            })
    }
}

// 获取联动菜单
export function fetchLinkageArrs(data) {
    return (dispatch, getState) => {
        let func_arr = [],
            promisify = function(func) {
                return function () {
                    return new Promise((resolve) => {
                        return func(resolve)
                    })
                }
            };

        for (let i = 0; i < data.length; i++) {
            let tempData = data[i];
            if (tempData && tempData.current) {
                let func = fetchLinkage(data[i]);
                func_arr.push(promisify(func));
            }
        }

        func_arr.reduce((cur, next) => (cur.then(next)), Promise.resolve()).then(function() {
            dispatch(fetchLinkageFinish())
        })
    }
}

function fetchLinkageFinish() {
    return {
        type: types.RECEIVE_LINKAGE_INIT,
        linkageOptionObj,
        linkageOptionValue
    }
}

// 保存富文本内容
export function saveRichText(params, callback) {
    return (dispatch, getState) => {

        const url = `${STATIC_API}/jmiWare/notes/add?cataId=${params.cataId}&letter=${params.letter}&saveType=${params.saveType}`

        return request.POST(url, {
            content: params.content
        })
        .then(resp => {
            let po = {
                cataId: params.cataId,
                letter: params.letter
            };
            // 查询需设置1秒钟延迟
            window.setTimeout(() => {dispatch(queryRichText(po, callback))}, 1200);
            return resp
        })
    }
}

// 查询富文本列表
function queryRichText(params, callback) {
    return (dispatch, getState) => {

        const url = `${STATIC_API}/jmiWare/notes/query`;

        return request.GET(url, params)
            .then(resp => {
                dispatch(queryNotes(resp, params));
                return resp
            })
            .then(resp => {
                if (typeof callback === 'function') {
                    callback(resp)
                }
            })
    }
}

function queryNotes(notes, po) {
    return {
        type: types.RECEIVE_SAVE_RICHTEXT,
        params: notes.data,
        letter: po.letter
    }
}

// 选择富文本
export function selectRichText(versionId, letter) {
    return (dispatch, getState) => {

        const url = `${STATIC_API}/jmiWare/notes/get/${versionId}`;

        return request.POST(url)
            .then(resp => {
                dispatch(getRichText(resp, letter))
            })
    }
}

// 根据富文本id获取当前选中项富文本
function getRichText(resp, letter) {
    return {
        type: types.RECEIVE_SELECT_RICHTEXT,
        note: resp.data.content,
        letter: letter
    }
}

// 拼接名称
export function concatCommodityName(value) {
    return {
        type: types.RECEIVE_CONCAT_NAME,
        value
    }
}

// 改变价格日历数据
export function changeCalendarData(params) {
    return {
        type: types.RECEIVE_CHANGE_CALENDAR_DATA,
        params
    }
}

// 清空日历某天信息
export function deleteCalendarData(params) {
    return {
        type: types.RECEIVE_DELETE_CALENDAR_DATA,
        params
    }
}

// 查询海量数据
export function fetchBigData( params ) {
    return (dispatch, getState) => {
        const url = `${STATIC_API}/linkage/findLinkageValue`;

        let data = {
            q: JSON.stringify(params)
        };
        return request.GET(url,data)
            .then(resp => {
                let optionArr = [];
                if (Object.prototype.toString.call(resp) === '[object Array]') {
                    resp.map((item) => {
                        if (item.hasOwnProperty('id') && item.id > -1) {
                            Object.assign(item, {
                                parentId: params.parentId
                            });
                            optionArr.push(item);
                        }
                    })
                }
                dispatch(receiveBigData(optionArr, params));
                return resp
            })
    }
}

function receiveBigData(data, params) {
    let tempData = [],
        letter = params.linkageLetter;
    data.map((item) => {
        tempData.push(item);
    });
    return {
        type: types.RECEIVE_BIG_DATA,
        data: tempData,
        letter
    }
}

// 获取海量数据组件初始值
export function fetchInitBigData(data, params) {
    return (dispatch, getState) => {
        let func_arr = [],
            promisify = function(func) {
                return function () {
                    return new Promise((resolve) => {
                        return func(resolve)
                    })
                }
            };

        for (let i = 0; i < data.length; i++) {
            let func = fetchLinkage(data[i]);
            func_arr.push(promisify(func))
        }

        func_arr.reduce((cur, next) => (cur.then(next)), Promise.resolve()).then(function() {
            dispatch(fetchLinkageFinish())
        })
    }
}

// 获取销售属性文案
export function fetchSaleTitle(categoryId, callBack) {
    return (dispatch, getState) => {
        const url = `${STATIC_API}/config/getSaleTips/${categoryId}`;
        return request.GET(url)
            .then(resp => {
                callBack(resp);
            })
    }
}

export function saleValidateMsg(po) {
    return {
        type: types.RECEIVE_SALE_VALIDATE_MSG,
        data: po
    }
}

// 获取初始海量数据
export function getInitBigData(params) {
    return (dispatch, getState) => {

        const url = `${STATIC_API}/linkage/cachedChildren`;

        return request.GET(url, params)
            .then(resp => {
                dispatch(getInitSelectBigData(resp, params.comLetter))
            })
    }
}

function getInitSelectBigData(data, letter) {
    return {
        type: types.RECEIVE_SELECT_BIG_DATA,
        data,
        letter
    }
}

// 初始海量数据回显
export function cachedBigData(initData, params, callback) {
    return () => {
        let letter = params.linkageLetter;
        let promises = initData.map((item) => {
            return cachedLink(item, letter, params);
        });
        Promise.all(promises).then(() => {
            callback(bigDataList)
        })
    };
}

export function cachedLink(item, letter, params) {
    const url = `${STATIC_API}/linkage/findLinkageValue`;

    let data = {
        q: JSON.stringify(Object.assign({}, params, {
            letter: item
        }))
    };

    return request.GET(url,data)
        .then(resp => {
            if (Object.prototype.toString.call(resp) === '[object Array]') {
                resp.map((dataItem) => {
                    if (dataItem.hasOwnProperty('id') && dataItem.id > -1 && dataItem.letter === item) {
                        let label = dataItem.name,
                            po = {
                                key: dataItem.letter,
                                label
                            };
                        if (bigDataList.hasOwnProperty(letter)) {
                            Object.assign(bigDataList, {
                                [letter]: [].concat(bigDataList[letter], po)
                            })
                        } else {
                            Object.assign(bigDataList, {
                                [letter]: [po]
                            })
                        }
                    }
                })
            }

            return resp
        })
}

export function changeCalendarBaseData(params) {
    return {
        type: types.RECEIVE_CHANGE_CALENDAR_BASE_DATA,
        params
    }
}

// 组织销售属性数据
export function organizeSaleRecordsData( saleParams ) {
    return {
        type: types.ORGANIZE_SALE_RECORDS_DATA,
        saleParams,
    }
}

// 获取店内分类
export function fetchStoreSort() {
    return (dispatch, getState) => {
        const url = `${STATIC_API}/shopCategory/getShopCategory`;
        return request.GET(url)
            .then(resp => {
                dispatch(((data) => {
                   return{
                       type: types.RECEIVE_SHOP_CATEGORY,
                       data
                   }
                })(resp))
            })
    }
}

export function selectStoreSort(data) {
    return {
        type: types.ORGANIZE_SHOP_CATEGORY,
        data
    }
}

export function uploadImg(data) {
    return (dispatch, getState) => {
        const url = `${STATIC_API}/ueditor/index?action=upload/img`;
        let formData = new FormData();
        formData.append('upfile', data);
        return window.fetch(url, {
            body: formData,
            method: 'POST',
            'credentials': 'include',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(resp => (resp.json()))
    }
}

export function fetchCate(callback) {
    return (dispatch, getState) => {
        const url = `${STATIC_API}/imgZone/fetchCates`;
        return request.GET(url)
            .then(resp => {
                resp = resp || {};
                resp = JSON.parse(resp);
                callback(resp.detail)
            })
    }
}

export function fetchSpaceImg(catId, pageNo, callback) {
    return (dispatch, getState) => {
        const url = `${STATIC_API}/imgZone/query?catId=${catId}&pageNo=${pageNo}`;
        return request.GET(url)
            .then(resp => {
                resp = resp || {};
                resp = JSON.parse(resp);
                callback(resp.pageInfo)
            })
    }
}

export function chooseImages(data) {
    data = [].concat(data);
    return {
        type: types.RECEIVE_CHOOSE_IMAGES,
        data
    }
}
