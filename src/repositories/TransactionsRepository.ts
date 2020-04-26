import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

interface TransactionSummaryDto {
  transactions: Transaction[];
  balance: Balance;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<TransactionSummaryDto> {
    const transactions = await this.find();

    let balance: Balance = {
      income: 0,
      outcome: 0,
      total: 0,
    };

    balance = transactions.reduce((acc, transaction) => {
      if (transaction.isIncome()) {
        acc.income += transaction.value;
      } else if (transaction.isOutcome()) {
        acc.outcome += transaction.value;
      }

      return acc;
    }, balance);

    balance.total = balance.income - balance.outcome;

    return { transactions, balance };
  }
}

export default TransactionsRepository;
