import dayjs from 'dayjs'
import { billAPI, repaymentAPI } from '@/services/api'
import { getPreferences } from '@/services/preferences'

export async function settleBillWithAutoRepayment(bill, options = {}) {
  const paidDate = options.paidDate || dayjs().format('YYYY-MM-DD')

  await billAPI.markAsPaid(bill.id, paidDate)

  const prefs = getPreferences()
  if (!prefs.autoRepaymentOnMarkPaid) {
    return { paidDate, autoRepaymentCreated: false, autoRepaymentError: null }
  }

  try {
    await repaymentAPI.create({
      bill_id: bill.id,
      amount: Number(bill.amount || 0),
      interest: Number(bill.interest || 0),
      repayment_date: paidDate,
      notes: '自动记录：账单标记为已还'
    })

    return { paidDate, autoRepaymentCreated: true, autoRepaymentError: null }
  } catch (error) {
    return { paidDate, autoRepaymentCreated: false, autoRepaymentError: error }
  }
}
