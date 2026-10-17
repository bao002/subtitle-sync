plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

val webAssetsIndex = file("src/main/assets/index.html")
val prepareWebAssets by tasks.registering(Exec::class) {
    description = "Build and bundle the current web app before assembling Android."
    group = "build"
    workingDir(rootProject.projectDir.parentFile)
    commandLine("npm", "run", "build:android-assets")
}

tasks.named("preBuild") {
    dependsOn(prepareWebAssets)
}

android {
    namespace = "com.ytviewer.app"
    compileSdk = 34

    val packageJsonFile = file("../../package.json")
    val packageJsonVersion = if (packageJsonFile.exists()) {
        val match = Regex("\"version\":\\s*\"([^\"]+)\"").find(packageJsonFile.readText())
        match?.groupValues?.get(1) ?: "1.0.39"
    } else {
        "1.0.39"
    }
    val defaultDerivedCode = try {
        val parts = packageJsonVersion.split(".").map { it.toIntOrNull() ?: 0 }
        (parts.getOrElse(0) { 1 } * 10000) + (parts.getOrElse(1) { 0 } * 100) + parts.getOrElse(2) { 0 }
    } catch (_: Exception) {
        10039
    }

    defaultConfig {
        applicationId = "com.ytviewer.app"
        minSdk = 26
        targetSdk = 34
        versionCode = 10039
        versionName = "1.0.39"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }


    signingConfigs {
        named("debug") {
            // Standard debug signing config for development & self-contained releases
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("debug")
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.11.0")
    implementation("androidx.webkit:webkit:1.10.0")

    // MediaSession and background playback notification
    implementation("androidx.media:media:1.7.0")

    // OkHttp for fetching & intercepting requests directly
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
}
