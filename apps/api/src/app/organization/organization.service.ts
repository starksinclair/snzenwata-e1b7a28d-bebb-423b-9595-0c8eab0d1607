import { Injectable } from '@nestjs/common';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';
import { OrganizationType } from '@snzenwata-e1b7a28d-bebb-423b-9595-0c8eab0d1607/data';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
  ) {}

  create(
    createOrganizationDto: CreateOrganizationDto,
    manager?: EntityManager,
  ) {
    const repo = manager
      ? manager.getRepository(Organization)
      : this.organizationRepository;
    const organization = repo.create({
      name: createOrganizationDto.name,
      type: OrganizationType.COMPANY,
    });
    return repo.save(organization);
  }

  async getAllowedOrgIds(userOrgId: string): Promise<string[]> {
    const org = await this.organizationRepository.findOne({
      where: { id: userOrgId },
      select: ['id'],
      relations: ['parent'],
    });

    if (!org) return [];

    // Case 1: This is a child org → can only access itself
    if (org.parent) {
      return [org.id];
    }

    // Case 2: This is a parent org → can access itself + children
    const children = await this.organizationRepository.find({
      where: { parent: { id: org.id } },
      select: ['id'],
    });

    return [org.id, ...children.map((c) => c.id)];
  }
}
