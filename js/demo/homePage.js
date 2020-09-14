import { dispatchPush, createPage } from '../main/index'

export default createPage({
    path: "/",
    component: <div>
        <div className="text-margin">
            View the source of these demos <a href="https://github.com/JFL110/repileux/blob/master/js/demo/weatherExample/weatherExample.js">on Github</a>.
        </div>
        <button onClick={() => dispatchPush("/weather")} >Weather example</button>
    </div>,
    meta : {
        title : 'repileux demos'
    }
})