import { push } from 'connected-react-router'
import { getStore } from './globalStore'

const dispatchPush = (to) => {
    getStore().dispatch(push(to));
}

export default dispatchPush;