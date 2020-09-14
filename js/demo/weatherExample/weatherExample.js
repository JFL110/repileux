import React from 'react'
import { createModule, createPage, connectToOpState, createEndpoint, createNetOpState, dispatchPush } from '../../main/index'

import './weather.scss'

const locations = {
    'London': '2643743',
    'Manchester': '3333169',
    'Cambridge': '2653941',
    'Edinburgh': '3333229',
    'Cardiff': '2653822',
    'Made Up Place': 'x',

}
const appid = '77bb08ccdf5b125a7a6645f7a5e74062'

// Web state - current weather
const weatherState = createNetOpState({
    name: "weather",
    isSingleton: false,
    persistInLocalStorage: true,
    nullRequestBody: true,
    persistenceExpirationMs : 24 * 60 * 60 * 1000,
    endpoint: createEndpoint({
        uri: location => `https://icga465pti.execute-api.us-east-1.amazonaws.com/main-2?http://api.openweathermap.org/data/2.5/weather?id=${location}&units=metric&appid=${appid}`
    })
});

// Page components
const City = ({
    cityWeather,
    name,
    locationId }) => <div className="weather-card">
        <h2>{name}</h2>
        {cityWeather?.wasError() ? "Error fetching weather" : ((cityWeather?.value?.main.temp ?? "?") + " \u00b0C")}
        <br />
        <button disabled={cityWeather?.isInProgress()} onClick={() => weatherState.calculate(locationId)} >
            {cityWeather?.isInProgress() ? "Loading..." : "Load"}
        </button>
    </div>


const WeatherPage = connectToOpState([weatherState],
    ({
        weather
    }) => <React.Fragment>
            <p>
                Demo of using NetOpState to manage communication with <a href="https://openweathermap.org/">openweathermap.org</a> to get the current temperature in a number of UK cities.
            </p>
            <div className="button-row">
                <button onClick={weatherState.clearAll} >Clear all</button>
                <button className="back-button" onClick={() => dispatchPush("./")} >Back</button>
            </div>
            <div className="weather-cards">
                {[...Object.entries(locations)]
                    .map(([name, id]) => <City locationId={id} name={name} key={id} cityWeather={weather.find(w => w.args == id)} />)}
            </div>
            <div className="json-window">weatherState:{JSON.stringify(weather, null, 2)}</div>
        </React.Fragment>)

// Page & Module
export default createModule({
    name: "simpleWebStateModule",
    pages: createPage({
        name: 'weather-page',
        path: '/',
        component: <WeatherPage />,
        additions: {
            title: "Weather"
        }
    }),
    urlPrefix: "weather/",
})