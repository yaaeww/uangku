package middlewares

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists || role != "super_admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied: super admin role required"})
			c.Abort()
			return
		}
		c.Next()
	}
}
