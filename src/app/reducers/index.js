import { combineReducers } from 'redux'
import { routerReducer } from 'react-router-redux'
import savetemplate from './savetemplate'
import savedtemplate from './savedtemplate'
import addproduct from './addproduct'

const rootReducer = combineReducers({
    savetemplate,
    savedtemplate,
    addproduct,
    routing: routerReducer,
});

export default rootReducer
