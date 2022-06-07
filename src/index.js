import VR from "./three-webvr";
import * as THREE from "three";
import React, { useRef, useMemo, useEffect } from "react";
import ReactDOM from "react-dom";
import { Canvas, useRender, useThree } from "react-three-fiber";

import "./VRController";

import "./styles.css";

function Stars() {
  let group = useRef();
  let theta = 0;
  useRender(() => {
    // Some things maybe shouldn't be declarative, we're in the render-loop here with full access to the instance
    const r = 5 * Math.sin(THREE.Math.degToRad((theta += 0.003)));
    const s = Math.cos(THREE.Math.degToRad(theta * 2));
    group.current.rotation.set(r, r, r);
    group.current.scale.set(s, s, s);
  });

  const [geo, mat, coords] = useMemo(() => {
    const geo = new THREE.SphereBufferGeometry(1, 10, 10);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("lightpink")
    });
    const coords = new Array(1000)
      .fill()
      .map(i => [
        Math.random() * 800 - 400,
        Math.random() * 800 - 400,
        Math.random() * 800 - 400
      ]);
    return [geo, mat, coords];
  }, []);

  return (
    <group ref={group}>
      {coords.map(([p1, p2, p3], i) => (
        <mesh key={i} geometry={geo} material={mat} position={[p1, p2, p3]} />
      ))}
    </group>
  );
}

function App() {
  const { gl } = useThree();
  const onVRControllerConnected = useMemo(
    () => event => {
      const controller = event.detail;
      controller.standingMatrix = gl.vr.getStandingMatrix();
      // attach controller events
      // controller.on();
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -1)
      ]);
      const material = new THREE.LineBasicMaterial({
        color: 0x0000ff,
        depthTest: false,
        depthWrite: false,
        transparent: true
      });

      const line = new THREE.Line(geometry, material);
      line.name = "line";
      line.scale.z = 5;
      line.rotation.x = (Math.PI / 180) * -45;
      controller.add(line);

      const raycastTiltGroup = new THREE.Group();
      const raycastDepth = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.1, 0.1),
        new THREE.MeshBasicMaterial()
      );
      raycastDepth.visible = true;
      // raycastDepth.visible = false;
      raycastDepth.name = "raycast-depth";
      raycastTiltGroup.rotation.x = (Math.PI / 180) * -45;
      raycastTiltGroup.add(raycastDepth);

      controller.add(raycastTiltGroup);

      controller.addEventListener("disconnected", function(event) {
        controller.parent.remove(controller);
      });
    },
    [gl]
  );

  useEffect(() => {
    window.addEventListener("vr controller connected", onVRControllerConnected);
    return () => {
      window.removeEventListener(
        "vr controller connected",
        onVRControllerConnected
      );
    };
  }, [onVRControllerConnected]);

  useRender(() => {
    THREE.VRController.update();
  });

  return (
    <Canvas
      vr
      onCreated={({ gl }) => document.body.appendChild(VR.createButton(gl))}
    >
      <ambientLight color="lightblue" />
      <pointLight color="white" intensity={1} position={[10, 10, 10]} />
      <Stars />
    </Canvas>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
