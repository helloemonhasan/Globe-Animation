const THREE = require('three');
const targetX = Math.PI / 2 - Math.PI / 4;
const targetY = Math.PI - Math.PI / 2;
const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(targetX, targetY, 0, 'YXZ'));
const e = new THREE.Euler().setFromQuaternion(q, 'XYZ');
console.log(e.x, e.y, e.z);
