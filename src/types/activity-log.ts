export interface ActivityLogCauser {
  id: number | null;
  name: string | null;
}

export interface ActivityLogSubject {
  type: string;
  id: number;
}

export interface ActivityLogChanges {
  old?: Record<string, any> | null;
  new?: Record<string, any> | null;
}

export interface ActivityLogItem {
  id: number;
  log: string;
  event: string;
  description: string;
  causer: ActivityLogCauser | null;
  subject: ActivityLogSubject | null;
  changes: ActivityLogChanges | null;
  context: Record<string, any> | null;
  created_at: string;
}

export interface ActivityLogMetaLink {
  url: string | null;
  label: string;
  page?: number | null;
  active: boolean;
}

export interface ActivityLogMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  links?: ActivityLogMetaLink[];
  path: string;
  per_page: number;
  to: number | null;
  total: number;
  logs?: (string | null)[];
  events?: (string | null)[];
}

export interface ActivityLogListResponse {
  data: ActivityLogItem[];
  links?: Record<string, any>;
  meta?: ActivityLogMeta;
}

export interface ActivityLogFilters {
  log?: string;
  event?: string;
  causer_id?: number | string;
  subject_type?: string;
  subject_id?: number | string;
  from?: string;
  to?: string;
  q?: string;
  page?: number;
  per_page?: number;
}
