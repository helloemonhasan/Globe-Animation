import * as THREE from 'three';

/**
 * Distributes cards mathematically around the surface of an invisible sphere
 * using a Fibonacci spiral (golden ratio lattice).
 *
 * @param {number} count - Total number of cards
 * @param {number} radius - Sphere radius in world units
 * @returns {Array} List of card spatial coordinates, normals and quaternions
 */
export function generateSpherePositions(count, radius = 7.5) {
  const cards = [];
  const goldenRatio = (1 + Math.sqrt(5)) / 2;

  const vPos = new THREE.Vector3();
  const vNormal = new THREE.Vector3();
  const vUpWorld = new THREE.Vector3(0, 1, 0);
  const vTangentY = new THREE.Vector3();
  const vTangentX = new THREE.Vector3();
  const basisMatrix = new THREE.Matrix4();
  const qRadial = new THREE.Quaternion();

  for (let i = 0; i < count; i++) {
    // Fibonacci sphere distribution
    const phi = Math.acos(1 - 2 * (i + 0.5) / count); // Latitude from 0 to PI
    const theta = 2 * Math.PI * (i / goldenRatio); // Longitude spiral

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);

    vPos.set(x, y, z);
    vNormal.copy(vPos).normalize();

    // Construct an orthonormal coordinate frame for the card
    // Z: outward radial normal (+Z faces out into the world)
    // Y: tangent directed toward the North pole (card top faces upwards)
    vTangentY.copy(vUpWorld).sub(vNormal.clone().multiplyScalar(vUpWorld.dot(vNormal)));
    if (vTangentY.lengthSq() < 0.0001) {
      vTangentY.set(0, 0, vNormal.y > 0 ? -1 : 1);
    } else {
      vTangentY.normalize();
    }
    // X: tangent directed along latitude
    vTangentX.crossVectors(vTangentY, vNormal).normalize();

    basisMatrix.makeBasis(vTangentX, vTangentY, vNormal);
    qRadial.setFromRotationMatrix(basisMatrix);

    cards.push({
      index: i,
      position: [x, y, z],
      normal: [vNormal.x, vNormal.y, vNormal.z],
      radialQuaternion: [qRadial.x, qRadial.y, qRadial.z, qRadial.w],
      phi,
      theta
    });
  }

  return cards;
}

/**
 * Calculates a blended orientation for a card that follows the sphere's curvature
 * with a subtle billboard influence toward the camera.
 * 
 * @param {THREE.Quaternion} baseRadialQuat - Pure radial quaternion in sphere space
 * @param {THREE.Vector3} cardLocalPos - Position of card in sphere local space
 * @param {THREE.Vector3} camLocalPos - Camera position in sphere local space
 * @param {number} billboardWeight - Camera influence factor (0.15 - 0.30)
 * @param {THREE.Quaternion} outTargetQuat - Output quaternion
 */
export function blendCardOrientation(baseRadialQuat, cardLocalPos, camLocalPos, billboardWeight = 0.22, outTargetQuat) {
  // Vector pointing from card to camera in sphere local space
  const dirToCam = new THREE.Vector3().subVectors(camLocalPos, cardLocalPos).normalize();
  const upVec = new THREE.Vector3(0, 1, 0);

  // Basis for facing camera directly
  const camRight = new THREE.Vector3().crossVectors(upVec, dirToCam);
  if (camRight.lengthSq() < 0.0001) {
    camRight.set(1, 0, 0);
  } else {
    camRight.normalize();
  }
  const camUp = new THREE.Vector3().crossVectors(dirToCam, camRight).normalize();

  const camMatrix = new THREE.Matrix4().makeBasis(camRight, camUp, dirToCam);
  const qCam = new THREE.Quaternion().setFromRotationMatrix(camMatrix);

  // Slerp between radial curvature and camera billboard
  outTargetQuat.copy(baseRadialQuat).slerp(qCam, billboardWeight);
  return outTargetQuat;
}

/**
 * Universal safe parser for entrance progress, preventing any NaN or uninitialized state.
 */
export function getEntranceProgress(val) {
  if (typeof val === 'number' && !isNaN(val)) return Math.min(Math.max(val, 0), 1);
  if (val && typeof val.value === 'number' && !isNaN(val.value)) return Math.min(Math.max(val.value, 0), 1);
  if (val && typeof val.current === 'number' && !isNaN(val.current)) return Math.min(Math.max(val.current, 0), 1);
  if (val && val.current && typeof val.current.value === 'number' && !isNaN(val.current.value)) return Math.min(Math.max(val.current.value, 0), 1);
  return 1.0;
}
