export interface List {
  id: string;
  name: string;
  description: string | null;
  contactCount: number;
  createdAt: string;
}

export interface CreateListPayload {
  name: string;
  description?: string;
}

export interface UpdateListPayload {
  name?: string;
  description?: string;
}

export interface AddContactsToListPayload {
  contactIds: string[];
}
