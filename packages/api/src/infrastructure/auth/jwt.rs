//! JWT Token Handling
//!
//! Create and validate JWT tokens for authentication.

use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, TokenData, Validation};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// JWT claims
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    /// Subject (user ID)
    pub sub: Uuid,
    /// Organization ID
    pub org: Uuid,
    /// Role name
    pub role: String,
    /// Expiration time (Unix timestamp)
    pub exp: i64,
    /// Issued at (Unix timestamp)
    pub iat: i64,
    /// Token type (access or refresh)
    pub typ: TokenType,
}

/// Token type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TokenType {
    Access,
    Refresh,
}

/// Token pair (access + refresh)
#[derive(Debug, Clone, Serialize)]
pub struct TokenPair {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_in: i64,
}

/// JWT service
pub struct JwtService {
    secret: String,
    access_expiry: i64,
    refresh_expiry: i64,
}

/// JWT error types
#[derive(Debug, thiserror::Error)]
pub enum JwtError {
    #[error("Token creation failed: {0}")]
    Creation(#[from] jsonwebtoken::errors::Error),

    #[error("Token expired")]
    Expired,

    #[error("Invalid token")]
    Invalid,

    #[error("Wrong token type")]
    WrongType,
}

impl JwtService {
    /// Create a new JWT service
    pub fn new(secret: impl Into<String>, access_expiry_secs: u64, refresh_expiry_secs: u64) -> Self {
        Self {
            secret: secret.into(),
            access_expiry: access_expiry_secs as i64,
            refresh_expiry: refresh_expiry_secs as i64,
        }
    }

    /// Create a token pair for a user
    pub fn create_tokens(
        &self,
        user_id: Uuid,
        org_id: Uuid,
        role: &str,
    ) -> Result<TokenPair, JwtError> {
        let now = Utc::now();

        // Access token
        let access_claims = Claims {
            sub: user_id,
            org: org_id,
            role: role.to_string(),
            exp: (now + Duration::seconds(self.access_expiry)).timestamp(),
            iat: now.timestamp(),
            typ: TokenType::Access,
        };

        let access_token = encode(
            &Header::default(),
            &access_claims,
            &EncodingKey::from_secret(self.secret.as_bytes()),
        )?;

        // Refresh token
        let refresh_claims = Claims {
            sub: user_id,
            org: org_id,
            role: role.to_string(),
            exp: (now + Duration::seconds(self.refresh_expiry)).timestamp(),
            iat: now.timestamp(),
            typ: TokenType::Refresh,
        };

        let refresh_token = encode(
            &Header::default(),
            &refresh_claims,
            &EncodingKey::from_secret(self.secret.as_bytes()),
        )?;

        Ok(TokenPair {
            access_token,
            refresh_token,
            expires_in: self.access_expiry,
        })
    }

    /// Validate and decode a token
    pub fn validate_token(&self, token: &str) -> Result<Claims, JwtError> {
        let token_data: TokenData<Claims> = decode(
            token,
            &DecodingKey::from_secret(self.secret.as_bytes()),
            &Validation::default(),
        )
        .map_err(|e| match e.kind() {
            jsonwebtoken::errors::ErrorKind::ExpiredSignature => JwtError::Expired,
            _ => JwtError::Invalid,
        })?;

        Ok(token_data.claims)
    }

    /// Validate an access token specifically
    pub fn validate_access_token(&self, token: &str) -> Result<Claims, JwtError> {
        let claims = self.validate_token(token)?;
        if claims.typ != TokenType::Access {
            return Err(JwtError::WrongType);
        }
        Ok(claims)
    }

    /// Validate a refresh token specifically
    pub fn validate_refresh_token(&self, token: &str) -> Result<Claims, JwtError> {
        let claims = self.validate_token(token)?;
        if claims.typ != TokenType::Refresh {
            return Err(JwtError::WrongType);
        }
        Ok(claims)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_token_creation() {
        let service = JwtService::new("test-secret", 900, 604800);
        let user_id = Uuid::new_v4();
        let org_id = Uuid::new_v4();

        let tokens = service.create_tokens(user_id, org_id, "admin").unwrap();

        assert!(!tokens.access_token.is_empty());
        assert!(!tokens.refresh_token.is_empty());
        assert_eq!(tokens.expires_in, 900);
    }

    #[test]
    fn test_token_validation() {
        let service = JwtService::new("test-secret", 900, 604800);
        let user_id = Uuid::new_v4();
        let org_id = Uuid::new_v4();

        let tokens = service.create_tokens(user_id, org_id, "admin").unwrap();
        let claims = service.validate_access_token(&tokens.access_token).unwrap();

        assert_eq!(claims.sub, user_id);
        assert_eq!(claims.org, org_id);
        assert_eq!(claims.role, "admin");
    }
}
