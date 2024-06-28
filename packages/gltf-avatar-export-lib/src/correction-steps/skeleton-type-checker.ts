import * as THREE from "three";
import { Group } from "three";
import { LogMessage, Step, StepResult } from "./types";

export function hasUE5Skeleton(group: Group): boolean {
    let hasUnrealSkeleton = false;
    group.traverse((child) => {
        const asBone = child as THREE.Bone;
        
            if (asBone.name == "root") {
                hasUnrealSkeleton = true;
                return;
            }
        
    });

    console.log(`checking IF UE: ${hasUnrealSkeleton}`);
    return hasUnrealSkeleton;
}
    