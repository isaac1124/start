# Firebase Hosting 및 Firestore Rules 배포 가이드

## 1. Firebase CLI 설치

```bash
npm install -g firebase-tools
```

## 2. 로그인

```bash
firebase login
```

브라우저가 열리면 Google 계정으로 로그인합니다.

## 3. Firebase 프로젝트 연결

프로젝트 루트에서 다음 명령을 실행합니다.

```bash
firebase use --add
```

그다음 프로젝트 선택 화면에서 `online-ticket-system-e79e2`를 선택합니다.

## 4. 배포 전 빌드

```bash
npm run build
```

## 5. Firestore Rules 배포

```bash
npx firebase deploy --only firestore:rules
```

## 6. Hosting 배포

```bash
npx firebase deploy --only hosting
```

## 7. 전체 배포

```bash
npx firebase deploy
```

## 8. 배포 후 확인

배포가 완료되면 출력된 Hosting URL을 브라우저에서 확인합니다.

예시:

```bash
https://online-ticket-system-e79e2.web.app
```

## 9. 운영 체크리스트

- 메인 페이지에서 번호표 발급 가능
- 관리자 로그인 가능
- 관리자 권한이 없으면 차단됨
- 번호 호출이 동작함
- Firestore 값을 확인함

