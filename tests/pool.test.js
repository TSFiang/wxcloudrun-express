/**
 * Pool 对象池测试
 */
const { loadAllModules } = require('./helpers');

beforeAll(() => {
  loadAllModules();
});

describe('Pool 对象池', () => {
  let pool;

  beforeEach(() => {
    pool = new Pool();
  });

  test('新建池为空', () => {
    expect(pool.size('test')).toBe(0);
  });

  test('get 池空时调用工厂函数', () => {
    const factory = jest.fn(() => ({ id: 1 }));
    const obj = pool.get('platforms', factory);

    expect(factory).toHaveBeenCalledTimes(1);
    expect(obj).toEqual({ id: 1 });
  });

  test('get 池有对象时直接取出', () => {
    pool.put('test', { id: 42 });
    const factory = jest.fn(() => ({ id: 0 }));
    const obj = pool.get('test', factory);

    expect(factory).not.toHaveBeenCalled();
    expect(obj).toEqual({ id: 42 });
  });

  test('put 回收对象后 size 增加', () => {
    pool.put('test', { a: 1 });
    pool.put('test', { a: 2 });
    expect(pool.size('test')).toBe(2);
  });

  test('put 调用 reset 函数', () => {
    const reset = jest.fn((obj) => { obj.x = 0; });
    pool.put('test', { x: 100 }, reset);

    expect(reset).toHaveBeenCalledTimes(1);
  });

  test('putAll 批量回收', () => {
    const arr = [{ a: 1 }, { a: 2 }, { a: 3 }];
    pool.putAll('test', arr);

    expect(arr).toHaveLength(0);
    expect(pool.size('test')).toBe(3);
  });

  test('putAll 调用 reset 函数', () => {
    const reset = jest.fn();
    pool.putAll('test', [{ a: 1 }, { a: 2 }], reset);

    expect(reset).toHaveBeenCalledTimes(2);
  });

  test('get/put 循环复用', () => {
    const factory = jest.fn(() => ({ x: 0, y: 0 }));

    // 创建并回收
    const obj1 = pool.get('particle', factory);
    obj1.x = 100;
    pool.put('particle', obj1);

    // 再次获取应该是同一个对象
    const obj2 = pool.get('particle', factory);
    expect(factory).toHaveBeenCalledTimes(1); // 只调用了一次
    expect(obj2).toBe(obj1); // 同一个引用
  });

  test('clear 清空指定池', () => {
    pool.put('a', { x: 1 });
    pool.put('b', { x: 2 });
    pool.clear('a');

    expect(pool.size('a')).toBe(0);
    expect(pool.size('b')).toBe(1);
  });

  test('clear 无参数清空所有池', () => {
    pool.put('a', { x: 1 });
    pool.put('b', { x: 2 });
    pool.clear();

    expect(pool.size('a')).toBe(0);
    expect(pool.size('b')).toBe(0);
  });

  test('LIFO 顺序（后进先出）', () => {
    pool.put('test', { id: 1 });
    pool.put('test', { id: 2 });
    pool.put('test', { id: 3 });

    expect(pool.get('test', () => ({})).id).toBe(3);
    expect(pool.get('test', () => ({})).id).toBe(2);
    expect(pool.get('test', () => ({})).id).toBe(1);
  });

  test('不同池名称互相独立', () => {
    pool.put('platforms', { type: 'platform' });
    pool.put('particles', { type: 'particle' });

    expect(pool.size('platforms')).toBe(1);
    expect(pool.size('particles')).toBe(1);
  });
});
