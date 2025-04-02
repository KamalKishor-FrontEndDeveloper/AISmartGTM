declare namespace jsforce {
  interface ConnectionOptions {
    loginUrl?: string;
    instanceUrl?: string;
    accessToken?: string;
    refreshToken?: string;
    clientId?: string;
    clientSecret?: string;
    redirectUri?: string;
    version?: string;
    maxRequest?: number;
  }

  interface UserInfo {
    id: string;
    organizationId: string;
    username: string;
    displayName: string;
    email: string;
    [key: string]: any;
  }

  interface QueryResult<T> {
    totalSize: number;
    done: boolean;
    records: T[];
    nextRecordsUrl?: string;
  }

  interface Record {
    Id: string;
    attributes: {
      type: string;
      url: string;
    };
    [key: string]: any;
  }

  interface SObjectCreateResult {
    id: string;
    success: boolean;
    errors: string[];
    [key: string]: any;
  }

  interface SObject<T> {
    create(data: any): Promise<SObjectCreateResult>;
    retrieve(id: string): Promise<T>;
    update(data: any): Promise<SObjectCreateResult>;
    destroy(id: string): Promise<SObjectCreateResult>;
    find<T>(conditions?: any): Promise<T[]>;
    findOne<T>(conditions?: any): Promise<T>;
    upsert(data: any, extIdField?: string): Promise<SObjectCreateResult>;
    [key: string]: any;
  }

  export class Connection {
    constructor(options?: ConnectionOptions);
    login(username: string, password: string): Promise<UserInfo>;
    sobject<T = Record>(name: string): SObject<T>;
    query<T = Record>(soql: string): Promise<QueryResult<T>>;
    queryMore<T = Record>(nextRecordsUrl: string): Promise<QueryResult<T>>;
    search<T = Record>(sosl: string): Promise<T[]>;
    identity(): Promise<UserInfo>;
    logout(): Promise<void>;
    [key: string]: any;
  }

  export function createConnection(options?: ConnectionOptions): Connection;
}