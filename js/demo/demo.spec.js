import '../main/__test__/jest-before-each.js'

/**
 * Test to verify that the demo compiles and starts
 */
test("test compilation", () => {
    expect(document.documentElement).not.toBeNull();
    expect(document.getElementById('root')).not.toBeNull();
    require('./index.js');
})