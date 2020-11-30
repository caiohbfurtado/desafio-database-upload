import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';
import Transaction from '../models/Transaction';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category = 'Outros',
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);
    const balance = await transactionsRepository.getBalance();

    if (value <= 0 || !value || !title || !type || !category) {
      throw new AppError(
        'Não foi possível efetuar a transação. Verifique os dados e tente novamente.',
        400,
      );
    }

    if (type === 'outcome') {
      if (balance.total <= value) {
        throw new AppError('Não há saldo suficiente.', 400);
      }
    }

    const categoryExists = await categoriesRepository.findOne({
      where: { title: category },
    });

    if (!categoryExists) {
      const newCategory = categoriesRepository.create({ title: category });
      await categoriesRepository.save(newCategory);

      const transaction = transactionsRepository.create({
        title,
        value,
        type,
        category_id: newCategory.id,
      });

      await transactionsRepository.save(transaction);

      return transaction;
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id: categoryExists.id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
