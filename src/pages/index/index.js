import Page from '../page'
import React, {PropTypes} from 'react';
import {
  Button
} from 'antd';
import connect from '../../utils/connect';

@connect()
export default class Index extends Page {

    constructor(...args) {
        super(...args)
    }

    static contextTypes = {
        router: React.PropTypes.object
    };

    saveSale =() => {
      this.props.actions.test();
    };

    render() {
        return (
          <div className="home">
            {this.props.example.title}
            <div className="home-btn">
              <Button type="primary"
                      onClick={this.saveSale}>click</Button>
            </div>
              { this.props.children || '' }
            </div>
        )
    }

}
