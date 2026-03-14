import express from 'express';

import {getFeeStructures ,addFeeComponent,editFeeComponent,deleteFeeComponent} from "../controllers/feeController.js";
const router = express.Router();

/***************** FEE STRUCTURE ROUTES *****************/

// router.post("/", createFeeStructure);
// router.get("/:classId", getFeeStructures);

router.get("/:classId",               getFeeStructures);
router.post("/:classId/fee",          addFeeComponent);
router.put("/:classId/fee/:feeId",    editFeeComponent);
router.delete("/:classId/fee/:feeId", deleteFeeComponent);

export default router;