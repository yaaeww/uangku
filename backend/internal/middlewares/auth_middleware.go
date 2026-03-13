package middlewares

import (
	"fmt"
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"
	"log"
	"net/http"
	"strings"
	"time"

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

// TenantMiddleware ensures the user belongs to a family and trial/subscription is active
func TenantMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		val, exists := c.Get("family_id")
		familyIDStr := fmt.Sprintf("%v", val)
		
		if !exists || familyIDStr == "" || familyIDStr == "<nil>" {
			log.Printf("[WARN] TenantMiddleware: family_id missing for user role=%v", c.GetString("role"))
			c.JSON(http.StatusForbidden, gin.H{"error": "Tenant context (family_id) missing. Access denied."})
			c.Abort()
			return
		}

		// SUPER ADMIN BYPASS
		if c.GetString("role") == "super_admin" {
			c.Next()
			return
		}

		// Check Family Subscription/Trial Status
		var family models.Family
		if err := config.DB.First(&family, "id = ?", familyIDStr).Error; err != nil {
			log.Printf("[ERROR] TenantMiddleware: family not found ID=%s", familyIDStr)
			c.JSON(http.StatusForbidden, gin.H{"error": "Keluarga tidak ditemukan. Akses ditolak."})
			c.Abort()
			return
		}

		// If explicitly expired
		if family.Status == "expired" {
			log.Printf("[INFO] TenantMiddleware: Blocked EXPIRED family ID=%s", familyIDStr)
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Masa trial/berlangganan Anda telah habis.",
				"code":  "TRIAL_EXPIRED",
			})
			c.Abort()
			return
		}

		// Handle Legacy Accounts (Status 'trial' but TrialEndsAt is zero)
		effectiveTrialEnd := family.TrialEndsAt
		if family.Status == "trial" && effectiveTrialEnd.IsZero() {
			// Default to 7 days after creation for legacy compatibility
			effectiveTrialEnd = family.CreatedAt.AddDate(0, 0, 7)
			
			// Persist to DB so frontend gets the correct date
			config.DB.Model(&family).Update("trial_ends_at", effectiveTrialEnd)
		}

		// Check Expiration
		if family.Status == "trial" && !effectiveTrialEnd.IsZero() && effectiveTrialEnd.Before(time.Now()) {
			log.Printf("[INFO] TenantMiddleware: Blocked TRIAL ENDED family ID=%s (EndAt=%v)", familyIDStr, effectiveTrialEnd)
			
			// Update status to expired if not already set correctly in DB
			config.DB.Model(&family).Update("status", "expired")
			
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Masa trial Anda telah habis.",
				"code":  "TRIAL_EXPIRED",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
