import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAuctionDto, UpdateAuctionDto } from './dto';

@Injectable()
export class AuctionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAuctionDto) {
    return this.prisma.auction.create({
      data: {
        ...dto,
        currentPrice: dto.startPrice,
      },
    });
  }

  async findAll() {
    return this.prisma.auction.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        _count: {
          select: { bids: true },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.auction.findUnique({
      where: { id },
      include: {
        user: true,
        bids: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  async update(id: string, dto: UpdateAuctionDto) {
    return this.prisma.auction.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    return this.prisma.auction.delete({
      where: { id },
    });
  }
}