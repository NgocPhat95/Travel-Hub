import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * RoleGuard được sử dụng để kiểm tra quyền hạn của người dùng.
 * Guard này yêu cầu người dùng phải được xác thực trước đó (thông qua JwtAuthGuard)
 * và thuộc tính role trong thông tin người dùng (request.user) phải là 'SUPER_ADMIN'.
 * 
 * Cách hoạt động:
 * 1. Lấy đối tượng request từ context của HTTP request.
 * 2. Lấy thông tin user (đã được JwtStrategy đính kèm vào request sau khi xác thực token thành công).
 * 3. Kiểm tra xem user có tồn tại và có trường role bằng 'SUPER_ADMIN' hay không.
 * 4. Nếu thỏa mãn, trả về true cho phép truy cập. Ngược lại, ném ra lỗi ForbiddenException (403).
 */
@Injectable()
export class RoleGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Kiểm tra xem user đã đăng nhập chưa và có vai trò là SUPER_ADMIN không
    if (!user || user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Quyền truy cập bị từ chối. Chỉ quản trị viên cấp cao (SUPER_ADMIN) mới có quyền thực hiện hành động này.',
      );
    }

    return true;
  }
}
