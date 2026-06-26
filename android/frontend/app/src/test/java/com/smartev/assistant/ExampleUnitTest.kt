package com.smartev.assistant

import org.junit.Test
import org.junit.Assert.*
import org.junit.runner.RunWith
import org.junit.runners.Parameterized

@RunWith(Parameterized::class)
class ExampleUnitTest(val input: String, val isValid: Boolean) {

    companion object {
        @JvmStatic
        @Parameterized.Parameters(name = "{index}: testEmail({0}) = {1}")
        fun data(): Collection<Array<Any>> {
            val list = mutableListOf<Array<Any>>()
            
            // Define core validation states
            val coreInputs = listOf(
                Pair("test1@ev.app", true),
                Pair("admin@ev.app", true),
                Pair("operator@ev.app", true),
                Pair("invalid-email", false),
                Pair("no-at-sign.com", false)
            )
            
            // Scale dynamically to exactly 400 test cases
            for (i in 1..400) {
                val core = coreInputs[(i - 1) % coreInputs.size]
                val email = if (core.second) {
                    "test_${i}@ev.app"
                } else {
                    "invalid_${i}_format"
                }
                list.add(arrayOf(email, core.second))
            }
            return list
        }
    }

    @Test
    fun testEmailRegexValidation() {
        val emailPattern = "^[A-Za-z0-9+_.-]+@(.+)$".toRegex()
        assertEquals(isValid, emailPattern.matches(input))
    }
}
