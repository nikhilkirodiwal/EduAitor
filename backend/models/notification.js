// models/notification.js
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  title:   { type: String, required: true },
  message: { type: String, required: true },

  // WHO created it
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // TARGET AUDIENCE — all fields optional, controls who sees it
  target: {
    type: { 
      type: String, 
      enum: ['all', 'role', 'class', 'exam','student'], 
      default: 'all' 
    },
    roles:    [{ type: String, enum: ['teacher_admin', 'student_admin', 'school_admin'] }],
    classId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    examId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' }, 
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  },
  
  // Notification type for UI icon/color
  notificationType: { 
    type: String, 
    enum: ['general', 'exam', 'result', 'attendance', 'fee'], 
    default: 'general' 
  },
  
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  clearedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);