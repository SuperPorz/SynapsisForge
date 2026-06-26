import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { PaymentsService } from '../payments/payments.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { CartCheckoutDto } from './dto/cart-checkout.dto';

@ApiTags('cart')
@Controller('cart')
export class CartController {
  constructor(
    private readonly cartService: CartService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get cart items with total' })
  async getCart(@Req() req: any) {
    return this.cartService.getCart(req.user.id);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get cart item count for badge' })
  async getCartCount(@Req() req: any) {
    const count = await this.cartService.getCartCount(req.user.id);
    return { count };
  }

  @Post()
  @ApiOperation({ summary: 'Add course to cart' })
  async addItem(@Req() req: any, @Body() dto: AddToCartDto) {
    return this.cartService.addItem(req.user.id, dto.courseId);
  }

  @Delete(':courseId')
  @ApiOperation({ summary: 'Remove course from cart' })
  async removeItem(@Req() req: any, @Param('courseId') courseId: string) {
    return this.cartService.removeItem(req.user.id, courseId);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear entire cart' })
  async clearCart(@Req() req: any) {
    await this.cartService.clearCart(req.user.id);
    return { success: true };
  }

  @Post('checkout')
  @ApiOperation({
    summary: 'Checkout all items in cart with single Braintree payment',
  })
  async checkout(@Req() req: any, @Body() dto: CartCheckoutDto) {
    const { items } = await this.cartService.validateForCheckout(req.user.id);
    const courseItems = items.map((i) => ({
      courseId: i.course.id,
      price: Number(i.course.price),
    }));
    const result = await this.paymentsService.cartCheckout(
      req.user.id,
      courseItems,
      dto.nonce,
    );
    await this.cartService.clearCart(req.user.id);
    return result;
  }
}
