# 영화 티켓 예매 서비스
서울과학기술대학교 산업정보시스템전공 웹 프로그래밍 팀 프로젝트

### 팀원
- 산업정보시스템전공 이혜린
- 산업정보시스템전공 김민준
- 산업정보시스템전공 김경모


### 기본 시나리오
- 1개 이상의 조회
  예매 내역, 리뷰 목록 조회
- 2개 이상의 필터/검색
  영화 감독/제목/배우 검색
- 1개 이상의 추가/등록
  영화 예매, 리뷰 등록
- 1개 이상의 삭제
  예매 내역, 영화 리뷰 삭
  
### 연계 시나리오
- 수정 (조회 + 추가)
  리뷰 수정
- 일괄 삭제
  예매 내역 전체 취소

### 응용 시나리오
- 사용자 파일 업로드
  영화 리뷰 등록 시 사진 업로드 기능
- 외부 openAPI
  KOPIS 영화관 입장권 통합 전산망 일별 박스오피스 API
  카카오맵 지도 API
- 외부 npm 모듈
  multer
  
### 서비스 재시작 시나리오
- 회원가입 및 로그인
  신규 회원가입
  중복 메일 회원가입 불가
  ID/PW 틀릴 시 로그인 불가
- 사용자 정보 유지
  서버 재시작 시 이전 정보 유지
