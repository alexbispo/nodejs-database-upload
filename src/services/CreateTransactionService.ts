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
  public async execute({
    title,
    type,
    value,
    categoryTitle,
  }: CreateTransactionDto): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const balance = await transactionsRepository.getBalance();

    if (type === 'outcome' && balance.total < value) {
      throw new AppError('Invalid outcome transaction');
    }

    const categoriesRepository = getRepository(Category);

    let category = await categoriesRepository.findOne({
      where: { title: categoryTitle },
    });

    if (!category) {
      category = categoriesRepository.create({ title: categoryTitle });
      category = await categoriesRepository.save(category);
    }

    const newTransaction = transactionsRepository.create({
      title,
      type,
      value,
      category,
    });

    await transactionsRepository.save(newTransaction);

    // await getManager().transaction(async em => {
    // });

    return newTransaction;
  }

  public async executeMany(
    transactions: CreateTransactionDto[],
  ): Promise<Transaction[]> {
    const categoriesRepository = getRepository(Category);
    const newCategories = transactions.map(tr =>
      categoriesRepository.create({ title: tr.categoryTitle }),
    );

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

    const transactionsRepository = getCustomRepository(TransactionsRepository);

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
