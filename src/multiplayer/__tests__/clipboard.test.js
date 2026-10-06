import { copyText } from '../clipboard';
const originalNavigator = Object.getOwnPropertyDescriptor(global, 'navigator');
afterEach(() => { if (originalNavigator) Object.defineProperty(global,'navigator',originalNavigator); else delete global.navigator; delete global.document; });
function setup(clipboard, result) {
 Object.defineProperty(global, 'navigator', { configurable:true, value:{clipboard} });
 const field={style:{},focus:jest.fn(),select:jest.fn(),remove:jest.fn()};
 global.document={ createElement:()=>field, body:{appendChild:jest.fn()},execCommand:jest.fn(()=>result) };
 return field;
}
test('copies the exact room code using the modern clipboard', async () => {
 const writeText=jest.fn().mockResolvedValue(); setup({writeText},false);
 expect(await copyText('ABC123DEF456')).toBe(true);
 expect(writeText).toHaveBeenCalledWith('ABC123DEF456');
});
test('HTTP LAN fallback selects and copies the full invitation', async () => {
 const field=setup(undefined,true);
 expect(await copyText('http://192.168.100.77:3000/?room=ABC123DEF456')).toBe(true);
 expect(field.value).toContain('room=ABC123DEF456'); expect(field.select).toHaveBeenCalled(); expect(field.remove).toHaveBeenCalled();
});
test('reports failure when both clipboard paths fail', async () => {
 setup({writeText:jest.fn().mockRejectedValue(new Error('denied'))},false);
 expect(await copyText('ABC123DEF456')).toBe(false);
});
