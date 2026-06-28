import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../entities/enum/users.enum';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let mockReflector: jest.Mocked<Reflector>;

  const mockExecutionContext = (overrides?: {
    isPublic?: boolean;
    roles?: UserRole[];
    user?: { role: UserRole } | null;
  }) => {
    const isPublic = overrides?.isPublic ?? false;
    const roles = overrides?.roles;
    const user = overrides?.user ?? null;

    const handler = jest.fn();
    if (roles) {
      Reflect.defineMetadata('roles', roles, handler);
    }
    if (isPublic) {
      Reflect.defineMetadata('isPublic', true, handler);
    }

    return {
      getHandler: () => handler,
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as any;
  };

  beforeEach(() => {
    mockReflector = {
      getAllAndOverride: jest.fn(),
    } as any;
    guard = new RolesGuard(mockReflector);
  });

  it('should bypass when @Public() is set', () => {
    mockReflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === 'isPublic') return true;
      return undefined;
    });

    const result = guard.canActivate(mockExecutionContext({ isPublic: true }));

    expect(result).toBe(true);
  });

  it('should allow access when no @Roles() decorator is present', () => {
    mockReflector.getAllAndOverride.mockReturnValue(undefined);

    const result = guard.canActivate(
      mockExecutionContext({ user: { role: UserRole.STUDENT } }),
    );

    expect(result).toBe(true);
  });

  it('should allow access when user has a valid role', () => {
    mockReflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === 'isPublic') return false;
      if (key === 'roles') return [UserRole.INSTRUCTOR, UserRole.ADMIN];
      return undefined;
    });

    const result = guard.canActivate(
      mockExecutionContext({ user: { role: UserRole.INSTRUCTOR } }),
    );

    expect(result).toBe(true);
  });

  it('should deny access when user role is not in required roles', () => {
    mockReflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === 'isPublic') return false;
      if (key === 'roles') return [UserRole.INSTRUCTOR, UserRole.ADMIN];
      return undefined;
    });

    const result = guard.canActivate(
      mockExecutionContext({ user: { role: UserRole.STUDENT } }),
    );

    expect(result).toBe(false);
  });

  it('should deny access when user is not present on request', () => {
    mockReflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === 'isPublic') return false;
      if (key === 'roles') return [UserRole.INSTRUCTOR];
      return undefined;
    });

    const result = guard.canActivate(mockExecutionContext({ user: null }));

    expect(result).toBe(false);
  });
});
