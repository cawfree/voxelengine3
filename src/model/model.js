import { Map } from "immutable";
import * as THREE from "three";

export default Map(
  {
    light: Map(
      point: new THREE.PointLight(0xFFAA00, 1, 10),
    ),
    material: Map(
      {
        box: new THREE.MeshPhongMaterial({
          color: 0xffffff,
        }),
        sprite: new THREE.SpriteMaterial({
          color: 0xffffff,
        }),
        chunk: new THREE.MeshPhongMaterial({
          vertexColors: THREE.VertexColors,
          wireframe: false,
        }),
      },
    ),
  },
);
