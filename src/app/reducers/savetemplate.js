import * as types from '../constants/ActionTypes'
import createReducer from './createReducer';
const initialState = {
    savetemplate: '',
};

export default createReducer(initialState, {
    [types.RECEIVE_SAVE_TEMPLATE](state, action) {
        return Object.assign({}, state, {
            savetemplate: action.savetemplate
        })
    }
})
