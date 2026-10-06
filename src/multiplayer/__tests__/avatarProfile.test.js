import { validAvatar, readAvatar } from '../avatarProfile';

test('avatar network choices accept only bundled bots and hexadecimal colors', () => {
 expect(validAvatar({model:'xbot',color:'#aa22ff'})).toBe(true);
 expect(validAvatar({model:'ybot',color:'#00baca'})).toBe(true);
 expect(validAvatar({model:'../../other',color:'#00baca'})).toBe(false);
 expect(validAvatar({model:'ybot',color:'red'})).toBe(false);
});

test('malformed saved appearance falls back to the default', () => {
 global.localStorage = { getItem: () => '{broken' };
 expect(readAvatar()).toEqual({model:'ybot',color:'#00baca'});
 delete global.localStorage;
});
