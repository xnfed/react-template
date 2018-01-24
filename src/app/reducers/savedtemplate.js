import * as types from '../constants/ActionTypes'
import _isEmpty from 'lodash/isEmpty'
import { EXTEND_TYPE, PROPERTY_NAME, SALE_MODE_TYPE} from '../../utils/constants'
import createReducer from './createReducer';

const initialState = {
    savedtemplate: '',
};
export default createReducer(initialState, {
    [types.RECEIVE_ADD_COMPONENT](state, action) {
        let params = action.params,
            {data} = params;
        return Object.assign({}, state, {
            comCollection: data.data
        })
    },
    [types.RECEIVE_SAVED_TEMPLATE](state, action) {
        // man端初始化时获取的数据
        // 摈弃先前的做法,在初始化的时候就将初始模板组件数据赋值给curArr
        // 这样就不需要每次渲染组件的时候必须先对初始数据进行遍历了
        let savedtemplate = action.savedtemplate,
            componentObj = action.componentObj,
            data = savedtemplate.data || {},
            tempData = Object.assign({}, data),
            sort = 0,
            tempTabs = [],
            initCom = []; // 初始化组件集合
        if (data) {
            for (let [key, value] of Object.entries(data)) {
                let tempArr = [];
                if (Object.prototype.toString.call(value) === '[object Array]') {
                    if (key !== PROPERTY_NAME.SALE_TABS) {
                        value.map((item) => {
                            if (componentObj.hasOwnProperty(key) && componentObj[key].indexOf(item.letter) > -1) {
                                initCom.push(item);
                                tempArr.push(item);
                            }
                        });
                    }
                    Object.assign(tempData, {
                        [key]: tempArr
                    });
                }

                if (key === PROPERTY_NAME.TABS) { // 商品属性多页签
                    let tempObj = {};
                    for (let [tabKey, tabValue] of Object.entries(value)) {
                        let tabTempArr = [];
                        tabValue.map((comItem) => {
                            let spuAttr = PROPERTY_NAME.SPU_ATTR;
                            if (componentObj.hasOwnProperty(spuAttr) && componentObj[spuAttr].indexOf(comItem.letter) > -1) {
                                tabTempArr.push(comItem);
                            }
                        });
                        Object.assign(tempObj, {
                            [tabKey]: tabTempArr
                        })
                    }
                    Object.assign(tempData, {
                        tabs: tempObj
                    });
                }

                if (key === PROPERTY_NAME.SALE_TABS) { // 销售属性多模式
                    let tempValue = value.map((item) => {
                        let valuesList = item.values;
                        return Object.assign(item, {
                            values: valuesList.map((valueItem) => (valueItem.fieldId))
                        })
                    });
                    Object.assign(tempData, {
                        saleTabs: tempValue
                    });
                }

                if (key === PROPERTY_NAME.SKU_EXTEND_TABS) { // sku扩展属性存放位置
                    value = value ? JSON.parse(value) : {};
                    Object.assign(tempData, {
                        [PROPERTY_NAME.SKU_EXTEND_TABS]: value
                    });
                }
            }
        }
        // 组织tabs的数据格式
        if (tempData && tempData.tabs) {
            for (let [key, value] of Object.entries(tempData.tabs)) {
                sort += 1;
                tempTabs.push({
                    name: key,
                    values: value.map((item) => (item.fieldId)),
                    sort: sort
                })
            }
            Object.assign(tempData, {
                tabs: tempTabs
            })
        } else {
            Object.assign(tempData, {
                tabs: []
            })
        }

        return Object.assign({}, state, {
            comCollection: initCom,
            initComList: initCom, // 为了修改选择销售版式会将comCollection覆盖的问题, 需要加此参数作为备份
            savedtemplate: Object.assign({}, savedtemplate, {
                data: tempData
            }),
            curArr: tempData
        })
    },
    // 添加组件
    [types.RECEIVE_PUSH_COMPONENT](state, action) {
        let params = action.params,
            tab = params.tab,
            saleTabIndex = params.saleTabIndex,
            data = params.data || [],
            position = params.position, // sku扩展属性摆放位置
            newTabs = state.curArr.tabs || [],  // 商品属性多页签
            newSaleTabs = state.curArr.saleTabs || [],// 销售属性多模式
            newSkuExtendTabs = state.curArr.skuExtendTabs || {}, // sku扩展属性位置摆放
            newData = [];
        if (tab || saleTabIndex || position) {
            if (tab) { // 如果要是有tabs,则代表是有页签
                newTabs = getTabs(newTabs, data, tab.sort);
            }
            if (saleTabIndex) { // 如果saleTabIndex不为空,则代表销售属性为多模式
                newSaleTabs = getTabs(newSaleTabs, data, saleTabIndex, 'type');
            }
            let fieldIdList = [];
            [].concat(state.curArr[params.type] || [], data).forEach((item) => { // tabs属性不能和spuAttrs属性同时有数据
                if (fieldIdList.indexOf(item.fieldId) === -1) {
                    fieldIdList.push(item.fieldId);
                    newData.push(item);
                }
            })
        } else {
            newData = data;
        }

        if (position) { // 放置在横向位置
            Object.assign(newSkuExtendTabs, {
                [params.position]: data.map((item) => {
                    return item.fieldId
                })
            })
        }

        return Object.assign({}, state, {
            curArr: Object.assign({}, state.curArr, {
                // 面板中选中的组件
                [params.type]: newData,
                tabs: newTabs,
                saleTabs: newSaleTabs,
                skuExtendTabs: newSkuExtendTabs
            })
        })
    },
    // 添加页签
    [types.RECEIVE_ADD_TAB](state, action) {
        let tabs = state.curArr.tabs,
            tempTabs = [];
        if (!_isEmpty(tabs)) {
            tempTabs = tabs;
        }
        tempTabs.push(action.params);
        let tempObj = Object.assign({}, state.curArr, {
            tabs: tempTabs
        });

        return Object.assign({}, state, {
            curArr: tempObj
        });
    },
    // 修改标签信息
    [types.RECEIVE_CHANGE_TAB](state, action) {
        let params = action.params,
            tabs = state.curArr.tabs;
        tabs.map((item) => {
            if (item.sort === params.sort) {
                return Object.assign(item, params)
            }
            return item
        });
        let tempObj = Object.assign({}, state.curArr, {
            tabs: tabs
        });
        return Object.assign({}, state, {
            curArr: tempObj
        })
    },
    // 删除组件
    [types.RECEIVE_DELETE_COMPONENT](state, action) {
        let params = action.params,
            target = params.target,
            type = params.type;
        let deleteSpuAttr = state.curArr[type].filter(item => item.fieldId !== target);
        let deleteTabs = state.curArr.tabs.map((item) => {
            let fieldIdArr = [];
            item.values.map((fieldId) => {
                if (fieldId !== target) {
                    fieldIdArr.push(fieldId)
                }
            });
            return Object.assign(item, {
                values: fieldIdArr
            })
        });
        let deleteSaleTabs = state.curArr.saleTabs.map((item) => {
            return Object.assign(item, {
                values: item.values.filter((fieldId) =>{
                    return fieldId !== target;
                })
            })
        });
        for (let [key, value] of Object.entries(state.curArr.skuExtendTabs)) {
            state.curArr.skuExtendTabs[key] = value.filter((item) => {
                return item !== target
            })
        }

        return Object.assign({}, state, {
            curArr: Object.assign({}, state.curArr, {
                [type]: deleteSpuAttr,
                tabs: deleteTabs,
                saleTabs: deleteSaleTabs
            })
        })
    },
    // 删除标签信息
    [types.RECEIVE_DELETE_TAB](state, action) {
        let sort = action.params.sort,
            curTabs = [];
        state.curArr.tabs.map((item) => {
            if (`${item.sort}` !== sort) {
                curTabs.push(item)
            }
        });

        return Object.assign({}, state, {
            curArr: Object.assign({}, state.curArr, {
                tabs: curTabs
            })
        })
    },
    // 修改页签状态
    [types.RECEIVE_CHANGE_TABSTATUS](state, action) {
        let params = action.params;
        if (params.productAttrAdd === 1) { // 如果要是为1的话,则代表为单页签,需清空tabs
            Object.assign(state.curArr, {
                tabs: []
            })
        }
        return Object.assign({}, state, {
            tabStatus: params.productAttrAdd
        })
    },
    // 重置样式以及数据
    [types.RECEIVE_RESET_DATA](state, action) {
        let params = action.params,
            type = params.type,
            tempPo = {
                [type]: []
            };
        if (params.hasOwnProperty('tabs') && params.tabs) { // 如果要有tabs属性且为true,则证明是多页签
            Object.assign(tempPo, {
                tabs: []
            })
        }
        if (params.saleTabs) { // 如果saleTabs为true,则需要清空销售属性多模式
            Object.assign(tempPo, {
                saleTabs: []
            })
        }
        if (params.skuExtendTabs) { // 如果skuExtendTabs为true,则需要清空销售属性多模式sku扩展属性
            Object.assign(tempPo, {
                skuExtendTabs: {}
            })
        }
        return Object.assign({}, state, {
            curArr: Object.assign({}, state.curArr, tempPo)
        })
    },
    // 删除销售属性多模式页签
    [types.DELETE_SALE_TABS](state, action) {
        let saleTabs = state.curArr.saleTabs, //  销售属性多模式
            curArr = state.curArr,
            params = action.params,
            {
                targetKey,
                saleProperty
            } = params;
        curArr[saleProperty] = [];
        curArr['saleTabs'] = saleTabs.filter((item) => {
            return item.type !== targetKey;
        });
        if (targetKey === SALE_MODE_TYPE.noCalendar) {
            curArr['skuExtendTabs'] = {};
        }
        return Object.assign({}, state, {
            curArr: curArr
        })
    },
    [types.SET_SALE_TABS](state, action) { // 设置销售属性多模式
        let saleTabs = state.curArr.saleTabs,
            params = action.params;
        return Object.assign({}, state, {
            curArr: Object.assign({}, state.curArr, {
                saleTabs: params
            })
        })
    }
})

// 获取tab页签数据
function getTabs(target, dataSource, index, property = 'sort') {
    let tabs = target || [];
    let fieldIdArr = dataSource.map((item) => {
        return item.fieldId;
    });
    return tabs.map((item) => {
        if (item[property] === index) {
            item.values = fieldIdArr;
        }
        return item;
    });
}
