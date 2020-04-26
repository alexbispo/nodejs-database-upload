import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(transactions?: Transaction[]): Promise<Balance> {
    const allTransactions = transactions || (await this.find());

    let balance: Balance = {
      income: 0,
      outcome: 0,
      total: 0,
    };

    balance = allTransactions.reduce((acc, transaction) => {
      if (transaction.isIncome()) {
        acc.income += transaction.value;
      } else if (transaction.isOutcome()) {
        acc.outcome += transaction.value;
      }

      return acc;
    }, balance);

    balance.total = balance.income - balance.outcome;

    return balance;
  }
}

export default TransactionsRepository;
