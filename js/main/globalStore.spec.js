import { getStore, setStore, _clearStoreInTest } from './globalStore'

beforeEach(() => _clearStoreInTest());

test('cannot access from empty', () =>
  expect(() => getStore()).toThrow('Attempt to get store before it has been set.')
)

test('cannot re-set store', () => {
  setStore("abc");
  expect(() => {
    setStore("def");
  }).toThrow('Attempt to overwrite the global store.')
})

test('normal set and get', () => {
  setStore("hjk");
  expect(getStore()).toBe("hjk")
});