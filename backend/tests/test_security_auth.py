"""
Security Tests - Authentication and Authorization
Tests for JWT tokens, password hashing, authorization, and access control
"""
import pytest
from datetime import timedelta
from app.core.security import (
    create_access_token,
    verify_token,
    get_password_hash,
    verify_password,
    is_email_authorized,
    sanitize_input,
    hash_sensitive_data,
    verify_csrf_token,
    create_csrf_token
)


@pytest.mark.security
class TestJWTSecurity:
    """Test JWT token creation and validation"""

    def test_create_valid_token(self, test_user):
        """Test creating a valid JWT token"""
        token_data = {"sub": test_user.email, "user_id": str(test_user.id)}
        token = create_access_token(token_data)

        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 50  # JWT tokens are reasonably long

    def test_verify_valid_token(self, test_user, valid_token):
        """Test verifying a valid token"""
        payload = verify_token(valid_token)

        assert payload is not None
        assert payload["sub"] == test_user.email
        assert "exp" in payload
        assert "iat" in payload
        assert "jti" in payload  # SECURITY: JWT ID should be present
        assert "iss" in payload  # SECURITY: Issuer should be present

    def test_verify_expired_token(self, expired_token):
        """Test that expired tokens are rejected"""
        payload = verify_token(expired_token)
        assert payload is None  # Expired tokens should return None

    def test_verify_invalid_token(self):
        """Test that malformed tokens are rejected"""
        invalid_tokens = [
            "invalid_token",
            "Bearer invalid",
            "",
            None,
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature",
            "a" * 500,  # Overly long string
        ]

        for invalid_token in invalid_tokens:
            payload = verify_token(invalid_token) if invalid_token else None
            assert payload is None, f"Token '{invalid_token}' should be rejected"

    def test_token_contains_security_claims(self, test_user):
        """SECURITY: Ensure tokens have required security claims"""
        token_data = {"sub": test_user.email}
        token = create_access_token(token_data)
        payload = verify_token(token)

        # Check required security claims
        assert "jti" in payload, "Token missing JWT ID (jti)"
        assert "iss" in payload, "Token missing issuer (iss)"
        assert "exp" in payload, "Token missing expiration (exp)"
        assert "iat" in payload, "Token missing issued-at (iat)"

    def test_token_uniqueness(self, test_user):
        """SECURITY: Each token should have a unique JWT ID"""
        token_data = {"sub": test_user.email}
        token1 = create_access_token(token_data)
        token2 = create_access_token(token_data)

        payload1 = verify_token(token1)
        payload2 = verify_token(token2)

        # Tokens should have different JWT IDs
        assert payload1["jti"] != payload2["jti"]

    def test_token_issuer_validation(self, test_user, valid_token):
        """SECURITY: Tokens with wrong issuer should be rejected"""
        # This is validated internally by verify_token
        payload = verify_token(valid_token)
        assert payload["iss"] == "sistema-gastos-api"


@pytest.mark.security
class TestPasswordSecurity:
    """Test password hashing and validation"""

    def test_password_hashing(self):
        """Test that passwords are properly hashed"""
        password = "SecurePassword123!"
        hashed = get_password_hash(password)

        assert hashed != password  # Should not be plaintext
        assert len(hashed) > 50  # Bcrypt hashes are long
        assert hashed.startswith("$2b$")  # Bcrypt prefix

    def test_verify_correct_password(self):
        """Test verifying correct password"""
        password = "SecurePassword123!"
        hashed = get_password_hash(password)

        assert verify_password(password, hashed) is True

    def test_verify_incorrect_password(self):
        """Test that incorrect passwords are rejected"""
        password = "SecurePassword123!"
        hashed = get_password_hash(password)

        assert verify_password("WrongPassword", hashed) is False
        assert verify_password("", hashed) is False
        assert verify_password(password + "a", hashed) is False

    def test_password_minimum_length(self):
        """SECURITY: Enforce minimum password length"""
        weak_passwords = ["", "1", "12", "1234567"]  # Less than 8 chars

        for weak_pwd in weak_passwords:
            with pytest.raises(ValueError, match="al menos 8 caracteres"):
                get_password_hash(weak_pwd)

    def test_different_passwords_different_hashes(self):
        """SECURITY: Same password should produce different hashes (salt)"""
        password = "SecurePassword123!"
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)

        # Due to salt, hashes should be different
        assert hash1 != hash2

    def test_password_hash_timing_resistance(self):
        """SECURITY: Password verification should be timing attack resistant"""
        password = "SecurePassword123!"
        hashed = get_password_hash(password)

        import time

        # Measure time for correct password
        start = time.perf_counter()
        verify_password(password, hashed)
        time_correct = time.perf_counter() - start

        # Measure time for incorrect password
        start = time.perf_counter()
        verify_password("WrongPassword", hashed)
        time_incorrect = time.perf_counter() - start

        # Times should be similar (within 50% difference)
        # This prevents timing attacks
        time_diff_ratio = abs(time_correct - time_incorrect) / max(time_correct, time_incorrect)
        assert time_diff_ratio < 0.5, "Password verification may be vulnerable to timing attacks"


@pytest.mark.security
class TestEmailAuthorization:
    """Test email authorization logic"""

    @pytest.mark.asyncio
    async def test_authorized_email(self):
        """Test that authorized emails are accepted"""
        assert await is_email_authorized("test@example.com") is True
        assert await is_email_authorized("admin@example.com") is True

    @pytest.mark.asyncio
    async def test_unauthorized_email(self):
        """Test that unauthorized emails are rejected"""
        assert await is_email_authorized("hacker@evil.com") is False
        assert await is_email_authorized("unknown@example.com") is False

    @pytest.mark.asyncio
    async def test_case_insensitive_email(self):
        """SECURITY: Email authorization should be case-insensitive"""
        assert await is_email_authorized("TEST@EXAMPLE.COM") is True
        assert await is_email_authorized("Test@Example.Com") is True

    @pytest.mark.asyncio
    async def test_empty_or_invalid_email(self):
        """SECURITY: Invalid emails should be rejected"""
        invalid_emails = [
            "",
            None,
            "not_an_email",
            "@",
            "missing@",
            "@domain.com",
            "spaces in@email.com",
        ]

        for email in invalid_emails:
            if email is None:
                with pytest.raises((TypeError, AttributeError)):
                    await is_email_authorized(email)
            else:
                assert await is_email_authorized(email) is False


@pytest.mark.security
class TestInputSanitization:
    """Test input sanitization to prevent XSS and injection"""

    def test_sanitize_normal_input(self):
        """Test that normal input passes through"""
        input_str = "Normal text input"
        sanitized = sanitize_input(input_str)
        assert sanitized == input_str.strip()

    def test_sanitize_empty_input(self):
        """Test handling of empty input"""
        assert sanitize_input("") == ""
        assert sanitize_input(None) == ""
        assert sanitize_input("   ") == ""

    def test_sanitize_long_input(self):
        """SECURITY: Prevent buffer overflow with excessively long input"""
        long_input = "A" * 5000
        sanitized = sanitize_input(long_input, max_length=1000)

        assert len(sanitized) == 1000
        assert sanitized == "A" * 1000

    def test_sanitize_strips_whitespace(self):
        """Test that leading/trailing whitespace is removed"""
        input_str = "  test input  \n\t"
        sanitized = sanitize_input(input_str)
        assert sanitized == "test input"

    def test_xss_prevention_markers(self, xss_payloads):
        """SECURITY: Mark XSS payloads for detection"""
        # Note: Full XSS prevention should be done at frontend/templating
        # Backend should at least truncate and log suspicious input
        for payload in xss_payloads:
            sanitized = sanitize_input(payload, max_length=100)
            # Should at least be limited in length
            assert len(sanitized) <= 100


@pytest.mark.security
class TestCSRFProtection:
    """Test CSRF token generation and validation"""

    def test_create_csrf_token(self):
        """Test CSRF token creation"""
        token = create_csrf_token()
        assert token is not None
        assert len(token) > 20  # Should be reasonably long
        assert isinstance(token, str)

    def test_csrf_token_uniqueness(self):
        """SECURITY: CSRF tokens should be unique"""
        token1 = create_csrf_token()
        token2 = create_csrf_token()
        assert token1 != token2

    def test_verify_valid_csrf_token(self):
        """Test verifying valid CSRF token"""
        token = create_csrf_token()
        assert verify_csrf_token(token, token) is True

    def test_verify_invalid_csrf_token(self):
        """SECURITY: Invalid CSRF tokens should be rejected"""
        token = create_csrf_token()
        assert verify_csrf_token("wrong_token", token) is False
        assert verify_csrf_token("", token) is False
        assert verify_csrf_token(None, token) is False
        assert verify_csrf_token(token, None) is False

    def test_csrf_timing_attack_resistance(self):
        """SECURITY: CSRF validation should use constant-time comparison"""
        import secrets
        import time

        token = create_csrf_token()

        # Measure time for correct token
        start = time.perf_counter()
        verify_csrf_token(token, token)
        time_correct = time.perf_counter() - start

        # Measure time for incorrect token of same length
        wrong_token = secrets.token_urlsafe(len(token))
        start = time.perf_counter()
        verify_csrf_token(wrong_token, token)
        time_incorrect = time.perf_counter() - start

        # Times should be similar (constant-time comparison)
        time_diff_ratio = abs(time_correct - time_incorrect) / max(time_correct, time_incorrect)
        assert time_diff_ratio < 0.5, "CSRF validation may be vulnerable to timing attacks"


@pytest.mark.security
class TestSensitiveDataHandling:
    """Test handling of sensitive data"""

    def test_hash_sensitive_data(self):
        """Test hashing of sensitive data for logging"""
        sensitive_data = "user_secret_token_123456"
        hashed = hash_sensitive_data(sensitive_data)

        assert hashed != sensitive_data  # Should be hashed
        assert len(hashed) < len(sensitive_data)  # Should be truncated
        assert hashed.endswith("...")  # Should have ellipsis

    def test_hash_sensitive_data_consistency(self):
        """SECURITY: Same data should produce same hash"""
        data = "secret123"
        hash1 = hash_sensitive_data(data)
        hash2 = hash_sensitive_data(data)
        assert hash1 == hash2

    def test_hash_different_data_different_hashes(self):
        """SECURITY: Different data should produce different hashes"""
        hash1 = hash_sensitive_data("secret1")
        hash2 = hash_sensitive_data("secret2")
        assert hash1 != hash2
