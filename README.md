# Netlify 폼림픽

DC인사이드 갤러리 이벤트용 "00초 맞추기" 폼림픽 예제입니다.

## 기능

- Netlify 서버 도착시간 기준 순위 판정
- 참가 화면 시계를 서버시간에 맞춰 자동 보정
- 목표시간 이전 제출 서버 차단
- 이벤트 종료시간 설정
- 식별값 기준 1회 참여 (`onlyIfNew` 조건부 저장)
- Netlify Blobs에 결과 저장
- 관리자 키로 결과 조회
- 관리자 페이지에서 CSV 다운로드
- 새 이벤트는 `EVENT_ID`만 바꾸면 이전 데이터와 분리

## 파일 구조

```text
netlify-formlympic/
├─ public/
│  ├─ index.html
│  ├─ admin.html
│  └─ styles.css
├─ netlify/
│  └─ functions/
│     ├─ _shared.mjs
│     ├─ config.mjs
│     ├─ time.mjs
│     ├─ submit.mjs
│     └─ results.mjs
├─ .env.example
├─ package.json
└─ netlify.toml
```

## 1. GitHub에 업로드

1. GitHub에서 새 저장소를 만듭니다.
2. 이 폴더의 파일 전체를 저장소에 업로드합니다.
3. Netlify에서 `Add new project` → `Import an existing project` → GitHub를 선택합니다.
4. 해당 저장소를 선택하여 배포합니다.
5. 별도 Build command는 필요 없습니다.
6. Publish directory는 `public`이며 `netlify.toml`에 이미 설정되어 있습니다.

## 2. Netlify 환경변수 설정

Netlify 프로젝트의 Environment variables에 아래 값을 등록하세요.

```text
EVENT_TITLE=DC인사이드 갤러리 폼림픽
EVENT_ID=formlympic-20260825
TARGET_TIME=2026-08-25T21:00:00+09:00
CLOSE_AFTER_MS=60000
ADMIN_KEY=길고_추측하기_어려운_관리자_비밀번호
```

설정 후 재배포하세요.

### 각 값의 의미

- `EVENT_TITLE`: 참가 화면에 표시할 제목
- `EVENT_ID`: 이벤트별 데이터 구분값. 다음 이벤트 때 이 값만 새 값으로 바꾸면 됨
- `TARGET_TIME`: 목표시각. 한국시간이면 반드시 `+09:00`을 포함
- `CLOSE_AFTER_MS`: 목표시각부터 몇 ms 동안 접수를 받을지 지정
  - `10000` = 10초
  - `60000` = 60초
- `ADMIN_KEY`: `/admin.html`에서 결과를 확인할 때 입력하는 비밀번호

## 3. 주소

배포 주소가 아래와 같다고 가정하면:

```text
https://example.netlify.app
```

참가자:
```text
https://example.netlify.app/
```

관리자:
```text
https://example.netlify.app/admin.html
```

## 4. 순위 규칙

이 프로젝트는 **목표시간 이후 서버에 도착한 요청만 인정**합니다.

예:

```text
목표: 21:00:00.000

20:59:59.999 서버 도착 → 인정 안 됨
21:00:00.004 서버 도착 → +4ms
21:00:00.021 서버 도착 → +21ms
```

`diffMs`가 작은 사람이 높은 순위입니다.

## 5. 중요한 공정성 참고사항

이 방식의 기록은 **브라우저에서 버튼을 누른 순간이 아니라 Netlify 서버에 요청이 도착한 순간**입니다.
따라서 참가자의 통신사, Wi‑Fi/5G 상태, 물리적 서버 거리 등에 따른 네트워크 지연 차이는 존재합니다.

브라우저 시간을 직접 순위에 사용하면 PC 시각 조작이 가능하기 때문에 이 프로젝트에서는 서버 도착시간을 사용합니다.

상품 가치가 큰 공식 대회처럼 매우 높은 수준의 공정성이 필요한 경우에는 단순 서버리스 폼보다 별도 실시간 서버/웹소켓/부정행위 방지 설계가 더 적합합니다.

## 6. 한국 참가자 중심일 때

Netlify Functions의 기본 실행 지역은 계정/프로젝트 설정에 따라 해외일 수 있습니다.
지원되는 요금제라면 Functions region을 한국과 가까운 **Tokyo (`nrt`)**로 설정하면 왕복 지연을 줄이는 데 도움이 됩니다.

Netlify:
`Project configuration → Build & deploy → Continuous deployment → Functions region`

지역 변경 후 재배포가 필요합니다.

## 7. 테스트 방법

실제 이벤트 전에 테스트용으로 목표시간을 5~10분 뒤로 잡아 다음 항목을 확인하세요.

- 목표시간 전에 서버가 제출을 거부하는지
- 목표시간 이후 제출되는지
- 동일 식별값으로 두 번 제출하면 두 번째가 차단되는지
- `/admin.html`에서 순위가 제대로 표시되는지
- CSV가 정상 다운로드되는지

테스트가 끝난 뒤 실제 `TARGET_TIME`과 새로운 `EVENT_ID`로 변경하고 다시 배포하세요.


## 참가 화면 순위 표시

현재 버전은 참가 화면 하단에 전체 순위를 공개합니다.

표시 항목:
- 순위
- 닉네임
- 목표 시각 대비 기록(ms)

식별값(UID)은 공개 순위 API에서 제외되며 관리자 페이지에서만 확인할 수 있습니다.
순위는 약 2초 간격으로 자동 갱신됩니다.


## 관리자 화면에서 목표시간 변경

`/admin.html`에서 `ADMIN_KEY`로 로그인하면 아래 항목을 직접 바꿀 수 있습니다.

- 목표 날짜 / 시간
- 00초 이후 접수 유지시간

저장값은 Netlify Blobs에 저장되며 재배포가 필요 없습니다.
참가자 화면은 약 5초마다 설정을 다시 확인하여 변경된 시간을 반영합니다.
`기본시간 복원`을 누르면 Netlify 환경변수 `TARGET_TIME`, `CLOSE_AFTER_MS`를 다시 사용합니다.

※ 기존 참가 기록은 자동 삭제되지 않습니다. 새로운 이벤트를 완전히 분리하려면 `EVENT_ID`도 새 값으로 변경하세요.
