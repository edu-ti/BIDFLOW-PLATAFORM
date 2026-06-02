import { UploadTenderDocumentDto } from './upload-document.dto';

export class UploadTenderDocumentCommand {
  constructor(
    public readonly tenderId: string,
    public readonly tenantId: string,
    public readonly userId: string,
    public readonly file: Express.Multer.File,
    public readonly dto: UploadTenderDocumentDto,
  ) {}
}
