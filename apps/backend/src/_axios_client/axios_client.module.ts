import { Module,Global } from '@nestjs/common';




import { HttpModule } from '@nestjs/axios';
import { AxiosClientService } from './axios_client.service';


@Global()
@Module({
  imports: [HttpModule],
  providers: [AxiosClientService],
  exports: [AxiosClientService],
})
export class AxiosClientModule {}

