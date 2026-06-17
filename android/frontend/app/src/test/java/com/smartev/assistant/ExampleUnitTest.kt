package com.smartev.assistant

import org.junit.Test
import org.junit.Assert.*

class ExampleUnitTest {

    @Test
    fun testEmailRegexValidation() {
        val emailPattern = "^[A-Za-z0-9+_.-]+@(.+)$".toRegex()
        assertTrue(emailPattern.matches("test1@ev.app"))
        assertTrue(emailPattern.matches("admin@ev.app"))
        assertFalse(emailPattern.matches("invalid-email-format"))
    }
}
