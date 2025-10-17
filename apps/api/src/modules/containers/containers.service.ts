import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateContainerDto } from './dto/create-container.dto';
import { UpdateContainerDto } from './dto/update-container.dto';

@Injectable()
export class ContainersService {
  constructor(private prisma: PrismaService) {}

  async create(createContainerDto: CreateContainerDto) {
    const container = await this.prisma.container.create({
      data: {
        companyId: createContainerDto.companyId,
        iso: createContainerDto.iso,
        size: createContainerDto.size,
        owner: createContainerDto.owner,
        checkOk: createContainerDto.checkOk !== undefined ? createContainerDto.checkOk : false,
      },
    });

    return {
      success: true,
      data: container,
    };
  }

  async findAll(companyId: string, checkOk?: boolean) {
    const where: any = { companyId };

    if (checkOk !== undefined) {
      where.checkOk = checkOk;
    }

    const containers = await this.prisma.container.findMany({
      where,
      select: {
        id: true,
        iso: true,
        size: true,
        owner: true,
        checkOk: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { iso: 'asc' },
    });

    return {
      success: true,
      data: containers,
    };
  }

  async findOne(id: string, companyId: string) {
    const container = await this.prisma.container.findFirst({
      where: { id, companyId },
    });

    if (!container) {
      throw new NotFoundException('Container not found');
    }

    return {
      success: true,
      data: container,
    };
  }

  async update(id: string, companyId: string, updateContainerDto: UpdateContainerDto) {
    const container = await this.prisma.container.findFirst({
      where: { id, companyId },
    });

    if (!container) {
      throw new NotFoundException('Container not found');
    }

    const updatedContainer = await this.prisma.container.update({
      where: { id },
      data: {
        iso: updateContainerDto.iso,
        size: updateContainerDto.size,
        owner: updateContainerDto.owner,
        checkOk: updateContainerDto.checkOk,
      },
    });

    return {
      success: true,
      data: updatedContainer,
    };
  }

  async remove(id: string, companyId: string) {
    const container = await this.prisma.container.findFirst({
      where: { id, companyId },
    });

    if (!container) {
      throw new NotFoundException('Container not found');
    }

    await this.prisma.container.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Container deleted successfully',
    };
  }
}
