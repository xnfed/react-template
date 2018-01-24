import request from '../../utils/request'
import * as types from '../constants/ActionTypes'
import { STATIC_API } from '../../utils/constants'

export function fetchSavetemplate( modelId, template ) {
    return (dispatch, getState) => {

        const url = `${STATIC_API}/template/saveViewTemplate`;

        let data = {
            modelId,
            template,
        };

        return request.POST(url,data)
            .then(resp => {
                dispatch(receiveSavetemplate(resp));
                return resp
            })
    }
}

function receiveSavetemplate(savetemplate) {
    return {
        type: types.RECEIVE_SAVE_TEMPLATE,
        savetemplate,
    }
}


