import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBidDto } from './dto';

@Injectable()
export class BidsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBidDto) {
    const auction = await this.prisma.auction.findUnique({
      where: { id: dto.auctionId },
    });

    if (!auction) {
      throw new Error('Auction not found');
    }

    if (auction.status !== 'ACTIVE') {
      throw new Error('Auction is not active');
    }

    if (dto.amount <= auction.currentPrice) {
      throw new Error('Bid must be higher than current price');
    }

    const result = await this.prisma.$transaction([
      this.prisma.bid.create({
        data: {
          amount: dto.amount,
          userId: dto.userId,
          auctionId: dto.auctionId,
        },
      }),
      this.prisma.auction.update({
        where: { id: dto.auctionId },
        data: { currentPrice: dto.amount },
      }),
    ]);

    return result[0];
  }

  async findByAuction(auctionId: string) {
    return this.prisma.bid.findMany({
      where: { auctionId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
      },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.bid.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        auction: true,
      },
    });
  }
}