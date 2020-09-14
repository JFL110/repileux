import createApp from '../main/index'
import WeatherExampleModule from './weatherExample/weatherExample'
import HomePage from './homePage'

import "./demo.scss"

createApp({
  logReduxActions: true,
  pages: [HomePage],
  modules: [WeatherExampleModule],
  pageWrappers: (page, additions) =>
    <div className="main">
      <div className="header">
        <h1>{additions.title ? (additions.title + " - ") : ""} <a href="https://github.com/JFL110/repileux">repileux</a> demos</h1>
      </div>
      {page}
    </div>
});