import { Router } from 'express';

// import TransactionsRepository from '../repositories/TransactionsRepository';
import { getCustomRepository } from 'typeorm';
import CreateTransactionService from '../services/CreateTransactionService';
import TransactionsRepository from '../repositories/TransactionsRepository';
// import DeleteTransactionService from '../services/DeleteTransactionService';
// import ImportTransactionsService from '../services/ImportTransactionsService';

const transactionsRouter = Router();

transactionsRouter.get('/', async (_, resp) => {
  const transactionsRepository = getCustomRepository(TransactionsRepository);

  const transactions = await transactionsRepository.find();

  const balance = await transactionsRepository.getBalance(transactions);

  resp.json({ transactions, balance });
});

transactionsRouter.post('/', async (req, resp) => {
  const { title, type, value, category } = req.body;

  const createTransactionService = new CreateTransactionService();

  const newTransaction = await createTransactionService.execute({
    title,
    type,
    value,
    categoryTitle: category,
  });

  return resp.json(newTransaction);
});

// transactionsRouter.delete('/:id', async (request, response) => {
//   // TODO
// });

// transactionsRouter.post('/import', async (request, response) => {
//   // TODO
// });

export default transactionsRouter;
