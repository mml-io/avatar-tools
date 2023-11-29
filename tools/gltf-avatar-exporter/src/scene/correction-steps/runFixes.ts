import { boneDedupingCorrectionStep } from "./boneDeduping";
import { checkBonesStep } from "./checkBones";
import { fixBonesScaleCorrectionStep } from "./fixBonesScale";
import { fixFeetCorrectionStep } from "./fixFeet";
import { fixMeshScaleCorrectionStep } from "./fixMeshScale";
import { levelOfDetailDedupingCorrectionStep } from "./lodDeduping";
import { placeholderMissingTexturesCorrectionStep } from "./placeholderMissingTextures";
import { replaceIncompatibleMaterialsCorrectionStep } from "./replaceIncompatibleMaterials";
import { rotatePelvisCorrectionStep } from "./rotatePelvis";
import { rotateRootCorrectionStep } from "./rotateRoot";
import { rotateWholeGroupCorrectionStep } from "./rotateWholeGroup";
import { zUpBonesCorrectionStep } from "./zUpBonesCorrectionStep";
import { zUpMeshCorrectionStep } from "./zUpMeshCorrectionStep";

export const correctionSteps = [
  levelOfDetailDedupingCorrectionStep,
  rotateWholeGroupCorrectionStep,
  zUpMeshCorrectionStep,
  zUpBonesCorrectionStep,
  fixMeshScaleCorrectionStep,
  fixBonesScaleCorrectionStep,
  boneDedupingCorrectionStep,
  rotateRootCorrectionStep,
  rotatePelvisCorrectionStep,
  // fixFeetCorrectionStep,
  placeholderMissingTexturesCorrectionStep,
  replaceIncompatibleMaterialsCorrectionStep,
  checkBonesStep,
];
