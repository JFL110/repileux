export default (
    { className = ""
        , style = {} }
) => <div className={"loading-container " + className} style={style}>
        <div>
            <div>
                <div className="loader" />
            </div>
        </div>
    </div>