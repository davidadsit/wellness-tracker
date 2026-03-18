export interface SeedTag {
  id: string;
  label: string;
}

export interface SeedCategory {
  id: string;
  name: string;
  sortOrder: number;
  triggerTagId?: string;
  tags: SeedTag[];
}

export const DEFAULT_CATEGORIES: SeedCategory[] = [
  {
    id: 'cat-mental',
    name: 'Mental Health',
    sortOrder: 1,
    tags: [
      {id: 'tag-focused', label: 'Focused'},
      {id: 'tag-foggy', label: 'Foggy'},
      {id: 'tag-calm', label: 'Calm'},
      {id: 'tag-anxious', label: 'Anxious'},
      {id: 'tag-overwhelmed', label: 'Overwhelmed'},
      {id: 'tag-clear-headed', label: 'Clear-headed'},
      {id: 'tag-distracted', label: 'Distracted'},
    ],
  },
  {
    id: 'cat-physical',
    name: 'Physical Health',
    sortOrder: 2,
    tags: [
      {id: 'tag-energized', label: 'Energized'},
      {id: 'tag-tired', label: 'Tired'},
      {id: 'tag-rested', label: 'Rested'},
      {id: 'tag-sore', label: 'Sore'},
      {id: 'tag-strong', label: 'Strong'},
      {id: 'tag-sluggish', label: 'Sluggish'},
      {id: 'tag-active', label: 'Active'},
      {id: 'tag-ill', label: 'Sick'},
    ],
  },
  {
    id: 'cat-symptoms',
    name: 'Symptoms',
    sortOrder: 3,
    triggerTagId: 'tag-ill',
    tags: [
      {id: 'tag-headache', label: 'Headache'},
      {id: 'tag-nausea', label: 'Nausea'},
      {id: 'tag-fever', label: 'Fever'},
      {id: 'tag-congestion', label: 'Congestion'},
      {id: 'tag-sore-throat', label: 'Sore Throat'},
      {id: 'tag-chills', label: 'Chills'},
      {id: 'tag-body-aches', label: 'Body Aches'},
      {id: 'tag-cough', label: 'Cough'},
      {id: 'tag-dizziness', label: 'Dizziness'},
    ],
  },
  {
    id: 'cat-emotional',
    name: 'Emotional Health',
    sortOrder: 4,
    tags: [
      {id: 'tag-happy', label: 'Happy'},
      {id: 'tag-sad', label: 'Sad'},
      {id: 'tag-grateful', label: 'Grateful'},
      {id: 'tag-irritable', label: 'Irritable'},
      {id: 'tag-content', label: 'Content'},
      {id: 'tag-lonely', label: 'Lonely'},
      {id: 'tag-hopeful', label: 'Hopeful'},
      {id: 'tag-stressed', label: 'Stressed'},
    ],
  },
];
