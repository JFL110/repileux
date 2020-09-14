import createApp from '../main/index'
import WeatherExampleModule from './weatherExample/weatherExample'
import HomePage from './homePage'

import "./demo.scss"

createApp({
  logReduxActions: true,
  pages: [HomePage],
  modules: [WeatherExampleModule],
  pageWrappers: (page, additions) => <div className="main">{additions.title && <h1>{additions.title}</h1>}{page}</div>
});