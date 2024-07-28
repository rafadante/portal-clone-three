var INPUT = {
    fwdValue: 0,
    bkdValue: 0,
    rgtValue: 0,
    lftValue: 0,
    shouldJump: false,
    headBobActive: false,
    headBobTimer: 0,
    controller: {
        "KeyE": {
            pressed: false
        },
        "KeyW": {
            pressed: false
        },
        "KeyS": {
            pressed: false
        },
        "KeyA": {
            pressed: false
        },
        "KeyD": {
            pressed: false
        },
        "Space": {
            pressed: false
        },
    },
    blocked_bottom: false,
    blocked_top: false,
    crouched: false

}

export {INPUT}