import { IsArray, IsString, IsInt, Min, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class WaypointOrder {
  @ApiProperty({ description: 'Waypoint ID' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'New sequence number' })
  @IsInt()
  @Min(1)
  sequence: number;
}

export class ReorderWaypointsDto {
  @ApiProperty({ description: 'Array of waypoint IDs with new sequences', type: [WaypointOrder] })
  @IsArray()
  @ArrayMinSize(1)
  @Type(() => WaypointOrder)
  waypoints: WaypointOrder[];
}
