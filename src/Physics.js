import * as CANNON from 'cannon';

// return the cannon world
// Setup our world
let world = new CANNON.World();
world.quatNormalizeSkip = 0;
world.quatNormalizeFast = false;

var solver = new CANNON.GSSolver();

world.defaultContactMaterial.contactEquationStiffness = 1e9;
world.defaultContactMaterial.contactEquationRelaxation = 4;

solver.iterations = 10;
solver.tolerance = 0.1;
let split = true;
if (split)
    world.solver = new CANNON.SplitSolver(solver);
else
    world.solver = solver;

world.gravity.set(0, -9.8, 0);
//world.allowSleep = true;
world.broadphase = new CANNON.NaiveBroadphase();

window.CANNON_WORLD = world;