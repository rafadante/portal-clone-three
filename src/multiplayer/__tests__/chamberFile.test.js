import JSZip from 'jszip';
import { chamberDocument, readChamberConfig } from '../chamberConfig';
import { parseChamberJSON, readChamberFile, chamberFileName } from '../../chambers/chamberFile';
import { rememberChamber, getLoadedChamber } from '../loadedChamber';

const document = () => chamberDocument(['all','none','#ffffff',false], [{exists:true,position:{x:0,y:0,z:0},rotation:{_x:0,_y:0,_z:0},hasItem:true,itemName:'spawn',item:{isObject3D:true,userData:{player:2}}}], {mode:'multiplayer',portalMode:'independent'});

test('file round-trip preserves cooperative settings and player 2 items', async () => {
  const data=document();
  const result=await readChamberFile({name:'camera.json',text:async()=>JSON.stringify(data)});
  expect(result).toEqual(data);
  expect(readChamberConfig(result)).toMatchObject({mode:'multiplayer',portalMode:'independent'});
  expect(result[1][0].item).toEqual({player:2});
});
test('published chamber ZIP files load their data.json document', async () => {
  const data=document(),zip=new JSZip();zip.file('data.json',JSON.stringify(data));
  const file=await zip.generateAsync({type:'uint8array'});file.name='camera.zip';
  expect(await readChamberFile(file)).toEqual(data);
  const empty=await new JSZip().generateAsync({type:'uint8array'});empty.name='empty.zip';
  await expect(readChamberFile(empty)).rejects.toThrow('não contém');
});
test('invalid files fail before loading and legacy files remain supported', () => {
  expect(()=>parseChamberJSON('{broken')).toThrow('JSON válido');
  expect(()=>parseChamberJSON('{}')).toThrow('câmara válida');
  const legacy=document();legacy[0].pop();
  expect(readChamberConfig(parseChamberJSON('\uFEFF'+JSON.stringify(legacy))).mode).toBe('single');
});
test('downloads use clean names and a saved document independent of runtime mutation', () => {
  expect(chamberFileName('Minha câmara','Rafael')).toBe('Minha câmara_by_Rafael.json');
  expect(chamberFileName('')).toBe('chamber.json');
  expect(chamberFileName('sala/teste.json')).toBe('sala_teste.json');
  const data=document();data[0][4].mode='single';rememberChamber(data);
  data[1].length=0;
  expect(getLoadedChamber()[1]).toHaveLength(1);
});
