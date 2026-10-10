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
      ...document.data(),
    }));

    callback(tickets);
  });
}

export function subscribeToWaitingTickets(callback) {
  const ticketQuery = query(
    collection(db, 'tickets'),
    where('status', '==', 'WAITING'),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(ticketQuery, (snapshot) => {
    const tickets = snapshot.docs.map((document) => ({
      ...document.data(),
    }));

    callback(tickets);
  });
}

export function subscribeToAllTickets(callback) {
  const ticketQuery = query(
    collection(db, 'tickets'),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(ticketQuery, (snapshot) => {
    const tickets = snapshot.docs.map((document) => ({
      ...document.data(),
    }));

    callback(tickets);
  });
}

export async function createTicket(ownerUid) {
  const settingsRef = doc(db, 'settings', 'system');

  const result = await runTransaction(db, async (transaction) => {
    const settingsSnapshot = await transaction.get(settingsRef);

    if (!settingsSnapshot.exists()) {
      throw new Error('시스템 설정이 존재하지 않습니다.');
    }

    const settingsData = settingsSnapshot.data();
    const ticketNumber = Number(settingsData.nextTicketNumber ?? 1);

    const ticketDocRef = doc(db, 'tickets', String(ticketNumber));

    const ticketPayload = {
      ticketNumber: ticketNumber,
      ownerUid,
      status: TICKET_STATUS.WAITING,
      createdAt: serverTimestamp(),
      calledAt: null,
      startedAt: null,
      completedAt: null,
    };

    transaction.set(ticketDocRef, ticketPayload);

    transaction.update(settingsRef, {
      nextTicketNumber: ticketNumber + 1,
    });

    return {
      ticketNumber,
    };
  });

  return result;
}

export async function getTicketByNumber(ticketNumber) {
  const ticketRef = doc(db, 'tickets', String(ticketNumber));
  const snapshot = await getDoc(ticketRef);

  if (snapshot.exists()) {
    return snapshot.data();
  }

  return null;
}

export async function updateTicketStatus(ticketNumber, nextStatus, additionalData = {}) {
  const ticketRef = doc(db, 'tickets', String(ticketNumber));
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

export async function updateCurrentTicketNumber(value) {
  const ref = doc(db, 'settings', 'system');
  await updateDoc(ref, {
    currentTicketNumber: Number(value),
  });
}

export async function getAdminAccess(uid) {
  const ref = doc(db, 'admins', uid);
  const snapshot = await getDoc(ref);
  return snapshot.exists();
}
