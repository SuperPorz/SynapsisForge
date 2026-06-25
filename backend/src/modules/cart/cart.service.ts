// prettier-ignore
import { BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { CartItem } from 'src/common/entities/cart-item.entity';
import { Course } from 'src/common/entities/courses.entity';
import { Status as CourseStatus } from 'src/common/entities/enum/courses.enum';
import { Enrollment } from 'src/common/entities/enrollments.entity';
import { StudentProfile } from 'src/common/entities/student-profile.entity';

const CART_CACHE_TTL = 3600;

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    @InjectRepository(CartItem)
    private cartRepository: Repository<CartItem>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(StudentProfile)
    private studentProfileRepository: Repository<StudentProfile>,
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  private cartCacheKey(userId: string) { return `sf:cart:${userId}`; }
  private cartCountKey(userId: string) { return `sf:cart:count:${userId}`; }

  private async invalidateCache(userId: string) {
    await Promise.all([
      this.cacheManager.del(this.cartCacheKey(userId)),
      this.cacheManager.del(this.cartCountKey(userId)),
    ]);
  }

  async getCart(userId: string) {
    const cacheKey = this.cartCacheKey(userId);
    const cached = await this.cacheManager.get<any>(cacheKey);
    if (cached) return cached;

    const items = await this.cartRepository.find({
      where: { user: { id: userId } },
      relations: ['course'],
      order: { added_at: 'ASC' },
    });

    const total = items.reduce((sum, item) => sum + Number(item.course.price), 0);
    const result = {
      items: items.map((item) => ({
        id: item.id,
        courseId: item.course.id,
        title: item.course.title,
        thumbnail_url: item.course.thumbnail_url,
        price: Number(item.course.price),
        added_at: item.added_at,
      })),
      total,
      count: items.length,
    };

    await this.cacheManager.set(cacheKey, result, CART_CACHE_TTL);
    return result;
  }

  async getCartCount(userId: string): Promise<number> {
    const cacheKey = this.cartCountKey(userId);
    const cached = await this.cacheManager.get<number>(cacheKey);
    if (cached !== undefined) return cached;

    const count = await this.cartRepository.count({
      where: { user: { id: userId } },
    });
    await this.cacheManager.set(cacheKey, count, CART_CACHE_TTL);
    return count;
  }

  async addItem(userId: string, courseId: string) {
    const course = await this.courseRepository.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException(`Course ${courseId} not found`);
    if (course.status !== CourseStatus.PUBLISHED) {
      throw new BadRequestException('Course is not available for purchase');
    }

    const existing = await this.cartRepository.findOne({
      where: { user: { id: userId }, course: { id: courseId } },
    });
    if (existing) throw new ConflictException('Course already in cart');

    const item = this.cartRepository.create({
      user: { id: userId } as any,
      course: { id: courseId } as any,
    });
    await this.cartRepository.save(item);
    await this.invalidateCache(userId);

    return this.getCart(userId);
  }

  async removeItem(userId: string, courseId: string) {
    const item = await this.cartRepository.findOne({
      where: { user: { id: userId }, course: { id: courseId } },
    });
    if (!item) throw new NotFoundException('Course not found in cart');
    await this.cartRepository.remove(item);
    await this.invalidateCache(userId);
    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    await this.cartRepository.delete({ user: { id: userId } });
    await this.invalidateCache(userId);
  }

  async validateForCheckout(userId: string) {
    const studentProfile = await this.studentProfileRepository.findOne({
      where: { userId },
      relations: ['user'],
    });
    if (!studentProfile) throw new NotFoundException('Student profile not found');

    const items = await this.cartRepository.find({
      where: { user: { id: userId } },
      relations: ['course'],
    });
    if (items.length === 0) throw new BadRequestException('Cart is empty');

    for (const item of items) {
      if (item.course.status !== CourseStatus.PUBLISHED) {
        throw new BadRequestException(`"${item.course.title}" is no longer available`);
      }
      const existing = await this.enrollmentRepository.findOne({
        where: { student: { userId }, course: { id: item.course.id } },
      });
      if (existing) {
        throw new ConflictException(`Already enrolled in "${item.course.title}"`);
      }
    }

    const total = items.reduce((sum, item) => sum + Number(item.course.price), 0);
    return { items, total, studentProfile };
  }
}
