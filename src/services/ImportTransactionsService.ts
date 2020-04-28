import fs from 'fs';
import parse from 'csv-parse';
import Transaction from '../models/Transaction';
import CreateTransactionService from './CreateTransactionService';

interface ImportedTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  categoryTitle: string;
}

class ImportTransactionsService {
  async execute(path: string): Promise<Transaction[]> {
    const createTransactionService = new CreateTransactionService();

    const readTransactionsPromise = new Promise<ImportedTransaction[]>(
      (resolve, reject) => {
        const transactions: ImportedTransaction[] = [];

        fs.createReadStream(path)
          .pipe(
            parse({
              from_line: 2,
            }),
          )
          .on('data', row => {
            const [title, type, value, category] = row;

            transactions.push({
              title: title.trim(),
              type: type.trim(),
              value,
              categoryTitle: category.trim(),
            });
          })
          .on('error', err => {
            reject(err);
          })
          .on('end', () => {
            resolve(transactions);
          });
      },
    );

    const records = await readTransactionsPromise;

    const transactions = await createTransactionService.execute(records);

    const exitsFileInPath = await fs.promises.stat(path);

    if (exitsFileInPath) {
      await fs.promises.unlink(path);
    }

    return transactions;
  }
}

export default ImportTransactionsService;
