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
  // Owner - user yang membuat plan
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  // Admins - user lain yang bisa mengedit plan
  adminIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  // Legacy field - untuk backward compatibility
  createdBy: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
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

// Split Payment Schema
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
export const SplitPayment = mongoose.models.SplitPayment || mongoose.model('SplitPayment', splitPaymentSchema)
export const Note = mongoose.models.Note || mongoose.model('Note', noteSchema)
export const PaymentHistory = mongoose.models.PaymentHistory || mongoose.model('PaymentHistory', paymentHistorySchema)
