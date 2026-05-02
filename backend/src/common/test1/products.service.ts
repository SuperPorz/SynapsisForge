// prettier-ignore
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly repo: Repository<Product>,
  ) {}

  findAll() {
    return this.repo.find();
  }

  async findOne(id: number) {
    const product = await this.repo.findOne({ where: { id } });
    if (!product) throw new NotFoundException(`Product #${id} not found`);
    return product;
  }

  create(name: string) {
    // TypeORM lancia QueryFailedError se name è duplicato → filtro → 409
    return this.repo.save(this.repo.create({ name }));
  }

  async remove(id: number) {
    if (id === 999) throw new ForbiddenException('Cannot delete this product');
    const product = await this.findOne(id);
    return this.repo.remove(product);
  }
}
