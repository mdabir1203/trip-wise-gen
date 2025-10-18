export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  category: string;
}

export interface ChecklistCategory {
  name: string;
  items: string[];
}

export interface PackingListData {
  weatherContext: string;
  culturalTips: string;
  categories: ChecklistCategory[];
  tripCategory?: string;
  gender?: string;
  tripDuration?: number;
  weatherSummary?: string | null;
  travelStyle?: string;
  ageGroup?: string;
}
