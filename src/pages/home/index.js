import Page from '../page'
import React from 'react';
import {
  Button
} from 'antd';
import connect from '../../utils/connect';

@connect()
export default class Home extends Page {

    constructor(...args) {
        super(...args);
        this.test = this.test.bind(this);
    }

    test() {
        this.props.actions.test();
    }

    render() {
        return (
          <div className='home'>
          hello world!
            {this.props.example.title}
            <div className='home-btn'>
              <Button type='primary'
                onClick={this.test}>click</Button>
            </div>
            { this.props.children || '' }
          </div>
        )
    }

}
