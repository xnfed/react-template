import * as types from '../constants/ActionTypes'
import createReducer from './createReducer';

const initialState = {
    title: '',
};

function updateState(oldObject, ...newValues) {
    return Object.assign({}, oldObject, ...newValues);
}

export default createReducer(initialState, {
    [types.EXAMPLE](state, action) {
        return updateState(state, {
          title: action.title
        });
    }
});
