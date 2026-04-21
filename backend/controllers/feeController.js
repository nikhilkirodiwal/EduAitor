import mongoose from "mongoose";
import FeeStructure from "../models/feeStructure.js";
import Class from "../models/class.js";
import Student from "../models/student.js";
import Payment from "../models/payment.js";
import Counter from "../models/receiptCounter.js";
import School from "../models/school.js";

const isBusFeeComponent = (fee = {}) => {
  const feeName = fee.name?.toLowerCase?.() || "";
  return feeName.includes("bus fee") || feeName.includes("transport fee");
};

const isOptionalFeeSelected = (student, fee) => {
  if (!fee?.isOptional) {
    return true;
  }

  if (isBusFeeComponent(fee)) {
    return Boolean(student.transport);
  }

  return (student.selectedOptionalFees || []).includes(String(fee._id));
};

const getAppliedFeeAmount = (student, fee) => {
  const amount = Number(fee?.amount) || 0;

  if (!isOptionalFeeSelected(student, fee)) {
    return 0;
  }

  if (isBusFeeComponent(fee) && student.busFeeFrequency === "quarterly") {
    if (!student.busFeeQuarter) {
      return 0;
    }

    return amount / 3;
  }

  return amount;
};

//  Get fee structure for a class
export const getFeeStructures = async (req, res) => {
  try {
    const { classId } = req.params;
    const schoolId = req.user?.school_id;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID is required",
      });
    }

    const feeStructure = await FeeStructure.findOne({
      class: classId,
      schoolId,
    }).lean();

    if (!feeStructure) {
      return res.json({
        success: true,
        fees: [],
      });
    }

    return res.json({
      success: true,
      fees: feeStructure.fees || [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const addFeeComponent = async (req, res) => {
  try {
    const { name, amount, isOptional } = req.body; // 👈 Extract schoolId
    const schoolId = req.user?.school_id;

    if (!name || amount === undefined || !schoolId)
      return res
        .status(400)
        .json({ message: "Name, amount, and schoolId are required" });

    // Use BOTH class and schoolId to find or create the structure
    const doc = await FeeStructure.findOneAndUpdate(
      { class: req.params.classId, schoolId: schoolId },
      {
        $push: { fees: { name, amount, isOptional: !!isOptional } },
      },
      { new: true, upsert: true, runValidators: true },
    );

    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

//  edit a existing one  fee component
export const editFeeComponent = async (req, res) => {
  try {
    const { name, amount, isOptional } = req.body; // 👈 Extract schoolId
    const schoolId = req.user?.school_id;
    const { classId, feeId } = req.params;

    if (!schoolId) {
      return res
        .status(400)
        .json({ message: "schoolId is required for security" });
    }

    const doc = await FeeStructure.findOneAndUpdate(
      {
        class: classId,
        schoolId: schoolId, // 👈 Ensures the user owns this structure
        "fees._id": feeId,
      },
      {
        $set: {
          "fees.$.name": name,
          "fees.$.amount": amount,
          "fees.$.isOptional": !!isOptional,
        },
      },
      { new: true, runValidators: true },
    );

    if (!doc)
      return res
        .status(404)
        .json({ message: "Fee component not found or unauthorized" });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

//  Remove a fee component
export const deleteFeeComponent = async (req, res) => {
  try {
    const { classId, feeId } = req.params;
    const schoolId = req.user?.school_id;

    if (!schoolId) {
      return res
        .status(400)
        .json({ message: "School ID is required for deletion" });
    }

    const doc = await FeeStructure.findOneAndUpdate(
      {
        class: classId,
        schoolId: schoolId, // 🔒 Security check: User must own this record
      },
      { $pull: { fees: { _id: feeId } } },
      { new: true },
    );

    if (!doc)
      return res
        .status(404)
        .json({ message: "Fee structure not found or unauthorized" });

    res.json({ message: "Component deleted successfully", data: doc });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// collect fee function
export const collectStudentFee = async (req, res) => {
  try {
    const { studentId, amountPaid, paymentMode, remarks } = req.body;
    const schoolId = req.user?.school_id;

    if (!studentId || amountPaid === undefined || !paymentMode || !schoolId) {
      return res.status(400).json({
        message:
          "studentId, amountPaid, paymentMode, and schoolId are required",
      });
    }
    // 0. validate school
    if (!schoolId) {
      return res.status(400).json({ message: "School ID is required" });
    }

    // 1. Explicitly Convert to ObjectId 👈 CHANGE THIS
    const sId = new mongoose.Types.ObjectId(studentId);
    const schId = new mongoose.Types.ObjectId(schoolId);

    // 2. Check student exists (Use the casted IDs)
    const student = await Student.findOne({ _id: sId, schoolId: schId });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // ... (Validation and Counter logic remains the same) ...

    const counterId = `receiptNo_${schoolId}`;
    const counter = await Counter.findOneAndUpdate(
      { _id: counterId },
      {
        $inc: { seq: 1 },
        $setOnInsert: { schoolId: schId }, // Use casted ID
      },
      { returnDocument: "after", upsert: true, setDefaultsOnInsert: true },
    );

    const receiptId = `RCP-${counter.seq}`;

    // 5. Create payment record WITH OBJECT IDs 👈 CHANGE THIS
    const newPayment = await Payment.create({
      studentId: sId, // Use casted ID
      schoolId: schId, // Use casted ID
      amountPaid: Number(amountPaid),
      paymentMode,
      remarks: remarks || "",
      receiptNo: receiptId,
      paidDate: new Date(),
    });

    // 6. Update student totals
    student.totalPaid = (Number(student.totalPaid) || 0) + Number(amountPaid);
    student.totalDue =
      Math.round(((Number(student.finalFee) || 0) - student.totalPaid) * 100) /
      100;
    await student.save();

    return res.status(200).json({
      success: true,
      message: "Payment processed successfully",
      data: {
        receipt: newPayment,
        updatedBalances: {
          totalPaid: student.totalPaid,
          totalDue: student.totalDue,
        },
      },
    });
  } catch (error) {
    console.error("Fee Collection Error:", error);
    return res.status(500).json({ message: "Server error during payment" });
  }
};

//  get all history of that particular school students
export const AllStudentHistory = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const search = (req.query.search || "").trim();
    const month = parseInt(req.query.month) || null;
    const year = parseInt(req.query.year) || null;
    const schoolId = req.user.school_id;

    if (!schoolId) {
      return res
        .status(400)
        .json({ success: false, message: "School ID required" });
    }

    const initialMatch = {
      schoolId: new mongoose.Types.ObjectId(schoolId),
    };

    if (year) {
      initialMatch["$expr"] = { $eq: [{ $year: "$paidDate" }, year] };
    }
    if (month) {
      if (initialMatch["$expr"]) {
        initialMatch["$expr"] = {
          $and: [
            initialMatch["$expr"],
            { $eq: [{ $month: "$paidDate" }, month] },
          ],
        };
      } else {
        initialMatch["$expr"] = { $eq: [{ $month: "$paidDate" }, month] };
      }
    }

    let studentMatch = {};
    if (search) {
      const words = search.split(/\s+/);
      const wordConditions = words.map((word) => ({
        $or: [
          { "studentData.firstName": { $regex: word, $options: "i" } },
          { "studentData.lastName": { $regex: word, $options: "i" } },
          { "studentData.studentId": { $regex: word, $options: "i" } },
          { receiptNo: { $regex: word, $options: "i" } },
        ],
      }));
      studentMatch = { $and: wordConditions };
    }

    const pipeline = [
      { $match: initialMatch },
      {
        $lookup: {
          from: "students",
          localField: "studentId",
          foreignField: "_id",
          as: "studentData",
        },
      },
      {
        $unwind: {
          path: "$studentData",
          preserveNullAndEmptyArrays: true,
        },
      },

      /* ─── NEW STEP: Join with Classes and Sections ─── */
      {
        $lookup: {
          from: "classes", // Make sure this is your actual collection name
          localField: "studentData.classId",
          foreignField: "_id",
          as: "classDetails",
        },
      },
      { $unwind: { path: "$classDetails", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "sections", // Make sure this is your actual collection name
          localField: "studentData.sectionId",
          foreignField: "_id",
          as: "sectionDetails",
        },
      },
      {
        $unwind: { path: "$sectionDetails", preserveNullAndEmptyArrays: true },
      },
      /* ────────────────────────────────────────────── */

      { $match: studentMatch },

      {
        $facet: {
          records: [
            { $sort: { paidDate: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 1,
                receiptNo: 1,
                amountPaid: 1,
                paymentMode: 1,
                paidDate: 1,
                remarks: 1,
                studentId: {
                  _id: "$studentData._id",
                  studentId: "$studentData.studentId",
                  firstName: "$studentData.firstName",
                  lastName: "$studentData.lastName",
                  // Use the joined names from classDetails and sectionDetails
                  className: "$classDetails.name",
                  section: "$sectionDetails.name",
                },
              },
            },
          ],
          totalCount: [{ $count: "count" }],
          totalAmount: [
            { $group: { _id: null, sum: { $sum: "$amountPaid" } } },
          ],
        },
      },
    ];

    const [result] = await Payment.aggregate(pipeline);

    const records = result.records || [];
    const total = result.totalCount[0]?.count || 0;
    const totalAmount = result.totalAmount[0]?.sum || 0;
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      Allhistory: records,
      pagination: { total, totalPages, currentPage: page, limit },
      summary: { totalAmount, appliedFilters: { search, month, year } },
    });
  } catch (error) {
    console.error("AllStudentHistory error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch fee history",
      error: error.message,
    });
  }
};

// all defaulter of particular school students
export const getAllDefaulter = async (req, res) => {
  try {
    // 1. Extract classId (not className) from query
    const { classId, search, page = 1, limit = 10 } = req.query;
    const schoolId = req.user?.school_id;
    if (!schoolId)
      return res.status(400).json({ message: "School Id is required" });

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const pageSize = parseInt(limit);
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 2. Build matchQuery using classId
    let matchQuery = {
      schoolId: new mongoose.Types.ObjectId(schoolId),
    };

    // Use classId because your Schema uses classId
    if (classId) matchQuery.classId = new mongoose.Types.ObjectId(classId);

    if (search) {
      matchQuery.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { studentId: { $regex: search, $options: "i" } },
      ];
    }

    const result = await Student.aggregate([
      { $match: matchQuery },

      // JOIN with Classes to get the Name for the UI
      {
        $lookup: {
          from: "classes",
          localField: "classId",
          foreignField: "_id",
          as: "classInfo",
        },
      },
      { $unwind: { path: "$classInfo", preserveNullAndEmptyArrays: true } },

      // JOIN with Payments
      {
        $lookup: {
          from: "payments",
          let: { studId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$studentId", "$$studId"] },
                    {
                      $eq: ["$schoolId", new mongoose.Types.ObjectId(schoolId)],
                    },
                  ],
                },
              },
            },
          ],
          as: "paymentHistory",
        },
      },

      {
        $addFields: {
          // Map the joined class name to a field the UI expects
          className: "$classInfo.name",
          hasPaidThisMonth: {
            $gt: [
              {
                $size: {
                  $filter: {
                    input: "$paymentHistory",
                    as: "p",
                    cond: { $gte: ["$$p.paidDate", startOfCurrentMonth] },
                  },
                },
              },
              0,
            ],
          },
          lastPayment: {
            $arrayElemAt: [
              {
                $sortArray: {
                  input: "$paymentHistory",
                  sortBy: { paidDate: -1 },
                },
              },
              0,
            ],
          },
          calculatedDue: {
            $subtract: ["$finalFee", { $ifNull: ["$totalPaid", 0] }],
          },
        },
      },

      { $match: { hasPaidThisMonth: false, calculatedDue: { $gt: 0 } } },

      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: skip }, { $limit: pageSize }],
        },
      },
    ]);

    const defaulters = result[0]?.data || [];
    const totalRecords = result[0]?.metadata[0]?.total || 0;

    res.status(200).json({
      success: true,
      defaulters,
      totalRecords,
      totalPages: Math.ceil(totalRecords / pageSize),
      currentPage: parseInt(page),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// all defaulter of particular school students for super admin
export const getAllAdminDefaulter = async (req, res) => {
  try {
    if (req.user.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }
    // 1. Extract classId (not className) from query
    const { schoolId, classId, search, page = 1, limit = 10 } = req.query;
    if (!schoolId)
      return res.status(400).json({ message: "School Id is required" });

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const pageSize = parseInt(limit);
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 2. Build matchQuery using classId
    let matchQuery = {
      schoolId: new mongoose.Types.ObjectId(schoolId),
    };

    // Use classId because your Schema uses classId
    if (classId) matchQuery.classId = new mongoose.Types.ObjectId(classId);

    if (search) {
      matchQuery.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { studentId: { $regex: search, $options: "i" } },
      ];
    }

    const result = await Student.aggregate([
      { $match: matchQuery },

      // JOIN with Classes to get the Name for the UI
      {
        $lookup: {
          from: "classes",
          localField: "classId",
          foreignField: "_id",
          as: "classInfo",
        },
      },
      { $unwind: { path: "$classInfo", preserveNullAndEmptyArrays: true } },

      // JOIN with Payments
      {
        $lookup: {
          from: "payments",
          let: { studId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$studentId", "$$studId"] },
                    {
                      $eq: ["$schoolId", new mongoose.Types.ObjectId(schoolId)],
                    },
                  ],
                },
              },
            },
          ],
          as: "paymentHistory",
        },
      },

      {
        $addFields: {
          // Map the joined class name to a field the UI expects
          className: "$classInfo.name",
          hasPaidThisMonth: {
            $gt: [
              {
                $size: {
                  $filter: {
                    input: "$paymentHistory",
                    as: "p",
                    cond: { $gte: ["$$p.paidDate", startOfCurrentMonth] },
                  },
                },
              },
              0,
            ],
          },
          lastPayment: {
            $arrayElemAt: [
              {
                $sortArray: {
                  input: "$paymentHistory",
                  sortBy: { paidDate: -1 },
                },
              },
              0,
            ],
          },
          calculatedDue: {
            $subtract: ["$finalFee", { $ifNull: ["$totalPaid", 0] }],
          },
        },
      },

      { $match: { hasPaidThisMonth: false, calculatedDue: { $gt: 0 } } },

      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: skip }, { $limit: pageSize }],
        },
      },
    ]);

    const defaulters = result[0]?.data || [];
    const totalRecords = result[0]?.metadata[0]?.total || 0;

    res.status(200).json({
      success: true,
      defaulters,
      totalRecords,
      totalPages: Math.ceil(totalRecords / pageSize),
      currentPage: parseInt(page),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// all history of particular school students for super admin
export const getAllStudentAdminHistory = async (req, res) => {
  try {
    if (req.user.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const schoolId = req.query.schoolId;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const search = (req.query.search || "").trim();
    const month = parseInt(req.query.month) || null;
    const year = parseInt(req.query.year) || null;

    if (!schoolId) {
      return res
        .status(400)
        .json({ success: false, message: "School ID required" });
    }

    const initialMatch = {
      schoolId: new mongoose.Types.ObjectId(schoolId),
    };

    if (year) {
      initialMatch["$expr"] = { $eq: [{ $year: "$paidDate" }, year] };
    }
    if (month) {
      if (initialMatch["$expr"]) {
        initialMatch["$expr"] = {
          $and: [
            initialMatch["$expr"],
            { $eq: [{ $month: "$paidDate" }, month] },
          ],
        };
      } else {
        initialMatch["$expr"] = { $eq: [{ $month: "$paidDate" }, month] };
      }
    }

    let studentMatch = {};
    if (search) {
      const words = search.split(/\s+/);
      const wordConditions = words.map((word) => ({
        $or: [
          { "studentData.firstName": { $regex: word, $options: "i" } },
          { "studentData.lastName": { $regex: word, $options: "i" } },
          { "studentData.studentId": { $regex: word, $options: "i" } },
          { receiptNo: { $regex: word, $options: "i" } },
        ],
      }));
      studentMatch = { $and: wordConditions };
    }

    const pipeline = [
      { $match: initialMatch },
      {
        $lookup: {
          from: "students",
          localField: "studentId",
          foreignField: "_id",
          as: "studentData",
        },
      },
      {
        $unwind: {
          path: "$studentData",
          preserveNullAndEmptyArrays: true,
        },
      },

      /* ─── NEW STEP: Join with Classes and Sections ─── */
      {
        $lookup: {
          from: "classes", // Make sure this is your actual collection name
          localField: "studentData.classId",
          foreignField: "_id",
          as: "classDetails",
        },
      },
      { $unwind: { path: "$classDetails", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "sections", // Make sure this is your actual collection name
          localField: "studentData.sectionId",
          foreignField: "_id",
          as: "sectionDetails",
        },
      },
      {
        $unwind: { path: "$sectionDetails", preserveNullAndEmptyArrays: true },
      },
      /* ────────────────────────────────────────────── */

      { $match: studentMatch },

      {
        $facet: {
          records: [
            { $sort: { paidDate: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 1,
                receiptNo: 1,
                amountPaid: 1,
                paymentMode: 1,
                paidDate: 1,
                remarks: 1,
                studentId: {
                  _id: "$studentData._id",
                  studentId: "$studentData.studentId",
                  firstName: "$studentData.firstName",
                  lastName: "$studentData.lastName",
                  // Use the joined names from classDetails and sectionDetails
                  className: "$classDetails.name",
                  section: "$sectionDetails.name",
                },
              },
            },
          ],
          totalCount: [{ $count: "count" }],
          totalAmount: [
            { $group: { _id: null, sum: { $sum: "$amountPaid" } } },
          ],
        },
      },
    ];

    const [result] = await Payment.aggregate(pipeline);

    const records = result.records || [];
    const total = result.totalCount[0]?.count || 0;
    const totalAmount = result.totalAmount[0]?.sum || 0;
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      Allhistory: records,
      pagination: { total, totalPages, currentPage: page, limit },
      summary: { totalAmount, appliedFilters: { search, month, year } },
    });
  } catch (error) {
    console.error("AllStudentHistory error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch fee history",
      error: error.message,
    });
  }
};

export const getStudentFeeDetails = async (req, res) => {
  try {
    const { studentId } = req.params;
    const schoolId = req.user.school_id; // from auth token

    // Fetch student with class info
    const student = await Student.findById(studentId)
      .populate({ path: "classId", select: "name" })
      .populate({ path: "sectionId", select: "name" })
      .lean();

    if (!student) return res.status(404).json({ message: "Student not found" });

    // Fetch fee structure for student's class
    const feeStructure = await FeeStructure.findOne({
      class: student.classId._id,
      schoolId,
    }).lean();

    console.log("student.classId._id:", student.classId._id);
    console.log("schoolId:", schoolId);
    console.log("feeStructure:", feeStructure);

    // Fetch all payments for this student
    const payments = await Payment.find({ studentId, schoolId })
      .sort({ paidDate: -1 })
      .lean();

    const applicableFees = (feeStructure?.fees || []).filter((fee) =>
      isOptionalFeeSelected(student, fee),
    );

    const totalFees =
      Number(student.finalFee) ||
      applicableFees.reduce(
        (sum, fee) => sum + getAppliedFeeAmount(student, fee),
        0,
      );

    const totalPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0);
    const balanceDue = Math.max(0, totalFees - totalPaid);

    res.json({
      student: {
        name: student.firstName + " " + student.lastName,
        className: student.classId?.name,
        section: student.sectionId?.name,
        rollNo: student.rollNo,
      },
      feeStructure: applicableFees,
      totalFees,
      totalPaid,
      balanceDue,
      paidPercent:
        totalFees > 0 ? Math.round((totalPaid / totalFees) * 100) : 0,
      feeFrequency: student.feeFrequency || "annually",
      busFeeFrequency: student.busFeeFrequency || "annually",
      busFeeQuarter: student.busFeeQuarter || "",
      payments,
    });
  } catch (err) {
    console.error("getStudentFeeDetails error:", err.message);
    res.status(500).json({ message: err.message });
  }
};
