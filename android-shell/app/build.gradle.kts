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

    defaultConfig {
        applicationId = "com.ytviewer.app"
        minSdk = 26
        targetSdk = 34
        versionCode = (project.findProperty("appVersionCode") as String?)?.toIntOrNull() ?: 1
        versionName = (project.findProperty("appVersionName") as String?) ?: "1.0"

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

    // OkHttp for fetching & intercepting requests directly
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
}
