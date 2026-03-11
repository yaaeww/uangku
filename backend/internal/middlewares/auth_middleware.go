package middlewares

import (
	"keuangan-keluarga/internal/config"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// AuthMiddleware verifies the JWT token and injects user info into context
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required"})
			c.Abort()
			return
		}

		tokenString := strings.Replace(authHeader, "Bearer ", "", 1)
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return []byte(config.AppConfig.JWTSecret), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}

		// Inject user info into context
		c.Set("user_id", claims["user_id"])
		c.Set("role", claims["role"])
		c.Set("family_id", claims["family_id"])

		c.Next()
	}
}

// TenantMiddleware ensures the user belongs to a family
func TenantMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		familyID, exists := c.Get("family_id")
		if !exists || familyID == "" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Tenant context (family_id) missing. Access denied."})
			c.Abort()
			return
		}
		c.Next()
	}
}
