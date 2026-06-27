import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RoleGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard/stats')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // ======================= QUẢN LÝ NGƯỜI DÙNG =======================

  @Get('users')
  getAllUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.adminService.getAllUsers(pageNum, limitNum, search, status);
  }

  @Get('users/:id')
  getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Post('users/:id/warning')
  sendWarning(
    @Param('id') id: string,
    @Body() body: { message: string; severity?: 'LOW' | 'MEDIUM' | 'HIGH' },
  ) {
    return this.adminService.sendWarning(id, body.message, body.severity || 'LOW');
  }

  @Post('users/:id/unban')
  unbanUser(@Param('id') id: string) {
    return this.adminService.unbanUser(id);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  // ======================= THÔNG BÁO VI PHẠM & KIỂM DUYỆT =======================

  @Get('moderation/violations')
  getViolationNotifications() {
    return this.adminService.getViolationNotifications();
  }

  @Delete('moderation/posts/:id')
  deleteViolatingPost(@Param('id') id: string) {
    return this.adminService.deleteViolatingPost(id);
  }

  @Delete('moderation/comments/:id')
  deleteViolatingComment(@Param('id') id: string) {
    return this.adminService.deleteViolatingComment(id);
  }

  // Manage Places CRUD
  @Get('places')
  getPlaces() {
    return this.adminService.getPlaces();
  }

  @Post('places')
  createPlace(@Body() data: any) {
    return this.adminService.createPlace(data);
  }

  @Put('places/:id')
  updatePlace(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updatePlace(id, data);
  }

  @Delete('places/:id')
  deletePlace(@Param('id') id: string) {
    return this.adminService.deletePlace(id);
  }

  // Edit Suggestions
  @Get('edit-suggestions')
  getEditSuggestions() {
    return this.adminService.getEditSuggestions();
  }

  @Post('edit-suggestions/:id/approve')
  approveEditSuggestion(@Param('id') id: string) {
    return this.adminService.approveEditSuggestion(id);
  }

  @Post('edit-suggestions/:id/reject')
  rejectEditSuggestion(@Param('id') id: string) {
    return this.adminService.rejectEditSuggestion(id);
  }

  // Content Moderation (Reported Reviews)
  @Get('moderation/reported-reviews')
  getReportedReviews() {
    return this.adminService.getReportedReviews();
  }

  @Post('moderation/reviews/:id/keep')
  keepReportedReview(@Param('id') id: string) {
    return this.adminService.keepReportedReview(id);
  }

  @Post('moderation/reviews/:id/hide')
  hideReportedReview(@Param('id') id: string) {
    return this.adminService.hideReportedReview(id);
  }

  @Post('moderation/users/:id/ban')
  banUser(@Param('id') id: string) {
    return this.adminService.banUser(id);
  }
}
