import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CartService, CartCache } from './cart.service';
import { PaymentsService } from '../payments/payments.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { CartCheckoutDto } from './dto/cart-checkout.dto';

@ApiTags('Cart')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT.' })
@Controller('cart')
export class CartController {
  constructor(
    private readonly cartService: CartService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get cart items with total' })
  @ApiResponse({ status: 200, description: 'Cart items retrieved.' })
  async getCart(@Req() req: { user: { id: string } }): Promise<CartCache> {
    return this.cartService.getCart(req.user.id);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get cart item count for badge' })
  @ApiResponse({ status: 200, description: 'Cart count retrieved.' })
  async getCartCount(
    @Req() req: { user: { id: string } },
  ): Promise<{ count: number }> {
    const count = await this.cartService.getCartCount(req.user.id);
    return { count };
  }

  @Post()
  @ApiOperation({ summary: 'Add course to cart' })
  @ApiBody({ type: AddToCartDto })
  @ApiResponse({ status: 201, description: 'Course added to cart.' })
  async addItem(
    @Req() req: { user: { id: string } },
    @Body() dto: AddToCartDto,
  ): Promise<CartCache> {
    return this.cartService.addItem(req.user.id, dto.courseId);
  }

  @Delete(':courseId')
  @ApiOperation({ summary: 'Remove course from cart' })
  @ApiParam({
    name: 'courseId',
    description: 'UUID of the course to remove',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Course removed from cart.' })
  async removeItem(
    @Req() req: { user: { id: string } },
    @Param('courseId') courseId: string,
  ): Promise<CartCache> {
    return this.cartService.removeItem(req.user.id, courseId);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear entire cart' })
  @ApiResponse({ status: 200, description: 'Cart cleared.' })
  async clearCart(@Req() req: { user: { id: string } }) {
    await this.cartService.clearCart(req.user.id);
    return { success: true };
  }

  @Post('checkout')
  @ApiOperation({
    summary: 'Checkout all items in cart with single Braintree payment',
  })
  @ApiBody({ type: CartCheckoutDto })
  @ApiResponse({ status: 201, description: 'Cart checkout completed.' })
  async checkout(
    @Req() req: { user: { id: string } },
    @Body() dto: CartCheckoutDto,
  ) {
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
