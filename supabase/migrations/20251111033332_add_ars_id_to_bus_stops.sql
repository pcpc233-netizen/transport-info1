/*
  # 버스 정류장에 ARS ID 추가

  1. Changes
    - `bus_stops` 테이블에 `ars_id` 컬럼 추가
    - 서울시 버스 API에서 사용하는 고유번호 (정류장 번호판에 표시된 5자리 숫자)
*/

ALTER TABLE bus_stops ADD COLUMN IF NOT EXISTS ars_id text;
CREATE INDEX IF NOT EXISTS idx_bus_stops_ars_id ON bus_stops(ars_id);
