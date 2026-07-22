import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientService } from 'src/_prisma_client/prisma_client.service';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';

@Injectable()
export class RegionService {

    constructor(private readonly prisma: PrismaClientService) {}
      private logger = new Logger('Region service');
      async create(data: CreateRegionDto) {
        this.logger.log('create');
        
    
       return await this.prisma.region.create({
          data: data,
        });
    
      }
    
      async findAll() {
        this.logger.log('findAll');
        const regions = await this.prisma.region.findMany();
        return regions;
      }
      async findOne(id: number) {
        this.logger.log('findOne');
        let region = await this.prisma.region.findUnique({
          where: { id },
        });
        if (!region) {
          throw new NotFoundException('region not found');
        }
    
        return region;
      }
    
      async update(id: number, data: UpdateRegionDto) {
        this.logger.log('update');
        let region = await this.prisma.region.findUnique({
          where: { id },
        });
        if (!region) {
          throw new NotFoundException('region not found');
        }
    
        return await this.prisma.region.update({
          where: { id },
          data,
        });
      }
    
      async remove(id: number) {
        this.logger.log('remove');
        let region = await this.prisma.region.findUnique({
          where: { id },
        });
        if (!region) {
          throw new NotFoundException('region not found');
        }
    
        return await this.prisma.region.delete({
          where: { id },
        });
      }
}
