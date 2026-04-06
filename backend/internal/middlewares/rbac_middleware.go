package middlewares

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// RBACReadOnlyMiddleware prevents non-GET requests for users with the 'viewer' role
func RBACReadOnlyMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		role := c.GetString("family_role")
		
		// If the user is a viewer, they can only perform GET requests
		// Exemption: Profile updates (own data)
		isProfileUpdate := c.Request.URL.Path == "/api/v1/finance/profile" || c.Request.URL.Path == "/api/v1/finance/profile/password"
		
		if role == "viewer" && c.Request.Method != http.MethodGet && !isProfileUpdate {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Anda berada dalam mode 'Pantau Only'. Anda tidak diizinkan untuk membuat, mengubah, atau menghapus data keuangan.",
				"code":  "VIEWER_RESTRICTED",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
