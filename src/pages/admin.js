import '../styles/common.css';
import '../styles/admin.css';

import { isAdminUid, logoutUser, signInAdmin } from '../services/auth.js';

const form = document.querySelector('#login-form');
const messageBox = document.querySelector('#login-message');

function showMessage(text, type = 'info') {
  messageBox.textContent = text;
  messageBox.className = 'message-box';

  if (type === 'error') {
    messageBox.classList.add('error');
  } else if (type === 'success') {
    messageBox.classList.add('success');
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = document.querySelector('#email-input').value.trim();
  const password = document.querySelector('#password-input').value;

  if (!email || !password) {
    showMessage('이메일과 비밀번호를 모두 입력해 주세요.', 'error');
    return;
  }

  try {
    const user = await signInAdmin(email, password);
    const isAdmin = await isAdminUid(user.uid);

    if (!isAdmin) {
      await logoutUser();
      showMessage('관리자 권한이 없습니다. 관리자 계정으로 다시 로그인해 주세요.', 'error');
      return;
    }

    showMessage('관리자로 로그인되었습니다.', 'success');
    window.location.href = '/admin.html';
  } catch (error) {
    console.error(error);
    showMessage(error.message || '로그인에 실패했습니다.', 'error');
  }
});
