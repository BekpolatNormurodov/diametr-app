import { PartialType } from '@nestjs/mapped-types';
import { CreateNewDto } from './create-new.dto';


export class UpdateNewDto extends PartialType(CreateNewDto) {}
