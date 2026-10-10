# Firebase 설정 가이드

이 문서는 현재 프로젝트에서 필요한 Firebase 설정을 초보자가 따라하기 쉽게 정리한 문서입니다.

## 1. Firebase 프로젝트 준비

이미 Firebase 프로젝트가 생성되어 있다고 가정합니다.

사용 중인 프로젝트:
- Project ID: `online-ticket-system-e79e2`
- Firestore Region: `asia-northeast3`

다음 값을 직접 구조화해 보관해 두세요.

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=online-ticket-system-e79e2
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

## 2. Firestore Database 생성

1. Firebase Console에서 `Firestore Database`를 선택합니다.
2. `데이터베이스 만들기`를 누릅니다.
3. 위치를 `asia-northeast3`로 설정합니다.
4. 보안 규칙은 나중에 `firestore.rules`를 배포해 보호합니다.

## 3. Authentication 설정

### 익명 인증

1. Firebase Console → `Authentication` → `로그인 방법`
2. `익명` 로그인 활성화
3. 저장

### 이메일/비밀번호 로그인

1. Firebase Console → `Authentication` → `로그인 방법`
2. `이메일/비밀번호` 활성화
3. 저장

## 4. 관리자 계정 준비

1. 관리자용 이메일과 비밀번호를 준비합니다.
2. Firebase Authentication에서 관리자 계정을 생성합니다.
3. 생성된 UID를 Firestore `admins` 컬렉션에 저장합니다.

예시 구조:

```bash
admins/
  {uid}/
    uid: "{uid}"
    email: "admin@example.com"
```

## 5. Firestore 데이터 구조

### settings

```bash
settings/
  system/
    nextTicketNumber: 1
    currentTicketNumber: 0
```

### tickets

티켓은 사용자가 최초 번호표를 발급할 때 자동 생성됩니다.

```bash
tickets/
  {ticketId}/
    ticketNumber: 1
    ownerUid: "anonymous-user-uid"
    status: "WAITING"
    createdAt: timestamp
    calledAt: null
    startedAt: null
    completedAt: null
```

## 6. .env 파일 설정

프로젝트 루트에 `.env` 파일을 생성합니다.

```bash
cp .env.example .env
```

이후 Firebase Console의 값으로 변경합니다.

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=online-ticket-system-e79e2
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

중요:
- `.env`는 Git에 올리지 않습니다.
- 실제 값은 직접 입력해야 합니다.
- 소스 코드에 하드코딩하지 않습니다.

## 7. Firestore Security Rules 배포

프로젝트 루트의 `firestore.rules` 파일을 Firebase로 배포해야 합니다.

```bash
npx firebase deploy --only firestore:rules
```

## 8. Firebase Hosting 배포

```bash
npx firebase login
npx firebase init hosting
npm run build
npx firebase deploy
```

## 9. 주의사항

- Firebase 설정값은 `.env`로 관리합니다.
- `firestore.rules`를 꼭 배포합니다.
- `admins` 문서가 없으면 관리자 페이지에 접근할 수 없습니다.
- 익명 로그인 사용자는 고객처럼 번호표를 발급받습니다.

