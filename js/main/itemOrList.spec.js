import itemOrList from './itemOrList';

test("item in = singleton list out", () => { 
    expect(itemOrList("a")).toStrictEqual(["a"])
});

test("list in = list out", () => { 
    expect(itemOrList(["a"])).toStrictEqual(["a"])
});

test("several item list in = list out", () => { 
    expect(itemOrList(["a", "b", "c"])).toStrictEqual(["a", "b", "c"])
});

test("null in = singleton list of null out", () => { 
    expect(itemOrList(null)).toStrictEqual([null])
});

test("undefined in = singleton list of undefined out", () => { 
    expect(itemOrList(undefined)).toStrictEqual([undefined])
});