import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

function mapStateToProps(state) {
    return state
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators(function() {}, dispatch)
    }
}

export default (state) => {
    return (target) => {
        return connect(mapStateToProps, mapDispatchToProps)(target)
    }
}