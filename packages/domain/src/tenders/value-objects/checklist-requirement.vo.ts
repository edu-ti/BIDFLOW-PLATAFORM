export enum TenderDocumentType {
  LEGAL = 'LEGAL',
  FISCAL_LABOR = 'FISCAL_LABOR',
  ECONOMIC_FINANCIAL = 'ECONOMIC_FINANCIAL',
  TECHNICAL = 'TECHNICAL',
}

export interface ChecklistRequirementProps {
  documentType: TenderDocumentType;
  isRequired: boolean;
  description: string;
}

export class ChecklistRequirement {
  public readonly documentType: TenderDocumentType;
  public readonly isRequired: boolean;
  public readonly description: string;

  constructor(props: ChecklistRequirementProps) {
    if (!props.documentType) {
      throw new Error('ChecklistRequirement requires a documentType.');
    }
    if (!props.description || props.description.trim() === '') {
      throw new Error('ChecklistRequirement requires a description.');
    }

    this.documentType = props.documentType;
    this.isRequired = props.isRequired ?? true;
    this.description = props.description;
  }
}
