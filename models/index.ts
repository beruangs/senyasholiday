import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const { Schema } = mongoose

// User Schema - untuk user registration dan authentication
const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
    match: /^[a-z0-9_]+$/ // only lowercase letters, numbers, underscore
  },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['user', 'sen_user', 'superadmin'], default: 'user' },
  createdAt: { type: Date, default: Date.now },
  lastLoginAt: Date,
  language: { type: String, enum: ['id', 'en'], default: 'id' },
  theme: { type: String, enum: ['light', 'ash', 'dark'], default: 'light' },
})

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password)
}

// Holiday Plan Schema
const holidayPlanSchema = new Schema({
  title: { type: String, required: true },
  destination: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  description: String,
  password: String, // For public access
  status: { type: String, enum: ['active', 'completed'], default: 'active' },
  completedAt: Date,
  bannerImage: String,
  logoImage: String,
  // Plan Category - untuk kategorisasi plan
  planCategory: {
    type: String,
    enum: ['individual', 'sen_yas_daddy'],
    default: 'individual'
  },
  // Owner - user yang membuat plan (optional for SEN plans and env-admin)
  ownerId: { type: Schema.Types.ObjectId, ref: 'User' },
  // Admins - user lain yang bisa mengedit plan (confirmed)
  adminIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  // Pending Admins - waiting for confirmation from the invited user
  pendingAdminIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  // Legacy field - untuk backward compatibility
  createdBy: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  // Soft delete / Trash feature
  deletedAt: { type: Date, default: null },
  trashExpiresAt: { type: Date, default: null },
})

// Rundown/Schedule Schema
const rundownSchema = new Schema({
  holidayPlanId: { type: Schema.Types.ObjectId, ref: 'HolidayPlan', required: true },
  date: { type: Date, required: true },
  time: String,
  activity: { type: String, required: true },
  location: String,
  notes: String,
  order: { type: Number, default: 0 },
})

// Expense Category Schema
const expenseCategorySchema = new Schema({
  holidayPlanId: { type: Schema.Types.ObjectId, ref: 'HolidayPlan', required: true },
  name: { type: String, required: true },
  order: { type: Number, default: 0 },
})

// Expense Item Schema
const expenseItemSchema = new Schema({
  holidayPlanId: { type: Schema.Types.ObjectId, ref: 'HolidayPlan', required: true },
  categoryId: { type: Schema.Types.ObjectId, ref: 'ExpenseCategory' },
  itemName: { type: String, required: true },
  detail: String,
  price: { type: Number, required: true },
  quantity: { type: Number, default: 1 },
  total: { type: Number, required: true },
  collectorId: { type: Schema.Types.ObjectId, ref: 'Participant' },
  downPayment: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
})

// Participant Schema
const participantSchema = new Schema({
  holidayPlanId: { type: Schema.Types.ObjectId, ref: 'HolidayPlan', required: true },
  name: { type: String, required: true },
  // Link ke user jika participant adalah user terdaftar
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  order: { type: Number, default: 0 },
})

// Contribution/Iuran Schema
const contributionSchema = new Schema({
  holidayPlanId: { type: Schema.Types.ObjectId, ref: 'HolidayPlan', required: true },
  expenseItemId: { type: Schema.Types.ObjectId, ref: 'ExpenseItem', required: true },
  participantId: { type: Schema.Types.ObjectId, ref: 'Participant', required: true },
  amount: { type: Number, required: true },
  isPaid: { type: Boolean, default: false },
  paid: { type: Number, default: 0 },
  maxPay: { type: Number, default: null },
  paidAt: Date,
  paymentMethod: { type: String, enum: ['manual', 'cash', 'transfer', 'midtrans'], default: 'manual' },
  midtransOrderId: String,
  midtransTransactionId: String,
  midtransServiceFee: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
})

// Split Bill Schema - for itemized bill splitting
const splitBillSchema = new Schema({
  holidayPlanId: { type: Schema.Types.ObjectId, ref: 'HolidayPlan', required: true },
  title: { type: String, required: true },
  payerId: { type: Schema.Types.ObjectId, ref: 'Participant', required: true },
  date: { type: Date, default: Date.now },
  totalAmount: { type: Number, required: true },
  taxPercent: { type: Number, default: 0 },
  servicePercent: { type: Number, default: 0 },
  roundedAmount: { type: Number, default: 0 },
  items: [{
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, default: 1 },
    involvedParticipants: [{ type: Schema.Types.ObjectId, ref: 'Participant' }]
  }],
  participantPayments: [{
    participantId: { type: Schema.Types.ObjectId, ref: 'Participant' },
    shareAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    isPaid: { type: Boolean, default: false },
    paidAt: Date
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Split Payment Schema - legacy
const splitPaymentSchema = new Schema({
  holidayPlanId: { type: Schema.Types.ObjectId, ref: 'HolidayPlan', required: true },
  expenseItemId: { type: Schema.Types.ObjectId, ref: 'ExpenseItem', required: true },
  participantId: { type: Schema.Types.ObjectId, ref: 'Participant', required: true },
  amount: { type: Number, required: true },
})

// Note Schema
const noteSchema = new Schema({
  holidayPlanId: { type: Schema.Types.ObjectId, ref: 'HolidayPlan', required: true },
  content: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

// Checklist Schema - for packing lists and persiapan
const checklistSchema = new Schema({
  holidayPlanId: { type: Schema.Types.ObjectId, ref: 'HolidayPlan', required: true },
  category: { type: String, default: 'packing' },
  item: { type: String, required: true },
  isCompleted: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now },
})

// System Settings Schema - for global flags like maintenance mode
const systemSettingSchema = new Schema({
  key: { type: String, required: true, unique: true },
  value: Schema.Types.Mixed,
  description: String,
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedAt: { type: Date, default: Date.now },
})

// Impersonation Token Schema - for secure "Login as User" feature
const impersonationTokenSchema = new Schema({
  token: { type: String, required: true, unique: true },
  targetUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 }, // Expires in 5 minutes
})

// Notification Schema - for admin invitations and other notifications
const notificationSchema = new Schema({
  // Who receives this notification
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  // Type of notification
  type: {
    type: String,
    enum: ['admin_invite', 'admin_invite_accepted', 'admin_invite_rejected', 'general'],
    required: true
  },
  // Related plan (for admin invite notifications)
  planId: { type: Schema.Types.ObjectId, ref: 'HolidayPlan' },
  // Who sent/triggered this notification
  fromUserId: { type: Schema.Types.ObjectId, ref: 'User' },
  // Message content
  title: { type: String, required: true },
  message: { type: String },
  // Has user read this notification
  read: { type: Boolean, default: false },
  // For invite: has user responded
  responded: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
})

// Payment History Schema
const paymentHistorySchema = new Schema({
  holidayPlanId: { type: Schema.Types.ObjectId, ref: 'HolidayPlan', required: true },
  contributionId: { type: Schema.Types.ObjectId, ref: 'Contribution', required: true },
  participantId: { type: Schema.Types.ObjectId, ref: 'Participant', required: true },
  expenseItemId: { type: Schema.Types.ObjectId, ref: 'ExpenseItem' },
  action: {
    type: String,
    enum: ['payment', 'refund', 'adjustment', 'max_pay_set', 'max_pay_removed'],
    required: true
  },
  previousAmount: { type: Number, default: 0 },
  newAmount: { type: Number, default: 0 },
  changeAmount: { type: Number, default: 0 },
  paymentMethod: { type: String, enum: ['manual', 'cash', 'transfer', 'midtrans'], default: 'manual' },
  note: String,
  createdAt: { type: Date, default: Date.now },
})

// Export models
export const User = mongoose.models.User || mongoose.model('User', userSchema)
export const HolidayPlan = mongoose.models.HolidayPlan || mongoose.model('HolidayPlan', holidayPlanSchema)
export const Rundown = mongoose.models.Rundown || mongoose.model('Rundown', rundownSchema)
export const ExpenseCategory = mongoose.models.ExpenseCategory || mongoose.model('ExpenseCategory', expenseCategorySchema)
export const ExpenseItem = mongoose.models.ExpenseItem || mongoose.model('ExpenseItem', expenseItemSchema)
export const Participant = mongoose.models.Participant || mongoose.model('Participant', participantSchema)
export const Contribution = mongoose.models.Contribution || mongoose.model('Contribution', contributionSchema)
export const SplitBill = mongoose.models.SplitBill || mongoose.model('SplitBill', splitBillSchema)
export const SplitPayment = mongoose.models.SplitPayment || mongoose.model('SplitPayment', splitPaymentSchema)
export const Note = mongoose.models.Note || mongoose.model('Note', noteSchema)
export const PaymentHistory = mongoose.models.PaymentHistory || mongoose.model('PaymentHistory', paymentHistorySchema)
export const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema)
export const Checklist = mongoose.models.Checklist || mongoose.model('Checklist', checklistSchema)
export const SystemSetting = mongoose.models.SystemSetting || mongoose.model('SystemSetting', systemSettingSchema)
export const ImpersonationToken = mongoose.models.ImpersonationToken || mongoose.model('ImpersonationToken', impersonationTokenSchema)
