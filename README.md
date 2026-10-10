# README.md

# 온라인 번호표 및 작업 완료 알림 시스템

이 프로젝트는 **번호표를 발급하고 관리자 페이지에서 순서를 관리하는 웹 애플리케이션**입니다.

## 1. 프로젝트 목적

- 사용자는 웹 페이지에서 번호표를 발급받습니다.
- 관리자는 관리자 로그인을 통해 번호를 호출하고, 작업 상태를 관리합니다.
- 번호표 상태는 Firestore에 저장되고, 사용자/관리자 화면이 실시간으로 동기화됩니다.
- 지금 MVP 단계에서는 **웹 푸시 알림은 제외**하고, 이후 구조를 확장할 수 있도록 설계합니다.

## 2. 주요 기능

### 사용자 페이지
- Firebase Anonymous 로그인
- 번호표 발급
- 내 번호 확인
- 현재 처리 번호 표시
- 앞에 몇 명이 남았는지 확인
- 상태 표시: 대기 중 / 호출됨 / 작업 중 / 작업 완료 / 취소됨
- 새로고침 후에도 번호 확인
- 모바일 반응형 UI

### 관리자 페이지
- Firebase 이메일/비밀번호 로그인
- 관리자 권한 확인
- 대기 번호 목록 확인
- 다음 번호 호출
- 특정 번호 호출
- 작업 시작
- 작업 완료
- 취소
- 로그아웃

## 3. 기술 스택

- Vite
- Vanilla JavaScript
- Firebase Authentication
- Firestore
- Firebase Hosting

## 4. 프로젝트 구조

```bash
/
├── package.json
├── vite.config.js
├── index.html
├── login.html
├── admin.html
├── .gitignore
├── .env.example
├── firebase.json
├── firestore.indexes.json
├── firestore.rules
├── README.md
├── firebase-setup.md
├── LOCAL-TESTING.md
├── DEPLOYMENT.md
├── src/
│   ├── firebase/
│   │   └── config.js
│   ├── services/
│   │   ├── auth.js
│   │   └── tickets.js
│   ├── pages/
│   │   ├── customer.js
│   │   ├── login.js
│   │   └── admin.js
│   └── styles/
│       ├── common.css
│       ├── customer.css
│       └── admin.css
```

## 5. 설치 방법

### 1) Node.js 설치

```bash
node -v
npm -v
```

### 2) 의존성 설치

```bash
npm install
```

### 3) `.env` 파일 만들기

프로젝트 루트에 `.env` 파일을 만듭니다.

```bash
cp .env.example .env
```

그다음 Firebase Console에서 값을 넣어 주세요.

## 6. Firebase 설정 방법

1. Firebase Console에서 프로젝트를 생성합니다.
2. Firestore Database를 생성합니다.
3. Authentication에서 이메일/비밀번호 로그인을 활성화합니다.
4. 익명 인증을 활성화합니다.
5. 웹 앱을 등록합니다.
6. Firebase 설정값을 `.env`에 입력합니다.
7. Firestore rules를 배포합니다.

자세한 내용은 `firebase-setup.md`를 확인해 주세요.

## 7. 실행 방법

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 다음 주소를 확인합니다.

```bash
http://localhost:5173/
```

관리자 페이지:

```bash
http://localhost:5173/login.html
```

## 8. 사용자 흐름

1. 사용자가 사이트 접속
2. Firebase Anonymous 로그인 자동 수행
3. 번호표 받기 버튼 클릭
4. Firestore transaction으로 번호 발급
5. 사용자의 번호 확인
6. 관리자가 번호를 호출
7. 사용자 화면에서 상태 변경 확인

## 9. 관리자 흐름

1. 관리자 로그인
2. 현재 로그인 사용자 UID 확인
3. admins/{uid} 문서 존재 여부 확인
4. 관리자라면 admin.html 접속
5. 번호 호출 / 작업 시작 / 완료 처리
6. Firestore 실시간 업데이트로 사용자 화면 동기화

## 10. Firebase 구조

```bash
settings/
  system/
    nextTicketNumber: number
    currentTicketNumber: number

admins/
  {uid}/
    uid: string
    email: string

tickets/
  {ticketId}/
    ticketNumber: number
    ownerUid: string
    status: string
    createdAt: timestamp
    calledAt: timestamp | null
    startedAt: timestamp | null
    completedAt: timestamp | null
```

## 11. 보안

보안은 **프론트엔드 버튼 숨김이 아니라 Firestore Security Rules로 보호**합니다.

- 일반 고객은 자신의 티켓만 읽기 가능
- 관리자는 상태 변경 가능
- 일반 고객은 admins 컬렉션을 수정할 수 없음
- settings는 관리자만 수정 가능

## 12. 향후 확장 가능성

다음 단계에서 아래 기능을 추가할 수 있습니다.

- 웹 푸시 알림
- 여러 매장 지원
- 고객 통계
- 예상 대기시간 계산
- 예약 시스템
- kakao / SMS 연동

## 13. 참고 문서

- `firebase-setup.md` : Firebase 설정 가이드
- `LOCAL-TESTING.md` : 로컬 테스트 가이드
- `DEPLOYMENT.md` : Firebase Hosting 배포 가이드

