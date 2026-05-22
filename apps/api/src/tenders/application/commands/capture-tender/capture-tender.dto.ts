export class CaptureTenderDto {
  tenantId: string;
  externalId?: string;
  source: string;
  number: string;
  organization: string;
  department?: string;
  modality: string;
  type: string;
  title: string;
  description?: string;
  uf?: string;
  city?: string;
  estimatedValue?: number;
  currency?: string;
  openingDate: string;
  closingDate: string;
  documentUrl?: string;
  createdBy: string;
}
