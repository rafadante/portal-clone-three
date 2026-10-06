import { Group, Mesh, PlaneGeometry, MeshBasicMaterial, PerspectiveCamera, Texture, Vector3 } from 'three';
import { PingMarkers, pickPingPoint, validPing } from '../PingMarkers';

test('ping ray hits the nearest visible surface and safely misses empty space', () => {
  const camera = new PerspectiveCamera(60,1,.1,100);
  const group = new Group(), wall = new Mesh(new PlaneGeometry(10,10),new MeshBasicMaterial());
  wall.position.z = -5; group.add(wall);
  const hidden = wall.clone(); hidden.position.z = -2; hidden.visible = false; group.add(hidden);
  expect(pickPingPoint(camera,[group]).z).toBeCloseTo(-4.97);
  expect(pickPingPoint(camera,[])).toBeNull();
});
test('pings synchronize once and expire instead of refreshing on repeated packets', () => {
  let now = 0;
  const localScene = new Group(), remoteScene = new Group();
  const local = new PingMarkers(localScene,0,{texture:new Texture(),now:()=>now});
  const remote = new PingMarkers(remoteScene,1,{texture:new Texture(),now:()=>now});
  local.place(new Vector3(1,2,3));
  const packet = local.snapshot();remote.receive(packet);
  expect(remoteScene.children[0].position.toArray()).toEqual([1,2,3]);
  now = 3500; remote.receive(packet);remote.update();
  expect(remoteScene.children[0].material.opacity).toBeLessThan(1);
  now = 4100;remote.update();local.update();
  expect(remoteScene.children).toHaveLength(0);
  expect(local.snapshot()).toBeNull();
  remote.receive(packet);expect(remoteScene.children).toHaveLength(0);
  local.dispose();remote.dispose();
});
test('new pings replace old markers and clean up on leaving the room', () => {
  const scene = new Group(), markers = new PingMarkers(scene,1,{texture:new Texture()});
  markers.place(new Vector3());markers.place(new Vector3(4,5,6));
  expect(scene.children).toHaveLength(1);
  expect(markers.snapshot().seq).toBe(2);
  markers.dispose();expect(scene.children).toHaveLength(0);
});
test('ping packets reject invalid coordinates, sequences and lifetimes', () => {
  const ping = {seq:1,p:[1,2,3],ttl:4};
  expect(validPing(ping)).toBe(true);expect(validPing(null)).toBe(true);
  expect(validPing({...ping,p:[Infinity,2,3]})).toBe(false);
  expect(validPing({...ping,seq:-1})).toBe(false);
  expect(validPing({...ping,ttl:100})).toBe(false);
});
