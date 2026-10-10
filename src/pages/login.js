import '../styles/common.css';
import '../styles/customer.css';

import { ensureAnonymousUser } from '../services/auth.js';
import {
  subscribeToMyTicket,
  subscribeToSettings,
  createTicket,
  TICKET_STATUS,
} from '../services/tickets.js';

const state = {
  ownerUid: null,
  ticket: null,
  settings: {
    currentTicketNumber: 0,
    nextTicketNumber: 1,
  },
};

const elements = {
  currentTicket: document.querySelector('#current-ticket'),
  myTicket: document.querySelector('#my-ticket'),
  waitingCount: document.querySelector('#waiting-count-text'),
  status: document.querySelector('#ticket-status'),
  button: document.querySelector('#ticket-button'),
  message: document.querySelector('#message-box'),
};

function showMessage(text, type = 'info') {
  elements.message.textContent = text;
  elements.message.className = 'message-box';
  if (type === 'error') {
    elements.message.classList.add('error');
  } else if (type === 'success') {
    elements.message.classList.add('success');
  }
}

function getStatusText(status) {
  const map = {
    [TICKET_STATUS.WAITING]: '대기 중',
    [TICKET_STATUS.CALLED]: '호출됨',
    [TICKET_STATUS.IN_PROGRESS]: '작업 중',
    [TICKET_STATUS.COMPLETED]: '작업 완료',
    [TICKET_STATUS.CANCELLED]: '취소됨',
  };

  return map[status] ?? '확인 중';
}

function render() {
  const currentNumber = Number(state.settings.currentTicketNumber ?? 0);
  const ticketNumber = Number(state.ticket?.ticketNumber ?? 0);

  elements.currentTicket.textContent = currentNumber > 0 ? `${currentNumber}번` : '0번';

  if (state.ticket) {
    elements.myTicket.textContent = `${ticketNumber}번`;
    elements.status.textContent = getStatusText(state.ticket.status);

    const waitingAhead = Math.max(ticketNumber - currentNumber - 1, 0);
    elements.waitingCount.textContent = `앞에 ${waitingAhead}명`;

    if (state.ticket.status === TICKET_STATUS.COMPLETED) {
      elements.button.disabled = true;
      elements.button.textContent = '이미 완료됨';
    } else if (state.ticket.status === TICKET_STATUS.CANCELLED) {
      elements.button.disabled = false;
      elements.button.textContent = '새 번호표 받기';
    } else {
      elements.button.disabled = true;
      elements.button.textContent = '이미 발급됨';
    }
  } else {
    elements.myTicket.textContent = '-';
    elements.status.textContent = '발급 전';
    elements.waitingCount.textContent = '앞에 0명';
    elements.button.disabled = false;
    elements.button.textContent = '번호표 받기';
  }
}

async function handleTicketIssue() {
  if (!state.ownerUid) {
    showMessage('인증이 완료되지 않았습니다. 잠시 후 다시 시도해 주세요.', 'error');
    return;
  }

  if (state.ticket) {
    showMessage('이미 발급된 번호표가 있습니다.', 'error');
    return;
  }

  try {
    const result = await createTicket(state.ownerUid);
    showMessage(`${result.ticketNumber}번 번호표가 발급되었습니다.`, 'success');
    localStorage.setItem('ticketId', result.ticketId);
  } catch (error) {
    console.error(error);
    showMessage(error.message || '번호표 발급에 실패했습니다. 잠시 후 다시 시도해 주세요.', 'error');
  }
}

async function initializeCustomerPage() {
  try {
    const user = await ensureAnonymousUser();
    state.ownerUid = user.uid;

    const savedTicketId = localStorage.getItem('ticketId');
    if (savedTicketId) {
      console.log('저장된 티켓 ID:', savedTicketId);
    }

    subscribeToSettings((settings) => {
      state.settings = {
        currentTicketNumber: Number(settings?.currentTicketNumber ?? 0),
        nextTicketNumber: Number(settings?.nextTicketNumber ?? 1),
      };
      render();
    });

    subscribeToMyTicket(state.ownerUid, (tickets) => {
      const [latestTicket] = tickets;
      state.ticket = latestTicket ?? null;

      if (latestTicket) {
        localStorage.setItem('ticketId', latestTicket.id);
      } else {
        localStorage.removeItem('ticketId');
      }

      render();
    });
  } catch (error) {
    console.error(error);
    showMessage('로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.', 'error');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  elements.button.addEventListener('click', handleTicketIssue);
  render();
  initializeCustomerPage();
});
