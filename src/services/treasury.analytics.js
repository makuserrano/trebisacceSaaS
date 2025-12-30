import { getAccounts } from './accounts.service.js';
import {
  getAccountBalances,
  getDailyNetSeries,
  getExpenseByCategory,
  getIncomeByAccount,
  getTransactionsSummary,
} from './transactions.service.js';
import { getPaymentsSummary } from './payments.service.js';

export async function getTreasuryOverview({ startDate, endDate } = {}) {
  const [accounts, balances, summary, dailyNet, expenseByCategory, incomeByAccount, payments] =
    await Promise.all([
      getAccounts(),
      getAccountBalances(),
      getTransactionsSummary({ startDate, endDate }),
      getDailyNetSeries({ startDate, endDate }),
      getExpenseByCategory({ startDate, endDate }),
      getIncomeByAccount({ startDate, endDate }),
      getPaymentsSummary({ startDate, endDate }),
    ]);

  const totalBalance = Object.values(balances).reduce(
    (acc, value) => acc + (Number(value) || 0),
    0
  );

  return {
    accounts,
    balances,
    kpis: {
      totalBalance,
      income: summary.income,
      expense: summary.expense,
      net: summary.income - summary.expense,
    },
    dailyNet,
    expenseByCategory,
    incomeByAccount,
    paymentsByMethod: payments.byMethod || [],
  };
}
