const React = require('react')
const ReactDOM = require('react-dom')

const PlivoSipStore = require('./stores/plivo_sip')

PlivoSipLogin = require('./comp/plivo_sip_login')
PlivoSipCall = require('./comp/plivo_sip_call')

const render_root = function (props) {
  const root_component = React.createElement(
    props.creds ?  PlivoSipCall : PlivoSipLogin,
    props)
  ReactDOM.render(root_component, document.getElementById('app'))
}

render_root(PlivoSipStore.getState())

PlivoSipStore.listen(render_root)
