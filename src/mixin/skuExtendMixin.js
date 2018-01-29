/**
 * Created by xugaobo on 2017/9/19.
 */
import {EXTEND_TYPE} from '../utils/constants';
// sku扩展属性对应的展示组件
export function getExtendComponents(dataSource, type, skuExtendTabs, status) {
    dataSource = dataSource || [];
    skuExtendTabs = skuExtendTabs || {};
    if (Object.keys(skuExtendTabs).length === 0 && type === EXTEND_TYPE.common) { // 兼容先前老模版
        return dataSource;
    }
    if (Object.keys(skuExtendTabs).length === 0 && type === EXTEND_TYPE.more) { // 兼容先前老模版
        return [];
    }
    return dataSource.filter((item) => {
        if (skuExtendTabs[type]) {
            if (type === EXTEND_TYPE.common && item.formType === 'textarea' && !status) { // 如果为多行文本且类型为common,则过滤掉此字段
                return false;
            }
            return skuExtendTabs[type].indexOf(item.fieldId) > -1
        }
        return false;
    })
}
