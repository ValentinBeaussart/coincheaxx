import { Announcement, Contract, Suit } from './types';

export const suits: Suit[] = ['♥', '♠', '♣', '♦'];
export const contractValues: Contract[] = ['80', '90', '100', '110', '120', '130', '140', '150', '160', 'capot'];

export const announcements: Announcement[] = [
  { title: 'Belote-Rebelote', points: 20 },
  { title: 'Carré de Valets', points: 200 },
  { title: 'Carré de 9', points: 150 },
  { title: 'Carré de 10', points: 100 },
  { title: 'Carré de Dames', points: 100 },
  { title: 'Carré de Rois', points: 100 },
  { title: 'Carré d\'As', points: 100 },
  { title: 'Tierce', points: 20 },
  { title: 'Cinquante', points: 50 },
  { title: 'Cent', points: 100 }
];