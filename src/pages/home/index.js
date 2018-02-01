import Page from '../page'
import React from 'react';
import {
  Button
} from 'antd';
import connect from '../../utils/connect';

@connect()
export default class Index extends Page {

    constructor(...args) {
        super(...args);
        console.log(this);
    }

    render() {
        return (
          <div className='home'>
          hello world!
            {this.props.example.title}
            <div className='home-btn'>
              <Button type='primary'
                onClick={this.saveSale}>click</Button>
            </div>
            { this.props.children || '' }
          </div>
        )
    }

}
