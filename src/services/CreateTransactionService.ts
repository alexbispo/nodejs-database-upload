// import AppError from '../errors/AppError';

import { getRepository, getManager, getCustomRepository } from 'typeorm';
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
  }: CreateTransactionDto): Promise<Transaction | null> {
    let newTransaction = null;

    await getManager().transaction(async em => {
      const categoriesRepository = getRepository(Category);

      let category = await categoriesRepository.findOne({
        where: { title: categoryTitle },
      });

      if (!category) {
        category = categoriesRepository.create({ title: categoryTitle });
        category = await em.save(category);
      }

      const transacrionsRespository = getCustomRepository(
        TransactionsRepository,
      );

      newTransaction = transacrionsRespository.create({
        title,
        type,
        value,
        category,
      });

      newTransaction = await em.save(newTransaction);
    });

    return newTransaction;
  }
}

export default CreateTransactionService;
