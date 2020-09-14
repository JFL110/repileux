import { dispatchPush, createPage } from '../main/index'

export default createPage({
    path: "/",
    component: <div>
        <button onClick={() => dispatchPush("/weather")} >Weather example</button>
    </div>,
    additions: {
        title : "Demos"
    }
})