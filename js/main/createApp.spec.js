import createApp, { dispatchPush, createPage } from './index'
import './__test__/jest-before-each.js'

test("verify root element", () => {
    expect(document.documentElement).not.toBeNull();
    expect(document.getElementById('root')).not.toBeNull();
})

test("simple empty app", () => {
    const app = createApp({});
    expect(app.history).not.toBeNull();
    expect(app.getStore()).not.toBeNull();
})

test("default 404", () => {
    // Given
    createApp({});

    // When
    dispatchPush("./non-page");

    // Then
    expect(document.getElementById('root').innerHTML).toBe("Unknown page")
})

test("custom root 404", () => {
    // Given
    const mock404OnLoad = jest.fn(() => { });

    createApp({
        pages: createPage({
            component: "home",
            path: "/"
        }),
        fourOFourPage: createPage({
            is404: true,
            component: "custom 404 page",
            onLoad: mock404OnLoad
        })
    });

    // 
    expect(document.getElementById('root').innerHTML).toBe("home");

    // When
    dispatchPush("./non-page");

    // Then
    expect(document.getElementById('root').innerHTML).toBe("custom 404 page");
    expect(mock404OnLoad).toHaveBeenCalledTimes(1);
})