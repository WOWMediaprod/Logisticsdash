import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateBillDto, BillStatus } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import { BillQueryDto } from './dto/bill-query.dto';

@Injectable()
export class BillsService {
  constructor(private prisma: PrismaService) {}

  async create(createBillDto: CreateBillDto, companyId: string) {
    // Verify job exists and belongs to company
    const job = await this.prisma.job.findFirst({
      where: { id: createBillDto.jobId, companyId },
    });

    if (!job) {
      throw new NotFoundException('Job not found or does not belong to your company');
    }

    // Check if bill already exists for this job
    const existingBill = await this.prisma.bill.findUnique({
      where: { jobId: createBillDto.jobId },
    });

    if (existingBill) {
      throw new BadRequestException('A bill already exists for this job');
    }

    // Generate unique invoice number
    const invoiceNo = await this.generateBillNumber(companyId);

    const bill = await this.prisma.bill.create({
      data: {
        companyId,
        jobId: createBillDto.jobId,
        invoiceNo, // Changed from billNumber
        amount: createBillDto.amount,
        tax: 0, // Required field in schema
        total: createBillDto.amount, // Required field in schema
        // currency: createBillDto.currency || 'INR', // Field doesn't exist in schema
        status: createBillDto.status || BillStatus.DRAFT,
        // issuedDate: createBillDto.issuedDate ? new Date(createBillDto.issuedDate) : null, // Field doesn't exist
        dueDate: createBillDto.dueDate ? new Date(createBillDto.dueDate) : null,
        // attachedDocumentIds: createBillDto.attachedDocumentIds, // Field doesn't exist
        // notes: createBillDto.notes, // Field doesn't exist
      },
      include: {
        job: {
          include: {
            client: true,
            route: true,
            driver: true,
            vehicle: true,
          },
        },
      },
    });

    return { success: true, data: bill };
  }

  async findAll(query: BillQueryDto, companyId: string) {
    const { status, jobId, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = { companyId };

    if (status) {
      where.status = status;
    }

    if (jobId) {
      where.jobId = jobId;
    }

    const [bills, total] = await Promise.all([
      this.prisma.bill.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          job: {
            include: {
              client: { select: { name: true, code: true } },
              route: { select: { code: true, origin: true, destination: true } },
              driver: { select: { name: true, phone: true } },
              vehicle: { select: { regNo: true, class: true } },
            },
          },
        },
      }),
      this.prisma.bill.count({ where }),
    ]);

    return {
      success: true,
      data: bills,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, companyId: string) {
    const bill = await this.prisma.bill.findFirst({
      where: { id, companyId },
      include: {
        job: {
          include: {
            client: true,
            route: true,
            driver: true,
            vehicle: true,
            waypoints: true,
            documents: true,
          },
        },
      },
    });

    if (!bill) {
      throw new NotFoundException('Bill not found');
    }

    return { success: true, data: bill };
  }

  async update(id: string, updateBillDto: UpdateBillDto, companyId: string) {
    await this.ensureBillExists(id, companyId);

    const updateData: any = {};

    if (updateBillDto.amount !== undefined) updateData.amount = updateBillDto.amount;
    if (updateBillDto.currency !== undefined) updateData.currency = updateBillDto.currency;
    if (updateBillDto.status !== undefined) updateData.status = updateBillDto.status;
    if (updateBillDto.notes !== undefined) updateData.notes = updateBillDto.notes;
    if (updateBillDto.attachedDocumentIds !== undefined) {
      updateData.attachedDocumentIds = updateBillDto.attachedDocumentIds;
    }
    if (updateBillDto.issuedDate !== undefined) {
      updateData.issuedDate = updateBillDto.issuedDate ? new Date(updateBillDto.issuedDate) : null;
    }
    if (updateBillDto.dueDate !== undefined) {
      updateData.dueDate = updateBillDto.dueDate ? new Date(updateBillDto.dueDate) : null;
    }
    if (updateBillDto.paidDate !== undefined) {
      updateData.paidAt = updateBillDto.paidDate ? new Date(updateBillDto.paidDate) : null; // Changed from paidDate to paidAt
    }

    const updatedBill = await this.prisma.bill.update({
      where: { id },
      data: updateData,
      include: {
        job: {
          include: {
            client: true,
            route: true,
            driver: true,
            vehicle: true,
          },
        },
      },
    });

    return { success: true, data: updatedBill };
  }

  async markAsSent(id: string, companyId: string) {
    await this.ensureBillExists(id, companyId);

    const updatedBill = await this.prisma.bill.update({
      where: { id },
      data: {
        status: BillStatus.SENT,
        // sentToClient: true, // Field doesn't exist in schema
        // sentAt: new Date(), // Field doesn't exist in schema
      },
      include: {
        job: {
          include: {
            client: true,
            route: true,
            driver: true,
            vehicle: true,
          },
        },
      },
    });

    return { success: true, data: updatedBill };
  }

  async markAsPaid(id: string, companyId: string, paidDate?: string) {
    await this.ensureBillExists(id, companyId);

    const updatedBill = await this.prisma.bill.update({
      where: { id },
      data: {
        status: BillStatus.PAID,
        paidAt: paidDate ? new Date(paidDate) : new Date(), // Changed from paidDate to paidAt
      },
      include: {
        job: {
          include: {
            client: true,
            route: true,
            driver: true,
            vehicle: true,
          },
        },
      },
    });

    return { success: true, data: updatedBill };
  }

  async remove(id: string, companyId: string) {
    await this.ensureBillExists(id, companyId);

    await this.prisma.bill.delete({ where: { id } });

    return { success: true, message: 'Bill deleted successfully' };
  }

  async getStats(companyId: string) {
    const [totalBills, draftBills, issuedBills, paidBills, overdueBills, totalRevenue] = await Promise.all([
      this.prisma.bill.count({ where: { companyId } }),
      this.prisma.bill.count({ where: { companyId, status: BillStatus.DRAFT } }),
      this.prisma.bill.count({ where: { companyId, status: BillStatus.ISSUED } }),
      this.prisma.bill.count({ where: { companyId, status: BillStatus.PAID } }),
      this.prisma.bill.count({ where: { companyId, status: BillStatus.OVERDUE } }),
      this.prisma.bill.aggregate({
        where: { companyId, status: BillStatus.PAID },
        _sum: { amount: true },
      }),
    ]);

    return {
      success: true,
      data: {
        totalBills,
        draftBills,
        issuedBills,
        paidBills,
        overdueBills,
        totalRevenue: totalRevenue._sum.amount || 0,
      },
    };
  }

  private async ensureBillExists(id: string, companyId: string) {
    const bill = await this.prisma.bill.findFirst({
      where: { id, companyId },
    });

    if (!bill) {
      throw new NotFoundException('Bill not found');
    }

    return bill;
  }

  private async generateBillNumber(companyId: string): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');

    // Get count of bills for this company this month
    const count = await this.prisma.bill.count({
      where: {
        companyId,
        createdAt: {
          gte: new Date(`${year}-${month}-01`),
        },
      },
    });

    const sequence = String(count + 1).padStart(4, '0');
    return `INV-${year}${month}-${sequence}`; // Generate invoice number format
  }
}
