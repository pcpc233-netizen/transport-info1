/*
  # 비밀번호 복구 시스템 생성

  1. New Tables
    - `admin_recovery_codes`
      - `id` (uuid, primary key)
      - `admin_id` (uuid, foreign key) - 관리자 ID
      - `recovery_code` (text, unique) - 6자리 복구 코드
      - `email` (text) - 복구 코드 전송 이메일
      - `is_used` (boolean) - 사용 여부
      - `expires_at` (timestamptz) - 만료 시간 (10분)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - No direct access (only through Edge Functions)
    - Auto-expire after 10 minutes
    - One-time use only

  3. 복구 흐름
    - 관리자가 복구 요청 → 이메일로 6자리 코드 전송
    - 코드 입력 → 새 비밀번호 설정
    - 코드는 10분 후 자동 만료
*/

-- Create admin_recovery_codes table
CREATE TABLE IF NOT EXISTS admin_recovery_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  recovery_code text UNIQUE NOT NULL,
  email text NOT NULL,
  is_used boolean DEFAULT false,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_recovery_codes ENABLE ROW LEVEL SECURITY;

-- Create restrictive policy
CREATE POLICY "No direct access to recovery codes"
  ON admin_recovery_codes FOR ALL
  USING (false);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_recovery_codes_code ON admin_recovery_codes(recovery_code);
CREATE INDEX IF NOT EXISTS idx_recovery_codes_email ON admin_recovery_codes(email);
CREATE INDEX IF NOT EXISTS idx_recovery_codes_expires ON admin_recovery_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_recovery_codes_used ON admin_recovery_codes(is_used);
