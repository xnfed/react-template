import ReactDom from 'react-dom'
import { Router, Route, IndexRoute, hashHistory } from 'react-router'
import { Provider } from 'react-redux'
import React from 'react';
import { syncHistoryWithStore } from 'react-router-redux'

import './styles';

import configureStore from './app/store/configureStore'

const Home = (location, callback) => {
    require.ensure([], require => {
        callback(null, require('./pages/home/index').default)
    }, 'home')
};

const routes = (history) => (
  <Router history={history}>
    <Route path='/' getComponent={Home}>
      <IndexRoute getIndexRoute={Home} />
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
