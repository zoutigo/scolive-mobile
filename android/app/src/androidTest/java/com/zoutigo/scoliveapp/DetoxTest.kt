package com.zoutigo.scoliveapp

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.filters.LargeTest
import androidx.test.rule.ActivityTestRule
import com.wix.detox.Detox
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Point d'entrée Detox pour Android.
 * Compilé dans l'APK d'instrumentation (assembleAndroidTest).
 * Ne pas modifier manuellement.
 */
@RunWith(AndroidJUnit4::class)
@LargeTest
class DetoxTest {

    @JvmField
    @Rule
    var mActivityRule = ActivityTestRule(MainActivity::class.java, false, false)

    @Test
    fun runDetoxTests() {
        Detox.runTests(mActivityRule)
    }
}
