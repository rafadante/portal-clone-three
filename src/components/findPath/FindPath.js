import {
    Group,
    PlaneGeometry,
    MeshBasicMaterial,
    DoubleSide,
    Mesh,
    Object3D,
    Vector3,
    CircleGeometry,
    Matrix4
} from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import {
    GLOBALS
} from '../../Globals.js';

var visited = {};
var shapes = [];
var scene = new Group();
var dgraph,lineFollow,count;
var isDrawStart = false;

function findPath(ini, target, found) {

    var nodes = [];

    //
    const geometryCheck = new PlaneGeometry(0.5, 0.5);
    const materialCheck = new MeshBasicMaterial({
        color: 0x03e8fc,
        side: DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -7,
        map: GLOBALS.IMG_CLOSE,
    });
    const plane = new Mesh(geometryCheck, materialCheck);
    GLOBALS.SCENE_CHILDREN.add(plane);

    var side = true;

    if (GLOBALS.PLANE_USER_DATA[found.instanceId].side == "up") {
        plane.rotation.x = Math.PI / 2;
        plane.position.set(found.normal.z * 1.3 + (target.x), (target.y), found.normal.x * 1.3 + (target.z))
    } else if (GLOBALS.PLANE_USER_DATA[found.instanceId].side == "down") {
        plane.rotation.x = -Math.PI / 2;
        plane.position.set((target.x), (target.y), (target.z))
        side = false;
    } else
        plane.position.set(found.normal.z * 1.3 + (target.x), (target.y), found.normal.x * 1.3 + (target.z))

    GLOBALS.CONNECTING = false;

    GLOBALS.MATERIAL_PORTAL_EDITOR.opacity = 1;
    GLOBALS.MATERIAL_NON_PORTAL_EDITOR.opacity = 1;
    GLOBALS.MATERIAL_PORTAL_EDITOR.transparent = false;
    GLOBALS.MATERIAL_NON_PORTAL_EDITOR.transparent = false;

    isDrawStart = false;
    GLOBALS.SCENE_CHILDREN.remove(lineFollow);
    count = 0;

    GLOBALS.SELECTED_FOR_CONNECTION.check = plane;

    for (var j = 0; j < GLOBALS.PLANE_USER_DATA.length; j++) {
        if (GLOBALS.PLANE_USER_DATA[j].exists) {
            nodes.push(GLOBALS.PLANE_USER_DATA[j]);
        }
    }

    var dmap = {};

    for (var j = 0; j < nodes.length; j++) { //making the map for the shapes
        var obj = new Object3D;
        obj.position.copy(nodes[j].position);
        obj.rotation.copy(nodes[j].rotation);
        obj.name = nodes[j].name;
        scene.add(obj)
        shapes.push(obj);
    }

    for (var i = 0; i < shapes.length; i++) { //making the map for the shapes
        dmap[shapes[i].id] = {};

        for (var j = 1; j < shapes.length; j++) {
            var d = dist(shapes[i].position, shapes[j].position);
            if (shapes[i].id != shapes[j].id && d <= 2) {
                dmap[shapes[i].id][shapes[j].id] = d;
            }
        }
    }

    dgraph = new Graph(dmap);

    path2(dgraph,
        scene.getObjectByName(ini.x + '/' + ini.y + '/' + ini.z).id,
        scene.getObjectByName(target.x + '/' + target.y + '/' + target.z).id, side)
}

function path2(dgraph, start, end, side) {

    var shortestpath = dgraph.findShortestPath(start, end);

    var d = 0;
    var pathPoints = [];
    var rotPoints = [];
    var direction;
    var points = [];
    var nodesPos = [];
    var nodesRot = [];

    for (var i = 0; i < shortestpath.length - 1; i++) {
        var from = shortestpath[i];
        if (!(shortestpath[i] in visited)) {
            visited[shortestpath[i]] = true;
        }
        var to = shortestpath[i + 1];
        if (!(shortestpath[i + 1] in visited)) {
            visited[shortestpath[i + 1]] = true;
        }
        var fromObj = scene.getObjectById(parseInt(from), true);
        var toObj = scene.getObjectById(parseInt(to), true);
        d += dist(fromObj.position, toObj.position);

        points.push(fromObj.position)
        rotPoints.push(fromObj.rotation)

        if (i >= shortestpath.length - 2) {
            points.push(toObj.position)
            rotPoints.push(toObj.rotation)
        }
    }

    pathPoints.push(points[0])

    for (var j = 1; j < points.length; j++) {

        if (points[j - 1].distanceTo(points[j]) != 2) {

            var dir = new Vector3(); // create once an reuse it
            dir.subVectors(points[j], points[j - 1]).normalize();

            if (direction.z != 0) {
                if (dir.round().z == 0) {
                    direction.x = direction.z;
                    direction.z = 0;
                }
            }

            var val = points[j - 1].clone();
            val.x -= direction.round().x;
            val.y -= direction.round().y;
            val.z -= direction.round().z;

            pathPoints.push(val)

            rotPoints.push(fromObj.rotation)
            pathPoints.push(points[j])
        } else {
            pathPoints.push(points[j])
        }

        var direction = new Vector3(); // create once an reuse it
        direction.subVectors(pathPoints[j - 1], points[j]).normalize();
    }

    //
    var dir = new Vector3(); // create once an reuse it
    dir.subVectors(pathPoints[pathPoints.length - 2], pathPoints[pathPoints.length - 1]).normalize();

    if (side) {
        pathPoints[pathPoints.length - 1].x += dir.x;
        pathPoints[pathPoints.length - 1].y += dir.y;
        pathPoints[pathPoints.length - 1].z += dir.z;
    }

    // Calculate total length of the path
    let totalLength = 0;
    for (let i = 0; i < pathPoints.length - 1; i++) {
        totalLength += pathPoints[i].distanceTo(pathPoints[i + 1]);
    }

    // Number of circles to create
    const numberOfCircles = totalLength * 4;

    // Create circles evenly spaced along the path
    const circleGeometry = new CircleGeometry(0.05, 32);
    const circleMaterial = new MeshBasicMaterial({
        side: 2,
        color: 0x03e8fc,
        emissiveIntensity: 100,
        polygonOffset: true,
        polygonOffsetFactor: -5,
    });

    for (let i = 0; i < numberOfCircles; i++) {
        const targetDistance = (i / (numberOfCircles - 1)) * totalLength;
        let currentDistance = 0;

        for (let j = 0; j < pathPoints.length - 1; j++) {


            const segmentLength = pathPoints[j].distanceTo(pathPoints[j + 1]);

            if (currentDistance + segmentLength >= targetDistance) {
                const t = (targetDistance - currentDistance) / segmentLength;
                const point = new Vector3().lerpVectors(pathPoints[j], pathPoints[j + 1], t);

                nodesPos.push(point);
                nodesRot.push(rotPoints[j]);

                break;
            }

            currentDistance += segmentLength;
        }
    }

    const matrix = new Matrix4();
    const geometries = [];

    for (let j = 0; j < nodesPos.length; j++) {

        var dummy = new Object3D();
        dummy.position.copy(nodesPos[j]);
        dummy.rotation.copy(nodesRot[j])
        dummy.updateMatrix();

        matrix.compose(dummy.position, dummy.quaternion, dummy.scale);

        const instanceGeometry = circleGeometry.clone();
        instanceGeometry.applyMatrix4(matrix);

        geometries.push(instanceGeometry);

    }

    const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries);

    var circlePAth = new Mesh(mergedGeometry, circleMaterial);

    GLOBALS.SCENE_CHILDREN.add(circlePAth);
    GLOBALS.SELECTED_FOR_CONNECTION.circle = circlePAth;
}

function dist(t0, t1) {
    var deltaX = t1.x - t0.x;
    var deltaY = t1.y - t0.y;
    var deltaZ = t1.z - t0.z;

    var distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);

    return distance;
}

//graph.js
//data structure to hold a weighted graph
//based off of http://graphdracula.net code but without jquery

var Graph = (function (undefined) {

    var extractKeys = function (obj) {
        var keys = [],
            key;
        for (key in obj) {
            Object.prototype.hasOwnProperty.call(obj, key) && keys.push(key);
        }
        return keys;
    }

    var sorter = function (a, b) {
        return parseFloat(a) - parseFloat(b);
    }

    var findPaths = function (map, start, end, infinity) {
        infinity = infinity || Infinity;
        this.start = start;
        this.end = end;

        var costs = {},
            open = {
                '0': [start]
            },
            predecessors = {},
            keys;

        var addToOpen = function (cost, vertex) {
            var key = "" + cost;
            if (!open[key]) open[key] = [];
            open[key].push(vertex);
        }

        costs[start] = 0;

        while (open) {
            if (!(keys = extractKeys(open)).length) break;

            keys.sort(sorter);

            var key = keys[0],
                bucket = open[key],
                node = bucket.shift(),
                currentCost = parseFloat(key),
                adjacentNodes = map[node] || {};

            if (!bucket.length) delete open[key];

            for (var vertex in adjacentNodes) {
                if (Object.prototype.hasOwnProperty.call(adjacentNodes, vertex)) {
                    var cost = adjacentNodes[vertex],
                        totalCost = cost + currentCost,
                        vertexCost = costs[vertex];

                    if ((vertexCost === undefined) || (vertexCost > totalCost)) {
                        costs[vertex] = totalCost;
                        addToOpen(totalCost, vertex);
                        predecessors[vertex] = node;
                    }
                }
            }
        }

        if (costs[end] === undefined) {
            return null;
        } else {
            return predecessors;
        }

    }

    var extractShortest = function (predecessors, end) {
        var nodes = [],
            u = end;

        while (u) {
            nodes.push(u);
            u = predecessors[u];
        }

        nodes.reverse();
        return nodes;
    }

    var findShortestPath = function (map, nodes) {
        var start = nodes.shift(),
            end,
            predecessors,
            path = [],
            shortest;

        while (nodes.length) {
            end = nodes.shift();
            predecessors = new findPaths(map, start, end);

            if (predecessors) {
                shortest = extractShortest(predecessors, end);
                if (nodes.length) {
                    path.push.apply(path, shortest.slice(0, -1));
                } else {
                    return path.concat(shortest);
                }
            } else {
                return null;
            }

            start = end;
        }
    }

    var toArray = function (list, offset) {
        try {
            return Array.prototype.slice.call(list, offset);
        } catch (e) {
            var a = [];
            for (var i = offset || 0, l = list.length; i < l; ++i) {
                a.push(list[i]);
            }
            return a;
        }
    }

    var Graph = function (map) {
        this.map = map;
        this.keys = Object.keys(map);
        var values = this.keys.map(function (v) {
            return map[v];
        });
        var connectors = [];
        for (var i = 0; i < this.keys.length; i++) {
            var vkeys = Object.keys(values[i]);
            var weights = vkeys.map(function (vv) {
                return values[i][vv].toString();
            });
            for (var j = 0; j < vkeys.length; j++) {
                connectors.push([this.keys[i], vkeys[j], weights[j]]);
            }
        }
        this.connectors = connectors;
    }

    Graph.prototype.findShortestPath = function (start, end) {
        if (Object.prototype.toString.call(start) === '[object Array]') {
            return findShortestPath(this.map, start);
        } else if (arguments.length === 2) {
            return findShortestPath(this.map, [start, end]);
        } else {
            return findShortestPath(this.map, toArray(arguments));
        }
    }

    Graph.prototype.map = function () {
        return this.map;
    }

    Graph.prototype.nodes = function () {
        return this.keys;
    }
    Graph.prototype.edges = function () {
        return this.connectors;

    }
    return Graph;

})();

export{
    findPath
}