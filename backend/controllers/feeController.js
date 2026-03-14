import FeeStructure from "../models/feeStructure.js";
import Class from "../models/class.js";

// export const createFeeStructure = async (req, res) => {
//   try {

//     // get any class from DB (temporary)
//     const classData = await Class.findOne({ _id: "69b401ddf2012791195309e6" });

//     if (!classData) {
//       return res.status(404).json({ message: "No class found in DB" });
//     }

//     const fees = [
//       {
//         name: "Tuition Fee",
//         amount: 1500,
//         isOptional: false
//       },
//       {
//         name: "Transport Fee",
//         amount: 800,
//         isOptional: true
//       },
//       {
//         name: "Library Fee",
//         amount: 300,
//         isOptional: false
//       },
//       {
//         name: "Lab Fee",
//         amount: 500,
//         isOptional: true
//       },
//       {
//         name: "Sports Fee",
//         amount: 200,
//         isOptional: true
//       }
//     ];

//     const newFeeStructure = new FeeStructure({
//       class: classData._id,
//       fees: fees
//     });

//     await newFeeStructure.save();

//     res.status(201).json({
//       message: "Fee Structure Created",
//       data: newFeeStructure
//     });

//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

// export const getFeeStructures = async (req, res) => {

//   try {
//     const { classId } = req.params;
//     console.log("Fetching fee structure for class ID:", classId);
//     const feeStructures = await FeeStructure.findOne({class:classId}).populate("class", "fees");
//     res.json(feeStructures);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };


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