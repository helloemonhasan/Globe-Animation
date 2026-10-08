import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getEntranceProgress } from '../utils/mathSphere';

export function CameraRig({
  entranceProgress = 1.0,
  isSelected = false,
  baseCameraZ = 13.6
}) {
  const { camera } = useThree();

  const targetZRef = useRef(baseCameraZ);
  const parallaxOffsetRef = useRef({ x: 0, y: 0 });
  const scrollOffsetRef = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = -(e.clientY / window.innerHeight) * 2 + 1;
      parallaxOffsetRef.current = {
        x: normX * 0.45,
        y: normY * 0.3
      };
    };

    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      scrollOffsetRef.current = Math.sin(scrollY * 0.002) * 0.6;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);

    // Entrance camera movement: moves from 15.6 to baseCameraZ
    const curEntrance = getEntranceProgress(entranceProgress);
    const entranceZ = THREE.MathUtils.lerp(15.6, baseCameraZ, curEntrance);

    // When card is selected, slight camera adjustment
    const focusTargetZ = isSelected ? baseCameraZ - 0.4 : entranceZ;
    targetZRef.current = THREE.MathUtils.lerp(targetZRef.current, focusTargetZ, 4.0 * dt);

    // Parallax position
    const targetX = parallaxOffsetRef.current.x;
    const targetY = parallaxOffsetRef.current.y;
    const targetZ = targetZRef.current + scrollOffsetRef.current;

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 2.5 * dt);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 2.5 * dt);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 3.5 * dt);

    camera.lookAt(0, 0, 0);
  });

  return null;
}
