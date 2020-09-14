import valueOrCall from './valueOrCall';

test("value in = value out", () => { 
    expect(valueOrCall("a")).toBe("a")
});

test("function in = value out", () => { 
    expect(valueOrCall(() => "a")).toBe("a")
});

test("null in = null out", () => { 
    expect(valueOrCall(null)).toBe(null)
});