import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    receiptNo: { type: String, unique: true, required: true }, // e.g., RCP-1710582000
    amountPaid: { type: Number, required: true },
    paymentMode: { type: String, enum: ['Cash', 'UPI', 'Cheque', 'Online'], required: true },
    paidDate: { type: Date, default: Date.now },
    remarks: { type: String }
});

export default  mongoose.model('Payment', paymentSchema);