import * as types from '../constants/ActionTypes'
import _isEmpty from 'lodash/isEmpty'
import _cloneDeep from 'lodash/cloneDeep';
import dateFormatUtil  from '../../utils/dateFormat';
import {multiply, divide} from '../../utils/adapterMath';
import {notification} from 'antd';
import {CONCAT_FLAG, SALE_MODE_TYPE, PROPERTY_NAME, EXCEPTION_MODULE_NAME, IMAGE_URL, IMAGE_NUM, MAIN_IMAGE_FLAG} from '../../utils/constants';
import filter from '../../utils/filter';
import createReducer from './createReducer';

const initialState = {
    addproduct: '',
    tabs: {},
    comCollection: [],
    productParams: {
        catId: '',
        categorySettingList: [],
        isNoShow: 0,
        jWareId: '',
        jmiImageSetting: '',
        jmiWareSkuSetting: '',
        logo: '',
        note: '',
        appNote: '',
        operateType: '',
        outerId: '',
        subTitle: '',
        title: '',
        url: '',
        urlWord: '',
        wareSetting: ''
    },
    errorMsg: {}, // 错误提示信息
    mainImg: [], // 主图存储容器
    detailImg: [], // 细节图存储容器
    initLinkagePost: {}, // 初始化联动菜单时是否需要发送获取信息的请求 （length === 0 否   length > 0是）
    linkageOptionObj: {},
    bigDataObj: {}, // 大数据量数据组织
    bigDataList: {},
    validatorStatus: false // 校验状态
};

const moreSearchTip = {
    letter: 'moreSearchInfo',
    name: '若需要缩小范围,请输入更多条件'
};

// 将更新state抽取成共工方法
function updateState(oldObject, ...newValues) {
    return Object.assign({}, oldObject, ...newValues);
}

export default createReducer(initialState, {
    [types.RECEIVE_ADD_PRODUCT](state, action) {
        let data = action.addproduct.data;
        // 商品属性数据集合
        let commodityAttrs = data.spuAttrs || [],
            skuSaleAttrs = data.skuSaleAttrs || [],
            saleTabs = data.saleTabs || [],
            skuExtendTabs = data.skuExtendTabs ? JSON.parse(data.skuExtendTabs) : {},
            // 初始化商品数据集合(为了在点击提交的时候便于进行规则校验)
            // 先前思路: 操作商品属性组件的时候在向commodityData中添加数据,不利于对未进行操作的商品组件跟踪校验
            commodityData = {};
        commodityAttrs.map((item, index) => {
            Object.assign(commodityData, {
                [item.letter]: {  // 商品数据参数模板
                    attrValue: {
                        valueObj: ''
                    },
                    letter: item.letter
                }
            })
        });

        // 维度属性数据
        let dimObj = {}, // 用来设置每个维度的数据容器集合
            dimLetterList = [];
        skuSaleAttrs.map((item) => {
            Object.assign(dimObj, {
                [item.letter]: []
            });
            dimLetterList.push(item.letter);
        });

        // 销售属性扩展属性
        let saleRecordTemplate = {
            skuPrice: '',
            quantity: '',
            jSkuId: '',
            outerId: ''
        };
        // 组件集合
        let initCom = []; // 初始化组件集合
        // 获取组件集合
        for (let [key, value] of Object.entries(data)) {
            if (Object.prototype.toString.call(value) === '[object Array]') {
                if (key !== PROPERTY_NAME.TABS && key !== PROPERTY_NAME.SALE_TABS) {
                    value.map((item) => {
                        initCom.push(item);
                    })
                }
            }
            if (key === PROPERTY_NAME.TABS) {
                Object.values(value).map((item) => {
                    item.map((comItem) => {
                        initCom.push(comItem)
                    })
                })
            }
        }

        // 多页签
        let tempTabs = getTabsData(data.tabs || {});

        let saleNeed = {};
        // 获取每个销售维度的必填信息
        skuSaleAttrs.forEach((item) => {
            saleNeed[item.letter] = item.isNeed || item.isPageNeed;
        });

        let saleModeTypePo = {};
        saleTabs.forEach((item) => {
            let values = item.values || [];
            saleModeTypePo[item.type] = values.map((item) => item.letter)
        });

        return updateState(state, {
            addproduct: action.addproduct,
            commodityData: commodityData, // 初始化商品属性数据
            saleRecordTemplate: saleRecordTemplate, // 销售属性记录模板
            saleRecordsAttrs: [], // 销售属性记录集合
            skuExtendTabs, // sku扩展属性位置存放信息
            tabs: tempTabs, // 商品属性多页签
            saleTabs, // 销售属性多模式
            saleModeTypePo, // 销售属性多模式对象
            comCollection: initCom,
            productParams: Object.assign({}, state.productParams, action.addproduct.data)
        }, {
            dimCollection: dimObj,
            dimLetterList,
            saleNeed
        });
    },
    // 删除某个销售维度项
    [types.RECEIVE_DELETE_SALESATTRS](state, action) {
        let params = action.params,
            referenceSaleLetter = params.saleLetter,
            referenceKey = params.index,
            referenceDim = params.dim,
            saleModeType = params.saleModeType,
            newDimCollection = [],
            saleNeed = state.saleNeed,
            newSaleRecordsAttr = [],
            newSaleRecordsKeyList = [];
        // 从dimCollection中剔除冗余数据
        Object.values(state.dimCollection[referenceSaleLetter]).map((item) => {
            if (item.index !== referenceKey) {
                newDimCollection.push(item)
            }
        });
        let newDimObject = Object.assign({}, state.dimCollection, {
            [referenceSaleLetter]: newDimCollection
        });

        // 从销售记录集合中剔除冗余数据
        state.saleRecordsAttrs.map((item) => {
            let saleRecordKeyList = item.saleRecordKey.split(';'),
                type = filter.concatSaleRecordKey(saleModeType);
            if (saleRecordKeyList[0] !== type) { // 不等代表为其他销售模式的数据
                newSaleRecordsAttr.push(item);
            }
            if (saleRecordKeyList[referenceDim + 1] !== referenceKey && saleRecordKeyList[0] === type) {
                newSaleRecordsAttr.push(item);
                newSaleRecordsKeyList.push(item.saleRecordKey);
            }
        });
        // 剔除提示消息中的销售属性记录数据
        const module = EXCEPTION_MODULE_NAME.SALE_NO_CALENDAR;
        if (state.errorMsg.hasOwnProperty(module)) {
            Object.keys(state.errorMsg[module]).map((item) => {
                if (item.split(';')[referenceDim + 1] === referenceKey) {
                    delete state.errorMsg[module][item]
                }
            })
        }
        let po = {
            data: newDimObject,
            params,
            saleNeed,
            dimLetterList: state.dimLetterList,
            saleModeTypePo: state.saleModeTypePo,
            saleModeType,
            type: 'delete'
        };
        let dimArr = multiCartesian(po);
        let saleRecordsAttr = organizeExtSetting(dimArr, state.addproduct.data.skuExtendAttrs, state.saleRecordTemplate, po, state.productParams, newSaleRecordsKeyList);
        return updateState(state, {
            dimCollection: newDimObject,
            saleRecordsAttrs: [].concat(newSaleRecordsAttr, saleRecordsAttr)
        });
    },
    // 选中某个维度的维度项
    [types.RECEIVE_CHANGE_DIM_DATA](state, action) {
        let dimParams = action.params,
            value = dimParams.value,
            saleNeed = state.saleNeed,
            saleModeType = dimParams.saleModeType, //  销售属性模式类型
            skuExtendAttr = state.addproduct.data.skuExtendAttrs,
            saleModeTypePo = state.saleModeTypePo,
            saleLetter = dimParams.saleLetter; // 当前维度
        state.dimCollection[saleLetter].push(dimParams);
        let dimChangeCollection = Object.assign({}, state.dimCollection, {
            [saleLetter]: state.dimCollection[saleLetter]
        });
        let po = {
            data: dimChangeCollection,
            params: dimParams,
            saleNeed,
            dimLetterList: state.dimLetterList,
            saleModeTypePo,
            saleModeType
        };
        let dimArr = multiCartesian(po);
        let saleRecordsAttr = organizeExtSetting(dimArr, skuExtendAttr, state.saleRecordTemplate, po, state.productParams);
        let salePo = {
            dimCollection: dimChangeCollection,
            data: [].concat(state.saleRecordsAttrs, saleRecordsAttr),
            saleModeTypePo,
            saleModeType
        };
        let saleRecordsList = getSaleRecordsList(salePo);
        let saleKeyList = [];
        saleRecordsList.map((item) => {
            saleKeyList.push(item.saleRecordKey);
        });
        return updateState(state, {
            dimCollection: dimChangeCollection,
            saleRecordsAttrs: saleRecordsList
        });
    },
    [types.RECEIVE_ADD_LINKAGE](state, action) {
        // 需要清空数据的的级联菜单项
        let tempObj = {},
            tempLinkageOptionObj = {},
            // 联动菜单的letter,用来和commodityData进行绑定
            linkageLetter = action.linkage.linkageLetter;
        // 有hasChanged属性则代表是在修改linkageOptionValue,此时需要清空当前级后的选中值
        if (action.linkage.hasOwnProperty('hasChanged')) {
            // 从state.linkageOptionValue中此key之后的所有value都需要清空
            let curKey = Object.keys(action.linkage.linkageOptionValue)[0],
                curLinkageId = curKey.split(';')[0],
                curIndex = Object.keys(state.linkageOptionValue).indexOf(curKey);
            if (curIndex > -1) {
                // 清空选中项
                let linkageOptionArr = Object.entries(state.linkageOptionValue);
                for (let [key, obj] of linkageOptionArr.slice(curIndex + 1, linkageOptionArr.length)) {
                    if (key.indexOf(curLinkageId) > -1) {
                        Object.assign(tempObj, {
                            [key]: {
                                linkageLetter: obj['linkageLetter'],
                                value: ''
                            }
                        })
                    }
                }
            }

            // 清空选项
            let params = action.linkage,
                linkage = params.linkage,
                linkageOptionObj = state.linkageOptionObj,
                parentId = '',
                level = '';
            if (linkage) {
                level = linkage.split(';')[1];
                parentId = linkage.split(';')[0];
            }
            for (let i = 1; i < parseInt(level); i++) {
                let key = `${parentId};${i}`;
                if (linkageOptionObj[key]) {
                    Object.assign(tempLinkageOptionObj, {
                        [key]: linkageOptionObj[key]
                    })
                }
            }
        }
        return updateState(state, {
            linkageOptionObj: Object.assign({}, tempLinkageOptionObj, action.linkage.linkageOptionObj || {}),
            linkageOptionValue: Object.assign({}, state.linkageOptionValue, action.linkage.linkageOptionValue, tempObj)
        })
    },
    // 联动菜单搜索
    [types.RECEIVE_ADD_LINKAGE_SEARCH](state, action) {
        // 如果搜索出的结果长度是0,则给用户提示未搜索到结果,保留原来的结果
        if (Object.values(action.params)[0].length === 0) {
            return state
        } else {
            let params = action.params,
                optionArray = [];
            params.value.map((item) => {
                optionArray.push({
                    linkageLetter: '',
                    value: `${item.letter};${item.parentId}`
                })
            });
            return updateState(state, {
                linkageOptionObj: Object.assign({}, state.linkageOptionObj, params),
                linkageOptionValue: Object.assign({}, state.linkageOptionValue, {
                    [params.key]: optionArray
                })
            })
        }
    },
    // 修改销售维度名称
    [types.RECEIVE_NEWADD_PRODUCT](state, action) {
        let params = action.params,
            index = params.index,
            dim = params.dim,
            letter = params.letter,
            value = params.value,
            options = getDimOptions(state.addproduct.data.skuSaleAttrs, letter);
        if (action.params.batch) {
            let replaceNameArr = [];
            // 中文逗号
            value ? replaceNameArr = value.split('，') : '';
            for (let i = 0; i < replaceNameArr.length; i++) {
                // 超过15个字符只截取前15个字符
                let replaceNameValue = replaceNameArr[i].substring(0, 15),
                    optionsData = options[i];
                // 如果批量改名长度大于skuSaleAttrs长度,那么需要判断config中是否包含options[i]
                if (optionsData) {
                    optionsData.label = replaceNameValue;
                }
                // 修改state中的dimCollection
                state.dimCollection[letter].map((item) => {
                    if (parseInt(item.indexKey) === i) {
                        Object.assign(item, {
                            value: replaceNameValue
                        })
                    }
                });
                // 修改state中的saleRecordsAttrs
                state.saleRecordsAttrs.map((item) => {
                    if (item.saleIndexKey.split(';')[dim + 1] === `${i}`) {
                        item.dimNameObj[letter] = replaceNameValue;
                        let saleList = item.saleList || [];
                        saleList.map((saleItem) => {
                            if (saleItem.letter === letter) {
                                Object.assign(saleItem['attrValue'], {
                                    aliasName: replaceNameValue
                                })
                            }
                        })
                    }
                })
            }
        } else {
            options.map((item) => {
                if (item.value === index) {
                    Object.assign(item, {
                        label: value
                    })
                }
            });
            // 修改state中的dimCollection(销售维度信息集合)数据
            state.dimCollection[letter].map((item) => {
                if (item.index === index) {
                    Object.assign(item, {
                        value: value
                    })
                }
            });

            // 修改state中的saleRecordsAttrs(销售记录集合)数据
            state.saleRecordsAttrs.map((item) => {
                // 此处不要使用恒等  因为只需要左侧值与右侧值相等就可以(类型可以不同)
                if (item.saleRecordKey.split(';')[dim + 1] == index) {
                    item.dimNameObj[letter] = value;
                    item.saleList.map((po) => {
                        if (po.letter === letter) {
                            po.attrValue.aliasName = value
                        }
                    })
                }
            })
        }

        return Object.assign({}, state)
    },
    [types.RECEIVE_PRODUCT_RESULT](state, action) {
        let obj = Object.assign({}, state.productParams, action.productParams);
        return updateState(state, {
            productParams: obj
        });
    },
    // 组织销售属性数据
    [types.RECEIVE_ORGANIZE_SALE_DATA](state, action) {
        let saleParams = action.saleParams,
            newSaleRecordsAttrs = [];
        state.saleRecordsAttrs.map((item) => {
            if (item.saleRecordKey === saleParams.saleRecordKey) {
                newSaleRecordsAttrs.push(saleParams)
            } else {
                newSaleRecordsAttrs.push(item)
            }
        });

        return updateState(state, {
            saleRecordsAttrs: newSaleRecordsAttrs,
            validatorStatus: true
        });
    },
    //获取商品属性数据
    [types.RECEIVE_FETCH_COMMODITY_DATA](state, action) {
        let commodityParams = action.commodityParams,
            valueObj = '',
            commodityId = Object.keys(commodityParams)[0], // 当前商品数据记录信息的id
            commodityObj = Object.values(commodityParams)[0]; // 当前商品数据input的值
        // 如果commodityObj[valueObj]为数组的话,则需要将数据中的数据转换成^拼接的字符串
        if (Object.prototype.toString.call(commodityObj['valueObj']) === '[object Array]') {
            commodityObj['valueObj'].map((item) => {
                valueObj += `${item}^`
            });
            valueObj = valueObj.substring(0, valueObj.length - 1);
        } else {
            valueObj = commodityObj['valueObj']
        }
        let commodityDataTemplate = {  // 商品数据参数模板
            attrValue: {
                valueObj: valueObj || ''
            },
            letter: commodityObj['letter'] || ''
        };

        return updateState(state, {
            commodityData: Object.assign({}, state.commodityData, {[commodityId]: commodityDataTemplate})
        });
    },
    // 组织最终传递的商品数据
    [types.RECEIVE_FETCH_WARE_DATA](state, action) {
        let wareData = state.productParams,
            // 商品属性数据集合
            commodity = state.commodityData,
            commodityCollection = [],
            // 销售属性数据集合
            sale = _cloneDeep(state.saleRecordsAttrs),
            linkageStateValue = state.linkageOptionValue,
            mainImg = state.mainImg,
            detailImg = state.detailImg,
            propertyAttrs = state.addproduct.data,
            linkageStateObj = {};
        // 如果商品属性不为空,则组织商品数据格式
        if (commodity) {
            let linkageFormattedData = {};
            // 组织commodityData中的联动菜单的数据
            // 如果此条件成立,则代表选中了某个级联菜单项
            if (linkageStateValue && Object.keys(linkageStateValue).length > 0) {
                Object.keys(linkageStateValue).map((item) => {
                    let linkageParentId = item.split(';')[0], // 代表是哪个联动菜单
                        linkageLevel = item.split(';')[1], // 联动菜单的级别
                        linkageItem = linkageStateValue[item], // 联动菜单中每个级别存储的数据{linkageLetter:每个联动菜单的唯一标示,value:联动菜单的值}
                        linkageObj = {
                            linkageLetter: linkageItem['linkageLetter'],
                            value: linkageItem['value'].split(';')[0]
                        };
                    if (linkageStateObj.hasOwnProperty(linkageParentId)) {
                        Object.assign(linkageStateObj, {
                            [linkageParentId]: Object.assign(linkageStateObj[linkageParentId], {
                                [linkageLevel]: linkageObj
                            })
                        })
                    } else {
                        Object.assign(linkageStateObj, {
                            [linkageParentId]: {
                                [linkageLevel]: linkageObj
                            }
                        })
                    }

                    Object.values(linkageStateObj).map((item, index) => {
                        let linkageLevelAttrs = Object.values(item);
                        for (let i = 0; i < linkageLevelAttrs.length; i++) {
                            let concatStr = '';
                            for (let j = 0; j <= i; j++) {
                                concatStr += `${item[j + 1]['value']}^`
                            }
                            let linkageLetter = linkageLevelAttrs[i]['linkageLetter'];
                            Object.assign(linkageFormattedData, {
                                [linkageLetter]: {
                                    attrValue: {
                                        valueObj: concatStr.substring(0, concatStr.length - 1)
                                    },
                                    letter: linkageLetter
                                }
                            })
                        }
                    })
                })
            }
            Object.assign(commodity, linkageFormattedData);
            Object.values(commodity).map((item) => {
                if (item.attrValue.hasOwnProperty('valueObj')) { // 先前item.attrValue.valueObj当单行文本或者多行文本为空的时候,会把此字段给去除
                    commodityCollection.push(item)
                }
            });
        }
        if (Object.prototype.toString.call(sale) === '[object Array]') {
            let deleteProperty = ['jSkuId', 'jWareId', 'skuId', 'jmiSkuPricesSetting', 'saleListSetting', 'saleListStr', 'saleSetting'];
            let skuExtendObj = getConversionPrice(propertyAttrs.skuExtendAttrs); // sku扩展属性
            let priceExtendObj = getConversionPrice(propertyAttrs.priceExtendAttrs); // 价格日历扩展属性
            sale.map((item) => {
                for (let i = 0; i < deleteProperty.length; i++) {
                    if (item.hasOwnProperty(deleteProperty[i])) {
                        delete item[deleteProperty[i]]
                    }
                }

                // 删除字段(这两个字段为null时会造成编辑商品时,出错)
                if (item.hasOwnProperty('jmiSkuPrices') && item.jmiSkuPrices) {
                    item.jmiSkuPrices.map((jmiItem) => {
                        if (jmiItem.hasOwnProperty('extPropertyListStr')) {
                            delete jmiItem['extPropertyListStr']
                        }
                        if (jmiItem.hasOwnProperty('settingListStr')) {
                            delete jmiItem['settingListStr']
                        }
                    });
                }

                // 将价格日历的价格和价格日历扩展属性数据的元化分
                if (item.jmiSkuPrices && item.jmiSkuPrices.length > 0) { // 价格日历
                    let skuPrice = item.jmiSkuPrices || [];
                    skuPrice.map((skuItem) => {
                        let price = skuItem.price,
                            tempList = [],
                            extPropertyList = skuItem.extPropertyList;

                        // 添加价格日历中价格元化分的逻辑
                        if (skuItem.price && !isNaN(price)) {
                            skuItem.price = multiply(skuItem.price);
                        }

                        // 添加价格日历扩展属性根据isMoney字段判断是否需要元化分的逻辑
                        if (extPropertyList && extPropertyList.length > 0) {
                            extPropertyList.map((extItem) => {
                                let tempObj = _cloneDeep(extItem),
                                    letter = tempObj.letter,
                                    value = tempObj.attrValue.valueObj;
                                if (priceExtendObj.hasOwnProperty(letter) && priceExtendObj[letter] === '1' && value && !isNaN(value)) {
                                    tempObj.attrValue.valueObj = multiply(value);
                                }

                                tempList.push(tempObj);
                            })
                        }
                        Object.assign(skuItem, {
                            extPropertyList: tempList
                        });
                    })
                } else { // 将sku扩展属性数据的元化分
                    let skuPrice = item.extSetting;
                    if (skuPrice && skuPrice.length > 0) {
                        skuPrice.map((skuItem) => {
                            let tempObj = skuItem,
                                letter = tempObj.letter,
                                value = tempObj.attrValue.valueObj;
                            if (skuExtendObj.hasOwnProperty(letter) && skuExtendObj[letter] === '1' && value && !isNaN(value)) {
                                tempObj.attrValue.valueObj = multiply(value);
                            }

                            return tempObj;
                        });
                    }
                }

                // 将每条销售记录的元变成分
                if (item.hasOwnProperty('skuPrice') && item['skuPrice'] && !isNaN(item['skuPrice'])) {
                    item.skuPrice = multiply(item.skuPrice);
                }

                return item
            })
        }
        let collection = Object.assign({}, wareData, {
            operateType: action.operateType,
            shopCategoryStr: state.shopCategoryStr || '',
            jmiImageSetting: JSON.stringify(mainImg.concat(detailImg).map((item, index) => ({indexId: index + 1, imgPath: item.url.replace(IMAGE_URL, '')}))),
            jmiWareSkuSetting: JSON.stringify(sale),
            wareSetting: JSON.stringify(commodityCollection)
        });

        deleteProperty(collection, ['skuExtendAttrs', 'skuSaleAttrs', 'skus', 'spuAttrs', 'wareSettingList', 'wareImages']);
        console.log('最终组织的数据----', state.dimCollection, collection);
        return updateState(state, {
            productParams: collection
        });
    },
    // 获取已添商品数据信息
    [types.RECEIVE_MODIFY_PRODUCT](state, action) {
        let initData = action.addproduct.data,
            saleTabs = state.saleTabs, // 销售属性多模式
            saleModeTypePo = state.saleModeTypePo, // 销售属性多模式数据集合
            wareSettingList = initData.wareSettingList, // 商品属性数据
            wareImages = initData.wareImages || [], // 商品图片数据
            saleSkus = initData.skus, // 销售属性数据
            shopCategory = initData.shopCategory || [], // 店内分类数据
            storeSort = state.storeSort || [], // 店内分类
            skuSaleAttrs = state.addproduct.data.skuSaleAttrs;
        // 组织维度的笛卡尔积集合
        let dimDecare = organizeDimDecare(skuSaleAttrs,saleTabs);
        // 适配维度数据信息
        let adapterSkuSaleObj = adapterSkuSaleDataFormat(skuSaleAttrs);
        // 适配商品数据信息
        let adapterSpuObj = adapterSpuDataFormat(state.addproduct.data.spuAttrs);
        // 将后台获取到的商品数据中的商品属性数据组织起来
        let modifyCommodityData = organizationCommodityDataFormat(wareSettingList);
        // 组织联动菜单数据
        let initLinkageObj = organizationLinkageFormat(wareSettingList, adapterSpuObj);
        // 获取销售记录
        let saleDataPo = {
            initSaleData: saleSkus,
            dimCol: skuSaleAttrs,
            adapterSkuSaleObj,
            dimDecare,
            saleModeTypePo,
            templateData: state.addproduct.data
        };
        let saleRecordsAttr = organizationSaleDataFormat(saleDataPo);
        // 获取维度信息记录
        let dimCollection = organizationDimDataFormat(saleSkus, adapterSkuSaleObj, state.saleModeTypePo);
        // 修改销售属性维度显示值
        organizationDimValueFormat(dimCollection, skuSaleAttrs);
        // 获取图片
        let [mainImg, detailImg] = organizationDImagesFormat(wareImages);
        // 将后台获取到的商品数据初始值存放到productParams中
        let modifyProductData = organizationDataFormat(state.productParams, action.addproduct.data);
        let logo = '';
        if (wareImages.length > 0) {
            logo = wareImages[0].imgPath
        }

        // 过滤无用的店内分类
        let storeSortIdList = getStoreSortId(storeSort);
        let shopCategoryStr = shopCategory.filter((item) => (storeSortIdList.indexOf(item) > -1)).join(',');

        return updateState(state, {
            productParams: Object.assign(modifyProductData, {logo}),
            saleRecordsAttrs: saleRecordsAttr,
            mainImg: mainImg,
            detailImg: detailImg, // 细节图存储容器
            shopCategoryStr, // 店内分类
            dimCollection: Object.assign({}, state.dimCollection, dimCollection),
            commodityData: Object.assign({}, state.commodityData, modifyCommodityData),
            initLinkagePost: initLinkageObj // 初始化联动菜单时需要发送获取数据的请求
        });
    },
    // 应用扩展商品属性数据功能
    [types.RECEIVE_SALEPROPERTY_EXTEND](state, action) {
        let extendPropertyParams = action.params,
            type = extendPropertyParams.type, // 判断扩展的类型  all 代表应用到所有  other 代表运用到其他
            unitType = extendPropertyParams.unitType, // 代表需要扩展的属性单位
            extendValue = extendPropertyParams.value, // 扩展的值
            letter = extendPropertyParams.letter; // extSetting需要用到letter
        state.saleRecordsAttrs.map((com) => {
            if (unitType === 'extSetting') {
                let extSetting = com.extSetting,
                    value = extendValue[letter];
                if (type === 'all') {
                    extSetting.map((item) => {
                        if (item.letter === letter) {
                            return Object.assign(item, {
                                attrValue: {
                                    valueObj: value
                                }
                            })
                        }
                    })
                } else if (type === 'other') {
                    extSetting.map((item) => {
                        if (item.letter === letter && item.attrValue.valueObj === '') {
                            return Object.assign(item, {
                                attrValue: {
                                    valueObj: value
                                }
                            })
                        }
                    })
                }
            } else {
                if (type === 'all') {
                    Object.assign(com, {
                        [unitType]: extendValue
                    })
                } else if (type === 'other') {
                    // 判断如果value中包含unitType属性并且值为空,则代表可以赋值
                    if (com.hasOwnProperty(unitType) && com[unitType] === '') {
                        Object.assign(com, {
                            [unitType]: extendValue
                        })
                    }
                }
            }
        });
        return updateState(state, {
            validatorStatus: true
        });
    },
    // 错误信息状态记录
    [types.RECEIVE_CHANGE_ERROR_MSG](state, action) {
        let params = action.params,
            {
                module,
                key,
                name,
                value
            } = params,
            errorMsg = state.errorMsg,
            tempObj = {name, value};
        // 如果value为null的时候,则代表没有违反校验
        if (value === null) {
            // 如果errorMsg中有此属性的校验错误时,需要删除
            if (errorMsg.hasOwnProperty(module) && errorMsg[module].hasOwnProperty(key)) {
                delete state.errorMsg[module][key]
            }
        } else {
            if (errorMsg.hasOwnProperty(module)) {
                Object.assign(errorMsg, {
                    [module]: Object.assign(state.errorMsg[module], {[key]: tempObj})
                })
            } else {
                Object.assign(errorMsg, {
                    [module]: {
                        [key]: tempObj
                    }
                })
            }
        }

        return updateState(state, {
            errorMsg,
            validatorStatus: false
        });
    },
    // 移除图片
    [types.RECEIVE_REMOVE_IMAGE](state, action) {
        let params = action.params,
            type = params.type,
            id = params.id;
        if (type === MAIN_IMAGE_FLAG) { // 主图
            state.productParams.logo = '';
            return Object.assign({}, state, {
                mainImg: []
            })
        } else  {
            let detailImg = state.detailImg;
            return Object.assign({}, state, {
                detailImg: detailImg.filter((item) => (item.id !== id))
            })
        }
    },
    [types.RECEIVE_LINKAGE_INIT](state, action) {
        return Object.assign({}, state, {
            linkageOptionObj: Object.assign({}, state.linkageOptionObj, action.linkageOptionObj || {}),
            linkageOptionValue: Object.assign({}, state.linkageOptionValue, action.linkageOptionValue)
        })
    },
    // 保存富文本
    [types.RECEIVE_SAVE_RICHTEXT](state, action) {
        // 富文本列表
        let notes = action.params,
            letter = action.letter;
        return Object.assign({}, state, {
            [`${letter}s`]: notes
        })
    },
    // 选择历史富文本
    [types.RECEIVE_SELECT_RICHTEXT](state, action) {
        let note = action.note;
        let letter = action.letter;
        Object.assign(state.productParams, {
            [letter]: note
        });

        return Object.assign({}, state)
    },
    // 拼接商品名称
    [types.RECEIVE_CONCAT_NAME](state, action) {
        let value = action.value,
            curLength = (state.productParams.title + value).length;

        if (curLength <= 45) {
            return Object.assign({}, state, {
                productParams: Object.assign(state.productParams, {
                    title: state.productParams.title + value
                })
            })
        }

        return state
    },
    // 改变价格日历数据
    [types.RECEIVE_CHANGE_CALENDAR_DATA](state, action) {
        let saleRecordsAttrs = _cloneDeep(state.saleRecordsAttrs),
            params = action.params,
            [tempRecords, status] = organizeCalendarData(saleRecordsAttrs, params, 'add');
        if (!status) {
            return state;
        } else {
            return Object.assign({}, state, {
                saleRecordsAttrs: tempRecords
            });
        }
    },
    // 删除价格日历的某条记录
    [types.RECEIVE_DELETE_CALENDAR_DATA](state, action) {
        let saleRecordsAttr = _cloneDeep(state.saleRecordsAttrs),
            params = action.params,
            [tempRecords, status] = organizeCalendarData(saleRecordsAttr, params, 'delete');
        if (!status) {
            return state;
        } else {
            return Object.assign({}, state, {
                saleRecordsAttrs: tempRecords
            });
        }
    },
    // 查询海量数据
    [types.RECEIVE_BIG_DATA](state, action) {
        const data = action.data,
            letter = action.letter;
        Object.assign(state.bigDataList, {
            [letter]: [].concat(moreSearchTip, data)
        });
        return Object.assign({}, state);
    },
    // 销售记录正则校验错误
    [types.RECEIVE_SALE_VALIDATE_MSG](state, action) {
        let data = action.data;
        return Object.assign({}, state, {
            saleValidateMsg: data
        })
    },
    // 初始海量数据组件
    [types.RECEIVE_SELECT_BIG_DATA](state, action) {
        let data = action.data,
            letter = action.letter;
        Object.assign(state.bigDataList, {
            [letter]: [].concat(moreSearchTip, data)
        });
        return Object.assign({}, state);
    },
    // 修改带价格日历的数据
    [types.RECEIVE_CHANGE_CALENDAR_BASE_DATA](state, action) {
        let params = action.params,
            dataSource = state.saleRecordsAttrs;
        dataSource.map((item) => {
            if (item.saleRecordKey === params.saleRecordKey) {
                item[params.type] = params.value
            }
        });
        return Object.assign({}, state, {
            saleRecordsAttrs: dataSource
        });
    },
    // 组织销售记录数据
    [types.ORGANIZE_SALE_RECORDS_DATA](state, action) {
        let saleParams = action.saleParams,
            saleRecordKeyList = saleParams.map((item) => {
                return item.saleRecordKey
            }),
            // 销售属性多模式情况下需要将非当前模式的数据保存下来
            filterSaleList = state.saleRecordsAttrs.filter((item) => (saleRecordKeyList.indexOf(item.saleRecordKey) === -1)),
            saleRecordsAttr = [].concat(saleParams, filterSaleList);
        return Object.assign({}, state, {
            saleRecordsAttrs: saleRecordsAttr,
            validatorStatus: true
        })
    },
    // 设置店内分类
    [types.RECEIVE_SHOP_CATEGORY](state, action) {
        let data = action.data;
        return Object.assign({}, state, {
            storeSort: data
        })
    },
    // 获取选中的店内分类列表
    [types.ORGANIZE_SHOP_CATEGORY](state, action) {
        return Object.assign({}, state, {
            shopCategoryStr: action.data
        })
    },
    // 图片上传
    [types.RECEIVE_CHOOSE_IMAGES](state, action) {
        let data = action.data,
            logo = '',
            mainImg = [].concat(state.mainImg),
            detailImg = [].concat(state.detailImg.map((item, index) => {
                item.uid = index;
                item.id = index;
                return item;
            }));
        for (let i = 0; i < data.length; i++) {
            let imgUrl = data[i].imgUrl;
            if (mainImg.length === 0) { // 主图为空, 则添加主图
                logo = imgUrl.replace(IMAGE_URL, '');
                mainImg = [{
                    uid: MAIN_IMAGE_FLAG,
                    id: 1,
                    name: '',
                    status: 'done',
                    url: imgUrl
                }];
                continue;
            }

            if (detailImg.length < IMAGE_NUM.detail) {
                detailImg.push({
                    uid: detailImg.length,
                    id: detailImg.length,
                    name: '',
                    status: 'done',
                    url: imgUrl
                });
                continue;
            }
        }
        state.productParams['logo'] = logo;
        return Object.assign({}, state, {
            mainImg,
            detailImg
        });
    }
});

// 在组织销售记录的时候判断是否需要添加sku扩展属性
function isNeedExtend(po, productParams) {
    let {saleModeType} = po;
    if (productParams.skuStyleType + '' === SALE_MODE_TYPE.noCalendar || (saleModeType === SALE_MODE_TYPE.noCalendar)) {
        return true;
    }
    return false;
}

// 组织销售记录扩展属性
function organizeExtSetting(data, skuExtendAttr, saleRecordTemplate, po, productParams, saleRecordsKey = '') {
    let extSetting = [];
    skuExtendAttr.map((item) => {
        extSetting.push({
            attrValue: {
                valueObj: ''
            },
            tips: item.tips,
            suffix: item.config.suffix, // 扩展属性单位
            letter: item.letter
        })
    });

    let saleRecordsAttr = [];
    for (let i = 0; i < data.length; i++) {
        if (!saleRecordsKey || (saleRecordsKey && saleRecordsKey.indexOf(data[i]['saleRecordKey']) === -1)) { // 如果销售记录中已经有此条记录,那么就不需要重新添加
            let tempObj = Object.assign({}, saleRecordTemplate, data[i]);
            if (isNeedExtend(po, productParams)) {
                tempObj.extSetting = extSetting;
            } else {
                tempObj.extSetting = [];
            }
            saleRecordsAttr.push(tempObj)
        }
    }

    return saleRecordsAttr
}

// 组织销售属性记录集合
function getSaleRecordsList(po) {
    let {
        dimCollection,
        data,
        saleModeTypePo,
        saleModeType
    } = po;
    dimCollection = getDimWithSaleType(dimCollection, saleModeTypePo[saleModeType]);
    let dataArr = [],
        len = 0,
        recordKeyFlag = CONCAT_FLAG.recordKey,
        recordConcat = filter.concatSaleRecordKey(saleModeType),
        dimArr = Object.values(dimCollection);
    dimArr.map((item) => {
        if (item && item.length > 0) {
            len += 1;
        }
        dataArr.push([].concat({
            label: recordKeyFlag,
            index: recordKeyFlag,
            value: recordKeyFlag
        }, item));
    });
    let dimList = getDimList(descartes(dataArr), 'index');
    dimList = dimList.map((item) => (`${recordConcat};${item}`));
    return data.filter((item) => {
        let saleRecordKey = item.saleRecordKey,
            saleRecordSplit = saleRecordKey.split(';'),
            keyLen = 0;
        for (let i = 0; i < saleRecordSplit.length; i++) {
            let keyItem = saleRecordSplit[i];
            if (keyItem !== recordConcat && i === 0) { // 索引为0的时候为多模式标识
                return true;
            }
            if (keyItem !== recordKeyFlag && i !== 0) { // 索引非0的时候为记录标识
                keyLen += 1;
            }
        }
        return dimList.indexOf(saleRecordKey) > -1 && len === keyLen;
    })
}

// 获取销售记录扩展数据分元转换状态对象
function getConversionPrice(data) {
    data = data || [];
    let priceExtendObj = {};
    data.map((item) => {
        let setting = JSON.parse(item.setting),
            isMoney = setting.isMoney;
        Object.assign(priceExtendObj, {
            [item.letter]: isMoney
        })
    });

    return priceExtendObj
}

// 组织销售属性价格日历数据  type add 添加  delete 删除
function organizeCalendarData(target, params, type) {
    target = target || [];
    let recordKey = params.recordKey,
        nowTime = params.nowTime,
        legalTime = params.legalTime,
        status = true, // 用来判断价格库存是否符合校验
        calendarData = params.data;
    target.map((item) => {
        if (item.saleRecordKey === recordKey) {
            let minPrice = null, // 最低价格
                totalStock = 0; //  总库存
            if (calendarData[recordKey]) { // 代表存在需要操作的销售记录
                if (type === 'add') {
                    let jmiSkuPrices = item.jmiSkuPrices ? item.jmiSkuPrices : [];
                    let newDataArr = [].concat(Object.values(calendarData[recordKey]), jmiSkuPrices);
                    let dateArr = [];
                    // 去重(处理选择相同时间或者时间段时有重复数据的问题)
                    let tempData = newDataArr.filter((saleItem) => {
                        if (dateArr.indexOf(saleItem.dateDay) === -1) {
                            dateArr.push(saleItem.dateDay);
                            return saleItem;
                        }
                    });
                    Object.assign(item, {  // 添加价格日历数据
                        jmiSkuPrices: tempData
                    });
                }
                if (type === 'delete') {
                    Object.assign(item, {  // 删除价格日历数据
                        jmiSkuPrices: Object.values(calendarData[recordKey])
                    })
                }
            }

            // 价格日历中组织销售记录的价格和库存
            let skuPrice = item.jmiSkuPrices || [];
            for (let i = 0; i < skuPrice.length; i++) {
                let skuItem = skuPrice[i],
                    now = skuItem.dateDay,
                    price = skuItem.price,
                    stock = skuItem.stock;
                if (judgeTimeLegal(now, nowTime, legalTime)) { // 如果时间在有效时间内
                    if (!isNaN(stock)) {
                        totalStock += parseInt(stock);
                    }
                    let stockFlag = !isNaN(stock) && parseInt(stock) !== 0;
                    if (!isNaN(price) && minPrice === null && stockFlag) { // 将库存为0的价格排除在外
                        minPrice = parseFloat(price)
                    } else if (!isNaN(price) && minPrice >= parseFloat(price) && stockFlag) {
                        minPrice = parseFloat(price);
                    }
                }

                let tempPrice = '', // 添加价格库存长度判断
                    tempStock = totalStock;
                if (price && !isNaN(price)) {
                    tempPrice = multiply(price);
                }
                if (tempPrice.toString().length > 9 || tempStock.toString().length > 9) { // 如果价格大于9位
                    status = false;
                    let tips = '';
                    if (tempPrice.toString().length > 9 && tempStock.toString().length > 9) {
                        tips = '价格与库存超度最大限度'
                    } else if (tempPrice.toString().length > 9) {
                        tips = '价格超出最大限度'
                    } else if (tempStock.toString().length > 9) {
                        tips = '库存超出最大限度'
                    }
                    notification['warning']({
                        message: '提示',
                        description: tips
                    });
                    break;
                }
            }

            Object.assign(item, {
                skuPrice: minPrice,
                quantity: totalStock
            });
        }
        return item;
    });
    if (status) {
        notification['success']({
            message: '提示',
            description: '信息保存成功'
        });
    }
    return [target, status];
}

// 判断时间是否符合
function judgeTimeLegal(now, startDate, endDate) {
    return now >= startDate && now <= endDate;
}

function deleteProperty(target, properties) {
    properties.map((property) => {
        if (target.hasOwnProperty(property)) {
            delete target[property]
        }
    })
}

// 维度集合
function organizeDimDecare(dimCol, saleTabs) {
    let dimList = [];
    if (saleTabs.length === 0) { //  如果saleTabs为0 代表不是销售属性多模式
        return organizeDimMethod(dimCol);
    }
    saleTabs.forEach((item) => {
        let dataList = organizeDimMethod(Object.values(item.values), item.type);
        dimList.push(...dataList);
    });
    return dimList;
}

function organizeDimMethod(dataSource, type = '') {
    let dataArr = [],
        recordKeyFlag = CONCAT_FLAG.recordKey;
    dataSource.map((valueItem) => {
        dataArr.push([].concat({
            label: recordKeyFlag,
            value: recordKeyFlag
        }, valueItem.config.options))
    });
    let decareList = descartes(dataArr);
    let dataList = getDimList(decareList, 'value');
    dataList = dataList.map((dataItem) => {
        return `${filter.concatSaleRecordKey(type)};${dataItem}`;
    });

    return dataList
}

function getDimList(decareList, selectKey) {
    let tempArr = [];
    for (let i = 0; i < decareList.length; i++) {
        let temp = decareList[i];
        if (Object.prototype.toString.call(temp) === '[object Object]') {
            temp = [temp];
        }
        tempArr.push(temp.map((item) => item[selectKey]).join(';'));
    }
    return tempArr;
}

// 封装维度信息(将dimCol中的config的option单独取出来)
function adapterSkuSaleDataFormat(dimCol) {
    let dimObj = {};
    dimCol.map((item) => {
        let tempObj = {};
        item.config.options.map((optionItem) => {
            Object.assign(tempObj, {
                [optionItem.value]: optionItem.label
            })
        });
        Object.assign(dimObj, {
            [item.letter]: tempObj
        })
    });

    return dimObj
}

// 封装销售数据信息
function adapterSpuDataFormat(commodityData) {
    let tempObj = {};
    commodityData.map((item) => {
        Object.assign(tempObj, {
            [item.letter]: item.config
        })
    });

    return tempObj
}

// 根据初始获取的数据组织数据格式
function organizationDataFormat(initProductData, initData) {
    return Object.assign({}, initProductData, initData)
}

// 根据初始获取的数组组织商品属性数据格式(联动菜单除外)
function organizationCommodityDataFormat(initCommodityData) {
    initCommodityData = initCommodityData || [];
    let tempObj = {};
    initCommodityData.map((item) => {
        Object.assign(tempObj, {
            [item.letter]: {  // 商品数据参数模板
                attrValue: item.attrValue,
                letter: item.letter
            }
        })
    });

    return tempObj
}

// 联动菜单数据
function organizationLinkageFormat(linkageData, linkageObj) {
    let initLinkageObj = {};
    if (linkageData) {
        let tempLinkageId = '',
            tempOptionArr = [];
        linkageData.map((item) => {
            let tempObj = {},
                optionValue = {};
            if (item.type === 'linkage' && linkageObj && linkageObj.hasOwnProperty(item.letter)) {
                let value = item.attrValue.valueObj,
                    templateObj = linkageObj[item.letter],
                    linkageId = templateObj.linkageId,
                    linkageLevel = templateObj.linkageLevel,
                    length = value.split('^').length,
                    // 如果长度为1则证明是联动菜单的第一级， parentId和letter需要特殊初始化
                    flag = length === 1,
                    parentId = flag ? 0 : linkageId;
                // 如果flag为true，则取linkageLetter作为初始化
                let letter = flag ? templateObj.linkageLetter : value.split('^')[parseInt(linkageLevel) - 2],
                    linkageLetter = item.letter,
                    linkage = `${linkageId};${linkageLevel}`;
                optionValue = {
                    [linkage]: {
                        linkageLetter: linkageLetter,
                        value: `${value.split('^')[parseInt(linkageLevel) - 1]};${linkageId}`
                    }
                };

                tempObj = {
                    current: value.split('^')[parseInt(linkageLevel) - 1],
                    linkageLevel,
                    parentId,
                    linkageId,
                    letter,
                    linkageLetter,
                    linkage,
                    linkageOptionValue: optionValue,
                    init: true
                };

                tempOptionArr.push(tempObj);
                tempLinkageId = linkageId;
            }
        });
        if (tempLinkageId) {
            initLinkageObj[tempLinkageId] = tempOptionArr;
        }
    }

    return initLinkageObj;
}

// 根据初始获取的数组组织销售属性数据格式 并将dimDecare中没有的但销售记录中有的冗余数据给删除
function organizationSaleDataFormat(po) {
    let {
        initSaleData,
        dimCol,
        adapterSkuSaleObj,
        dimDecare,
        saleModeTypePo,
        templateData
    } = po;
    let dimList = [];
    dimCol.map(() => {
        dimList.push(CONCAT_FLAG.recordKey);
    });

    // 扩展属性分元转化
    let skuExtendObj = getConversionPrice(templateData.skuExtendAttrs); // sku扩展属性
    let priceExtendObj = getConversionPrice(templateData.priceExtendAttrs); // 价格日历扩展属性

    let organizeData = initSaleData.map((com) => {
        let dimNameObj = {};
        // 获取dimNameObj(销售记录的名称)
        (com.saleList || []).map((item) => {
            let aliasName = item.attrValue.aliasName,
                valueObj = item.attrValue.valueObj;
            // 如果别名为空，那么取初始维度信息的别名
            if (aliasName === null && adapterSkuSaleObj.hasOwnProperty(item.letter)) {
                aliasName = adapterSkuSaleObj[item.letter][valueObj]
            }
            Object.assign(dimNameObj, {
                [item.letter]: aliasName
            })
        });

        let [saleRecordKey, saleIndexKey] = getDimElement(com, saleModeTypePo, dimList, dimCol, templateData);
        // 给每条销售记录赋值saleRecordKey,每条记录的唯一标识
        if (`${templateData.skuStyleType}` === SALE_MODE_TYPE.noCalendar || (com.jmiSkuPrices && com.jmiSkuPrices.length === 0)) { // 将sku扩展属性数据的元化
            let skuPrice = com.extSetting || [];
            skuPrice.map((skuItem) => {
                let tempObj = Object.assign({}, skuItem),
                    letter = tempObj.letter,
                    value = tempObj.attrValue.valueObj;
                if (skuExtendObj[letter] === '1' && value && !isNaN(value)) {
                    tempObj.attrValue.valueObj = divide(value);
                }
                return tempObj;
            });
            // 将分变成元
            if (com['skuPrice'] && !isNaN(com['skuPrice'])) {
                com.skuPrice = divide(com.skuPrice);
            }
        }

        if (`${templateData.skuStyleType}` === SALE_MODE_TYPE.calendar || (com.jmiSkuPrices && com.jmiSkuPrices.length > 0)) { // 判断是否包含价格日历
            com = organizeCalendar(com, priceExtendObj);
        }

        return Object.assign(com, {dimNameObj}, {saleRecordKey}, {saleIndexKey});
    });

    let tempData = [];
    // 将冗余数据删除(适用于先前配置的销售维度,并产生了销售记录,然后删除了销售维度某项)
    organizeData.map((item) => {
        if (dimDecare.indexOf(item.saleRecordKey) > -1) {
            tempData.push(item);
        }
    });

    return tempData;
}

// 数据回显设置一个集合存放销售属性维度坑位(暂无考虑有日历有时间)
function getDimElement(target, saleModeTypePo, dimList, dimCol, templateData) {
    let values = Object.values(saleModeTypePo);
    let recordKeyFlag = CONCAT_FLAG.recordKey,
        dimCollection = _cloneDeep(dimCol),
        letterList = dimCol.map((item) => (item.letter)),
        skuStyleType = templateData.skuStyleType,
        calendarType  = SALE_MODE_TYPE.calendar,
        noCalendarType = SALE_MODE_TYPE.noCalendar,
        condition = '',
        concatFlag = '';
    if ((values.length > 1 && target.jmiSkuPrices && target.jmiSkuPrices.length > 0)) { // 多模式 价格日历 大于0 代表为价格日历
        condition = saleModeTypePo[calendarType];
        dimCollection = filterDim(dimCol, condition);
        dimList = Array(condition.length).fill(recordKeyFlag);
        concatFlag = filter.concatSaleRecordKey(calendarType);
    } else if (values.length > 1) { // 多模式 无日历
        condition = saleModeTypePo[noCalendarType];
        dimCollection = filterDim(dimCol, condition);
        dimList = Array(condition.length).fill(recordKeyFlag);
        concatFlag = filter.concatSaleRecordKey(noCalendarType);
    } else if (`${skuStyleType}` === calendarType || `${skuStyleType}` === noCalendarType) { // 单模式
        condition = letterList;
        dimCollection = filterDim(dimCol, condition);
        dimList = Array(condition.length).fill(recordKeyFlag);
        concatFlag = filter.concatSaleRecordKey('');
    }else {
        concatFlag = filter.concatSaleRecordKey('');
    }
    let saleRecordList = _cloneDeep(dimList);
    let saleIndexList = _cloneDeep(dimList);
    dimCollection.map((dimItem, index) => {
        target.saleList.map((saleItem) => {
            let valueObj = `${saleItem.attrValue.valueObj}`;
            if (saleItem.letter === dimItem.letter) {
                saleRecordList[index] = valueObj;
                dimItem.config.options.map((configOpt, itemIndex) => {
                    if (configOpt.value === valueObj) {
                        saleIndexList[index] = `${itemIndex}`;
                    }
                })
            }
        })
    });
    saleRecordList.unshift(concatFlag);
    saleIndexList.unshift(concatFlag);

    return [saleRecordList.join(';'), saleIndexList.join(';')];
}

// 过滤维度信息
function filterDim(dataSource, condition) {
    return dataSource.filter((item) => {
        return condition.indexOf(item.letter) > -1
    })
}

// 组织价格日历数据
function organizeCalendar(item, priceExtendObj) {
    let jmiSkuPrices = item.jmiSkuPrices,
        price = '',
        stock = '';
    jmiSkuPrices.map((priceItem, index) => {
        // 将时间戳转换成'yyyy-mm-dd'格式
        let extPropertyList = priceItem.extPropertyList || [],
            itemPrice = priceItem.price,
            itemStock = priceItem.stock;
        let date = dateFormatUtil(priceItem.dateDay, false);

        extPropertyList.map((extItem) => {
            let letter = extItem.letter,
                value = extItem.attrValue.valueObj;
            if (priceExtendObj.hasOwnProperty(letter) && priceExtendObj[letter] === '1') {
                if (value && !isNaN(value)) {
                    extItem.attrValue.valueObj = divide(value);
                }
            }
        });
        let stockFlag = !isNaN(itemStock) && parseInt(itemStock) !== 0;
        if (stockFlag) {
            if (typeof price !== 'number') {
                price = itemPrice;
                stock = itemStock;
            } else {
                if (price >= itemPrice) {
                    price = itemPrice;
                }
                stock += itemStock;
            }
        }

        // 价格日历扩展属性将分变成元
        if (priceItem.hasOwnProperty('price') && priceItem['price'] && !isNaN(priceItem['price'])) {
            priceItem.price = divide(priceItem.price);
        }

        return Object.assign(priceItem, {
            dateDay: date
        })
    });

    // 将分变成元
    if (price && !isNaN(price)) {
        price = divide(price);
    }
    return Object.assign(item, {
        skuPrice: price,
        quantity: stock
    });
}

// 组织销售维度信息
function organizationDimDataFormat(initSaleData, adapterSkuSaleObj, saleModeTypePo) {
    let dimCollection = {};
    initSaleData.map((com) => {
        let saleList = com.saleList || [];
        saleList.map((item) => {
            let attrValue = item.attrValue,
                valueObj = attrValue.valueObj,
                label = attrValue.aliasName,
                letter = item.letter;
            // 如果别名为空,那么取初始维度属性的别名值
            if (label === null && adapterSkuSaleObj.hasOwnProperty(letter)) {
                label = adapterSkuSaleObj[letter][valueObj]
            }
            let skuLetter = adapterSkuSaleObj[letter] || {};
            let indexArr = Object.keys(skuLetter);
            let currentDim = getSaleModeDim(com, adapterSkuSaleObj, letter, saleModeTypePo);
            let tempObj = {
                dim: currentDim,
                value: label,
                index: valueObj,
                saleLetter: letter
            };
            // 找到每个销售维度维度项对应下标
            for (let i = 0; i < indexArr.length; i++) {
                if (parseInt(valueObj) === parseInt(indexArr[i])) {
                    Object.assign(tempObj, {
                        indexKey: i
                    })
                }
            }

            if (dimCollection.hasOwnProperty(letter)) {
                let status = false;
                dimCollection[letter].map((dim) => {
                    if (dim.index === tempObj.index) {
                        status = true;
                    }
                });
                if (!status) {
                    Object.assign(dimCollection, {
                        [letter]: [].concat(dimCollection[letter], tempObj)
                    })
                }
            } else {
                Object.assign(dimCollection, {
                    [letter]: [tempObj]
                })
            }
        })
    });

    return dimCollection;
}

// 获取销售属性多模式当前维度
function getSaleModeDim(target, dimCollection, letter, saleModeTypePo) {
    let values = Object.values(saleModeTypePo),
        dimList = Object.keys(dimCollection);
    if (values.length > 1 && target.jmiSkuPrices && target.jmiSkuPrices.length > 0) { // 大于0 代表为价格日历
        return saleModeTypePo[SALE_MODE_TYPE.calendar].indexOf(letter);
    } else if (values.length > 1) { // 无日历
        return saleModeTypePo[SALE_MODE_TYPE.noCalendar].indexOf(letter);
    } else {
        return dimList.indexOf(letter)
    }
}

// 修改销售属性维度显示值
function organizationDimValueFormat(dimCollection, skuSaleAttr) {
    // 首先将dimCollection转换下格式
    // 先前格式{letter1:[{index:1, saleLetter: letter1, value: xxx}]}
    // 转换后格式{letter1: {[index]: xxx}...}
    let adapterDimCollection = {};
    for (let [key, value] of Object.entries(dimCollection)) {
        let tempObj = {};
        value.map((item) => {
            Object.assign(tempObj, {
                [item.index]: item.value
            })
        });
        Object.assign(adapterDimCollection, {[key]: tempObj})
    }
    return skuSaleAttr.map((item) => {
        item.config.options.map((option) => {
            if (adapterDimCollection.hasOwnProperty(item.letter) && adapterDimCollection[item.letter].hasOwnProperty(option['value'])) {
                option.label = adapterDimCollection[item.letter][option['value']]
            }
        });
        return item
    })
}

// 图片设置
function organizationDImagesFormat(images) {
    let mainImg = [], detailImg = [];

    images.map((item, index) => {
        if (index === 0) {
            mainImg.push({
                uid: MAIN_IMAGE_FLAG,
                id:  1,
                name: '',
                status: 'done',
                url: `${IMAGE_URL}${item.imgPath}`
            })
        } else {
            detailImg.push({
                uid: index - 1,
                id: index - 1,
                name: '',
                status: 'done',
                url: `${IMAGE_URL}${item.imgPath}`
            })
        }

    });

    return [mainImg, detailImg]
}

// 笛卡尔积
function descartes(data) {
    if (data.length < 2) return data[0] || [];
    return [].reduce.call(data, function (col, set) {
        let res = [];
        col.forEach(function (c) {
            set.forEach(function (s) {
                let t = [].concat(Array.isArray(c) ? c : [c]);
                t.push(s);
                res.push(t);
            })
        });
        return res;
    });
}

// 组织销售属性记录的信息
function multiCartesian(po) {
    let {data, params, saleNeed, dimLetterList, saleModeTypePo, saleModeType, type} = po;
    let dataArr = [],
        currentDim = saleModeTypePo[saleModeType]; // 销售属性多模式对应的销售维度集合
    data = getDimWithSaleType(data, currentDim);
    dimLetterList = currentDim || dimLetterList; // currentDim为空,则非销售属性多模式
    for (let [key, value] of Object.entries(data)) {
        if (!type) { // 如果type为空,则代表添加销售维度选项
            if (key === params.saleLetter) {
                dataArr.push([params])
            } else if (saleNeed[key] === 1 || (saleNeed[key] !== 1 && value && value.length > 0)) {
                dataArr.push(value);
            }
        } else { // type不为空 代表删除销售维度选项
            if (saleNeed[key] === 1 || (saleNeed[key] !== 1 && value && value.length > 0)) {
                dataArr.push(value);
            }
        }
    }

    let tempData = descartes(dataArr),
        result = [];

    for (let i = 0; i < tempData.length; i++) {
        let temp = tempData[i],
            tempObj = {},
            selectRecordKey = [], // 每条记录的唯一表示
            selectIndexKey = [],
            recordKeyFlag = CONCAT_FLAG.recordKey,
            saleList = [], // 销售属性信息
            dimNameObj = {}; // 每个维度的名称
        // 如果为object, 将对象转换成数组(维度为一的时候需要转换)
        if (Object.prototype.toString.call(temp) === '[object Object]') {
            temp = [temp];
        }
        selectIndexKey = Array(dimLetterList.length).fill(recordKeyFlag); // 用来占坑 (先将销售记录的标识用@添充)
        selectRecordKey = Array(dimLetterList.length).fill(recordKeyFlag);

        temp.map((item) => {
            let currentDim = item.dim;
            dimLetterList.map((saleItem, saleIndex) => {
                if (saleIndex === currentDim || saleItem === item.saleLetter) {
                    selectRecordKey[currentDim] = item.index;
                    selectIndexKey[currentDim] = item.indexKey;
                }
            });
            saleList.push({
                attrValue: {
                    aliasName: item.value,
                    valueObj: item.index
                },
                letter: item.saleLetter
            });
            Object.assign(dimNameObj, {
                [item.saleLetter]: item.value
            });
            Object.assign(tempObj, {
                saleList,
                dimNameObj
            })
        });
        // -------------------------------
        let saleModeTypeStr = filter.concatSaleRecordKey(saleModeType);
        selectRecordKey.unshift(saleModeTypeStr);
        selectIndexKey.unshift(saleModeTypeStr);
        // 兼容销售属性多模式 在标记的最前面添加一个模式类型标识
        // 因为考虑到销售属性有单模式和多模式两种情况  单模式 @+'type' 多模式 模式类型+'type'
        Object.assign(tempObj, {
            saleRecordKey: selectRecordKey.join(';'),
            saleIndexKey: selectIndexKey.join(';')
        });
        result.push(tempObj);
    }
    return result
}

// 获取页签数据格式
function getTabsData(dataSource) {
    let sort = 0,
        tempTabs = [];
    for (let [key, value] of Object.entries(dataSource)) {
        sort += 1;
        tempTabs.push({
            name: key,
            values: value.map((item) => (item.fieldId)),
            sort: sort
        })
    }
    return tempTabs;
}

// 根据销售属性模式过滤出符合条件的数据
function getDimWithSaleType(dataSource, saleModeType) {
    if (!saleModeType) {
        return dataSource;
    }
    let tempPo = {};
    for (let [key, value] of Object.entries(dataSource)) {
        if (saleModeType.indexOf(key) > -1) {
            tempPo[key] = value;
        }
    }
    return tempPo;
}

function getDimOptions(dataSource, letter) {
    dataSource = dataSource || [];
    let returnData = [];
    dataSource.forEach((item) => {
        if (item.letter === letter) {
            returnData = item.config.options
        }
    });
    return returnData;
}

// 获取店内分类id
function getStoreSortId(dataSource) {
    let storeSortIdList = [];
    dataSource.map(item => {
        let data = item.jmiShopCategoryVo,
            children = item.childShopCategoryVos || [],
            childrenData = children.map(childItem => (childItem.id));
        storeSortIdList.push(data.id, ...childrenData);
    });

    return storeSortIdList;
}
