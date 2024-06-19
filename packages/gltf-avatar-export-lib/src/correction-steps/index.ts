import { boneDedupingCorrectionStep } from "./bone-deduping";
import { connectRootCorrectionStep } from "./connect-root";
import { fixBonesScaleCorrectionStep } from "./fix-bones-scale";
import { fixFlippedBitmapTexturesCorrectionStep } from "./fix-flipped-bitmap-textures";
import { fixMeshScaleCorrectionStep } from "./fix-mesh-scale";
import { levelOfDetailDedupingCorrectionStep } from "./level-of-detail-deduping";
import { mergeGeometryGroupsCorrectionStep } from "./merge-geometry-groups";
import { mixamoToUe5SkeletonMapper } from "./mixamo-to-ue5-skeleton-mapper";
import { placeholderMissingTexturesCorrectionStep } from "./placeholder-missing-textures";
import { removeTransparencyFromMaterialsCorrectionStep } from "./remove-transparency-from-materials";
import { removeVertexColorsCorrectionStep } from "./remove-vertex-colors";
import { replaceIncompatibleMaterialsCorrectionStep } from "./replace-incompatible-materials";
import { reposeBonesCorrectionStep } from "./repose-bones";
import { rotatePelvisCorrectionStep } from "./rotate-pelvis";
import { rotateRootCorrectionStep } from "./rotate-root";
import { rotateWholeGroupCorrectionStep } from "./rotate-whole-group";
import { Step } from "./types";
import { zUpBonesCorrectionStep } from "./z-up-bones";
import { zUpMeshCorrectionStep } from "./z-up-mesh";

export * from "./types";

const rawCorrectionSteps = [
  levelOfDetailDedupingCorrectionStep,
  mergeGeometryGroupsCorrectionStep,
  boneDedupingCorrectionStep,
  rotateWholeGroupCorrectionStep,
  zUpMeshCorrectionStep,
  zUpBonesCorrectionStep,
  fixMeshScaleCorrectionStep,
  reposeBonesCorrectionStep,
  fixBonesScaleCorrectionStep,
  mixamoToUe5SkeletonMapper,
  connectRootCorrectionStep,
  rotateRootCorrectionStep,
  rotatePelvisCorrectionStep,
  removeVertexColorsCorrectionStep,
  fixFlippedBitmapTexturesCorrectionStep,
  placeholderMissingTexturesCorrectionStep,
  replaceIncompatibleMaterialsCorrectionStep,
  removeTransparencyFromMaterialsCorrectionStep,
] as const;

export const correctionSteps: ReadonlyArray<Readonly<Step>> = rawCorrectionSteps;

export type CorrectionStepName = (typeof correctionSteps)[number]["name"];

export const correctionStepNames: Array<CorrectionStepName> = correctionSteps.map(
  (step) => step.name,
);
