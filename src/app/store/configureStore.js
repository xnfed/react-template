import { createStore, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'
import reducer from '../reducers'
import { routerMiddleware } from 'react-router-redux'
import { createLogger } from 'redux-logger'

let middlewares = [thunk]
let MODE = process.env.MODE

if (MODE !== 'production') {
    const logger = createLogger({
        level: 'info',
        logger: console,
        collapsed: true
    })

    middlewares = [...middlewares, logger]
}

export default function configureStore(history, initialState) {
    middlewares = [...middlewares, routerMiddleware(history)]
    const createStoreWithMiddleware = applyMiddleware(...middlewares)(createStore)
    return createStoreWithMiddleware(reducer, initialState)
}
