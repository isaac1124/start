import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import { db } from '../firebase/config.js';

export const TICKET_STATUS = {
  WAITING: 'WAITING',
  CALLED: 'CALLED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

export function subscribeToSettings(callback) {
  const ref = doc(db, 'settings', 'system');

  return onSnapshot(
    ref,
    (snapshot) => {
      if (!snapshot.exists()) {
        callback({
          nextTicketNumber: 1,
          currentTicketNumber: 0,
        });
        return;
      }

      callback(snapshot.data());
    },
    () => {
      callback({
        nextTicketNumber: 1,
        currentTicketNumber: 0,
      });
    }
  );
}

export function subscribeToMyTicket(ownerUid, callback) {
  const ticketQuery = query(
    collection(db, 'tickets'),
    where('ownerUid', '==', ownerUid),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(ticketQuery, (snapshot) => {
    const tickets = snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    }));

    callback(tickets);
  });
}

export function subscribeToWaitingTickets(callback) {
  const ticketQuery = query(
    collection(db, 'tickets'),
    where('status', '==', 'WAITING'),
    orderBy('ticketNumber', 'asc')
  );

  return onSnapshot(ticketQuery, (snapshot) => {
    const tickets = snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    }));

    callback(tickets);
  });
}

export function subscribeToAllTickets(callback) {
  const ticketQuery = query(collection(db, 'tickets'), orderBy('ticketNumber', 'asc'));

  return onSnapshot(ticketQuery, (snapshot) => {
    const tickets = snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    }));

    callback(tickets);
  });
}

export async function createTicket(ownerUid) {
  const settingsRef = doc(db, 'settings', 'system');
  const newTicketRef = doc(collection(db, 'tickets'));

  const result = await runTransaction(db, async (transaction) => {
    const settingsSnapshot = await transaction.get(settingsRef);

    if (!settingsSnapshot.exists()) {
      throw new Error('시스템 설정이 존재하지 않습니다.');
    }

    const settingsData = settingsSnapshot.data();
    const nextTicketNumber = Number(settingsData.nextTicketNumber ?? 1);

    transaction.update(settingsRef, {
      nextTicketNumber: nextTicketNumber + 1,
    });

    const ticketPayload = {
      ticketNumber: nextTicketNumber,
      ownerUid,
      status: TICKET_STATUS.WAITING,
      createdAt: serverTimestamp(),
      calledAt: null,
      startedAt: null,
      completedAt: null,
    };

    transaction.set(newTicketRef, ticketPayload);

    return {
      ticketId: newTicketRef.id,
      ticketNumber: nextTicketNumber,
    };
  });

  return result;
}

export async function getTicketByNumber(ticketNumber) {
  const ticketsRef = collection(db, 'tickets');
  const q = query(ticketsRef, where('ticketNumber', '==', Number(ticketNumber)));

  const snapshot = await getDoc(doc(db, 'tickets', ''));
  if (snapshot.exists()) {
    return snapshot.data();
  }

  return null;
}

export async function updateTicketStatus(ticketId, nextStatus, additionalData = {}) {
  const ticketRef = doc(db, 'tickets', ticketId);
  const payload = {
    status: nextStatus,
    ...additionalData,
  };

  await updateDoc(ticketRef, payload);
}

export async function getSystemSettings() {
  const ref = doc(db, 'settings', 'system');
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    return {
      nextTicketNumber: 1,
      currentTicketNumber: 0,
    };
  }

  return snapshot.data();
}

export async function updateSystemSettings(data) {
  const ref = doc(db, 'settings', 'system');
  await updateDoc(ref, data);
}

export async function getAdminAccess(uid) {
  const ref = doc(db, 'admins', uid);
  const snapshot = await getDoc(ref);
  return snapshot.exists();
}
