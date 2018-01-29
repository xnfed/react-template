/**
 * Created by xugaobo on 2017/10/23.
 */
export default function createReducer(initialState, handlers) {
    return (state = initialState, action) => {
        if (handlers.hasOwnProperty(action.type)) {
            return handlers[action.type](state, action);
        }
        return state;
    }
}
