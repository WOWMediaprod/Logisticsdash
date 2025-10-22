import { PartialType } from '@nestjs/swagger';
import { CreateWaypointDto } from './create-waypoint.dto';

export class UpdateWaypointDto extends PartialType(CreateWaypointDto) {}
