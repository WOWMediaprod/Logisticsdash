import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async create(createClientDto: CreateClientDto) {
    try {
      const client = await this.prisma.client.create({
        data: {
          companyId: createClientDto.companyId,
          name: createClientDto.name,
          code: createClientDto.code,
          terms: createClientDto.terms,
          isActive: createClientDto.isActive !== undefined ? createClientDto.isActive : true,
        },
      });

      return { success: true, data: client };
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  }

  async findAll(companyId: string) {
    const clients = await this.prisma.client.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        code: true,
        terms: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    });

    return { success: true, data: clients };
  }

  async findOne(id: string, companyId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, companyId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return { success: true, data: client };
  }

  async update(id: string, companyId: string, updateClientDto: UpdateClientDto) {
    const client = await this.prisma.client.findFirst({
      where: { id, companyId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    const updatedClient = await this.prisma.client.update({
      where: { id },
      data: {
        name: updateClientDto.name,
        code: updateClientDto.code,
        terms: updateClientDto.terms,
        isActive: updateClientDto.isActive,
      },
    });

    return { success: true, data: updatedClient };
  }

  async remove(id: string, companyId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, companyId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    await this.prisma.client.delete({ where: { id } });

    return { success: true, message: 'Client deleted successfully' };
  }
}
