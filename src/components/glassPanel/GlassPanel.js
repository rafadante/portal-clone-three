import {
    Vector3,
    Group,
    PlaneGeometry,
    MeshBasicMaterial,
    DoubleSide,
    CircleGeometry,
    Mesh,
    TextureLoader,
    SRGBColorSpace,
    BoxGeometry,
    Color,
    MeshStandardMaterial,
    Object3D,
    Box3,
} from 'three';

var oringX, oringY, currentX, currentY, first, cone;

function manageRaycasterGlassPanel(coords, type, mesh) {

    if (type == "down") {
        first = true;
        cone = mesh;
        console.log(cone);
    }


    if (first) {
        first = false;
        currentX = coords.x;
        currentY = coords.y;
        oringX = coords.x;
        oringY = coords.y;
    } else {
        if (Math.abs(currentX - coords.x) > 0.04) {

            if (currentX > coords.x && !cone.userData.blockExpandBack)
                surface(-2, 0);
            else
                surface(2, 0);

            currentX = coords.x;
        }
    }
}

function surface(x, y) {
    const parent = cone.parent;
    parent.remove(cone.glass);

    const geometry = new PlaneGeometry(cone.glass.userData.width + x, cone.glass.userData.height + y);
    const material = new MeshBasicMaterial({ color: 0xffff00, side: DoubleSide });
    const glass = new Mesh(geometry, material);
    glass.userData.width = cone.glass.userData.width + x;
    glass.userData.height = cone.glass.userData.height + y;
    parent.add(glass);
    glass.position.copy(cone.glass.position);

    if (x > 0) {
        glass.translateX(1);
        cone.translateY(2);
        cone.userData.blockExpandBack = false;
    } else if (x < 0) {
        glass.translateX(-1);
        cone.translateY(-2);

        //console.log("--------------------")
        //console.log(cone.position)
        //console.log(cone.userData.pivot)

        if(cone.position.round().equals(cone.userData.pivot.round())){
            console.log("eeeeeeeeeeeeeeeeeeeee");
            cone.userData.blockExpandBack = true;
        }
    }

    if (y > 0)
        glass.translateY(1);
    else if (y < 0)
        glass.translateY(-1);

    cone.glass = glass;
}

export { manageRaycasterGlassPanel }