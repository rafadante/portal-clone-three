import { Euler, PerspectiveCamera, Quaternion, Vector3 } from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as CANNON from 'cannon';
import { GLOBALS } from '../../Globals.js';
import { INPUT } from './index.js';

// Eye height above the physics body center, matching the local player (+0.3).
const EYE_HEIGHT = 0.3;
// Player model is drawn 0.6 below the body center, matching PLAYER_MODEL.
const MODEL_OFFSET = 0.6;
const SPEED_FORCE = 1100;

let hint;

function setHint(text) {
    if (!hint) {
        hint = document.createElement('div');
        hint.id = 'active-player-hint';
        hint.style.cssText = 'position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:9999;' +
            'padding:6px 14px;border-radius:999px;background:rgba(0,0,0,.65);color:#fff;' +
            'font:600 12px/1.2 system-ui,sans-serif;pointer-events:none;letter-spacing:.04em;' +
            'transition:opacity .2s ease;';
        document.body.appendChild(hint);
    }
    hint.textContent = text || '';
    hint.style.opacity = text ? '1' : '0';
}

// A locally simulated player 2 used to validate coop cameras without a real
// partner. It shares the same keys as the local player: press P to take over
// player 2 (WASD + mouse), press P again to return. When an online room exists,
// P instead becomes a view-only switch to the remote avatar's camera.
const SecondPlayer = {
    body: null,
    camera: null,
    avatar: null,
    active: false,
    yaw: 0,
    pitch: 0,
    _hint: null,

    remoteAvailable() {
        return Boolean(GLOBALS.MULTIPLAYER && GLOBALS.MULTIPLAYER.remote && GLOBALS.MULTIPLAYER.avatar);
    },

    toggle() {
        if (!GLOBALS.FPS_MODE || GLOBALS.PAUSED) return;
        if (GLOBALS.MULTIPLAYER) {
            if (!this.remoteAvailable()) return;
            GLOBALS.VIEW_REMOTE = !GLOBALS.VIEW_REMOTE;
            this.active = false;
            return;
        }
        this.ensure();
        this.active = !this.active;
        if (this.active) {
            this.yaw = GLOBALS.MAIN_CAMERA.rotation.y;
            this.pitch = GLOBALS.MAIN_CAMERA.rotation.x;
        }
    },

    ensure() {
        if (this.camera) { this.tryAvatar(); return; }
        const source = GLOBALS.MAIN_CAMERA;
        this.camera = new PerspectiveCamera(source.fov, source.aspect, source.near, 1000);
        this.camera.rotation.order = 'YXZ';
        const shape = new CANNON.Box(new CANNON.Vec3(0.5 / 2, 2 / 3.2, 0.5 / 2));
        const body = new CANNON.Body({ mass: 50 });
        body.addShape(shape);
        body.allowSleep = false;
        body.linearDamping = 0.999;
        body.angularDamping = 1;
        body.name = 'player2';
        body.inJump = true;
        body.collisionFilterGroup = GLOBALS.CGROUP_PLAYER;
        body.collisionFilterMask = GLOBALS.CGROUP_ALL;
        const forward = this.forwardVector();
        const p = GLOBALS.PLAYER.position;
        body.position.set(p.x + forward.x * 2.5, p.y + 0.5, p.z + forward.z * 2.5);
        GLOBALS.CANNON_WORLD.addBody(body);
        this.body = body;
        this.yaw = GLOBALS.MAIN_CAMERA.rotation.y;
        this.pitch = GLOBALS.MAIN_CAMERA.rotation.x;
        this.tryAvatar();
    },

    forwardVector() {
        const forward = new Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
        if (forward.lengthSq() < 1e-6) forward.set(0, 0, -1);
        return forward.normalize();
    },

    tryAvatar() {
        if (this.avatar || !GLOBALS.PLAYER_MODEL || !GLOBALS.SCENE_FPS) return;
        const avatar = clone(GLOBALS.PLAYER_MODEL);
        avatar.traverse(object => {
            if (object.isMesh) {
                const copy = material => {
                    const m = material.clone();
                    m.clippingPlanes = [];
                    m.visible = true;
                    m.opacity = 1;
                    m.colorWrite = true;
                    m.depthWrite = true;
                    return m;
                };
                object.material = Array.isArray(object.material) ? object.material.map(copy) : copy(object.material);
            }
        });
        avatar.visible = false;
        GLOBALS.SCENE_FPS.add(avatar);
        this.avatar = avatar;
    },

    onMouse(movementX, movementY) {
        if (!this.active) return;
        this.yaw -= movementX / 1000;
        this.pitch -= movementY / 1000;
        const limit = Math.PI / 2 - 0.01;
        this.pitch = Math.max(-limit, Math.min(limit, this.pitch));
    },

    tickInput(deltaTime) {
        if (!this.active || !this.body || GLOBALS.PAUSED) return;
        const body = this.body;
        const forward = this.forwardVector();
        const left = new Vector3(0, 1, 0).cross(forward).normalize();
        const right = left.clone().negate();
        const backward = forward.clone().negate();
        const f = SPEED_FORCE * body.mass * deltaTime * (GLOBALS.SPEED || 1);
        const moves = [['KeyW', forward], ['KeyS', backward], ['KeyA', left], ['KeyD', right]];
        for (const [code, direction] of moves) {
            if (INPUT.controller[code] && INPUT.controller[code].pressed) {
                body.applyForce(direction.clone().multiplyScalar(f), body.position);
            }
        }
        if (INPUT.controller['Space'] && INPUT.controller['Space'].pressed && Math.abs(body.velocity.y) < 1) {
            body.applyImpulse(new CANNON.Vec3(0, 200, 0), body.position);
        }
    },

    tickView() {
        if (GLOBALS.VIEW_REMOTE && this.remoteAvailable()) {
            const { avatar, remote } = GLOBALS.MULTIPLAYER;
            GLOBALS.REMOTE_CAMERA.position.set(avatar.position.x, avatar.position.y + MODEL_OFFSET + EYE_HEIGHT, avatar.position.z);
            if (Array.isArray(remote.cq)) GLOBALS.REMOTE_CAMERA.quaternion.fromArray(remote.cq);
            else GLOBALS.REMOTE_CAMERA.quaternion.copy(avatar.quaternion);
            GLOBALS.REMOTE_CAMERA.aspect = GLOBALS.MAIN_CAMERA.aspect;
            GLOBALS.REMOTE_CAMERA.updateProjectionMatrix();
        }
        if (this.body) {
            this.camera.position.set(this.body.position.x, this.body.position.y + EYE_HEIGHT, this.body.position.z);
            this.camera.rotation.set(this.pitch, this.yaw, 0);
            this.camera.aspect = GLOBALS.MAIN_CAMERA.aspect;
            this.camera.updateProjectionMatrix();
            if (this.avatar) {
                this.avatar.position.set(this.body.position.x, this.body.position.y - MODEL_OFFSET, this.body.position.z);
                this.avatar.quaternion.setFromEuler(new Euler(0, this.yaw, 0));
                this.avatar.quaternion.multiply(new Quaternion(0, 50, 0)).normalize();
                this.avatar.visible = Boolean(GLOBALS.FPS_MODE) && !this.active;
            }
        }
        const label = this.active ? 'simulated' : (GLOBALS.VIEW_REMOTE ? 'remote' : '');
        if (label !== this._hint) {
            this._hint = label;
            setHint(label === 'simulated'
                ? 'PLAYER 2 VIEW · WASD move · mouse look · press P to switch back'
                : label === 'remote'
                    ? 'PLAYER 2 VIEW (remote) · press P to switch back'
                    : '');
        }
        GLOBALS.ACTIVE_CAMERA = (GLOBALS.VIEW_REMOTE && this.remoteAvailable())
            ? GLOBALS.REMOTE_CAMERA
            : this.active ? this.camera : GLOBALS.MAIN_CAMERA;
    },
};

GLOBALS.SECOND_PLAYER = SecondPlayer;

document.addEventListener('keydown', event => {
    if (event.code !== 'KeyP' || event.repeat) return;
    if (!GLOBALS.FPS_MODE || GLOBALS.PAUSED) return;
    event.preventDefault();
    SecondPlayer.toggle();
});

document.body.addEventListener('mousemove', event => {
    if (document.pointerLockElement !== document.body || GLOBALS.PAUSED) return;
    SecondPlayer.onMouse(event.movementX, event.movementY);
});

export { SecondPlayer };
