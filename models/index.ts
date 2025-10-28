import mongoose from 'mongoose'

const { Schema } = mongoose

// Holiday Plan Schema
const holidayPlanSchema = new Schema({
  title: { type: String, required: true },
  destination: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  description: String,
  password: String, // For public access
  createdBy: { type: String, required: true },
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
  name: { type: String, required: true }, // e.g., "Villa/Penginapan", "Makanan & Minuman", "Transportasi"
  order: { type: Number, default: 0 },
})

// Expense Item Schema
const expenseItemSchema = new Schema({
  holidayPlanId: { type: Schema.Types.ObjectId, ref: 'HolidayPlan', required: true },
  categoryId: { type: Schema.Types.ObjectId, ref: 'ExpenseCategory', required: true },
  itemName: { type: String, required: true },
  detail: String,
  price: { type: Number, required: true },
  quantity: { type: Number, default: 1 },
  total: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
})

// Participant Schema
const participantSchema = new Schema({
  holidayPlanId: { type: Schema.Types.ObjectId, ref: 'HolidayPlan', required: true },
  name: { type: String, required: true },
  order: { type: Number, default: 0 },
})

// Contribution/Iuran Schema
const contributionSchema = new Schema({
  holidayPlanId: { type: Schema.Types.ObjectId, ref: 'HolidayPlan', required: true },
  participantId: { type: Schema.Types.ObjectId, ref: 'Participant', required: true },
  amount: { type: Number, required: true },
  isPaid: { type: Boolean, default: false },
  paidAt: Date,
  type: { type: String, enum: ['nominal', 'bakaran'], default: 'nominal' }, // nominal or bakaran (food)
})

// Split Payment Schema (for splitting specific expenses)
const splitPaymentSchema = new Schema({
  holidayPlanId: { type: Schema.Types.ObjectId, ref: 'HolidayPlan', required: true },
  expenseItemId: { type: Schema.Types.ObjectId, ref: 'ExpenseItem', required: true },
  participantId: { type: Schema.Types.ObjectId, ref: 'Participant', required: true },
  amount: { type: Number, required: true },
})

// Export models
export const HolidayPlan = mongoose.models.HolidayPlan || mongoose.model('HolidayPlan', holidayPlanSchema)
export const Rundown = mongoose.models.Rundown || mongoose.model('Rundown', rundownSchema)
export const ExpenseCategory = mongoose.models.ExpenseCategory || mongoose.model('ExpenseCategory', expenseCategorySchema)
export const ExpenseItem = mongoose.models.ExpenseItem || mongoose.model('ExpenseItem', expenseItemSchema)
export const Participant = mongoose.models.Participant || mongoose.model('Participant', participantSchema)
export const Contribution = mongoose.models.Contribution || mongoose.model('Contribution', contributionSchema)
export const SplitPayment = mongoose.models.SplitPayment || mongoose.model('SplitPayment', splitPaymentSchema)
