import React, {PropTypes} from 'react';

export default class Page extends React.Component {
    
    constructor(...args) {
        super(...args)

    }

    componentWillMount() {
    }

    componentDidMount() {
    }

    componentWillUnmount() {
    }

    setTitle(title) {
        document.title = title;
    }
    
}
