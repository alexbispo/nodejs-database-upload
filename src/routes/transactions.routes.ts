import { Router } from 'express';

import multer from 'multer';
import { getCustomRepository } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';
import configUpload from '../config/upload';

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

  const [newTransaction] = await createTransactionService.execute([
    {
      title,
      type,
      value,
      categoryTitle: category,
    },
  ]);

  return resp.json(newTransaction);
});

transactionsRouter.delete('/:id', async (req, resp) => {
  const { id } = req.params;

  const deleteTransactionService = new DeleteTransactionService();

  await deleteTransactionService.execute(id);

  resp.status(204).end();
});

const upload = multer(configUpload);

transactionsRouter.post('/import', upload.single('file'), async (req, resp) => {
  const importTransactionsService = new ImportTransactionsService();

  await importTransactionsService.execute(req.file.path);

  resp.status(204).end();
});

export default transactionsRouter;
