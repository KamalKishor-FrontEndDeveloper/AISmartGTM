export * from './salesforce';
export * from './hubspot';

// Types for CRM integration
export enum CRMType {
  Salesforce = 'salesforce',
  HubSpot = 'hubspot'
}

export interface CRMConnectionStatus {
  type: CRMType;
  connected: boolean;
  message: string;
}

export interface CRMExportResult {
  crm: CRMType;
  success: boolean;
  itemsExported: number;
  errors?: string[];
}

export interface CRMImportResult {
  crm: CRMType;
  success: boolean;
  itemsImported: number;
  errors?: string[];
}