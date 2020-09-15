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

const appid = '77bb08ccdf5b125a7a6645f7a5e74062' // Open to abuse - be nice

// Web state - current weather
const weatherState = createNetOpState({
    name: "weather",
    isSingleton: false,
    persistInLocalStorage: true,
    nullRequestBody: true,
    persistenceExpirationMs: 24 * 60 * 60 * 1000,
    endpoint: createEndpoint({
        uri: location => `https://icga465pti.execute-api.us-east-1.amazonaws.com/main-2?http://api.openweathermap.org/data/2.5/weather?id=${location}&units=metric&appid=${appid}`
    })
});

// Page components
const City = ({
    cityWeather,
    name,
    locationId }) => {

    const temperature = cityWeather?.wasError() ? "Error fetching weather" : ((cityWeather?.value?.main.temp ?? "?") + " \u00b0C");
    const buttonText = cityWeather?.isInProgress() ? "Loading..." : "Load";

    return <div className="weather-card">
        <h2>{name}</h2>
        {temperature}
        <br />
        <button disabled={cityWeather?.isInProgress()} onClick={() => weatherState.calculate(locationId)} >
            {buttonText}
        </button>
    </div>

}

const WeatherPage = connectToOpState([weatherState],
    ({
        weather
    }) => <React.Fragment>
            <p>
                Using NetOpState to manage communication with <a href="https://openweathermap.org/">openweathermap.org</a> to get the current temperature in several UK cities.
            </p>
            <p>
                Loading a city's data triggers a fetch to the API. The component is informed when the fetch is in progress and if it failed. Concurrent fetches for the same arguments are disallowed.
            </p>
            <p>
                All successful fetches are saved in local storage, so the same data is shown after re-navigating to the page. Saved data is set to expire after 24 hours, after which it will not be reloaded.
            </p>
            <p>
                View the source of this demo <a href="https://github.com/JFL110/repileux/blob/master/js/demo/weatherExample/weatherExample.js">on Github</a>.
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
        paths: '/',
        component: <WeatherPage />,
        additions: {
            title: "Weather"
        },
        meta: {
            title: 'repileux demos - weather'
        }
    }),
    urlPrefix: "weather/",

})