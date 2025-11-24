export interface HashtagResponse {
  id: string;
  tag: string;
  usageCount: number;
}

export interface HashtagRequest {
  tag: string;
}
