# This script is called by Vercel to determine if the build should be skipped.
# We configure this script to be called in the Vercel project settings.

# It is used to skip the build for Dependabot PRs.

if [ "$VERCEL_GIT_COMMIT_AUTHOR_LOGIN" == "dependabot[bot]" ]; then
    echo "🛑 - Build cancelled for Dependabot PR"
    exit 0; # Exit with 0 to skip the build
else
    echo "✅ - Build can proceed"
    exit 1; # Exit with 1 to trigger the build
fi

# Fake comment to trigger a build.
