import { doc, updateDoc } from 'firebase/firestore';

import { db } from '../firebase/config.js';
import { getSystemSettings, subscribeToAllTickets, subscribeToMyTicket, subscribeToSettings, subscribeToWaitingTickets, TICKET_STATUS, createTicket, updateTicketStatus, updateSystemSettings, getAdminAccess } from './tickets.js';

export {
  TICKET_STATUS,
  createTicket,
  getAdminAccess,
  getSystemSettings,
  subscribeToAllTickets,
  subscribeToMyTicket,
  subscribeToSettings,
  subscribeToWaitingTickets,
  updateSystemSettings,
  updateTicketStatus,
};

export async function updateCurrentTicketNumber(value) {
  const ref = doc(db, 'settings', 'system');
  await updateDoc(ref, {
    currentTicketNumber: Number(value),
  });
}
