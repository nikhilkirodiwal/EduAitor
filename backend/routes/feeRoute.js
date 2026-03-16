import express from 'express';

import {getFeeStructures ,addFeeComponent,editFeeComponent,deleteFeeComponent,
    collectStudentFee,
} from "../controllers/feeController.js";
const router = express.Router();

/***************** FEE STRUCTURE ROUTES *****************/

// router.post("/", createFeeStructure);
// router.get("/:classId", getFeeStructures);

router.get("/:classId",               getFeeStructures);
router.post("/:classId/fee",          addFeeComponent);
router.put("/:classId/fee/:feeId",    editFeeComponent);
router.delete("/:classId/fee/:feeId", deleteFeeComponent);



// fee collect routes 
router.post("/",collectStudentFee)

export default router;