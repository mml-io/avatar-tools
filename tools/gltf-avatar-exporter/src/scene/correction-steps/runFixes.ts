import { boneDedupingCorrectionStep } from "./boneDeduping";
import { connectRootCorrectionStep } from "./connectRoot";
import { fixBonesScaleCorrectionStep } from "./fixBonesScale";
import { fixMeshScaleCorrectionStep } from "./fixMeshScale";
import { levelOfDetailDedupingCorrectionStep } from "./lodDeduping";
import { placeholderMissingTexturesCorrectionStep } from "./placeholderMissingTextures";
import { removeTransparencyFromMaterialsCorrectionStep } from "./removeTransparencyFromMaterials";
import { removeVertexColorsCorrectionStep } from "./removeVertexColors";
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
  connectRootCorrectionStep,
  rotateRootCorrectionStep,
  rotatePelvisCorrectionStep,
  removeVertexColorsCorrectionStep,
  placeholderMissingTexturesCorrectionStep,
  replaceIncompatibleMaterialsCorrectionStep,
  removeTransparencyFromMaterialsCorrectionStep,
];
