import { getRepository, getCustomRepository, In, getConnection } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface CreateTransactionDto {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  categoryTitle: string;
}

class CreateTransactionService {
  public async execute(
    transactions: CreateTransactionDto[],
  ): Promise<Transaction[]> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    let balance = await transactionsRepository.getBalance();

    // TODO move this logic to getBalance method.
    balance = transactions.reduce((acc, { type, value }) => {
      if (type === 'income') {
        acc.income += value;
      } else if (type === 'outcome') {
        acc.outcome += value;
      }
      return acc;
    }, balance);

    balance.total += balance.income - balance.outcome;

    const invalidTransactionIndex = transactions.findIndex(
      ({ type, value }) => type === 'outcome' && value > balance.total,
    );

    if (invalidTransactionIndex > -1) {
      throw new AppError('Invalid outcome transaction');
    }

    const categoriesRepository = getRepository(Category);
    const newCategories = transactions.map(tr =>
      categoriesRepository.create({ title: tr.categoryTitle }),
    );

    // TODO maybe move all database changes to a same transaction
    const conn = getConnection();

    await conn
      .createQueryBuilder()
      .insert()
      .into(Category)
      .values(newCategories)
      .onConflict(`("title") DO NOTHING`)
      .execute();

    const categoryTitles = newCategories.map(cate => cate.title);

    const persistedCategories = await categoriesRepository.find({
      title: In(categoryTitles),
    });

    const newTransactions = transactions.map(
      ({ title, type, value, categoryTitle }) => {
        const category = persistedCategories.find(
          cate => cate.title === categoryTitle,
        );

        return transactionsRepository.create({ title, type, value, category });
      },
    );

    const result = await transactionsRepository.save(newTransactions);

    return result;
  }
}

export default CreateTransactionService;
