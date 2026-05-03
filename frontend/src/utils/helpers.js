// Location: ConcertHub/frontend/src/utils/helpers.js

import { format, formatDistanceToNow, isPast, isFuture } from 'date-fns';

export const formatDate = (date) => {
  if (!date) return '—';
  return format(new Date(date), 'MMM d, yyyy');
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  return format(new Date(date), 'MMM d, yyyy · h:mm a');
};

export const formatRelative = (date) => {
  if (!date) return '—';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '$0.00';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

export const isEventPast = (date) => isPast(new Date(date));
export const isEventFuture = (date) => isFuture(new Date(date));

export const getInitials = (name = '') => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return path;
};

export const getErrorMessage = (error) => {
  return error?.response?.data?.message
    || error?.response?.data?.errors?.[0]?.message
    || error?.message
    || 'Something went wrong';
};

export const genreColors = {
  'Pop':        { bg: 'rgba(255,20,147,0.15)', color: '#ff1493' },
  'Rock':       { bg: 'rgba(255,69,0,0.15)',   color: '#ff4500' },
  'Hip-Hop':    { bg: 'rgba(138,43,226,0.15)', color: '#8a2be2' },
  'R&B':        { bg: 'rgba(220,20,60,0.15)',  color: '#dc143c' },
  'Jazz':       { bg: 'rgba(218,165,32,0.15)', color: '#daa520' },
  'Classical':  { bg: 'rgba(70,130,180,0.15)', color: '#4682b4' },
  'Electronic': { bg: 'rgba(77,244,255,0.15)', color: '#4df4ff' },
  'Country':    { bg: 'rgba(210,180,140,0.15)', color: '#d2b48c' },
  'Folk':       { bg: 'rgba(107,142,35,0.15)', color: '#6b8e23' },
  'Metal':      { bg: 'rgba(105,105,105,0.15)', color: '#aaa' },
  'Indie':      { bg: 'rgba(232,255,71,0.15)', color: '#e8ff47' },
  'Soul':       { bg: 'rgba(255,140,0,0.15)',  color: '#ff8c00' },
  'Reggae':     { bg: 'rgba(0,180,0,0.15)',    color: '#00b400' },
  'Blues':      { bg: 'rgba(0,0,205,0.2)',     color: '#6ca0dc' },
  'Latin':      { bg: 'rgba(255,165,0,0.15)',  color: '#ffa500' },
  'Other':      { bg: 'rgba(128,128,128,0.15)', color: '#888' },
};

export const GENRES = [
  'Pop','Rock','Hip-Hop','R&B','Jazz','Classical','Electronic',
  'Country','Folk','Metal','Indie','Soul','Reggae','Blues','Latin','Other'
];