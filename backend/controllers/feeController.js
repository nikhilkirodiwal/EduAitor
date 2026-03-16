import FeeStructure from "../models/feeStructure.js";
import Class from "../models/class.js";
import Student from "../models/student.js";
import Payment from "../models/payment.js";
import Counter from "../models/receiptCounter.js";


//  Get fee structure for a class
export const getFeeStructures = async (req, res) => {
  try {
    const feeStructure = await FeeStructure.findOne({ class: req.params.classId });
    if (!feeStructure) return res.json({ class: req.params.classId, fees: [] });
    res.json(feeStructure);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const addFeeComponent = async (req, res) => {
  try {
    const { name, amount, isOptional } = req.body;
 
    if (!name || amount === undefined)
      return res.status(400).json({ message: "name and amount are required" });
 
    // findOneAndUpdate with $push — creates doc if missing (upsert: true)
    const doc = await FeeStructure.findOneAndUpdate(
      { class: req.params.classId },
      { $push: { fees: { name, amount, isOptional: !!isOptional } } },
      { new: true, upsert: true, runValidators: true }
    );
 
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

//  edit a existing one  fee component
export const editFeeComponent = async (req, res) => {
  try {
    const { name, amount, isOptional } = req.body;
    const { classId, feeId } = req.params;
 
    const doc = await FeeStructure.findOneAndUpdate(
      { class: classId, "fees._id": feeId },
      {
        $set: {
          "fees.$.name":       name,
          "fees.$.amount":     amount,
          "fees.$.isOptional": !!isOptional,
        },
      },
      { new: true, runValidators: true }
    );
 
    if (!doc) return res.status(404).json({ message: "Fee component not found" });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

//  Remove a fee component 
export const deleteFeeComponent = async (req, res) => {
  try {
    const { classId, feeId } = req.params;
 
    const doc = await FeeStructure.findOneAndUpdate(
      { class: classId },
      { $pull: { fees: { _id: feeId } } },
      { new: true }
    );
 
    if (!doc) return res.status(404).json({ message: "Fee structure not found" });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};







export const collectStudentFee = async (req, res) => {
  try {
    const { studentId, amountPaid, paymentMode, remarks } = req.body;

    // 1. Validate amount
    if (!amountPaid || Number(amountPaid) <= 0) {
      return res.status(400).json({ message: "Invalid payment amount" });
    }

    // 2. Check student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // 3. Check overpayment
    if (Number(amountPaid) > student.totalDue) {
      return res.status(400).json({
        message: `Amount ₹${amountPaid} exceeds due amount ₹${student.totalDue}`,
      });
    }

    // 4. ✅ ATOMIC receipt number — no race condition possible
    // findOneAndUpdate is ONE operation: increment + return new value atomically
    const counter = await Counter.findOneAndUpdate(
      { _id: "receiptNo" },           // find this counter document
      { $inc: { seq: 1 } },           // atomically add 1
     { returnDocument: "after", upsert: true }
    );

    const receiptId = `RCP-${counter.seq}`;

    // 5. Create payment record
    const newPayment = await Payment.create({
      studentId,
      amountPaid: Number(amountPaid),
      paymentMode,
      remarks: remarks || "",
      receiptNo: receiptId,
      paidDate: new Date(),
    });

    // 6. Update student totals
   student.totalPaid = (Number(student.totalPaid) || 0) + Number(amountPaid);
    student.totalDue = (Number(student.finalFee) || 0) - student.totalPaid;
    await student.save();

    // 7. Respond
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