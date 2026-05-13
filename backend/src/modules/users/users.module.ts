import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from '../../common/entities/users.entity';
import { UserProviders } from 'src/common/entities/user_providers.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserProviders])],
  controllers: [UsersController],
  providers: [UsersService],
  // UsersService viene esportato perché AuthModule ne ha bisogno
  // per findByEmail() (login) e findById() (JwtStrategy).
  exports: [UsersService],
})
export class UsersModule {}
