import { Scene, PerspectiveCamera, Mesh, PlaneGeometry, ShaderMaterial } from 'three';
import { prewarmPortals } from '../../components/portal/prewarmPortals';
import { getPortalViewMaterial } from '../../components/portal/PortalViewMaterial';

function context(count=2) {
  const originalTarget={}, originalClipping=[];
  const renderer={domElement:{width:800,height:600},clippingPlanes:originalClipping,localClippingEnabled:false,
    getRenderTarget:()=>originalTarget,setRenderTarget:jest.fn(),render:jest.fn(),compileAsync:jest.fn().mockResolvedValue(),initRenderTarget:jest.fn()};
  const shaders=Array.from({length:count},()=>new Mesh(new PlaneGeometry(),new ShaderMaterial()));
  const targets=Array.from({length:count*2},()=>({setSize:jest.fn()}));
  return {renderer,scene:new Scene(),camera:new PerspectiveCamera(),shaders,count,targets,width:.6,height:.1,originalTarget,originalClipping};
}
test('precompiles portal effects, view materials and clipped scene before returning',async()=>{
  const ctx=context();await prewarmPortals(ctx);
  expect(ctx.renderer.compileAsync).toHaveBeenCalledTimes(4);
  const warm=ctx.renderer.compileAsync.mock.calls[0][0];
  expect(warm.children).toHaveLength(4);
  expect(warm.children[0].material).toBe(getPortalViewMaterial(ctx.renderer,0));
  expect(warm.children[1].material).toBe(ctx.shaders[0].material);
  expect(ctx.renderer.initRenderTarget).toHaveBeenCalledTimes(4);
  expect(ctx.targets[0].setSize).toHaveBeenCalledWith(800,600);
  expect(ctx.renderer.clippingPlanes).toBe(ctx.originalClipping);
  expect(ctx.renderer.localClippingEnabled).toBe(false);
  expect(ctx.renderer.setRenderTarget).toHaveBeenLastCalledWith(ctx.originalTarget);
});
test('cooperative warmup includes both additional-light variants and retains real portal materials',async()=>{
  const ctx=context(4);await prewarmPortals(ctx);
  expect(ctx.renderer.compileAsync).toHaveBeenCalledTimes(10);
  expect(getPortalViewMaterial(ctx.renderer,2)).toBe(getPortalViewMaterial(ctx.renderer,2));
  expect(getPortalViewMaterial(ctx.renderer,2)).not.toBe(getPortalViewMaterial(ctx.renderer,3));
});
test('an offscreen rendering failure restores renderer state',async()=>{
  const ctx=context();ctx.renderer.render.mockImplementation(()=>{throw new Error('GPU unavailable');});
  await expect(prewarmPortals(ctx)).rejects.toThrow('GPU unavailable');
  expect(ctx.renderer.clippingPlanes).toBe(ctx.originalClipping);
  expect(ctx.renderer.localClippingEnabled).toBe(false);
  expect(ctx.renderer.setRenderTarget).toHaveBeenLastCalledWith(ctx.originalTarget);
});
