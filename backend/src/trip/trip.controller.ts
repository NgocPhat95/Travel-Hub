import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TripService } from './trip.service';
import { CreateTripDto, AddTripItemDto, ReorderTripItemsDto, AddCollaboratorDto } from './dto/trip.dto';

@Controller('trips')
@UseGuards(JwtAuthGuard)
export class TripController {
  constructor(private readonly tripService: TripService) {}

  @Post()
  createTrip(@Request() req: any, @Body() dto: CreateTripDto) {
    return this.tripService.createTrip(req.user.sub, dto);
  }

  @Get()
  getTrips(@Request() req: any) {
    return this.tripService.getTrips(req.user.sub);
  }

  @Get(':id')
  getTripDetail(@Param('id') id: string, @Request() req: any) {
    return this.tripService.getTripDetail(id, req.user.sub);
  }

  @Delete(':id')
  deleteTrip(@Param('id') id: string, @Request() req: any) {
    return this.tripService.deleteTrip(id, req.user.sub);
  }

  @Post(':id/items')
  addTripItem(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: AddTripItemDto,
  ) {
    return this.tripService.addTripItem(id, req.user.sub, dto);
  }

  @Delete(':id/items/:itemId')
  deleteTripItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Request() req: any,
  ) {
    return this.tripService.deleteTripItem(id, itemId, req.user.sub);
  }

  @Patch(':id/items/reorder')
  reorderTripItems(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: ReorderTripItemsDto,
  ) {
    return this.tripService.reorderTripItems(id, req.user.sub, dto);
  }

  @Post(':id/collaborators')
  addCollaborator(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: AddCollaboratorDto,
  ) {
    return this.tripService.addCollaborator(id, req.user.sub, dto);
  }

  @Delete(':id/collaborators/:userId')
  removeCollaborator(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Request() req: any,
  ) {
    return this.tripService.removeCollaborator(id, req.user.sub, userId);
  }
}
