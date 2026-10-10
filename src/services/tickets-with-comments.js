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

/**
 * 설정 변경 구독
 * 현재 처리 중인 번호와 다음 발급할 번호를 실시간으로 모니터링
 */
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

/**
 * 내 번호표 구독
 * 사용자의 모든 발급 내역을 최신순으로 조회
 */
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

/**
 * 대기 중인 번호표 목록 구독
 * 관리자 화면: 호출할 번호표들
 */
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

/**
 * 모든 번호표 구독
 * 관리자 화면: 전체 번호표 현황
 */
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

/**
 * 번호표 발급
 * 익명 사용자가 호출하는 원자적 트랜잭션
 *
 * 동작:
 * 1. settings/system 읽기 → 현재 nextTicketNumber 확인
 * 2. tickets/{ticketNumber} 문서 생성
 * 3. settings/system.nextTicketNumber + 1 업데이트
 *
 * 보안:
 * - Firestore Transaction으로 원자성 보장
 * - Security Rules의 검사:
 *   - ticket 생성: ticketNumber == nextTicketNumber 검증
 *   - settings 업데이트: !exists() && existsAfter() 로 ticket 반드시 생성 확인
 *   - 두 작업이 하나의 트랜잭션에서 성공해야만 적용됨
 */
export async function createTicket(ownerUid) {
  const settingsRef = doc(db, 'settings', 'system');

  const result = await runTransaction(db, async (transaction) => {
    const settingsSnapshot = await transaction.get(settingsRef);

    if (!settingsSnapshot.exists()) {
      throw new Error('시스템 설정이 존재하지 않습니다.');
    }

    const settingsData = settingsSnapshot.data();
    const ticketNumber = Number(settingsData.nextTicketNumber ?? 1);

    // 1단계: ticket 문서 생성
    // Security Rules에서 검증:
    // - ownerUid == request.auth.uid
    // - ticketNumber == get(settings/system).data.nextTicketNumber
    // - status == 'WAITING'
    // - 필수 필드만 포함 (hasAll / hasOnly)
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

    // 2단계: settings 업데이트
    // Security Rules에서 검증:
    // - nextTicketNumber 정확히 +1
    // - !exists(ticketPath) && existsAfter(ticketPath)
    //   → ticket 없이 settings만 증가 불가
    //   → 기존 ticket으로 우회 불가
    transaction.update(settingsRef, {
      nextTicketNumber: ticketNumber + 1,
    });

    return {
      ticketNumber,
    };
  });

  return result;
}

/**
 * 특정 번호표 조회
 */
export async function getTicketByNumber(ticketNumber) {
  const ticketRef = doc(db, 'tickets', String(ticketNumber));
  const snapshot = await getDoc(ticketRef);

  if (snapshot.exists()) {
    return snapshot.data();
  }

  return null;
}

/**
 * 번호표 상태 변경
 * 관리자만 호출 가능 (클라이언트 검사 + Security Rules)
 *
 * 허용된 상태 전이:
 * - WAITING → CALLED (calledAt 기록)
 * - CALLED → IN_PROGRESS (startedAt 기록)
 * - IN_PROGRESS → COMPLETED (completedAt 기록)
 * - 모든 상태 → CANCELLED
 *
 * Security Rules:
 * - isValidStatusTransition() 검증
 * - 상태별로 변경 가능한 필드 제한
 * - ownerUid, ticketNumber, createdAt 변경 불가
 */
export async function updateTicketStatus(ticketNumber, nextStatus, additionalData = {}) {
  const ticketRef = doc(db, 'tickets', String(ticketNumber));
  const payload = {
    status: nextStatus,
    ...additionalData,
  };

  await updateDoc(ticketRef, payload);
}

/**
 * 시스템 설정 조회
 */
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

/**
 * 현재 처리 중인 번호 업데이트
 * 관리자만 호출 가능 (Security Rules에서 검증)
 */
export async function updateCurrentTicketNumber(value) {
  const ref = doc(db, 'settings', 'system');
  await updateDoc(ref, {
    currentTicketNumber: Number(value),
  });
}

/**
 * 관리자 권한 확인
 * admins/{uid} 문서 존재 여부로 판단
 */
export async function getAdminAccess(uid) {
  const ref = doc(db, 'admins', uid);
  const snapshot = await getDoc(ref);
  return snapshot.exists();
}
