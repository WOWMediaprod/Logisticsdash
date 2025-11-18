import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async create(createCompanyDto: CreateCompanyDto, userId: string) {
    const { name, isDefault = false, role = 'ADMIN' } = createCompanyDto;

    try {
      // Create company and link to user in a transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Create the company
        const company = await tx.company.create({
          data: {
            name,
            settings: {},
          },
        });

        // Create UserCompany relation
        await tx.userCompany.create({
          data: {
            userId,
            companyId: company.id,
            role,
            isDefault,
          },
        });

        // If this is set as default, unset other defaults for this user
        if (isDefault) {
          await tx.userCompany.updateMany({
            where: {
              userId,
              companyId: { not: company.id },
            },
            data: {
              isDefault: false,
            },
          });
        }

        return company;
      });

      return { success: true, data: result };
    } catch (error) {
      console.error('Failed to create company:', error);
      throw new BadRequestException('Failed to create company');
    }
  }

  async findAll(userId: string) {
    try {
      // Get all companies linked to this user via UserCompany
      const userCompanies = await this.prisma.userCompany.findMany({
        where: { userId },
        include: {
          company: true,
        },
        orderBy: [
          { isDefault: 'desc' }, // Default company first
          { createdAt: 'asc' },
        ],
      });

      const companies = userCompanies.map((uc) => ({
        ...uc.company,
        role: uc.role,
        isDefault: uc.isDefault,
        userCompanyId: uc.id,
      }));

      return { success: true, data: companies };
    } catch (error) {
      console.error('Failed to fetch companies:', error);
      throw new BadRequestException('Failed to fetch companies');
    }
  }

  async findOne(id: string, userId: string) {
    // Check if user has access to this company
    const userCompany = await this.prisma.userCompany.findFirst({
      where: {
        companyId: id,
        userId,
      },
      include: {
        company: true,
      },
    });

    if (!userCompany) {
      throw new NotFoundException('Company not found or access denied');
    }

    return {
      success: true,
      data: {
        ...userCompany.company,
        role: userCompany.role,
        isDefault: userCompany.isDefault,
        userCompanyId: userCompany.id,
      },
    };
  }

  async update(id: string, userId: string, updateCompanyDto: UpdateCompanyDto) {
    // Check if user has access to this company
    const userCompany = await this.prisma.userCompany.findFirst({
      where: {
        companyId: id,
        userId,
      },
    });

    if (!userCompany) {
      throw new NotFoundException('Company not found or access denied');
    }

    const { name, isDefault, role } = updateCompanyDto;

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // Update company details if name is provided
        if (name) {
          await tx.company.update({
            where: { id },
            data: { name },
          });
        }

        // Update UserCompany relation if role or isDefault changed
        if (role !== undefined || isDefault !== undefined) {
          const updateData: any = {};
          if (role !== undefined) updateData.role = role;
          if (isDefault !== undefined) updateData.isDefault = isDefault;

          await tx.userCompany.update({
            where: { id: userCompany.id },
            data: updateData,
          });

          // If setting as default, unset other defaults
          if (isDefault === true) {
            await tx.userCompany.updateMany({
              where: {
                userId,
                id: { not: userCompany.id },
              },
              data: {
                isDefault: false,
              },
            });
          }
        }

        // Fetch updated company
        return await tx.company.findUnique({
          where: { id },
        });
      });

      return { success: true, data: result };
    } catch (error) {
      console.error('Failed to update company:', error);
      throw new BadRequestException('Failed to update company');
    }
  }

  async remove(id: string, userId: string) {
    // Check if user has access to this company
    const userCompany = await this.prisma.userCompany.findFirst({
      where: {
        companyId: id,
        userId,
      },
    });

    if (!userCompany) {
      throw new NotFoundException('Company not found or access denied');
    }

    try {
      // Delete the UserCompany relation
      // Note: We're not deleting the company itself, just the user's link to it
      // If you want to delete the company entirely, uncomment the transaction below
      await this.prisma.userCompany.delete({
        where: { id: userCompany.id },
      });

      /* Uncomment if you want to delete the company when the last user is removed:
      await this.prisma.$transaction(async (tx) => {
        // Delete UserCompany relation
        await tx.userCompany.delete({ where: { id: userCompany.id } });

        // Check if this was the last user
        const remainingUsers = await tx.userCompany.count({
          where: { companyId: id },
        });

        // If no users left, delete the company
        if (remainingUsers === 0) {
          await tx.company.delete({ where: { id } });
        }
      });
      */

      return { success: true, message: 'Company removed from your account' };
    } catch (error) {
      console.error('Failed to remove company:', error);
      throw new BadRequestException('Failed to remove company');
    }
  }

  async setDefault(companyId: string, userId: string) {
    // Check if user has access to this company
    const userCompany = await this.prisma.userCompany.findFirst({
      where: {
        companyId,
        userId,
      },
    });

    if (!userCompany) {
      throw new NotFoundException('Company not found or access denied');
    }

    try {
      await this.prisma.$transaction([
        // Set this as default
        this.prisma.userCompany.update({
          where: { id: userCompany.id },
          data: { isDefault: true },
        }),
        // Unset all others
        this.prisma.userCompany.updateMany({
          where: {
            userId,
            id: { not: userCompany.id },
          },
          data: { isDefault: false },
        }),
      ]);

      return { success: true, message: 'Default company updated' };
    } catch (error) {
      console.error('Failed to set default company:', error);
      throw new BadRequestException('Failed to set default company');
    }
  }
}
