import ReactDom from 'react-dom'
import { Router, Route, IndexRoute, hashHistory } from 'react-router'
import { Provider } from 'react-redux'
import React, {PropTypes} from 'react';
import { syncHistoryWithStore } from 'react-router-redux'

import './styles/index.less';

import configureStore from './app/store/configureStore'

const index = (location, callback) => {
    require.ensure([], require => {
        callback(null, require('./pages/index/index').default)
    }, 'index')
};

const routes = (history) => (
  <Router history={history}>
    <Route path='/' getComponent={index}>
      <IndexRoute getIndexRoute={index} />
    </Route>
  </Router>
);

const store = configureStore(hashHistory);
const history = syncHistoryWithStore(hashHistory, store);

ReactDom.render(
  <Provider store={store}>
    { routes(history) }
  </Provider>, document.getElementById('root')
);
